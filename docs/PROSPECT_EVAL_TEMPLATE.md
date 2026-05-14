# Prospect Eval Template

Authoring template for per-prospect founder content. Copy the block below into
your scouting doc, fill out what you have an opinion on, leave the rest blank,
and paste the filled-out block back into chat for ingestion into the site.

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
Fill out what you have an opinion on. Leave blank what you don't.
One block per prospect; paste back when ready for ingestion.

NAME: <exact prospect name as on the site>


────────────────────────────────────────────────────────
RANKING                              Founder's Read → Rankings
────────────────────────────────────────────────────────
Rank: #<1-N>
Tier: <Apex | Star | Hit | Swing | Bust>
Note: <one sentence, ~15 words — the headline take>


────────────────────────────────────────────────────────
TIER BOARD                Founder's Read → Boards → By Tier
────────────────────────────────────────────────────────
Note: <one sentence — what NBA outcome band you have them in>


────────────────────────────────────────────────────────
POSITION BOARD       Founder's Read → Boards → By Position
────────────────────────────────────────────────────────
Position Group: <Guards | Wings | Forwards | Bigs>
Note: <position-rank rationale — "best X at the position">


────────────────────────────────────────────────────────
MOCK DRAFT                       Founder's Read → Mock Draft
────────────────────────────────────────────────────────
Pick: #<1-60>
Rationale: <one sentence — why this slot, what need it fills>


────────────────────────────────────────────────────────
TAKE                                 Founder's Read → Takes
                                          (optional, pick one)
────────────────────────────────────────────────────────
Category: <sleeper | riser | faller | watchlist>
   sleeper   = going higher than consensus boards
   riser     = stock trending up over the last month
   faller    = stock trending down
   watchlist = tracking closely + the specific thing you're watching for
Note: <1-2 sentences>


