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
| `script.js` | The engine: scene controller, audio, mic blow detection, the album carousel, the map, the confetti. |
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
    note: 'A longer note, shown on the back of the print.',
  },
],
```

`ratio` is the photo's real width-to-height ratio so nothing is ever cropped.
Measure it in any image viewer, or: `ratio: (width / height) + ' / ' + height`.
`w` controls how large the print appears — bigger for landscape photos, smaller
for tall ones.

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
  through the prints, <kbd>Enter</kbd> or <kbd>Space</kbd> turns one over,
  <kbd>Esc</kbd> closes the map note.
- Focus is visible everywhere, and the scene changes are announced to screen
  readers.
- `prefers-reduced-motion: reduce` is respected: the letter appears at once
  instead of typing, the print flips without the arc, the drifting paper stops,
  and the confetti stays still.
- The photos are never cropped, and each one has alt text from `content.js`.

---

## Deploying it

Any static host will do — GitHub Pages, Netlify, Cloudflare Pages, Vercel, or a
folder on a USB stick. There is nothing to build.

Upload the whole folder. `images/opt/` is generated but harmless to include;
dropping it (and the matching `images/opt/…` references in `script.js`) would
save about 2 MB, at the cost of loading the full-size photos.
