# P05 Opportunity Matcher & IPP Assistant — Team 5 prototype (Sprint 3 increment)

BUS2010 Co-op Platform · P05 AI-Assisted Opportunity Matching & Policy Assistant.
All people, employers, records and decisions are synthetic.

- **Repository (Sprint 2 baseline):** https://github.com/TheCYPER/bus2010-p05-opportunity-matcher
- **Shared database guide for partner teams:** [docs/SUPABASE_GUIDE.md](docs/SUPABASE_GUIDE.md)
- **AI method record (Sprint 2 + Sprint 3 audit):** [docs/AI_METHOD.md](docs/AI_METHOD.md)
- **Grounded FAQ Chatbot spec & embed guide:** [docs/CHATBOT_SPEC.md](docs/CHATBOT_SPEC.md)
- **Sprint 3 deck, speaker notes & quick test pack:** `sprint3/`

## Run it (Zero Localhost)

- **Open `index.html`** in any browser (double-click). It loads the shared BUS2010 database; if that cannot be reached it says "Demo data — couldn't reach the shared database" and uses the six built-in students. Add `?demo` to the address to force the offline copy.
- **Automated tests (26 checks):** `node tests/run-tests.js` (21 baseline checks + 5 Sprint 3 checks for Chatbot grounding/refusal `C1–C3`, `ai-embed-1.1.0` synonym fix `A4`, and end-to-end human sign-off `E2`).
- **Verify real `gte-small` synonym fix:** `node scripts/verify_synonym_fix.mjs`
- **Live checks (maintainer, needs `supabase/.env.local` and `supabase/team-keys.private.md`):** `node scripts/verify_live.mjs` and `node scripts/test_guide_examples.mjs`.
- **Rebuild `index.html` after editing `src/`:** `python3 build.py`, then copy `dist/index.html` over `index.html`.

## Files

| Path | What it is |
|---|---|
| `src/data.js` | Offline fixtures: 6 students, 6 listings, 14-term vocabulary, evidence, data dictionary. Seeded defects D1–D8. Identical to the demo slice in the database. |
| `src/ai-signals.js` | Precomputed gte-small scores for the demo slice (generated), so the AI method also works offline. |
| `src/config.js` | Database URL and publishable (read-only) key. No team keys. |
| `src/supabase-source.js` | Reads the shared database over REST and maps rows into the engine's data shape; AI scores (`rpc/ai_signals`), live phrase suggestions (`functions/v1/ai-suggest`), opt-in writes with the P05 key. |
| `src/engine.js` | Matching engine: rules baseline `rules-1.0.0`, AI methods `ai-embed-1.0.0`/`1.1.0`, immutable records, gap events, simulated partner loop state. |
| `src/chatbot.js` | Zero-localhost grounded IPP Policy FAQ Assistant (`grounded-faq-1.0.0`), 8 KB articles, waiver/out-of-scope refusal guard, 7-case QA audit. |
| `src/eval.js` | Rules vs AI comparison on 30 labelled pairs (labels provisional). |
| `src/tests.js` | 26 checks: D1–D8, M1, M2, R1, R2, H1, I1, I2, S1, A1–A4, E1, E2, L1, C1–C3. |
| `src/app.js`, `src/styles.css`, `src/app.html` | Browser UI. |
| `supabase/migrations/` | Shared database schema, access rules (RLS + team keys), views, AI functions. |
| `supabase/seed/` | Generated synthetic data (`node scripts/generate_seed.mjs`, fixed seed). `supabase/sandbox/` holds practice records for other teams. |
| `supabase/functions/ai-suggest/` | Edge Function: embeds a new phrase with gte-small and returns the nearest skill terms. |
| `scripts/` | Seed generator, team-key rotation, sandbox reset, live verification, guide example runner. |
| `docs/SUPABASE_GUIDE.md` | Guide for the other six teams (connect, ownership, data dictionary, rules, hand-off recipes). |
| `docs/AI_METHOD.md` | Sprint 2 AI method record: goal, success criteria, CRISP-DM mapping, results, failure and correction, limits. |

## Sprint 2 additions to the demo

