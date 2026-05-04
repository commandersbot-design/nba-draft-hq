#!/usr/bin/env node
// Build a name -> ESPN headshot URL manifest for the 2026 prospect class.
// Reads src/data/prospects.json for names and schools, queries ESPN's site
// search per prospect, filters to mens-college-basketball, and writes
// src/data/prospectHeadshots.json. Re-runnable; existing entries are kept
// unless --force is set.

const fs = require('fs');
const path = require('path');

const PROSPECTS_PATH = path.join(__dirname, '..', '..', 'src', 'data', 'prospects.json');
const OUTPUT_PATH = path.join(__dirname, '..', '..', 'src', 'data', 'prospectHeadshots.json');
const SEARCH = 'https://site.web.api.espn.com/apis/search/v2';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
};
const DELAY_MS = 400;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(argv) {
  const args = { force: false };
  for (const value of argv) if (value === '--force') args.force = true;
  return args;
}

function normalize(value) {
  return String(value || '').toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function bestMatch(results, prospect) {
  if (!Array.isArray(results) || results.length === 0) return null;
  const wantedName = normalize(prospect.name);
  const wantedSchool = normalize(prospect.school);
  const candidates = results.filter((entry) => entry.defaultLeagueSlug === 'mens-college-basketball' || entry.sport === 'basketball');
  for (const entry of candidates) {
    const entryName = normalize(entry.displayName);
    if (entryName === wantedName) {
      const subtitle = normalize(entry.subtitle);
      if (!wantedSchool || !subtitle || subtitle.includes(wantedSchool) || wantedSchool.includes(subtitle.split(' ')[0])) {
        return entry;
      }
    }
  }
  // Fallback: name match without school check
  for (const entry of candidates) {
    if (normalize(entry.displayName) === wantedName) return entry;
  }
  return null;
}

async function lookup(prospect) {
  const params = new URLSearchParams({ query: prospect.name, limit: '10', mode: 'prefix', type: 'player' });
  const response = await fetch(`${SEARCH}?${params.toString()}`, { headers: HEADERS });
  if (!response.ok) throw new Error(`ESPN ${response.status}`);
  const payload = await response.json();
  const players = payload.results?.find((bucket) => bucket.type === 'player')?.contents || [];
  return bestMatch(players, prospect);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const prospects = JSON.parse(fs.readFileSync(PROSPECTS_PATH, 'utf8'));
  let manifest = {};
  if (fs.existsSync(OUTPUT_PATH)) {
    manifest = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
  }
  let hits = 0;
  let skipped = 0;
  let misses = [];
  for (const prospect of prospects) {
    if (manifest[prospect.name]?.headshotUrl && !args.force) {
      skipped++;
      continue;
    }
    process.stdout.write(`SEARCH ${prospect.name.padEnd(28)}…`);
    try {
      const match = await lookup(prospect);
      if (match) {
        manifest[prospect.name] = {
          headshotUrl: match.image?.default,
          espnId: match.uid,
          espnPage: match.link?.web,
          subtitle: match.subtitle,
        };
        console.log(` ✓ ${match.image?.default ? 'image' : 'no-image'} (${match.subtitle || '—'})`);
        if (match.image?.default) hits++;
      } else {
        console.log(' ✗ no match');
        misses.push(prospect.name);
      }
    } catch (error) {
      console.log(` ! ${error.message}`);
      misses.push(prospect.name);
    }
    await sleep(DELAY_MS);
  }
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\nWrote manifest to ${path.relative(process.cwd(), OUTPUT_PATH)}`);
  console.log(`Hits: ${hits} · Skipped: ${skipped} · Misses: ${misses.length}`);
  if (misses.length > 0) console.log('Misses:', misses.join(', '));
}

if (require.main === module) {
  main().catch((error) => { console.error(error); process.exit(1); });
}
