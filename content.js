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

      'There is a stack of prints further down. Some of them are blurry. One of them ' +
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
    intro: 'Nineteen prints, kept. Open each one.',
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
        note: 'You make an ordinary room worth a photograph.',
      },
      {
        id: '6',
        ratio: '1 / 1',
        w: 370,
        title: 'Time Check',
        caption: 'Pink watch, better lighting than the first one.',
        place: 'The hallway',
        date: 'A random Tuesday',
        note: 'You are never late for the things that matter.',
      },
      {
        id: '10',
        ratio: '1 / 1',
        w: 370,
        title: 'The Red Curtain',
        caption: 'A good light and a red curtain. That is the whole secret.',
        place: 'Behind a curtain',
        date: 'An afternoon',
        note: 'You are beautiful in every light, especially the honest ones.',
      },
      {
        id: '19',
        ratio: '1 / 1',
        w: 370,
        title: 'Close Enough',
        caption: 'Half a second. That is all it took.',
        place: 'Anywhere',
        date: 'Any moment',
        note: 'You are beautiful at every distance. Mostly the close ones.',
      },
      {
        id: '9',
        ratio: '3 / 2',
        w: 440,
        title: 'Two Empty Chairs',
        caption: 'Arms crossed. Faces straight. Total chaos.',
        place: 'A classroom',
        date: 'Between classes',
        note: 'You make silence feel like something good.',
      },
      {
        id: '12',
        ratio: '3 / 4',
        w: 340,
        title: 'The Lanyard',
        caption: 'You in the corridor, mid-something, not looking at anyone.',
        place: 'Between lectures',
        date: 'A long day',
        note: 'You are always walking toward something worth reaching.',
      },
      {
        id: '13',
        ratio: '3 / 4',
        w: 340,
        title: 'Back Row',
        caption: 'Sharpest pen in the room, and you were not using it.',
        place: 'A lecture hall',
        date: 'A lecture',
        note: 'You are sharper than you let on, and kinder than anyone expects.',
      },
      {
        id: '18',
        ratio: '4 / 3',
        w: 440,
        title: 'The White Coats',
        caption: 'Two white coats, one EXIT sign, zero seriousness.',
        place: 'The corridor',
        date: 'Graduation week',
        note: 'You are going to be very good at whatever comes next. You are already good at everything you have tried.',
      },
      {
        id: '15',
        ratio: '1 / 1',
        w: 370,
        title: 'The Plush Pile',
        caption: 'Buried under the soft ones.',
        place: 'Your bed',
        date: 'A lazy Sunday',
        note: 'You are allowed to take up space. You are allowed to rest.',
      },
      {
        id: '11',
        ratio: '3 / 4',
        w: 340,
        title: 'The Big One',
        caption: 'One drink, four straws, one crushed ice.',
        place: 'A café',
        date: 'Too hot to be outside',
        note: 'You are allowed to want the biggest thing on the menu.',
      },
      {
        id: '2',
        ratio: '9 / 16',
        w: 280,
        title: 'The Roommate',
        caption: 'A serious portrait of a very unserious dog.',
        place: 'Home',
        date: 'Right after breakfast',
        note: 'You are trusted by everyone who meets you. Even the ones who cannot talk.',
      },
      {
        id: '3',
        ratio: '9 / 16',
        w: 280,
        title: 'Sunday Uniform',
        caption: 'Pajamas with tiny apples. Off duty.',
        place: 'Your parents place',
        date: 'A slow Sunday',
        note: 'You are most yourself when you stop trying. That version is my favourite.',
      },
      {
        id: '16',
        ratio: '4 / 3',
        w: 440,
        title: 'Ring Light',
        caption: 'Too dark, badly lit, and somehow still my favourite one.',
        place: 'A dark room',
        date: 'Some night',
        note: 'You never needed a spotlight to be worth looking at.',
      },
      {
        id: '8',
        ratio: '4 / 7',
        w: 280,
        title: 'Good Night',
        caption: 'Four good nights, saved for later.',
        place: 'From the phone',
        date: 'Most nights',
        note: 'You are the goodnight I look forward to.',
      },
      {
        id: '14',
        ratio: '3 / 4',
        w: 340,
        title: 'The Bracelet',
        caption: 'The one you never take off.',
        place: 'Your wrist',
        date: 'Any day',
        note: 'You hold on to what matters. You are what people hold on to.',
      },
      {
        id: '7',
        ratio: '4 / 7',
        w: 280,
        title: 'Under the Lights',
        caption: 'You, and me, under far too many fairy lights.',
        place: 'The night market',
        date: 'An evening out',
        note: 'You make a night out of nothing. You make everything an occasion.',
      },
      {
        id: '20',
        ratio: '3 / 4',
        w: 340,
        title: 'The Roadside',
        caption: 'Cold, purple, waiting for a bus that was late.',
        place: 'The roadside',
        date: 'Dusk',
        note: 'You are always worth a message.',
      },
      {
        id: '4',
        ratio: '2 / 3',
        w: 320,
        title: 'The Chocolate Hills',
        caption: 'A hundred green mounds, and you standing in front of all of them.',
        place: 'Chocolate Hills, Bohol',
        date: 'The trip',
        note: 'You are the kind of thing you travel miles to see.',
      },
      {
        id: '1',
        ratio: '16 / 9',
        w: 460,
        title: 'The Two of Us',
        caption: 'The only one where the camera pointed at us both.',
        place: 'The canal path',
        date: 'A good afternoon',
        note: 'You are the reason I take the picture.',
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
        place: 'Chocolate Hills',
        date: 'The trip',
        note: 'Green mounds to the horizon, and the two of us in front of them.',
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
