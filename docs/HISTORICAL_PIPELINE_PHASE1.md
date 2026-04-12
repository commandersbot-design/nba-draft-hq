# Historical Pipeline Phase 1

This phase adds the database and source-configuration foundation for a broader Prospera historical pipeline without changing the frontend or the existing scoring model.

## Layers

### Layer A: Raw source tables
- `cbb_player_seasons_raw`
- `cbb_game_logs_raw`
- `cbb_advanced_metrics_raw`
- `nba_draft_history_raw`
- `nba_player_outcomes_raw`
- `combine_measurements_raw`
- `historical_prospects_raw`
- `source_sync_log`

These tables preserve source provenance, timestamps, and payload JSON so adapters can be swapped later without coupling the product to one provider.

### Layer B: Normalized tables
- `prospects_historical`
- `prospect_season_stats`
- `prospect_game_logs`
- `prospect_advanced_metrics`
- `prospect_physical_measurements`
- `prospect_nba_outcomes`
- `historical_prospects_normalized`

These tables are the unified Prospera model layer. They are intended to be source-agnostic and stable enough for profiles, compare, percentiles, and historical context.

### Layer C: Derived feature tables
- `prospect_percentiles`
- `prospect_model_features`
- `prospect_outcome_labels`
- `prospect_archetype_inputs`
- `prospect_comparison_inputs`

These tables are reserved for explainable model outputs and comparison inputs. They keep derived logic separate from both raw payloads and normalized records.

## Source configuration

Source definitions now live in:
- `scripts/ingestion/config/sources.js`
- `scripts/ingestion/config/index.js`

The registry defines:
- source identity
- provenance
- env keys
- target raw/normalized/derived tables
- sync types

Current configured sources:
- CollegeBasketballData
- Sports Reference
- Bart Torvik
- Basketball Reference
- NBA.com Stats
- Historical Dataset Import

## Current integration scope

Phase 1 does not replace the existing working historical importer. It makes that importer registry-aware so the new configuration system is already on the active path.

The current working path remains:
1. sync raw historical rows
2. transform normalized historical rows
3. export frontend-ready historical data

## Next phase

Next work should implement source-specific ingestion modules against the new raw tables, then normalize into the new Prospera historical tables before adding derived percentile and outcome logic.
