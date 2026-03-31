const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database', 'draft_hq.db');

function initDatabase() {
    // Remove existing DB if present
    if (fs.existsSync(DB_PATH)) {
        fs.unlinkSync(DB_PATH);
        console.log('Removed existing database');
    }

    const db = new sqlite3.Database(DB_PATH);
    
    console.log('Creating database...');
    
    // Read and execute schema
    const schema = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8');
    db.exec(schema, (err) => {
        if (err) {
            console.error('Schema error:', err);
            process.exit(1);
        }
        console.log('✓ Schema created');
        
        // Read and execute seeds
        const seeds = fs.readFileSync(path.join(__dirname, '..', 'database', 'seeds.sql'), 'utf8');
        db.exec(seeds, (err) => {
            if (err) {
                console.error('Seeds error:', err);
                process.exit(1);
            }
            console.log('✓ Seed data loaded');
            
            // Verify
            db.get('SELECT COUNT(*) as count FROM category_definitions', (err, row) => {
                if (err) {
                    console.error('Verify error:', err);
                } else {
                    console.log(`✓ ${row.count} categories defined`);
                }
                
                db.get('SELECT COUNT(*) as count FROM model_profiles', (err, row) => {
                    if (err) {
                        console.error('Verify error:', err);
                    } else {
                        console.log(`✓ ${row.count} model profiles`);
                    }
                    
                    db.get('SELECT COUNT(*) as count FROM model_category_weights', (err, row) => {
                        if (err) {
                            console.error('Verify error:', err);
                        } else {
                            console.log(`✓ ${row.count} category weights configured`);
                        }
                        
                        console.log('\nDatabase initialized successfully!');
                        db.close();
                    });
                });
            });
        });
    });
}

initDatabase();
