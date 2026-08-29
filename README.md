# Trivial Night

Two-screen buzzer trivia. The TV holds the game, phones are the controllers.

- **`index.html`** — the screen. Open it on the TV. It runs the lobby, shows the
  questions and does all the scoring.
- **`play.html`** — the controller. Players open it on their phones, type the
  four-letter code from the TV and a name.

Questions and answers only ever appear on the TV. Phones show four numbered
plates, colour-matched to the TV, so everyone plays with their head up.

## Mode A — everyone answers

Every player answers within the timer; each correct answer scores a point. A
question closes when everyone has answered or the clock runs out, whichever
comes first. The first player to join is the admin and starts the game.

Mode B, the buzzer race with point penalties, is not built yet.

## Running it

1. Push these files to the repository root and enable GitHub Pages
   (**Settings → Pages → Deploy from a branch → `main` / root**).
2. Open the Pages URL on the TV. Pick a category, difficulty, timer and length,
   then **Open the lobby**.
3. Players go to the same URL with `play.html` on the end.

Everything is served static. The Firebase Realtime Database is only a postbox —
it carries the lobby state, who has joined and which number each player pressed.
Nothing else.

## The question bank

`questions.en.json` ships with 24 hand-written questions so the game runs
immediately. For the full set:

```bash
node tools/fetch-opentdb.mjs
```

That pulls roughly five thousand questions from the Open Trivia Database into
the same file. It takes several minutes — the API is rate-limited — and only
needs doing once.

For the Greek version, translate a subset into `questions.el.json`. Skip
anything resting on English wordplay or anglophone pop culture; those questions
do not survive translation, and some distractors stop being wrong.

## Before the repository goes public

The database is currently in **test mode**, which means anyone holding the URL
can read and write it, and that expires after 30 days. Replace the rules with
`database.rules.json` in **Firebase → Realtime Database → Rules**.

Be clear about what those rules do and do not do: they scope access to
four-letter lobby paths and constrain the shape of a player record. They do not
authenticate anybody. Someone who knows a live lobby code could still write to
that lobby. Closing that properly needs Firebase anonymous authentication,
which is worth adding if this ever leaves the family.

## Attribution

Question data from the [Open Trivia Database](https://opentdb.com), used under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Files derived
from it, translations included, carry the same licence.
