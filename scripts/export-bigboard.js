const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database', 'draft_hq.db');
const EXPORTS_DIR = path.join(__dirname, '..', 'exports');

function exportBigBoard(runId, format = 'csv') {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        
        const query = `
            SELECT 
                p.id as player_id,
                p.first_name,
                p.last_name,
                p.position,
                p.secondary_position,
                p.college,
                p.country,
                ROW_NUMBER() OVER (ORDER BY ps.final_board_score DESC) as big_board_rank,
                ps.final_board_score,
                ps.weighted_trait_score,
                ps.risk_penalty,
                ps.tier,
                ps.percentile,
                ps.scored_at
            FROM player_scores ps
            JOIN players p ON ps.player_id = p.id
            WHERE ps.run_id = ?
            ORDER BY ps.final_board_score DESC
        `;
        
        db.all(query, [runId], (err, rows) => {
            if (err) return reject(err);
            
            if (rows.length === 0) {
                console.log(`No scores found for run: ${runId}`);
                db.close();
                return resolve(null);
            }
            
            // Add rank
            rows.forEach((row, idx) => {
                row.rank = idx + 1;
            });
            
            const now = new Date();
            const timestamp = now.toISOString().split('T')[0];
            const time = now.toTimeString().split(':').slice(0, 2).join(''); // HHMM
            const filename = `bigboard_${runId}_exported-${timestamp}-${time}.${format}`;
            const filepath = path.join(EXPORTS_DIR, filename);
            
            if (format === 'csv') {
                // CSV export
                const headers = ['Rank', 'Player', 'Position', 'College', 'Country', 'Score', 'Tier', 'Trait Score', 'Risk Penalty'];
                const lines = [headers.join(',')];
                
                for (const row of rows) {
                    const pos = row.secondary_position ? `${row.position}/${row.secondary_position}` : row.position;
                    lines.push([
                        row.rank,
                        `"${row.first_name} ${row.last_name}"`,
                        pos,
                        row.college || '',
                        row.country,
                        row.final_board_score,
                        row.tier,
                        row.weighted_trait_score,
                        row.risk_penalty
                    ].join(','));
                }
                
                fs.writeFileSync(filepath, lines.join('\n'));
            } else if (format === 'json') {
                // JSON export
                fs.writeFileSync(filepath, JSON.stringify(rows, null, 2));
            }
            
            console.log(`✓ Exported ${rows.length} players to ${filename}`);
            db.close();
            resolve({ filepath, count: rows.length });
        });
    });
}

function exportPlayerDetail(runId, playerId) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        
        const query = `
            SELECT 
                p.*,
                ps.final_board_score,
                ps.weighted_trait_score,
                ps.risk_penalty,
                ps.tier,
                ps.percentile
            FROM player_scores ps
            JOIN players p ON ps.player_id = p.id
            WHERE ps.run_id = ? AND ps.player_id = ?
        `;
        
        db.get(query, [runId, playerId], (err, player) => {
            if (err) return reject(err);
            if (!player) {
                console.log(`Player ${playerId} not found in run ${runId}`);
                db.close();
                return resolve(null);
            }
            
            // Get trait breakdown
            db.all(`
                SELECT category_key, grade, weighted_contribution
                FROM player_score_breakdown psb
                JOIN player_scores ps ON psb.score_id = ps.id
                WHERE ps.run_id = ? AND ps.player_id = ?
            `, [runId, playerId], (err, traits) => {
                if (err) return reject(err);
                
                // Get risk flags
                db.all(`
                    SELECT risk_key, risk_level
                    FROM player_risk_flags
                    WHERE player_id = ?
                `, [playerId], (err, risks) => {
                    if (err) return reject(err);
                    
                    const detail = {
                        player,
                        traits,
                        risks,
                        run_id: runId
                    };
                    
                    const filename = `player_${playerId}_${runId}.json`;
                    const filepath = path.join(EXPORTS_DIR, filename);
                    fs.writeFileSync(filepath, JSON.stringify(detail, null, 2));
                    
                    console.log(`✓ Exported player detail to ${filename}`);
                    db.close();
                    resolve(filepath);
                });
            });
        });
    });
}

// CLI
const command = process.argv[2];
const runId = process.argv[3];

if (!command || !runId) {
    console.log('Usage:');
    console.log('  node export-bigboard.js bigboard <run-id> [csv|json]');
    console.log('  node export-bigboard.js player <run-id> <player-id>');
    process.exit(1);
}

// Ensure exports dir exists
if (!fs.existsSync(EXPORTS_DIR)) {
    fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

if (command === 'bigboard') {
    const format = process.argv[4] || 'csv';
    exportBigBoard(runId, format).then(() => process.exit(0));
} else if (command === 'player') {
    const playerId = process.argv[4];
    if (!playerId) {
        console.error('Player ID required');
        process.exit(1);
    }
    exportPlayerDetail(runId, parseInt(playerId)).then(() => process.exit(0));
} else {
    console.error('Unknown command:', command);
    process.exit(1);
}
