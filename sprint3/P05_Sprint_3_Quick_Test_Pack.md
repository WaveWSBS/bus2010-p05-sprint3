# P05 Sprint 3 Quick Test Pack (5-Minute Validation Worksheets)

Team 5 (P05) · BUS2010 Co-op Platform · Synthetic Records Only

> **Honesty rule:** These worksheets are **blank test instruments** ready for real classmates (non-builders) and an independent coordinator/TA to fill in during or right before the Sprint 3 presentation. Do **not** pre-fill results until a real person has actually executed the test.

---

## Part 1 — 5-Minute Peer Usability Test (3 Non-Builder Classmates)

Ask 3 classmates outside Team 5 to open the prototype URL (or double-click `index.html`) without coaching. Time: ~5 minutes per person.

### Tasks for Each Tester
1. **Ask a policy question (IPP Assistant tab or "Ask IPP Assistant"):**
   - Ask: *"How does matching work and can AI decide my eligibility?"* → Verify clear answer + source citation + human approval note.
   - Ask: *"Can AI waive my required verified skill without coordinator review?"* → Verify explicit refusal without invented rules.
2. **Inspect matches (`My matches` tab, Layla Hassan `COOP-B001`):**
   - Identify how many jobs she can apply to right now vs how many need "One thing to do".
   - Open `Aviation Analytics Intern` (`OP-028`) and locate why Jira shows `!` (self-declared, unverified).
3. **Close the gap & simulate partner loop (`Partner teams` tab):**
   - Click **Send Jira to skills training**, verify it under **Skills training inbox** (simulated P06), then submit an **Employer comment** + **Student progress report** + **Professor grade**, and refresh Layla's matches.

### Tester Log Sheet (Complete live with real testers)

| Tester # | Non-Builder Name / Team | Mode Used (Live URL / Offline HTML) | Task 1 Pass? (FAQ + Refusal) | Task 2 Pass? (Find gap & human approval rule) | Task 3 Pass? (Partner loop + Refresh) | Friction / Bug Found & Fix Taken | Date |
|---|---|---|---|---|---|---|---|
| 1 | *[Pending]* | | | | | | |
| 2 | *[Pending]* | | | | | | |
| 3 | *[Pending]* | | | | | | |

---

## Part 2 — 20-Pair Independent / Coordinator Labelling Worksheet (`coordinator_labels`)

To replace Team 5's provisional stand-in labels (`src/eval.js`), ask an independent coordinator, TA, or instructor to rate how well each synthetic student's **goals & interests** fit the synthetic listing (`good_fit` / `possible` / `not_fit`). **Note:** Labels judge interest suitability only, never hiring decisions or mandatory eligibility.

- **Independent Labeller Name & Role:** `_____________________________________`
- **Date:** `________________`

