const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database', 'draft_hq.db');

// Load weights from database based on profile
async function getModelWeights(profileId) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        db.all(`
            SELECT category_key, weight 
            FROM model_category_weights 
            WHERE profile_id = ?
        `, [profileId], (err, rows) => {
            db.close();
            if (err) return reject(err);
            const weights = {};
            rows.forEach(r => weights[r.category_key] = r.weight);
            resolve(weights);
        });
    });
}

// Default V1 weights (fallback)
const DEFAULT_WEIGHTS = {
    advantage_creation: 20,
    decision_making: 16,
    shooting_gravity: 14,
    scalability: 14,
    defensive_versatility: 12,
    processing_speed: 10,
    passing_creation: 8,
    off_ball_value: 6
};

const RISK_MULTIPLIER = 1.25;

// Tier thresholds
function getTier(score) {
    if (score >= 90) return 'Tier 1 - Franchise';
    if (score >= 84) return 'Tier 2 - All-Star';
    if (score >= 76) return 'Tier 3 - Starter';
    if (score >= 68) return 'Tier 4 - Rotation';
    return 'Tier 5 - Developmental';
}

async function calculateScore(playerId, profileId = 1) {
    const TRAIT_WEIGHTS = await getModelWeights(profileId).catch(() => DEFAULT_WEIGHTS);
    
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        
        // Get trait grades
        db.all(`
            SELECT category_key, grade 
            FROM player_trait_grades 
            WHERE player_id = ?
        `, [playerId], (err, traits) => {
            if (err) return reject(err);
            
            // Get risk flags
            db.all(`
                SELECT risk_key, risk_level 
                FROM player_risk_flags 
                WHERE player_id = ?
            `, [playerId], (err, risks) => {
                if (err) return reject(err);
                
                // Calculate weighted trait score
                let weightedScore = 0;
                let maxPossible = 0;
                const breakdown = [];
                
                for (const [trait, weight] of Object.entries(TRAIT_WEIGHTS)) {
                    const traitData = traits.find(t => t.category_key === trait);
                    const grade = traitData ? traitData.grade : 5; // Default to 5 if missing
                    const contribution = grade * weight;
                    weightedScore += contribution;
                    maxPossible += 9 * weight; // Max grade is 9
                    
                    breakdown.push({
                        category: trait,
                        grade: grade,
                        weight: weight,
                        contribution: contribution
                    });
                }
                
                // Normalize to 100-point scale
                const normalizedTraitScore = (weightedScore / maxPossible) * 100;
                
                // Calculate risk penalty
                const totalRiskPoints = risks.reduce((sum, r) => sum + r.risk_level, 0);
                const riskPenalty = totalRiskPoints * RISK_MULTIPLIER;
                
                // Final score
                const finalScore = normalizedTraitScore - riskPenalty;
                
                resolve({
                    playerId,
                    weightedTraitScore: normalizedTraitScore,
                    riskPenalty: riskPenalty,
                    finalBoardScore: finalScore,
                    tier: getTier(finalScore),
                    breakdown,
                    risks: risks.map(r => ({ key: r.risk_key, level: r.risk_level }))
                });
                
                db.close();
            });
        });
    });
}

function runScoring(runId, profileId = 1) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        
        console.log(`\nRunning scoring for Run ID: ${runId}`);
        console.log('=' .repeat(50));
        
        // Get all players
        db.all('SELECT id FROM players ORDER BY id', async (err, players) => {
            if (err) return reject(err);
            
            const results = [];
            
            for (const player of players) {
                const score = await calculateScore(player.id, profileId);
                results.push(score);
                
                // Save to database
                db.run(`
                    INSERT INTO player_scores (player_id, run_id, profile_id, weighted_trait_score, risk_penalty, final_board_score, tier)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    score.playerId,
                    runId,
                    profileId,
                    score.weightedTraitScore.toFixed(2),
                    score.riskPenalty.toFixed(2),
                    score.finalBoardScore.toFixed(2),
                    score.tier
                ]);
                
                // Save breakdown
                const scoreIdStmt = db.prepare(`
                    INSERT INTO player_score_breakdown (score_id, category_key, grade, weighted_contribution)
                    SELECT id, ?, ?, ? FROM player_scores WHERE player_id = ? AND run_id = ?
                `);
                
                for (const b of score.breakdown) {
                    scoreIdStmt.run(b.category, b.grade, b.contribution.toFixed(2), score.playerId, runId);
                }
                scoreIdStmt.finalize();
            }
            
            // Sort by final score
            results.sort((a, b) => b.finalBoardScore - a.finalBoardScore);
            
            // Calculate percentiles
            const totalPlayers = results.length;
            for (let i = 0; i < results.length; i++) {
                const percentile = Math.round(((totalPlayers - i) / totalPlayers) * 100);
                db.run('UPDATE player_scores SET percentile = ? WHERE player_id = ? AND run_id = ?', 
                    [percentile, results[i].playerId, runId]);
                results[i].percentile = percentile;
                results[i].rank = i + 1;
            }
            
            setTimeout(() => {
                db.close();
                console.log(`\n✓ Scored ${results.length} players`);
                resolve(results);
            }, 200);
        });
    });
}

// CLI
const runId = process.argv[2] || `RUN-${Date.now()}`;
const profileId = parseInt(process.argv[3]) || 1;

runScoring(runId, profileId)
    .then(results => {
        console.log('\n🏀 BIG BOARD RESULTS');
        console.log('=' .repeat(60));
        console.log('Rank | Player ID | Score | Tier');
        console.log('-'.repeat(60));
        results.slice(0, 10).forEach(r => {
            console.log(`${r.rank.toString().padStart(4)} | ${r.playerId.toString().padStart(9)} | ${r.finalBoardScore.toFixed(1).padStart(5)} | ${r.tier}`);
        });
        if (results.length > 10) {
            console.log(`... and ${results.length - 10} more`);
        }
        process.exit(0);
    })
    .catch(err => {
        console.error('Scoring error:', err);
        process.exit(1);
    });
