const http = require('http');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { renderFeaturesPage } = require('./features');

const DB_PATH = path.join(__dirname, '..', 'database', 'draft_hq.db');
const PORT = 3456;

let userCustomWeights = null;
let currentTeamModel = null;

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

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        db.run(sql, params, function(err) {
            db.close();
            if (err) reject(err);
            else resolve(this.lastID);
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
    
    return {
        weightedTraitScore: normalizedTraitScore,
        riskPenalty: riskPenalty,
        finalBoardScore: finalScore,
        tier: tier
    };
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

// Modern UI Styles
const STYLES = `
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
    :root {
        --primary: #ff6b35;
        --primary-dark: #e55a2b;
        --bg: #0d1117;
        --bg-card: #161b22;
        --bg-hover: #21262d;
        --border: #30363d;
        --text: #c9d1d9;
        --text-muted: #8b949e;
        --success: #238636;
        --warning: #f0883e;
        --danger: #da3633;
        --info: #58a6ff;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
        background: var(--bg);
        color: var(--text);
        line-height: 1.5;
        min-height: 100vh;
    }
    .container { max-width: 1400px; margin: 0 auto; padding: 24px; }
    
    /* Header */
    .header {
        background: var(--bg-card);
        border-bottom: 1px solid var(--border);
        padding: 16px 24px;
        position: sticky;
        top: 0;
        z-index: 100;
    }
    .header-content {
        max-width: 1400px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 16px;
    }
    .logo {
        display: flex;
        align-items: center;
        gap: 12px;
        text-decoration: none;
    }
    .logo-icon {
        width: 40px;
        height: 40px;
        background: var(--primary);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
    }
    .logo-text {
        color: var(--text);
        font-size: 20px;
        font-weight: 600;
    }
    .logo-text span { color: var(--primary); }
    
    /* Nav */
    .nav { display: flex; gap: 8px; flex-wrap: wrap; }
    .nav a, .nav button {
        padding: 8px 16px;
        border-radius: 6px;
        text-decoration: none;
        color: var(--text);
        background: var(--bg-hover);
        border: 1px solid var(--border);
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
    }
    .nav a:hover, .nav button:hover {
        background: var(--border);
        border-color: var(--text-muted);
    }
    .nav a.active {
        background: var(--primary);
        border-color: var(--primary);
        color: white;
    }
    
    /* Toolbar */
    .toolbar {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 16px;
        margin: 24px 0;
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        align-items: center;
    }
    .toolbar-group { display: flex; gap: 8px; align-items: center; }
    .toolbar label { color: var(--text-muted); font-size: 14px; }
    
    /* Inputs */
    input, select {
        background: var(--bg);
        border: 1px solid var(--border);
        color: var(--text);
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 14px;
        min-width: 150px;
    }
    input:focus, select:focus {
        outline: none;
        border-color: var(--primary);
    }
    
    /* Buttons */
    .btn {
        padding: 8px 16px;
        border-radius: 6px;
        border: none;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }
    .btn-primary {
        background: var(--primary);
        color: white;
    }
    .btn-primary:hover { background: var(--primary-dark); }
    .btn-secondary {
        background: var(--bg-hover);
        color: var(--text);
        border: 1px solid var(--border);
    }
    .btn-secondary:hover { background: var(--border); }
    
    /* Table */
    .table-container {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 12px;
        overflow: hidden;
    }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th {
        background: var(--bg);
        padding: 12px 16px;
        text-align: left;
        font-weight: 600;
        color: var(--text-muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid var(--border);
        cursor: pointer;
        user-select: none;
    }
    th:hover { color: var(--text); }
    td { padding: 12px 16px; border-bottom: 1px solid var(--border); }
    tr:hover { background: var(--bg-hover); }
    tr:last-child td { border-bottom: none; }
    
    /* Rank & Score */
    .rank {
        font-size: 18px;
        font-weight: 700;
        color: var(--primary);
        width: 50px;
    }
    .score {
        font-size: 16px;
        font-weight: 600;
    }
    .score-high { color: #3fb950; }
    .score-mid { color: #58a6ff; }
    .score-low { color: var(--text-muted); }
    
    /* Player cell */
    .player-cell { display: flex; flex-direction: column; gap: 2px; }
    .player-name {
        color: var(--text);
        font-weight: 600;
        text-decoration: none;
        font-size: 15px;
    }
    .player-name:hover { color: var(--primary); }
    .player-meta {
        color: var(--text-muted);
        font-size: 12px;
    }
    
    /* Tier badges */
    .tier {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
    }
    .tier-1 { background: #ffd700; color: #000; }
    .tier-2 { background: #c0c0c0; color: #000; }
    .tier-3 { background: #cd7f32; color: #fff; }
    .tier-4 { background: var(--border); color: var(--text); }
    .tier-5 { background: var(--bg); color: var(--text-muted); border: 1px solid var(--border); }
    
    /* Stats breakdown */
    .stat-breakdown {
        display: flex;
        gap: 12px;
        font-size: 12px;
    }
    .stat-positive { color: #3fb950; }
    .stat-negative { color: #f85149; }
    
    /* Cards */
    .card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 24px;
        margin: 16px 0;
    }
    .card h2 {
        color: var(--text);
        font-size: 18px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--border);
    }
    
    /* Grid */
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
    
    /* Forms */
    .form-row {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 12px 0;
        border-bottom: 1px solid var(--border);
    }
    .form-row:last-child { border-bottom: none; }
    .form-row label {
        min-width: 150px;
        color: var(--text-muted);
        font-size: 14px;
    }
    .form-row input, .form-row select {
        flex: 1;
        max-width: 200px;
    }
    
    /* Weight sliders */
    .weight-control {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 12px 0;
        border-bottom: 1px solid var(--border);
    }
    .weight-control label {
        min-width: 180px;
        font-size: 14px;
    }
    .weight-control input[type="range"] {
        flex: 1;
        height: 6px;
        -webkit-appearance: none;
        background: var(--bg);
        border-radius: 3px;
        outline: none;
    }
    .weight-control input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 18px;
        height: 18px;
        background: var(--primary);
        border-radius: 50%;
        cursor: pointer;
    }
    .weight-value {
        min-width: 40px;
        text-align: right;
        font-weight: 600;
        color: var(--primary);
    }
    
    /* Responsive */
    @media (max-width: 768px) {
        .container { padding: 16px; }
        .header-content { flex-direction: column; align-items: flex-start; }
        .toolbar { flex-direction: column; align-items: stretch; }
        .toolbar-group { width: 100%; }
        input, select { width: 100%; }
        th, td { padding: 10px 12px; }
        .rank { font-size: 16px; }
    }
    
    /* Animations */
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .animate-in { animation: fadeIn 0.3s ease-out; }
</style>`;

function renderBigBoard(players, positionFilter = '', searchTerm = '', teamName = '') {
    const positionOptions = ['', 'PG', 'SG', 'SF', 'PF', 'C', 'G', 'F'].map(pos => 
        `<option value="${pos}" ${pos === positionFilter ? 'selected' : ''}>${pos || 'All Positions'}</option>`
    ).join('');
    
    const rows = players.map((p, i) => {
        const pos = p.secondary_position ? `${p.position}/${p.secondary_position}` : p.position;
        const height = p.height_inches ? `${Math.floor(p.height_inches/12)}'${p.height_inches%12}"` : '-';
        const tierClass = p.tier === 'Tier 1' ? 'tier-1' : p.tier === 'Tier 2' ? 'tier-2' : p.tier === 'Tier 3' ? 'tier-3' : p.tier === 'Tier 4' ? 'tier-4' : 'tier-5';
        const scoreClass = p.finalBoardScore >= 80 ? 'score-high' : p.finalBoardScore >= 70 ? 'score-mid' : 'score-low';
        
        return `
        <tr class="animate-in" style="animation-delay: ${i * 0.02}s">
            <td class="rank">${i+1}</td>
            <td>
                <div class="player-cell">
                    <a href="/player/${p.player_id}" class="player-name">${p.first_name} ${p.last_name}</a>
                    <span class="player-meta">${pos} • ${p.college || '-'} • ${height}</span>
                </div>
            </td>
            <td><span class="tier ${tierClass}">${p.tier}</span></td>
            <td class="score ${scoreClass}">${p.finalBoardScore.toFixed(1)}</td>
            <td>
                <div class="stat-breakdown">
                    <span class="stat-positive">${p.weightedTraitScore.toFixed(1)}</span>
                    <span class="stat-negative">-${p.riskPenalty.toFixed(1)}</span>
                </div>
            </td>
            <td><a href="/player/${p.player_id}/edit" class="btn btn-secondary">Edit</a></td>
        </tr>`;
    }).join('');

    const teamBadge = teamName ? `<span style="background: var(--primary); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-left: 12px;">${teamName} Model</span>` : '';

    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>NBA Draft HQ</title>${STYLES}</head>
<body>
    <header class="header">
        <div class="header-content">
            <a href="/" class="logo">
                <div class="logo-icon">🏀</div>
                <div class="logo-text">NBA <span>Draft HQ</span></div>
            </a>
            <nav class="nav">
                <a href="/" class="active">Big Board</a>
                <a href="/weights">Weights</a>
                <a href="/teams">Team Models</a>
                <a href="/mock-draft">Mock Draft</a>
                <a href="/features">Features</a>
                <a href="/add-player">+ Add Player</a>
            </nav>
        </div>
    </header>
    
    <div class="container">
        <div class="toolbar">
            <div class="toolbar-group">
                <label>Position:</label>
                <select onchange="window.location.href='/?pos='+this.value">
                    ${positionOptions}
                </select>
            </div>
            <div class="toolbar-group">
                <form action="/search" method="GET" style="display:flex;gap:8px;">
                    <input type="text" name="q" placeholder="Search players..." value="${searchTerm}">
                    <button type="submit" class="btn btn-primary">Search</button>
                </form>
            </div>
            <div class="toolbar-group" style="margin-left: auto;">
                <span style="color: var(--text-muted);">${players.length} prospects</span>
                ${teamBadge}
            </div>
        </div>
        
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Player</th>
                        <th>Tier</th>
                        <th onclick="sortByScore()">Score ↕</th>
                        <th>Trait / Risk</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    </div>
    
    <script>
        function sortByScore() {
            const rows = Array.from(document.querySelectorAll('tbody tr'));
            rows.sort((a, b) => {
                const aScore = parseFloat(a.cells[3].textContent);
                const bScore = parseFloat(b.cells[3].textContent);
                return bScore - aScore;
            });
            rows.forEach(row => document.querySelector('tbody').appendChild(row));
        }
    </script>
</body>
</html>`;
}

function renderPlayerDetail(data) {
    const p = data.player;
    const pos = p.secondary_position ? `${p.position}/${p.secondary_position}` : p.position;
    const height = p.height_inches ? `${Math.floor(p.height_inches/12)}'${p.height_inches%12}"` : '-';
    
    const score = calculateScore(data.traits, data.risks);
    
    const traitRows = data.traits.map(t => `
        <div class="form-row">
            <label>${t.category_key.replace(/_/g, ' ')}</label>
            <div style="display:flex;align-items:center;gap:12px;">
                <div style="flex:1;background:var(--bg);height:8px;border-radius:4px;overflow:hidden;">
                    <div style="width:${(t.grade/9)*100}%;height:100%;background:${t.grade >= 7 ? '#3fb950' : t.grade >= 5 ? '#58a6ff' : '#f85149'}"></div>
                </div>
                <span style="min-width:30px;text-align:right;font-weight:600;">${t.grade}</span>
            </div>
        </div>
    `).join('');
    
    const riskRows = data.risks.map(r => `
        <div class="form-row">
            <label>${r.risk_key.replace(/_/g, ' ')}</label>
            <span style="color:${r.risk_level === 0 ? '#3fb950' : r.risk_level === 1 ? '#58a6ff' : r.risk_level === 2 ? '#f0883e' : '#f85149'};font-weight:600;">
                ${r.risk_level === 0 ? 'None' : r.risk_level === 1 ? 'Low' : r.risk_level === 2 ? 'Medium' : 'High'}
            </span>
        </div>
    `).join('');

    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>${p.first_name} ${p.last_name} - NBA Draft HQ</title>${STYLES}</head>
<body>
    <header class="header">
        <div class="header-content">
            <a href="/" class="logo">
                <div class="logo-icon">🏀</div>
                <div class="logo-text">NBA <span>Draft HQ</span></div>
            </a>
            <nav class="nav">
                <a href="/">Big Board</a>
                <a href="/weights">Weights</a>
                <a href="/teams">Team Models</a>
                <a href="/mock-draft">Mock Draft</a>
                <a href="/features">Features</a>
            </nav>
        </div>
    </header>
    
    <div class="container">
        <div style="margin-bottom: 24px;">
            <a href="/" style="color: var(--text-muted); text-decoration: none;">← Back to Big Board</a>
        </div>
        
        <div class="card" style="margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px;">
                <div>
                    <h1 style="font-size: 32px; margin-bottom: 8px;">${p.first_name} ${p.last_name}</h1>
                    <p style="color: var(--text-muted); font-size: 16px;">${pos} • ${p.college || '-'} • ${height} • ${p.country}</p>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 48px; font-weight: 700; color: var(--primary);">${score.finalBoardScore.toFixed(1)}</div>
                    <div style="color: var(--text-muted);">${score.tier}</div>
                </div>
            </div>
        </div>
        
        <div class="grid">
            <div class="card">
                <h2>Trait Grades</h2>
                ${traitRows}
            </div>
            <div class="card">
                <h2>Risk Assessment</h2>
                ${riskRows}
            </div>
        </div>
    </div>
</body>
</html>`;
}

function renderCustomWeights(currentWeights = null) {
    const defaults = {
        advantage_creation: 20, decision_making: 16, shooting_gravity: 14, scalability: 14,
        defensive_versatility: 12, processing_speed: 10, passing_creation: 8, off_ball_value: 6
    };
    const weights = currentWeights || defaults;
    
    const sliders = Object.entries(weights).map(([trait, weight]) => `
        <div class="weight-control">
            <label>${trait.replace(/_/g, ' ')}</label>
            <input type="range" name="${trait}" min="0" max="50" value="${weight}" 
                   oninput="document.getElementById('val_${trait}').textContent = this.value">
            <span class="weight-value" id="val_${trait}">${weight}</span>
        </div>
    `).join('');

    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Custom Weights - NBA Draft HQ</title>${STYLES}</head>
<body>
    <header class="header">
        <div class="header-content">
            <a href="/" class="logo">
                <div class="logo-icon">🏀</div>
                <div class="logo-text">NBA <span>Draft HQ</span></div>
            </a>
            <nav class="nav">
                <a href="/">Big Board</a>
                <a href="/weights" class="active">Weights</a>
                <a href="/teams">Team Models</a>
                <a href="/mock-draft">Mock Draft</a>
                <a href="/features">Features</a>
            </nav>
        </div>
    </header>
    
    <div class="container">
        <div style="margin-bottom: 24px;">
            <a href="/" style="color: var(--text-muted); text-decoration: none;">← Back to Big Board</a>
        </div>
        
        <div class="card">
            <h2>Custom Scoring Weights</h2>
            <p style="color: var(--text-muted); margin-bottom: 20px;">Adjust the importance of each trait. Changes apply immediately to the big board.</p>
            <form action="/weights/save" method="POST">
                ${sliders}
                <div style="margin-top: 24px; display: flex; gap: 12px;">
                    <button type="submit" class="btn btn-primary">Apply Custom Weights</button>
                    <a href="/weights/reset" class="btn btn-secondary">Reset to Default</a>
                </div>
            </form>
        </div>
        
        <div class="card">
            <h2>Team Presets</h2>
            <p style="color: var(--text-muted); margin-bottom: 16px;">Use weights optimized for specific team philosophies.</p>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <a href="/weights/preset/upside" class="btn btn-secondary">Upside Hunter</a>
                <a href="/weights/preset/safe" class="btn btn-secondary">Safe Picks</a>
                <a href="/weights/preset/shooting" class="btn btn-secondary">Shooting Priority</a>
                <a href="/weights/preset/defense" class="btn btn-secondary">Defense First</a>
            </div>
        </div>
    </div>
</body>
</html>`;
}

function renderTeamModels() {
    const teams = [
        { name: 'Lakers', desc: 'Win-now mode, need immediate contributors' },
        { name: 'Warriors', desc: 'Shooting and basketball IQ priority' },
        { name: 'Thunder', desc: 'High upside, long-term development' },
        { name: 'Spurs', desc: 'Two-way players, high character' },
        { name: 'Celtics', desc: 'Versatile wings, team defense' },
        { name: 'Knicks', desc: 'Toughness, defensive identity' },
        { name: 'Heat', desc: 'Culture fits, work ethic, two-way' },
        { name: 'Nuggets', desc: 'Playmaking bigs, basketball IQ' }
    ];
    
    const teamCards = teams.map(t => `
        <div class="card" style="cursor: pointer;" onclick="window.location.href='/?team=${t.name}'">
            <h3 style="color: var(--primary); margin-bottom: 8px;">${t.name}</h3>
            <p style="color: var(--text-muted); font-size: 14px;">${t.desc}</p>
        </div>
    `).join('');

    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Team Models - NBA Draft HQ</title>${STYLES}</head>
<body>
    <header class="header">
        <div class="header-content">
            <a href="/" class="logo">
                <div class="logo-icon">🏀</div>
                <div class="logo-text">NBA <span>Draft HQ</span></div>
            </a>
            <nav class="nav">
                <a href="/">Big Board</a>
                <a href="/weights">Weights</a>
                <a href="/teams" class="active">Team Models</a>
                <a href="/mock-draft">Mock Draft</a>
                <a href="/features">Features</a>
            </nav>
        </div>
    </header>
    
    <div class="container">
        <div style="margin-bottom: 24px;">
            <a href="/" style="color: var(--text-muted); text-decoration: none;">← Back to Big Board</a>
        </div>
        
        <div class="card" style="margin-bottom: 24px;">
            <h2>Team-Specific Big Boards</h2>
            <p style="color: var(--text-muted);">View the draft board optimized for each team's specific needs and philosophy.</p>
        </div>
        
        <div class="grid">
            ${teamCards}
        </div>
    </div>
</body>
</html>`;
}

function renderMockDraft(mockDraft) {
    const rows = mockDraft.map((pick, i) => `
        <tr class="animate-in" style="animation-delay: ${i * 0.03}s">
            <td style="font-weight: 700; color: var(--primary);">${pick.pick}</td>
            <td>
                <div class="player-cell">
                    <div class="player-name">${pick.team}</div>
                    <span class="player-meta">Needs: ${pick.needs}</span>
                </div>
            </td>
            <td>
                <div class="player-cell">
                    <div class="player-name">${pick.player}</div>
                    <span class="player-meta">${pick.position}</span>
                </div>
            </td>
            <td class="score">${pick.score}</td>
            <td>${pick.need_fit ? '<span style="color: #3fb950;">✓ Need</span>' : '<span style="color: var(--text-muted);">BPA</span>'}</td>
        </tr>
    `).join('');

    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Mock Draft - NBA Draft HQ</title>${STYLES}</head>
<body>
    <header class="header">
        <div class="header-content">
            <a href="/" class="logo">
                <div class="logo-icon">🏀</div>
                <div class="logo-text">NBA <span>Draft HQ</span></div>
            </a>
            <nav class="nav">
                <a href="/">Big Board</a>
                <a href="/weights">Weights</a>
                <a href="/teams">Team Models</a>
                <a href="/mock-draft" class="active">Mock Draft</a>
                <a href="/features">Features</a>
            </nav>
        </div>
    </header>
    
    <div class="container">
        <div style="margin-bottom: 24px;">
            <a href="/" style="color: var(--text-muted); text-decoration: none;">← Back to Big Board</a>
        </div>
        
        <div class="toolbar">
            <h2 style="margin: 0;">2026 NBA Mock Draft</h2>
            <div class="toolbar-group" style="margin-left: auto;">
                <span style="color: var(--text-muted);">Based on current big board + team needs</span>
            </div>
        </div>
        
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Pick</th>
                        <th>Team</th>
                        <th>Player</th>
                        <th>Score</th>
                        <th>Fit</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
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

// Team weights
const TEAM_WEIGHTS = {
    'Lakers': { decision_making: 22, shooting_gravity: 20, defensive_versatility: 16, off_ball_value: 14, advantage_creation: 10, processing_speed: 8, passing_creation: 6, scalability: 4 },
    'Warriors': { shooting_gravity: 28, decision_making: 20, passing_creation: 12, processing_speed: 12, off_ball_value: 10, advantage_creation: 8, defensive_versatility: 6, scalability: 4 },
    'Thunder': { scalability: 22, advantage_creation: 20, defensive_versatility: 14, decision_making: 12, shooting_gravity: 10, processing_speed: 10, passing_creation: 8, off_ball_value: 4 },
    'Spurs': { defensive_versatility: 20, decision_making: 18, advantage_creation: 16, shooting_gravity: 12, processing_speed: 12, scalability: 10, passing_creation: 8, off_ball_value: 4 },
    'Celtics': { defensive_versatility: 24, shooting_gravity: 18, decision_making: 16, processing_speed: 14, off_ball_value: 12, advantage_creation: 8, passing_creation: 6, scalability: 2 },
    'Knicks': { defensive_versatility: 22, advantage_creation: 18, decision_making: 14, processing_speed: 14, shooting_gravity: 12, scalability: 10, off_ball_value: 6, passing_creation: 4 },
    'Heat': { decision_making: 20, defensive_versatility: 18, advantage_creation: 16, shooting_gravity: 14, processing_speed: 12, scalability: 10, off_ball_value: 6, passing_creation: 4 },
    'Nuggets': { passing_creation: 20, decision_making: 20, shooting_gravity: 16, advantage_creation: 14, scalability: 12, processing_speed: 10, defensive_versatility: 6, off_ball_value: 2 }
};

// Server
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    
    try {
        if (req.method === 'GET') {
            if (url.pathname === '/') {
                const posFilter = url.searchParams.get('pos') || '';
                const teamName = url.searchParams.get('team') || '';
                const weights = teamName ? TEAM_WEIGHTS[teamName] : userCustomWeights;
                const players = await getBigBoard(weights, posFilter);
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(renderBigBoard(players, posFilter, '', teamName));
                
            } else if (url.pathname.match(/\/player\/\d+$/) && !url.pathname.includes('/edit')) {
                const playerId = parseInt(url.pathname.split('/')[2]);
                const data = await getOne('SELECT * FROM players WHERE id = ?', [playerId]);
                if (!data) {
                    res.writeHead(404);
                    res.end('Player not found');
                } else {
                    const traits = await query('SELECT category_key, grade FROM player_trait_grades WHERE player_id = ?', [playerId]);
                    const risks = await query('SELECT risk_key, risk_level FROM player_risk_flags WHERE player_id = ?', [playerId]);
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(renderPlayerDetail({ player: data, traits, risks }));
                }
                
            } else if (url.pathname === '/weights') {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(renderCustomWeights(userCustomWeights));
                
            } else if (url.pathname === '/teams') {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(renderTeamModels());
                
            } else if (url.pathname === '/mock-draft') {
                // Generate mock draft
                const players = await getBigBoard();
                const teams = [
                    { name: 'Washington Wizards', needs: 'PG, C', pick: 1 },
                    { name: 'Utah Jazz', needs: 'PG, PF', pick: 2 },
                    { name: 'Charlotte Hornets', needs: 'C, SF', pick: 3 },
                    { name: 'Detroit Pistons', needs: 'SF, PF', pick: 4 },
                    { name: 'San Antonio Spurs', needs: 'PG, SG', pick: 5 },
                    { name: 'Toronto Raptors', needs: 'C, PF', pick: 6 },
                    { name: 'Memphis Grizzlies', needs: 'SF, PF', pick: 7 },
                    { name: 'Houston Rockets', needs: 'SG, SF', pick: 8 },
                    { name: 'Brooklyn Nets', needs: 'PG, PF', pick: 9 },
                    { name: 'New Orleans Pelicans', needs: 'PG, C', pick: 10 },
                    { name: 'Portland Trail Blazers', needs: 'SF, PF', pick: 11 },
                    { name: 'Oklahoma City Thunder', needs: 'C, PF', pick: 12 },
                    { name: 'Sacramento Kings', needs: 'SF, PF', pick: 13 },
                    { name: 'Indiana Pacers', needs: 'SG, SF', pick: 14 },
                    { name: 'Philadelphia 76ers', needs: 'SG, SF', pick: 15 }
                ];
                
                const mockDraft = [];
                const available = [...players];
                
                for (const team of teams) {
                    if (available.length === 0) break;
                    const pick = available.shift();
                    mockDraft.push({
                        pick: team.pick,
                        team: team.name,
                        needs: team.needs,
                        player: `${pick.first_name} ${pick.last_name}`,
                        position: pick.position,
                        score: pick.finalBoardScore.toFixed(1),
                        need_fit: team.needs.includes(pick.position)
                    });
                }
                
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(renderMockDraft(mockDraft));
                
            } else if (url.pathname === '/features') {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(renderFeaturesPage());
                
            } else if (url.pathname === '/search') {
                const searchTerm = url.searchParams.get('q') || '';
                const players = await getBigBoard(userCustomWeights, '', searchTerm);
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(renderBigBoard(players, '', searchTerm));
                
            } else if (url.pathname === '/weights/reset') {
                userCustomWeights = null;
                res.writeHead(302, { Location: '/' });
                res.end();
                
            } else if (url.pathname.startsWith('/weights/preset/')) {
                const preset = url.pathname.split('/')[3];
                const presets = {
                    upside: { advantage_creation: 25, scalability: 18, shooting_gravity: 12, decision_making: 12, defensive_versatility: 12, processing_speed: 10, passing_creation: 7, off_ball_value: 4 },
                    safe: { decision_making: 22, shooting_gravity: 18, defensive_versatility: 15, off_ball_value: 12, advantage_creation: 12, processing_speed: 10, passing_creation: 7, scalability: 4 },
                    shooting: { shooting_gravity: 28, off_ball_value: 18, decision_making: 14, advantage_creation: 12, processing_speed: 10, scalability: 8, defensive_versatility: 6, passing_creation: 4 },
                    defense: { defensive_versatility: 30, processing_speed: 18, advantage_creation: 12, decision_making: 12, scalability: 10, shooting_gravity: 8, off_ball_value: 6, passing_creation: 4 }
                };
                userCustomWeights = presets[preset] || null;
                res.writeHead(302, { Location: '/' });
                res.end();
                
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
            
        } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                const data = parseFormData(body);
                
                if (url.pathname === '/weights/save') {
                    userCustomWeights = {};
                    for (const [key, value] of Object.entries(data)) {
                        userCustomWeights[key] = parseInt(value);
                    }
                    res.writeHead(302, { Location: '/' });
                    res.end();
                    
                } else {
                    res.writeHead(404);
                    res.end('Not found');
                }
            });
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
    console.log(`NBA Draft HQ running at http://localhost:${PORT}`);
});
