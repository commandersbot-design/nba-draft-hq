-- NBA Draft HQ - Database Schema (V1)
-- Phase 1: Core Tables + Workflow System

-- ============================================
-- DATA LAYER: Player Information
-- ============================================

CREATE TABLE players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    position TEXT CHECK(position IN ('PG', 'SG', 'SF', 'PF', 'C', 'G', 'F', 'W')),
    secondary_position TEXT CHECK(secondary_position IN ('PG', 'SG', 'SF', 'PF', 'C', 'G', 'F', 'W')),
    height_inches INTEGER,
    weight_lbs INTEGER,
    wingspan_inches INTEGER,
    birth_date DATE,
    college TEXT,
    country TEXT DEFAULT 'USA',
    draft_class INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE player_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    season TEXT NOT NULL,
    level TEXT CHECK(level IN ('NCAA', 'G-League', 'International', 'High School')),
    games INTEGER,
    minutes_per_game REAL,
    points_per_game REAL,
    rebounds_per_game REAL,
    assists_per_game REAL,
    steals_per_game REAL,
    blocks_per_game REAL,
    turnovers_per_game REAL,
    fg_pct REAL,
    three_pct REAL,
    ft_pct REAL,
    ts_pct REAL,
    usg_pct REAL,
    ast_pct REAL,
    tov_pct REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE TABLE player_measurements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    source TEXT NOT NULL, -- 'Combine', 'Pro Day', 'Self Reported'
    height_inches INTEGER,
    weight_lbs INTEGER,
    wingspan_inches INTEGER,
    standing_reach INTEGER,
    hand_length REAL,
    hand_width REAL,
    body_fat_pct REAL,
    measured_at DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE TABLE player_testing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    source TEXT NOT NULL,
    lane_agility REAL, -- seconds
    shuttle_run REAL, -- seconds
    three_quarter_sprint REAL, -- seconds
    standing_vertical REAL, -- inches
    max_vertical REAL, -- inches
    max_bench_press INTEGER, -- reps
    tested_at DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- ============================================
-- CATEGORY SYSTEM: Universal Library
-- ============================================

CREATE TABLE category_definitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_key TEXT UNIQUE NOT NULL,
    category_name TEXT NOT NULL,
    category_type TEXT CHECK(category_type IN ('trait', 'stat', 'physical', 'testing', 'risk', 'projection')),
    description TEXT,
    min_grade INTEGER DEFAULT 1,
    max_grade INTEGER DEFAULT 9,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SCOUTING DATA: Traits, Risk, Roles
-- ============================================

CREATE TABLE player_trait_grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    category_key TEXT NOT NULL,
    grade INTEGER CHECK(grade >= 1 AND grade <= 9),
    confidence INTEGER CHECK(confidence >= 1 AND confidence <= 5),
    notes TEXT,
    scout_id TEXT,
    evaluated_at DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (category_key) REFERENCES category_definitions(category_key),
    UNIQUE(player_id, category_key, scout_id)
);

CREATE TABLE player_risk_flags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    risk_key TEXT NOT NULL,
    risk_level INTEGER CHECK(risk_level >= 0 AND risk_level <= 3),
    notes TEXT,
    scout_id TEXT,
    evaluated_at DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    UNIQUE(player_id, risk_key)
);

CREATE TABLE player_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    primary_role TEXT NOT NULL,
    secondary_role TEXT,
    nba_comparison TEXT,
    archetype TEXT,
    notes TEXT,
    scout_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE TABLE scouting_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    scout_id TEXT NOT NULL,
    summary TEXT,
    strengths TEXT,
    weaknesses TEXT,
    bottom_line TEXT,
    games_scouted INTEGER DEFAULT 0,
    report_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE TABLE player_videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    video_url TEXT NOT NULL,
    video_type TEXT CHECK(video_type IN ('full_game', 'highlights', 'workout', 'interview', 'analysis')),
    title TEXT,
    source TEXT,
    scout_id TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- ============================================
-- MODEL PROFILES: Scoring Configuration
-- ============================================

CREATE TABLE model_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_name TEXT UNIQUE NOT NULL,
    description TEXT,
    version TEXT DEFAULT '1.0',
    is_active BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE model_category_weights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL,
    category_key TEXT NOT NULL,
    weight INTEGER NOT NULL CHECK(weight >= 0),
    FOREIGN KEY (profile_id) REFERENCES model_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (category_key) REFERENCES category_definitions(category_key),
    UNIQUE(profile_id, category_key)
);

-- ============================================
-- SCORING OUTPUT: Calculated Results
-- ============================================

CREATE TABLE player_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    run_id TEXT NOT NULL,
    profile_id INTEGER NOT NULL,
    weighted_trait_score REAL,
    risk_penalty REAL,
    final_board_score REAL,
    tier TEXT,
    percentile INTEGER,
    scored_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (profile_id) REFERENCES model_profiles(id),
    UNIQUE(player_id, run_id, profile_id)
);

CREATE TABLE player_score_breakdown (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    score_id INTEGER NOT NULL,
    category_key TEXT NOT NULL,
    grade INTEGER,
    weighted_contribution REAL,
    FOREIGN KEY (score_id) REFERENCES player_scores(id) ON DELETE CASCADE,
    FOREIGN KEY (category_key) REFERENCES category_definitions(category_key)
);

-- ============================================
-- WORKFLOW SYSTEM: Staging → Approval → Commit
-- ============================================

CREATE TABLE staging_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id INTEGER,
    operation TEXT CHECK(operation IN ('INSERT', 'UPDATE', 'DELETE')),
    new_data JSON,
    old_data JSON,
    submitted_by TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    reviewed_by TEXT,
    reviewed_at DATETIME,
    notes TEXT
);

CREATE TABLE approval_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    action TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    details TEXT
);

CREATE TABLE committed_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT UNIQUE NOT NULL,
    description TEXT,
    records_affected INTEGER,
    committed_by TEXT,
    committed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_players_draft_class ON players(draft_class);
CREATE INDEX idx_players_position ON players(position);
CREATE INDEX idx_trait_grades_player ON player_trait_grades(player_id);
CREATE INDEX idx_trait_grades_category ON player_trait_grades(category_key);
CREATE INDEX idx_risk_flags_player ON player_risk_flags(player_id);
CREATE INDEX idx_scores_run ON player_scores(run_id);
CREATE INDEX idx_scores_final ON player_scores(final_board_score DESC);
CREATE INDEX idx_staging_run ON staging_updates(run_id);
CREATE INDEX idx_staging_status ON staging_updates(status);
