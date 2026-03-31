# NBA Draft HQ - System Specification

## V1 Scoring Model Reference

### Active Traits (8)

| Trait | Weight | Description |
|-------|--------|-------------|
| advantage_creation | 20 | Create offensive advantages via dribble, pass, movement |
| decision_making | 16 | Quality choices under pressure, shot selection |
| shooting_gravity | 14 | Three-level scoring threat, spacing impact |
| scalability | 14 | Maintain effectiveness in increased role |
| defensive_versatility | 12 | Defensive assignments, switchability |
| processing_speed | 10 | Speed of reads, reaction time |
| passing_creation | 8 | Vision, accuracy, generating open looks |
| off_ball_value | 6 | Cutting, relocation, screening |

### Risk Flags (8)

Each scored 0–3:
- shooting_risk
- physical_translation_risk
- creation_translation_risk
- defensive_role_risk
- processing_risk
- age_upside_risk
- motor_consistency_risk
- medical_risk

**Formula:** `RiskPenalty = total_risk_points * 1.25`

### Final Score

```
WeightedTraitScore = (sum of grade * weight) / (max possible) * 100
FinalBoardScore = WeightedTraitScore - RiskPenalty
```

### Tiers

| Score | Tier |
|-------|------|
| 90+ | Tier 1 — Franchise Player |
| 84–89.9 | Tier 2 — All-Star / Primary Option |
| 76–83.9 | Tier 3 — High-Level Starter |
| 68–75.9 | Tier 4 — Rotation Player |
| <68 | Tier 5 — Developmental |

## Workflow Pipeline

```
RAW DATA → STAGING → APPROVAL → COMMIT
```

1. **Stage** — Submit changes with Run ID
2. **Review** — Approve or reject pending runs
3. **Commit** — Apply approved changes to production

**Duplicate RunIDs are blocked.**

## Grade Scales

### Traits: 1–9
- 9 = Elite (top 1%)
- 8 = Excellent (top 5%)
- 7 = Very Good (top 15%)
- 6 = Good (top 30%)
- 5 = Average
- 4 = Below Average
- 3 = Poor
- 2 = Very Poor
- 1 = Unplayable

### Risk: 0–3
- 0 = No concern
- 1 = Minor concern
- 2 = Moderate concern
- 3 = Major concern