────────────────────────────────────────────────────────
TAGS                  Profile hero, Scout Desk rows, Dashboard
────────────────────────────────────────────────────────
Mark with [x] the ones that apply. Conflict pair auto-resolves:
Rhythm Scorer ↔ Pure Scorer (can't carry both).

SCORING
  [ ] Rhythm Scorer       Heat-up rhythm scorer — needs reps to find shot
  [ ] Volume Scorer       High shot count, role-driven
  [ ] Pure Scorer         Effortless craft, makes hard buckets look routine
  [ ] Midrange Mastery    Elite in-between game — pull-ups, runners, fades

ON-BALL CREATION
  [ ] Pull-up Threat      Dangerous off the dribble
  [ ] Downhill Driver     Attacks rim with force, finishes through contact
  [ ] Crafty Finisher     Wins finishes via angles + touch, not athleticism
  [ ] Float Game          Floater / runner is a real weapon
  [ ] Post Moves          Real back-to-basket repertoire

FREE THROWS
  [ ] Foul Magnet         Draws fouls at elite rate

OFF-BALL OFFENSE
  [ ] Catch-and-shoot Threat   Reliable spot-up shooter
  [ ] Lob Threat               Rim-runner / vertical spacer
  [ ] Savvy Cutter             Reads holes, cuts on time
  [ ] Off-Ball Gravity         Defenses respect on the perimeter

PASSING
  [ ] Manipulative Passer  Moves defenders with eyes / shoulders / fakes
  [ ] Wizardly Passer      High-difficulty deliveries — no-looks, wraparounds

DEFENSE
  [ ] Ball Pressure        On-ball harassment, 94 feet
  [ ] Perimeter Stopper    Wing stopper — length + lateral + scheme discipline
  [ ] Off-Ball Disruptor   Events from the help side
  [ ] Defensive Anchor     Five who organizes the scheme + rim verticality
  [ ] Switchable           Holds up against multiple positions

PHYSICAL / INTANGIBLES
  [ ] Bendy                Flexibility, hip mobility, recovery
  [ ] Immovable Object     Strong base, anchor in the paint
  [ ] Motor                Plays harder than the rest
  [ ] Rebounding           Wins boards, tracks misses, finishes plays
  [ ] Versatility          Plays multiple positions or roles convincingly
  [ ] Winning Connector    Drives positive lineup data, fits anywhere
  [ ] Big-Moment Player    Performs in moments that matter

OUTLOOK (rare — handful per class at most)
  [ ] Star Upside          Realistic All-Star / generational outcome

CONCERNS
  [ ] Injury Concerns      Significant injury history or chronic issue


────────────────────────────────────────────────────────
COMP LADDER          Authored Floor→Ceiling comps on profile
────────────────────────────────────────────────────────
Format per rung: <NBA Player Name> (<Tier>)

Tier options: Bench, Role Player, Role Player / Starter,
              Starter, 6th Man, 6th Man / Starter,
              Star, All-Star, Superstar, Hall of Famer

Suffixes:
   "+"    above-average for that tier      (e.g. "Andrew Nembhard+")
   "lite" diminished version of            (e.g. "Brandon Ingram lite")

Ceiling:  <player> (<tier>)
High-End: <player> (<tier>)
Middle:   <player> (<tier>)
Low-End:  <player> (<tier>)
Floor:    <player> (<tier>)


────────────────────────────────────────────────────────
SCOUT VIEW NARRATIVE                          [future render]
────────────────────────────────────────────────────────
A short paragraph per rung — what each outcome actually
looks like in practice. Will render on the Scout View tab
of the profile once wired.

Ceiling:    <if everything clicks, what does this prospect become?>
High-End:   <strong outcome — step below the ceiling>
Middle:     <the realistic median outcome>
Low-End:    <still in the league but with a limited role>
Floor:      <worst-case viable outcome>

Overall Ceiling Call: <one sentence — the absolute peak in plain English>
Scout Summary:        <paragraph-length top-level read>


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
Opponent / setting:
What stood out:


────────────────────────────────────────────────────────
WORST GAME                                    [future render]
────────────────────────────────────────────────────────
Opponent / setting:
What concerned you:


────────────────────────────────────────────────────────
RECENT OBSERVATIONS                           [future render]
────────────────────────────────────────────────────────
Dated entries, newest first.
- YYYY-MM-DD: <observation>
- YYYY-MM-DD: <observation>


────────────────────────────────────────────────────────
UPDATE LOG ENTRY                  Founder's Read → Updates
                                          (optional, chronological)
────────────────────────────────────────────────────────
Use this if the eval is also a stock-shift you want logged on
the Updates timeline. Otherwise skip.

Date: <YYYY-MM-DD>
Title: <short, e.g. "Bumped Flemings to 5">
Body: <paragraph or two — what changed and why>


────────────────────────────────────────────────────────
LONG-FORM ANALYSIS                            [future render]
────────────────────────────────────────────────────────
Multi-paragraph essay. Pros / cons / development arc / swing
factors / key matchups / intangibles / anything not captured
above. Banked until the long-form per-prospect section is
wired up (Option B).

<your writeup>


═══════════════════════════════════════════════════════════════
```

---

## Filled-out example

A reference for what "good" looks like across most fields. (Skipping the
`[future render]` sections for brevity — fill those out in real evals.)

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
Position Group: Wings
Note: Best wing in the class by a wide margin — the physical-and-skill combo is the rarest profile.

─── MOCK DRAFT ──────────────────────────────────────
Pick: #1
Rationale: BPA. No franchise should be drafting need over the headliner of a top-heavy class.

─── TAKE ────────────────────────────────────────────
Category: watchlist
Note: Watching pull-up jumper volume + percentage at BYU. Tools to be elite — need the green light usage.

─── TAGS ────────────────────────────────────────────
SCORING
  [x] Pure Scorer
  [x] Midrange Mastery
ON-BALL CREATION
  [x] Pull-up Threat
  [x] Crafty Finisher
OFF-BALL OFFENSE
  [x] Off-Ball Gravity
DEFENSE
  [x] Perimeter Stopper
  [x] Switchable
PHYSICAL / INTANGIBLES
  [x] Versatility
  [x] Big-Moment Player
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
