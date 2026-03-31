const http = require('http');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { BARTTORVIK_DATA, PLAYER_COMPS, PROSPECT_ANALYSIS } = require('./player-data');
const { renderTraitManager } = require('./trait-manager');
const { TRAIT_LIBRARY, getFrontendLabel } = require('./trait-library-v1');
const { renderTraitBrowser } = require('./trait-browser');

const DB_PATH = path.join(__dirname, '..', 'database', 'draft_hq.db');
const PORT = 3456;

let userCustomWeights = null;

// Database helpers
function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        db.all(sql, params, (err, rows) => {
            db.close();
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function getOne(sql, params = []) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        db.get(sql, params, (err, row) => {
            db.close();
            if (err) reject(err);
            else resolve(row);
        });
    });
}

// Scoring
function calculateScore(traits, risks, customWeights = null) {
    const DEFAULT_WEIGHTS = {
        advantage_creation: 20, decision_making: 16, shooting_gravity: 14, scalability: 14,
        defensive_versatility: 12, processing_speed: 10, passing_creation: 8, off_ball_value: 6
    };
    const weights = customWeights || DEFAULT_WEIGHTS;
    const RISK_MULTIPLIER = 1.25;
    
    let weightedScore = 0;
    let maxPossible = 0;
    
    for (const [trait, weight] of Object.entries(weights)) {
        const traitData = traits.find(t => t.category_key === trait);
        const grade = traitData ? traitData.grade : 5;
        weightedScore += grade * weight;
        maxPossible += 9 * weight;
    }
    
    const normalizedTraitScore = (weightedScore / maxPossible) * 100;
    const totalRiskPoints = risks.reduce((sum, r) => sum + (r.risk_level || 0), 0);
    const riskPenalty = totalRiskPoints * RISK_MULTIPLIER;
    const finalScore = normalizedTraitScore - riskPenalty;
    
    let tier = 'Tier 5';
    if (finalScore >= 90) tier = 'Tier 1';
    else if (finalScore >= 84) tier = 'Tier 2';
    else if (finalScore >= 76) tier = 'Tier 3';
    else if (finalScore >= 68) tier = 'Tier 4';
    
    return { weightedTraitScore: normalizedTraitScore, riskPenalty, finalBoardScore: finalScore, tier };
}

async function getBigBoard(customWeights = null, positionFilter = '', searchTerm = '') {
    let sql = 'SELECT id as player_id, first_name, last_name, position, secondary_position, college, country, height_inches, weight_lbs FROM players';
    const params = [];
    
    if (searchTerm) {
        sql += ' WHERE (first_name LIKE ? OR last_name LIKE ? OR college LIKE ?)';
        params.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
    }
    
    sql += ' ORDER BY id';
    const players = await query(sql, params);
    
    const results = [];
    for (const p of players) {
        const traits = await query('SELECT category_key, grade FROM player_trait_grades WHERE player_id = ?', [p.player_id]);
        const risks = await query('SELECT risk_key, risk_level FROM player_risk_flags WHERE player_id = ?', [p.player_id]);
        const score = calculateScore(traits, risks, customWeights);
        results.push({ ...p, ...score, traits, risks });
    }
    
    let filtered = results;
    if (positionFilter) {
        filtered = filtered.filter(p => p.position === positionFilter || p.secondary_position === positionFilter);
    }
    
    filtered.sort((a, b) => b.finalBoardScore - a.finalBoardScore);
    return filtered;
}

