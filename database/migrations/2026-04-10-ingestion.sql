CREATE TABLE IF NOT EXISTS source_sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    sync_type TEXT NOT NULL,
    season TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('running', 'success', 'error')),
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at DATETIME,
    records_fetched INTEGER NOT NULL DEFAULT 0,
    records_written INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    metadata_json JSON
);

CREATE TABLE IF NOT EXISTS cbb_player_seasons_raw (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_player_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    season TEXT NOT NULL,
    school_team TEXT,
    league TEXT,
    class_year TEXT,
    age REAL,
    position TEXT,
    source TEXT NOT NULL,
    payload JSON NOT NULL,
    source_last_updated DATETIME NOT NULL,
    inserted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source, source_player_id, season)
);

CREATE TABLE IF NOT EXISTS cbb_game_logs_raw (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_player_id TEXT NOT NULL,
    source_game_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    season TEXT NOT NULL,
    game_date DATE,
    school_team TEXT,
    opponent TEXT,
    league TEXT,
    source TEXT NOT NULL,
    payload JSON NOT NULL,
    source_last_updated DATETIME NOT NULL,
    inserted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source, source_game_id, source_player_id)
);

CREATE TABLE IF NOT EXISTS cbb_advanced_metrics_raw (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_player_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    season TEXT NOT NULL,
    school_team TEXT,
    league TEXT,
    position TEXT,
    source TEXT NOT NULL,
    payload JSON NOT NULL,
    source_last_updated DATETIME NOT NULL,
    inserted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source, source_player_id, season)
);

CREATE TABLE IF NOT EXISTS nba_draft_history_raw (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_player_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    draft_year INTEGER NOT NULL,
    draft_slot INTEGER,
    nba_team TEXT,
    position TEXT,
    school_team TEXT,
    source TEXT NOT NULL,
    payload JSON NOT NULL,
    source_last_updated DATETIME NOT NULL,
    inserted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source, source_player_id, draft_year)
);

CREATE TABLE IF NOT EXISTS nba_player_outcomes_raw (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_player_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    draft_year INTEGER,
    nba_team TEXT,
    source TEXT NOT NULL,
    payload JSON NOT NULL,
    source_last_updated DATETIME NOT NULL,
    inserted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source, source_player_id, draft_year)
);

CREATE TABLE IF NOT EXISTS combine_measurements_raw (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_player_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    combine_year INTEGER NOT NULL,
    position TEXT,
    source TEXT NOT NULL,
    payload JSON NOT NULL,
    source_last_updated DATETIME NOT NULL,
    inserted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source, source_player_id, combine_year)
);

CREATE TABLE IF NOT EXISTS player_stats_raw (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    season TEXT NOT NULL,
    source TEXT NOT NULL,
    external_player_key TEXT,
    payload JSON NOT NULL,
    last_updated DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    UNIQUE(player_id, season, source, external_player_key)
);

CREATE TABLE IF NOT EXISTS player_game_logs_raw (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    season TEXT NOT NULL,
    source TEXT NOT NULL,
    external_game_key TEXT NOT NULL,
    game_date DATE,
    opponent TEXT,
    payload JSON NOT NULL,
    last_updated DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    UNIQUE(player_id, source, external_game_key)
);

CREATE TABLE IF NOT EXISTS player_stats_normalized (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    season TEXT NOT NULL,
    source TEXT NOT NULL,
    last_updated DATETIME NOT NULL,
    position_group TEXT,
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
    efg_pct REAL,
    usg_pct REAL,
    ast_pct REAL,
    tov_pct REAL,
    ortg REAL,
    drtg REAL,
    bpm REAL,
    rebound_rate REAL,
    percentile_json JSON,
    strengths_json JSON,
    weaknesses_json JSON,
    archetype_indicators_json JSON,
    comparison_inputs_json JSON,
    stat_cards_json JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    UNIQUE(player_id, season, source)
);

