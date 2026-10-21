/* ==========================================================================
   CIRCULAR GALLERY — vanilla port
   --------------------------------------------------------------------------
   A WebGL2 arc of cards. Vanilla JS, no framework, no build step.

   The component was originally written in React; this is a straight port of
   the same engine — the GLSL shaders, the arc maths, the scroll physics and
   the interaction model are unchanged. React's hooks became locals, JSX became
   DOM construction.

   Usage:
     const gallery = createCircularGallery(document.getElementById('host'), {
       items: [{ image: 'photo.jpg', text: 'A title', description: '…', aspect: 0.75 }],
       bend: 3,
       onItemClick: (item, index) => {}
     });
     gallery.open(2);
     gallery.destroy();

   Item fields:
     image        required, url of the card artwork
     text         optional caption drawn under the card
     description  optional short line; its presence reserves caption space
     aspect       optional width/height for this card (defaults to itemAspect)
   ========================================================================== */

(function (global) {
  'use strict';

  const DEFAULT_FONT = 'bold 30px Figtree';
  const SEGMENTS_X = 32;
  const SEGMENTS_Y = 24;
  const INTRO_SECONDS = 1.4;
  const WORLD_HEIGHT = 16.57;

  const CLASSES = {
    root: 'circular-gallery',
    canvas: 'circular-gallery-canvas',
    labels: 'circular-gallery-labels',
    label: 'circular-gallery-label',
    caption: 'circular-gallery-caption',
    captionText: 'circular-gallery-caption-text',
    close: 'circular-gallery-close',
    hidden: 'circular-gallery-hidden'
  };

  const STEPS = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

  /* ───────────────────────────────────────────────────────────── shaders ── */

  const VERTEX = `#version 300 es
in vec2 aPosition;
uniform vec2 uResolution;
uniform vec2 uCenter;
uniform vec2 uSize;
uniform float uAngle;
uniform float uPad;
uniform float uWave;
uniform float uWaveTime;
uniform float uFocal;
out vec2 vLocal;
void main() {
  vec2 local = aPosition * (uSize + 2.0 * uPad);
  vec2 unit = local / max(uSize, vec2(1.0));
  float z = uWave * (sin(unit.x * 4.0 + uWaveTime) + cos(unit.y * 2.0 + uWaveTime)) * 0.5;
  float depth = uFocal / max(uFocal - z, 1.0);
  float c = cos(uAngle);
  float s = sin(uAngle);
  vec2 turned = vec2(c * local.x - s * local.y, s * local.x + c * local.y);
  vLocal = local;
  gl_Position = vec4((uCenter + turned * depth) / (uResolution * 0.5), 0.0, 1.0);
}`;

  const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec2 uSize;
uniform float uRadius;
uniform float uImageAspect;
uniform float uReady;
uniform vec3 uPlaceholder;
uniform float uGray;
uniform float uDim;
uniform float uAlpha;
uniform float uRing;
uniform vec3 uRingColor;
uniform float uRingWidth;
uniform float uRingGap;
uniform float uFade;
uniform float uShadow;
uniform float uBlur;
uniform vec2 uShadowOffset;
in vec2 vLocal;
out vec4 outColor;

float roundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float smoother(float x) {
  x = clamp(x, 0.0, 1.0);
  return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

float edgeFade() {
  if (uFade <= 0.0) return 1.0;
  float u = gl_FragCoord.x / uResolution.x;
  return smoother(u / uFade) * smoother((1.0 - u) / uFade);
}

void main() {
  vec2 extent = uSize * 0.5;
  if (uShadow > 0.0) {
    float d = roundBox(vLocal - uShadowOffset, extent, uRadius);
    float a = uShadow * (1.0 - smoothstep(-uBlur, uBlur, d)) * uAlpha * edgeFade();
    outColor = vec4(0.0, 0.0, 0.0, a);
    return;
  }
  float d = roundBox(vLocal, extent, uRadius);
  float pixel = max(length(vec2(dFdx(d), dFdy(d))), 1e-4);
  float cover = clamp(0.5 - d / pixel, 0.0, 1.0);
  vec2 uv = vLocal / uSize + 0.5;
  float aspect = uSize.x / uSize.y;
  vec2 crop = aspect > uImageAspect ? vec2(1.0, uImageAspect / aspect) : vec2(aspect / uImageAspect, 1.0);
  vec3 image = texture(uTexture, (uv - 0.5) * crop + 0.5).rgb;
  vec3 color = mix(uPlaceholder, image, uReady);
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(color, vec3(luma), uGray) * (1.0 - uDim);
  float body = cover * mix(0.08, 1.0, uReady);
  float band = abs(d - uRingGap - uRingWidth * 0.5) - uRingWidth * 0.5;
  float ring = clamp(0.5 - band / pixel, 0.0, 1.0) * uRing;
  vec4 card = vec4(color * body, body);
  vec4 outline = vec4(uRingColor * ring, ring);
  outColor = (card + outline * (1.0 - card.a)) * uAlpha * edgeFade();
}`;

  /* ───────────────────────────────────────────────────────────── helpers ── */

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = (value) => value * value * (3 - 2 * value);
  const wrap = (value, length) => ((value % length) + length) % length;

  const fontScale = (font) => {
    const match = String(font).match(/(\d+(?:\.\d+)?)px/);
    return match ? parseFloat(match[1]) / 30 : 1;
  };

  const compile = (gl, type, source) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    gl.deleteShader(shader);
    return null;
  };

  const link = (gl) => {
    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return null;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.bindAttribLocation(program, 0, 'aPosition');
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return null;
    }
    const uniforms = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const info = gl.getActiveUniform(program, i);
      if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }
    return { program, uniforms };
  };

  /* Does this browser have WebGL2? */
  function supportsWebGL2() {
    try {
      const canvas = document.createElement('canvas');
      return !!canvas.getContext('webgl2');
    } catch (e) {
      return false;
    }
  }

  /* ─────────────────────────────────────────────────────────────── engine ── */

  function createCircularGallery(mount, options) {
    const opts = options || {};

    const settings = {
      items: Array.isArray(opts.items) && opts.items.length ? opts.items : [],
      bend: opts.bend !== undefined ? opts.bend : 3,
      textColor: opts.textColor || '#ffffff',
      borderRadius: clamp(opts.borderRadius !== undefined ? opts.borderRadius : 0.05, 0, 0.5),
      font: opts.font || DEFAULT_FONT,
      scrollSpeed: Math.max(0, opts.scrollSpeed !== undefined ? opts.scrollSpeed : 2),
      scrollEase: clamp(opts.scrollEase !== undefined ? opts.scrollEase : 0.05, 0.001, 1),
      itemSize: clamp(opts.itemSize !== undefined ? opts.itemSize : 1, 0.2, 2),
      itemAspect: clamp(opts.itemAspect !== undefined ? opts.itemAspect : 0.78, 0.2, 5),
      gap: Math.max(0, opts.gap !== undefined ? opts.gap : 0.26),
      wave: Math.max(0, opts.wave !== undefined ? opts.wave : 1),
      fadeEdges: clamp(opts.fadeEdges !== undefined ? opts.fadeEdges : 0.12, 0, 0.5),
      shadow: clamp(opts.shadow !== undefined ? opts.shadow : 0.25, 0, 1),
      grayscale: !!opts.grayscale,
      showTitles: opts.showTitles !== undefined ? opts.showTitles : true,
      snap: opts.snap !== undefined ? opts.snap : true,
      autoScroll: opts.autoScroll || 0,
      openOnClick: opts.openOnClick !== undefined ? opts.openOnClick : true,
      intro: opts.intro !== undefined ? opts.intro : true,
      captionSpace: opts.captionSpace !== undefined ? opts.captionSpace : 52,
      decorate: typeof opts.decorate === 'function' ? opts.decorate : null,
      onItemClick: typeof opts.onItemClick === 'function' ? opts.onItemClick : null,
      onActiveChange: typeof opts.onActiveChange === 'function' ? opts.onActiveChange : null,
      onOpenChange: typeof opts.onOpenChange === 'function' ? opts.onOpenChange : null,
      dpr: opts.dpr
    };

    /* ── DOM ── */
    const root = document.createElement('div');
    root.className = CLASSES.root;
    root.setAttribute('role', 'region');
    root.setAttribute('aria-roledescription', 'carousel');
    root.setAttribute('aria-label', opts.label || 'Image gallery');
    if (opts.style) root.setAttribute('style', opts.style);

    const canvas = document.createElement('canvas');
    canvas.className = CLASSES.canvas;
    canvas.setAttribute('aria-hidden', 'true');

    const labelLayer = document.createElement('div');
    labelLayer.className = CLASSES.labels;
    labelLayer.setAttribute('aria-hidden', 'true');

    const caption = document.createElement('div');
    caption.className = CLASSES.caption;
    caption.setAttribute('aria-hidden', 'true');

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = CLASSES.close;
    closeBtn.setAttribute('data-gallery-close', '');
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">' +
      '<path d="M4 4l10 10M14 4L4 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

    const list = document.createElement('ul');
    list.className = CLASSES.hidden;
    list.setAttribute('data-gallery-list', '');

    const live = document.createElement('div');
    live.className = CLASSES.hidden;
    live.setAttribute('aria-live', 'polite');

    root.appendChild(canvas);
    root.appendChild(labelLayer);
    root.appendChild(caption);
    root.appendChild(closeBtn);
    root.appendChild(list);
    root.appendChild(live);
    mount.appendChild(root);

    /* hidden, focusable list of every item — the accessible way in */
    const buttons = [];
    settings.items.forEach((item, index) => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.tabIndex = index === 0 ? 0 : -1;
      button.setAttribute('aria-label', (item.text || item.alt || 'Image') + ', ' + (index + 1) + ' of ' + settings.items.length);
      button.textContent = item.text || item.alt || 'Image ' + (index + 1);
      button.addEventListener('focus', () => controller.focus(index));
      button.addEventListener('click', () => controller.open(index));
      li.appendChild(button);
      list.appendChild(li);
      buttons.push(button);
    });

    /* ── GL ── */
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false
    });
    if (!gl) {
      mount.removeChild(root);
      return null;
    }

    const program = link(gl);
    if (!program) {
      mount.removeChild(root);
      return null;
    }
    const u = program.uniforms;

    const vertices = [];
    for (let y = 0; y <= SEGMENTS_Y; y++) {
      for (let x = 0; x <= SEGMENTS_X; x++) vertices.push(x / SEGMENTS_X - 0.5, y / SEGMENTS_Y - 0.5);
    }
    const indices = [];
    for (let y = 0; y < SEGMENTS_Y; y++) {
      for (let x = 0; x < SEGMENTS_X; x++) {
        const a = y * (SEGMENTS_X + 1) + x;
        const b = a + 1;
        const c = a + SEGMENTS_X + 1;
        const d = c + 1;
        indices.push(a, b, d, a, d, c);
      }
    }
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    const anisotropy = gl.getExtension('EXT_texture_filter_anisotropic');
    const blank = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, blank);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));

    const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const colorCache = new Map();
    const parse = (value) => {
      const key = String(value);
      if (colorCache.has(key)) return colorCache.get(key);
      let rgb = [1, 1, 1];
      if (probe) {
        probe.clearRect(0, 0, 1, 1);
        probe.fillStyle = '#ffffff';
        probe.fillStyle = key;
        probe.fillRect(0, 0, 1, 1);
        const data = probe.getImageData(0, 0, 1, 1).data;
        rgb = [data[0] / 255, data[1] / 255, data[2] / 255];
      }
      colorCache.set(key, rgb);
      return rgb;
    };

    const reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

    const textures = new Map();
    const view = { width: 1, height: 1, ratio: 1 };
    const state = {
      scroll: 0,
      target: 0,
      velocity: 0,
      open: 0,
      openTarget: 0,
      intro: settings.intro && !reduce ? 0 : 1,
      waveTime: 0,
      ring: 0,
      keyboard: false,
      hovered: null,
      hover: new Map(),
      focus: new Map(),
      drag: null,
      lastInput: 0,
      active: 0,
      spacing: 1
    };

    let cards = [];
    let pool = [];
    let raf = 0;
    let last = 0;
    let visible = true;
    let snapTimer = 0;
    let lastItems = null;
    let typing = false;
    let destroyed = false;

    /* ── textures ── */

    const upload = (source) => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (anisotropy) {
        const max = gl.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
        gl.texParameterf(gl.TEXTURE_2D, anisotropy.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, max));
      }
      return texture;
    };

    const textureFor = (url, item) => {
      const existing = textures.get(url);
      if (existing) return existing;

      const entry = {
        texture: null,
        aspect: (item && item.aspect) || 1,
        ready: 0,
        loaded: false
      };
      textures.set(url, entry);

      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.decoding = 'async';
      image.onload = () => {
        if (destroyed || !textures.has(url)) return;
        let source = image;
        if (settings.decorate) {
          try {
            const decorated = settings.decorate(image, item);
            if (decorated) source = decorated;
          } catch (e) { /* fall back to the raw image */ }
        }
        entry.texture = upload(source);
        entry.aspect = source.naturalWidth ? source.naturalWidth / Math.max(1, source.naturalHeight) : entry.aspect;
        entry.loaded = true;
        wake();
      };
      image.onerror = () => { entry.loaded = true; wake(); };
      image.src = url;
      return entry;
    };

    const prune = (list) => {
      const keep = new Set(list.map((item) => item.image));
      textures.forEach((entry, url) => {
        if (keep.has(url)) return;
        if (entry.texture) gl.deleteTexture(entry.texture);
        textures.delete(url);
      });
    };

    /* ── layout ── */

    /* per-card size — a card may carry its own aspect so nothing is cropped */
    const cardFor = (item) => {
      const h = 0.6 * view.height * settings.itemSize;
      const aspect = (item && item.aspect) || settings.itemAspect;
      const w = h * aspect;
      let scale = Math.min(1, (view.width * 0.82) / w);
      /* a very wide photo must not stretch the gap between every other card */
      const cap = h * 0.95;
      if (w * scale > cap) scale = cap / w;
      return { w: w * scale, h: h * scale };
    };

    const measure = () => {
      let maxW = 0;
      let maxH = 0;
      settings.items.forEach((item) => {
        const c = cardFor(item);
        if (c.w > maxW) maxW = c.w;
        if (c.h > maxH) maxH = c.h;
      });
      if (!maxW) { maxW = 1; maxH = 1; }
      return { w: maxW, h: maxH, spacing: maxW * (1 + settings.gap) };
    };

    const arcOf = (x) => {
      if (!settings.bend) return { y: 0, angle: 0 };
      const depth = (Math.abs(settings.bend) * view.height) / WORLD_HEIGHT;
      const half = Math.max(view.width, view.height * 1.9) / 2;
      const radius = (half * half + depth * depth) / (2 * depth);
      const reach = Math.min(Math.abs(x), half, radius * 0.999);
      const arc = radius - Math.sqrt(radius * radius - reach * reach);
      const angle = Math.sign(x) * Math.asin(reach / radius);
      return settings.bend > 0 ? { y: -arc, angle: -angle } : { y: arc, angle };
    };

    const captionSize = () => clamp(view.height * 0.045, 15, 22);

    const ensurePool = (spacing) => {
      const size = Math.ceil(view.width / Math.max(spacing, 1)) + 8;
      if (pool.length === size) return;
      labelLayer.replaceChildren();
      pool = Array.from({ length: size }, () => {
        const el = document.createElement('span');
        el.className = CLASSES.label;
        el.style.opacity = '0';
        labelLayer.appendChild(el);
        return { el, slot: null, font: '', text: '' };
      });
    };

    const layout = () => {
      const list = settings.items;
      const count = list.length;
      if (!count) return { w: 1, h: 1, spacing: 1, openH: 1, openY: 0, titleSpace: 0 };

      const { w, h, spacing } = measure();
      state.spacing = spacing;
      const introEase = 1 - Math.pow(1 - state.intro, 3);
      const scroll = state.scroll + (1 - introEase) * spacing * 1.6;
      const margin = Math.max(20, Math.min(view.width, view.height) * 0.06);
      const baseLabel = h * 0.072 * fontScale(settings.font);

      const openFrame = (item) => {
        const aspect = textureFor(item.image, item).aspect || cardFor(item).w / cardFor(item).h;
        const titleSpace = item.text && settings.showTitles ? captionSize() * 2.4 : 0;
        /* only the note panel needs room under the focused card — the title
           label is hidden while it is open, so its space is not reserved */
        const captionSpace = item.description ? settings.captionSpace : 0;
        const width = Math.min(view.width - margin * 2, (view.height - margin * 2 - captionSpace) * aspect);
        return { width, height: width / aspect, y: captionSpace / 2, titleSpace };
      };

      const activeFrame = openFrame(list[wrap(state.active, count)]);
      const spread = Math.max(0, activeFrame.width / 2 - cardFor(list[wrap(state.active, count)]).w / 2);
      const activeX = state.active * spacing - scroll;
      const first = Math.floor((scroll - view.width / 2 - spacing * 2) / spacing);
      const lastSlot = Math.ceil((scroll + view.width / 2 + spacing * 2) / spacing);
      const next = [];
      let lead = null;

      for (let slot = first; slot <= lastSlot; slot++) {
        const index = wrap(slot, count);
        const item = list[index];
        const entry = textureFor(item.image, item);
        const focus = ease(state.focus.get(slot) || 0);

        let x = slot * spacing - scroll;
        x += Math.sign(x - activeX) * state.open * (1 - focus) * spread;

        const arc = arcOf(x);
        const base = cardFor(item);
        const of = openFrame(item);
        const fw = mix(base.w, of.width, focus);
        const fh = mix(base.h, of.height, focus);
        const fy = mix(0, of.y, focus);

        const order = Math.abs(slot * spacing - state.scroll) / spacing;
        const shown = ease(clamp(state.intro * 2.2 - order * 0.22, 0, 1));
        const hover = state.hover.get(slot) || 0;
        const lift = 1 + hover * 0.04 * (1 - focus);

        const card = {
          slot,
          index,
          item,
          entry,
          x: mix(x, 0, focus),
          y: mix(arc.y, fy, focus) - (1 - shown) * fh * 0.18,
          angle: arc.angle * (1 - focus),
          w: fw * lift,
          h: fh * lift,
          radius: settings.borderRadius * Math.min(fw, fh),
          alpha: shown * mix(1, 0.18, state.open * (1 - focus)),
          dim: state.open * (1 - focus) * 0.4,
          gray: settings.grayscale ? 1 - Math.max(hover, focus, slot === state.active ? state.ring : 0) : 0,
          focus,
          labelAlpha: mix(1, 1 - state.open, focus),
          labelSize: mix(baseLabel, captionSize(), focus),
          frame: focus > 0 ? of : activeFrame
        };
        if (!lead || focus > lead.focus) lead = card;
        next.push(card);
      }

      next.sort((a, b) => a.focus - b.focus || Math.abs(b.x) - Math.abs(a.x));
      cards = next;
      const frame = lead && lead.focus > 0 ? lead.frame : activeFrame;
      return { w, h, spacing, openH: frame.height, openY: frame.y, titleSpace: frame.titleSpace };
    };

    /* ── draw ── */

    const draw = (metrics) => {
      const ratio = view.ratio;
      const speed = Math.min(Math.abs(state.velocity) / Math.max(metrics.spacing * 4, 1), 1);
      const wavePx = reduce ? 0 : settings.wave * speed * view.height * 0.08 * ratio;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(program.program);
      gl.bindVertexArray(vao);
      gl.uniform2f(u.uResolution, canvas.width, canvas.height);
      gl.uniform1f(u.uFocal, view.height * 1.207 * ratio);
      gl.uniform1f(u.uWaveTime, state.waveTime);
      gl.uniform1f(u.uFade, settings.fadeEdges);
      gl.uniform3fv(u.uPlaceholder, parse(settings.textColor));
      gl.uniform3fv(u.uRingColor, parse(settings.textColor));
      gl.uniform1f(u.uRingWidth, 2 * ratio);
      gl.uniform1f(u.uRingGap, 5 * ratio);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(u.uTexture, 0);

      const count = SEGMENTS_X * SEGMENTS_Y * 6;
      const blur = Math.max(10, metrics.h * 0.09) * ratio;
      const place = (card) => {
        gl.uniform2f(u.uCenter, card.x * ratio, card.y * ratio);
        gl.uniform2f(u.uSize, card.w * ratio, card.h * ratio);
        gl.uniform1f(u.uAngle, card.angle);
        gl.uniform1f(u.uRadius, Math.min(card.radius, card.w / 2, card.h / 2) * ratio);
        gl.uniform1f(u.uWave, wavePx * (1 - card.focus));
        gl.uniform1f(u.uAlpha, card.alpha);
      };

      if (settings.shadow > 0) {
        gl.uniform1f(u.uShadow, settings.shadow);
        gl.uniform1f(u.uBlur, blur);
        gl.uniform2f(u.uShadowOffset, 0, -blur * 0.45);
        gl.uniform1f(u.uPad, blur * 1.6);
        gl.bindTexture(gl.TEXTURE_2D, blank);
        cards.forEach((card) => {
          place(card);
          gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
        });
      }

      gl.uniform1f(u.uShadow, 0);
      gl.uniform1f(u.uPad, 10 * ratio);
      cards.forEach((card) => {
        place(card);
        const entry = card.entry;
        gl.bindTexture(gl.TEXTURE_2D, entry.texture || blank);
        gl.uniform1f(u.uImageAspect, entry.aspect);
        gl.uniform1f(u.uReady, entry.ready);
        gl.uniform1f(u.uGray, card.gray);
        gl.uniform1f(u.uDim, card.dim);
        gl.uniform1f(u.uRing, card.slot === state.active ? state.ring * (1 - card.focus) : 0);
        gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
      });
    };

    const placeLabels = (metrics) => {
      ensurePool(metrics.spacing);
      const used = new Set();
      const font = settings.font;
      const fade = (value) => {
        if (settings.fadeEdges <= 0) return 1;
        const t = clamp(value / settings.fadeEdges, 0, 1);
        return t * t * t * (t * (t * 6 - 15) + 10);
      };

      if (settings.showTitles) {
        cards.forEach((card) => {
          if (!card.item.text) return;
          const entry = pool[wrap(card.slot, pool.length)];
          used.add(entry);
          if (entry.slot !== card.slot || entry.text !== card.item.text) {
            entry.slot = card.slot;
            entry.text = card.item.text;
            entry.el.textContent = card.item.text;
          }
          if (entry.font !== font) {
            entry.font = font;
            entry.el.style.font = font;
          }
          const size = card.labelSize;
          const offset = card.h / 2 + size * 1.1;
          const x = card.x + Math.sin(card.angle) * offset;
          const y = card.y - Math.cos(card.angle) * offset;
          const cssX = view.width / 2 + x;
          const cssY = view.height / 2 - y;
          const edge = fade(cssX / view.width) * fade(1 - cssX / view.width);
          entry.el.style.fontSize = size + 'px';
          entry.el.style.color = settings.textColor;
          entry.el.style.transform = 'translate(' + cssX + 'px, ' + cssY + 'px) translate(-50%, -50%) rotate(' + (-card.angle) + 'rad)';
          entry.el.style.opacity = String(card.alpha * card.labelAlpha * mix(edge, 1, card.focus));
        });
      }

      pool.forEach((entry) => {
        if (used.has(entry)) return;
        if (entry.el.style.opacity !== '0') entry.el.style.opacity = '0';
      });

      const top = view.height / 2 - (metrics.openY - metrics.openH / 2) + 10;
      caption.style.transform = 'translate(-50%, ' + top + 'px)';
      caption.style.opacity = String(ease(clamp((state.open - 0.5) / 0.5, 0, 1)));
      caption.style.color = settings.textColor;
      if (caption.dataset.font !== font) {
        caption.dataset.font = font;
        caption.style.font = font;
        caption.style.fontWeight = '400';
      }
      caption.style.fontSize = captionSize() * 0.8 + 'px';
    };

    /* ── selection ── */

    const nearest = () => Math.round(state.target / Math.max(state.spacing, 1));

    const notifyOpen = (isOpen) => {
      if (!settings.onOpenChange) return;
      settings.onOpenChange(isOpen, wrap(state.active, settings.items.length));
    };

    const setSlot = (slot) => {
      state.target = slot * state.spacing;
      if (slot !== state.active) {
        state.active = slot;
        const index = wrap(slot, settings.items.length);
        buttons.forEach((b, i) => { b.tabIndex = i === index ? 0 : -1; });
        if (settings.onActiveChange) settings.onActiveChange(index);
      }
      wake();
    };

    const openSlot = (slot) => {
      setSlot(slot);
      state.openTarget = 1;
      closeBtn.setAttribute('data-visible', '');
      caption.setAttribute('aria-hidden', 'false');
      notifyOpen(true);
      wake();
    };

    const close = () => {
      state.openTarget = 0;
      closeBtn.removeAttribute('data-visible');
      caption.setAttribute('aria-hidden', 'true');
      notifyOpen(false);
      wake();
    };

    /* ── frame ── */

    const frame = (now) => {
      raf = 0;
      if (!visible || document.hidden || destroyed) return;
      const dt = last ? clamp((now - last) / 1000, 0.0005, 0.05) : 1 / 60;
      last = now;

      if (settings.items !== lastItems) {
        lastItems = settings.items;
        prune(settings.items);
        settings.items.forEach((item) => textureFor(item.image, item));
      }

      const idle = now - state.lastInput > 1800;
      const auto = settings.autoScroll && !reduce && !state.drag && state.open < 0.01 &&
        state.hovered === null && !state.keyboard && idle;
      if (auto) state.target += settings.autoScroll * state.spacing * 0.25 * dt;

      const follow = reduce ? 1 : 1 - Math.pow(1 - settings.scrollEase, dt * 60);
      const before = state.scroll;
      state.scroll += (state.target - state.scroll) * follow;
      if (Math.abs(state.target - state.scroll) < 0.05) state.scroll = state.target;
      const velocity = (state.scroll - before) / dt;
      state.velocity += (velocity - state.velocity) * (1 - Math.exp(-dt / 0.08));
      if (Math.abs(state.velocity) < 0.5) state.velocity = 0;
      state.waveTime += dt * 2.4;

      const openFollow = reduce ? 1 : 1 - Math.exp(-dt / 0.14);
      state.open += (state.openTarget - state.open) * openFollow;
      if (Math.abs(state.openTarget - state.open) < 0.001) state.open = state.openTarget;

      state.ring += ((state.keyboard ? 1 : 0) - state.ring) * (1 - Math.exp(-dt / 0.1));
      if (Math.abs((state.keyboard ? 1 : 0) - state.ring) < 0.002) state.ring = state.keyboard ? 1 : 0;

      if (state.intro < 1) state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);

      let settling = false;
      state.hover.forEach((value, slot) => {
        const goal = slot === state.hovered ? 1 : 0;
        const next = value + (goal - value) * (1 - Math.exp(-dt / 0.12));
        if (Math.abs(goal - next) < 0.002) {
          if (goal === 0) state.hover.delete(slot); else state.hover.set(slot, 1);
        } else {
          state.hover.set(slot, next);
          settling = true;
        }
      });

      if (state.openTarget > 0 && !state.focus.has(state.active)) state.focus.set(state.active, 0);
      state.focus.forEach((value, slot) => {
        const goal = state.openTarget > 0 && slot === state.active ? 1 : 0;
        const next = reduce ? goal : value + (goal - value) * (1 - Math.exp(-dt / 0.16));
        if (Math.abs(goal - next) < 0.001) {
          if (goal === 0) state.focus.delete(slot); else state.focus.set(slot, 1);
        } else {
          state.focus.set(slot, next);
          settling = true;
        }
      });

      textures.forEach((entry) => {
        if (!entry.loaded || entry.ready >= 1) return;
        entry.ready = reduce ? 1 : Math.min(1, entry.ready + dt / 0.45);
        settling = true;
      });

      const slot = auto ? Math.round(state.scroll / Math.max(state.spacing, 1)) : nearest();
      if (slot !== state.active && !state.drag) {
        state.active = slot;
        const index = wrap(slot, settings.items.length);
        buttons.forEach((b, i) => { b.tabIndex = i === index ? 0 : -1; });
        if (settings.onActiveChange) settings.onActiveChange(index);
      }

      const metrics = layout();
      draw(metrics);
      placeLabels(metrics);

      const moving = (settings.autoScroll && !reduce) ||
        state.scroll !== state.target ||
        state.velocity !== 0 ||
        state.open !== state.openTarget ||
        state.intro < 1 ||
        (state.ring !== 0 && state.ring !== 1) ||
        settling;

      if (moving) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    function wake() {
      if (!raf && visible && !document.hidden && !destroyed) raf = requestAnimationFrame(frame);
    }

    /* ── sizing ── */

    const resize = () => {
      view.width = Math.max(1, root.clientWidth || mount.clientWidth || 1);
      view.height = Math.max(1, root.clientHeight || mount.clientHeight || 1);
      view.ratio = Math.min(settings.dpr || window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(view.width * view.ratio));
      canvas.height = Math.max(1, Math.round(view.height * view.ratio));
      const before = state.spacing;
      const { spacing } = measure();
      if (before > 1 && spacing !== before) {
        state.scroll = (state.scroll / before) * spacing;
        state.target = (state.target / before) * spacing;
      }
      state.spacing = spacing;
      wake();
    };

    /* ── input ── */

    const point = (event) => {
      const rect = root.getBoundingClientRect();
      return { x: event.clientX - rect.left - rect.width / 2, y: rect.height / 2 - (event.clientY - rect.top) };
    };

    const hit = ({ x, y }) => {
      for (let i = cards.length - 1; i >= 0; i--) {
        const card = cards[i];
        if (card.alpha < 0.05) continue;
        const dx = x - card.x;
        const dy = y - card.y;
        const c = Math.cos(-card.angle);
        const s = Math.sin(-card.angle);
        const lx = c * dx - s * dy;
        const ly = s * dx + c * dy;
        if (Math.abs(lx) <= card.w / 2 && Math.abs(ly) <= card.h / 2) return card;
      }
      return null;
    };

    const setPointer = (card) => {
      const slot = card ? card.slot : null;
      if (slot !== state.hovered) {
        state.hovered = slot;
        if (slot !== null && !state.hover.has(slot)) state.hover.set(slot, 0);
        wake();
      }
      if (card) root.setAttribute('data-pointer', '');
      else root.removeAttribute('data-pointer');
    };

    const snapNow = () => {
      if (!settings.snap && state.open < 0.5) return;
      setSlot(nearest());
    };

    const onPointerDown = (event) => {
      if (event.button !== 0 || (event.target.closest && event.target.closest('[data-gallery-close]'))) return;
      const p = point(event);
      state.drag = {
        id: event.pointerId,
        x0: event.clientX,
        y0: event.clientY,
        start: state.target,
        moved: false,
        samples: [],
        p
      };
      state.lastInput = performance.now();
      wake();
    };

    const onPointerMove = (event) => {
      const drag = state.drag;
      if (drag && drag.id === event.pointerId) {
        const dx = event.clientX - drag.x0;
        const dy = event.clientY - drag.y0;
        if (!drag.moved && Math.hypot(dx, dy) > 6) {
          if (Math.abs(dy) > Math.abs(dx) && event.pointerType !== 'mouse') {
            state.drag = null;
            return;
          }
          drag.moved = true;
          root.setPointerCapture && root.setPointerCapture(event.pointerId);
          root.setAttribute('data-dragging', '');
          setPointer(null);
        }
        if (drag.moved) {
          state.target = drag.start - dx * (settings.scrollSpeed / 2);
          drag.samples.push({ x: event.clientX, t: performance.now() });
          if (drag.samples.length > 6) drag.samples.shift();
          state.lastInput = performance.now();
          wake();
        }
        return;
      }
      if (event.pointerType === 'mouse') setPointer(hit(point(event)));
    };

    const onPointerUp = (event) => {
      const drag = state.drag;
      if (!drag || drag.id !== event.pointerId) return;
      state.drag = null;
      root.removeAttribute('data-dragging');
      if (root.hasPointerCapture && root.hasPointerCapture(event.pointerId)) root.releasePointerCapture(event.pointerId);

      if (drag.moved) {
        const samples = drag.samples;
        if (samples.length > 1) {
          const a = samples[0];
          const b = samples[samples.length - 1];
          const span = Math.max(b.t - a.t, 16);
          const speed = ((b.x - a.x) / span) * 1000;
          state.target -= speed * 0.18 * (settings.scrollSpeed / 2);
        }
        snapNow();
        return;
      }

      const card = hit(drag.p);
      if (!card) {
        if (state.open > 0.5) close();
        return;
      }
      if (settings.onItemClick) settings.onItemClick(card.item, card.index);
      if (!settings.openOnClick) {
        setSlot(card.slot);
        return;
      }
      if (state.open > 0.5 && card.slot === state.active) close();
      else openSlot(card.slot);
    };

    const onPointerCancel = (event) => {
      if (state.drag && state.drag.id === event.pointerId) {
        state.drag = null;
        root.removeAttribute('data-dragging');
        snapNow();
      }
    };

    const onPointerLeave = () => setPointer(null);

    const onWheel = (event) => {
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? view.height : 1;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!delta) return;
      event.preventDefault();
      state.target += delta * unit * (settings.scrollSpeed / 2);
      state.lastInput = performance.now();
      clearTimeout(snapTimer);
      snapTimer = setTimeout(snapNow, 140);
      wake();
    };

    const onKeyDown = (event) => {
      const step = STEPS[event.key];
      state.lastInput = performance.now();
      if (step) {
        event.preventDefault();
        if (root.contains(document.activeElement) && document.activeElement !== root) state.keyboard = true;
        setSlot(nearest() + step);
        const index = wrap(state.active, settings.items.length);
        if (root.contains(document.activeElement)) {
          const b = buttons[index];
          if (b) b.focus({ preventScroll: true });
        }
        return;
      }
      if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        const base = nearest() - wrap(nearest(), settings.items.length);
        setSlot(event.key === 'Home' ? base : base + settings.items.length - 1);
        return;
      }
      if (event.key === 'Escape' && state.openTarget > 0) {
        event.preventDefault();
        close();
      }
    };

    const onFocusIn = (event) => {
      if (!event.target.closest || !event.target.closest('[data-gallery-list]')) return;
      state.keyboard = typing || event.target.matches(':focus-visible');
      wake();
    };

    const onAnyKey = (event) => {
      if (event.key === 'Tab' || event.key.indexOf('Arrow') === 0) typing = true;
    };

    const onAnyPointer = () => { typing = false; };

    const onFocusOut = (event) => {
      if (root.contains(event.relatedTarget)) return;
      state.keyboard = false;
      wake();
    };

    const onVisibility = () => { last = 0; wake(); };

    /* ── wiring ── */

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);

    const intersection = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible) { last = 0; wake(); }
    });
    intersection.observe(root);

    root.addEventListener('pointerdown', onPointerDown);
    root.addEventListener('pointermove', onPointerMove);
    root.addEventListener('pointerup', onPointerUp);
    root.addEventListener('pointercancel', onPointerCancel);
    root.addEventListener('pointerleave', onPointerLeave);
    root.addEventListener('wheel', onWheel, { passive: false });
    root.addEventListener('keydown', onKeyDown);
    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('focusout', onFocusOut);
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('keydown', onAnyKey, true);
    document.addEventListener('pointerdown', onAnyPointer, true);

    closeBtn.addEventListener('click', () => close());

    lastItems = settings.items;
    settings.items.forEach((item) => textureFor(item.image, item));
    resize();

    const slotFor = (index) => {
      const count = settings.items.length;
      const slot = nearest();
      const base = slot - wrap(slot, count) + index;
      return [base - count, base, base + count].reduce((best, value) =>
        Math.abs(value - slot) < Math.abs(best - slot) ? value : best
      );
    };

    const controller = {
      open: (index) => openSlot(slotFor(index)),
      focus: (index) => setSlot(slotFor(index)),
      close,
      wake,
      get active() { return wrap(state.active, settings.items.length); },
      get isOpen() { return state.openTarget > 0; },
      update(patch) {
        Object.assign(settings, patch || {});
        if (settings.items !== lastItems) {
          lastItems = settings.items;
          prune(settings.items);
          settings.items.forEach((item) => textureFor(item.image, item));
        }
        resize();
        wake();
      },
      destroy() {
        destroyed = true;
        cancelAnimationFrame(raf);
        clearTimeout(snapTimer);
        resizeObserver.disconnect();
        intersection.disconnect();
        root.removeEventListener('pointerdown', onPointerDown);
        root.removeEventListener('pointermove', onPointerMove);
        root.removeEventListener('pointerup', onPointerUp);
        root.removeEventListener('pointercancel', onPointerCancel);
        root.removeEventListener('pointerleave', onPointerLeave);
        root.removeEventListener('wheel', onWheel);
        root.removeEventListener('keydown', onKeyDown);
        root.removeEventListener('focusin', onFocusIn);
        root.removeEventListener('focusout', onFocusOut);
        document.removeEventListener('visibilitychange', onVisibility);
        document.removeEventListener('keydown', onAnyKey, true);
        document.removeEventListener('pointerdown', onAnyPointer, true);
        labelLayer.replaceChildren();
        textures.forEach((entry) => { if (entry.texture) gl.deleteTexture(entry.texture); });
        gl.deleteTexture(blank);
        gl.deleteProgram(program.program);
        gl.deleteBuffer(vertexBuffer);
        gl.deleteBuffer(indexBuffer);
        gl.deleteVertexArray(vao);
        const lose = gl.getExtension('WEBGL_lose_context');
        if (lose) lose.loseContext();
        if (root.parentNode) root.parentNode.removeChild(root);
      }
    };

    return controller;
  }

  global.createCircularGallery = createCircularGallery;
  global.supportsWebGL2 = supportsWebGL2;
}(window));