// THE RINGER STYLE UI
const STYLES = `
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
    :root {
        --ringer-red: #e10600;
        --ringer-black: #000;
        --ringer-dark: #121212;
        --ringer-gray: #1a1a1a;
        --ringer-light: #2a2a2a;
        --text-primary: #fff;
        --text-secondary: #a0a0a0;
        --text-muted: #666;
        --accent-green: #00d084;
        --accent-yellow: #ffc72c;
        --accent-blue: #1d75de;
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        background: var(--ringer-black);
        color: var(--text-primary);
        line-height: 1.6;
    }
    
    /* Header */
    .ringer-header {
        background: var(--ringer-black);
        border-bottom: 3px solid var(--ringer-red);
        padding: 0;
        position: sticky;
        top: 0;
        z-index: 1000;
    }
    .ringer-header-inner {
        max-width: 1400px;
        margin: 0 auto;
        padding: 16px 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .ringer-logo {
        font-size: 28px;
        font-weight: 800;
        color: var(--text-primary);
        text-decoration: none;
        letter-spacing: -0.5px;
    }
    .ringer-logo span { color: var(--ringer-red); }
    .ringer-nav {
        display: flex;
        gap: 32px;
    }
    .ringer-nav a {
        color: var(--text-secondary);
        text-decoration: none;
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        transition: color 0.2s;
    }
    .ringer-nav a:hover, .ringer-nav a.active {
        color: var(--text-primary);
    }
    
    /* Container */
    .ringer-container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 32px 24px;
    }
    
    /* Hero */
    .ringer-hero {
        background: linear-gradient(135deg, var(--ringer-dark) 0%, var(--ringer-gray) 100%);
        border-radius: 16px;
        padding: 48px;
        margin-bottom: 32px;
        position: relative;
        overflow: hidden;
    }
    .ringer-hero::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: var(--ringer-red);
    }
    .ringer-hero h1 {
        font-size: 48px;
        font-weight: 800;
        margin-bottom: 12px;
        letter-spacing: -1px;
    }
    .ringer-hero p {
        color: var(--text-secondary);
        font-size: 18px;
        max-width: 600px;
    }
    
    /* Filters */
    .ringer-filters {
        display: flex;
        gap: 16px;
        margin-bottom: 32px;
        flex-wrap: wrap;
        align-items: center;
    }
    .ringer-filter-btn {
        background: var(--ringer-gray);
        border: 1px solid var(--ringer-light);
        color: var(--text-secondary);
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        text-decoration: none;
    }
    .ringer-filter-btn:hover, .ringer-filter-btn.active {
        background: var(--ringer-red);
        border-color: var(--ringer-red);
        color: white;
    }
    .ringer-search {
        background: var(--ringer-gray);
        border: 1px solid var(--ringer-light);
        color: var(--text-primary);
        padding: 10px 16px;
        border-radius: 8px;
        font-size: 14px;
        min-width: 250px;
    }
    .ringer-search:focus {
        outline: none;
        border-color: var(--ringer-red);
    }
    
    /* Big Board Grid */
    .ringer-board {
        display: grid;
        gap: 16px;
    }
    .ringer-prospect {
        background: var(--ringer-dark);
        border-radius: 12px;
        padding: 20px 24px;
        display: grid;
        grid-template-columns: 60px 1fr auto 100px 120px;
        gap: 24px;
        align-items: center;
        transition: all 0.2s;
        border: 1px solid transparent;
    }
    .ringer-prospect:hover {
        background: var(--ringer-gray);
        border-color: var(--ringer-light);
    }
    .ringer-rank {
        font-size: 32px;
        font-weight: 800;
        color: var(--ringer-red);
        line-height: 1;
    }
    .ringer-prospect-info h3 {
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 4px;
    }
    .ringer-prospect-info h3 a {
        color: var(--text-primary);
        text-decoration: none;
    }
    .ringer-prospect-info h3 a:hover {
        color: var(--ringer-red);
    }
    .ringer-meta {
        color: var(--text-secondary);
        font-size: 14px;
    }
    .ringer-position {
        background: var(--ringer-light);
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
        color: var(--text-secondary);
    }
    .ringer-score {
        text-align: right;
    }
    .ringer-score-value {
        font-size: 28px;
        font-weight: 800;
        color: var(--text-primary);
        line-height: 1;
    }
    .ringer-score-label {
        font-size: 12px;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .ringer-tier {
        text-align: right;
    }
    .ringer-tier-badge {
        display: inline-block;
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .tier-1 { background: var(--accent-green); color: #000; }
    .tier-2 { background: var(--accent-yellow); color: #000; }
    .tier-3 { background: var(--accent-blue); color: #fff; }
    .tier-4 { background: var(--ringer-light); color: var(--text-primary); }
    .tier-5 { background: transparent; border: 1px solid var(--ringer-light); color: var(--text-muted); }
    
    /* Prospect Profile Page */
    .ringer-profile-header {
        background: linear-gradient(135deg, var(--ringer-dark) 0%, var(--ringer-gray) 100%);
        border-radius: 16px;
        padding: 48px;
        margin-bottom: 32px;
        position: relative;
    }
    .ringer-profile-header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: var(--ringer-red);
    }
    .ringer-profile-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 32px;
    }
    .ringer-profile-name {
        font-size: 56px;
        font-weight: 800;
        letter-spacing: -1px;
        margin-bottom: 8px;
    }
    .ringer-profile-meta {
        color: var(--text-secondary);
        font-size: 18px;
    }
    .ringer-profile-score {
        text-align: right;
    }
    .ringer-profile-score-value {
        font-size: 72px;
        font-weight: 800;
        color: var(--ringer-red);
        line-height: 1;
    }
    .ringer-profile-score-label {
        color: var(--text-secondary);
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    
    /* Trait Stamps */
    .ringer-stamps {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-top: 24px;
    }
    .ringer-stamp {
        background: var(--ringer-black);
        border: 2px solid var(--ringer-red);
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    /* Stats Grid */
    .ringer-stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin: 32px 0;
    }
    .ringer-stat-card {
        background: var(--ringer-dark);
        border-radius: 12px;
        padding: 24px;
        text-align: center;
    }
    .ringer-stat-value {
        font-size: 36px;
        font-weight: 800;
        color: var(--text-primary);
        margin-bottom: 4px;
    }
    .ringer-stat-label {
        font-size: 12px;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    /* Analysis Section */
    .ringer-section {
        background: var(--ringer-dark);
        border-radius: 16px;
        padding: 32px;
        margin-bottom: 24px;
    }
    .ringer-section h2 {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--ringer-light);
    }
    .ringer-analysis-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 32px;
    }
    .ringer-analysis-column h3 {
        font-size: 16px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 16px;
    }
    .ringer-analysis-column.positive h3 { color: var(--accent-green); }
    .ringer-analysis-column.negative h3 { color: var(--ringer-red); }
    .ringer-analysis-column ul {
        list-style: none;
    }
    .ringer-analysis-column li {
        padding: 12px 0;
        border-bottom: 1px solid var(--ringer-light);
        color: var(--text-secondary);
        font-size: 15px;
        line-height: 1.6;
    }
    .ringer-analysis-column li:last-child {
        border-bottom: none;
    }
    
    /* Tags */
    .ringer-tags {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 20px;
    }
    .ringer-tag {
        background: var(--ringer-light);
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
        color: var(--text-secondary);
    }
    
    /* Comp */
    .ringer-comp {
        background: var(--ringer-gray);
        border-radius: 12px;
        padding: 24px;
        margin-top: 24px;
        text-align: center;
    }
    .ringer-comp-label {
        font-size: 12px;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 8px;
    }
    .ringer-comp-name {
        font-size: 28px;
        font-weight: 800;
        color: var(--text-primary);
    }
    
    /* Responsive */
    @media (max-width: 1024px) {
        .ringer-prospect {
            grid-template-columns: 50px 1fr auto;
            gap: 16px;
        }
        .ringer-position, .ringer-tier { display: none; }
        .ringer-profile-top { flex-direction: column; }
        .ringer-profile-score { text-align: left; margin-top: 24px; }
        .ringer-analysis-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 768px) {
        .ringer-header-inner { flex-direction: column; gap: 16px; }
        .ringer-nav { gap: 20px; }
        .ringer-hero { padding: 32px 24px; }
        .ringer-hero h1 { font-size: 32px; }
        .ringer-profile-name { font-size: 36px; }
    }
</style>`;

