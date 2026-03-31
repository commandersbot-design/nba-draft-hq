const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database', 'draft_hq.db');

const additionalModels = `
-- UPSIDE MODEL
INSERT INTO model_profiles (profile_name, description, version, is_active) VALUES
('Upside Big Board', 'Prioritizes star upside and scalability.', '1.0', 0);

INSERT INTO model_category_weights (profile_id, category_key, weight) 
SELECT id, 'advantage_creation', 25 FROM model_profiles WHERE profile_name = 'Upside Big Board';
INSERT INTO model_category_weights (profile_id, category_key, weight) 
SELECT id, 'scalability', 18 FROM model_profiles WHERE profile_name = 'Upside Big Board';
INSERT INTO model_category_weights (profile_id, category_key, weight) 
SELECT id, 'shooting_gravity', 12 FROM model_profiles WHERE profile_name = 'Upside Big Board';
INSERT INTO model_category_weights (profile_id, category_key, weight) 
SELECT id, 'decision_making', 12 FROM model_profiles WHERE profile_name = 'Upside Big Board';
INSERT INTO model_category_weights (profile_id, category_key, weight) 
SELECT id, 'defensive_versatility', 12 FROM model_profiles WHERE profile_name = 'Upside Big Board';
INSERT INTO model_category_weights (profile_id, category_key, weight) 
SELECT id, 'processing_speed', 10 FROM model_profiles WHERE profile_name = 'Upside Big Board';
INSERT INTO model_category_weights (profile_id, category_key, weight) 
SELECT id, 'passing_creation', 7 FROM model_profiles WHERE profile_name = 'Upside Big Board';
INSERT INTO model_category_weights (profile_id, category_key, weight) 
SELECT id, 'off_ball_value', 4 FROM model_profiles WHERE profile_name = 'Upside Big Board';

-- SAFE PICK MODEL
INSERT INTO model_profiles (profile_name, description, version, is_active) VALUES
('Safe Pick Big Board', 'Prioritizes NBA readiness and low risk.', '1.0', 0);

INSERT INTO model_category_weights (profile_id, category_key, weight) 
SELECT id, 'decision_making', 22 FROM model_profiles WHERE profile_name = 'Safe Pick Big Board';
INSERT INTO model_category_weights (profile_id, category_key, weight) 
SELECT id, 'shooting_gravity', 18 FROM model_profiles WHERE profile_name = 'Safe Pick Big Board';
INSERT INTO model_category_weights (profile_id, category_key, weight) 
SELECT id, 'defensive_versatility', 15 FROM model_profiles WHERE profile_name = 'Safe Pick Big Board';
INSERT INTO model_category_weights (profile_id, category_key, weight) 
SELECT id, 'off_ball_value', 12 FROM model_profiles WHERE profile_name = 'Safe Pick Big Board';
INSERT INTO model_category_weights (profile_id, category_key, weight) 
SELECT id, 'advantage_creation', 12 FROM model_profiles WHERE profile_name = 'Safe Pick Big Board';
INSERT INTO model_category_weights (profile_id, category_key, weight) 
SELECT id, 'processing_speed', 10 FROM model_profiles WHERE profile_name = 'Safe Pick Big Board';
INSERT INTO model_category_weights (profile_id, category_key, weight) 
SELECT id, 'passing_creation', 7 FROM model_profiles WHERE profile_name = 'Safe Pick Big Board';
INSERT INTO model_category_weights (profile_id, category_key, weight) 
SELECT id, 'scalability', 4 FROM model_profiles WHERE profile_name = 'Safe Pick Big Board';
`;

const db = new sqlite3.Database(DB_PATH);
db.exec(additionalModels, (err) => {
    if (err) {
        console.error('Error:', err.message);
    } else {
        console.log('✓ Added Upside and Safe Pick models');
    }
    db.close();
});
