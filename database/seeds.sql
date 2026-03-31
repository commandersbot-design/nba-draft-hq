-- NBA Draft HQ - Seed Data (V1)
-- Category Definitions + Model Profile

-- ============================================
-- CATEGORY DEFINITIONS: Universal Library
-- ============================================

-- TRAITS (Core scouting evaluations)
INSERT INTO category_definitions (category_key, category_name, category_type, description, is_active) VALUES
('advantage_creation', 'Advantage Creation', 'trait', 'Ability to create offensive advantages via dribble, pass, or movement', 1),
('decision_making', 'Decision Making', 'trait', 'Quality of choices under pressure, shot selection, turnover avoidance', 1),
('passing_creation', 'Passing Creation', 'trait', 'Playmaking vision, accuracy, and ability to generate open looks for others', 1),
('shooting_gravity', 'Shooting Gravity', 'trait', 'Three-level scoring threat and spacing impact on defense', 1),
('off_ball_value', 'Off-Ball Value', 'trait', 'Cutting, relocation, screening, and impact without the ball', 1),
('processing_speed', 'Processing Speed', 'trait', 'Speed of reads, reaction time, defensive rotations', 1),
('scalability', 'Scalability', 'trait', 'Ability to maintain effectiveness in increased role or usage', 1),
('defensive_versatility', 'Defensive Versatility', 'trait', 'Range of defensive assignments, switchability, team defense impact', 1);

-- RISK FLAGS
INSERT INTO category_definitions (category_key, category_name, category_type, description, min_grade, max_grade, is_active) VALUES
('shooting_risk', 'Shooting Risk', 'risk', 'Uncertainty around shooting translation to NBA', 0, 3, 1),
('physical_translation_risk', 'Physical Translation Risk', 'risk', 'Concerns about body/frame holding up at NBA level', 0, 3, 1),
('creation_translation_risk', 'Creation Translation Risk', 'risk', 'Uncertainty about shot creation against NBA length/athleticism', 0, 3, 1),
('defensive_role_risk', 'Defensive Role Risk', 'risk', 'Questions about defensive position/role at next level', 0, 3, 1),
('processing_risk', 'Processing Risk', 'risk', 'Concerns about decision-making speed/quality against NBA complexity', 0, 3, 1),
('age_upside_risk', 'Age/Upside Risk', 'risk', 'Uncertainty tied to age (too old = limited upside, too young = raw)', 0, 3, 1),
('motor_consistency_risk', 'Motor/Consistency Risk', 'risk', 'Questions about effort, consistency, or competitive toughness', 0, 3, 1),
('medical_risk', 'Medical Risk', 'risk', 'Injury history or durability concerns', 0, 3, 1);

-- STATS (Tracked but not scored in V1)
INSERT INTO category_definitions (category_key, category_name, category_type, description, is_active) VALUES
('pts_per_40', 'Points Per 40 Minutes', 'stat', 'Scoring rate normalized to 40 minutes', 0),
('ast_per_40', 'Assists Per 40 Minutes', 'stat', 'Playmaking rate normalized to 40 minutes', 0),
('reb_per_40', 'Rebounds Per 40 Minutes', 'stat', 'Rebounding rate normalized to 40 minutes', 0),
('stl_per_40', 'Steals Per 40 Minutes', 'stat', 'Defensive playmaking rate', 0),
('blk_per_40', 'Blocks Per 40 Minutes', 'stat', 'Rim protection rate', 0),
('ts_pct', 'True Shooting %', 'stat', 'Scoring efficiency', 0),
('usg_pct', 'Usage %', 'stat', 'Offensive involvement rate', 0),
('ast_pct', 'Assist %', 'stat', 'Playmaking involvement', 0);

-- PHYSICAL
INSERT INTO category_definitions (category_key, category_name, category_type, description, is_active) VALUES
('height', 'Height', 'physical', 'Measured height in shoes', 0),
('wingspan', 'Wingspan', 'physical', 'Measured wingspan', 0),
('standing_reach', 'Standing Reach', 'physical', 'Standing reach measurement', 0),
('weight', 'Weight', 'physical', 'Body weight', 0),
('body_composition', 'Body Composition', 'physical', 'Frame, strength, room to add mass', 0);

-- TESTING
INSERT INTO category_definitions (category_key, category_name, category_type, description, is_active) VALUES
('lane_agility', 'Lane Agility', 'testing', 'Defensive slide and agility test', 0),
('shuttle_run', 'Shuttle Run', 'testing', 'Change of direction speed', 0),
('three_quarter_sprint', '3/4 Court Sprint', 'testing', 'Straight-line speed', 0),
('max_vertical', 'Max Vertical', 'testing', 'Explosive leaping ability', 0),
('standing_vertical', 'Standing Vertical', 'testing', 'Standing leap without run-up', 0);

-- PROJECTION
INSERT INTO category_definitions (category_key, category_name, category_type, description, is_active) VALUES
('star_probability', 'Star Probability', 'projection', 'Likelihood of becoming All-Star level', 0),
('starter_probability', 'Starter Probability', 'projection', 'Likelihood of becoming NBA starter', 0),
('rotation_probability', 'Rotation Probability', 'projection', 'Likelihood of becoming rotation player', 0);

-- ============================================
-- MODEL PROFILE: V1 Neutral Big Board
-- ============================================

INSERT INTO model_profiles (profile_name, description, version, is_active) VALUES
('V1 Neutral Big Board', 'Balanced evaluation prioritizing star upside at top, role players mid/late. Creation > shooting but both matter. Light age penalty.', '1.0', 1);

-- Set weights for the 8 active scoring traits
INSERT INTO model_category_weights (profile_id, category_key, weight) VALUES
((SELECT id FROM model_profiles WHERE profile_name = 'V1 Neutral Big Board'), 'advantage_creation', 20),
((SELECT id FROM model_profiles WHERE profile_name = 'V1 Neutral Big Board'), 'decision_making', 16),
((SELECT id FROM model_profiles WHERE profile_name = 'V1 Neutral Big Board'), 'shooting_gravity', 14),
((SELECT id FROM model_profiles WHERE profile_name = 'V1 Neutral Big Board'), 'scalability', 14),
((SELECT id FROM model_profiles WHERE profile_name = 'V1 Neutral Big Board'), 'defensive_versatility', 12),
((SELECT id FROM model_profiles WHERE profile_name = 'V1 Neutral Big Board'), 'processing_speed', 10),
((SELECT id FROM model_profiles WHERE profile_name = 'V1 Neutral Big Board'), 'passing_creation', 8),
((SELECT id FROM model_profiles WHERE profile_name = 'V1 Neutral Big Board'), 'off_ball_value', 6);
