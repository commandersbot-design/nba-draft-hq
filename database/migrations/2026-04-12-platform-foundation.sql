CREATE TABLE IF NOT EXISTS player_aliases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    alias TEXT NOT NULL,
    alias_type TEXT NOT NULL DEFAULT 'source',
    source TEXT,
    confidence REAL DEFAULT 1,
    is_primary BOOLEAN DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    UNIQUE(player_id, alias, alias_type)
);

CREATE TABLE IF NOT EXISTS leagues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    level TEXT,
    country TEXT,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    league_id INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    short_name TEXT,
    league_id INTEGER,
    conference_id INTEGER,
    school_name TEXT,
    city TEXT,
    country TEXT,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE SET NULL,
    FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS seasons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    season_key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    start_year INTEGER NOT NULL,
    end_year INTEGER NOT NULL,
    league_id INTEGER,
    is_historical BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    external_game_key TEXT,
    season_id INTEGER,
    league_id INTEGER,
    game_date DATE,
    home_team_id INTEGER,
    away_team_id INTEGER,
    neutral_site BOOLEAN DEFAULT 0,
    game_type TEXT DEFAULT 'regular',
    source TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE SET NULL,
    FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE SET NULL,
    FOREIGN KEY (home_team_id) REFERENCES teams(id) ON DELETE SET NULL,
    FOREIGN KEY (away_team_id) REFERENCES teams(id) ON DELETE SET NULL,
    UNIQUE(source, external_game_key)
);

CREATE TABLE IF NOT EXISTS box_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    team_id INTEGER,
    season_id INTEGER,
    minutes REAL,
    points REAL,
    rebounds REAL,
    assists REAL,
    steals REAL,
    blocks REAL,
    turnovers REAL,
    fouls REAL,
    fg_made REAL,
    fg_attempts REAL,
    three_made REAL,
    three_attempts REAL,
    ft_made REAL,
    ft_attempts REAL,
    source_record_id INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
    FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE SET NULL,
    UNIQUE(game_id, player_id)
);

