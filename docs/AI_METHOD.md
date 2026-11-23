# P05 AI method record (Sprint 2)

Team 5 · method `ai-embed-1.0.0` · recorded 16 November 2026 · synthetic data only

## What changed from Sprint 1

| | Sprint 1 `ai-assist-0.1.0` | Sprint 2 `ai-embed-1.0.0` |
| --- | --- | --- |
| What it is | Word overlap and a synonym list | Sentence embeddings from the pretrained model `Supabase/gte-small` (384 numbers per text) compared by cosine similarity |
| Real AI? | No, simulated | Yes. Pretrained model, **not trained by us**. Runs in `scripts/generate_seed.mjs` (transformers.js) for stored texts and in the Supabase Edge Function `ai-suggest` for new phrases. Both give the same scores (checked: "agile board hygiene" → Jira 0.8583 in both). |
| Baseline kept | `rules-1.0.0`, editable weights | unchanged, still the default students see |

## Goal and success criteria

Goal: help a student see which open jobs suit what they wrote about themselves, and help the coordinator map free-text skills to the shared vocabulary, without changing who can apply.

1. The AI never changes eligibility (test A1: 0 differences across 36 pairs; live comparison: 0 of 30 labelled pairs).
2. Every AI number is labelled with its model and method version, and every skill suggestion waits for a person (tests A2, A3; coordinator Confirm / Reject in the prototype).

## How it works (bounded)

- **Goal ↔ job meaning.** Cosine of the student's goal text and the job text (title, sector, description, tasks). Converted to a 0–1 fit with the calibration `floor 0.82, ceil 0.90` (set from 67,284 goal × open-listing pairs: median 0.809, 90th percentile 0.844), multiplied by weight 3 interest points. It only reorders jobs within the same eligibility group.
- **Free-text skills.** Cosine of the phrase and each vocabulary term (label plus synonyms). The top 2 terms with cosine ≥ 0.84 are shown as "suggested, unconfirmed" and add at most 0.5 interest points. They never satisfy a requirement. The coordinator confirms or rejects; confirming only sends a note to P01, which owns the profile.
- **Fallback.** If no AI score reaches the page, the method falls back to word overlap and says "simulated fallback". Those results get a different record ID, so they never overwrite a real one.

## CRISP-DM / PMI-CPMAI mapping

| Phase | What we did |
| --- | --- |
| Business understanding | Students write goals and skills in their own words; rules cannot read meaning. Success = criteria above. |
| Data understanding | Shared database: 390 usable student profiles, 178 open listings, 44 skill terms, 23 different free-text skill phrases written by 37 students. Gaps: missing dates, self-declared skills, drafts. |
| Data preparation | One text per object (goal; job title + sector + description + tasks; skill label + synonyms). 1,135 embeddings stored in `ai_embeddings`. |
| Modelling | Pretrained gte-small, cosine similarity, calibrated thresholds; no training. |
| Evaluation | 21 automatic checks; comparison with 30 labelled pairs (below); live checks against the database. |
| Deployment | Prototype reads live scores (`rpc/ai_signals`), new phrases via `functions/v1/ai-suggest`; human confirmation; method version stored with every result. |

## Results

Three synthetic students, top 3 open jobs on the live data:

| Student | Rules baseline | With AI similarity | What changed |
| --- | --- | --- | --- |
| Layla `COOP-B001` (aviation analytics) | OP-208 Airport Operations Analyst · OP-218 Logistics Operations Analyst · OP-027 Logistics Network Analytics | OP-208 · OP-218 · **OP-183 Aviation Data Analyst** | A third aviation job replaces a freight one |
| Arjun `COOP-B004` (ML for city services) | OP-029 Open Data Fellow · OP-019 Software Data Scientist · OP-022 Banking Data Analyst | OP-029 · OP-019 · **OP-194 Civic Data Business Analyst** | A civic-data job replaces a banking one |
| Noura `COOP-B005` (hospital and airport BI) | OP-031 Hospital Operations BI · OP-042 Aviation Data Analyst · OP-103 Airport BI Developer | OP-031 · OP-103 · **OP-175 Clinical Operations BI Developer** | A hospital BI job replaces a general data job |

Comparison with 30 labelled pairs (6 demo students × 5 open demo jobs, 42 comparable pairs). **The labels are provisional: Team 5 wrote them as a stand-in for a coordinator, and they judge interest fit, not hiring.**

| Measure | Rules | AI |
| --- | --- | --- |
| Top suggestion labelled good fit | 33.3% | 33.3% |
| Pairs in label order, full ranking | 71.4% | 71.4% |
| Pairs in label order, interest points only | 89.3% | 92.9% |
| Eligibility changed | – | 0 of 30 |

