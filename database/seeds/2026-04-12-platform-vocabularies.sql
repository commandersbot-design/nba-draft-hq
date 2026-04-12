INSERT OR IGNORE INTO scouting_traits (trait_key, display_name, group_name, is_scoring_active, description) VALUES
('advantage_creation', 'Advantage Creation', 'core', 1, 'Ability to create an advantage against a set defense.'),
('decision_making', 'Decision Making', 'core', 1, 'Quality and speed of offensive and defensive choices.'),
('passing_creation', 'Passing Creation', 'core', 1, 'Ability to generate shots for teammates.'),
('shooting_gravity', 'Shooting Gravity', 'core', 1, 'How much a player changes spacing with shooting threat.'),
('off_ball_value', 'Off-Ball Value', 'core', 1, 'Screening, cutting, relocation, and connective play.'),
('processing_speed', 'Processing Speed', 'core', 1, 'How quickly the player reads and reacts.'),
('scalability', 'Scalability', 'core', 1, 'How well the player keeps value as role and usage change.'),
('defensive_versatility', 'Defensive Versatility', 'core', 1, 'Breadth of defensive assignments and scheme flexibility.'),
('rim_finishing', 'Rim Finishing', 'future', 0, 'Optional future trait for interior finishing quality.'),
('mid_range_game', 'Mid-Range Game', 'future', 0, 'Optional future trait for mid-range scoring.'),
('three_pt_shooting', '3PT Shooting', 'future', 0, 'Optional future trait for long-range accuracy and versatility.'),
('free_throw_shooting', 'Free Throw Shooting', 'future', 0, 'Optional future trait for foul-line skill.'),
('post_game', 'Post Game', 'future', 0, 'Optional future trait for back-to-basket value.'),
('isolation_scoring', 'Isolation Scoring', 'future', 0, 'Optional future trait for one-on-one scoring.'),
('screen_navigation', 'Screen Navigation', 'future', 0, 'Optional future trait for point-of-attack defense.'),
('rim_protection', 'Rim Protection', 'future', 0, 'Optional future trait for shot deterrence and contesting.'),
('help_defense', 'Help Defense', 'future', 0, 'Optional future trait for weak-side reads and rotations.'),
('motor_activity', 'Motor / Activity', 'future', 0, 'Optional future trait for energy and play frequency.');

INSERT OR IGNORE INTO role_tags (role_key, display_name, description) VALUES
('primary_creator', 'Primary Creator', 'Primary offensive engine and advantage starter.'),
('secondary_creator', 'Secondary Creator', 'Secondary ballhandler and advantage extender.'),
('movement_shooter', 'Movement Shooter', 'Off-ball shooter who bends spacing with motion.'),
('connective_wing', 'Connective Wing', 'Wing who links possessions without high on-ball volume.'),
('rim_pressure_guard', 'Rim Pressure Guard', 'Guard whose value begins with downhill pressure.'),
('playmaking_big', 'Playmaking Big', 'Big who creates offense through passing and hub actions.'),
('switchable_defender', 'Switchable Defender', 'Defender who can credibly cover multiple spots.'),
('event_creator', 'Event Creator', 'Player who drives stocks, deflections, or disruption.'),
('low_usage_spacer', 'Low-Usage Spacer', 'Low-touch shooter who preserves spacing value.'),
('interior_finisher', 'Interior Finisher', 'Interior scorer, roller, or paint finisher.');

INSERT OR IGNORE INTO archetypes (archetype_key, display_name, family, description) VALUES
('primary_engine', 'Primary Engine', 'creator', 'High-usage offensive organizer.'),
('secondary_connector', 'Secondary Connector', 'connector', 'Secondary initiator with connective value.'),
('movement_shooter', 'Movement Shooter', 'shooting', 'Dynamic off-ball shooting specialist.'),
('two_way_wing', 'Two-Way Wing', 'wing', 'Wing profile built around scalable two-way impact.'),
('rim_pressure_guard', 'Rim Pressure Guard', 'guard', 'Guard built around downhill burst and paint touches.'),
('playmaking_big', 'Playmaking Big', 'big', 'Big whose value includes passing and connective reads.'),
('defensive_big', 'Defensive Big', 'big', 'Big anchored by rim deterrence and interior defense.'),
('utility_forward', 'Utility Forward', 'forward', 'Forward with flexible role value across lineups.');

INSERT OR IGNORE INTO leagues (slug, name, level, country) VALUES
('ncaa', 'NCAA', 'college', 'USA'),
('g-league', 'NBA G League', 'development', 'USA'),
('international-pro', 'International Pro', 'professional', 'Mixed'),
('high-school', 'High School', 'amateur', 'USA'),
('nba', 'NBA', 'professional', 'USA');

INSERT OR IGNORE INTO conferences (slug, name) VALUES
('acc', 'ACC'),
('big-ten', 'Big Ten'),
('big-12', 'Big 12'),
('sec', 'SEC'),
('big-east', 'Big East'),
('wcc', 'WCC');
