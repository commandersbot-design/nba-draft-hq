-- ============================================
-- ADDITIONAL MODEL PROFILES
-- ============================================

-- UPSIDE MODEL (Prioritizes star potential)
INSERT INTO model_profiles (profile_name, description, version, is_active) VALUES
('Upside Big Board', 'Prioritizes star upside and scalability. Higher weight on advantage creation and athletic traits. For teams seeking franchise cornerstones.', '1.0', 0);

INSERT INTO model_category_weights (profile_id, category_key, weight) VALUES
((SELECT id FROM model_profiles WHERE profile_name = 'Upside Big Board'), 'advantage_creation', 25),
((SELECT id FROM model_profiles WHERE profile_name = 'Upside Big Board'), 'scalability', 18),
((SELECT id FROM model_profiles WHERE profile_name = 'Upside Big Board'), 'shooting_gravity', 12),
((SELECT id FROM model_profiles WHERE profile_name = 'Upside Big Board'), 'decision_making', 12),
((SELECT id FROM model_profiles WHERE profile_name = 'Upside Big Board'), 'defensive_versatility', 12),
((SELECT id FROM model_profiles WHERE profile_name = 'Upside Big Board'), 'processing_speed', 10),
((SELECT id FROM model_profiles WHERE profile_name = 'Upside Big Board'), 'passing_creation', 7),
((SELECT id FROM model_profiles WHERE profile_name = 'Upside Big Board'), 'off_ball_value', 4);

-- SAFE PICK MODEL (Prioritizes NBA readiness)
INSERT INTO model_profiles (profile_name, description, version, is_active) VALUES
('Safe Pick Big Board', 'Prioritizes NBA readiness and low risk. Higher weight on decision making and proven production. For playoff teams seeking rotation pieces.', '1.0', 0);

INSERT INTO model_category_weights (profile_id, category_key, weight) VALUES
((SELECT id FROM model_profiles WHERE profile_name = 'Safe Pick Big Board'), 'decision_making', 22),
((SELECT id FROM model_profiles WHERE profile_name = 'Safe Pick Big Board'), 'shooting_gravity', 18),
((SELECT id FROM model_profiles WHERE profile_name = 'Safe Pick Big Board'), 'defensive_versatility', 15),
((SELECT id FROM model_profiles WHERE profile_name = 'Safe Pick Big Board'), 'off_ball_value', 12),
((SELECT id FROM model_profiles WHERE profile_name = 'Safe Pick Big Board'), 'advantage_creation', 12),
((SELECT id FROM model_profiles WHERE profile_name = 'Safe Pick Big Board'), 'processing_speed', 10),
((SELECT id FROM model_profiles WHERE profile_name = 'Safe Pick Big Board'), 'passing_creation', 7),
((SELECT id FROM model_profiles WHERE profile_name = 'Safe Pick Big Board'), 'scalability', 4);

-- SHOOTING MODEL (Prioritizes floor spacing)
INSERT INTO model_profiles (profile_name, description, version, is_active) VALUES
('Shooting Big Board', 'Prioritizes shooting and offensive gravity. For teams needing floor spacing and off-ball threats.', '1.0', 0);

INSERT INTO model_category_weights (profile_id, category_key, weight) VALUES
((SELECT id FROM model_profiles WHERE profile_name = 'Shooting Big Board'), 'shooting_gravity', 28),
((SELECT id FROM model_profiles WHERE profile_name = 'Shooting Big Board'), 'off_ball_value', 18),
((SELECT id FROM model_profiles WHERE profile_name = 'Shooting Big Board'), 'decision_making', 14),
((SELECT id FROM model_profiles WHERE profile_name = 'Shooting Big Board'), 'advantage_creation', 12),
((SELECT id FROM model_profiles WHERE profile_name = 'Shooting Big Board'), 'processing_speed', 10),
((SELECT id FROM model_profiles WHERE profile_name = 'Shooting Big Board'), 'scalability', 8),
((SELECT id FROM model_profiles WHERE profile_name = 'Shooting Big Board'), 'defensive_versatility', 6),
((SELECT id FROM model_profiles WHERE profile_name = 'Shooting Big Board'), 'passing_creation', 4);

-- DEFENSE MODEL (Prioritizes defensive impact)
INSERT INTO model_profiles (profile_name, description, version, is_active) VALUES
('Defense Big Board', 'Prioritizes defensive versatility and impact. For teams building around defense and switchability.', '1.0', 0);

INSERT INTO model_category_weights (profile_id, category_key, weight) VALUES
((SELECT id FROM model_profiles WHERE profile_name = 'Defense Big Board'), 'defensive_versatility', 30),
((SELECT id FROM model_profiles WHERE profile_name = 'Defense Big Board'), 'processing_speed', 18),
((SELECT id FROM model_profiles WHERE profile_name = 'Defense Big Board'), 'advantage_creation', 12),
((SELECT id FROM model_profiles WHERE profile_name = 'Defense Big Board'), 'decision_making', 12),
((SELECT id FROM model_profiles WHERE profile_name = 'Defense Big Board'), 'scalability', 10),
((SELECT id FROM model_profiles WHERE profile_name = 'Defense Big Board'), 'shooting_gravity', 8),
((SELECT id FROM model_profiles WHERE profile_name = 'Defense Big Board'), 'off_ball_value', 6),
((SELECT id FROM model_profiles WHERE profile_name = 'Defense Big Board'), 'passing_creation', 4);