- **Top 3 for you** on My matches, each with plain reasons; ranking is decision support, eligibility is checked separately, placements are approved by a person.
- **Coordinator → Students see → With AI similarity (gte-small):** the AI adds a "close in meaning" reason and reorders jobs within the same group. **Compare both methods** shows the difference.
- **Coordinator → AI skill suggestions:** Arjun's "agile board hygiene" → Agile (0.878), Jira (0.858); Confirm or Reject sends a note to P01, the profile is unchanged. **Try a phrase** asks the live model (try "customer journey mapping" to show the known failure).
- **Quality checks:** 21 of 21, plus the rules vs AI comparison.
- **Data:** where the data comes from; P05 writing to the shared database (opt-in with the P05 key).

## Demo script (about 4 minutes)

The first time the page opens, a welcome screen explains the 7-step co-op journey. "Show me around" starts a 6-step guided tour. "Guide" replays it, "?" opens the glossary, and the last button switches light and dark mode.

1. **How it works.** Show the 7 steps and point at step 4: our team (P05) decides which jobs fit a student and what is missing.
2. **My matches, Layla.** The summary says she can apply to 2 jobs and 2 need one thing from her. Results use three colours only: green ✓ can apply, yellow ! one thing to do, gray – not now or closed.
3. **Your next step** (lime card): "Get Jira verified to unlock Aviation Analytics Intern". Open the job with **View**: it lists why it was suggested and what it requires; Jira shows a yellow ! because Layla listed it herself and nobody verified it.
4. Click **Send Jira to skills training**.
5. **Partner teams** (simulated P06): **Review the work**, then **Save review**. The loop shows the skill reviewed and the profile updated.
6. **My matches**: "Good news: Jira is now verified" then **Refresh my matches**. "What changed" shows Aviation Analytics Intern moving to Can apply, number 1. Older results are kept.
7. **Coordinator**: Arjun's question about his "agile board hygiene" phrase. Check the result and leave a correction note; the profile itself is never edited.
8. **Quality checks**: 21 of 21 checks pass; the 6 × 6 grid shows every student against every job, with the eight planted data problems D1–D8.

"Start the demo over" on the Data page resets everything.

## Sprint 3 additions to the demo

- **Unified MBZUAI IPP Portal header & P01–P07 ribbon:** cohesive navigation across all modules with honest `Live P05` vs `Simulated` badges.
- **IPP Policy Assistant (`#assistant` & global drawer):** 0-localhost grounded FAQ chatbot answering 8 policy articles with citations, refusing waiver/GPA/visa/stipend queries without inventing rules, plus copyable iframe embed plan.
- **Synonym failure fix & retest (`ai-embed-1.1.0`):** `"customer journey mapping"` fixed from Healthcare (`0.8558`) to #1 UX Research (`0.8827`); `"kanban ticket triage"` raised `0.8062 → 0.8590`; SQL migration `supabase/migrations/20261123100000_sprint3_synonym_fix.sql` packaged.
- **End-to-end simulated partner loop:** employer comments (`P02/P03`), student progress reports (`P07`), and human-signed professor grading (`ai_graded: false`) inside `Partner teams`.
- **Quality checks:** 26 of 26 automated checks pass.

## Working / simulated / deferred

- **Working:** shared Supabase database with per-team write keys and row level security; live data in the prototype with offline fallback; rules baseline with editable weights and method versions; pretrained embedding model (`gte-small`) + Sprint 3 synonym fix verified locally (`ai-embed-1.1.0`); zero-localhost grounded FAQ Chatbot (`7/7` QA audit); three-state conditions; explanations with citations; skill gaps; immutable records; 26 checks.
- **Simulated:** P01 profile edits, P06 skill reviews, and P02/P07 employer comments, progress reports, and faculty grades inside the prototype (stored in the browser); identities (role tabs, no sign-in); provisional stand-in labels (`src/eval.js`).
- **Deferred (worksheets ready in `sprint3/P05_Sprint_3_Quick_Test_Pack.md`):** live cross-team partner DB writes; 20+ independent coordinator labels; usability test with 3 non-builder classmates.

