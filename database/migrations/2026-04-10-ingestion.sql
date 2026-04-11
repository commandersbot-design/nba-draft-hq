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

CREATE INDEX IF NOT EXISTS idx_sync_log_source_season ON source_sync_log(source, season, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_player_stats_raw_lookup ON player_stats_raw(player_id, season, source);
CREATE INDEX IF NOT EXISTS idx_player_game_logs_raw_lookup ON player_game_logs_raw(player_id, season, source);
CREATE INDEX IF NOT EXISTS idx_player_stats_normalized_lookup ON player_stats_normalized(player_id, season, source);
CREATE INDEX IF NOT EXISTS idx_historical_prospects_year_slot ON historical_prospects_raw(draft_year DESC, draft_slot ASC);
CREATE INDEX IF NOT EXISTS idx_historical_normalized_lookup ON historical_prospects_normalized(draft_year DESC, draft_slot ASC, position_family);