Reading: the full ranking is the same because "can apply now" always comes first, and the AI only reorders within a group. The interest-only gap is about 1.5 pairs out of 42, too small to claim the AI is better. The simulated word-overlap fallback scored 95.2% on the same pairs, which shows how little six students can tell us.

## Failure, correction and human review

- **Failure:** "customer journey mapping" is suggested as Healthcare operations (0.856) and Supply-chain analytics (0.850), both wrong; it means UX research. "kanban ticket triage" is right (Jira) but scores only 0.806, below the threshold.
- **Correction:** suggestions never change a profile on their own; the coordinator rejects the wrong one. Next step (data preparation): add "customer journey" to the synonyms of `SK-UX-01` and "kanban" to `SK-JIRA-01`, re-embed, and re-run the comparison.
- **Human review step:** the coordinator confirms or rejects every skill suggestion; P01 decides whether the profile changes; P06 verifies the skill; a person at the co-op office confirms every placement.

## Limits

Six labelled students is far too few; labels are ours, not a coordinator's; gte-small is an English model and has not been checked on Arabic text; scores sit in a narrow band (most between 0.78 and 0.86), so the thresholds matter and should be revisited with real labels.

---

## Sprint 3 updates (`ai-embed-1.1.0` & Grounded FAQ Assistant, 23 November 2026)

### 1. Real `Supabase/gte-small` Synonym Correction & Retest (`ai-embed-1.1.0`)

Following the Sprint 2 failure analysis above, we added synonyms to `SK-UX-01` (`customer journey`, `customer journey mapping`, `user journey`, `usability research` in `scripts/lib/world.mjs`) and `SK-JIRA-01` (`kanban`, `kanban board`, `ticket triage` in `src/data.js`), packaged as `supabase/migrations/20261123100000_sprint3_synonym_fix.sql`.

Running `node scripts/verify_synonym_fix.mjs --write` with `Supabase/gte-small` (`pooling: 'mean', normalize: true`, threshold `0.84`, 44 skills) measured:

| Benchmark Phrase | Intended Skill | Before (`ai-embed-1.0.0`) | After (`ai-embed-1.1.0`) | Outcome |
| --- | --- | --- | --- | --- |
| `"customer journey mapping"` | `SK-UX-01` UX research | #1 `SK-HLT-01` (`0.8558`), #2 `SK-SCM-01` (`0.8501`) — wrong | #1 `SK-UX-01` (**`0.8827`**), #2 `SK-HLT-01` (`0.8558`) | Intended skill leaps to #1 (+0.0269 above `SK-HLT-01`); human review remains required |
| `"kanban ticket triage"` | `SK-JIRA-01` Jira work-item management | #1 `SK-JIRA-01` (`0.8062`, below 0.84) | #1 `SK-JIRA-01` (**`0.8590`**, above 0.84) | Crosses suggestion threshold (+0.0528) |
| `"agile board hygiene"` (regression) | `SK-AGL-01` / `SK-JIRA-01` | `SK-AGL-01` (`0.8783`), `SK-JIRA-01` (`0.8583`) | `SK-AGL-01` (`0.8783`), `SK-JIRA-01` (`0.8533`) | Both remain suggested (`>= 0.84`) |
| `"data storytelling for executives"` (sanity) | `SK-COM-01` | `SK-COM-01` (`0.8398`) | `SK-COM-01` (`0.8398`) | Unchanged |

- **Eligibility invariant:** `0` changes across `36` student-opportunity pairs (`rules-1.0.0` vs `ai-embed`).
- **Deployment note:** Measured scores are recorded in `src/ai-signals.js` (`sprint3_synonym_audit`) and visible in the Coordinator view; the SQL migration is ready to run on the shared Supabase project (where `ai-suggest` serves `1.0.0` until DB embeddings are regenerated).

### 2. Zero-Localhost Grounded IPP Policy FAQ Assistant (`grounded-faq-1.0.0`)

- Implemented in `src/chatbot.js` (`P05Chatbot`) and embedded into the portal (`#assistant` tab + global `Ask IPP Assistant` drawer), running 100% client-side with zero localhost server.
- Answers 8 approved IPP policy articles (`FAQ-01`..`FAQ-08`) with section citations and human-approval boundaries, and enforces a pre-retrieval `EXCLUSION_PATTERNS` guard so waiver, bypass, visa, stipend, GPA, and personal-ID queries are always refused and escalated to human staff (`7/7` QA audit pass; full details in `docs/CHATBOT_SPEC.md`).

