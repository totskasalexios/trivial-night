# Trivial Night

A party trivia game for one big screen and a pile of phones. The TV shows the
question and the four answers; each player's phone is just a numbered pad.
Nothing to install — the board is a web page, the players scan a QR code.

Built from static files. Realtime state runs through Firebase Realtime
Database; everything else is plain HTML, CSS and ES modules.

---

## How it works

| Screen | File | Does |
|---|---|---|
| Board (TV / laptop) | `index.html` | Setup, lobby code and QR, questions, answers, timer, scores |
| Player (phone) | `play.html` | Join by code and name, then four numbered buttons |

The board opens a four-letter lobby code. Players join at
`…/play.html`, either by typing the code or by scanning the QR, which carries
the code for them. The first player to join is the admin and starts the game.

Answer text never reaches the phones. That is deliberate — everyone has to look
up at the TV.

## Playing

1. Open `index.html` on the TV. Choose categories, language, mode, difficulty,
   timer and question count, then **Open the lobby**.
2. Players scan the QR or go to the address shown and enter a name.
3. The first player in taps **Start the game**.
4. Between rounds the admin advances from their phone.

Board controls: arrow keys move the focus, `Enter`/`Esc` pauses and resumes a
running question. That maps onto a TV remote's D-pad and OK button, so the
board is usable from the sofa.

## Game modes

**Everyone answers.** All players get the pad. Tap a number, then **Lock in** —
nothing is submitted until it is locked, so a mis-tap costs nothing. A correct
answer is one point. The question closes when everyone has answered or the
clock runs out, whichever comes first.

**Buzzer.** One buzz button. The first write to land at the server takes it,
and that player answers against a fresh answer clock rather than the remainder
of the question timer. Correct is +1 and ends the question; wrong is −1, burns
that answer, locks the player out of the question and reopens the buzzers for
whoever is left.

## Setup options

- **Categories** — toggled individually. Sports and Anime start off.
- **Language** — English or Ελληνικά, each with its own bank.
- **Question order** — random, or the player on the lowest score picks the
  category from three offered (ties broken at random).
- **Difficulty** — mixed, easy, medium or hard.
- **Seconds per question** — 10 / 20 / 30 / 50, custom up to 300, or off. With
  the timer off a question only closes once every player is in.
- **Questions in the game** — 10 to 50, custom up to 200.
- **Sound** — synthesised effects, no files to load.

## Repository layout

```
index.html            board
play.html             player pad
firebase.js           app init, clock skew, lobby codes, shared helpers
audio.js              synthesised effects + optional music
styles.css            both screens
qrcode.min.js         QR rendering for the lobby
questions.en.json     English bank (~2,850 questions, 12 categories)
questions.el.json     Greek bank (~1,765 questions, 11 categories)
build-bank.html       in-browser bank builder
tools/
  fetch-opentdb.mjs   the same pull as a Node script
audio/                optional mp3 music bed — see audio/README.md
database.rules.json   Realtime Database rules
```

## Building the question bank

Both banks are committed, so this is only needed to refresh them.

```bash
node tools/fetch-opentdb.mjs      # writes questions.en.json
```

Or open `build-bank.html` in a browser and press **Start the pull**. Open
Trivia DB serves 50 questions per call and rate-limits to roughly one call
every five seconds, so a full pull takes several minutes. A session token
prevents repeats, and duplicates across overlapping filters are stripped at
the end.

Bank format:

```json
{
  "category": "General Knowledge",
  "difficulty": "easy",
  "question": "…",
  "correct_answer": "…",
  "incorrect_answers": ["…", "…", "…"]
}
```

The Greek bank is a translation of the English one. Book, film and show titles
carry the English in brackets; Video Games is left out.

## Firebase

The config in `firebase.js` holds public identifiers, not secrets — access is
governed entirely by `database.rules.json`, which confines reads and writes to
four-character lobby paths and validates player names and scores.

To point the game at your own project: create a Realtime Database, paste your
config into `firebase.js`, and deploy the rules.

```bash
firebase deploy --only database
```

Countdowns are measured against Firebase's server clock rather than the
device's, so phones and the TV agree on when a question ends. A phone that
loses signal or backgrounds itself marks itself away and clears that on
reconnection; players who stay away are swept out of the roster. Stale lobbies
older than six hours are reclaimed.

## Hosting

Any static host works. On GitHub Pages, serve the repo root: the board is at
the root URL and the player page at `/play.html`. Both must be on the same
origin, since the board builds the join URL and QR from its own address.

## Music

Optional. Drop `lobby.mp3`, `question.mp3` and `scores.mp3` into `audio/` and
they loop quietly under the matching screens. Missing files are skipped without
complaint. Use tracks you are licensed to use if the repo or the game is
public. Sound effects are synthesised at runtime and need no files.

## Licence and attribution

Questions come from the [Open Trivia Database](https://opentdb.com), licensed
**CC BY-SA 4.0**. Both `questions.en.json` and the Greek translation derived
from it carry the same licence.

QR rendering by [node-qrcode](https://github.com/soldair/node-qrcode),
© 2012 Ryan Day, MIT — see `qrcode-LICENSE.txt`.