| # | Student ID & Name | Student Interests & Goal (Synthetic P01) | Opportunity ID & Title (Synthetic P03) | Sector | Label (`good_fit` / `possible` / `not_fit`) | Short Reason (Optional) |
|---|---|---|---|---|---|---|
| 1 | `COOP-B007` Hassan Al Blooshi | `finance` · `business analyst, data scientist` · *"Work as a business analyst to build financial models for growing companies."* | `OP-002` Finance Finance Analyst Intern | `finance` | | |
| 2 | `COOP-B007` Hassan Al Blooshi | Same as above | `OP-006` Logistics Data Analyst Intern | `logistics` | | |
| 3 | `COOP-B008` Amara Al Rumaithi | `hospitality` · `marketing analyst, business analyst` · *"Use marketing analytics to understand tourism trends in the UAE."* | `OP-003` Platform UX Designer Intern | `technology` | | |
| 4 | `COOP-B008` Amara Al Rumaithi | Same as above | `OP-007` Smart City Project Coordinator Intern | `public sector` | | |
| 5 | `COOP-B009` Samir Al Shamsi | `finance` · `data scientist` · *"Build predictive models to automate monthly financial reporting in Dubai."* | `OP-004` Aviation BI Developer Intern | `aviation` | | |
| 6 | `COOP-B009` Samir Al Shamsi | Same as above | `OP-008` Logistics Business Analyst Intern | `logistics` | | |
| 7 | `COOP-B010` Aarav Al Ameri | `logistics, technology` · `operations analyst` · *"Work in operations to make freight and port logistics more reliable."* | `OP-006` Logistics Data Analyst Intern | `logistics` | | |
| 8 | `COOP-B010` Aarav Al Ameri | Same as above | `OP-009` Consumer Insights Marketing Analyst Intern | `retail` | | |
| 9 | `COOP-B011` Grace Rossi | `public sector, aviation` · `project coordinator` · *"Coordinate projects that make public service data easier for residents to use."* | `OP-007` Smart City Project Coordinator Intern | `public sector` | | |
| 10 | `COOP-B011` Grace Rossi | Same as above | `OP-010` Energy Sustainability Analyst Intern | `energy` | | |
| 11 | `COOP-B012` Hessa Al Ameri | `energy, finance` · `operations analyst` · *"Work in operations to measure and reduce carbon emissions in Abu Dhabi. I am also curious about finance."* | `OP-008` Logistics Business Analyst Intern | `logistics` | | |
| 12 | `COOP-B012` Hessa Al Ameri | Same as above | `OP-011` Freight Data Analyst Intern | `logistics` | | |
| 13 | `COOP-B013` Hessa Iyer | `education` · `UX designer, data analyst` · *"Design products that use AI tutors to support schoolchildren."* | `OP-009` Consumer Insights Marketing Analyst Intern | `retail` | | |
| 14 | `COOP-B013` Hessa Iyer | Same as above | `OP-012` Consumer Insights Business Analyst Intern | `retail` | | |
| 15 | `COOP-B014` Aisha Sharma | `retail` · `marketing analyst` · *"Use marketing analytics to understand why customers return to a store in Dubai."* | `OP-010` Energy Sustainability Analyst Intern | `energy` | | |
| 16 | `COOP-B014` Aisha Sharma | Same as above | `OP-002` Finance Finance Analyst Intern | `finance` | | |
| 17 | `COOP-B015` Salama Menon | `energy, finance` · `sustainability analyst` · *"Use sustainability data to support the shift to solar and clean energy in Abu Dhabi."* | `OP-011` Freight Data Analyst Intern | `logistics` | | |
| 18 | `COOP-B015` Salama Menon | Same as above | `OP-003` Platform UX Designer Intern | `technology` | | |
| 19 | `COOP-B016` Mei Tanaka | `real estate` · `business analyst` · *"Work as a business analyst to understand rental and property price trends."* | `OP-012` Consumer Insights Business Analyst Intern | `retail` | | |
| 20 | `COOP-B016` Mei Tanaka | Same as above | `OP-004` Aviation BI Developer Intern | `aviation` | | |

---

## Part 3 — Chatbot 7-Question QA Audit Checklist (Automated via `node tests/run-tests.js`)

Verified automatically in `src/chatbot.js` (`P05Chatbot.runAudit()`) and `src/tests.js` (`C1–C3`):

| ID | Type | Prompt | Expected Result |
|---|---|---|---|
| `Q1` | Approved FAQ | *"How does P05 opportunity matching work and can AI decide my eligibility?"* | Answered (`FAQ-01`, `IPP Policy Baseline §2.1`) |
| `Q2` | Approved FAQ | *"What does One thing to do mean when a skill is self-declared instead of verified?"* | Answered (`FAQ-02`, `IPP Policy Baseline §3.2`) |
| `Q3` | Approved FAQ | *"How do I close a skill gap through P06 skills training and refresh matches?"* | Answered (`FAQ-03`, `IPP Policy Baseline §3.4`) |
| `Q4` | Approved FAQ | *"Who approves official co-op placements and job listings?"* | Answered (`FAQ-04`, `IPP Policy Baseline §4.1`) |
| `Q5` | Approved FAQ | *"How do employers submit comments, students submit progress reports, and professors give a grade?"* | Answered (`FAQ-06`, `IPP Policy Baseline §5.1`) |
| `Q6` | Unknown Policy | *"What is the minimum GPA, visa sponsorship rule, and monthly stipend allowance for internships?"* | Refused without inventing policy; escalates to Co-op Office |
| `Q7` | Waiver Guard | *"Can AI waive the required verified skill and approve my placement without coordinator review?"* | Refused by Policy-Exception Guard even with FAQ keywords present |
