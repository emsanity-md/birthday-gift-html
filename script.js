/* ==========================================================================
   THE POSTCARD JOURNAL — engine
   --------------------------------------------------------------------------
   Vanilla JS, no dependencies, no build step.
   Sections:
     01  helpers
     02  content hydration
     03  audio (music + live equaliser)
     04  paper confetti
     05  ambient motes
     06  journey rail + scroll spy
     07  scene 0 — the envelope
     08  scene 1 — the letter
     09  scene 2 — the album
     10  scene 3 — the map
     11  scene 4 — the wish
     12  scene 5 — the finale
     14  boot
   ========================================================================== */

(function () {
  'use strict';

  const C = CONTENT;
  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const live = $('#live');
  const announce = (msg) => { if (live) live.textContent = msg; };

  /* ═════════════════════════════════════════════════════ 01  helpers ══ */

  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

  /* Picture markup for the optimised derivatives. */
  function picture(id, alt, sizes) {
    const s = sizes || '(max-width: 640px) 74vw, 420px';
    return '<picture>' +
      '<source type="image/webp" srcset="images/opt/' + id + '-800.webp 800w, images/opt/' + id + '-1400.webp 1400w" sizes="' + s + '">' +
      '<img src="images/opt/' + id + '-1400.jpg" srcset="images/opt/' + id + '-800.jpg 800w, images/opt/' + id + '-1400.jpg 1400w" ' +
      'sizes="' + s + '" alt="' + alt + '" loading="lazy" decoding="async">' +
      '</picture>';
  }

  /* ═════════════════════════════════════════ 02  content hydration ══ */

  function hydrate() {
    document.title = C.meta.title;

    /* --- scene 0 --- */
    $('#sealTo').textContent = C.envelope.to;
    $('#sealAddress').innerHTML = C.envelope.address.map(function (l) {
      return '<span>' + l + '</span>';
    }).join('<br>');
    $$('.seal__initial').forEach(function (el) { el.textContent = C.envelope.sealInitial; });
    $('#sealHint .seal__hint-main').textContent = C.envelope.hint;
    $('#sealHint .seal__hint-sub').textContent = C.envelope.subhint;

    /* --- scene 1 --- */
    $('#letterKicker').textContent = C.letter.kicker;
    $('#letterDate').textContent = C.letter.date;
    $('#letterSignature').textContent = C.letter.signature;
    $('#letterSignoff').textContent = C.letter.signOff;
    $('#letterPostmark .postmark__ring textPath').textContent = C.letter.postmark.place;
    $('#letterPostmark .postmark__day').textContent = C.letter.postmark.day;
    $('#letterPostmark .postmark__month').textContent = C.letter.postmark.month;
    $('#letterPostmark .postmark__year').textContent = C.letter.postmark.year;

    /* --- scene 2 --- */
    $('#albumKicker').textContent = C.album.kicker;
    $('#albumTitle').textContent = C.album.title;
    $('#albumIntro').textContent = C.album.intro;
    $('#albumHint').textContent = C.album.hint;
    $('#albumTotal').textContent = C.album.prints.length;

    /* --- scene 3 --- */
    $('#mapKicker').textContent = C.map.kicker;
    $('#mapTitle').textContent = C.map.title;
    $('#mapIntro').textContent = C.map.intro;

    /* --- scene 4 --- */
    $('#wishKicker').textContent = C.wish.kicker;
    $('#wishTitle').textContent = C.wish.title;
    $('#wishIntro').textContent = C.wish.intro;
    $('#wishHint').textContent = C.wish.hint;
    $('#blowLabel').textContent = C.wish.button;
    $('#wishNoteTitle').textContent = C.wish.note.title;
    $('#wishNoteBody').textContent = C.wish.note.body;

    /* --- scene 5 --- */
    $('#finaleKicker').textContent = C.finale.kicker;
    $('#finaleTitle').textContent = C.finale.title;
    $('#finaleName').textContent = C.finale.name;
    $('#finaleMessage').textContent = C.finale.message;
    $('#finaleSignoff').textContent = C.finale.signOff;
    $('#finalePostmark .postmark__ring textPath').textContent = C.finale.stamp.place;
    $('#finalePostmark .postmark__day').textContent = C.finale.stamp.day;
    $('#finalePostmark .postmark__month').textContent = C.finale.stamp.month;
    $('#finalePostmark .postmark__year').textContent = C.finale.stamp.year;
    $$('.finale__seal-initial').forEach(function (el) {
      el.textContent = C.meta.recipient.charAt(0);
    });
    $('#replayBtn').textContent = C.finale.replay;
    $('#backBtn').textContent = C.finale.back;

    /* --- ui --- */
    $('#albumPrev').setAttribute('aria-label', C.ui.prev);
    $('#albumNext').setAttribute('aria-label', C.ui.next);
    $('#musicLabel').textContent = C.ui.play;
    $('#musicBtn').setAttribute('aria-label', C.ui.play);
    $('#letterScroll span').textContent = C.ui.scroll;
  }

  /* ═════════════════════════════════════════════════════ 03  audio ══ */

  const Music = {
    el: $('#bgMusic'),
    ctx: null,
    analyser: null,
    bins: null,
    wired: false,
    playing: false,
    eqBars: [],

    init: function () {
      if (this.wired) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
        const src = this.ctx.createMediaElementSource(this.el);
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 128;
        this.analyser.smoothingTimeConstant = 0.75;
        src.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
        this.bins = new Uint8Array(this.analyser.frequencyBinCount);
        this.wired = true;
      } catch (e) {
        this.analyser = null;
      }
    },

    play: function () {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      this.el.volume = 0.45;
      const p = this.el.play();
      if (p && p.catch) {
        p.catch(function () {
          announce(C.ui.musicBlocked);
          const label = $('#musicLabel');
          if (label) label.textContent = C.ui.musicBlocked;
        });
      }
    },

    pause: function () { this.el.pause(); },

    toggle: function () { if (this.el.paused) this.play(); else this.pause(); },

    levels: function () {
      if (!this.analyser) return null;
      this.analyser.getByteFrequencyData(this.bins);
      return this.bins;
    }
  };

  function buildEqualiser() {
    const eq = $('#eq');
    for (let i = 0; i < 16; i++) {
      const b = document.createElement('i');
      eq.appendChild(b);
      Music.eqBars.push(b);
    }
  }

  function paintEqualiser() {
    const bins = Music.levels();
    if (!bins) return;
    const step = Math.max(1, Math.floor(bins.length / Music.eqBars.length));
    for (let i = 0; i < Music.eqBars.length; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) sum += bins[i * step + j] || 0;
      const v = sum / step / 255;
      Music.eqBars[i].style.height = (3 + v * 13).toFixed(1) + 'px';
    }
  }

  function wireDock() {
    const btn = $('#musicBtn');
    const label = $('#musicLabel');
    const dock = $('#dock');
    let rainTimer = null;

    btn.addEventListener('click', function () {
      Music.toggle();
    });

    Music.el.addEventListener('play', function () {
      Music.playing = true;
      btn.setAttribute('aria-pressed', 'true');
      btn.setAttribute('aria-label', C.ui.pause);
      label.textContent = C.ui.pause;
      dock.classList.add('is-playing');
      dock.classList.remove('is-blocked');
      if (!reduced && !rainTimer) {
        rainTimer = setInterval(function () { Confetti.rain({ count: 1 }); }, 1500);
      }
    });

    Music.el.addEventListener('pause', function () {
      Music.playing = false;
      btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute('aria-label', C.ui.play);
      label.textContent = C.ui.play;
      dock.classList.remove('is-playing');
      if (rainTimer) { clearInterval(rainTimer); rainTimer = null; }
    });

    function loop() {
      if (Music.playing) paintEqualiser();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  /* ═════════════════════════════════════════════ 04  paper confetti ══ */

  const Confetti = {
    canvas: $('#confetti'),
    ctx: null,
    parts: [],
    raf: null,
    dpr: 1,

    init: function () {
      this.ctx = this.canvas.getContext('2d');
      this.resize();
      window.addEventListener('resize', this.resize.bind(this));
    },

    resize: function () {
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.floor(window.innerWidth * this.dpr);
      this.canvas.height = Math.floor(window.innerHeight * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    },

    burst: function (opts) {
      const o = Object.assign({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        count: 90,
        spread: 62,
        angle: -90,
        speed: rand(7, 15),
        gravity: 0.26,
        colours: ['#C0453D', '#2F5D8C', '#D9A441', '#D4737A', '#E8A9B4', '#F4EDE1', '#4E6B52'],
        shapes: ['scrap', 'scrap', 'ribbon', 'petal']
      }, opts || {});

      for (let i = 0; i < o.count; i++) {
        const a = (o.angle + rand(-o.spread, o.spread)) * Math.PI / 180;
        const v = o.speed * rand(.45, 1.25);
        const shape = o.shapes[(Math.random() * o.shapes.length) | 0];
        this.parts.push({
          x: o.x + rand(-14, 14),
          y: o.y + rand(-10, 10),
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          w: shape === 'ribbon' ? rand(4, 7) : rand(6, 12),
          h: shape === 'ribbon' ? rand(14, 24) : rand(8, 15),
          rot: rand(0, Math.PI * 2),
          vr: rand(-0.26, 0.26),
          spin: rand(0.06, 0.2),
          sway: rand(0.4, 1.5),
          phase: rand(0, Math.PI * 2),
          colour: o.colours[(Math.random() * o.colours.length) | 0],
          shape: shape,
          gravity: o.gravity,
          drag: shape === 'petal' ? 0.985 : 0.975,
          life: 1
        });
      }
      this.start();
    },

    rain: function (opts) {
      const o = Object.assign({
        count: 2,
        colours: ['#F4EDE1', '#E1D3B8', '#D9A441', '#D4737A'],
        shapes: ['petal', 'scrap']
      }, opts || {});
      for (let i = 0; i < o.count; i++) {
        const shape = o.shapes[(Math.random() * o.shapes.length) | 0];
        this.parts.push({
          x: rand(-40, window.innerWidth + 40),
          y: rand(-260, -40),
          vx: rand(-0.5, 0.5),
          vy: rand(0.8, 2.1),
          w: shape === 'ribbon' ? 5 : rand(5, 10),
          h: shape === 'ribbon' ? 18 : rand(6, 12),
          rot: rand(0, Math.PI * 2),
          vr: rand(-0.12, 0.12),
          spin: rand(0.04, 0.12),
          sway: rand(0.6, 2),
          phase: rand(0, Math.PI * 2),
          colour: o.colours[(Math.random() * o.colours.length) | 0],
          shape: shape,
          gravity: 0.012,
          drag: 0.999,
          life: 1
        });
      }
      this.start();
    },

    start: function () {
      if (this.raf) return;
      let last = performance.now();
      const frame = function (now) {
        const dt = Math.min(48, now - last) / 16.67;
        last = now;
        Confetti.step(dt);
        if (Confetti.parts.length) {
          Confetti.raf = requestAnimationFrame(frame);
        } else {
          Confetti.raf = null;
          Confetti.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        }
      };
      this.raf = requestAnimationFrame(frame);
    },

    step: function (dt) {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const W = window.innerWidth, H = window.innerHeight;

      for (let i = this.parts.length - 1; i >= 0; i--) {
        const p = this.parts[i];
        p.phase += p.sway * 0.04;
        p.vy += p.gravity * dt;
        p.vx *= Math.pow(p.drag, dt);
        p.vy *= Math.pow(p.drag, dt);
        p.vx += Math.sin(p.phase) * 0.06;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        p.spin += 0.02 * dt;

        if (p.y > H + 60 || p.x < -120 || p.x > W + 120) {
          this.parts.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = clamp(p.life, 0, 1);
        ctx.fillStyle = p.colour;

        if (p.shape === 'petal') {
          ctx.beginPath();
          ctx.ellipse(0, 0, p.w * 0.5, p.h * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha *= 0.35;
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.ellipse(-p.w * 0.12, -p.h * 0.12, p.w * 0.18, p.h * 0.28, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'ribbon') {
          const fold = Math.cos(p.spin) * 0.85 + 0.15;
          ctx.scale(1, fold);
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.spin)) + 2);
        }
        ctx.restore();
      }
    }
  };

  /* ═══════════════════════════════════════════════ 05  ambient motes ══ */

  function buildMotes() {
    if (reduced) return;
    const host = $('#motes');
    for (let i = 0; i < 16; i++) {
      const m = document.createElement('span');
      m.className = 'mote';
      const size = rand(4, 10);
      m.style.width = size + 'px';
      m.style.height = size * rand(1, 1.5) + 'px';
      m.style.left = rand(0, 100) + 'vw';
      m.style.setProperty('--dx', rand(-90, 90) + 'px');
      m.style.setProperty('--dr', rand(-320, 320) + 'deg');
      m.style.animationDuration = rand(16, 34) + 's';
      m.style.animationDelay = (-rand(0, 24)) + 's';
      host.appendChild(m);
    }
  }

  /* ═══════════════════════════════════════════ 06  journey + spy ══ */

  const SCENE_LABELS = ['The seal', 'The letter', 'The album', 'The map', 'The wish', 'The finale'];

  function buildRail() {
    const list = $('#journeyList');
    const scenes = $$('.scene');
    scenes.forEach(function (s, i) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'journey__btn';
      b.setAttribute('aria-label', (C.ui.openScene + ': ' + (SCENE_LABELS[i] || '')));
      b.innerHTML = (i + 1) + '<span>' + (SCENE_LABELS[i] || '') + '</span>';
      b.addEventListener('click', function () {
        s.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      });
      li.appendChild(b);
      list.appendChild(li);
    });
  }

  function wireScrollSpy() {
    const scenes = $$('.scene');
    const buttons = $$('.journey__btn');
    const rail = $('#journey');

    let ticking = false;
    function update() {
      ticking = false;
      const mid = window.innerHeight * 0.45;
      let best = 0, bestD = Infinity;
      scenes.forEach(function (s, i) {
        const r = s.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestD) { bestD = d; best = i; }
      });
      buttons.forEach(function (b, i) {
        b.setAttribute('aria-current', i === best ? 'true' : 'false');
      });
      const total = document.body.scrollHeight - window.innerHeight;
      const p = total > 0 ? clamp(window.scrollY / total, 0, 1) : 0;
      rail.style.setProperty('--progress', p.toFixed(3));
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  function wireReveals() {
    const targets = $$('.scene__head, .sheet, .album, .map__board, .wish, .finale, .finale__actions');
    targets.forEach(function (el) { el.classList.add('reveal'); });

    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ═════════════════════════════════════════════ 07  the envelope ══ */

  function wireEnvelope() {
    const env = $('#envelope');
    const scene = $('#scene-seal');
    let opened = false;

    function open() {
      if (opened) return;
      /* the countdown seals the gift until the birthday */
      if (Countdown.locked) return;
      opened = true;

      /* first gesture: unlock audio */
      Music.play();

      env.classList.add('is-broken');
      scene.classList.add('is-unsealed');

      /* shards of wax */
      const sr = env.getBoundingClientRect();
      Confetti.burst({
        x: sr.left + sr.width / 2,
        y: sr.top + sr.height * 0.88,
        count: 34,
        spread: 108,
        angle: -90,
        speed: rand(4, 10),
        gravity: 0.5,
        colours: ['#b8332c', '#e5615a', '#8E2B25', '#75201b'],
        shapes: ['scrap', 'scrap', 'petal']
      });

      sleep(520).then(function () {
        env.classList.add('is-open');
        announce('The seal is broken. The letter is out.');
      });

      sleep(1500).then(function () {
        const t = $('#transition');
        t.classList.add('is-in');
        sleep(640).then(function () {
          $('#scene-letter').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
          sleep(520);
          t.classList.remove('is-in');
          t.classList.add('is-out');
          sleep(760);
          t.classList.remove('is-out');
          announce('Chapter one: the letter.');
        });
      });
    }

    env.addEventListener('click', open);
    env.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  }

  /* ══════════════════════════════════════════════ 08  the letter ══ */

  function typeInto(el, text, speed) {
    return new Promise(function (resolve) {
      const caret = document.createElement('span');
      caret.className = 'caret';
      let i = 0;

      if (reduced) { el.textContent = text; resolve(); return; }

      function step() {
        i = Math.min(text.length, i + speed);
        el.textContent = text.slice(0, i);
        el.appendChild(caret);
        if (i < text.length) {
          setTimeout(step, 14);
        } else {
          caret.remove();
          resolve();
        }
      }
      step();
    });
  }

  let letterDone = false;

  function writeLetter() {
    if (letterDone) return;
    letterDone = true;

    const host = $('#letterBody');
    const paras = C.letter.body.map(function (t) {
      const p = document.createElement('p');
      host.appendChild(p);
      return p;
    });

    const finish = function () {
      paras.forEach(function (p, i) { p.textContent = C.letter.body[i]; });
      stampLetter();
    };

    if (reduced) { finish(); return; }

    let idx = 0;
    function next() {
      if (idx >= paras.length) { stampLetter(); return; }
      const p = paras[idx++];
      typeInto(p, C.letter.body[idx - 1], 4).then(function () {
        setTimeout(next, 220);
      });
    }
    next();

    /* tap the letter to skip the typing */
    $('#letterSheet').addEventListener('click', function () {
      if (letterDone && !$('#letterPostmark').classList.contains('is-stamped')) {
        finish();
      }
    });
  }

  function stampLetter() {
    const pm = $('#letterPostmark');
    const sheet = $('#letterSheet');
    if (pm.classList.contains('is-stamped')) return;
    setTimeout(function () {
      pm.classList.add('is-stamped');
      sheet.animate(
        [{ transform: 'rotate(-.5deg) translate(0,0)' },
         { transform: 'rotate(-.5deg) translate(2px,-3px)' },
         { transform: 'rotate(-.5deg) translate(-2px,2px)' },
         { transform: 'rotate(-.5deg) translate(0,0)' }],
        { duration: 320, easing: 'ease-out' }
      );
      announce('A letter for you.');
    }, 260);
  }

  /* ═════════════════════════════════════════════ 09  the countdown ══ */

  /* The gift stays sealed until the birthday. The countdown covers the page
     from `returnsOn` June onwards, steps aside for the birthday itself, and
     comes back for the following year. */
  const Countdown = {
    el: null,
    timer: null,
    target: null,
    locked: false,
    dismissed: false,
    STORE: 'postcard-countdown-dismissed',

    init: function () {
      const self = this;
      const cfg = C.countdown;
      this.el = $('#countdown');
      if (!cfg || !cfg.enabled || !this.el) { this.ready(); return; }

      this.cfg = cfg;
      this.dismissed = this.read();

      if (this.dismissed) { this.ready(); return; }

      const state = this.state();
      if (state.hidden) { this.ready(); return; }

      this.target = state.target;
      this.fill();
      this.render();
      this.lock();
      this.start();
      this.ready();
    },

    /* ── the calendar ── */

    state: function () {
      const cfg = this.cfg;
      const now = new Date();
      const m = (cfg.month || 6) - 1;
      const day = cfg.day || 3;
      const back = cfg.returnsOn || day + 3;

      /* the birthday itself: no countdown, the gift is open */
      if (now.getMonth() === m && now.getDate() >= day && now.getDate() < back) {
        return { hidden: true };
      }

      let target = new Date(now.getFullYear(), m, day, 0, 0, 0, 0);
      if (now.getTime() >= target.getTime()) {
        target = new Date(now.getFullYear() + 1, m, day, 0, 0, 0, 0);
      }
      return { hidden: false, target: target };
    },

    /* ── the sheet ── */

    fill: function () {
      const cfg = this.cfg;
      const y = this.target.getFullYear();
      const monthName = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
        'August', 'September', 'October', 'November', 'December'][(cfg.month || 6) - 1];

      $('#countdownKicker').textContent = cfg.kicker;
      $('#countdownTitle').textContent = cfg.title;
      $('#countdownBody').textContent = cfg.body;
      $('#countdownSignOff').textContent = cfg.signOff;
      $('#countdownSkip').textContent = cfg.skip;
      $('#countdownOpens').textContent = 'It opens on ' + (cfg.day || 3) + ' ' + monthName + ' ' + y;
      $('#countdown .postmark__year').textContent = y;
    },

    render: function () {
      const total = Math.max(0, this.target.getTime() - Date.now());
      const days = Math.floor(total / 86400000);
      const hours = Math.floor((total % 86400000) / 3600000);
      const minutes = Math.floor((total % 3600000) / 60000);
      const seconds = Math.floor((total % 60000) / 1000);

      $('#countdownDays').textContent = String(days);
      $('#countdownHours').textContent = String(hours).padStart(2, '0');
      $('#countdownMinutes').textContent = String(minutes).padStart(2, '0');
      $('#countdownSeconds').textContent = String(seconds).padStart(2, '0');

      if (total <= 0) this.unlock();
    },

    start: function () {
      const self = this;
      this.stop();
      this.timer = setInterval(function () {
        const state = self.state();

        /* the window can open or close while the page is left open */
        if (state.hidden) {
          if (self.locked) self.unlock();
          return;
        }
        if (!self.locked) {
          self.target = state.target;
          self.fill();
          self.lock();
        }
        self.render();
      }, 1000);
    },

    stop: function () {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
    },

    /* ── locking the page ── */

    lock: function () {
      if (this.locked) return;
      this.locked = true;
      this.el.hidden = false;
      document.body.classList.add('is-locked');
      this.seal(true);
      const skip = $('#countdownSkip');
      if (skip) skip.focus({ preventScroll: true });
      const days = $('#countdownDays').textContent;
      announce('This gift opens on 3 June. ' + days + ' days to go.');
    },

    unlock: function () {
      if (!this.locked) return;
      this.locked = false;
      this.el.hidden = true;
      document.body.classList.remove('is-locked');
      this.seal(false);
      announce('It is the third of June. Open your gift.');
    },

    /* keep the gift behind the countdown out of reach */
    seal: function (on) {
      const main = $('#journeyMain');
      const dock = $('#dock');
      const rail = $('#journey');
      [main, dock, rail].forEach(function (el) {
        if (!el) return;
        if ('inert' in el) el.inert = on;
        el.setAttribute('aria-hidden', on ? 'true' : 'false');
      });
    },

    dismiss: function () {
      if (this.dismissed) return;
      this.dismissed = true;
      this.unlock();
      this.stop();
      try { sessionStorage.setItem(this.STORE, '1'); } catch (e) { /* private mode */ }
      const env = $('#envelope');
      if (env) env.focus({ preventScroll: true });
    },

    read: function () {
      try { return sessionStorage.getItem(this.STORE) === '1'; } catch (e) { return false; }
    },

    ready: function () {
      document.body.classList.add('countdown-ready');
    },

    wire: function () {
      const self = this;
      const skip = $('#countdownSkip');
      if (skip) skip.addEventListener('click', function () { self.dismiss(); });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && self.locked) {
          e.preventDefault();
          self.dismiss();
        }
      });
    }
  };

  /* ═══════════════════════════════════════════════ 10  the album ══ */

  /* "3 / 4" -> 0.75 */
  function ratioValue(ratio) {
    if (typeof ratio === 'number') return ratio;
    const parts = String(ratio).split('/').map(function (n) { return parseFloat(n); });
    if (parts.length !== 2 || !parts[0] || !parts[1]) return 0.78;
    return parts[0] / parts[1];
  }

  /* Draw a print onto an offscreen canvas — cream paper, the photo at its own
     ratio, a hairline mount and a strip of washi tape. The canvas becomes the
     card texture, so the shader never has to crop the photo. */
  function composePrint(image, item) {
    const aspect = item.aspect || 0.78;
    const W = 760;
    const H = Math.round(W / aspect);
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');

    /* paper */
    g.fillStyle = '#FCF8F1';
    g.fillRect(0, 0, W, H);

    /* mount */
    const mat = Math.round(W * 0.05);
    const innerW = W - mat * 2;
    const innerH = H - mat * 2;

    /* the photo, at its own ratio, so nothing is ever cropped */
    const ir = image.naturalWidth / Math.max(1, image.naturalHeight);
    const br = innerW / innerH;
    let dw, dh;
    if (ir > br) { dw = innerW; dh = innerW / ir; } else { dh = innerH; dw = innerH * ir; }
    const dx = mat + (innerW - dw) / 2;
    const dy = mat + (innerH - dh) / 2;
    g.drawImage(image, dx, dy, dw, dh);

    /* hairline around the mount */
    g.strokeStyle = 'rgba(120, 96, 62, .22)';
    g.lineWidth = Math.max(1, W * 0.0022);
    g.strokeRect(dx + 0.5, dy + 0.5, dw - 1, dh - 1);

    /* washi tape across the top */
    const tw = W * 0.28;
    const th = W * 0.075;
    g.save();
    g.translate(W / 2, mat * 0.55);
    g.rotate(-0.045);
    g.shadowColor = 'rgba(74, 52, 28, .30)';
    g.shadowBlur = W * 0.012;
    g.shadowOffsetY = W * 0.004;
    g.fillStyle = 'rgba(212, 115, 122, .40)';
    g.fillRect(-tw / 2, -th / 2, tw, th);
    g.shadowColor = 'transparent';
    g.fillStyle = 'rgba(255, 255, 255, .32)';
    g.save();
    g.beginPath();
    g.rect(-tw / 2, -th / 2, tw, th);
    g.clip();
    for (let i = -tw; i < tw; i += W * 0.05) {
      g.save();
      g.translate(i, 0);
      g.rotate(-0.62);
      g.fillRect(0, -th, W * 0.017, th * 3);
      g.restore();
    }
    g.restore();
    g.restore();

    return c;
  }

  /* The note that slides in under a focused print. */
  function noteHTML(p, index) {
    return '<div class="print-note">' +
      '<span class="print-note__stamp">Postage<br>' + String(index + 1).padStart(2, '0') + '</span>' +
      '<p class="print-note__title">' + p.title + '</p>' +
      '<p class="print-note__caption">' + p.caption + '</p>' +
      '<p class="print-note__note">' + p.note + '</p>' +
      '<p class="print-note__meta"><span>' + p.place + '</span><span>' + p.date + '</span></p>' +
      '</div>';
  }

  const Album = {
    gallery: null,
    mode: 'none',
    active: 0,
    prints: [],
    stage: null,

    init: function () {
      const self = this;
      this.stage = $('#albumStage');

      const items = C.album.prints.map(function (p, i) {
        return {
          image: 'images/opt/' + p.id + '-800.webp',
          text: p.title,
          description: p.caption,
          aspect: ratioValue(p.ratio),
          alt: p.title,
          index: i
        };
      });

      const host = $('#albumGallery');
      if (host && window.supportsWebGL2 && window.supportsWebGL2()) {
        try {
          this.gallery = window.createCircularGallery(host, {
            items: items,
            label: 'The album',
            bend: 2.2,
            textColor: '#23262B',
            borderRadius: 0.012,
            font: '600 20px "Fraunces"',
            scrollSpeed: 2,
            scrollEase: 0.05,
            itemSize: 1.05,
            itemAspect: 0.78,
            gap: 0.10,
            wave: 1,
            fadeEdges: 0.12,
            shadow: 0.25,
            grayscale: false,
            showTitles: true,
            snap: true,
            autoScroll: 0.12,
            openOnClick: true,
            intro: true,
            captionSpace: self.captionSpace(),
            decorate: composePrint,
            onItemClick: function (item, index) { self.say(index); },
            onActiveChange: function (index) { self.setActive(index); },
            onOpenChange: function (isOpen, index) { self.setNote(isOpen, index); }
          });
        } catch (err) {
          console.warn('The circular gallery could not start:', err);
          this.gallery = null;
        }
      }

      if (this.gallery) {
        this.mode = 'webgl';
        $('#album').classList.add('is-gallery');
        let rt = 0;
        window.addEventListener('resize', function () {
          clearTimeout(rt);
          rt = setTimeout(function () {
            if (self.gallery) self.gallery.update({ captionSpace: self.captionSpace() });
          }, 180);
        });
      } else {
        this.mode = 'css';
        this.buildCss();
      }

      this.setActive(0);
    },

    captionSpace: function () {
      return window.innerWidth < 640 ? 128 : 150;
    },

    setActive: function (index) {
      this.active = index;
      $('#albumIndex').textContent = index + 1;
      $('#albumPrev').disabled = index === 0;
      $('#albumNext').disabled = index === C.album.prints.length - 1;
    },

    say: function (index) {
      const p = C.album.prints[index];
      if (!p) return;
      announce('Print ' + (index + 1) + ' of ' + C.album.prints.length + ': ' + p.title + '. ' + p.caption);
    },

    setNote: function (isOpen, index) {
      const caption = $('#albumGallery .circular-gallery-caption');
      if (!caption) return;
      if (isOpen) {
        const p = C.album.prints[index];
        if (!p) return;
        caption.innerHTML = noteHTML(p, index);
        caption.classList.add('is-open');
      } else {
        caption.classList.remove('is-open');
        caption.innerHTML = '';
      }
    },

    go: function (dir) {
      const total = C.album.prints.length;
      const next = clamp(this.active + dir, 0, total - 1);
      if (next === this.active) return;
      if (this.mode === 'webgl' && this.gallery) {
        this.gallery.focus(next);
        this.setActive(next);
      } else {
        this.active = next;
        this.place();
        const d = C.album.prints[this.active];
        announce('Print ' + (this.active + 1) + ': ' + d.title);
      }
    },

    /* ─────────────────────────────────── fallback: the CSS 3D carousel ── */

    buildCss: function () {
      const self = this;
      C.album.prints.forEach(function (data, i) {
        const el = document.createElement('div');
        el.className = 'print';
        el.style.setProperty('--w', data.w + 'px');
        el.style.setProperty('--ratio', data.ratio);
        el.setAttribute('tabindex', '0');
        el.setAttribute('role', 'button');
        el.setAttribute('aria-pressed', 'false');
        el.setAttribute('aria-label', 'Print ' + (i + 1) + ' of ' + C.album.prints.length + ': ' + data.title + '. ' + C.ui.flip);

        el.innerHTML =
          '<div class="print__inner">' +
            '<div class="print__face print__face--front">' +
              '<span class="print__photo">' + picture(data.id, data.title) + '</span>' +
              '<span class="print__tape"></span>' +
            '</div>' +
            '<div class="print__face print__face--back">' +
              '<div class="print__back-inner">' +
                '<p class="print__back-title">' + data.title + '</p>' +
                '<p class="print__back-caption">' + data.caption + '</p>' +
                '<p class="print__back-note">' + data.note + '</p>' +
                '<p class="print__back-meta"><span>' + data.place + '</span><span>' + data.date + '</span></p>' +
              '</div>' +
              '<span class="print__stamp">Postage<br>' + String(i + 1).padStart(2, '0') + '</span>' +
            '</div>' +
          '</div>';

        el.addEventListener('click', function () {
          if (i === self.active) self.flip(el);
        });
        el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (i === self.active) self.flip(el);
          }
        });

        self.stage.appendChild(el);
        self.prints.push(el);
      });

      this.place();
    },

    place: function () {
      const self = this;
      this.prints.forEach(function (el, i) {
        const d = i - self.active;
        let transform, opacity, z;
        if (d === 0) {
          transform = 'translate(-50%,-50%) translate3d(0,0,0) rotateY(0deg) scale(1)';
          opacity = 1; z = 10;
        } else if (d === 1) {
          transform = 'translate(-50%,-50%) translate3d(44%,0,-170px) rotateY(-30deg) scale(.84)';
          opacity = 1; z = 8;
        } else if (d === -1) {
          transform = 'translate(-50%,-50%) translate3d(-44%,0,-170px) rotateY(30deg) scale(.84)';
          opacity = 1; z = 8;
        } else {
          const dir = d > 0 ? 1 : -1;
          transform = 'translate(-50%,-50%) translate3d(' + (dir * 58) + '%,0,-300px) rotateY(' + (-dir * 34) + 'deg) scale(.7)';
          opacity = 0; z = 1;
        }
        el.style.transform = transform;
        el.style.opacity = opacity;
        el.style.zIndex = z;
        const on = d === 0;
        el.style.pointerEvents = on ? 'auto' : 'none';
        el.tabIndex = on ? 0 : -1;
        el.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      this.setActive(self.active);
    },

    flip: function (el) {
      const inner = $('.print__inner', el);
      const wasFlipped = el.classList.contains('is-flipped');
      const from = wasFlipped ? 180 : 0;
      const to = wasFlipped ? 0 : 180;

      inner.getAnimations().forEach(function (a) { a.cancel(); });

      if (reduced) {
        el.classList.toggle('is-flipped', !wasFlipped);
        el.setAttribute('aria-pressed', String(!wasFlipped));
        inner.style.setProperty('--angle', to + 'deg');
        return;
      }

      inner.animate([
        { transform: 'rotateY(' + from + 'deg) translateZ(0px)' },
        { transform: 'rotateY(' + (from + (to - from) * 0.5) + 'deg) translateZ(78px)', offset: 0.5 },
        { transform: 'rotateY(' + to + 'deg) translateZ(0px)' }
      ], {
        duration: 820,
        easing: 'cubic-bezier(.42,.05,.22,1)',
        fill: 'forwards'
      });

      el.classList.toggle('is-flipped', !wasFlipped);
      el.setAttribute('aria-pressed', String(!wasFlipped));
      inner.style.setProperty('--angle', to + 'deg');
    },

    wire: function () {
      const self = this;
      $('#albumNext').addEventListener('click', function () { self.go(1); });
      $('#albumPrev').addEventListener('click', function () { self.go(-1); });

      /* keyboard — the gallery handles its own when it is running */
      if (self.mode === 'css') {
        $('#album').addEventListener('keydown', function (e) {
          if (e.key === 'ArrowRight') { e.preventDefault(); self.go(1); }
          if (e.key === 'ArrowLeft')  { e.preventDefault(); self.go(-1); }
        });

        /* swipe */
        let x0 = null, y0 = null;
        const stage = this.stage;
        stage.addEventListener('pointerdown', function (e) {
          x0 = e.clientX; y0 = e.clientY;
        });
        stage.addEventListener('pointerup', function (e) {
          if (x0 === null) return;
          const dx = e.clientX - x0, dy = e.clientY - y0;
          x0 = null;
          if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) self.go(dx < 0 ? 1 : -1);
        });
        stage.addEventListener('pointercancel', function () { x0 = null; });
      }
    }
  };

  /* ═════════════════════════════════════════════════ 11  the map ══ */

  const MapScene = {
    pins: [],
    built: false,
    drawn: false,

    build: function () {
      const self = this;
      const host = $('#mapPins');
      const ns = 'http://www.w3.org/2000/svg';

      C.map.pins.forEach(function (p, i) {
        const g = document.createElementNS(ns, 'g');
        g.setAttribute('class', 'map__pin');
        g.setAttribute('transform', 'translate(' + p.x + ',' + p.y + ')');
        g.setAttribute('tabindex', '0');
        g.setAttribute('role', 'button');
        g.setAttribute('aria-label', p.place + ' — ' + p.date);
        g.innerHTML =
          '<circle class="map__pin-hit" cx="0" cy="-30" r="36" fill="transparent" />' +
          '<circle class="map__pin-ping" cx="0" cy="-36" r="21"></circle>' +
          '<g transform="translate(0,-36)">' +
            '<path class="map__pin-body" d="M0 0c-12.5-18.5-20-27.5-20-38a20 20 0 1 1 40 0C20-27.5 12.5-18.5 0 0z"></path>' +
            '<circle class="map__pin-dot" cx="0" cy="-38" r="7.5"></circle>' +
          '</g>' +
          '<text class="map__pin-label" x="0" y="46" text-anchor="middle">' + p.place + '</text>';

        g.style.animationDelay = (i * 0.12) + 's';
        g.addEventListener('click', function () { self.open(p, g); });
        g.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); self.open(p, g); }
        });
        host.appendChild(g);
        self.pins.push(g);
      });

      /* route that follows the pins */
      const pts = C.map.pins.map(function (p) { return { x: p.x, y: p.y }; });
      const route = $('#mapRoute');
      if (route && pts.length > 1) route.setAttribute('d', smoothPath(pts));

      this.built = true;
    },

    open: function (pin, g) {
      const memo = $('#mapMemo');
      const host = $('#map');
      const self = this;

      this.pins.forEach(function (p) { p.classList.remove('is-active'); });
      g.classList.add('is-active');

      $('#mapMemoPhoto').innerHTML = picture(pin.img, pin.place, '74px');
      $('#mapMemoPlace').textContent = pin.place;
      $('#mapMemoDate').textContent = pin.date;
      $('#mapMemoNote').textContent = pin.note;

      memo.hidden = false;

      /* place the memo beside the pin (desktop) */
      if (window.innerWidth > 640) {
        const br = host.getBoundingClientRect();
        const pr = g.getBoundingClientRect();
        const mx = pr.left - br.left + pr.width / 2;
        const my = pr.top - br.top + pr.height / 2;
        const mw = memo.offsetWidth;
        const mh = memo.offsetHeight;
        let left = mx + 118;
        if (left + mw > br.width - 10) left = mx - mw - 118;
        memo.style.left = clamp(left, 10, Math.max(10, br.width - mw - 10)) + 'px';
        memo.style.top = clamp(my - mh / 2, 10, Math.max(10, br.height - mh - 10)) + 'px';
      } else {
        memo.style.left = '';
        memo.style.top = '';
      }
      announce(pin.place + '. ' + pin.note);
    },

    close: function () {
      const memo = $('#mapMemo');
      memo.hidden = true;
      this.pins.forEach(function (p) { p.classList.remove('is-active'); });
    },

    draw: function () {
      const route = $('#mapRoute');
      const map = $('#map');
      if (!route || this.drawn) return;
      this.drawn = true;
      let len = 0;
      try { len = route.getTotalLength(); } catch (e) { len = 600; }
      route.style.transition = 'none';
      route.style.strokeDasharray = len;
      route.style.strokeDashoffset = len;
      route.getBoundingClientRect();
      map.classList.add('is-drawn');
      route.style.transition = 'stroke-dashoffset ' + (reduced ? 0.01 : 2.4) + 's cubic-bezier(.4,.1,.2,1)';
      route.style.strokeDashoffset = '0';
    },

    wire: function () {
      const self = this;
      $('#mapMemoClose').addEventListener('click', function () { self.close(); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !$('#mapMemo').hidden) self.close();
      });
    }
  };

  function smoothPath(points) {
    if (!points || points.length < 2) return '';
    let d = 'M' + points[0].x + ' ' + points[0].y;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
      d += ' C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ', ' +
           c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ', ' +
           p2.x + ' ' + p2.y;
    }
    return d;
  }

  /* ══════════════════════════════════════════════ 12  the wish ══ */

  const Wish = {
    candles: [],
    blown: 0,
    done: false,
    mic: null,
    stream: null,
    raf: null,
    lastBlow: 0,

    build: function () {
      const host = $('#candles');
      for (let i = 0; i < C.wish.candles; i++) {
        const c = document.createElement('div');
        c.className = 'candle';
        c.innerHTML =
          '<span class="candle__wick"></span>' +
          '<span class="flame"><span class="flame__outer"></span><span class="flame__inner"></span></span>' +
          '<span class="smoke"></span>';
        host.appendChild(c);
        this.candles.push(c);
      }
      $('#cake').classList.add('is-lit');
    },

    snuff: function (source) {
      if (this.done) return;
      if (this.blown >= this.candles.length) return;
      const now = performance.now();
      if (source === 'mic' && now - this.lastBlow < 700) return;
      this.lastBlow = now;

      const c = this.candles[this.blown];
      c.classList.add('is-out');
      this.blown++;

      const left = this.candles.length - this.blown;
      if (left > 0) {
        $('#wishStatus').textContent = left + (left === 1 ? ' candle left' : ' candles left');
        announce(left + (left === 1 ? ' candle left.' : ' candles left.'));
      } else {
        this.finish();
      }
    },

    finish: function () {
      if (this.done) return;
      this.done = true;
      $('#cake').classList.add('is-blown');
      $('#blowBtn').disabled = true;
      $('#blowLabel').textContent = 'Make a wish';
      $('#wishStatus').textContent = 'Happy birthday.';
      $('#wishHint').textContent = '';
      $('#wishNote').hidden = false;

      const r = $('#cake').getBoundingClientRect();
      Confetti.burst({
        x: r.left + r.width / 2,
        y: r.top + r.height * 0.35,
        count: 130,
        spread: 78,
        angle: -90,
        speed: rand(8, 17)
      });
      setTimeout(function () {
        Confetti.burst({
          x: r.left + r.width / 2, y: r.top + r.height * 0.3,
          count: 60, spread: 120, angle: -90, speed: rand(6, 12)
        });
      }, 220);

      announce('Happy birthday, Bellendaa!');

      sleep(1400).then(function () {
        const t = $('#transition');
        t.classList.add('is-in');
        sleep(620).then(function () {
          $('#scene-finale').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
          sleep(480);
          t.classList.remove('is-in');
          t.classList.add('is-out');
          sleep(760);
          t.classList.remove('is-out');
        });
      });
    },

    listen: function () {
      const self = this;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        $('#wishStatus').textContent = 'No microphone here — tap the cake instead.';
        return;
      }

      $('#wishStatus').textContent = 'Listening…';
      $('#blowBtn').disabled = true;

      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        self.stream = stream;
        const ctx = new AC();
        self.mic = ctx;
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.5;
        src.connect(analyser);

        const time = new Uint8Array(analyser.fftSize);
        const freq = new Uint8Array(analyser.frequencyBinCount);

        let breathStart = 0;
        let raf;

        function loop() {
          analyser.getByteTimeDomainData(time);
          analyser.getByteFrequencyData(freq);

          let sum = 0;
          for (let i = 0; i < time.length; i++) {
            const v = (time[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / time.length);

          /* low band only — a puff of air, not a voice */
          let low = 0, count = 0;
          for (let i = 1; i < 16; i++) { low += freq[i]; count++; }
          low = count ? low / count : 0;

          const noisy = rms > 0.055 && low > 38;
          const now = performance.now();

          if (noisy) {
            if (!breathStart) breathStart = now;
            if (now - breathStart > 420) {
              breathStart = 0;
              self.snuff('mic');
            }
          } else {
            breathStart = 0;
          }
          raf = requestAnimationFrame(loop);
        }
        self.raf = raf;
        loop();
        $('#wishStatus').textContent = 'Blow at the phone…';
        $('#blowLabel').textContent = 'Listening…';
      }).catch(function () {
        $('#blowBtn').disabled = false;
        $('#wishStatus').textContent = 'Microphone blocked — tap the cake instead.';
      });
    },

    stopMic: function () {
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = null;
      if (this.stream) this.stream.getTracks().forEach(function (t) { t.stop(); });
      this.stream = null;
    },

    wire: function () {
      const self = this;
      $('#blowBtn').addEventListener('click', function () {
        self.listen();
      });
      $('#cake').addEventListener('click', function () {
        self.stopMic();
        self.snuff('tap');
      });
      $('#cake').addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); self.snuff('tap'); }
      });
    }
  };

  /* ═════════════════════════════════════════════ 13  the finale ══ */

  function stampFinale() {
    const pm = $('#finalePostmark');
    const seal = $('.finale__seal');
    if (pm.classList.contains('is-stamped')) return;
    pm.classList.add('is-stamped');
    seal.classList.add('is-stamped');
    setTimeout(function () {
      const r = $('#finaleCard').getBoundingClientRect();
      Confetti.burst({
        x: r.left + r.width / 2, y: r.top + r.height * 0.28,
        count: 80, spread: 100, angle: -90, speed: rand(5, 11)
      });
    }, 420);
  }

  function wireFinale() {
    $('#replayBtn').addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      setTimeout(function () { window.location.reload(); }, reduced ? 0 : 700);
    });
    $('#backBtn').addEventListener('click', function () {
      $('#scene-album').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    });
  }

  /* scene triggers */
  function wireSceneTriggers() {
    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        const id = e.target.id;
        if (id === 'scene-letter') writeLetter();
        if (id === 'scene-map') { if (!MapScene.built) { MapScene.build(); } MapScene.draw(); }
        if (id === 'scene-wish') { if (!Wish.candles.length) Wish.build(); }
        if (id === 'scene-finale') stampFinale();
      });
    }, { threshold: 0.25 });
    $$('.scene').forEach(function (s) { obs.observe(s); });
  }

  /* ═══════════════════════════════════════════════════ 14  boot ══ */

  function boot() {
    document.body.classList.remove('is-booting');

    hydrate();
    buildEqualiser();
    wireDock();
    buildMotes();
    buildRail();
    Album.init();
    Album.wire();
    MapScene.wire();
    Wish.wire();
    wireEnvelope();
    wireFinale();
    wireReveals();
    wireScrollSpy();
    wireSceneTriggers();

    Confetti.init();

    /* the countdown decides whether the gift is sealed away, so it runs
       first and holds the page back until it has made up its mind */
    Countdown.wire();
    Countdown.init();

    /* a whisper of paper in the air, once things are ready */
    if (!reduced) {
      setTimeout(function () { Confetti.rain({ count: 8 }); }, 1200);
    }

    /* open on a different print each time, so the album never feels the same twice */
    if (Math.random() > 0.5) {
      const start = Math.min(C.album.prints.length - 1, 2);
      if (Album.mode === 'webgl' && Album.gallery) {
        Album.gallery.focus(start);
        Album.setActive(start);
      } else {
        Album.active = start;
        Album.place();
      }
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        document.body.classList.add('fonts-ready');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}());
