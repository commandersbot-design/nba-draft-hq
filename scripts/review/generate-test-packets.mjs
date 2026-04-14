import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

const CORE_TRAITS = [
  'Advantage Creation',
  'Advantage Conversion',
  'Playmaking',
  'Processing & Feel',
  'Off-Ball Leverage',
  'Shooting Pressure',
  'Scalability',
  'Defensive Range',
];

const TRAIT_ALIASES = {
  'Advantage Creation': ['Advantage Creation'],
  'Advantage Conversion': ['Advantage Conversion', 'Decision Making'],
  Playmaking: ['Playmaking', 'Passing Creation'],
  'Processing & Feel': ['Processing & Feel', 'Processing Speed', 'Decision Making'],
  'Off-Ball Leverage': ['Off-Ball Leverage', 'Off-Ball Value'],
  'Shooting Pressure': ['Shooting Pressure', 'Shooting Gravity'],
  Scalability: ['Scalability'],
  'Defensive Range': ['Defensive Range', 'Defensive Versatility'],
};

async function readJson(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  return JSON.parse(await fs.readFile(absolutePath, 'utf8'));
}

function average(values) {
  return values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)) : null;
}

function toNumber(value, fallback = 0) {
  if (typeof value === 'string') {
    const normalized = Number.parseFloat(value.replace('%', ''));
    return Number.isFinite(normalized) ? normalized : fallback;
  }
  return Number.isFinite(value) ? value : fallback;
}

function band(score) {
  if (score >= 8.8) return 'Elite';
  if (score >= 7.8) return 'Strong';
  if (score >= 6.8) return 'Solid';
  if (score >= 5.8) return 'Swing';
  return 'Developmental';
}

function confidenceLabel(rank, classYear) {
  if (/^\d{4}$/.test(classYear) || rank > 55) return 'Medium';
  if (rank <= 20) return 'High';
  return 'Medium-High';
}

function normalizeTraits(prospect) {
  const supplied = Array.isArray(prospect.traits) ? prospect.traits : [];
  const byName = Object.fromEntries(supplied.map((trait) => [trait.name, trait]));

  return CORE_TRAITS.map((name) => {
    const aliases = TRAIT_ALIASES[name] || [name];
    const matches = aliases.map((alias) => byName[alias]).filter(Boolean);
    const numericScores = matches
      .map((trait) => Number(trait.score))
      .filter((value) => Number.isFinite(value))
      .map((value) => value / 10);
    const score = average(numericScores) ?? 6.0;

    return {
      name,
      score,
      band: band(score),
      confidence: matches.map((trait) => trait.confidence).find(Boolean) || confidenceLabel(prospect.rank, prospect.classYear),
      note: matches.map((trait) => trait.note).find(Boolean) || `${name} is currently modeled as a ${band(score).toLowerCase()} signal.`,
    };
  });
}

function deriveArchetype(prospect, traits) {
  const traitByName = Object.fromEntries(traits.map((trait) => [trait.name, trait.score]));

  if (prospect.position.includes('PG')) {
    return {
      archetype: traitByName['Advantage Creation'] >= 7.3 ? 'Primary Creator' : 'Secondary Creator',
      subArchetype: traitByName.Playmaking >= 7.4 ? 'Table Setter' : traitByName['Advantage Creation'] >= 7.8 ? 'Advantage Guard' : 'Scoring Specialist',
    };
  }

  if (prospect.position.includes('SF') || prospect.position.includes('SG')) {
    return {
      archetype: traitByName['Off-Ball Leverage'] >= 7.2 ? 'Connector' : 'Secondary Creator',
      subArchetype: traitByName['Shooting Pressure'] >= 7.6 ? 'Movement Shooter' : traitByName['Advantage Creation'] >= 7.2 ? 'Rim Pressure Wing' : 'Connector Forward',
    };
  }

  return {
    archetype: traitByName['Shooting Pressure'] >= 6.8 ? 'Stretch Big' : 'Play Finisher',
    subArchetype: traitByName['Defensive Range'] >= 7.4 ? 'Switch Big' : traitByName.Playmaking >= 6.8 ? 'Connector Forward' : 'Interior Finisher',
  };
}

