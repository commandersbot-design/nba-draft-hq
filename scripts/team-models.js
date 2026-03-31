// Team-Specific Big Board Models
// Custom weights for each NBA team

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database', 'draft_hq.db');

const TEAM_MODELS = {
    'Lakers': {
        description: 'Win-now mode, need immediate contributors',
        weights: { decision_making: 22, shooting_gravity: 20, defensive_versatility: 16, off_ball_value: 14, advantage_creation: 10, processing_speed: 8, passing_creation: 6, scalability: 4 }
    },
    'Warriors': {
        description: 'Shooting and basketball IQ priority',
        weights: { shooting_gravity: 28, decision_making: 20, passing_creation: 12, processing_speed: 12, off_ball_value: 10, advantage_creation: 8, defensive_versatility: 6, scalability: 4 }
    },
    'Thunder': {
        description: 'High upside, long-term development',
        weights: { scalability: 22, advantage_creation: 20, defensive_versatility: 14, decision_making: 12, shooting_gravity: 10, processing_speed: 10, passing_creation: 8, off_ball_value: 4 }
    },
    'Spurs': {
        description: 'Two-way players, high character',
        weights: { defensive_versatility: 20, decision_making: 18, advantage_creation: 16, shooting_gravity: 12, processing_speed: 12, scalability: 10, passing_creation: 8, off_ball_value: 4 }
    },
    'Celtics': {
        description: 'Versatile wings, team defense',
        weights: { defensive_versatility: 24, shooting_gravity: 18, decision_making: 16, processing_speed: 14, off_ball_value: 12, advantage_creation: 8, passing_creation: 6, scalability: 2 }
    },
    'Knicks': {
        description: 'Toughness, defensive identity',
        weights: { defensive_versatility: 22, advantage_creation: 18, decision_making: 14, processing_speed: 14, shooting_gravity: 12, scalability: 10, off_ball_value: 6, passing_creation: 4 }
    },
    'Heat': {
        description: 'Culture fits, work ethic, two-way',
        weights: { decision_making: 20, defensive_versatility: 18, advantage_creation: 16, shooting_gravity: 14, processing_speed: 12, scalability: 10, off_ball_value: 6, passing_creation: 4 }
    },
    'Nuggets': {
        description: 'Playmaking bigs, basketball IQ',
        weights: { passing_creation: 20, decision_making: 20, shooting_gravity: 16, advantage_creation: 14, scalability: 12, processing_speed: 10, defensive_versatility: 6, off_ball_value: 2 }
    }
};

async function createTeamModel(teamName) {
    const model = TEAM_MODELS[teamName];
    if (!model) throw new Error(`Unknown team: ${teamName}`);
    
    const db = new sqlite3.Database(DB_PATH);
    
    // Check if model exists
    const existing = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM model_profiles WHERE profile_name = ?', [`${teamName} Big Board`], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
    
    if (existing) {
        db.close();
        return existing.id;
    }
    
    // Create new model
    const profileId = await new Promise((resolve, reject) => {
        db.run(`
            INSERT INTO model_profiles (profile_name, description, version, is_active)
            VALUES (?, ?, '1.0', 0)
        `, [`${teamName} Big Board`, model.description], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
    
    // Add weights
    for (const [trait, weight] of Object.entries(model.weights)) {
        await new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO model_category_weights (profile_id, category_key, weight)
                VALUES (?, ?, ?)
            `, [profileId, trait, weight], err => err ? reject(err) : resolve());
        });
    }
    
    db.close();
    console.log(`✓ Created ${teamName} Big Board model (ID: ${profileId})`);
    return profileId;
}

async function listTeamModels() {
    const db = new sqlite3.Database(DB_PATH);
    
    const models = await new Promise((resolve, reject) => {
        db.all(`
            SELECT id, profile_name, description 
            FROM model_profiles 
            WHERE profile_name LIKE '%Big Board%'
            ORDER BY profile_name
        `, (err, rows) => err ? reject(err) : resolve(rows));
    });
    
    db.close();
    return models;
}

// CLI
const command = process.argv[2];
const teamName = process.argv[3];

if (command === 'create' && teamName) {
    createTeamModel(teamName)
        .then(id => {
            console.log(`Model ID: ${id}`);
            process.exit(0);
        })
        .catch(err => {
            console.error('Error:', err.message);
            process.exit(1);
        });
} else if (command === 'list') {
    listTeamModels().then(models => {
        console.log('\nTeam-Specific Models:');
        models.forEach(m => console.log(`  ${m.id}: ${m.profile_name}`));
        process.exit(0);
    });
} else if (command === 'create-all') {
    Promise.all(Object.keys(TEAM_MODELS).map(createTeamModel))
        .then(() => {
            console.log('\n✓ All team models created');
            process.exit(0);
        });
} else {
    console.log('Usage:');
    console.log('  node team-models.js create <team-name>');
    console.log('  node team-models.js create-all');
    console.log('  node team-models.js list');
    console.log('\nAvailable teams:', Object.keys(TEAM_MODELS).join(', '));
}

module.exports = { TEAM_MODELS, createTeamModel, listTeamModels };
