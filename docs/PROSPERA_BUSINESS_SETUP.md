# Prospera Draft HQ — Business Setup & Operations Snapshot

**Document version:** 1.0
**Last updated:** 2026-05-09
**Audience:** founder, legal counsel, accountant, prospective partners

---

## How to use this document

This is a single-page reference for getting Prospera Draft HQ from "personal scouting tool" to a clean, defensible commercial product. It is structured so you can:

- **Share Part 1** with anyone who needs to understand what Prospera is and how it works.
- **Share Part 2** with a sports-media or IP attorney to get the data-licensing question answered.
- **Walk Part 3** through with your accountant and small-business attorney as a punch list.

> **Important disclaimer.** Nothing in this document is legal, tax, or business advice. It is a working checklist drafted by the platform's engineer to give your professional advisors enough context to do their job. State laws, federal laws, sports-data licensing terms, and tax obligations vary widely and change. Verify every item below with a qualified attorney and CPA before relying on it.

---

# Part 1 — Prospera Draft HQ: platform snapshot

## Product summary

Prospera Draft HQ is a web-based NBA Draft scouting platform. It evaluates the 2026 prospect class against a calibrated historical pool of 1,292 prospects from drafts 2003-2025, producing per-trait letter grades, an overall composite score with confidence interval, and statistical comparison points to past prospects.