function statPercentiles(profileStats) {
  return profileStats?.percentiles || {};
}

function traitEvidence(traits, percentiles, stats) {
  const advanced = stats?.advanced || {};
  const season = stats?.season || {};
  const usage = toNumber(advanced.usage);
  const assists = toNumber(season.assists);
  const points = toNumber(season.points);
  const assistRate = toNumber(advanced.assistRate);
  const turnoverRate = Math.max(toNumber(advanced.turnoverRate), 0.1);
  const evidenceMap = {
    'Advantage Creation': [
      `Usage ${advanced.usage || '--'}`,
      `Box Creation ${((assists * 3.1) + (usage * 0.35)).toFixed(1)}`,
      `Rim Pressure Proxy ${((points * 0.9) + (usage * 0.22)).toFixed(1)}`,
    ],
    'Advantage Conversion': [
      `TS ${advanced.trueShooting || '--'}`,
      `3P ${advanced.threePct || '--'}`,
      `FT ${advanced.ftPct || '--'}`,
    ],
    Playmaking: [
      `AST% ${advanced.assistRate || '--'}`,
      `APG ${season.assists || '--'}`,
      `AST pct ${percentiles.assistsPerGame ?? '--'}th`,
    ],
    'Processing & Feel': [
      `AST/TO ${(assistRate / turnoverRate).toFixed(2)}`,
      `TOV% ${advanced.turnoverRate || '--'}`,
      `Read lane ${percentiles.turnoversPerGame ?? '--'}th`,
    ],
    'Off-Ball Leverage': [
      `TS ${advanced.trueShooting || '--'}`,
      `3P ${advanced.threePct || '--'}`,
      `Role fit ${prospectRoleHint(stats)}`,
    ],
    'Shooting Pressure': [
      `3P ${advanced.threePct || '--'}`,
      `FT ${advanced.ftPct || '--'}`,
      `Usage ${advanced.usage || '--'}`,
    ],
    Scalability: [
      `TS ${advanced.trueShooting || '--'}`,
      `Usage ${advanced.usage || '--'}`,
      `BPM ${advanced.bpm || '--'}`,
    ],
    'Defensive Range': [
      `STL ${season.steals || '--'}`,
      `BLK ${season.blocks || '--'}`,
      `BPM ${advanced.bpm || '--'}`,
    ],
  };

  return Object.fromEntries(traits.map((trait) => {
    const evidence = evidenceMap[trait.name] || ['--'];
    return [trait.name, {
      strongest: evidence.slice(0, 2).join(' · '),
      weakest: evidence.slice(-2).join(' · '),
      confidence: trait.confidence,
    }];
  }));
}

function prospectRoleHint(stats) {
  const usage = Number(stats?.advanced?.usage || 0);
  if (usage >= 28) return 'high-usage';
  if (usage >= 22) return 'secondary';
  return 'connector';
}

