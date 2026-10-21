# The Postcard Journal

A hand-made travel journal, kept for one person.

A sealed airmail envelope you break open, and inside it six small scenes: a letter
that writes itself, a fan of photo prints you can turn over, a map of the places
you ended up, a cake with candles to blow out, and a last page that gets stamped.

Plain HTML, CSS and JavaScript. No build step, no framework, no dependencies.

---

## Running it

Just open `index.html` in a browser. That is the whole install.

To serve it locally instead (recommended — some browsers are stricter about
`file://` and about microphone access):

```bash
python -m http.server 8000
# then open http://localhost:8000
```

---

## Files

| File | What it is |
|---|---|
| `index.html` | The markup. Six `<section class="scene">` blocks, one per scene. |
| `style.css` | Every visual decision: tokens, the paper system, the 3D scenes, all keyframes. |
| `script.js` | The engine: scene controller, audio, mic blow detection, the album, the map, the confetti. |
| `circular-gallery.js` | A WebGL2 arc of cards — the album. Vanilla, no framework. |
| `circular-gallery.css` | The gallery's styles, plus the paper note that slides in under a print. |
| **`content.js`** | **Everything you want to change.** No code below this file needs touching. |
| `music.mp3` | The background track. |
| `images/` | Your original photos, plus `images/opt/` — WebP + JPEG copies at two sizes for fast loading. |

---

## Customising it

Open **`content.js`**. It is one object, and every string in the gift comes from it.

### Her name and the basics

```js
meta: {
  title: 'A Postcard from This Year',
  recipient: 'Bellendaa',
  sender: '',                       // put your name here
  dateLabel: '21 October 2026',
},
```

### The letter

`letter.body` is an array of paragraphs. Each one is typed out letter by letter when
the scene comes into view.

```js
body: [
  'First paragraph…',
  'Second paragraph…',
],
signature: 'With all my love,',
signOff: '— your person',
postmark: { place: 'BANDAR SERI', day: '21', month: 'OCT', year: '2026' },
```

### The album

One entry per photo. `id` is the filename in `images/` without its extension.

```js
prints: [
  {
    id: '5',                 // images/5.jpg
    ratio: '3 / 4',          // must match the photo's real proportions
    w: 340,                  // how wide the print is, in px
    title: 'The Green Room',
    caption: 'You and the loudest wall in the world.',
    place: 'The green room',
    date: 'Some afternoon',
    note: 'A longer note, shown under the print when you open it.',
  },
],
```

`ratio` is the photo's real width-to-height ratio so nothing is ever cropped.
Measure it in any image viewer, or: `ratio: (width / height) + ' / ' + height`.

Each print is drawn onto its own card — cream paper, the photo at its true
ratio, a hairline mount and a strip of washi tape — and that card becomes the
texture the gallery renders, so the photos are never cropped or squashed.
`w` only matters for the no-WebGL2 fallback.

### The album gallery

The six prints sit on a gentle arc in WebGL2. Drag or scroll to move along it,
tap a print to bring it forward and read the note underneath, and the arc
creeps along on its own when you leave it alone.

```js
const gallery = createCircularGallery(document.getElementById('albumGallery'), {
  items: [{ image: 'photo.jpg', text: 'A title', description: '…', aspect: 0.75 }],
  bend: 2.2,
  onItemClick: (item, index) => {}
});
```

It is a plain JavaScript file — no framework, no build step. If a browser has
no WebGL2 the album quietly falls back to a CSS 3D carousel instead, so the
prints always work.

Useful options: `bend` (how curved the arc is), `gap`, `wave` (the ripple when
you fling it), `autoScroll` (the idle drift), `snap`, `shadow`, `grayscale`,
`showTitles`, `captionSpace` (room reserved for the note under an open print),
and `decorate` (a function returning the canvas to use as a card texture).

### The map

`x` and `y` are coordinates inside the 1000 × 600 map drawing. The route line
redraws itself through the pins automatically, in whatever order you list them.

