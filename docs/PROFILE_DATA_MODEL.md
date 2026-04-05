# Profile Data Model

Prospera now supports a mixed data model:

- flat board fields for ranking and lightweight scan
- optional structured scouting fields for richer player profiles
- derived fallbacks when structured fields are missing

The raw dataset still lives in `src/data/prospects.json`.

## Supported Structured Fields

Each prospect can optionally include:

```json
{
  "measurements": {
    "height": "6-8",
    "weight": "215",
    "wingspan": "7-0",
    "standingReach": "8-11"
  },
  "age": 19.2,
  "riskLevel": "Moderate",
  "roleProjection": "Starting wing connector",
  "scores": {
    "overallComposite": 84,
    "offense": 82,
    "defense": 79
  },
  "traits": [
    {
      "name": "Advantage Creation",
      "score": 86,
      "band": "Strong",
      "confidence": "High",
      "note": "Wins gaps with length and stride extension."
    }
  ],
  "summary": {
    "synopsis": "Short scouting summary.",
    "strengths": ["Point 1", "Point 2"],
    "weaknesses": ["Point 1"],
    "swingFactors": ["Point 1"]
  },
  "stats": {
    "season": {
      "games": 31,
      "points": 16.8,
      "rebounds": 7.1,
      "assists": 2.9
    },
    "advanced": {
      "trueShooting": "61.2%",
      "usage": "25.1%",
      "assistRate": "17.4%",
      "reboundRate": "12.6%",
      "bpm": 6.1
    },
    "gameLogAvailable": true,
    "shotProfileAvailable": false
  },
  "projection": {
    "bestOutcome": "High-level two-way starting wing.",
    "medianOutcome": "Rotation wing with scalable defense.",
    "swingSkill": "Shooting Gravity",
    "riskSummary": "Shot consistency determines ceiling.",
    "draftRange": "Lottery",
    "stockBand": "Rising"
  },
  "sources": [
    {
      "label": "Team site",
      "url": "https://example.com",
      "type": "bio"
    }
  ]
}
```

## Behavior

- Structured fields override derived placeholders.
- Missing structured fields fall back to derived values.
- The profile UI shows whether profile, trait, stat, and projection sections are `Structured`, `Mixed`, or `Derived`.

## Recommendation

If you are enriching prospects manually, add data in this order:

1. `measurements`
2. `traits`
3. `summary`
4. `projection`
5. `stats`
6. `sources`
