// Sound for the board. Nothing here loads a file: every effect is synthesised
// on the spot, so there is nothing to download and nothing to license.
//
// Music is separate and optional. Drop mp3s into an audio/ folder next to this
// file and they play; leave the folder empty and everything stays quiet.
//
//   audio/lobby.mp3     while players are joining
//   audio/question.mp3  under the questions
//   audio/scores.mp3    over the scoreboard
//
// Browsers refuse to make noise until the page has been clicked, so unlock()
// must run inside a real click handler.

let ctx = null;
let master = null;
let enabled = true;

export function setEnabled(on) {
  enabled = on;
  if (!on) stopMusic();
  if (master) master.gain.value = on ? 0.9 : 0;
}

export function unlock() {
  if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  ctx = new Ctx();
  master = ctx.createGain();
  master.gain.value = enabled ? 0.9 : 0;
  master.connect(ctx.destination);
}

// One shaped note. Everything below is built out of these.
function note({ freq, type = "sine", start = 0, dur = 0.18, peak = 0.2, to = null }) {
  if (!ctx || !enabled) return;
  const t = ctx.currentTime + start;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);

  // Quick attack, smooth tail: a raw gate would click.
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function noise({ dur = 0.2, peak = 0.25, freq = 1200 }) {
  if (!ctx || !enabled) return;
  const t = ctx.currentTime;
  const frames = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);

  const src = ctx.createBufferSource();
  src.buffer = buf;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(peak, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  src.connect(filter).connect(gain).connect(master);
  src.start(t);
}

export const sfx = {
  // A player appears in the lobby.
  join()      { note({ freq: 520, to: 780, dur: 0.14, peak: 0.16, type: "triangle" }); },

  // The question lands on screen.
  question()  { note({ freq: 300, to: 450, dur: 0.28, peak: 0.18, type: "triangle" }); },

  // Each answer plate dropping in, a step higher than the last.
  answer(i)   { note({ freq: 380 + i * 90, dur: 0.12, peak: 0.15, type: "sine" }); },

  // A player locks an answer in. Each one a semitone above the last, so the
  // room hears the answers stacking up. Capped at an octave so a big table
  // does not end up shrieking.
  lockIn(i) {
    const step = Math.min(i, 12);
    note({ freq: 440 * Math.pow(2, step / 12), dur: 0.11, peak: 0.16, type: "triangle" });
  },

  // Timer down to its last few seconds.
  pip()       { note({ freq: 880, dur: 0.07, peak: 0.13, type: "square" }); },

  // Somebody hit the buzzer.
  buzz()      { note({ freq: 180, to: 120, dur: 0.34, peak: 0.3, type: "sawtooth" }); },

  correct() {
    [523.25, 659.25, 783.99].forEach((f, i) =>
      note({ freq: f, start: i * 0.09, dur: 0.24, peak: 0.2, type: "triangle" }));
  },

  wrong() {
    note({ freq: 320, to: 200, dur: 0.2, peak: 0.24, type: "sawtooth" });
    note({ freq: 240, to: 150, start: 0.14, dur: 0.3, peak: 0.24, type: "sawtooth" });
  },

  timeUp() {
    note({ freq: 200, to: 90, dur: 0.5, peak: 0.26, type: "sawtooth" });
    noise({ dur: 0.35, peak: 0.12, freq: 700 });
  },

  gameOver() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      note({ freq: f, start: i * 0.13, dur: 0.4, peak: 0.22, type: "triangle" }));
  }
};

// ---------- optional music ----------

let current = null;
const tracks = {};
const missing = new Set();

export function music(name) {
  if (!enabled) return;
  if (current?.name === name) return;
  stopMusic();
  if (!name || missing.has(name)) return;

  let el = tracks[name];
  if (!el) {
    el = new Audio(`audio/${name}.mp3`);
    el.loop = true;
    el.volume = 0.3;
    // No file there: give up on this track quietly and for good.
    el.addEventListener("error", () => { missing.add(name); }, { once: true });
    tracks[name] = el;
  }

  current = { name, el };
  el.play().catch(() => { missing.add(name); });
}

export function stopMusic() {
  if (!current) return;
  current.el.pause();
  current.el.currentTime = 0;
  current = null;
}
