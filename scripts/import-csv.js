const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');

const DB_PATH = path.join(__dirname, '..', 'database', 'draft_hq.db');

function importPlayers(csvPath) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        const content = fs.readFileSync(csvPath, 'utf8');
        const records = csv.parse(content, { columns: true, skip_empty_lines: true });
        
        let pending = records.length;
        let inserted = 0;
        let errors = [];
        
        if (pending === 0) {
            db.close();
            return resolve(0);
        }
        
        const stmt = db.prepare(`
            INSERT INTO players (first_name, last_name, position, secondary_position, height_inches, weight_lbs, wingspan_inches, birth_date, college, country, draft_class)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        for (const row of records) {
            stmt.run([
                row.first_name,
                row.last_name,
                row.position || null,
                row.secondary_position || null,
                row.height_inches ? parseInt(row.height_inches) : null,
                row.weight_lbs ? parseInt(row.weight_lbs) : null,
                row.wingspan_inches ? parseInt(row.wingspan_inches) : null,
                row.birth_date || null,
                row.college || null,
                row.country || 'USA',
                parseInt(row.draft_class)
            ], function(err) {
                if (err) {
                    errors.push({ row: row.first_name + ' ' + row.last_name, error: err.message });
                } else {
                    inserted++;
                }
                pending--;
                if (pending === 0) {
                    stmt.finalize();
                    db.close();
                    if (errors.length > 0) {
                        console.error('Errors:', errors.slice(0, 3));
                    }
                    console.log(`✓ Imported ${inserted} players`);
                    resolve(inserted);
                }
            });
        }
    });
}

function importTraits(csvPath) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        const content = fs.readFileSync(csvPath, 'utf8');
        const records = csv.parse(content, { columns: true, skip_empty_lines: true });
        
        const traitColumns = [
            'advantage_creation', 'decision_making', 'passing_creation', 'shooting_gravity',
            'off_ball_value', 'processing_speed', 'scalability', 'defensive_versatility'
        ];
        
        let totalInserts = 0;
        records.forEach(r => traitColumns.forEach(t => { if (r[t]) totalInserts++; }));
        
        let pending = totalInserts;
        let inserted = 0;
        
        if (pending === 0) {
            db.close();
            return resolve(0);
        }
        
        for (const row of records) {
            const playerId = parseInt(row.player_id);
            const confidence = parseInt(row.confidence) || 4;
            const scoutId = row.scout_id || 'system';
            const evaluatedAt = row.evaluated_at;
            
            for (const trait of traitColumns) {
                if (row[trait]) {
                    db.run(`
                        INSERT INTO player_trait_grades (player_id, category_key, grade, confidence, scout_id, evaluated_at)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `, [playerId, trait, parseInt(row[trait]), confidence, scoutId, evaluatedAt], function(err) {
                        if (!err) inserted++;
                        pending--;
                        if (pending === 0) {
                            console.log(`✓ Imported ${inserted} trait grades`);
                            db.close();
                            resolve(inserted);
                        }
                    });
                }
            }
        }
    });
}

function importRisks(csvPath) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        const content = fs.readFileSync(csvPath, 'utf8');
        const records = csv.parse(content, { columns: true, skip_empty_lines: true });
        
        const riskColumns = [
            'shooting_risk', 'physical_translation_risk', 'creation_translation_risk',
            'defensive_role_risk', 'processing_risk', 'age_upside_risk',
            'motor_consistency_risk', 'medical_risk'
        ];
        
        let totalInserts = 0;
        records.forEach(r => riskColumns.forEach(risk => { if (r[risk] !== undefined && r[risk] !== '') totalInserts++; }));
        
        let pending = totalInserts;
        let inserted = 0;
        
        if (pending === 0) {
            db.close();
            return resolve(0);
        }
        
        for (const row of records) {
            const playerId = parseInt(row.player_id);
            const scoutId = row.scout_id || 'system';
            const evaluatedAt = row.evaluated_at;
            
            for (const risk of riskColumns) {
                if (row[risk] !== undefined && row[risk] !== '') {
                    db.run(`
                        INSERT INTO player_risk_flags (player_id, risk_key, risk_level, scout_id, evaluated_at)
                        VALUES (?, ?, ?, ?, ?)
                    `, [playerId, risk, parseInt(row[risk]), scoutId, evaluatedAt], function(err) {
                        if (!err) inserted++;
                        pending--;
                        if (pending === 0) {
                            console.log(`✓ Imported ${inserted} risk flags`);
                            db.close();
                            resolve(inserted);
                        }
                    });
                }
            }
        }
    });
}

// CLI
const command = process.argv[2];
const filePath = process.argv[3];

if (!command || !filePath) {
    console.log('Usage: node import-csv.js [players|traits|risks] <csv-file>');
    process.exit(1);
}

const fullPath = path.resolve(filePath);

if (!fs.existsSync(fullPath)) {
    console.error('File not found:', fullPath);
    process.exit(1);
}

switch (command) {
    case 'players':
        importPlayers(fullPath).then(() => process.exit(0));
        break;
    case 'traits':
        importTraits(fullPath).then(() => process.exit(0));
        break;
    case 'risks':
        importRisks(fullPath).then(() => process.exit(0));
        break;
    default:
        console.error('Unknown command:', command);
        process.exit(1);
}
