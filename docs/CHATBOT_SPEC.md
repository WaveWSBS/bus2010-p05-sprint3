# P05 IPP Policy FAQ Assistant — Architecture & Embed Guide (`grounded-faq-1.0.0`)

Team 5 (P05) · Sprint 3 · BUS2010 Co-op Platform

## 1. Does the Chatbot need `localhost` or a backend server?

**No.** `src/chatbot.js` runs **100% client-side inside the static browser page** (`index.html`), so it works identically when:
- Hosted publicly on **GitHub Pages** (e.g. `https://<user>.github.io/<repo>/`), or
- Opened directly from disk as a local file (`double-click index.html`) with **zero localhost server**, zero Python/Node process, and zero API keys.

Why this architecture was chosen for Sprint 3:
1. **Zero deployment fragility during live demo:** If Wi-Fi drops or Supabase cold-starts, both the deterministic rules engine (`src/engine.js`) and the FAQ Assistant (`src/chatbot.js`) continue responding instantly in the browser.
2. **Strict policy grounding (no hallucinated university rules):** Unlike an unconstrained generative LLM, a grounded retrieval + refusal engine only outputs approved IPP policy statements (`FAQ-01` through `FAQ-08`) with explicit policy section citations and human-approval notices.
3. **Zero PII exposure:** No student queries are sent to third-party LLM APIs.

---

## 2. How Grounded Retrieval & Refusal Work

Every call to `P05Chatbot.ask(question)` executes three deterministic stages:

1. **Pre-retrieval Policy-Exception & Out-of-Scope Guard (`EXCLUSION_PATTERNS`):**
   - Runs **before** keyword matching so mixed prompts (which mention real IPP terms *and* ask for an exception) cannot bypass refusal.
   - Catches:
     - Waiver / bypass requests (`waive`, `bypass`, `override`, `skip review`, `without approval`, `auto-approve`, `guarantee placement`)
     - Unsupported institutional policies (`visa`, `sponsorship`, `salary`, `stipend`, `compensation`, `housing`, `GPA`, `credit hours`, `tuition`)
     - Personal identity/transcript inputs (`Emirates ID`, `passport`, `national ID`, `real transcript`, `IBAN`)
   - Returns `status: "refused"`, states it cannot confirm or invent policy, and identifies the human escalation owner (`Co-op Office Officer & Academic Coordinator`).

2. **Grounded Retrieval over Approved Knowledge Base (`KB`, 8 articles):**
   - Normalizes and stems tokens, strips stop words, and scores phrase matches + keyword hits across `FAQ-01` to `FAQ-08`:
     - `FAQ-01`: Matching logic & why AI never decides eligibility (`IPP Policy Baseline §2.1`)
     - `FAQ-02`: Meaning of `"One thing to do"` & self-declared vs verified skills (`IPP Policy Baseline §3.2`)
     - `FAQ-03`: Closing a skill gap via P06 (`IPP Policy Baseline §3.4`)
     - `FAQ-04`: Who approves listings (P03), placements (Co-op Office), and grades (Faculty) (`IPP Policy Baseline §4.1`)
     - `FAQ-05`: Missing availability dates & append-only profile versions (`IPP Policy Baseline §2.4`)
     - `FAQ-06`: Employer comments, student progress reports, and professor grading (`IPP Policy Baseline §5.1`)
     - `FAQ-07`: Synthetic data & privacy rule (`IPP Governance §1.2`)
     - `FAQ-08`: Challenging a recommendation & reviewing AI skill suggestions (`IPP Policy Baseline §4.3`)

3. **Confidence Threshold Refusal (`MIN_SCORE = 0.35`):**
   - Off-topic or unsupported questions scoring below `0.35` return `status: "refused"` rather than guessing.

---

## 3. Documented Failure, Corrective Action & Human Review Step (Lab 4 Requirement)

- **Observed failure during initial testing:** Mixed prompts such as *"Can AI waive the required verified skill and approve my placement without coordinator review?"* initially scored above `0.35` because they share keywords (`verified`, `skill`, `placement`, `approve`, `coordinator`) with `FAQ-02` and `FAQ-04`.
- **Corrective action:** Added pre-retrieval `EXCLUSION_PATTERNS` in `src/chatbot.js` so any exception/bypass/unsupported-policy intent immediately returns `status: "refused"` without matching FAQ articles.
- **Human review step:** Every answered response shows an explicit `Requires human approval` note, and every refused response lets the student log the question to the Coordinator queue for human follow-up.

---

## 4. How Partner Teams (P01–P07) Can Embed the Assistant

Any partner team's static web page (Lovable, React, or plain HTML) can embed the assistant with **one iframe** or **one script tag**, requiring zero backend changes:

### Option A — Script Include (same-origin or GitHub Pages asset)
```html
<script src="https://<your-github-pages-url>/src/chatbot.js"></script>
<script>
  const reply = window.P05Chatbot.ask("Who approves official co-op placements?");
  console.log(reply.status, reply.faq_id, reply.source, reply.answer);
</script>
```

### Option B — Embeddable Panel (`<iframe>` + `postMessage`)
```html
<iframe
  id="ipp-assistant"
  src="https://<your-github-pages-url>/#assistant"
  title="IPP Policy Assistant (P05)"
  style="width:100%;height:620px;border:1px solid #C5CEB5;border-radius:16px;">
</iframe>
```
Because the page supports deep-linking to `#assistant` and runs entirely client-side, partner portals can either link directly to `#assistant` or render it inside an iframe without CORS or localhost configuration.