function renderBigBoard(players, positionFilter = '', searchTerm = '', teamName = '') {
    const positionOptions = ['', 'PG', 'SG', 'SF', 'PF', 'C', 'G', 'F'].map(pos => 
        `<a href="/?pos=${pos}" class="ringer-filter-btn ${pos === positionFilter ? 'active' : ''}">${pos || 'All'}</a>`
    ).join('');
    
    const prospectRows = players.map((p, i) => {
        const pos = p.secondary_position ? `${p.position}/${p.secondary_position}` : p.position;
        const tierClass = p.tier === 'Tier 1' ? 'tier-1' : p.tier === 'Tier 2' ? 'tier-2' : p.tier === 'Tier 3' ? 'tier-3' : p.tier === 'Tier 4' ? 'tier-4' : 'tier-5';
        const tierLabel = p.tier.replace('Tier ', 'T');
        
        return `
        <div class="ringer-prospect">
            <div class="ringer-rank">${i+1}</div>
            <div class="ringer-prospect-info">
                <h3><a href="/player/${p.player_id}">${p.first_name} ${p.last_name}</a></h3>
                <div class="ringer-meta">${p.college || 'International'} • ${p.country}</div>
            </div>
            <div class="ringer-position">${pos}</div>
            <div class="ringer-score">
                <div class="ringer-score-value">${p.finalBoardScore.toFixed(1)}</div>
                <div class="ringer-score-label">Score</div>
            </div>
            <div class="ringer-tier">
                <span class="ringer-tier-badge ${tierClass}">${tierLabel}</span>
            </div>
        </div>`;
    }).join('');

    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>NBA Draft Big Board - The Ringer Style</title>${STYLES}</head>
<body>
    <header class="ringer-header">
        <div class="ringer-header-inner">
            <a href="/" class="ringer-logo">NBA <span>DRAFT</span></a>
            <nav class="ringer-nav">
                <a href="/" class="active">Big Board</a>
                <a href="/mock-draft">Mock Draft</a>
                <a href="/teams">Team Needs</a>
                <a href="/trait-library">Trait Library</a>
                <a href="/weights">Custom Rankings</a>
            </nav>
        </div>
    </header>
    
    <div class="ringer-container">
        <div class="ringer-hero">
            <h1>2026 NBA Draft Big Board</h1>
            <p>The top 100 prospects ranked by overall potential, with advanced analytics and detailed scouting reports.</p>
        </div>
        
        <div class="ringer-filters">
            ${positionOptions}
            <form action="/search" method="GET" style="margin-left: auto;">
                <input type="text" name="q" class="ringer-search" placeholder="Search prospects..." value="${searchTerm}">
            </form>
        </div>
        
        <div class="ringer-board">
            ${prospectRows}
        </div>
    </div>
</body>
</html>`;
}

function renderPlayerProfile(player, traits, risks, stats) {
    const pos = player.secondary_position ? `${player.position}/${player.secondary_position}` : player.position;
    const score = calculateScore(traits, risks);
    const fullName = `${player.first_name} ${player.last_name}`;
    const analysis = PROSPECT_ANALYSIS[fullName] || { strengths: ['Elite physical tools', 'High upside potential'], weaknesses: ['Raw skill set', 'Needs development'], tags: ['Prospect'] };
    const comp = PLAYER_COMPS[fullName] || 'NBA Starter';
    
    const traitStamps = traits.filter(t => t.grade >= 7).map(t => `
        <div class="ringer-stamp">${getFrontendLabel(t.category_key)}</div>
    `).join('');
    
    const tagsHtml = analysis.tags.map(t => `<span class="ringer-tag">${t}</span>`).join('');
    
    const strengthsHtml = analysis.strengths.map(s => `<li>${s}</li>`).join('');
    const weaknessesHtml = analysis.weaknesses.map(w => `<li>${w}</li>`).join('');
    
    const statsHtml = stats ? `
        <div class="ringer-stats-grid">
            <div class="ringer-stat-card">
                <div class="ringer-stat-value">${stats.ppg}</div>
                <div class="ringer-stat-label">PPG</div>
            </div>
            <div class="ringer-stat-card">
                <div class="ringer-stat-value">${stats.rpg}</div>
                <div class="ringer-stat-label">RPG</div>
            </div>
            <div class="ringer-stat-card">
                <div class="ringer-stat-value">${stats.apg}</div>
                <div class="ringer-stat-label">APG</div>
            </div>
            <div class="ringer-stat-card">
                <div class="ringer-stat-value">${stats.ts}%</div>
                <div class="ringer-stat-label">True Shooting</div>
            </div>
            <div class="ringer-stat-card">
                <div class="ringer-stat-value">${stats.usg}%</div>
                <div class="ringer-stat-label">Usage Rate</div>
            </div>
            <div class="ringer-stat-card">
                <div class="ringer-stat-value">${stats.ortg}</div>
                <div class="ringer-stat-label">Offensive Rating</div>
            </div>
            <div class="ringer-stat-card">
                <div class="ringer-stat-value">${stats.efg}%</div>
                <div class="ringer-stat-label">Effective FG%</div>
            </div>
            <div class="ringer-stat-card">
                <div class="ringer-stat-value">${stats.ft}%</div>
                <div class="ringer-stat-label">Free Throw %</div>
            </div>
            <div class="ringer-stat-card">
                <div class="ringer-stat-value">${stats.tpm}</div>
                <div class="ringer-stat-label">3PM Per Game</div>
            </div>
            <div class="ringer-stat-card">
                <div class="ringer-stat-value">${stats.ast}%</div>
                <div class="ringer-stat-label">Assist Rate</div>
            </div>
        </div>
    ` : '';

    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>${fullName} - NBA Draft Profile</title>${STYLES}</head>
<body>
    <header class="ringer-header">
        <div class="ringer-header-inner">
            <a href="/" class="ringer-logo">NBA <span>DRAFT</span></a>
            <nav class="ringer-nav">
                <a href="/">Big Board</a>
                <a href="/mock-draft">Mock Draft</a>
                <a href="/teams">Team Needs</a>
            </nav>
        </div>
    </header>
    
    <div class="ringer-container">
        <div class="ringer-profile-header">
            <div class="ringer-profile-top">
                <div>
                    <div class="ringer-profile-name">${fullName}</div>
                    <div class="ringer-profile-meta">${pos} • ${player.college || 'International'} • ${player.country}</div>
                    <div class="ringer-stamps">${traitStamps}</div>
                    <div class="ringer-tags">${tagsHtml}</div>
                </div>
                <div class="ringer-profile-score">
                    <div class="ringer-profile-score-value">${score.finalBoardScore.toFixed(1)}</div>
                    <div class="ringer-profile-score-label">Draft Score</div>
                </div>
            </div>
            
            ${statsHtml}
            
            <div class="ringer-comp">
                <div class="ringer-comp-label">NBA Comparison</div>
                <div class="ringer-comp-name">${comp}</div>
            </div>
        </div>
        
        <div class="ringer-section">
            <h2>Scouting Report</h2>
            <div class="ringer-analysis-grid">
                <div class="ringer-analysis-column positive">
                    <h3>Strengths</h3>
                    <ul>${strengthsHtml}</ul>
                </div>
                <div class="ringer-analysis-column negative">
                    <h3>Areas for Improvement</h3>
                    <ul>${weaknessesHtml}</ul>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
}

// Parse form data
function parseFormData(body) {
    const params = new URLSearchParams(body);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
}

// Server
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    
    try {
        if (req.method === 'GET') {
            if (url.pathname === '/') {
                // Serve the new React big board as the main page
                const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(html);
                
            } else if (url.pathname.match(/\/player\/\d+$/)) {
                const playerId = parseInt(url.pathname.split('/')[2]);
                const player = await getOne('SELECT * FROM players WHERE id = ?', [playerId]);
                if (!player) {
                    res.writeHead(404);
                    res.end('Player not found');
                } else {
                    const traits = await query('SELECT category_key, grade FROM player_trait_grades WHERE player_id = ?', [playerId]);
                    const risks = await query('SELECT risk_key, risk_level FROM player_risk_flags WHERE player_id = ?', [playerId]);
                    const fullName = `${player.first_name} ${player.last_name}`;
                    const stats = BARTTORVIK_DATA[fullName] || null;
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(renderPlayerProfile(player, traits, risks, stats));
                }
                
            } else if (url.pathname === '/search') {
                const searchTerm = url.searchParams.get('q') || '';
                const players = await getBigBoard(userCustomWeights, '', searchTerm);
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(renderBigBoard(players, '', searchTerm));
                
            } else if (url.pathname === '/trait-library') {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(renderTraitBrowser());
                
            } else if (url.pathname === '/traits') {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(renderTraitManager());
                
            } else if (url.pathname === '/profile') {
                // Serve the new React profile page
                const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(html);
                
            } else if (url.pathname === '/app.js') {
                const js = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
                res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
                res.end(js);
                
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
        } else {
            res.writeHead(405);
            res.end('Method not allowed');
        }
    } catch (err) {
        console.error(err);
        res.writeHead(500);
        res.end('Server error: ' + err.message);
    }
});

server.listen(PORT, () => {
    console.log(`NBA Draft HQ (The Ringer Style) running at http://localhost:${PORT}`);
});
