/*
 * P05 acceptance tests — Team 5
 * Each seeded defect D1–D8 maps to one named test with an expected output,
 * plus the brief's measures M1 (explanation integrity) and M2 (unknown-state
 * correctness), repeatability, the P06 round trip, immutability and scope.
 * Sprint 2 adds A1-A3 (the AI method's limits), E1 (rules vs AI on labelled pairs) and
 * L1 (database rows map to the engine's data shape).
 * Runs in the browser (Tests tab) and from the command line (tests/run-tests.js).
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.P05Tests = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Other modules: required in Node, read from the page in the browser.
  function dep(globalName, file) {
    if (typeof module === 'object' && module.exports && typeof require === 'function') return require(file);
    return typeof self !== 'undefined' ? self[globalName] : null;
  }

  function run(E, DATA) {
    var results = [];
    var EV = dep('P05Eval', './eval.js'), SRC = dep('P05Source', './supabase-source.js');
    function t(id, group, title, expected, fn) {
      try {
        var r = fn();
        results.push({ id: id, group: group, title: title, expected: expected, actual: r.actual, pass: !!r.pass });
      } catch (e) {
        results.push({ id: id, group: group, title: title, expected: expected, actual: 'Error: ' + e.message, pass: false });
      }
    }
    function fresh() { return E.createPlatform(DATA); }
    function pick(records, opp) { return records.filter(function (r) { return r.opportunity_id === opp; })[0]; }
    function cond(list, pred) { return list.filter(pred)[0]; }
    var studentIds = fresh().students().map(function (s) { return s.student_id; });

    function matrix(p, family) {
      var all = [];
      studentIds.forEach(function (sid) { all = all.concat(p.computeSet(sid, family).records); });
      return all;
    }

    t('D1', 'Seeded defect', 'Missing availability end date', 'Date condition reads cannot_confirm and names availability.end; not "not eligible"', function () {
      var r = pick(fresh().computeSet('COOP-B002', 'rules').records, 'OP-027');
      var c = cond(r.mandatory, function (x) { return x.kind === 'availability'; });
      return { pass: c.state === 'cannot_confirm' && /availability\.end/.test(c.detail) && r.status === 'cannot_confirm',
        actual: 'COOP-B002 × OP-027: availability = ' + c.state + ' ("' + c.detail + '"); overall ' + r.status };
    });

    t('D2', 'Seeded defect', 'Self-declared Jira, no evidence', 'Satisfies the desirable condition; cannot_confirm against the mandatory one', function () {
      var recs = fresh().computeSet('COOP-B003', 'rules').records;
      var d = cond(pick(recs, 'OP-027').desirable, function (x) { return x.skill_id === 'SK-JIRA-01'; });
      var m = cond(pick(recs, 'OP-028').mandatory, function (x) { return x.skill_id === 'SK-JIRA-01'; });
      return { pass: d.state === 'met' && m.state === 'cannot_confirm',
        actual: 'OP-027 desirable Jira = ' + d.state + '; OP-028 mandatory Jira = ' + m.state };
    });

    t('D3', 'Seeded defect', 'Free-text skill with no vocabulary term', '"agile board hygiene" stays unmapped; never matched to SK-JIRA-01; AI suggestion labelled unconfirmed', function () {
      var p = fresh();
      var prof = p.currentProfile('COOP-B004');
      var rules = cond(pick(p.computeSet('COOP-B004', 'rules').records, 'OP-028').mandatory, function (x) { return x.skill_id === 'SK-JIRA-01'; });
      var aiRec = pick(p.computeSet('COOP-B004', 'ai').records, 'OP-028');
      var ai = cond(aiRec.mandatory, function (x) { return x.skill_id === 'SK-JIRA-01'; });
      var note = aiRec.ai_notes.filter(function (n) { return /SK-JIRA-01/.test(n.text) && /unconfirmed/i.test(n.text); }).length > 0;
      var unmapped = prof.unmapped_skills.indexOf('agile board hygiene') >= 0 && !prof.skills.some(function (s) { return s.skill_id === 'SK-JIRA-01'; });
      return { pass: unmapped && rules.state === 'not_met' && ai.state === 'not_met' && note,
        actual: 'unmapped kept: ' + unmapped + '; rules Jira = ' + rules.state + '; AI Jira = ' + ai.state + '; AI note labelled unconfirmed: ' + note };
    });

    t('D4', 'Seeded defect', 'Listing with empty mandatory[]', 'Eligible on mandatory grounds for every student; never reads "no requirements matched"', function () {
      var p = fresh(), ok = 0;
      studentIds.forEach(function (sid) {
        var r = pick(p.computeSet(sid, 'rules').records, 'OP-029');
        if (r.status === 'eligible' && /no mandatory conditions/.test(r.status_reason) && !/no requirements matched/i.test(JSON.stringify(r))) ok++;
      });
      return { pass: ok === studentIds.length, actual: ok + '/' + studentIds.length + ' students: OP-029 eligible with "This listing states no mandatory conditions"' };
    });

    t('D5', 'Seeded defect', 'Closed listing', 'Excluded with "Closed on 2026-11-01"; listed last, never silently absent', function () {
      var recs = fresh().computeSet('COOP-B001', 'rules').records;
      var r = pick(recs, 'OP-030');
      var last = recs[recs.length - 1].opportunity_id === 'OP-030';
      return { pass: r && r.status === 'excluded' && /Closed on 2026-11-01/.test(r.status_reason) && last,
        actual: r ? 'OP-030 ' + r.status + ': "' + r.status_reason + '"; position ' + (recs.indexOf(r) + 1) + ' of ' + recs.length : 'OP-030 missing from list' };
    });

    t('D6', 'Seeded defect', 'Superseded listing version in fixture', 'Only OP-031 v2 is ever cited; v1 never recommended', function () {
      var p = fresh();
      var recs = matrix(p, 'rules').concat(matrix(p, 'ai')).filter(function (r) { return r.opportunity_id === 'OP-031'; });
      var bad = recs.filter(function (r) { return r.opportunity_version !== 2 || r.reasons.some(function (x) { return x.opportunity_version !== 2; }); }).length;
      return { pass: recs.length > 0 && bad === 0, actual: recs.length + ' OP-031 records checked; ' + bad + ' cite version 1' };
    });

    t('D7', 'Seeded defect', 'Profile advanced after a stored recommendation', 'Stored card flagged "based on profile v3, newer version exists"; recompute writes new record, keeps old', function () {
      var p = fresh();
      E.seedDemo(p);
      var set = p.computeSet('COOP-B005', 'rules');
      var old = pick(set.records, 'OP-031');
      var rc = p.recompute('COOP-B005', 'rules');
      var nw = pick(rc.records, 'OP-031');
      return { pass: set.stale && old.profile_version === 3 && set.profile.profile_version === 4 && nw.profile_version === 4 && nw.recommendation_id !== old.recommendation_id && !!p.state.recs[old.recommendation_id],
        actual: 'stale flag ' + set.stale + ' (stored v' + old.profile_version + ', current v' + set.profile.profile_version + '); recompute ' + old.recommendation_id + ' → ' + nw.recommendation_id + '; old retained: ' + !!p.state.recs[old.recommendation_id] };
    });

    t('D8', 'Seeded defect', 'Remote-only student, on-site role', 'A genuine not_met, distinct from cannot_confirm', function () {
      var r = pick(fresh().computeSet('COOP-B006', 'rules').records, 'OP-026');
      var c = cond(r.mandatory, function (x) { return x.kind === 'arrangement'; });
      return { pass: c.state === 'not_met' && r.status === 'not_eligible',
        actual: 'COOP-B006 × OP-026: arrangement = ' + c.state + ' ("' + c.detail + '"); overall ' + r.status };
    });

    t('M1', 'Measure', 'Explanation integrity (6 × 6 matrix, both methods)', '100% of reason lines name profile field, opportunity field and all three versions', function () {
      var p = fresh(), lines = 0, ok = 0;
      matrix(p, 'rules').concat(matrix(p, 'ai')).forEach(function (r) {
        r.reasons.forEach(function (x) {
          lines++;
          if (x.profile_field && x.opportunity_field && x.profile_version && x.opportunity_version && x.method_version) ok++;
        });
      });
      return { pass: lines > 0 && ok === lines, actual: ok + '/' + lines + ' reason lines fully traceable (' + Math.round(100 * ok / lines) + '%)' };
    });

    t('M2', 'Measure', 'Unknown-state correctness', 'Zero conditions shown as met when the input is unknown or only self-declared', function () {
      var p = fresh(), total = 0, bad = 0, unknowns = 0;
      matrix(p, 'rules').concat(matrix(p, 'ai')).forEach(function (r) {
        r.mandatory.forEach(function (c) {
          total++;
          if (!c.input_present) unknowns++;
          if (!c.input_present && c.state === 'met') bad++;
        });
      });
      return { pass: bad === 0 && unknowns > 0, actual: bad + ' false "met" across ' + total + ' mandatory checks (' + unknowns + ' unknown inputs, all shown as cannot_confirm)' };
    });

    t('R1', 'Repeatability', 'Same inputs, same record', 'Re-running with identical inputs returns the same recommendation_id', function () {
      var p = fresh();
      var a = p.computeSet('COOP-B001', 'rules').records.map(function (r) { return r.recommendation_id; }).sort().join(',');
      var b = p.recompute('COOP-B001', 'rules').records.map(function (r) { return r.recommendation_id; }).sort().join(',');
      return { pass: a === b, actual: a === b ? '6/6 recommendation IDs identical on re-run' : 'IDs changed: ' + a + ' vs ' + b };
    });

    t('R2', 'Repeatability', 'Changed availability field', 'COOP-B005 × OP-031 moves from not_met (v3, ends 2027-04-30) to met (v4, ends 2027-06-30)', function () {
      var p = fresh();
      var v3 = pick(p.computeAtVersion('COOP-B005', 3, 'rules'), 'OP-031');
      var v4 = pick(p.recompute('COOP-B005', 'rules').records, 'OP-031');
      var a3 = cond(v3.mandatory, function (x) { return x.kind === 'availability'; }).state;
      var a4 = cond(v4.mandatory, function (x) { return x.kind === 'availability'; }).state;
      return { pass: a3 === 'not_met' && a4 === 'met' && v3.status === 'not_eligible' && v4.status === 'eligible',
        actual: 'v3: availability ' + a3 + ', ' + v3.status + ' → v4: availability ' + a4 + ', ' + v4.status };
    });

    t('H1', 'Handoff', 'P05 → P06 → P01 → P05 round trip (walking skeleton)', 'Jira gap sent; reviewed E-JIRA-01 flips cannot_confirm → met; new REC id; old kept; OP-028 rank improves', function () {
      var p = fresh();
      var s1 = p.computeSet('COOP-B001', 'rules').records;
      var r1 = pick(s1, 'OP-028');
      var j1 = cond(r1.mandatory, function (x) { return x.skill_id === 'SK-JIRA-01'; }).state;
      var ev = p.sendGap(r1.recommendation_id, 'SK-JIRA-01').event;
      var contract = ['student_id', 'skill_id', 'opportunity_id', 'recommendation_id', 'timestamp'].every(function (k) { return !!ev[k]; });
      p.recordEvidence(ev.event_id, { outcome: 'demonstrated', reviewer: 'Test reviewer', review_date: '2026-11-09' });
      var stale = p.computeSet('COOP-B001', 'rules').stale;
      var s2 = p.recompute('COOP-B001', 'rules').records;
      var r2 = pick(s2, 'OP-028');
      var c2 = cond(r2.mandatory, function (x) { return x.skill_id === 'SK-JIRA-01'; });
      var rank1 = s1.indexOf(r1) + 1, rank2 = s2.indexOf(r2) + 1;
      return { pass: j1 === 'cannot_confirm' && contract && stale && c2.state === 'met' && c2.evidence_id === 'E-JIRA-01' && r2.recommendation_id !== r1.recommendation_id && !!p.state.recs[r1.recommendation_id] && rank2 < rank1,
        actual: 'Jira ' + j1 + ' → ' + c2.state + ' (' + c2.evidence_id + '); rank ' + rank1 + ' → ' + rank2 + '; ' + r1.recommendation_id + ' → ' + r2.recommendation_id + ' (old kept); gap contract fields ' + (contract ? 'complete' : 'missing') };
    });

    t('I1', 'Integrity', 'Recommendation records are immutable', 'Writing different content under an existing ID is refused', function () {
      var p = fresh();
      var r = p.computeSet('COOP-B001', 'rules').records[0];
      var forged = JSON.parse(JSON.stringify(r));
      forged.status = 'eligible';
      forged.pref_points = 99;
      try { p.saveRecommendation(forged); } catch (e) { return { pass: true, actual: 'Refused: ' + e.message }; }
      return { pass: false, actual: 'Overwrite was accepted' };
    });

    t('I2', 'Integrity', 'Coordinator note never edits P01 record', 'Profile unchanged after a correction note; note stored separately', function () {
      var p = fresh();
      var r = p.computeSet('COOP-B001', 'rules').records[0];
      var before = JSON.stringify(p.currentProfile('COOP-B001'));
      var n = p.addNote(r.recommendation_id, 'skills[SK-PBI-01]', 'Power BI certificate seen in person; ask P06 to review.', 'Sara Al-Marzouqi');
      var after = JSON.stringify(p.currentProfile('COOP-B001'));
      return { pass: before === after && !!n.note_id, actual: (before === after ? 'P01 profile unchanged' : 'P01 profile CHANGED') + '; note ' + n.note_id + ' stored against ' + n.field };
    });

    t('S1', 'Scope', 'Opportunities ranked for students only', 'No function ranks students for an employer', function () {
      var p = fresh();
      var names = Object.keys(E).concat(Object.keys(p));
      var bad = names.filter(function (n) { return /rankStudents|candidate/i.test(n); });
      return { pass: bad.length === 0, actual: bad.length ? 'Found: ' + bad.join(', ') : 'No student-ranking function in ' + names.length + ' exported functions' };
    });

    t('A1', 'AI', 'The AI method never changes who can apply', 'Same status and same mandatory states under rules and AI for every pair', function () {
      var p = fresh(), pairs = 0, diff = 0;
      studentIds.forEach(function (sid) {
        var A = p.computeSet(sid, 'rules').records, B = p.computeSet(sid, 'ai').records;
        A.forEach(function (a) {
          var b = pick(B, a.opportunity_id); pairs++;
          var sa = a.mandatory.map(function (c) { return c.state; }).join(','), sb = b.mandatory.map(function (c) { return c.state; }).join(',');
          if (a.status !== b.status || sa !== sb) diff++;
        });
      });
      return { pass: pairs > 0 && diff === 0, actual: diff + ' differences across ' + pairs + ' student–job pairs' };
    });

    t('A2', 'AI', 'AI scores come from the model and say so', 'With signals: ai_source embedding, note names gte-small. Without: labelled simulated fallback', function () {
      if (!DATA.ai) return { pass: false, actual: 'No AI signals loaded for this run' };
      var withAi = pick(fresh().computeSet('COOP-B004', 'ai').records, 'OP-029');
      var bare = Object.assign({}, DATA, { ai: null });
      var noAi = pick(E.createPlatform(bare).computeSet('COOP-B004', 'ai').records, 'OP-029');
      var n1 = withAi.ai_notes.filter(function (n) { return n.kind === 'goal_similarity'; })[0];
      var n2 = noAi.ai_notes.filter(function (n) { return n.kind === 'goal_similarity'; })[0];
      var ok = withAi.ai_source === 'embedding' && n1 && /gte-small/.test(n1.text) && noAi.ai_source === 'lexical-fallback' && n2 && /simulated/.test(n2.text) && withAi.recommendation_id !== noAi.recommendation_id;
      return { pass: !!ok, actual: 'with signals: ' + withAi.ai_source + ' (cosine ' + (n1 && n1.score) + '); without: ' + noAi.ai_source + '; separate record IDs: ' + (withAi.recommendation_id !== noAi.recommendation_id) };
    });

    t('A3', 'AI', 'AI skill suggestions wait for a person', 'Suggested skills are labelled unconfirmed, count only as preferences, never as a requirement', function () {
      var p = fresh(), suggested = 0, bad = 0;
      studentIds.forEach(function (sid) {
        p.computeSet(sid, 'ai').records.forEach(function (r) {
          if (r.mandatory.some(function (c) { return c.state === 'suggested'; })) bad++;
          r.desirable.forEach(function (c) { if (c.state === 'suggested') { suggested++; if (!/unconfirmed/i.test(c.detail)) bad++; } });
          r.ai_notes.forEach(function (n) { if (n.kind === 'skill_suggestion' && !/unconfirmed|preference only/i.test(n.text)) bad++; });
        });
      });
      var b4 = pick(p.computeSet('COOP-B004', 'ai').records, 'OP-028');
      var jira = b4.ai_notes.filter(function (n) { return n.skill_id === 'SK-JIRA-01'; })[0];
      return { pass: bad === 0 && !!jira, actual: suggested + ' suggested preference(s), ' + bad + ' problems; "agile board hygiene" → SK-JIRA-01 ' + (jira ? '(' + jira.via + ' ' + jira.score + ', unconfirmed)' : 'not suggested') };
    });

    t('E1', 'Evaluation', 'Rules and AI compared on labelled pairs', 'Both methods scored on at least 20 labelled pairs; AI changes eligibility in 0 pairs', function () {
      if (!EV) return { pass: false, actual: 'eval.js not loaded' };
      var res = EV.compare(E, DATA);
      var R = res.methods.rules, A = res.methods.ai;
      return { pass: res.pairs >= 20 && R.pairwise_interest != null && A.pairwise_interest != null && res.eligibility_changed === 0,
        actual: 'interest order ' + R.pairwise_interest + '% (rules) vs ' + A.pairwise_interest + '% (AI); full ranking ' + R.pairwise_rank + '% vs ' + A.pairwise_rank + '%; eligibility changed ' + res.eligibility_changed + '/' + res.pairs + ' (labels provisional)' };
    });

    t('L1', 'Shared database', 'Database rows map to the engine’s data shape', 'profile_feed and opportunity_feed rows for Layla and OP-028 rebuild the fixture objects exactly', function () {
      if (!SRC) return { pass: false, actual: 'supabase-source.js not loaded' };
      var prof = DATA.profiles.filter(function (x) { return x.student_id === 'COOP-B001' && x.profile_version === 3; })[0];
      var L = DATA.listings.filter(function (l) { return l.opportunity_id === 'OP-028'; })[0], v = L.versions[2];
      var dbCond = function (c) { return { kind: c.kind, skill_id: c.skill_id || null, arrangements: c.arrangements || null, city: c.city || null }; };
      var prow = { student_id: prof.student_id, full_name: prof.name, profile_version: prof.profile_version, status: 'submitted', goals: prof.goals, sectors: prof.sectors, roles: prof.roles,
        locations: prof.locations, work_arrangements: prof.work_arrangements, available_from: prof.availability.start, available_to: prof.availability.end,
        change_note: prof.change_note, published_at: prof.published_at, skills: prof.skills, unmapped_skills: prof.unmapped_skills };
      var orow = { opportunity_id: 'OP-028', version: 2, employer: v.employer, title: v.title, sector: v.sector, role_family: v.role_family, city: v.city, work_arrangement: v.work_arrangement,
        start_date: v.start_date, end_date: v.end_date, description: v.description, approved_version: L.approved_version, listing_status: L.listing_status, closed_on: L.closed_on,
        mandatory: v.mandatory.map(dbCond), desirable: v.desirable.map(dbCond) };
      var mp = SRC.mapProfiles([prow])[0], ml = SRC.mapListings([orow])[0];
      var ok = JSON.stringify(mp) === JSON.stringify(prof) && JSON.stringify(ml) === JSON.stringify(L);
      return { pass: ok, actual: ok ? 'Both rows map back to identical fixture objects' : 'Mismatch: ' + JSON.stringify(mp).slice(0, 80) };
    });

    // ---------- Sprint 3 checks: Grounded FAQ Chatbot, Synonym Fix Audit, End-to-End Partner Sign-Off ----------
    var CHAT = dep('P05Chatbot', './chatbot.js');

    t('C1', 'Chatbot', 'Answers five approved IPP questions with citations', 'All 5 approved internship questions return status answered with an explicit policy source', function () {
      if (!CHAT) return { pass: false, actual: 'chatbot.js not loaded' };
      var approved = CHAT.TEST_CASES.filter(function (tc) { return tc.kind === 'approved'; });
      var hits = approved.filter(function (tc) {
        var r = CHAT.ask(tc.question);
        return r.status === 'answered' && r.faq_id === tc.expected_faq && !!r.source && !!r.human_approval_note;
      });
      return { pass: approved.length >= 5 && hits.length === approved.length,
        actual: hits.length + '/' + approved.length + ' approved FAQs answered with grounded source citations' };
    });

    t('C2', 'Chatbot', 'Refuses unknown policy questions without inventing rules', 'Out-of-scope policy questions (GPA/visa/stipend or off-topic) return status refused and escalate to human', function () {
      if (!CHAT) return { pass: false, actual: 'chatbot.js not loaded' };
      var r1 = CHAT.ask('What is the minimum GPA, visa sponsorship rule, and monthly stipend allowance for internships?');
      var r2 = CHAT.ask('What is the cafeteria lunch menu today?');
      var ok = r1.status === 'refused' && r2.status === 'refused' && !!r1.escalation_target && /cannot confirm|could not find/i.test(r1.answer);
      return { pass: ok, actual: 'GPA/visa/stipend: ' + r1.status + ' (' + r1.escalation_target + '); off-topic: ' + r2.status };
    });

    t('C3', 'Chatbot', 'Policy-exception guard blocks waiver/bypass attempts', 'Mixed prompts asking AI to waive skills or bypass coordinator approval are refused despite FAQ keywords', function () {
      if (!CHAT) return { pass: false, actual: 'chatbot.js not loaded' };
      var r = CHAT.ask('Can AI waive the required verified skill and approve my placement without coordinator review?');
      return { pass: r.status === 'refused' && r.faq_id === null && !!r.escalation_target,
        actual: 'Mixed waiver prompt status = ' + r.status + ', escalated to ' + r.escalation_target };
    });

    t('A4', 'AI', 'Sprint 3 synonym fix verified (ai-embed-1.1.0)', '"customer journey mapping" maps #1 to SK-UX-01; "kanban ticket triage" reaches >= 0.84 on SK-JIRA-01; 0 eligibility changes', function () {
      var audit = DATA.ai && DATA.ai.sprint3_synonym_audit;
      if (!audit || !Array.isArray(audit.cases)) return { pass: false, actual: 'sprint3_synonym_audit missing from ai-signals' };
      var cjm = audit.cases.filter(function (c) { return c.phrase === 'customer journey mapping'; })[0];
      var ktt = audit.cases.filter(function (c) { return c.phrase === 'kanban ticket triage'; })[0];
      var okCjm = cjm && cjm.before[0].skill_id === 'SK-HLT-01' && cjm.after[0].skill_id === 'SK-UX-01' && cjm.after[0].score >= audit.threshold;
      var okKtt = ktt && ktt.before[0].score < audit.threshold && ktt.after[0].skill_id === 'SK-JIRA-01' && ktt.after[0].score >= audit.threshold;
      var okElig = audit.eligibility_changed === 0;
      return { pass: !!(okCjm && okKtt && okElig),
        actual: 'CJM: ' + cjm.before[0].skill_id + ' (' + cjm.before[0].score + ') → ' + cjm.after[0].skill_id + ' (' + cjm.after[0].score + '); KTT Jira: ' + ktt.before[0].score + ' → ' + ktt.after[0].score + '; eligibility changed ' + audit.eligibility_changed };
    });

    t('E2', 'End-to-end', 'Employer comment, progress report, and professor grade require human sign-off', 'Simulated partner loop stores employer comment, student progress log, and named human grade with ai_graded = false', function () {
      var p = fresh();
      var ec = p.addEmployerComment({ student_id: 'COOP-B001', opportunity_id: 'OP-028', supervisor: 'Tariq Al-Mansoori (synthetic)', comment: 'Strong SQL diagnostics on turnaround logs.' });
      var log = p.addProgressReport({ student_id: 'COOP-B001', opportunity_id: 'OP-028', period: '2027 week 2', goal_id: 'G-1', entry: 'Built flight delay KPI notebook.', evidence_ids: ['E-SQL-07'] });
      var graded = p.gradeProgressReport(log.log_id, { grade: 'A', feedback: 'Well documented and grounded in reviewed SQL evidence.', grader: 'Dr. R. Mensah (Faculty, synthetic)' });
      var ok = ec.simulated && log.simulated && graded.graded_by_human === true && graded.ai_graded === false && graded.review_status === 'reviewed' && graded.grade === 'A';
      return { pass: ok, actual: ec.comment_id + ' + ' + log.log_id + ' → grade ' + graded.grade + ' by ' + graded.grader + ' (ai_graded: ' + graded.ai_graded + ')' };
    });

    var passed = results.filter(function (r) { return r.pass; }).length;
    return { results: results, passed: passed, total: results.length };
  }

  return { run: run };
});
