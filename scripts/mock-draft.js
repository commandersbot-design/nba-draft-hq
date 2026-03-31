// Mock Draft Simulator
// Simulate the 2026 NBA Draft with team needs

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database', 'draft_hq.db');

// NBA Teams with needs
const NBA_TEAMS = [
    { name: 'Washington Wizards', needs: ['PG', 'C', 'SF'], pick: 1 },
    { name: 'Utah Jazz', needs: ['PG', 'PF', 'C'], pick: 2 },
    { name: 'Charlotte Hornets', needs: ['C', 'SF', 'SG'], pick: 3 },
    { name: 'Detroit Pistons', needs: ['SF', 'PF', 'C'], pick: 4 },
    { name: 'San Antonio Spurs', needs: ['PG', 'SG', 'SF'], pick: 5 },
    { name: 'Toronto Raptors', needs: ['C', 'PF', 'SG'], pick: 6 },
    { name: 'Memphis Grizzlies', needs: ['SF', 'PF', 'C'], pick: 7 },
    { name: 'Houston Rockets', needs: ['SG', 'SF', 'C'], pick: 8 },
    { name: 'Brooklyn Nets', needs: ['PG', 'PF', 'C'], pick: 9 },
    { name: 'New Orleans Pelicans', needs: ['PG', 'C', 'SF'], pick: 10 },
    { name: 'Portland Trail Blazers', needs: ['SF', 'PF', 'C'], pick: 11 },
    { name: 'Oklahoma City Thunder', needs: ['C', 'PF', 'SG'], pick: 12 },
    { name: 'Sacramento Kings', needs: ['SF', 'PF', 'C'], pick: 13 },
    { name: 'Indiana Pacers', needs: ['SG', 'SF', 'C'], pick: 14 },
    { name: 'Philadelphia 76ers', needs: ['SG', 'SF', 'C'], pick: 15 },
    { name: 'Orlando Magic', needs: ['PG', 'SG', 'C'], pick: 16 },
    { name: 'Atlanta Hawks', needs: ['C', 'PF', 'SF'], pick: 17 },
    { name: 'Chicago Bulls', needs: ['PG', 'C', 'SF'], pick: 18 },
    { name: 'Cleveland Cavaliers', needs: ['SF', 'PF', 'C'], pick: 19 },
    { name: 'Miami Heat', needs: ['PG', 'C', 'PF'], pick: 20 },
    { name: 'New York Knicks', needs: ['SG', 'SF', 'C'], pick: 21 },
    { name: 'Denver Nuggets', needs: ['SG', 'SF', 'C'], pick: 22 },
    { name: 'Milwaukee Bucks', needs: ['SG', 'SF', 'C'], pick: 23 },
    { name: 'Boston Celtics', needs: ['C', 'PF', 'SG'], pick: 24 },
    { name: 'LA Clippers', needs: ['PG', 'C', 'PF'], pick: 25 },
    { name: 'Phoenix Suns', needs: ['PG', 'C', 'SF'], pick: 26 },
    { name: 'Minnesota Timberwolves', needs: ['SG', 'SF', 'C'], pick: 27 },
    { name: 'LA Lakers', needs: ['C', 'PG', 'SF'], pick: 28 },
    { name: 'Golden State Warriors', needs: ['C', 'PF', 'SG'], pick: 29 },
    { name: 'Dallas Mavericks', needs: ['C', 'SF', 'SG'], pick: 30 }
];

async function runMockDraft(runId) {
    const db = new sqlite3.Database(DB_PATH);
    
    // Get all players with scores
    const players = await new Promise((resolve, reject) => {
        db.all(`
            SELECT p.id, p.first_name, p.last_name, p.position, p.secondary_position, 
                   ps.final_board_score, ps.tier
            FROM player_scores ps
            JOIN players p ON ps.player_id = p.id
            WHERE ps.run_id = ?
            ORDER BY ps.final_board_score DESC
        `, [runId], (err, rows) => err ? reject(err) : resolve(rows));
    });
    
    db.close();
    
    const mockDraft = [];
    const availablePlayers = [...players];
    
    for (const team of NBA_TEAMS) {
        // Find best fit based on BPA + need
        let bestPick = null;
        let bestScore = -1;
        
        for (let i = 0; i < availablePlayers.length; i++) {
            const player = availablePlayers[i];
            let fitBonus = 0;
            
            // Position fit bonus
            if (team.needs.includes(player.position) || team.needs.includes(player.secondary_position)) {
                fitBonus = 5;
            }
            
            const totalScore = player.final_board_score + fitBonus;
            
            if (totalScore > bestScore) {
                bestScore = totalScore;
                bestPick = { ...player, index: i };
            }
            
            // Only consider top 15 available for early picks
            if (i >= 15 && team.pick <= 10) break;
        }
        
        if (bestPick) {
            mockDraft.push({
                pick: team.pick,
                team: team.name,
                player: `${bestPick.first_name} ${bestPick.last_name}`,
                position: bestPick.position,
                score: bestPick.final_board_score.toFixed(1),
                tier: bestPick.tier,
                need_fit: team.needs.includes(bestPick.position) ? '✓' : ''
            });
            
            availablePlayers.splice(bestPick.index, 1);
        }
    }
    
    return mockDraft;
}

function printMockDraft(mockDraft) {
    console.log('\n🏀 2026 NBA MOCK DRAFT');
    console.log('=' .repeat(70));
    console.log('Pick | Team                          | Player                | Pos | Score | Fit');
    console.log('-'.repeat(70));
    
    mockDraft.forEach(d => {
        const team = d.team.padEnd(30);
        const player = d.player.padEnd(22);
        console.log(`${d.pick.toString().padStart(3)}  | ${team} | ${player} | ${d.position.padEnd(3)} | ${d.score} | ${d.need_fit}`);
    });
}

// CLI
const command = process.argv[2];
const runId = process.argv[3] || 'RUN-2026FINAL-002';

if (command === 'run') {
    runMockDraft(runId)
        .then(mockDraft => {
            printMockDraft(mockDraft);
            
            // Save to file
            const fs = require('fs');
            const filename = `mockdraft_${runId}_${new Date().toISOString().split('T')[0]}.json`;
            fs.writeFileSync(
                path.join(__dirname, '..', 'exports', filename),
                JSON.stringify(mockDraft, null, 2)
            );
            console.log(`\n✓ Saved to exports/${filename}`);
            process.exit(0);
        })
        .catch(err => {
            console.error('Error:', err.message);
            process.exit(1);
        });
} else {
    console.log('Usage: node mock-draft.js run [run-id]');
}

module.exports = { runMockDraft, NBA_TEAMS };