CREATE TABLE IF NOT EXISTS advanced_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    season_id INTEGER,
    team_id INTEGER,
    bpm REAL,
    obpm REAL,
    dbpm REAL,
    ts_pct REAL,
    efg_pct REAL,
    usage_rate REAL,
    assist_rate REAL,
    turnover_rate REAL,
    steal_rate REAL,
    block_rate REAL,
    offensive_rating REAL,
    defensive_rating REAL,
    pace REAL,
    source_record_id INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE SET NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS shooting_splits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    season_id INTEGER,
    split_type TEXT NOT NULL,
    attempts REAL,
    makes REAL,
    pct REAL,
    source_record_id INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shot_zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    season_id INTEGER,
    zone_key TEXT NOT NULL,
    attempts REAL,
    makes REAL,
    pct REAL,
    frequency REAL,
    source_record_id INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lineup_context (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    season_id INTEGER,
    team_id INTEGER,
    possessions REAL,
    on_court_net_rating REAL,
    on_off_net_rating REAL,
    source_record_id INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS playtype_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    season_id INTEGER,
    playtype_key TEXT NOT NULL,
    possessions REAL,
    frequency REAL,
    points_per_possession REAL,
    percentile REAL,
    source_record_id INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tracking_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    season_id INTEGER,
    stat_key TEXT NOT NULL,
    stat_value REAL,
    source_record_id INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS measurements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    season_id INTEGER,
    measurement_context TEXT DEFAULT 'pre-draft',
    height_inches REAL,
    weight_lbs REAL,
    wingspan_inches REAL,
    standing_reach_inches REAL,
    hand_length REAL,
    hand_width REAL,
    body_fat_pct REAL,
    max_vertical REAL,
    standing_vertical REAL,
    three_quarter_sprint REAL,
    lane_agility REAL,
    shuttle_run REAL,
    source_record_id INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recruiting_background (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL UNIQUE,
    recruiting_service TEXT,
    recruiting_rank INTEGER,
    recruiting_stars INTEGER,
    high_school TEXT,
    hometown TEXT,
    state_region TEXT,
    source_record_id INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS draft_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL UNIQUE,
    draft_year INTEGER,
    draft_slot INTEGER,
    draft_round INTEGER,
    nba_team TEXT,
    age_on_draft_night REAL,
    combine_invite BOOLEAN,
    source_record_id INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scouting_traits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trait_key TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    group_name TEXT NOT NULL,
    is_scoring_active BOOLEAN NOT NULL DEFAULT 0,
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trait_grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    trait_id INTEGER NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'model',
    score REAL NOT NULL,
    confidence REAL,
    override_lock BOOLEAN NOT NULL DEFAULT 0,
    source_record_id INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (trait_id) REFERENCES scouting_traits(id) ON DELETE CASCADE,
    UNIQUE(player_id, trait_id, source_type)
);

CREATE TABLE IF NOT EXISTS role_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_key TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS archetypes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    archetype_key TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    family TEXT,
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS source_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_name TEXT NOT NULL,
    reliability_tier TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    external_id TEXT,
    snapshot_path TEXT,
    payload_json JSON,
    compliance_mode TEXT,
    source_last_updated DATETIME,
    ingestion_run_id INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ingestion_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_key TEXT NOT NULL UNIQUE,
    source_name TEXT NOT NULL,
    job_name TEXT NOT NULL,
    mode TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'success', 'partial', 'error')),
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at DATETIME,
    records_seen INTEGER NOT NULL DEFAULT 0,
    records_written INTEGER NOT NULL DEFAULT 0,
    records_rejected INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    metadata_json JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS model_outputs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    model_version TEXT NOT NULL,
    overall_score REAL,
    tier TEXT,
    archetype_id INTEGER,
    primary_role_tag_id INTEGER,
    secondary_role_tag_id INTEGER,
    strengths_json JSON,
    concerns_json JSON,
    confidence_score REAL,
    data_coverage_json JSON,
    historical_outcome_band TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (archetype_id) REFERENCES archetypes(id) ON DELETE SET NULL,
    FOREIGN KEY (primary_role_tag_id) REFERENCES role_tags(id) ON DELETE SET NULL,
    FOREIGN KEY (secondary_role_tag_id) REFERENCES role_tags(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS player_comparisons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    compared_player_id INTEGER,
    historical_outcome_id INTEGER,
    comparison_type TEXT NOT NULL,
    distance_score REAL,
    component_breakdown_json JSON,
    explanation_json JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (compared_player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS historical_outcomes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER,
    draft_year INTEGER,
    draft_slot INTEGER,
    outcome_label TEXT NOT NULL,
    outcome_score REAL,
    nba_games INTEGER,
    nba_minutes REAL,
    career_box_plus_minus REAL,
    role_snapshot TEXT,
    class_strength_bucket TEXT,
    threshold_config_json JSON,
    source_record_id INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS entity_resolution_overrides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_name TEXT NOT NULL,
    external_id TEXT NOT NULL,
    player_id INTEGER NOT NULL,
    confidence_override REAL DEFAULT 1,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    UNIQUE(source_name, external_id)
);

CREATE INDEX IF NOT EXISTS idx_player_aliases_lookup ON player_aliases(alias, alias_type);
CREATE INDEX IF NOT EXISTS idx_seasons_key ON seasons(season_key);
CREATE INDEX IF NOT EXISTS idx_teams_slug ON teams(slug);
CREATE INDEX IF NOT EXISTS idx_games_season_date ON games(season_id, game_date);
CREATE INDEX IF NOT EXISTS idx_box_scores_player_season ON box_scores(player_id, season_id);
CREATE INDEX IF NOT EXISTS idx_advanced_stats_player_season ON advanced_stats(player_id, season_id);
CREATE INDEX IF NOT EXISTS idx_measurements_player_season ON measurements(player_id, season_id);
CREATE INDEX IF NOT EXISTS idx_source_records_lookup ON source_records(source_name, entity_type, external_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_lookup ON ingestion_runs(source_name, job_name, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_trait_grades_player ON trait_grades(player_id, trait_id);
CREATE INDEX IF NOT EXISTS idx_model_outputs_player_version ON model_outputs(player_id, model_version);
CREATE INDEX IF NOT EXISTS idx_player_comparisons_player_type ON player_comparisons(player_id, comparison_type);
CREATE INDEX IF NOT EXISTS idx_historical_outcomes_year_slot ON historical_outcomes(draft_year DESC, draft_slot ASC);
CREATE INDEX IF NOT EXISTS idx_entity_resolution_overrides_lookup ON entity_resolution_overrides(source_name, external_id);
