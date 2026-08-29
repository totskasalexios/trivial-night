// Builds questions.en.json from the Open Trivia Database.
// Run once on your own machine:  node tools/fetch-opentdb.mjs
//
// Data is CC BY-SA 4.0 — the attribution line in README.md covers it, and any
// file derived from this one (a Greek translation, for instance) inherits it.
//
// The API allows 50 questions per call and rate-limits to roughly one call
// every 5 seconds, so a full pull takes a few minutes. A session token stops
// it handing back the same question twice.

import { writeFile } from "node:fs/promises";

const API = "https://opentdb.com";
const PAGE = 50;
const PAUSE_MS = 5200;
const DIFFICULTIES = ["easy", "medium", "hard"];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function json(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} from ${url}`);
  return res.json();
}

async function main() {
  const { trivia_categories: categories } = await json(`${API}/api_category.php`);
  const { token } = await json(`${API}/api_token.php?command=request`);
  console.log(`${categories.length} categories, token acquired.`);

  const out = [];

  for (const cat of categories) {
    for (const difficulty of DIFFICULTIES) {
      let guard = 0;
      while (guard++ < 40) {
        await sleep(PAUSE_MS);
        const url = `${API}/api.php?amount=${PAGE}&category=${cat.id}`
                  + `&difficulty=${difficulty}&type=multiple`
                  + `&encode=url3986&token=${token}`;

        let data;
        try { data = await json(url); }
        catch (err) { console.warn(`  retrying: ${err.message}`); continue; }

        // 1 = no more questions for this filter, 4 = token exhausted.
        if (data.response_code === 1) break;
        if (data.response_code === 4) {
          await json(`${API}/api_token.php?command=reset&token=${token}`);
          break;
        }
        if (data.response_code !== 0 || !data.results?.length) break;

        for (const q of data.results) {
          out.push({
            category: decodeURIComponent(q.category),
            difficulty: q.difficulty,
            question: decodeURIComponent(q.question),
            correct_answer: decodeURIComponent(q.correct_answer),
            incorrect_answers: q.incorrect_answers.map(decodeURIComponent)
          });
        }
        console.log(`  ${cat.name} / ${difficulty}: +${data.results.length} (${out.length} total)`);
        if (data.results.length < PAGE) break;
      }
    }
  }

  // Same question can appear under overlapping filters; keep one of each.
  const seen = new Set();
  const unique = out.filter(q => !seen.has(q.question) && seen.add(q.question));

  await writeFile(
    new URL("../questions.en.json", import.meta.url),
    JSON.stringify(unique, null, 1)
  );
  console.log(`\nWrote ${unique.length} questions to questions.en.json`);
}

main().catch(err => { console.error(err); process.exit(1); });
