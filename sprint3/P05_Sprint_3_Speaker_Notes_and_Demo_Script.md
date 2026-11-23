# P05 Sprint 3 — Speaker Notes, Live Demo Script & Professor Q&A

Team 5 (P05) · BUS2010 Co-op Platform · Sprint 3 Integration Readiness Review

---

## 1. Team Speaking Split (7 Slides · ~5 Minutes + 3–4 Min Demo)

| Slide | Speaker | Focus | Target Time |
|---|---|---|---|
| **Slide 1** (Cover) | **Maha Abdulla** | Team intro, Sprint 1 → 2 → 3 progression | 25s |
| **Slide 2** (Tech Stack) | **Alghala Almansoori** | Collaboration tools, zero-localhost SPA, `gte-small` + grounded FAQ, Supabase + 26/26 tests | 45s |
| **Slide 3** (User Stories) | **Yonghan Yang** | US 1 (FAQ Chatbot), US 2 (`ai-embed-1.1.0` synonym fix numbers), US 3 (Unified Portal + honest status) | 55s |
| **Slide 4** (Project Demo) | **Che Liu** | Live walk-through of the 4-step end-to-end journey (Ask FAQ → Top 3 → Partner Loop → Coordinator Audit) | 3–4 min (live) |
| **Slide 5** (Unified MVP) | **Maha Abdulla / Che Liu** | How we fulfilled Professor Request ("unified look"), single Supabase schema, live vs simulated honesty | 45s |
| **Slide 6** (Retrospective) | **Leonard Jiang Mingming** | Cross-team challenges (no shared UI spec, delayed DB writes, chatbot ownership) + learnings + Quick Test Pack | 50s |
| **Slide 7** (Impediment) | **Leonard Jiang Mingming** | `IMP-S2-01` timeline, resolution via shared DB + sandbox + unified shell, remaining SoS handoff | 40s |

---

## 2. Exact 4-Minute Live Demo Script (Zero Localhost)

**Pre-demo check:** Open https://pms3.mbzuai.wavew.sbs (campus LAN) (or double-click `index.html?demo` locally). Ensure Light mode is active and click **Skip for now** if the welcome modal opens.

1. **Unified Portal & IPP Policy Assistant (`IPP Assistant` tab or `Ask IPP Assistant`):**
   - Point to the unified MBZUAI IPP header and 6-module ribbon (`P01` through `P07`).
   - Click **"How matching & AI work"** chip → Show `FAQ-01` grounded answer, `IPP Policy Baseline §2.1` citation, and yellow **Human approval boundary** box.
   - Click **"Test guard: waive verified skill"** chip → Show `Refused — Human Escalation` (`0.00` confidence, no invented rules) and click **Log question for Coordinator**.
2. **My matches (`My matches` tab, Layla Hassan `COOP-B001`):**
   - Highlight: `2 Can apply`, `2 One thing to do`, `2 Not now or closed`.
   - Open `Aviation Analytics Intern` (`OP-028`) → Show why Jira (`SK-JIRA-01`) is yellow `!` (self-declared, unverified) and AI does **not** override eligibility.
   - Click **Send Jira to skills training** (`GAP-0001`).
3. **End-to-End Partner Loop (`Partner teams` tab):**
   - Point clearly to the yellow banner: **`Simulated partner workflow · synthetic data`**.
   - Under **Skills training inbox** (simulated P06): click **Review the work** → **Save review** (demonstrated).
   - Under **End-to-end placement loop**: submit **1. Employer comment**, **2. Student progress report**, and **3. Professor review & grade** (`A`, explicit faculty sign-off, `ai_graded: false`).
   - Return to `My matches` → Click **Refresh my matches** → Show `"What changed"` (Aviation Analytics Intern moves to **Can apply**, Rank #1; older record preserved).
4. **Coordinator Synonym Fix & Quality Checks (`Coordinator` + `Quality checks` tabs):**
   - In `Coordinator`, show **Sprint 3 synonym fix audit (`ai-embed-1.0.0` → `ai-embed-1.1.0`)**: `"customer journey mapping"` fixed from `SK-HLT-01 (0.8558)` → #1 `SK-UX-01 (0.8827)`; `"kanban ticket triage"` lifted `0.8062 → 0.8590`; `0` eligibility changes; plus the logged Chatbot escalation at top right.
   - Open `Quality checks` → Point out **`26 of 26 checks pass`** (21 baseline + 5 Sprint 3 checks).

**Offline Backup:** If Wi-Fi fails, append `?demo` or double-click `index.html` directly from disk. Everything—including the FAQ Chatbot, 26 checks, and precomputed `gte-small` scores—runs identically without localhost or internet.

---

## 3. Expected Sprint 3 Q&A (Professor & Dean Hao Li)

- **Q: Does your chatbot run on a local server or call an external LLM?**
  - **A:** Neither. `src/chatbot.js` runs 100% client-side in static HTML/JS with zero localhost, zero API keys, and zero external data leakage. It answers strictly from 8 approved IPP policy articles with citations and applies a pre-retrieval refusal guard for waivers, visas, stipends, and GPA queries.
- **Q: How did you verify your Sprint 2 AI failure fix?**
  - **A:** We added synonyms to `SK-UX-01` and `SK-JIRA-01` and ran `scripts/verify_synonym_fix.mjs` using the actual pretrained `Supabase/gte-small` model (`384` dims, mean pooling, L2-normalised). `"customer journey mapping"` moved from `SK-HLT-01 (0.8558)` to #1 `SK-UX-01 (0.8827)`, `"kanban ticket triage"` rose from `0.8062` to `0.8590`, and eligibility changed in `0/36` pairs. The SQL migration is packaged in `supabase/migrations/20261123100000_sprint3_synonym_fix.sql`.
- **Q: Are other teams actually connected to your app right now?**
  - **A:** We honestly report that partner teams have not yet connected live writes to our shared Supabase database. To demonstrate the full Sprint 3 journey without fabricating integrations, we built the Employer Comments, Student Progress Report, and Professor Grading panels inside a clearly badged **"Simulated partner workflow"** aligned with our live Supabase schema.
- **Q: What about the 3 classmate tests and 20 coordinator labels from your Sprint 2 plan?**
  - **A:** Those external human validations are not fabricated—we kept them honestly marked pending in the Data tab and prepared `sprint3/P05_Sprint_3_Quick_Test_Pack.md` with ready-to-run 5-minute worksheets (using 20 real synthetic pairs `COOP-B007..B016`) to complete before the Dean Hao Li showcase.
