# Prospect Eval Template

Authoring template for per-prospect founder content. Copy the block below into
your scouting doc, fill out what you have an opinion on, leave the rest blank,
and paste the filled-out block back into chat for ingestion into the site.

**Quick format rules:**
- For enumerated fields: **delete the options that don't apply** and leave the one that does.
- For tag checkboxes: **mark with `[x]`** the tags that apply.
- Free-text fields: just write what you've got.
- Sections marked `[future render]` aren't displayed on the site yet — bank
  the content there and we'll wire up the rendering once there's a critical
  mass of authored prospects.

**Routing summary:**

| Template section | Lands in |
|---|---|
| RANKING | `founderContent.rankings.items` |
| TIER BOARD | `founderContent.tierBoards.tiers[].items` |
| POSITION BOARD | `founderContent.positionBoards.positions[].items` |
| MOCK DRAFT | `founderContent.mockDraft.picks` |
| TAKE | `founderContent.takes.{sleepers,risers,fallers,watchlist}.items` |
| TAGS | `prospera.terminal.player-tags` (per-prospect localStorage) |
| COMP LADDER | `authoredComps.json` |
| UPDATE LOG ENTRY | `founderContent.updates.entries` |
| Scout View Narrative, Pros/Cons, Best/Worst Game, Recent Observations, Long-Form | **[future]** — banked until the long-form per-prospect section is wired up |

---

## Template

Copy from `═══` to `═══`:

```
═══════════════════════════════════════════════════════════════
PROSPECT EVAL TEMPLATE — Prospera Draft HQ
═══════════════════════════════════════════════════════════════
Format: for enumerated fields, DELETE the options that don't apply
and keep the one that does. For checkboxes, mark with [x].

NAME: 


────────────────────────────────────────────────────────
RANKING                              Founder's Read → Rankings
────────────────────────────────────────────────────────
Rank: #
Tier: Apex / Star / Hit / Swing / Bust
Note: 


────────────────────────────────────────────────────────
TIER BOARD                Founder's Read → Boards → By Tier
────────────────────────────────────────────────────────
Note: 


────────────────────────────────────────────────────────
POSITION BOARD       Founder's Read → Boards → By Position
────────────────────────────────────────────────────────
Group: Guards / Wings / Forwards / Bigs
Note: 


────────────────────────────────────────────────────────
MOCK DRAFT                       Founder's Read → Mock Draft
────────────────────────────────────────────────────────
Pick: #
Why: 


────────────────────────────────────────────────────────
TAKE                                 Founder's Read → Takes
                                       (optional — skip if none)
────────────────────────────────────────────────────────
Category: sleeper / riser / faller / watchlist
Note: 


────────────────────────────────────────────────────────
TAGS                   Profile hero, Scout Desk, Dashboard
────────────────────────────────────────────────────────
Mark with [x]. Rhythm Scorer ↔ Pure Scorer can't both fire.

SCORING
  [ ] Rhythm Scorer        [ ] Volume Scorer
  [ ] Pure Scorer          [ ] Midrange Mastery

ON-BALL CREATION
  [ ] Pull-up Threat       [ ] Downhill Driver
  [ ] Crafty Finisher      [ ] Float Game
  [ ] Post Moves

FREE THROWS
  [ ] Foul Magnet

OFF-BALL OFFENSE
  [ ] Catch-and-shoot Threat   [ ] Lob Threat
  [ ] Savvy Cutter             [ ] Off-Ball Gravity

PASSING
  [ ] Manipulative Passer  [ ] Wizardly Passer

DEFENSE
  [ ] Ball Pressure        [ ] Perimeter Stopper
  [ ] Off-Ball Disruptor   [ ] Defensive Anchor
  [ ] Switchable

PHYSICAL / INTANGIBLES
  [ ] Bendy                [ ] Immovable Object
  [ ] Motor                [ ] Rebounding
  [ ] Versatility          [ ] Winning Connector
  [ ] Big-Moment Player

OUTLOOK
  [ ] Star Upside

CONCERNS
  [ ] Injury Concerns


────────────────────────────────────────────────────────
COMP LADDER          Authored Floor→Ceiling on profile
────────────────────────────────────────────────────────
Per rung, write: <NBA Player Name> (<tier>)

Tier options to choose from:
   Bench / Role Player / Role Player-Starter / Starter / 6th Man /
   6th Man-Starter / Star / All-Star / Superstar / Hall of Famer
Suffixes:
   "+"    above-average for tier        ("Andrew Nembhard+")
   "lite" diminished version            ("Brandon Ingram lite")

Ceiling:  
High-End: 
Middle:   
Low-End:  
Floor:    


────────────────────────────────────────────────────────
SCOUT VIEW NARRATIVE                          [future render]
────────────────────────────────────────────────────────
Short paragraph per rung — what each outcome looks like.

Ceiling:    
High-End:   
Middle:     
Low-End:    
Floor:      

Overall Ceiling Call:  
Scout Summary:         


────────────────────────────────────────────────────────
PROS                                          [future render]
────────────────────────────────────────────────────────
-
-
-


────────────────────────────────────────────────────────
CONS                                          [future render]
────────────────────────────────────────────────────────
-
-
-


────────────────────────────────────────────────────────
BEST GAME                                     [future render]
────────────────────────────────────────────────────────
Opponent: 
Stood out: 


────────────────────────────────────────────────────────
WORST GAME                                    [future render]
────────────────────────────────────────────────────────
Opponent: 
Concerned: 


────────────────────────────────────────────────────────
RECENT OBSERVATIONS                           [future render]
────────────────────────────────────────────────────────
- YYYY-MM-DD: 
- YYYY-MM-DD: 


────────────────────────────────────────────────────────
UPDATE LOG ENTRY                  Founder's Read → Updates
                                       (optional, chronological)
────────────────────────────────────────────────────────
Date: YYYY-MM-DD
Title: 
Body: 


────────────────────────────────────────────────────────
LONG-FORM ANALYSIS                            [future render]
────────────────────────────────────────────────────────



═══════════════════════════════════════════════════════════════
```

