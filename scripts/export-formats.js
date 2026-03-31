// Export formats for NBA teams
// PDF, Excel, CSV variants

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database', 'draft_hq.db');
const EXPORTS_DIR = path.join(__dirname, '..', 'exports');

async function exportExcelFormat(runId) {
    // Excel-friendly CSV with formulas and formatting hints
    const db = new sqlite3.Database(DB_PATH);
    
    const rows = await new Promise((resolve, reject) => {
        db.all(`
            SELECT 
                ROW_NUMBER() OVER (ORDER BY ps.final_board_score DESC) as rank,
                p.first_name, p.last_name, p.position, p.secondary_position,
                p.college, p.country, p.height_inches, p.weight_lbs,
                ps.final_board_score, ps.weighted_trait_score, ps.risk_penalty,
                ps.tier, ps.percentile
            FROM player_scores ps
            JOIN players p ON ps.player_id = p.id
            WHERE ps.run_id = ?
            ORDER BY ps.final_board_score DESC
        `, [runId], (err, rows) => err ? reject(err) : resolve(rows));
    });
    
    // Get trait breakdown
    const traits = await new Promise((resolve, reject) => {
        db.all(`
            SELECT ps.player_id, ptg.category_key, ptg.grade
            FROM player_scores ps
            JOIN player_trait_grades ptg ON ps.player_id = ptg.player_id
            WHERE ps.run_id = ?
        `, [runId], (err, rows) => err ? reject(err) : resolve(rows));
    });
    
    db.close();
    
    // Build wide format (one row per player, traits as columns)
    const traitCols = ['advantage_creation', 'decision_making', 'passing_creation', 'shooting_gravity',
                       'off_ball_value', 'processing_speed', 'scalability', 'defensive_versatility'];
    
    const headers = ['Rank', 'First', 'Last', 'Pos', 'Pos2', 'School', 'Country', 
                     'Height', 'Weight', 'Overall', 'Tier', 'TraitScore', 'RiskPenalty',
                     ...traitCols];
    
    const lines = [headers.join('\t')];
    
    for (const r of rows) {
        const playerTraits = traitCols.map(t => {
            const pt = traits.find(tr => tr.player_id === r.player_id && tr.category_key === t);
            return pt ? pt.grade : '';
        });
        
        lines.push([
            r.rank, r.first_name, r.last_name, r.position, r.secondary_position || '',
            r.college || '', r.country,
            r.height_inches ? `${Math.floor(r.height_inches/12)}'${r.height_inches%12}"` : '',
            r.weight_lbs || '',
            r.final_board_score.toFixed(2), r.tier, 
            r.weighted_trait_score.toFixed(2), r.risk_penalty.toFixed(2),
            ...playerTraits
        ].join('\t'));
    }
    
    const filename = `bigboard_${runId}_excel.tsv`;
    fs.writeFileSync(path.join(EXPORTS_DIR, filename), lines.join('\n'));
    console.log(`✓ Excel format: ${filename}`);
    return filename;
}

async function exportTeamSummary(runId) {
    // One-page summary for front office
    const db = new sqlite3.Database(DB_PATH);
    
    const rows = await new Promise((resolve, reject) => {
        db.all(`
            SELECT 
                p.first_name, p.last_name, p.position, p.college,
                ps.final_board_score, ps.tier
            FROM player_scores ps
            JOIN players p ON ps.player_id = p.id
            WHERE ps.run_id = ?
            ORDER BY ps.final_board_score DESC
        `, [runId], (err, rows) => err ? reject(err) : resolve(rows));
    });
    
    db.close();
    
    // Group by tier
    const byTier = {};
    rows.forEach(r => {
        if (!byTier[r.tier]) byTier[r.tier] = [];
        byTier[r.tier].push(r);
    });
    
    let summary = `NBA DRAFT HQ - EXECUTIVE SUMMARY\n`;
    summary += `Run: ${runId}\n`;
    summary += `Date: ${new Date().toLocaleDateString()}\n`;
    summary += `Total Prospects: ${rows.length}\n\n`;
    
    for (const [tier, players] of Object.entries(byTier)) {
        summary += `\n${tier}\n${'='.repeat(40)}\n`;
        players.slice(0, 5).forEach(p => {
            summary += `${p.first_name} ${p.last_name} (${p.position}) - ${p.college || 'N/A'} - ${p.final_board_score.toFixed(1)}\n`;
        });
        if (players.length > 5) {
            summary += `... and ${players.length - 5} more\n`;
        }
    }
    
    const filename = `bigboard_${runId}_summary.txt`;
    fs.writeFileSync(path.join(EXPORTS_DIR, filename), summary);
    console.log(`✓ Team summary: ${filename}`);
    return filename;
}

async function exportJsonFull(runId) {
    // Complete JSON with all data for API/integration
    const db = new sqlite3.Database(DB_PATH);
    
    const data = await new Promise((resolve, reject) => {
        db.all(`
            SELECT 
                p.*, ps.final_board_score, ps.weighted_trait_score, ps.risk_penalty,
                ps.tier, ps.percentile, ps.scored_at
            FROM player_scores ps
            JOIN players p ON ps.player_id = p.id
            WHERE ps.run_id = ?
            ORDER BY ps.final_board_score DESC
        `, [runId], (err, rows) => err ? reject(err) : resolve(rows));
    });
    
    db.close();
    
    const filename = `bigboard_${runId}_full.json`;
    fs.writeFileSync(path.join(EXPORTS_DIR, filename), JSON.stringify({
        run_id: runId,
        exported_at: new Date().toISOString(),
        count: data.length,
        players: data
    }, null, 2));
    console.log(`✓ Full JSON: ${filename}`);
    return filename;
}

// CLI
const command = process.argv[2];
const runId = process.argv[3];

if (!command || !runId) {
    console.log('Usage: node export-formats.js [excel|summary|json] <run-id>');
    process.exit(1);
}

(async () => {
    switch(command) {
        case 'excel':
            await exportExcelFormat(runId);
            break;
        case 'summary':
            await exportTeamSummary(runId);
            break;
        case 'json':
            await exportJsonFull(runId);
            break;
        case 'all':
            await exportExcelFormat(runId);
            await exportTeamSummary(runId);
            await exportJsonFull(runId);
            break;
        default:
            console.error('Unknown format:', command);
    }
    process.exit(0);
})();

module.exports = { exportExcelFormat, exportTeamSummary, exportJsonFull };