```js
pins: [
  { x: 214, y: 372, place: 'The Green Room', date: '…', note: '…', img: '5' },
],
```

The islands themselves are SVG paths in `index.html` — search for `map__land` if
you want to redraw the map itself.

### The wish and the finale

```js
wish:   { candles: 3, hint: '…', button: 'Blow it out', note: { title: '…', body: '…' } },
finale: { name: 'Bellendaa', message: '…', signOff: 'Yours, always' },
```

---

## The music

`music.mp3` is looped. The current track is about 41 seconds — long enough for a
chapter, short for the whole journey, so a longer track would serve it better.
Drop a new file over `music.mp3` and it will pick it up.

Browsers refuse to play audio before the user interacts with the page, so the
music starts on the first tap — the moment the seal breaks. If it still gets
blocked, the note in the corner becomes a play button.

---

## The countdown

The gift is sealed until the birthday. A countdown sheet covers the whole page,
counting down to the third of June, and steps aside for the birthday itself:

| Date | What happens |
|---|---|
| 3 June | The countdown is gone. The gift opens. |
| 4 – 5 June | Still open. |
| 6 June | The countdown comes back, counting down to next year's 3 June. |
| Every other day of the year | The countdown is up. The gift cannot be opened. |

It is set in `content.js`:

```js
countdown: {
  enabled: true,
  month: 6,        // 1-based month of the birthday (6 = June)
  day: 3,          // the birthday itself
  returnsOn: 6,    // the day of June the countdown comes back
  kicker: 'A little something, waiting for you',
  title: 'The wait is nearly over',
  body: 'Something of yours is waiting…',
  skip: 'Read it anyway',
  signOff: '— I will wait. You open it.',
},
```

The **Read it anyway** button opens the gift early, for this visit. It is
remembered for the rest of the browser session, so a refresh will not lock it
again — but a new visit starts the wait over.

The countdown is also live: if the page is left open and the clock rolls past
midnight on 3 June, the sheet lifts itself and the gift opens. Leave it open
over 5 June and it comes back on the 6th.

To see the gift while you are still waiting, either press **Read it anyway** or
set `enabled: false` in `content.js` while you are working on it.

---

## Blowing out the candles

The **Blow it out** button asks for microphone access and watches the audio graph
for a sustained puff of air. Each breath snuffs one candle. If the microphone is
unavailable or permission is declined, tapping the cake does the same thing.

Nothing is recorded and nothing leaves the device.

---

## Fonts

Loaded from Google Fonts, four faces with four strictly separated jobs:

| Face | Used for |
|---|---|
| **Fraunces** | Display — the name, the chapter titles, the letter date. |
| **Karla** | Body copy, buttons, labels. |
| **Caveat** | Handwriting — captions, the signature, the map notes. |
| **Courier Prime** | Postal meta — postmarks, dates, place names. |

To use fewer, edit the `<link>` in `index.html` and the `--f-*` variables at the
top of `style.css`.

---

## Accessibility and motion

- Every interaction works from the keyboard. <kbd>←</kbd> / <kbd>→</kbd> move
  through the prints, <kbd>Enter</kbd> or <kbd>Space</kbd> opens one,
  <kbd>Esc</kbd> closes the map note or the open print.
- Focus is visible everywhere, and the scene changes are announced to screen
  readers. The gallery keeps a hidden, focusable list of every print, so a
  screen reader can walk the album one item at a time.
- `prefers-reduced-motion: reduce` is respected: the letter appears at once
  instead of typing, the arc does not drift or ripple, the print opens without
  the animation, and the drifting paper stops.
- The photos are never cropped, and each one has alt text from `content.js`.

---

## Deploying it

Any static host will do — GitHub Pages, Netlify, Cloudflare Pages, Vercel, or a
folder on a USB stick. There is nothing to build.

Upload the whole folder. `images/opt/` is generated but harmless to include;
dropping it (and the matching `images/opt/…` references in `script.js`) would
save about 2 MB, at the cost of loading the full-size photos.
