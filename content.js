/* ==========================================================================
   THE POSTCARD JOURNAL — CONTENT FILE
   --------------------------------------------------------------------------
   Everything you might want to change lives in this one file.
   No code below this point needs to be touched to personalise the gift.

   Save the file, refresh the page, done.
   ========================================================================== */

const CONTENT = {

  /* ---------------------------------------------------------------- basics */
  meta: {
    title: 'A Postcard from This Year',
    recipient: 'Bellendaa',
    sender: '',                       // put your name here, e.g. 'Raka'
    dateLabel: '21 October 2026',
  },

  /* ------------------------------------------------- Scene 0 · the envelope */
  envelope: {
    to: 'Bellendaa',
    address: ['A very special person', 'Somewhere on this little planet'],
    sealInitial: 'B',
    hint: 'Break the seal',
    subhint: 'tap anywhere on the envelope',
  },

  /* ---------------------------------------------------- Scene 1 · the letter */
  letter: {
    kicker: 'A letter, before anything else',
    date: '21 October 2026',
    body: [
      'I wanted to give you something that would not fit in a box, so I made one instead. ' +
      'Every part of this page was put together by hand, the same way I would put together a ' +
      'scrapbook if we were sitting on the floor sorting through photographs.',

      'There is a small stack of prints further down. Some of them are blurry. One of them ' +
      'features a dog who was not invited. A couple of them are just the view, because the ' +
      'view was the point.',

      'But none of them are really about the day they were taken. They are about the ' +
      'person I was taking them with.',

      'So, happy birthday. Here is a whole year of you, kept in a place that cannot be ' +
      'scrolled away. Make a wish at the end. I will not tell you whether it comes true, ' +
      'but I will tell you that I am rooting for it loudly.',
    ],
    signature: 'With all my love,',
    signOff: '— your person',
    postmark: {
      place: 'BANDAR SERI',
      day: '21',
      month: 'OCT',
      year: '2026',
    },
  },

  /* ------------------------------------------------------ Scene 2 · the album */
  album: {
    kicker: 'Chapter Two',
    title: 'The Album',
    intro: 'Six prints, kept. Open each one.',
    hint: 'Tap a print to open it · swipe or use ← →',
    prints: [
      {
        id: '5',
        ratio: '3 / 4',
        w: 340,
        title: 'The Green Room',
        caption: 'You and the loudest wall in the world.',
        place: 'The green room',
        date: 'Some afternoon',
        note: 'Nothing happened here. That is exactly why it is on the list.',
      },
      {
        id: '6',
        ratio: '1 / 1',
        w: 370,
        title: 'Time Check',
        caption: 'Pink watch, better lighting than the first one.',
        place: 'The hallway',
        date: 'A random Tuesday',
        note: 'You were already late before you took the picture of how late you were.',
      },
      {
        id: '2',
        ratio: '9 / 16',
        w: 280,
        title: 'The Roommate',
        caption: 'A serious portrait of a very unserious dog.',
        place: 'Home',
        date: 'Right after breakfast',
        note: 'He has never once asked if I was taking a photo. He simply allowed it.',
      },
      {
        id: '3',
        ratio: '9 / 16',
        w: 280,
        title: 'Sunday Uniform',
        caption: 'Pajamas with tiny apples. Off duty.',
        place: 'Your parents place',
        date: 'A slow Sunday',
        note: 'You complained about the outfit for the whole bus ride. It was the best one.',
      },
      {
        id: '4',
        ratio: '3 / 4',
        w: 340,
        title: 'Above the Clouds',
        caption: 'Wind, altitude, and you being unreasonably brave.',
        place: 'Somewhere high up',
        date: 'The trip',
        note: 'You held onto my arm for four steps and then pretended you did not.',
      },
      {
        id: '1',
        ratio: '16 / 9',
        w: 460,
        title: 'The Two of Us',
        caption: 'The only one where the camera pointed at us both.',
        place: 'The canal path',
        date: 'A good afternoon',
        note: 'I keep this one open on my phone. Sorry, you have to live with that.',
      },
    ],
  },

  /* -------------------------------------------------------- Scene 3 · the map */
  map: {
    kicker: 'Chapter Three',
    title: 'Where We Ended Up',
    intro: 'Every good photo starts with a place. Tap a pin.',
    /* x / y are coordinates inside the 1000 x 600 map viewBox. */
    pins: [
      {
        id: 'p1',
        x: 214,
        y: 372,
        place: 'The Green Room',
        date: 'An ordinary afternoon',
        note: 'Where the first print was taken, and where a lot of ordinary afternoons happened.',
        img: '5',
      },
      {
        id: 'p2',
        x: 396,
        y: 262,
        place: 'The Canal Path',
        date: 'A good afternoon',
        note: 'We walked it three times because neither of us wanted the walk to end.',
        img: '1',
      },
      {
        id: 'p3',
        x: 604,
        y: 196,
        place: 'Somewhere High Up',
        date: 'The trip',
        note: 'Cold, windy, unreasonably worth the queue.',
        img: '4',
      },
      {
        id: 'p4',
        x: 792,
        y: 348,
        place: 'Home',
        date: 'Most days',
        note: 'The route that always ends here, usually with a dog in the way.',
        img: '2',
      },
    ],
  },

  /* ------------------------------------------------------ Scene 4 · the wish */
  wish: {
    kicker: 'Chapter Four',
    title: 'Make a Wish',
    intro: 'Three candles. One wish. Close enough.',
    hint: 'Press the button and blow at your phone, or just tap the cake.',
    button: 'Blow it out',
    tapHint: 'or tap the cake',
    candles: 3,
    note: {
      title: 'A note from the cake',
      body: 'Whatever you wished for, I hope it is already on its way, and I hope you ' +
            'know how much of it already came true this year.',
    },
  },

  /* ----------------------------------------------------- Scene 5 · the finale */
  finale: {
    kicker: 'The last page',
    title: 'Happy Birthday',
    name: 'Bellendaa',
    message:
      'Another trip around the sun, and you are still the best part of the scenery. ' +
      'Keep this page. Add to it. Come back to it on the days that need it.',
    signOff: 'Yours, always',
    stamp: {
      place: 'BANDAR SERI',
      day: '21',
      month: 'OCT',
      year: '2026',
    },
    replay: 'Start again',
    back: 'Back to the prints',
  },

  /* ------------------------------------------------------------------- UI */
  ui: {
    scroll: 'Scroll',
    next: 'Next print',
    prev: 'Previous print',
    flip: 'Open the print',
    play: 'Play music',
    pause: 'Pause music',
    openScene: 'Go to',
    musicBlocked: 'Tap the note to start the music',
  },

  /* ------------------------------------------------------------- countdown */
  /* The gift stays sealed until the birthday. The countdown covers the page
     from 6 June onwards and steps aside for the three days of the birthday
     itself, then comes back for the following year.

       month      1-based month of the birthday (6 = June)
       day        the day of the birthday (3)
       returnsOn  the day of June the countdown comes back (6)               */
  countdown: {
    enabled: true,
    month: 6,
    day: 3,
    returnsOn: 6,
    kicker: 'A little something, waiting for you',
    title: 'The wait is nearly over',
    body: 'Something of yours is waiting. It opens on the third of June, and not one minute before.',
    skip: 'Read it anyway',
    signOff: '— I will wait. You open it.',
  },
};