CREATE TABLE IF NOT EXISTS historical_prospects_raw (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    historical_id TEXT NOT NULL UNIQUE,
    draft_year INTEGER NOT NULL,
    draft_slot INTEGER NOT NULL,
    player_name TEXT NOT NULL,
    position TEXT NOT NULL,
    school TEXT NOT NULL,
    height TEXT,
    age REAL,
    archetype TEXT,
    role_outcome TEXT,
    outcome_tier TEXT,
    points_per_game REAL,
    rebounds_per_game REAL,
    assists_per_game REAL,
    true_shooting TEXT,
    bpm REAL,
    notes TEXT,
    source TEXT NOT NULL,
    payload JSON NOT NULL,
    last_updated DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS historical_prospects_normalized (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    historical_id TEXT NOT NULL UNIQUE,
    draft_year INTEGER NOT NULL,
    era_bucket TEXT NOT NULL,
    draft_slot INTEGER NOT NULL,
    draft_slot_band TEXT NOT NULL,
    player_name TEXT NOT NULL,
    position TEXT NOT NULL,
    position_family TEXT NOT NULL,
    school TEXT NOT NULL,
    archetype TEXT,
    archetype_family TEXT,
    role_outcome TEXT,
    outcome_tier TEXT,
    outcome_score REAL NOT NULL,
    points_per_game REAL,
    rebounds_per_game REAL,
    assists_per_game REAL,
    true_shooting_pct REAL,
    bpm REAL,
    percentile_json JSON,
    comparison_inputs_json JSON,
    notes TEXT,
    source TEXT NOT NULL,
    last_updated DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (historical_id) REFERENCES historical_prospects_raw(historical_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS prospects_historical (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER,
    source_player_id TEXT,
    player_name TEXT NOT NULL,
    season TEXT,
    school_team TEXT,
    league TEXT,
    class_year TEXT,
    age REAL,
    position TEXT,
    draft_year INTEGER,
    draft_slot INTEGER,
    nba_team TEXT,
    combine_year INTEGER,
    source TEXT NOT NULL,
    source_last_updated DATETIME,
    inserted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source, source_player_id, season, draft_year, combine_year)
);

CREATE TABLE IF NOT EXISTS prospect_season_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER,
    prospect_historical_id INTEGER,
    source_player_id TEXT,
    player_name TEXT NOT NULL,
    season TEXT NOT NULL,
    school_team TEXT,
    league TEXT,
    class_year TEXT,
    age REAL,
    position TEXT,
    games INTEGER,
    minutes REAL,
    points REAL,
    rebounds REAL,
    assists REAL,
    steals REAL,
    blocks REAL,
    turnovers REAL,
    fg_pct REAL,
    three_pct REAL,
    ft_pct REAL,
    source TEXT NOT NULL,
    source_last_updated DATETIME,
    inserted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prospect_historical_id) REFERENCES prospects_historical(id) ON DELETE CASCADE,
    UNIQUE(source, source_player_id, season)
);

CREATE TABLE IF NOT EXISTS prospect_game_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER,
    prospect_historical_id INTEGER,
    source_player_id TEXT,
    source_game_id TEXT,
    player_name TEXT NOT NULL,
    season TEXT NOT NULL,
    game_date DATE,
    school_team TEXT,
    opponent TEXT,
    minutes REAL,
    points REAL,
    rebounds REAL,
    assists REAL,
    steals REAL,
    blocks REAL,
    turnovers REAL,
    source TEXT NOT NULL,
    source_last_updated DATETIME,
    inserted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prospect_historical_id) REFERENCES prospects_historical(id) ON DELETE CASCADE,
    UNIQUE(source, source_game_id, source_player_id)
);