Currently a single-user product (one scout's view per deployment). Hosted publicly on Vercel.

## Live URLs

| Surface | URL |
|---|---|
| Production app | `https://exciting-hermann-e18d23.vercel.app` |
| Source repository | `https://github.com/commandersbot-design/nba-draft-hq` |
| Hosting provider | Vercel (`commandersbot-9825s-projects/exciting-hermann-e18d23`) |

## Technical stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 with Vite build tooling |
| Languages | JavaScript / JSX (UI), TypeScript (scoring engine + comp engine) |
| Styling | CSS custom properties, terminal-orange "Signal Orange" design system |
| Hosting | Vercel (serverless static deploy) |
| Storage | Browser localStorage (per-user) — no backend database |
| Authentication | None — currently public, single-scout per device |

## Core user surfaces

- **Scout Desk** — main prospect roster with at-a-glance computed score
- **My Board** — multi-mode board builder (manual drag-and-drop, custom weight presets, team-need presets)
- **Player Profile** — multi-tab deep view: Prospect Stats, Evaluation, Advantage Profile, Traits, Computed Score, Comparables, Constellation Map, Shot Chart, Notes
- **Mock Draft** — full 60-pick simulation with team needs
- **Compare** — multi-prospect side-by-side comparison
- **Deep Dives** — personal scouting intelligence with status tracking, buy/hold/sell ratings, ceiling/floor projections, verified measurements, and observation logs
- **Class Map** — visual scatter of the active class
- **Historical** — searchable archive of 1,292 historical prospects

## Scoring engine (proprietary)

The platform's intellectual centerpiece is a statistically-calibrated grading and comparison engine:

- **9-axis primary scoring** across initiation, extension, finishing, spacing, connection, containment, disruption, switching, and transition
- **8-trait UI projection** (Advantage Creation, Decision Making, Passing Creation, Shooting Gravity, Off-Ball Value, Processing Speed, Scalability, Defensive Versatility)
- **Letter grades** (A+/A/B/C/D) using a dual-gate system: cohort percentile rank against historical prospects of the same position family AND an absolute z-score floor
- **Empirically calibrated** against 956 historical prospects with full advanced statistics
- **Comparison engine** with tier rationing — eliminates the common "every prospect gets a Legend comp" failure mode by requiring rare-elite NN distribution before issuing rare-elite comps
- **Authored stylistic ladders** — hand-curated outcome distributions (Floor → Ceiling) for top prospects, surfaced alongside the algorithmic comps

## Data sources used

| Source | Data extracted | Volume | Refresh |
|---|---|---|---|
| Sports Reference / Stathead | College and NBA advanced statistics | 956 historicals + 49 of 60 active 2026 prospects | Manual CSV pull |
| BartTorvik (planned) | Pre-2011 college advanced statistics | 2003-2010 (target ~426 historicals) | Manual via web scrape |
| ESPN | Player headshot images | Most active 2026 prospects | Manual |
| Internal hand authoring | Trait scores, archetypes, scouting summaries, comp ladders | All 60 active prospects + 26 pre-2011 manual overrides | Continuous |

## Repository scale

- ~50,000 lines of code across React components, scoring engine modules, and data files
- ~30 TypeScript modules covering grading, comp engine, calibration, and persistence
- ~15 fixture-based test cases (15 of 15 currently passing)
- Frozen calibration artifacts: cohort normalizers, runtime axis calibration, historical score distributions

---

# Part 2 — Third-party data and content licensing

This is the section that most directly affects whether Prospera can be commercialized. Bring this table to a sports-media or intellectual-property attorney with SaaS experience.

| Source | License posture (best understanding) | Implication for commercial Prospera |
|---|---|---|
| Sports Reference / Stathead data | Terms of Use permit personal and non-commercial use; commercial use requires explicit license. | Currently used to derive scores. If Prospera ever charges users or sells data access, a commercial data license is required. Contact: Sports Reference, Sports Stats licensing inquiries. |
| BartTorvik data | Free for non-commercial use, attribution required. | Same caveat — courtesy outreach for commercial use is recommended. |
| ESPN headshot images | © ESPN; not licensed for redistribution. | High risk if commercialized. Replace with NBA G League / NCAA-licensed images, license through Getty Images Sports, or commission original photography. |
| NBA team logos and trademarks | Trademarked by NBA Properties Inc. | Editorial use of small marks alongside data is generally tolerated; using them as part of Prospera's brand is not. |
| Player names, school names | Facts; not copyrightable in the United States (Feist v. Rural Telephone). | Free to use as data. Names cannot be owned. |
| KenPom data (if added later) | Subscription license required. | Read terms before integration. |
| Synergy Sports tracking (if added later) | Per-team / per-organization commercial license. | Not currently used. |
| Hand-authored archetypes, comps, scouting writeups | Original creative work. | Copyright belongs to the founder by default; assign to the LLC after formation. |
| Source code | Currently no LICENSE file. | Decide between MIT, Apache 2.0, or proprietary before any external collaboration or open source release. |

### The single biggest licensing decision

Is Prospera operating as **a personal scouting tool** or **a product to be sold**?

- **Personal use**: most of the table above is dormant. Free data sources remain free, and editorial fair-use covers most logo/headshot use.
- **Commercial product**: every "free for non-commercial" data source becomes a contract negotiation, every team logo becomes a trademark question, and every headshot becomes a copyright question. Plan to either replace or license each.

---

# Part 3 — Business setup checklist

Group items by phase. Items in **bold** are typically blocking before any paid customer transaction; non-bold items are good practice and risk reduction. Walk this list with a small-business attorney and CPA — do not act on it without their input.

## Phase A — Entity formation

- [ ] **Pick a state of formation** — Delaware LLC is the standard for SaaS that may raise outside capital; home-state LLC is simpler if remaining bootstrapped.
- [ ] **File LLC formation paperwork** with the chosen state's Secretary of State (typical filing fee $50-$300).
- [ ] **Obtain an EIN** (Employer Identification Number) from the IRS. Free online application at irs.gov, takes about 10 minutes.
- [ ] **Draft an Operating Agreement** even for a single-member LLC. Many banks require it to open business accounts.
- [ ] **Open a dedicated business bank account.** Critical for maintaining the corporate veil that gives the LLC its liability protection.
- [ ] Business credit card (optional, helpful for bookkeeping clarity).
- [ ] Register for a fictitious business name / DBA if operating under "Prospera" rather than the LLC's legal name.

## Phase B — Brand and intellectual property

- [ ] **USPTO trademark search** for "Prospera Draft HQ" via the TESS database (`tmsearch.uspto.gov`). Check International Class 9 (computer software) and Class 41 (information services).
- [ ] **Domain registrations** — `.com`, `.io`, `.app`, plus defensive variants and common misspellings.
- [ ] **Trademark application** if the search comes back clean. TEAS Plus filing is approximately $250 per class.
- [ ] **Add a LICENSE file to the repository** — pick MIT (permissive, allows commercial use by anyone), Apache 2.0 (permissive with patent grant), or proprietary (closed). This decision affects whether any contributor can use Prospera's code outside the company.
- [ ] **Track contribution provenance in commit history** — particularly important if outside contributors or contractors touch the codebase before assignments are signed.
- [ ] **IP assignment from founder to LLC** after formation — even though the LLC is a one-person entity, this clean handoff matters if you ever sell the company.

## Phase C — Required legal documents (before any public launch)

- [ ] **Terms of Service** — disclaim liability for scouting decisions, prohibit reverse engineering and scraping, set venue and governing law, address user-generated content.
- [ ] **Privacy Policy** — required by California Consumer Privacy Act (CCPA) and the EU's General Data Protection Regulation (GDPR), regardless of company size, when applicable users access the platform.
- [ ] **Cookie / tracking policy** if any analytics or marketing pixels are added.
- [ ] **Acceptable Use Policy** if user-generated content (Notes, Deep Dives) ever becomes shared or visible to other users.
- [ ] **DMCA agent designation** with the U.S. Copyright Office. $6 for a three-year term. Provides safe-harbor protection from copyright claims based on user-uploaded content.
- [ ] **Data Processing Agreement (DPA) template** if any user could be located in the EU.

## Phase D — Data licensing follow-through

- [ ] **Sports Reference / Stathead** — initiate commercial license inquiry if monetization is planned.
- [ ] **BartTorvik** — courtesy outreach with attribution plan; inquire about commercial use terms.
- [ ] **ESPN headshots** — decision: license through Getty Images Sports, replace with NBA G League / NCAA images, or commission original photography.
- [ ] **NBA team marks** — written permission for commercial use, OR limit use to small editorial contexts adjacent to data.
- [ ] **KenPom subscription** if integrated later — read terms before integration.

## Phase E — Compliance (if monetizing)

- [ ] **Sales tax registration** — varies dramatically by state. Many states tax SaaS revenue; some do not. Use a service like Stripe Tax, Avalara, or TaxJar to track and remit.
- [ ] **Payment processor** — Stripe is the SaaS standard with straightforward LLC onboarding.
- [ ] **Subscription terms** — auto-renewal disclosure laws vary by state. California's Automatic Renewal Law is particularly strict.
- [ ] **Refund policy** — required by some states for digital subscriptions.
- [ ] **PCI compliance posture** — using Stripe Elements / Stripe Checkout normally keeps you out of PCI scope.

## Phase F — Insurance and risk management

- [ ] **General liability insurance** — typically $300-$600 per year for a small SaaS.
- [ ] **Errors and Omissions / Professional Liability insurance** — covers claims along the lines of "your scouting tool gave bad advice and I made a poor decision based on it." Typically $500-$1,500 per year.
- [ ] **Cyber liability insurance** — covers data breach response and notification costs. $500-$2,000 per year depending on revenue and data volume.
- [ ] (Skip until revenue: Directors and Officers, key-person, employment practices liability.)

## Phase G — Tax and accounting

- [ ] **Quarterly estimated tax payments** to the IRS and state revenue department if owner draws are taken.
- [ ] **Bookkeeping system** — QuickBooks Online, Wave, Xero, or a disciplined spreadsheet for year one.
- [ ] **Engage a CPA** with a track record on at least five LLC or SaaS clients. Year-end taxes, ideally also strategic tax planning.

---

# Suggested execution sequence

Solo operator, pre-revenue:

1. **This week.** Form the LLC, get the EIN, open the business bank account. Total time: one to two hours of paperwork.
2. **Next month.** Trademark search, domain registrations.
3. **Before the first paid customer.** Terms of Service and Privacy Policy on the website. Decide commercial-use status with each data source. Set up Stripe.
4. **In the first quarter of revenue.** General liability and E&O insurance. Sales tax registration. Bookkeeping system.
5. **Once revenue exceeds $50,000 / year.** Formal trademark filing. CPA on retainer. Review entity structure (LLC vs. S-Corp election).

---

# Document maintenance

This document is a living checklist. Update it when:

- A new data source is integrated (update Part 1 and Part 2).
- A licensing posture changes (update Part 2).
- A phase item is completed (mark the checkbox, note the date).
- A jurisdiction changes (sales tax obligations, GDPR scope, etc.).

Suggested cadence: review quarterly, in the same session as bookkeeping reconciliation.
