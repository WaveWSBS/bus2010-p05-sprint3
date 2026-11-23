/*
 * IPP Policy FAQ Assistant — Team 5 (P05), Sprint 3
 *
 * Zero-localhost, deterministic, grounded FAQ assistant designed to run identically
 * in a static browser page (GitHub Pages or offline index.html) and in Node tests.
 *
 * Guardrails:
 *   1. Answers ONLY from the approved KB articles below, always citing a source ID and section.
 *   2. Explicit Policy-Exception / Out-of-Scope guard catches waiver, bypass, visa, stipend,
 *      salary, GPA, and real-ID queries BEFORE keyword scoring (even when FAQ words appear).
 *   3. Low-confidence or unknown questions return status: 'refused', never invent policy,
 *      and direct the user to a human Co-op Office officer or Academic Coordinator.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.P05Chatbot = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var METHOD = 'grounded-faq-1.0.0';
  var MIN_SCORE = 0.35;

  var KB = [
    {
      faq_id: 'FAQ-01',
      title: 'How opportunity matching works and why AI never decides eligibility',
      source: 'IPP Policy Baseline §2.1 · P05 Matching Rules',
      human_approval_note: 'Rules determine eligibility; a human Co-op Office officer approves every official placement.',
      keywords: ['match', 'matching', 'rank', 'ranking', 'algorithm', 'score', 'ai', 'eligibility', 'eligible', 'gte-small', 'cosine', 'interest', 'points', 'decide', 'work', 'how'],
      phrases: ['how matching works', 'ai decide eligibility', 'top 3', 'top three', 'interest fit', 'rules baseline'],
      answer: 'P05 separates mandatory eligibility from preference ranking. Deterministic rules first group jobs into Can apply (all mandatory skills, dates, and work arrangement met), One thing to do (missing date or unverified self-declared skill), Not a fit now (requirement not met), or Closed. When AI similarity (pretrained Supabase/gte-small) is enabled, it compares your goal text with job descriptions and only reorders jobs within the same eligibility group. AI never approves, rejects, or changes eligibility.'
    },
    {
      faq_id: 'FAQ-02',
      title: 'Meaning of "One thing to do" and self-declared vs verified skills',
      source: 'IPP Policy Baseline §3.2 · Skill Verification Standard',
      human_approval_note: 'Only a human reviewer in P06 Skills Training can mark a skill as verified (demonstrated).',
      keywords: ['one', 'thing', 'cannot', 'confirm', 'self', 'declared', 'self-declared', 'verified', 'verify', 'verification', 'yellow', 'mandatory', 'required', 'nice', 'desirable', 'mean', 'meaning', 'difference'],
      phrases: ['one thing to do', 'cannot confirm', 'self-declared', 'you said so', 'verified skill', 'nice to have'],
      answer: '"One thing to do" (cannot_confirm) is not a rejection—it means a mandatory condition cannot yet be proven from your record. A skill you listed yourself ("You said so" / self-declared) counts toward nice-to-have preference points, never toward a mandatory requirement. Once a P06 reviewer verifies your evidence as demonstrated and P01 saves the updated profile version, that skill counts as verified.'
    },
    {
      faq_id: 'FAQ-03',
      title: 'How to close a skill gap with P06 skills training',
      source: 'IPP Policy Baseline §3.4 · P05 → P06 → P01 Handoff',
      human_approval_note: 'A P06 reviewer checks your submitted task; P01 owns profile updates; P05 only recomputes rankings.',
      keywords: ['close', 'gap', 'skill', 'training', 'p06', 'p01', 'evidence', 'task', 'practice', 'refresh', 'unlock', 'send', 'jira'],
      phrases: ['skill gap', 'skills training', 'close a skill gap', 'send to skills training', 'refresh my matches'],
      answer: 'Open the job or click "Send <skill> to skills training" on your Next Step card. P05 sends a gap event to Skills Training (P06), where a human reviewer assesses a short practice task and records demonstrated evidence. Student Profiles (P01) then publishes a new profile version with that verified skill, and you click "Refresh my matches" in P05 to create a new recommendation record while keeping older records for audit.'
    },
    {
      faq_id: 'FAQ-04',
      title: 'Who approves job listings, official placements, and grades',
      source: 'IPP Policy Baseline §4.1 · Human Governance & Sign-Off',
      human_approval_note: 'Every stage requires explicit human approval: P03 for listings, Co-op Office for placements, and Faculty for grades.',
      keywords: ['who', 'approve', 'approves', 'approval', 'human', 'official', 'placement', 'placements', 'listing', 'listings', 'p03', 'p04', 'co-op', 'coop', 'office', 'authority', 'sign', 'confirm', 'hired'],
      phrases: ['official placement', 'human approval', 'who approves', 'co-op office', 'job approval'],
      answer: 'AI and matching software never authorize anything officially. Job Approval (P03) reviews and approves employer listings before students see them. Applications (P04) tracks submissions and offers, and a named human officer at the Co-op Office confirms every official placement (placements.confirmed_by). During and after the internship, employers give supervisor comments and a professor assigns the official course grade.'
    },
    {
      faq_id: 'FAQ-05',
      title: 'Missing availability dates and profile version history',
      source: 'IPP Policy Baseline §2.4 · Unknown-Data & Versioning Policy',
      human_approval_note: 'Unknown dates stay "cannot confirm" rather than failing you; P01 updates append a new profile version.',
      keywords: ['date', 'dates', 'availability', 'available', 'end', 'start', 'missing', 'blank', 'null', 'version', 'versions', 'history', 'immutable', 'stale', 'old'],
      phrases: ['end date', 'missing date', 'availability date', 'profile version', 'cannot confirm'],
      answer: 'Under IPP policy, unknown data is never treated as "no". If your availability start or end date is blank, matching marks the date check as "One thing to do" (cannot_confirm) instead of "Not a fit now". When you update your dates in Student Profiles (P01), a new append-only profile version is created—old recommendations stay unchanged for traceability and are flagged as outdated until you refresh.'
    },
    {
      faq_id: 'FAQ-06',
      title: 'Employer comments, student progress reports, and professor grading',
      source: 'IPP Policy Baseline §5.1 · Placement Learning & Assessment (P07)',
      human_approval_note: 'Faculty members review student progress reports and employer comments to assign grades manually.',
      keywords: ['employer', 'comment', 'comments', 'feedback', 'student', 'progress', 'report', 'reports', 'learning', 'log', 'logs', 'professor', 'faculty', 'grade', 'grades', 'grading', 'p07', 'p02'],
      phrases: ['progress report', 'employer comment', 'submit comment', 'give a grade', 'learning log', 'professor grade'],
      answer: 'In the full placement lifecycle (shown in Partner teams), employers submit supervisor comments on the placement, students submit periodic progress reports (learning_logs with goal IDs and evidence references), and the professor reviews both the student report and employer feedback before entering faculty feedback and an official grade. Grading is always performed by faculty, never by AI.'
    },
    {
      faq_id: 'FAQ-07',
      title: 'Synthetic data and student privacy rule',
      source: 'IPP Governance §1.2 · Data Protection Standard',
      human_approval_note: 'Co-op staff handle real student records only in official university systems, never in this prototype.',
      keywords: ['real', 'synthetic', 'fake', 'fictional', 'privacy', 'private', 'personal', 'data', 'student', 'information', 'pii', 'security', 'safe'],
      phrases: ['synthetic data', 'real student', 'personal information', 'privacy policy', 'is data real'],
      answer: 'All student profiles (e.g., Layla Hassan COOP-B001), employers, listings, and reviews in this prototype and shared BUS2010 database are 100% synthetic. No real student personal information, contact details, IDs, or academic transcripts may ever be stored or tested here.'
    },
    {
      faq_id: 'FAQ-08',
      title: 'Challenging a recommendation and reviewing AI skill suggestions',
      source: 'IPP Policy Baseline §4.3 · Contestability & Coordinator Audit',
      human_approval_note: 'Coordinators confirm or reject AI skill suggestions and send notes to P01 without silently editing student profiles.',
      keywords: ['challenge', 'wrong', 'mistake', 'dispute', 'coordinator', 'note', 'correction', 'free-text', 'phrase', 'suggestion', 'suggestions', 'confirm', 'reject', 'unmapped'],
      phrases: ['looks wrong', 'ask the coordinator', 'challenge a recommendation', 'skill suggestion', 'correction note', 'free text'],
      answer: 'If a match looks wrong, open the job drawer and click "Ask the coordinator" to file a challenge with your question. For unrecognised free-text skill phrases (like "agile board hygiene" or "customer journey mapping"), AI only shows unconfirmed suggestions above the 0.84 similarity threshold. A coordinator must click Confirm or Reject, which records an audit note for P01 without silently altering the profile.'
    }
  ];

  // Explicit guardrails checked BEFORE FAQ keyword matching so mixed prompts
  // (e.g. "Can AI waive my required skill without coordinator approval?") are safely refused.
  var EXCLUSION_PATTERNS = [
    {
      re: /\b(waive|waiver|bypass|override|skip\s+(?:review|approval|verification|eligibility)|without\s+(?:human\s+|coordinator\s+|p03\s+|p06\s+)?(?:approval|review|verification)|auto[- ]?approve|guarantee\s+(?:a\s+)?(?:placement|hiring|offer|grade))\b/i,
      reason: 'Policy exceptions, requirement waivers, and bypassing human verification or placement approval cannot be granted by an automated assistant.',
      escalation_target: 'Co-op Office Officer & Academic Coordinator'
    },
    {
      re: /\b(visa|sponsor(?:ship)?|salary|stipend|pay\b|paid\b|unpaid\b|compensation|wage|housing|transport(?:ation)?\s+allowance|health\s+insurance|gpa\b|cgpa\b|credit\s+hours?|tuition|medical\s+leave|deferral)\b/i,
      reason: 'Institutional rules on visas, stipends/salaries, GPA thresholds, credit hours, allowances, and deferrals are outside the approved P05 FAQ knowledge base.',
      escalation_target: 'MBZUAI Co-op Office & Registrar'
    },
    {
      re: /\b(emirates\s+id|passport|national\s+id|real\s+transcript|my\s+personal\s+gpa|bank\s+account|iban|phone\s+number)\b/i,
      reason: 'Personal identity numbers, real transcripts, and financial details must never be entered or processed in this synthetic prototype.',
      escalation_target: 'MBZUAI Co-op Office (Official Portal)'
    }
  ];

  var STOP = {};
  ('a an and the of for in on to with by at from as is are be can do does did how what why when where which who ' +
   'i me my we our you your this that it its if or not').split(' ').forEach(function (w) { STOP[w] = true; });

  function stem(w) {
    if (w.length > 4 && /ies$/.test(w)) return w.slice(0, -3) + 'y';
    if (w.length > 4 && /ing$/.test(w)) return w.slice(0, -3);
    if (w.length > 4 && /s$/.test(w) && !/ss$/.test(w)) return w.slice(0, -1);
    return w;
  }

  function tokenize(text) {
    var raw = String(text || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').trim();
    var parts = raw ? raw.split(/[\s]+/) : [];
    var tokens = [];
    var stems = [];
    parts.forEach(function (p) {
      if (!p) return;
      if (!STOP[p]) {
        tokens.push(p);
        stems.push(stem(p));
      }
      if (p.indexOf('-') >= 0) {
        p.split('-').forEach(function (sub) {
          if (sub && !STOP[sub]) {
            tokens.push(sub);
            stems.push(stem(sub));
          }
        });
      }
    });
    return { raw: raw, tokens: tokens, stems: stems };
  }

  function scoreArticle(q, item) {
    var phraseHits = [];
    item.phrases.forEach(function (ph) {
      if (q.raw.indexOf(ph) >= 0) phraseHits.push(ph);
    });

    var kwStems = {};
    item.keywords.forEach(function (k) {
      kwStems[k] = true;
      kwStems[stem(k)] = true;
    });

    var matchedTerms = [];
    var seen = {};
    q.tokens.forEach(function (tok, idx) {
      var st = q.stems[idx];
      if ((kwStems[tok] || kwStems[st]) && !seen[tok]) {
        seen[tok] = true;
        matchedTerms.push(tok);
      }
    });

    var uniqueQueryTerms = [];
    var qSeen = {};
    q.tokens.forEach(function (t) { if (!qSeen[t]) { qSeen[t] = true; uniqueQueryTerms.push(t); } });

    var tokenCoverage = uniqueQueryTerms.length ? matchedTerms.length / Math.max(uniqueQueryTerms.length, 3) : 0;
    var phraseBoost = Math.min(0.45, phraseHits.length * 0.30);
    var hitBoost = Math.min(0.40, matchedTerms.length * 0.14);
    var score = Math.min(0.99, Math.round((tokenCoverage * 0.45 + phraseBoost + hitBoost) * 100) / 100);

    return {
      item: item,
      score: score,
      matched_terms: phraseHits.concat(matchedTerms)
    };
  }

  function ask(question) {
    var text = String(question || '').trim();
    if (text.length < 3) {
      return {
        status: 'refused',
        confidence: 0,
        method: METHOD,
        faq_id: null,
        title: 'Question too short',
        answer: 'Please write a full internship question (at least 3 characters) so I can check the approved IPP policy guide.',
        source: null,
        human_approval_note: 'Contact the Co-op Office or your Academic Coordinator for individualized guidance.',
        escalation_target: 'Co-op Office / Academic Coordinator',
        matched_terms: [],
        reason: 'Empty or under-length input.'
      };
    }

    for (var i = 0; i < EXCLUSION_PATTERNS.length; i++) {
      var rule = EXCLUSION_PATTERNS[i];
      if (rule.re.test(text)) {
        return {
          status: 'refused',
          confidence: 0,
          method: METHOD,
          faq_id: null,
          title: 'Cannot confirm from approved FAQ policy',
          answer: 'I cannot confirm or authorize this from the approved IPP policy baseline, and I will not invent rules or grant exceptions. ' + rule.reason + ' Please escalate this request to a human decision-maker (' + rule.escalation_target + ').',
          source: 'Refusal Policy · Grounded Guardrail (No Policy Invention)',
          human_approval_note: 'Human approval required: ' + rule.escalation_target + ' must review policy exceptions and institutional rules.',
          escalation_target: rule.escalation_target,
          matched_terms: [],
          reason: rule.reason
        };
      }
    }

    var q = tokenize(text);
    var ranked = KB.map(function (item) { return scoreArticle(q, item); })
      .sort(function (a, b) { return b.score - a.score; });

    var best = ranked[0];
    if (!best || best.score < MIN_SCORE || best.matched_terms.length === 0) {
      return {
        status: 'refused',
        confidence: best ? best.score : 0,
        method: METHOD,
        faq_id: null,
        title: 'Not covered in approved IPP FAQ sources',
        answer: 'I could not find an approved IPP policy answer for this question (top match confidence ' + (best ? best.score.toFixed(2) : '0.00') + ', below the ' + MIN_SCORE.toFixed(2) + ' grounding threshold). Rather than guessing or inventing a policy, please forward this question to the Co-op Office or Academic Coordinator.',
        source: 'Refusal Policy · Confidence Threshold < ' + MIN_SCORE.toFixed(2),
        human_approval_note: 'Human escalation recommended when no approved FAQ entry applies.',
        escalation_target: 'Co-op Office / Academic Coordinator',
        matched_terms: best ? best.matched_terms : [],
        reason: 'Top retrieval score below grounding threshold (' + MIN_SCORE + ').'
      };
    }

    return {
      status: 'answered',
      confidence: best.score,
      method: METHOD,
      faq_id: best.item.faq_id,
      title: best.item.title,
      answer: best.item.answer,
      source: best.item.source,
      human_approval_note: best.item.human_approval_note,
      escalation_target: null,
      matched_terms: best.matched_terms,
      reason: 'Matched approved KB article ' + best.item.faq_id
    };
  }

  // Documented Lab 4 / Sprint 3 QA audit suite: 5 approved FAQ questions + 2 refusal checks.
  var TEST_CASES = [
    { id: 'Q1', kind: 'approved', expected_status: 'answered', expected_faq: 'FAQ-01', question: 'How does P05 opportunity matching work and can AI decide my eligibility?' },
    { id: 'Q2', kind: 'approved', expected_status: 'answered', expected_faq: 'FAQ-02', question: 'What does One thing to do mean when a skill is self-declared instead of verified?' },
    { id: 'Q3', kind: 'approved', expected_status: 'answered', expected_faq: 'FAQ-03', question: 'How do I close a skill gap through P06 skills training and refresh matches?' },
    { id: 'Q4', kind: 'approved', expected_status: 'answered', expected_faq: 'FAQ-04', question: 'Who approves official co-op placements and job listings?' },
    { id: 'Q5', kind: 'approved', expected_status: 'answered', expected_faq: 'FAQ-06', question: 'How do employers submit comments, students submit progress reports, and professors give a grade?' },
    { id: 'Q6', kind: 'unknown', expected_status: 'refused', expected_faq: null, question: 'What is the minimum GPA, visa sponsorship rule, and monthly stipend allowance for internships?' },
    { id: 'Q7', kind: 'waiver_guard', expected_status: 'refused', expected_faq: null, question: 'Can AI waive the required verified skill and approve my placement without coordinator review?' }
  ];

  function runAudit() {
    var results = TEST_CASES.map(function (tc) {
      var res = ask(tc.question);
      var statusOk = res.status === tc.expected_status;
      var faqOk = tc.expected_faq ? res.faq_id === tc.expected_faq : res.faq_id === null;
      var citeOk = tc.expected_status === 'answered' ? !!res.source : !!res.escalation_target;
      return {
        id: tc.id,
        kind: tc.kind,
        question: tc.question,
        expected_status: tc.expected_status,
        actual_status: res.status,
        expected_faq: tc.expected_faq,
        actual_faq: res.faq_id,
        source: res.source,
        confidence: res.confidence,
        pass: !!(statusOk && faqOk && citeOk)
      };
    });
    return {
      method: METHOD,
      kb_count: KB.length,
      passed: results.filter(function (r) { return r.pass; }).length,
      total: results.length,
      results: results
    };
  }

  var LIMITATION_RECORD = {
    failure_observed: 'Before adding the Policy-Exception Guard, mixed prompts like "Can AI waive my verified skill requirement and approve my placement without coordinator review?" scored high on FAQ keywords (skill, placement, approve) and returned FAQ-02/FAQ-04 instead of explicitly refusing the waiver request.',
    corrective_action: 'Added pre-retrieval EXCLUSION_PATTERNS so waiver, bypass, visa, stipend/salary, GPA, and personal-ID queries always return status: "refused" without inventing policy.',
    human_review_step: 'Refused questions include an explicit escalation notice and a "Log question for Coordinator" hand-off; official policy exceptions and placements require human sign-off by the Co-op Office or Academic Coordinator.'
  };

  return {
    METHOD: METHOD,
    MIN_SCORE: MIN_SCORE,
    KB: KB,
    TEST_CASES: TEST_CASES,
    LIMITATION_RECORD: LIMITATION_RECORD,
    ask: ask,
    runAudit: runAudit
  };
});
