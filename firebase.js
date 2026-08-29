// Firebase setup shared by the TV screen and the player screen.
// These keys are public identifiers, not secrets. Access is governed by
// the Realtime Database rules in database.rules.json.

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getDatabase, ref, get, set, update, remove, onValue, onDisconnect, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCCJzcLIlS3FZKF9Z2j3wUdOaCN9ldNnis",
  authDomain: "trivial-night.firebaseapp.com",
  databaseURL: "https://trivial-night-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "trivial-night",
  storageBucket: "trivial-night.firebasestorage.app",
  messagingSenderId: "3379024617",
  appId: "1:3379024617:web:98bcfee475990141e89678"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// The four plate colours, bound to answer positions 1-4.
export const PLATES = ["p1", "p2", "p3", "p4"];

// Clock correction. Phones and the TV disagree about the time by anything up
// to a few seconds, so every countdown is measured against Firebase's clock.
let skew = 0;
onValue(ref(db, ".info/serverTimeOffset"), (snap) => { skew = snap.val() || 0; });
export const now = () => Date.now() + skew;

// Lobby codes: four letters, ambiguous shapes removed so nobody types O for 0.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";
export function makeCode() {
  let out = "";
  const r = crypto.getRandomValues(new Uint32Array(4));
  for (let i = 0; i < 4; i++) out += ALPHABET[r[i] % ALPHABET.length];
  return out;
}

export function makeId() {
  return crypto.getRandomValues(new Uint32Array(2)).join("-");
}

export function shuffle(list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// OpenTDB serves HTML entities. Decode them before anything reaches the screen.
export function decode(text) {
  const el = document.createElement("textarea");
  el.innerHTML = text;
  return el.value;
}

export { db, ref, get, set, update, remove, onValue, onDisconnect, serverTimestamp };
