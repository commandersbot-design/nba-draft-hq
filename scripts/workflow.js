const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database', 'draft_hq.db');

// ============================================
// STAGING SYSTEM
// ============================================

function generateRunId() {
    const now = new Date();
    const date = now.toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RUN-${date}-${random}`;
}

function checkDuplicateRunId(runId) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        
        db.get('SELECT 1 FROM committed_runs WHERE run_id = ?', [runId], (err, row) => {
            if (err) return reject(err);
            db.close();
            resolve(!!row);
        });
    });
}

function stageUpdate(runId, tableName, recordId, operation, newData, oldData = null, submittedBy = 'system') {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        
        db.run(`
            INSERT INTO staging_updates (run_id, table_name, record_id, operation, new_data, old_data, submitted_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [runId, tableName, recordId, operation, JSON.stringify(newData), oldData ? JSON.stringify(oldData) : null, submittedBy], function(err) {
            if (err) return reject(err);
            db.close();
            resolve(this.lastID);
        });
    });
}

function stageTraitGrades(runId, playerId, grades, scoutId = 'system') {
    return new Promise(async (resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        
        // Check for duplicate run
        const isDuplicate = await checkDuplicateRunId(runId);
        if (isDuplicate) {
            db.close();
            return reject(new Error(`Run ID ${runId} already committed`));
        }
        
        let staged = 0;
        
        for (const [categoryKey, grade] of Object.entries(grades)) {
            const newData = {
                player_id: playerId,
                category_key: categoryKey,
                grade: grade,
                scout_id: scoutId,
                evaluated_at: new Date().toISOString().split('T')[0]
            };
            
            await stageUpdate(runId, 'player_trait_grades', null, 'INSERT', newData, null, scoutId);
            staged++;
        }
        
        db.close();
        console.log(`✓ Staged ${staged} trait grades for Run ${runId}`);
        resolve(staged);
    });
}

function stageRiskFlags(runId, playerId, risks, scoutId = 'system') {
    return new Promise(async (resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        
        const isDuplicate = await checkDuplicateRunId(runId);
        if (isDuplicate) {
            db.close();
            return reject(new Error(`Run ID ${runId} already committed`));
        }
        
        let staged = 0;
        
        for (const [riskKey, level] of Object.entries(risks)) {
            const newData = {
                player_id: playerId,
                risk_key: riskKey,
                risk_level: level,
                scout_id: scoutId,
                evaluated_at: new Date().toISOString().split('T')[0]
            };
            
            await stageUpdate(runId, 'player_risk_flags', null, 'INSERT', newData, null, scoutId);
            staged++;
        }
        
        db.close();
        console.log(`✓ Staged ${staged} risk flags for Run ${runId}`);
        resolve(staged);
    });
}

// ============================================
// APPROVAL SYSTEM
// ============================================

function getPendingRuns() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        
        db.all(`
            SELECT DISTINCT run_id, COUNT(*) as record_count, MIN(submitted_at) as submitted_at
            FROM staging_updates
            WHERE status = 'pending'
            GROUP BY run_id
            ORDER BY submitted_at DESC
        `, (err, rows) => {
            if (err) return reject(err);
            db.close();
            resolve(rows);
        });
    });
}

function reviewRun(runId, approve = true, reviewer = 'admin', notes = '') {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        const status = approve ? 'approved' : 'rejected';
        
        db.run(`
            UPDATE staging_updates
            SET status = ?, reviewed_by = ?, reviewed_at = datetime('now'), notes = ?
            WHERE run_id = ? AND status = 'pending'
        `, [status, reviewer, notes, runId], function(err) {
            if (err) return reject(err);
            
            const affected = this.changes;
            
            // Log the action
            db.run(`
                INSERT INTO approval_log (run_id, action, performed_by, details)
                VALUES (?, ?, ?, ?)
            `, [runId, status.toUpperCase(), reviewer, `${affected} records ${status}. ${notes}`]);
            
            db.close();
            console.log(`✓ Run ${runId} ${status}: ${affected} records`);
            resolve(affected);
        });
    });
}

// ============================================
// COMMIT SYSTEM
// ============================================