CREATE TABLE IF NOT EXISTS prospect_advanced_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER,
    prospect_historical_id INTEGER,
    source_player_id TEXT,
    player_name TEXT NOT NULL,
    season TEXT NOT NULL,
    school_team TEXT,
    league TEXT,
    age REAL,
    position TEXT,
    ts_pct REAL,
    efg_pct REAL,
    usg_pct REAL,
    ast_pct REAL,
    tov_pct REAL,
    stl_pct REAL,
    blk_pct REAL,
    bpm REAL,
    obpm REAL,
    dbpm REAL,
    source TEXT NOT NULL,
    source_last_updated DATETIME,
    inserted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prospect_historical_id) REFERENCES prospects_historical(id) ON DELETE CASCADE,
    UNIQUE(source, source_player_id, season)
);

CREATE TABLE IF NOT EXISTS prospect_physical_measurements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER,
    prospect_historical_id INTEGER,
    source_player_id TEXT,
    player_name TEXT NOT NULL,
    combine_year INTEGER,
    age REAL,
    position TEXT,
    height TEXT,
    weight REAL,
    wingspan TEXT,
    standing_reach TEXT,
    max_vertical REAL,
    lane_agility REAL,
    shuttle_run REAL,
    sprint REAL,
    source TEXT NOT NULL,
    source_last_updated DATETIME,
    inserted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prospect_historical_id) REFERENCES prospects_historical(id) ON DELETE CASCADE,
    UNIQUE(source, source_player_id, combine_year)
);

CREATE TABLE IF NOT EXISTS prospect_nba_outcomes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER,
    prospect_historical_id INTEGER,
    source_player_id TEXT,
    player_name TEXT NOT NULL,
    draft_year INTEGER,
    draft_slot INTEGER,
    nba_team TEXT,
    nba_games INTEGER,
    nba_minutes REAL,
    nba_points REAL,
    nba_rebounds REAL,
    nba_assists REAL,
    nba_bpm REAL,
    source TEXT NOT NULL,
    source_last_updated DATETIME,
    inserted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prospect_historical_id) REFERENCES prospects_historical(id) ON DELETE CASCADE,
    UNIQUE(source, source_player_id, draft_year)
);

CREATE TABLE IF NOT EXISTS prospect_percentiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER,
    prospect_historical_id INTEGER,
    source_player_id TEXT,
    season TEXT,
    position_group TEXT,
    percentile_scope TEXT NOT NULL,
    metric_key TEXT NOT NULL,
    metric_value REAL,
    percentile_value REAL,
    source TEXT NOT NULL,
    source_last_updated DATETIME,
    inserted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prospect_historical_id) REFERENCES prospects_historical(id) ON DELETE CASCADE,
    UNIQUE(source, source_player_id, season, percentile_scope, metric_key)
);

CREATE TABLE IF NOT EXISTS prospect_model_features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER,
    prospect_historical_id INTEGER,
    source_player_id TEXT,
    season TEXT,
    age_adjusted_json JSON,
    rate_signals_json JSON,
    efficiency_signals_json JSON,
    impact_signals_json JSON,
    source TEXT NOT NULL,
    source_last_updated DATETIME,
    inserted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prospect_historical_id) REFERENCES prospects_historical(id) ON DELETE CASCADE,
    UNIQUE(source, source_player_id, season)
);

CREATE TABLE IF NOT EXISTS prospect_outcome_labels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER,
    prospect_historical_id INTEGER,
    source_player_id TEXT,
    draft_year INTEGER,
    outcome_tier TEXT NOT NULL,
    outcome_score REAL,
    label_reason_json JSON,
    source TEXT NOT NULL,
    source_last_updated DATETIME,
    inserted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prospect_historical_id) REFERENCES prospects_historical(id) ON DELETE CASCADE,
    UNIQUE(source, source_player_id, draft_year)
);

CREATE TABLE IF NOT EXISTS prospect_archetype_inputs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER,
    prospect_historical_id INTEGER,
    source_player_id TEXT,
    season TEXT,
    archetype_family TEXT,
    role_indicators_json JSON,
    tool_indicators_json JSON,
    source TEXT NOT NULL,
    source_last_updated DATETIME,
    inserted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prospect_historical_id) REFERENCES prospects_historical(id) ON DELETE CASCADE,
    UNIQUE(source, source_player_id, season)
);

