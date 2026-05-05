#!/usr/bin/env node
// Fallback headshot fetcher for prospects ESPN didn't have. Uses Wikipedia's
// public API to find a player's wiki page and pull the page thumbnail. Merges
// results into src/data/prospectHeadshots.json (ESPN entries are kept).

const fs = require('fs');
const path = require('path');

const PROSPECTS_PATH = path.join(__dirname, '..', '..', 'src', 'data', 'prospects.json');
const OUTPUT_PATH = path.join(__dirname, '..', '..', 'src', 'data', 'prospectHeadshots.json');
const WIKI = 'https://en.wikipedia.org/w/api.php';
const HEADERS = {
  'User-Agent': 'prospera-draft-hq/1.0 (educational; contact via github)',
  'Accept': 'application/json',
};
const DELAY_MS = 350;
const MISSES = [
  'Darius Acuff', 'Mikel Brown', 'Labaron Philon', 'Chris Cenac',
  'Karim Lopez', 'Dash Daniels', 'Morez Johnson', 'Luigi Suigo',
  'Sergio De', 'Adam Atamna', 'Jaron Pierre', 'Tarris Reed',
  'Mouhamed Faye', 'Miikka Muurinen', 'Ke Shawn Murphy', 'Ognjen Srzentic',
];

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function fetchJson(url) {
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) throw new Error(`Wiki ${response.status}`);
  return response.json();
}

async function searchPage(query) {
  const params = new URLSearchParams({
    action: 'query', list: 'search', srsearch: `${query} basketball`,
    format: 'json', srlimit: '5', origin: '*',
  });
  const payload = await fetchJson(`${WIKI}?${params.toString()}`);
  return payload.query?.search || [];
}

async function fetchPageImage(pageTitle) {
  const params = new URLSearchParams({
    action: 'query', titles: pageTitle, prop: 'pageimages',
    pithumbsize: '300', format: 'json', origin: '*',
  });
  const payload = await fetchJson(`${WIKI}?${params.toString()}`);
  const pages = payload.query?.pages || {};
  const first = Object.values(pages)[0];
  return {
    pageTitle,
    thumbnail: first?.thumbnail?.source || null,
    pageUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`,
  };
}

function normalizeName(value) {
  return String(value || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function titleMatchesPlayer(title, playerName) {
  const tn = normalizeName(title.replace(/\(.*?\)/g, ''));
  const pn = normalizeName(playerName);
  return tn === pn;
}

async function lookup(name) {
  const queries = [name, `${name} (basketball)`, `${name} basketball player`];
  for (const q of queries) {
    try {
      const results = await searchPage(q);
      for (const result of results) {
        const title = result.title;
        if (/(deletion|category|list of)/i.test(title)) continue;
        // STRICT: page title must literally match the player's name (parenthetical disambiguation allowed)
        if (!titleMatchesPlayer(title, name)) continue;
        const image = await fetchPageImage(title);
        if (image.thumbnail) return image;
        await sleep(150);
      }
    } catch (e) {
      // try next query
    }
  }
  return null;
}

async function main() {
  const prospects = JSON.parse(fs.readFileSync(PROSPECTS_PATH, 'utf8'));
  let manifest = {};
  if (fs.existsSync(OUTPUT_PATH)) manifest = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));

  // Build lookup of full names from prospects.json based on partial names.
  const byPartial = new Map();
  for (const p of prospects) {
    for (const partial of MISSES) {
      if (p.name.toLowerCase().includes(partial.toLowerCase())) {
        byPartial.set(partial, p);
      }
    }
  }

  let hits = 0;
  let misses = [];
  for (const partial of MISSES) {
    const p = byPartial.get(partial) || { name: partial };
    if (manifest[p.name]?.headshotUrl) {
      console.log(`SKIP ${p.name} (already have headshot)`);
      continue;
    }
    process.stdout.write(`SEARCH ${p.name.padEnd(28)}…`);
    const result = await lookup(p.name, p);
    if (result?.thumbnail) {
      manifest[p.name] = {
        headshotUrl: result.thumbnail,
        wikiPage: result.pageTitle,
        wikiUrl: result.pageUrl,
        source: 'wikipedia',
      };
      console.log(` ✓ ${result.pageTitle}`);
      hits++;
    } else {
      console.log(' ✗ no match');
      misses.push(p.name);
    }
    await sleep(DELAY_MS);
  }

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\nWiki hits: ${hits} · Misses: ${misses.length}`);
  if (misses.length > 0) console.log('Still missing:', misses.join(', '));
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