function buildOutputs(prospect, traits, percentiles) {
  const traitByName = Object.fromEntries(traits.map((trait) => [trait.name, trait.score]));
  const topTraits = [...traits].sort((left, right) => right.score - left.score);
  const strengths = [];
  const weaknesses = [];

  if (traitByName['Advantage Creation'] >= 7.6) strengths.push('Paint Touch Creator - consistently bends the defense off the bounce');
  if (traitByName['Advantage Conversion'] >= 7.4) strengths.push('Advantage Converter - turns tilted possessions into efficient results');
  if (traitByName.Playmaking >= 7.4) strengths.push('Table Setter - creates clean passing outcomes when the floor shifts');
  if (traitByName['Processing & Feel'] >= 7.4) strengths.push('Fast Processor - keeps possessions organized and on time');
  if (traitByName['Off-Ball Leverage'] >= 7.4) strengths.push('Connector Value - contributes without needing every touch');
  if (traitByName['Shooting Pressure'] >= 7.4) strengths.push('Warps Spacing - changes coverage with real shot pressure');
  if (traitByName['Defensive Range'] >= 7.4) strengths.push('Switchable Coverage - projects across multiple defensive asks');
  if (traitByName.Scalability >= 7.4) strengths.push('Plug-and-Play - profile fits winning lineups without perfect conditions');

  if (strengths.length === 0 && topTraits[0]) strengths.push(`${topTraits[0].name} Base - this is still the cleanest current value driver in the profile`);
  if (strengths.length === 1 && topTraits[1]) strengths.push(`${topTraits[1].name} Support - secondary pathway that keeps the role viable`);
  if (strengths.length === 2 && topTraits[2]) strengths.push(`${topTraits[2].name} Stability - gives the profile another playable hook`);

  if (traitByName['Shooting Pressure'] <= 6.1) weaknesses.push('Low-Gravity Shooter - defenders can still cheat the jumper');
  if (traitByName['Defensive Range'] <= 6.1) weaknesses.push('Defensive Role Question - coverage band is still narrower than the role asks');
  if (traitByName['Processing & Feel'] <= 6.1) weaknesses.push('Read-Speed Concern - decisions still lag at higher offensive speed');
  if (traitByName.Scalability <= 6.1) weaknesses.push('Role-Dependent Profile - the pathway tightens if usage conditions shrink');
  if (traitByName.Playmaking <= 6.1 && prospect.position.includes('PG')) weaknesses.push('Table-Setting Concern - lead guard reps still need cleaner creation for others');
  if (weaknesses.length === 0) {
    const lowTrait = [...traits].sort((left, right) => left.score - right.score)[0];
    weaknesses.push(`${lowTrait.name} Question - still the softest part of the current NBA pathway`);
  }

  const swingSkill = traitByName['Advantage Creation'] >= 7.5 && traitByName['Shooting Pressure'] <= 6.6
    ? 'Shooting Pressure'
    : traitByName['Advantage Creation'] >= 7.3 && traitByName['Advantage Conversion'] <= 6.6
      ? 'Advantage Conversion'
      : traitByName['Defensive Range'] <= 6.1
        ? 'Defensive Range'
        : traitByName['Processing & Feel'] <= 6.1
          ? 'Processing & Feel'
          : CORE_TRAITS.slice().sort((left, right) => traitByName[left] - traitByName[right])[0];

  const topStrength = strengths[0]?.split(' - ')[0] || 'best value driver';
  const topWeakness = weaknesses[0]?.split(' - ')[0] || swingSkill;
  const summarySentence = `${prospect.position} ${prospect.archetypeBase.toLowerCase()} with ${topStrength.toLowerCase()} as the cleanest value driver, but the outcome still depends on whether ${topWeakness.toLowerCase()} stabilizes.`;
  const whyRankedHere = `Ranked highly because ${topStrength.toLowerCase()} gives the profile real NBA utility, held back by ${topWeakness.toLowerCase()}.`;
  const finalScore = Number((traits.reduce((sum, trait) => sum + trait.score, 0) / traits.length).toFixed(1));

  return {
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.slice(0, 2),
    swingSkill,
    summarySentence,
    whyRankedHere,
    finalScore,
    tier: finalScore >= 8.1 ? 'Tier 1 model' : finalScore >= 7.4 ? 'Tier 2 model' : finalScore >= 6.8 ? 'Tier 3 model' : 'Tier 4 model',
  };
}

function positionFamily(position) {
  if (position.includes('PG')) return 'guard';
  if (position.includes('C') || position.includes('PF')) return 'big';
  return 'wing';
}

function draftBand(rank) {
  if (rank <= 5) return 'top-5';
  if (rank <= 14) return 'lottery';
  if (rank <= 30) return 'first-round';
  return 'board';
}