CREATE TABLE IF NOT EXISTS prospect_comparison_inputs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER,
    prospect_historical_id INTEGER,
    source_player_id TEXT,
    season TEXT,
    comparison_vector_json JSON NOT NULL,
    cohort_keys_json JSON,
    source TEXT NOT NULL,
    source_last_updated DATETIME,
    inserted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prospect_historical_id) REFERENCES prospects_historical(id) ON DELETE CASCADE,
    UNIQUE(source, source_player_id, season)
);

CREATE INDEX IF NOT EXISTS idx_sync_log_source_season ON source_sync_log(source, season, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_cbb_player_seasons_raw_lookup ON cbb_player_seasons_raw(source, source_player_id, season);
CREATE INDEX IF NOT EXISTS idx_cbb_game_logs_raw_lookup ON cbb_game_logs_raw(source, source_player_id, season);
CREATE INDEX IF NOT EXISTS idx_cbb_advanced_metrics_raw_lookup ON cbb_advanced_metrics_raw(source, source_player_id, season);
CREATE INDEX IF NOT EXISTS idx_nba_draft_history_raw_lookup ON nba_draft_history_raw(source, source_player_id, draft_year);
CREATE INDEX IF NOT EXISTS idx_nba_player_outcomes_raw_lookup ON nba_player_outcomes_raw(source, source_player_id, draft_year);
CREATE INDEX IF NOT EXISTS idx_combine_measurements_raw_lookup ON combine_measurements_raw(source, source_player_id, combine_year);
CREATE INDEX IF NOT EXISTS idx_player_stats_raw_lookup ON player_stats_raw(player_id, season, source);
CREATE INDEX IF NOT EXISTS idx_player_game_logs_raw_lookup ON player_game_logs_raw(player_id, season, source);
CREATE INDEX IF NOT EXISTS idx_player_stats_normalized_lookup ON player_stats_normalized(player_id, season, source);
CREATE INDEX IF NOT EXISTS idx_historical_prospects_year_slot ON historical_prospects_raw(draft_year DESC, draft_slot ASC);
CREATE INDEX IF NOT EXISTS idx_historical_normalized_lookup ON historical_prospects_normalized(draft_year DESC, draft_slot ASC, position_family);
CREATE INDEX IF NOT EXISTS idx_prospects_historical_lookup ON prospects_historical(source, source_player_id, season, draft_year);
CREATE INDEX IF NOT EXISTS idx_prospect_season_stats_lookup ON prospect_season_stats(source, source_player_id, season);
CREATE INDEX IF NOT EXISTS idx_prospect_game_logs_lookup ON prospect_game_logs(source, source_player_id, season);
CREATE INDEX IF NOT EXISTS idx_prospect_advanced_metrics_lookup ON prospect_advanced_metrics(source, source_player_id, season);
CREATE INDEX IF NOT EXISTS idx_prospect_physical_measurements_lookup ON prospect_physical_measurements(source, source_player_id, combine_year);
CREATE INDEX IF NOT EXISTS idx_prospect_nba_outcomes_lookup ON prospect_nba_outcomes(source, source_player_id, draft_year);
CREATE INDEX IF NOT EXISTS idx_prospect_percentiles_lookup ON prospect_percentiles(source, source_player_id, season, metric_key);
CREATE INDEX IF NOT EXISTS idx_prospect_model_features_lookup ON prospect_model_features(source, source_player_id, season);
CREATE INDEX IF NOT EXISTS idx_prospect_outcome_labels_lookup ON prospect_outcome_labels(source, source_player_id, draft_year);
CREATE INDEX IF NOT EXISTS idx_prospect_archetype_inputs_lookup ON prospect_archetype_inputs(source, source_player_id, season);
CREATE INDEX IF NOT EXISTS idx_prospect_comparison_inputs_lookup ON prospect_comparison_inputs(source, source_player_id, season);