function commitRun(runId, committedBy = 'admin') {
    return new Promise(async (resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        
        // Check if already committed
        const isDuplicate = await checkDuplicateRunId(runId);
        if (isDuplicate) {
            db.close();
            return reject(new Error(`Run ${runId} already committed`));
        }
        
        // Get approved records
        db.all(`
            SELECT * FROM staging_updates
            WHERE run_id = ? AND status = 'approved'
        `, [runId], async (err, records) => {
            if (err) return reject(err);
            
            if (records.length === 0) {
                db.close();
                return reject(new Error(`No approved records found for Run ${runId}`));
            }
            
            let committed = 0;
            
            for (const record of records) {
                const data = JSON.parse(record.new_data);
                
                if (record.table_name === 'player_trait_grades') {
                    await new Promise((res, rej) => {
                        db.run(`
                            INSERT INTO player_trait_grades (player_id, category_key, grade, confidence, scout_id, evaluated_at)
                            VALUES (?, ?, ?, ?, ?, ?)
                            ON CONFLICT(player_id, category_key, scout_id) DO UPDATE SET
                                grade = excluded.grade,
                                evaluated_at = excluded.evaluated_at
                        `, [data.player_id, data.category_key, data.grade, data.confidence || 4, data.scout_id, data.evaluated_at], (err) => {
                            if (err) rej(err);
                            else res();
                        });
                    });
                } else if (record.table_name === 'player_risk_flags') {
                    await new Promise((res, rej) => {
                        db.run(`
                            INSERT INTO player_risk_flags (player_id, risk_key, risk_level, scout_id, evaluated_at)
                            VALUES (?, ?, ?, ?, ?)
                            ON CONFLICT(player_id, risk_key) DO UPDATE SET
                                risk_level = excluded.risk_level,
                                scout_id = excluded.scout_id,
                                evaluated_at = excluded.evaluated_at
                        `, [data.player_id, data.risk_key, data.risk_level, data.scout_id, data.evaluated_at], (err) => {
                            if (err) rej(err);
                            else res();
                        });
                    });
                }
                
                committed++;
            }
            
            // Mark as committed
            db.run(`
                INSERT INTO committed_runs (run_id, description, records_affected, committed_by)
                VALUES (?, ?, ?, ?)
            `, [runId, `Batch commit of ${committed} records`, committed, committedBy]);
            
            // Log
            db.run(`
                INSERT INTO approval_log (run_id, action, performed_by, details)
                VALUES (?, 'COMMIT', ?, ?)
            `, [runId, committedBy, `${committed} records committed to production`]);
            
            setTimeout(() => {
                db.close();
                console.log(`✓ Committed ${committed} records for Run ${runId}`);
                resolve(committed);
            }, 100);
        });
    });
}

// ============================================
// CLI
// ============================================

const command = process.argv[2];

async function main() {
    switch (command) {
        case 'list':
            const runs = await getPendingRuns();
            console.log('\nPending Runs:');
            console.log('-'.repeat(60));
            runs.forEach(r => {
                console.log(`${r.run_id} | ${r.record_count} records | ${r.submitted_at}`);
            });
            break;
            
        case 'approve':
            const approveRunId = process.argv[3];
            if (!approveRunId) {
                console.error('Run ID required');
                process.exit(1);
            }
            await reviewRun(approveRunId, true, process.argv[4] || 'admin');
            break;
            
        case 'reject':
            const rejectRunId = process.argv[3];
            if (!rejectRunId) {
                console.error('Run ID required');
                process.exit(1);
            }
            await reviewRun(rejectRunId, false, process.argv[4] || 'admin', process.argv[5] || '');
            break;
            
        case 'commit':
            const commitRunId = process.argv[3];
            if (!commitRunId) {
                console.error('Run ID required');
                process.exit(1);
            }
            await commitRun(commitRunId, process.argv[4] || 'admin');
            break;
            
        case 'new-id':
            console.log(generateRunId());
            break;
            
        default:
            console.log('Usage:');
            console.log('  node workflow.js list              - List pending runs');
            console.log('  node workflow.js approve <run-id>  - Approve a run');
            console.log('  node workflow.js reject <run-id>   - Reject a run');
            console.log('  node workflow.js commit <run-id>   - Commit approved run');
            console.log('  node workflow.js new-id            - Generate new Run ID');
    }
}

main().then(() => process.exit(0)).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});

module.exports = {
    generateRunId,
    checkDuplicateRunId,
    stageTraitGrades,
    stageRiskFlags,
    getPendingRuns,
    reviewRun,
    commitRun
};