function buildComps(prospect, historical) {
  const family = positionFamily(prospect.position);
  const band = draftBand(prospect.rank);

  return historical
    .map((entry) => {
      let score = 0;
      if ((entry.archetype || '').toLowerCase().includes((prospect.archetypeBase || '').split(' ')[0].toLowerCase())) score += 3;
      if ((entry.positionFamily || '').toLowerCase() === family) score += 2;
      if ((entry.draftSlotBand || '').toLowerCase() === band) score += 2;
      if ((entry.outcomeTier || '').toLowerCase().includes('tier 1')) score += 1;
      return { ...entry, score };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 6)
    .map((entry, index) => ({
      name: entry.name,
      type: compLabel(entry, index),
      reason: `${entry.archetype} · ${entry.roleOutcome} · cohort score ${entry.score}`,
    }));
}

function compLabel(entry, index) {
  if (index === 0 && /tier 1|tier 2/i.test(entry.outcomeTier || '')) return 'High outcome';
  if (/tier 4|tier 5/i.test(entry.outcomeTier || '')) return 'Low outcome';
  if (/starter|rotation/i.test(entry.roleOutcome || '')) return 'Median';
  return 'Style match';
}

async function main() {
  const prospects = await readJson('src/data/prospects.json');
  const profileStats = await readJson('src/data/profileStats.json');
  const historical = await readJson('src/data/historicalProspects.json');

  const testIds = ['darrynpeterson', 'ajdybantsa', 'cameronboozer', 'dariusacuff', 'keshawnmurphy'];
  const players = testIds.map((id) => prospects.find((prospect) => prospect.id === id)).filter(Boolean);

  const markdown = [
    '# Prospera 5-Player Review Packets',
    '',
    'Generated before broad rollout of the locked trait/model system.',
    '',
  ];

  for (const player of players) {
    const traits = normalizeTraits(player);
    const profile = profileStats[player.id] || {};
    const percentiles = statPercentiles(profile);
    const stats = profile.stats || { season: {}, advanced: {} };
    const archetype = deriveArchetype(player, traits);
    const outputs = buildOutputs(player, traits, percentiles);
    const evidence = traitEvidence(traits, percentiles, stats);
    const comps = buildComps(player, historical);

    markdown.push(`## ${player.name}`);
    markdown.push('');
    markdown.push(`Player: ${player.name}`);
    markdown.push(`Archetype: ${archetype.archetype}`);
    markdown.push(`Sub-Archetype: ${archetype.subArchetype}`);
    markdown.push(`Final Score: ${outputs.finalScore}`);
    markdown.push(`Tier: ${outputs.tier}`);
    markdown.push('');
    markdown.push('Trait Scores:');
    traits.forEach((trait) => markdown.push(`- ${trait.name}: ${trait.score}`));
    markdown.push('');
    markdown.push('Strengths:');
    outputs.strengths.forEach((item, index) => markdown.push(`${index + 1}. ${item}`));
    markdown.push('');
    markdown.push('Weaknesses:');
    outputs.weaknesses.forEach((item, index) => markdown.push(`${index + 1}. ${item}`));
    markdown.push('');
    markdown.push(`Swing Skill: ${outputs.swingSkill}`);
    markdown.push('');
    markdown.push(`Summary Sentence: ${outputs.summarySentence}`);
    markdown.push('');
    markdown.push(`Why Ranked Here: ${outputs.whyRankedHere}`);
    markdown.push('');
    markdown.push('Trait Evidence:');
    traits.forEach((trait) => {
      markdown.push(`- ${trait.name}:`);
      markdown.push(`  - strongest supporting stats: ${evidence[trait.name].strongest}`);
      markdown.push(`  - weakest supporting stats: ${evidence[trait.name].weakest}`);
      markdown.push(`  - confidence level: ${evidence[trait.name].confidence}`);
    });
    markdown.push('');
    markdown.push('Comps:');
    comps.forEach((comp) => markdown.push(`- ${comp.name} | ${comp.type} | ${comp.reason}`));
    markdown.push('');
  }

  const outputPath = path.join(repoRoot, 'docs', 'TEST_PLAYER_PACKETS.md');
  await fs.writeFile(outputPath, `${markdown.join('\n')}\n`, 'utf8');
  process.stdout.write(`Wrote 5-player review packet to ${outputPath}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