---

## Filled-out example

Reference for what a completed eval looks like. (The `[future render]`
sections are skipped here for brevity — fill them out in real evals to
help bank long-form content.)

```
═══════════════════════════════════════════════════════════════
NAME: AJ Dybantsa

─── RANKING ─────────────────────────────────────────
Rank: #1
Tier: Apex
Note: Class headliner — two-way wing with star scoring touch and the frame to translate.

─── TIER BOARD ──────────────────────────────────────
Note: Only realistic generational outcome in this class — Tracy McGrady ceiling, Jaylen Brown floor.

─── POSITION BOARD ──────────────────────────────────
Group: Wings
Note: Best wing in the class by a wide margin — the physical-and-skill combo is the rarest profile.

─── MOCK DRAFT ──────────────────────────────────────
Pick: #1
Why: BPA. No franchise should be drafting need over the headliner of a top-heavy class.

─── TAKE ────────────────────────────────────────────
Category: watchlist
Note: Watching pull-up jumper volume + percentage at BYU. Tools to be elite — need the green light usage.

─── TAGS ────────────────────────────────────────────
SCORING
  [x] Pure Scorer          [x] Midrange Mastery
ON-BALL CREATION
  [x] Pull-up Threat       [x] Crafty Finisher
OFF-BALL OFFENSE
  [x] Off-Ball Gravity
DEFENSE
  [x] Perimeter Stopper    [x] Switchable
PHYSICAL / INTANGIBLES
  [x] Versatility          [x] Big-Moment Player
OUTLOOK
  [x] Star Upside

─── COMP LADDER ─────────────────────────────────────
Ceiling:  Tracy McGrady (Hall of Famer)
High-End: Jaylen Brown (Superstar)
Middle:   Brandon Miller (Star)
Low-End:  Andrew Wiggins (Starter)
Floor:    RJ Barrett (Starter)

═══════════════════════════════════════════════════════════════
```

---

## Ingestion guarantees on my side

When you paste filled-out blocks back into chat:

- **Multiple prospects per message is fine** — paste 5-10 in one go, I'll batch the JSON updates.
- **Partial fills are fine** — most prospects won't have every section filled.
- **Name normalization** — I'll match against `prospects.json` canonical names. Use the canonical spelling (without "Jr." even if you display them with it elsewhere; the site handles the display).
- **Tag conflict resolution** — the editor auto-removes conflicting tags when one is added (Rhythm ↔ Pure Scorer). I'll respect that on ingestion.
- **`[future render]` sections** — I'll bank these. Once three or more prospects have substantive content in a `[future]` field, I'll wire up the rendering for it on the next pass.
