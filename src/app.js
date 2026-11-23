/* P05 Opportunity Matcher — browser UI (Team 5). Vanilla JS, no build step required. */
(function () {
  'use strict';
  var E = window.P05Engine, TESTS = window.P05Tests, SRC = window.P05Source, EVAL = window.P05Eval, CHAT = window.P05Chatbot;
  // FIXTURE: the six demo students and jobs with precomputed gte-small signals. Used offline and by the checks.
  var FIXTURE = Object.assign({}, window.P05_DATA, { ai: window.P05_AI_SIGNALS || null });
  var DATA = null, SOURCE = null, P = null;
  var DEMO_IDS = ['COOP-B001', 'COOP-B002', 'COOP-B003', 'COOP-B004', 'COOP-B005', 'COOP-B006'];
  var DEMO_OPPS = FIXTURE.listings.map(function (l) { return l.opportunity_id; });
  var KEY = 'p05-opportunity-matcher-v2', KEY_SEEN = 'p05-onboarded-v1', KEY_THEME = 'p05-theme', KEY_TEAM = 'p05-team-key';
  var LIST_LIMIT = 12;

  // ---------- storage (this browser only; every call guarded) ----------
  function getLS(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function setLS(k, v) { try { window.localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function loadState() {
    var raw = getLS(stateKey());
    if (!raw) return null;
    try { var s = JSON.parse(raw); return s && s.schema === E.SCHEMA ? s : null; } catch (e) { return null; }
  }
  var persisted = true;
  function live() { return !!(SOURCE && SOURCE.mode === 'live'); }
  function stateKey() { return KEY + '-' + (live() ? 'live' : 'demo'); }
  // Live data has hundreds of students: keep only results someone acted on, plus the demo slice.
  function compactState(S) {
    var keep = {}, recs = {}, order = [], pointers = {};
    S.gapEvents.concat(S.challenges, S.notes).forEach(function (x) { keep[x.recommendation_id] = 1; });
    S.recOrder.forEach(function (id) {
      var r = S.recs[id];
      if (keep[id] || (DEMO_IDS.indexOf(r.student_id) >= 0 && DEMO_OPPS.indexOf(r.opportunity_id) >= 0)) { recs[id] = r; order.push(id); }
    });
    Object.keys(S.pointers).forEach(function (k) { if (recs[S.pointers[k]]) pointers[k] = S.pointers[k]; });
    return Object.assign({}, S, { recs: recs, recOrder: order, pointers: pointers });
  }
  function saveState() { if (P) persisted = setLS(stateKey(), JSON.stringify(live() ? compactState(P.state) : P.state)); }
  function freshPlatform() { var p = E.createPlatform(DATA); E.seedDemo(p); return p; }

  var savedTheme = getLS(KEY_THEME);
  if (savedTheme === 'light' || savedTheme === 'dark') document.documentElement.setAttribute('data-theme', savedTheme);

  var TABS = [
    { id: 'how', label: 'How it works' },
    { id: 'matches', label: 'My matches' },
    { id: 'assistant', label: 'IPP Assistant' },
    { id: 'coordinator', label: 'Coordinator' },
    { id: 'partners', label: 'Partner teams' },
    { id: 'tests', label: 'Quality checks' },
    { id: 'data', label: 'Data' }
  ];
  var ui = {
    tab: 'matches', student: 'COOP-B001', family: 'rules', layer: null, drawer: null,
    challengeOpen: false, diff: null, inspect: null, p06Form: null, lastPayload: null, resetArm: false, tests: null, weightsFamily: 'rules',
    showAll: false, ai: {}, decisions: {}, tryRes: null, writer: null, evalRes: null,
    chatHistory: [], chatInput: ''
  };

  // ---------- words ----------
  var VERDICT = {
    eligible: { cls: 'go', icon: '✓', label: 'Can apply' },
    cannot_confirm: { cls: 'todo', icon: '!', label: 'One thing to do' },
    not_eligible: { cls: 'no', icon: '–', label: 'Not a fit now' },
    excluded: { cls: 'no', icon: '–', label: 'Closed' }
  };
  var STATE = { met: { cls: 'go', icon: '✓' }, cannot_confirm: { cls: 'todo', icon: '!' }, not_met: { cls: 'no', icon: '–' }, suggested: { cls: 'todo', icon: '~' } };
  var TEAM = { P01: 'Student profiles', P02: 'Employer job posts', P03: 'Job approval', P04: 'Applications', P05: 'Matching (our team)', P06: 'Skills training', P07: 'Placement and learning' };
  var JOURNEY = [
    { t: 'Build your profile', d: 'Write down your goals, the dates you can work and the skills you have.', team: 'P01' },
    { t: 'Employers post jobs', d: 'A company describes the internship and the skills it needs.', team: 'P02' },
    { t: 'The university approves jobs', d: 'Staff check each job before students can see it.', team: 'P03' },
    { t: 'See which jobs fit you', d: 'This prototype. It shows which jobs you can apply for now and what is missing for the rest.', team: 'P05', here: true },
    { t: 'Close a skill gap', d: 'A short practice task. A reviewer checks your work and marks the skill as verified.', team: 'P06' },
    { t: 'Apply and track', d: 'Send an application and follow what happens to it.', team: 'P04' },
    { t: 'Do the placement', d: 'Work at the company, log what you learn and get feedback.', team: 'P07' }
  ];
  var GLOSSARY = [
    ['Co-op placement', 'A period of real work at a company that counts toward your degree. Often just called an internship.'],
    ['Job (listing)', 'An internship an employer posted and the university approved, so students can see it.'],
    ['Required', 'The employer says you must have this to apply.'],
    ['Nice to have', 'Helps your match, but you can apply without it.'],
    ['Verified skill', 'A reviewer from skills training checked a piece of your work and confirmed the skill.'],
    ['You said so', 'You listed the skill yourself. Nobody has checked it yet, so it cannot count as a requirement.'],
    ['One thing to do', 'Something we cannot confirm yet, usually a skill to get verified or a missing date. It is not a rejection.'],
    ['Not a fit now', 'A requirement is clearly missing, for example a skill you do not list or a work style you ruled out.'],
    ['Interest fit', 'Dots from 0 to 5 showing how well the sector, role, city and nice-to-have skills match what you picked.'],
    ['Coordinator', 'University staff who support students, answer questions about results and correct mistakes.'],
    ['Skills training', 'Team P06’s module. It turns a missing skill into a short task and verifies your evidence.'],
    ['Challenge', 'Telling the coordinator that a result looks wrong, so it is checked instead of ignored.'],
    ['Version', 'Every change to a profile or a job gets a new number, so any result can be traced back to what it used.'],
    ['Synthetic data', 'Invented students, companies and jobs for the class demo. Nothing here is real.']
  ];
  var TOUR = [
    { sel: '[data-tour="profile"]', title: 'This is Layla', text: 'A demo student. Skills with a green ✓ are verified by skills training. A yellow ! means she listed it herself and nobody has checked it yet.' },
    { sel: '[data-tour="counts"]', title: 'Three kinds of result', text: '✓ Can apply: she meets every requirement. ! One thing to do: something cannot be confirmed yet. – Not a fit now, or the job is closed.' },
    { sel: '[data-tour="next"]', title: 'Start here', text: 'The most useful thing to do next. For Layla it is getting Jira verified, which unlocks one more job.' },
    { sel: '[data-tour="jobs"]', title: 'One line per job', text: 'Each row says in plain words what to do. Open a job to see why it was suggested and what it requires.' },
    { sel: '#tabs', title: 'Other views', text: 'Coordinator is the university staff view. Partner teams simulates the other student teams. Quality checks shows our tests.' },
    { sel: '[data-tour="help"]', title: 'Lost? Use these', text: '“?” opens a glossary of every term. “Guide” replays this tour at any time.' }
  ];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // ---------- helpers ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function cap(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }
  function initials(name) { return name.split(' ').map(function (w) { return w[0]; }).slice(0, 2).join(''); }
  function firstName(sid) { var p = P.currentProfile(sid); return p ? p.name.split(' ')[0] : sid; }
  function time(iso) { try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } }
  function vocab(id) { return DATA.vocabulary.filter(function (v) { return v.skill_id === id; })[0] || { label: id }; }
  var SHORT = { 'SK-SQL-01': 'SQL', 'SK-PY-01': 'Python', 'SK-PBI-01': 'Power BI', 'SK-TAB-01': 'Tableau', 'SK-XLS-01': 'Excel', 'SK-STAT-01': 'Statistics', 'SK-JIRA-01': 'Jira',
    'SK-AGL-01': 'Agile and Scrum', 'SK-ML-01': 'Machine learning', 'SK-AVN-01': 'Aviation operations', 'SK-SCM-01': 'Supply-chain analytics', 'SK-GIS-01': 'GIS mapping', 'SK-ARB-01': 'Arabic', 'SK-COM-01': 'Communication',
    'SK-UX-01': 'UX research', 'SK-HLT-01': 'Healthcare operations', 'SK-SEC-01': 'Cybersecurity fundamentals' };
  function skillName(id) { return SHORT[id] || vocab(id).label; }
  function listing(id) { return DATA.listings.filter(function (l) { return l.opportunity_id === id; })[0]; }
  function json(o) { return '<pre class="json">' + esc(JSON.stringify(o, null, 2)) + '</pre>'; }
  function today() { return new Date().toISOString().slice(0, 10); }
  function fmt(iso) { if (!iso) return 'not given'; var p = iso.split('-'); return (+p[2]) + ' ' + MON[+p[1] - 1] + ' ' + p[0]; }
  function fmtShort(iso) { var p = iso.split('-'); return (+p[2]) + ' ' + MON[+p[1] - 1]; }
  function span(a, b) { return fmtShort(a) + ' – ' + fmt(b); }
  function ms(iso) { return Date.parse(iso + 'T00:00:00Z'); }
  function pct(iso, a, b) { return Math.max(0, Math.min(100, (ms(iso) - ms(a)) / (ms(b) - ms(a)) * 100)); }
  function n1(x) { return Math.round(x * 10) / 10; }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  function tip(s) { return ' data-tip="' + esc(s) + '"'; }
  function ic(cls, icon, label) { return '<span class="ic ic--' + cls + '"' + (label ? ' role="img" aria-label="' + esc(label) + '"' : ' aria-hidden="true"') + '>' + icon + '</span>'; }
  function unknownCount(r) { return r.mandatory.filter(function (c) { return c.state === 'cannot_confirm'; }).length; }
  function verdictOf(r) {
    var v = VERDICT[r.status];
    if (r.status === 'cannot_confirm' && unknownCount(r) > 1) return { cls: v.cls, icon: v.icon, label: unknownCount(r) + ' things to do' };
    return v;
  }
  function verdict(r) { var v = verdictOf(r); return '<span class="v v--' + v.cls + '"><i aria-hidden="true">' + v.icon + '</i>' + v.label + '</span>'; }
  function maxPoints(fam, w) { var p = (w.sector || 0) + (w.role || 0) + (w.city || 0) + 3 * (w.desirable_skill || 0); if (fam === 'ai') p += (w.goal_semantic != null ? w.goal_semantic : (w.goal_text || 0)); return n1(p); }

  // ---------- AI signals (live: fetched per student; demo: precomputed for the six demo students) ----------
  function aiReady(sid) { return !live() || ui.ai[sid] === 'ok' || ui.ai[sid] === 'failed'; }
  function ensureAi(sid) {
    if (!live() || ui.ai[sid]) return;
    var prof = P.currentProfile(sid);
    if (!prof) return;
    ui.ai[sid] = 'loading';
    SRC.loadAi(DATA, prof).then(function () { ui.ai[sid] = 'ok'; render(); }, function () { ui.ai[sid] = 'failed'; render(); });
  }
  function famFor(sid) { return ui.family === 'ai' && !aiReady(sid) ? 'rules' : ui.family; }
  function aiName() { return DATA && DATA.ai ? 'AI similarity (gte-small)' : 'AI helper (simulated)'; }
  function aiSourceText(r) {
    if (r.ai_source === 'embedding') return 'AI similarity: pretrained gte-small model, ' + (DATA.ai && DATA.ai.source === 'live' ? 'scores from the shared database' : 'precomputed scores');
    return 'AI helper (simulated: word overlap' + (r.ai_source === 'lexical-fallback' ? ', because no AI score reached this page' : '') + ')';
  }
  function studentLabel(sid) { var p = P.currentProfile(sid); return (p ? p.name : sid) + ' (' + sid + ')'; }
  function findStudent(text) {
    var t = String(text || '').trim(), m = /COOP-[A-Z]\d{3}/i.exec(t);
    if (m && P.currentProfile(m[0].toUpperCase())) return m[0].toUpperCase();
    var low = t.toLowerCase(), hit = P.students().filter(function (s) { return s.name.toLowerCase() === low; })[0] || P.students().filter(function (s) { return s.name.toLowerCase().indexOf(low) === 0; })[0];
    return hit && low ? hit.student_id : null;
  }

  var toastTimer = null;
  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 4200);
  }

  // ---------- writing to the shared database (P05 key, opt-in) ----------
  var DEFAULT_METHOD_IDS = ['rules-1.0.0', 'ai-assist-0.1.0', 'ai-embed-1.0.0'];
  function writeKey() { return live() && ui.writer === 'P05' ? getLS(KEY_TEAM) : null; }
  function liveWrite(recId, table, row) {
    var key = writeKey(), rec = P.state.recs[recId];
    if (!key || !rec) return;
    var m = P.method(rec.method_version), steps = [];
    if (DEFAULT_METHOD_IDS.indexOf(rec.method_version) < 0 && m) {
      steps.push(['match_methods', { method_id: m.method_version, family: m.family, label: m.label || m.method_version, weights: m.weights, params: m.params || {}, model: m.model || null, notes: m.note || null }]);
    }
    steps.push(['recommendations', SRC.recommendationRow(rec)]);
    steps.push([table, row]);
    steps.reduce(function (chain, st) { return chain.then(function () { return SRC.insertRows(st[0], [st[1]], key); }); }, Promise.resolve())
      .then(function () { toast('Also saved to the shared database.'); }, function (e) { toast('Saved in this browser only. The shared database said: ' + e.message); });
  }
  function writeGap(ev) {
    liveWrite(ev.recommendation_id, 'skill_gap_events', { gap_id: 'GAP-' + E.textKey(ev.recommendation_id + '|' + ev.skill_id), recommendation_id: ev.recommendation_id,
      student_id: ev.student_id, skill_id: ev.skill_id, opportunity_id: ev.opportunity_id, requirement: ev.requirement, status: 'sent' });
  }
  function writeChallenge(ch) {
    liveWrite(ch.recommendation_id, 'recommendation_challenges', { challenge_id: 'CH-' + E.textKey(ch.recommendation_id + '|' + ch.timestamp),
      recommendation_id: ch.recommendation_id, raised_by: ch.actor, question: ch.text, status: 'open' });
  }
  function decideSuggestion(d) {
    var rec = P.computeSet(d.sid, 'rules').records[0];
    var label = vocab(d.skill).label;
    var text = d.dec === 'confirm'
      ? 'AI suggestion confirmed by the coordinator: "' + d.ph + '" means ' + d.skill + ' (' + label + ', cosine ' + d.score + ', gte-small). Please add it to the profile as self-declared; P06 can then review it.'
      : 'AI suggestion rejected by the coordinator: "' + d.ph + '" is not ' + d.skill + ' (' + label + ', cosine ' + d.score + ').';
    P.addNote(rec.recommendation_id, 'unmapped_skills', text, 'Sara Al-Marzouqi');
    ui.decisions[d.sid + '|' + d.ph] = { d: d.dec, skill: d.skill };
    toast(d.dec === 'confirm' ? 'Confirmed. A note went to the profile team; the profile itself is unchanged.' : 'Rejected. The note is kept for the record.');
  }

  // ---------- tooltip ----------
  var tipEl = document.getElementById('tip');
  function placeTip(x, y) {
    var w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    tipEl.style.left = Math.min(window.innerWidth - w - 10, Math.max(10, x + 14)) + 'px';
    var top = y - h - 14; if (top < 10) top = y + 20;
    tipEl.style.top = top + 'px';
  }
  document.addEventListener('mouseover', function (e) {
    var el = e.target.closest && e.target.closest('[data-tip]');
    if (!el) { tipEl.hidden = true; return; }
    tipEl.textContent = el.getAttribute('data-tip'); tipEl.hidden = false; placeTip(e.clientX, e.clientY);
  });
  document.addEventListener('mousemove', function (e) { if (!tipEl.hidden) placeTip(e.clientX, e.clientY); });
  document.addEventListener('focusin', function (e) {
    var el = e.target.closest && e.target.closest('[data-tip]');
    if (!el) return;
    var r = el.getBoundingClientRect();
    tipEl.textContent = el.getAttribute('data-tip'); tipEl.hidden = false; placeTip(r.left + r.width / 2, r.top);
  });
  document.addEventListener('focusout', function () { tipEl.hidden = true; });
  window.addEventListener('scroll', function () { tipEl.hidden = true; }, { passive: true });

  // ---------- plain-language explanations ----------
  function requirement(c, r, they) {
    var L = r.listing, prof = P.profileAt(r.student_id, r.profile_version) || {};
    var your = they ? 'the' : 'your';
    if (c.kind === 'skill') {
      var name = skillName(c.skill_id);
      if (c.state === 'met') return { name: name, text: 'Verified by skills training.' };
      if (c.state === 'cannot_confirm') return { name: name, text: they ? 'Listed by the student, not verified yet.' : 'You listed it yourself, but it has not been verified yet.' };
      return { name: name, text: 'Not on ' + your + ' profile.' };
    }
    if (c.kind === 'availability') {
      var a = prof.availability || {}, nm = they ? 'Dates' : 'Your dates';
      if (c.state === 'met') return { name: nm, text: (they ? 'Free' : 'You are free') + ' for the whole placement, ' + span(L.start_date, L.end_date) + '.' };
      if (c.state === 'cannot_confirm') return { name: nm, text: cap(your) + ' profile is missing ' + (!a.start ? 'a start date' : 'an end date') + ', so this cannot be checked.' };
      return { name: nm, text: a.start > L.start_date ? (they ? 'Starts ' : 'You start ') + fmt(a.start) + ', but the job starts ' + fmt(L.start_date) + '.' : (they ? 'Free until ' : 'You are free until ') + fmt(a.end) + ', but the job runs until ' + fmt(L.end_date) + '.' };
    }
    if (c.kind === 'arrangement') {
      var w = (prof.work_arrangements || []).join(' or '), hn = they ? 'How they work' : 'How you work';
      if (c.state === 'met') return { name: hn, text: (they ? 'Open' : 'You are open') + ' to ' + L.work_arrangement + ' work.' };
      if (c.state === 'cannot_confirm') return { name: hn, text: cap(your) + ' profile does not say how to work.' };
      return { name: hn, text: 'The job needs ' + c.label + '; ' + your + ' profile says ' + w + ' only.' };
    }
    return { name: c.label, text: c.detail };
  }
  function todoText(c) {
    if (c.kind === 'skill') return 'Get ' + skillName(c.skill_id) + ' verified.';
    if (c.kind === 'availability') return 'Add your end date to your profile.';
    return 'Say how you want to work.';
  }
  function rowLine(r) {
    if (r.status === 'excluded') return 'Applications closed on ' + fmt(listing(r.opportunity_id).closed_on) + '.';
    if (r.status === 'eligible') return r.mandatory.length ? 'You meet every requirement.' : 'No fixed requirements, so anyone can apply.';
    if (r.status === 'cannot_confirm') return r.mandatory.filter(function (c) { return c.state === 'cannot_confirm'; }).map(todoText).join(' ');
    var n = r.mandatory.filter(function (c) { return c.state === 'not_met'; })[0];
    if (n.kind === 'skill') return 'Needs ' + skillName(n.skill_id) + ', which is not on your profile.';
    if (n.kind === 'availability') return 'Your dates do not cover the placement.';
    return 'Needs ' + n.label + '.';
  }
  function whyLines(r) {
    var out = [];
    r.mandatory.forEach(function (c) { if (c.kind === 'skill' && c.state === 'met') out.push('You have verified ' + skillName(c.skill_id) + ', which it requires.'); });
    (r.ai_notes || []).forEach(function (n) { if (n.kind === 'goal_similarity' && n.via === 'embedding' && n.fit >= 0.5) out.push('Your goals are close in meaning to this job (AI similarity ' + n.score + ').'); });
    r.interests.forEach(function (it) {
      if (!it.matched) return;
      if (it.kind === 'sector') out.push('It is in ' + it.value + ', a sector you picked.');
      if (it.kind === 'role') out.push('It is ' + (/^[aeiou]/i.test(it.value) ? 'an ' : 'a ') + it.value + ' role, which you are looking for.');
      if (it.kind === 'city') out.push(it.value === 'Remote' ? 'It is remote, which you said you are open to.' : 'It is in ' + it.value + ', where you want to work.');
    });
    r.desirable.forEach(function (c) { if (c.state === 'met') out.push('You have ' + skillName(c.skill_id) + ', which is nice to have.'); });
    return out.slice(0, 4);
  }
  function fitDots(r) {
    var m = P.currentMethod(r.method_family) || P.currentMethod('rules');
    var max = maxPoints(r.method_family, m.weights) || 1;
    var n = r.pref_points <= 0 ? 0 : Math.max(1, Math.min(5, Math.round(r.pref_points / max * 5)));
    var dots = '';
    for (var i = 0; i < 5; i++) dots += '<span class="' + (i < n ? 'on' : '') + '"></span>';
    return '<span class="fit tipable" role="img" aria-label="Interest fit ' + n + ' of 5"' + tip('Interest fit ' + n + ' of 5: how well the sector, role, city and nice-to-have skills match what you picked') + '>' + dots + '<em>Interest fit</em></span>';
  }
  function sentFor(recId, skillId) { return P.state.gapEvents.filter(function (e) { return e.recommendation_id === recId && e.skill_id === skillId; })[0]; }
  function sentForSkill(sid, skillId) { return P.state.gapEvents.filter(function (e) { return e.student_id === sid && e.skill_id === skillId; })[0]; }

  // ---------- tabs & unified IPP ribbon ----------
  var RIBBON_MODULES = [
    { mod: 'P01', title: 'Student Profile', tab: 'partners', pill: 'Simulated', live: false },
    { mod: 'P02 / P03', title: 'Job Approvals', tab: 'partners', pill: 'Live DB / Sim', live: false },
    { mod: 'P05', title: 'AI Opportunity Matching', tab: 'matches', pill: 'Live P05', live: true },
    { mod: 'P05', title: 'Policy FAQ Assistant', tab: 'assistant', pill: '0-Localhost', live: true },
    { mod: 'P06', title: 'Skills Verification', tab: 'partners', pill: 'Simulated', live: false },
    { mod: 'P04 / P07', title: 'Progress & Grading', tab: 'partners', pill: 'Simulated', live: false }
  ];
  function renderRibbon() {
    var el = document.getElementById('ipp-ribbon');
    if (!el) return;
    el.innerHTML = RIBBON_MODULES.map(function (m, idx) {
      var active = (ui.tab === 'matches' && idx === 2) || (ui.tab === 'assistant' && idx === 3) || (ui.tab === 'partners' && idx === 5);
      return '<button type="button" class="ipp-step' + (active ? ' active' : '') + '" data-action="tab" data-tab="' + m.tab + '">' +
        '<span class="ipp-step-top"><span>' + esc(m.mod) + '</span><span class="ipp-pill ' + (m.live ? 'ipp-pill--live' : 'ipp-pill--sim') + '">' + esc(m.pill) + '</span></span>' +
        '<span class="ipp-step-name">' + esc(m.title) + '</span></button>';
    }).join('');
  }
  function renderTabs() {
    document.getElementById('tabs').innerHTML = TABS.map(function (t) {
      var sel = t.id === ui.tab;
      return '<button class="tab" role="tab" id="tab-' + t.id + '" aria-selected="' + sel + '" aria-controls="view" tabindex="' + (sel ? 0 : -1) + '" data-action="tab" data-tab="' + t.id + '">' + esc(t.label) + '</button>';
    }).join('');
    renderRibbon();
    var dark = effectiveTheme() === 'dark';
    var tb = document.getElementById('theme-btn');
    tb.textContent = dark ? 'Light mode' : 'Dark mode';
    tb.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }
  function effectiveTheme() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t === 'light' || t === 'dark') return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function fromHash() {
    var h = (location.hash || '').replace('#', '');
    if (h === 'student') h = 'matches';
    if (TABS.some(function (t) { return t.id === h; })) ui.tab = h;
  }

  // ---------- How it works ----------
  function renderHow() {
    return '<div class="page-head"><h1>How a co-op placement happens</h1><p>Seven steps from your first profile to the end of your placement. Seven student teams each build one step. Ours, Team 5, builds step 4: showing each student which jobs fit and what is missing.</p>' +
      '<div class="actions"><button class="btn" data-action="tour">Show me around the prototype</button><button class="btn-quiet" data-action="tab" data-tab="matches">Go to My matches</button></div></div>' +
      '<ol class="howto">' + JOURNEY.map(function (j) {
        return '<li class="' + (j.here ? 'here' : '') + '"><div><h3>' + esc(j.t) + '</h3><p>' + esc(j.d) + '</p></div><span class="team-tag">' + j.team + ', ' + esc(TEAM[j.team]) + '</span></li>';
      }).join('') + '</ol>' +
      '<section class="sec" style="margin-top:28px"><div class="sec-head"><h2>Words you will see</h2><p>The same list opens from the “?” button at the top.</p></div>' +
      '<dl class="gloss gloss-grid">' + GLOSSARY.map(function (g) { return '<div><dt>' + esc(g[0]) + '</dt><dd>' + esc(g[1]) + '</dd></div>'; }).join('') + '</dl></section>';
  }

  // ---------- My matches ----------
  function profilePanel(prof) {
    var opts = P.students().map(function (s) { return '<option value="' + esc(s.name + ' (' + s.student_id + ')') + '"></option>'; }).join('');
    var chips = DEMO_IDS.filter(function (id) { return P.currentProfile(id); }).map(function (id) {
      return '<button class="chip" data-action="pick" data-sid="' + id + '" aria-pressed="' + (id === ui.student) + '">' + esc(firstName(id)) + '</button>';
    }).join('');
    var a = prof.availability || {};
    var dates = (a.start ? fmt(a.start) : '<span class="warn">start date missing</span>') + ' to ' + (a.end ? fmt(a.end) : '<span class="warn">end date missing</span>');
    var skills = prof.skills.map(function (s) {
      var ok = s.source === 'reviewed' && s.evidence_id;
      return '<li>' + (ok ? ic('go', '✓', 'Verified') : ic('todo', '!', 'Not verified yet')) + '<span>' + esc(skillName(s.skill_id)) + '</span><span class="s-sub">' + (ok ? 'Verified' : 'You said so, not verified yet') + '</span></li>';
    }).join('') + (prof.unmapped_skills || []).map(function (u) {
      return '<li>' + ic('no', '?', 'Not recognised') + '<span>“' + esc(u) + '”</span><span class="s-sub">Not a skill name the system knows</span></li>';
    }).join('');
    var notes = P.notesFor(prof.student_id);
    return '<aside class="panel" data-tour="profile" aria-label="Student profile">' +
      '<div class="p-sec"><label for="student-search">Student <span class="muted">(' + P.students().length + ')</span></label><input type="search" id="student-search" list="student-list" data-change="student-search" autocomplete="off" placeholder="Type a name or COOP-B…" value="' + esc(studentLabel(prof.student_id)) + '"><datalist id="student-list">' + opts + '</datalist>' +
      '<div class="chips" aria-label="Demo students">' + chips + '</div></div>' +
      '<div class="p-sec"><div class="who"><div class="avatar" aria-hidden="true">' + esc(initials(prof.name)) + '</div><div><div class="who-name">' + esc(prof.name) + '</div><div class="who-sub">Profile version ' + prof.profile_version + '</div></div></div>' +
      '<p class="goal">“' + esc(prof.goals) + '”</p>' +
      '<dl class="facts"><div><dt>Free to work</dt><dd>' + dates + '</dd></div><div><dt>Wants to work</dt><dd>' + esc((prof.locations || []).join(', ')) + ', ' + esc((prof.work_arrangements || []).join(' or ')) + '</dd></div><div><dt>Interested in</dt><dd>' + esc((prof.sectors || []).join(', ')) + '; ' + esc((prof.roles || []).join(', ')) + '</dd></div></dl></div>' +
      '<div class="p-sec"><span class="p-label">Skills</span><ul class="skills">' + skills + '</ul></div>' +
      (notes.length ? '<div class="p-sec"><span class="p-label">Notes from the coordinator</span>' + notes.map(function (n) { return '<p class="small">' + esc(n.text) + '</p>'; }).join('') + '</div>' : '') +
      '</aside>';
  }

  function nextStepCard(records, prof) {
    var todo = null, waiting = [];
    records.forEach(function (r) {
      if (r.status !== 'cannot_confirm') return;
      r.mandatory.forEach(function (c) {
        if (c.state !== 'cannot_confirm') return;
        if (c.kind === 'skill' && sentForSkill(r.student_id, c.skill_id)) { if (waiting.indexOf(c.skill_id) < 0) waiting.push(c.skill_id); return; }
        if (!todo) todo = { r: r, c: c };
      });
    });
    var wait = waiting.length ? '<p class="small">Already with skills training: ' + waiting.map(skillName).join(', ') + '. Your matches update when it is checked.</p>' : '';
    if (todo) {
      var name = todo.c.kind === 'skill' ? skillName(todo.c.skill_id) : '';
      var action = todo.c.kind === 'skill'
        ? '<button class="btn btn-dark" data-action="send-gap" data-rec="' + todo.r.recommendation_id + '" data-skill="' + todo.c.skill_id + '">Send ' + esc(name) + ' to skills training</button>'
        : '<span class="small">In this demo, change dates under Partner teams.</span>';
      var head = todo.c.kind === 'skill' ? 'Get ' + name + ' verified to unlock ' + todo.r.listing.title : 'Add your end date to unlock ' + todo.r.listing.title;
      var body = todo.c.kind === 'skill'
        ? 'You listed ' + name + ' yourself, but this job requires it to be verified. Skills training gives you a short task and checks your work.'
        : 'Without an end date we cannot tell whether you are free for the whole placement.';
      return '<section class="next" data-tour="next" aria-label="Your next step"><span class="next-label">Your next step</span><h2>' + esc(head) + '</h2><p>' + esc(body) + '</p><div class="actions">' + action + '<button class="btn-link" style="color:inherit" data-action="open" data-opp="' + todo.r.opportunity_id + '">See the job</button></div>' + wait + '</section>';
    }
    var top = records.filter(function (r) { return r.status === 'eligible'; })[0];
    return '<section class="next next--done" data-tour="next" aria-label="Your next step"><span class="next-label">Your next step</span><h2>' +
      (top ? 'You are ready to apply to ' + esc(top.listing.title) : 'Nothing to do right now') + '</h2><p>' +
      (top ? 'It is your best match. Applying happens in the Applications module (P04), outside this prototype.' : 'No open job is waiting on you.') + '</p>' + wait + '</section>';
  }

  function plainChange(prof) {
    var m = /evidence (E-[A-Z]+-\d+)/.exec(prof.change_note || '');
    if (m) {
      var ev = P.state.evidence.concat(DATA.evidence).filter(function (e) { return e.evidence_id === m[1]; })[0];
      if (ev) return skillName(ev.skill_id) + ' is now verified.';
    }
    return 'Your profile changed: ' + (prof.change_note || '') + '.';
  }

  function topThree(recs, fam) {
    var top = recs.filter(function (r) { return r.status !== 'excluded'; }).slice(0, 3);
    if (!top.length) return '';
    return '<section class="top3" aria-label="Top three suggestions"><div class="jobs-head"><h2>Top 3 for you</h2><span class="small muted">' + esc(fam === 'ai' ? 'Ranked with ' + aiName() : 'Ranked with the rules baseline') + '</span></div><ol class="t3">' + top.map(function (r, i) {
      var why = whyLines(r);
      if (!why.length) why = ['Open to you, but it shares little with what you picked.'];
      return '<li><span class="t3-n" aria-hidden="true">' + (i + 1) + '</span><div class="t3-main"><span class="job-title">' + esc(r.listing.title) + '</span><span class="job-org">' + esc(r.listing.employer) + ', ' + esc(r.listing.city) + '</span>' +
        '<ul class="t3-why">' + why.slice(0, 3).map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul></div><div class="job-side">' + verdict(r) + '<button class="btn-quiet btn-sm" data-action="open" data-opp="' + r.opportunity_id + '">View</button></div></li>';
    }).join('') + '</ol><p class="small muted">A ranking supports your decision; it is not a placement. Whether you can apply is checked separately, and a person at the co-op office approves every placement.</p></section>';
  }

  function renderMatches() {
    ensureAi(ui.student);
    var fam = famFor(ui.student);
    var set = P.computeSet(ui.student, fam);
    var prof = set.profile, recs = set.records, name = firstName(ui.student);
    var c = { go: 0, todo: 0, no: 0 };
    recs.forEach(function (r) { c[VERDICT[r.status].cls]++; });
    var openCount = recs.filter(function (r) { return r.status !== 'excluded'; }).length;
    var summary = c.go ? 'You can apply to ' + plural(c.go, 'job') + ' now.' : 'No job is ready to apply to yet.';
    if (c.todo) summary += ' ' + plural(c.todo, 'more job') + (c.todo === 1 ? ' needs' : ' need') + ' one thing from you.';

    var hello = '<div class="hello"><h1>' + esc(name) + '’s matches</h1><p>' + esc(summary) + ' We checked ' + plural(openCount, 'open job') + ' against your profile.' + (ui.family === 'ai' && fam !== 'ai' ? ' <span class="small muted">Loading AI scores…</span>' : '') + '</p></div>';
    var counts = '<div class="counts" data-tour="counts">' +
      [['go', '✓', 'Can apply'], ['todo', '!', 'One thing to do'], ['no', '–', 'Not now or closed']].map(function (k) {
        return '<div class="count"><span class="count-num">' + c[k[0]] + '</span><span class="count-label">' + ic(k[0], k[1], k[2]) + k[2] + '</span></div>';
      }).join('') + '</div>';

    var banner = '';
    if (set.stale) {
      banner = '<section class="next" data-tour="next" aria-label="Profile updated"><span class="next-label">Good news</span><h2>' + esc(plainChange(prof)) + '</h2><p>Your profile was updated on ' + fmt(prof.published_at) + '. Refresh to see how your matches change. Older results are kept for the record.</p>' +
        '<div class="actions"><button class="btn btn-dark" data-action="recompute">Refresh my matches</button></div></section>';
    }
    var changed = '';
    if (ui.diff && ui.diff.student === ui.student) {
      var rows = ui.diff.rows.filter(function (d) { return d.before.status !== d.after.status || d.before.rank !== d.after.rank; });
      changed = '<section class="changed" aria-label="What changed"><h2>What changed</h2>' + (rows.length ? '<ul>' + rows.map(function (d) {
        var b = VERDICT[d.before.status].label, a = VERDICT[d.after.status].label;
        return '<li><b>' + esc(d.title) + '</b>: ' + (b !== a ? esc(b) + ' → ' + esc(a) : 'still ' + esc(a)) + (d.after.status !== 'excluded' ? ', now number ' + d.after.rank : '') + '.</li>';
      }).join('') + '</ul>' : '<p>Nothing moved.</p>') + '<div class="actions" style="margin-top:4px"><button class="btn-quiet btn-sm" data-action="dismiss-diff">OK</button></div></section>';
    }

    var shown = ui.showAll ? recs : recs.slice(0, LIST_LIMIT);
    var list = '<div class="jobs-head"><h2>All ' + plural(recs.length, 'job') + '</h2><span class="small muted">Best options first</span></div><ol class="jobs" data-tour="jobs">' + shown.map(function (r) {
      var L = r.listing;
      var dim = r.status === 'not_eligible' || r.status === 'excluded';
      return '<li class="job' + (dim ? ' job--dim' : '') + '"><span class="job-verdict">' + verdict(r) + '</span>' +
        '<div class="job-main"><span class="job-title">' + esc(L.title) + '</span><span class="job-org">' + esc(L.employer) + ', ' + esc(L.city) + '</span><span class="job-line">' + esc(rowLine(r)) + '</span></div>' +
        '<div class="job-side">' + (r.status === 'excluded' ? '' : fitDots(r)) + '<button class="btn-quiet btn-sm" data-action="open" data-opp="' + r.opportunity_id + '">View</button></div></li>';
    }).join('') + '</ol>' + (recs.length > LIST_LIMIT ? '<div class="actions"><button class="btn-quiet" data-action="show-all">' + (ui.showAll ? 'Show the first ' + LIST_LIMIT + ' only' : 'Show all ' + recs.length + ' jobs') + '</button></div>' : '');

    return '<div class="matches">' + profilePanel(prof) + '<section class="main">' + hello + counts + changed + banner + (set.stale ? '' : nextStepCard(recs, prof)) + topThree(recs, fam) + list + '</section></div>';
  }

  function drawerJob(r) {
    var L = r.listing, id = r.recommendation_id;
    var why = whyLines(r);
    var reqs = r.mandatory.length ? '<ul class="reqs">' + r.mandatory.map(function (c) {
      var q = requirement(c, r), s = STATE[c.state];
      return '<li>' + ic(s.cls, s.icon, c.state) + '<span class="r-name">' + esc(q.name) + '</span><span class="r-text">' + esc(q.text) + '</span></li>';
    }).join('') + '</ul>' : '<p>This job has no fixed requirements.</p>';
    var actions = r.mandatory.filter(function (c) { return c.kind === 'skill' && c.state !== 'met'; }).map(function (c) {
      var s = sentFor(id, c.skill_id) || sentForSkill(r.student_id, c.skill_id);
      var n = skillName(c.skill_id);
      if (s) return '<div class="act act--sent"><b>' + esc(n) + ' is with skills training.</b><span class="small">Sent as ' + s.event_id + ', ' + esc(s.status.replace('_', ' ')) + '. Your matches update once it is checked.</span></div>';
      return '<div class="act"><b>' + (c.state === 'cannot_confirm' ? 'Get ' + esc(n) + ' verified' : 'Learn ' + esc(n)) + '</b><span class="small">' + (c.state === 'cannot_confirm' ? 'Skills training gives you a short task and a reviewer checks it.' : 'Skills training can turn this into a short course with a practice task.') + '</span><div><button class="btn btn-sm" data-action="send-gap" data-rec="' + id + '" data-skill="' + c.skill_id + '">Send ' + esc(n) + ' to skills training</button></div></div>';
    }).join('');
    var nice = r.desirable.filter(function (c) { return c.state === 'met'; }).map(function (c) { return skillName(c.skill_id); });
    var miss = r.desirable.filter(function (c) { return c.state !== 'met'; }).map(function (c) { return skillName(c.skill_id); });
    var ai = r.ai_notes.length ? '<div class="ai-note"><b>' + esc(aiSourceText(r)) + '</b>' + r.ai_notes.map(function (n) { return '<span>' + esc(n.text) + '</span>'; }).join('') + '</div>' : '';
    var chs = P.state.challenges.filter(function (c) { return c.recommendation_id === id; });
    var challenge = chs.length ? chs.map(function (c) { return '<p class="small">' + (c.status === 'open' ? 'You asked the coordinator about this result. They will reply here.' : 'Coordinator’s reply: ' + esc(c.response.text)) + '</p>'; }).join('')
      : ui.challengeOpen ? '<form data-form="challenge" data-rec="' + id + '"><label for="ch-text">What looks wrong?</label><textarea id="ch-text" required placeholder="For example: I used Jira every week in my capstone project."></textarea><div class="actions"><button class="btn btn-sm" type="submit">Send to the coordinator</button><button class="btn-quiet btn-sm" type="button" data-action="challenge">Cancel</button></div></form>'
      : '<div><button class="btn-quiet btn-sm" data-action="challenge">Ask the coordinator</button></div>';
    var cites = r.reasons.map(function (x) { return '<span class="cite">' + esc(x.profile_field) + ' ↔ ' + esc(x.opportunity_field) + ', profile v' + x.profile_version + ', job v' + x.opportunity_version + ', ' + esc(x.method_version) + '</span>'; }).join('');
    return '<div class="drawer-top">' + verdict(r) + '<button class="close" data-action="close" aria-label="Close">×</button></div>' +
      '<div><div class="d-title" id="drawer-title">' + esc(L.title) + '</div><div class="d-sub">' + esc(L.employer) + ', ' + esc(L.city) + ', ' + esc(L.work_arrangement) + '. ' + span(L.start_date, L.end_date) + '.</div></div>' +
      (r.status === 'excluded' ? '<div class="d-sec"><p>' + esc(rowLine(r)) + ' It stays in the list so nothing disappears without a reason.</p></div>' :
        (why.length ? '<div class="d-sec"><h3>Why it was suggested</h3><ul class="why">' + why.map(function (w) { return '<li>' + ic('go', '✓', 'Match') + '<span>' + esc(w) + '</span></li>'; }).join('') + '</ul></div>' : '') +
        '<div class="d-sec"><h3>What it requires</h3>' + reqs + actions + '</div>' +
        '<div class="d-sec"><h3>Nice to have</h3><p>' + (r.desirable.length ? (nice.length ? 'You have ' + esc(nice.join(', ')) + '. ' : '') + (miss.length ? 'Not on your profile: ' + esc(miss.join(', ')) + '. ' : '') + 'These help your interest fit but are not required.' : 'Nothing extra listed.') + '</p>' + ai + '</div>' +
        '<div class="d-sec"><h3>Think this result is wrong?</h3>' + challenge + '</div>') +
      '<details class="fold"><summary>Technical details <span class="muted">for the coordinator and testers</span></summary><div class="fold-body tech"><span>Record ' + id + ', profile version ' + r.profile_version + ', job version ' + r.opportunity_version + ', method ' + esc(r.method_version) + ', ' + n1(r.pref_points) + ' interest points.</span>' + cites + '</div></details>';
  }

  // ---------- IPP Policy Assistant (0-localhost grounded FAQ + refusal guard) ----------
  function chatbotPanelHtml(inDrawer) {
    var chips = [
      { label: 'How matching & AI work', q: 'How does P05 opportunity matching work and can AI decide my eligibility?', warn: false },
      { label: 'Meaning of "One thing to do"', q: 'What does One thing to do mean when a skill is self-declared instead of verified?', warn: false },
      { label: 'Close a skill gap (P06)', q: 'How do I close a skill gap through P06 skills training and refresh matches?', warn: false },
      { label: 'Who approves placements?', q: 'Who approves official co-op placements and job listings?', warn: false },
      { label: 'Comments, reports & grades', q: 'How do employers submit comments, students submit progress reports, and professors give a grade?', warn: false },
      { label: 'Test refusal: GPA / visa / stipend', q: 'What is the minimum GPA, visa sponsorship rule, and monthly stipend allowance for internships?', warn: true },
      { label: 'Test guard: waive verified skill', q: 'Can AI waive the required verified skill and approve my placement without coordinator review?', warn: true }
    ];
    var chipHtml = '<div class="chat-chips">' + chips.map(function (c, i) {
      return '<button type="button" class="chat-chip' + (c.warn ? ' chat-chip--warn' : '') + '" data-action="chat-sample" data-idx="' + i + '">' + esc(c.label) + '</button>';
    }).join('') + '</div>';
    var formHtml = '<form data-form="chatbot-ask" class="try"><label for="chat-q-' + (inDrawer ? 'd' : 'p') + '">Ask an internship or IPP policy question</label>' +
      '<div class="try-row"><input type="text" id="chat-q-' + (inDrawer ? 'd' : 'p') + '" class="chat-q-input" maxlength="260" required placeholder="For example: Who approves official placements?" value="' + esc(ui.chatInput || '') + '">' +
      '<button class="btn btn-sm" type="submit">Ask Assistant</button></div></form>';
    var thread = ui.chatHistory.length
      ? '<div class="chat-thread">' + ui.chatHistory.map(function (turn, idx) {
          var r = turn.reply, ans = r.status === 'answered';
          var escBtn = !ans ? (turn.escalated
            ? '<span class="v v--go"><i aria-hidden="true">✓</i>Logged for Coordinator</span>'
            : '<button type="button" class="btn-quiet btn-sm" data-action="escalate-chat" data-idx="' + idx + '">Log question for Coordinator</button>') : '';
          return '<div class="chat-msg chat-msg--user"><b>You:</b> ' + esc(turn.question) + '</div>' +
            '<div class="chat-msg' + (ans ? '' : ' chat-msg--refused') + '">' +
              '<div class="sg-head"><span class="v v--' + (ans ? 'go"><i aria-hidden="true">✓</i>Grounded Policy Answer' : 'todo"><i aria-hidden="true">!</i>Refused — Human Escalation') + '</span>' +
              (r.faq_id ? '<span class="id">' + esc(r.faq_id) + '</span>' : '') +
              '<span class="small muted">confidence ' + Number(r.confidence || 0).toFixed(2) + '</span></div>' +
              '<p>' + esc(r.answer) + '</p>' +
              '<div class="chat-cite">Source: ' + esc(r.source || 'Refusal guardrail') + ' · method ' + esc(r.method) + '</div>' +
              '<div class="chat-human-box"><b>Human approval boundary:</b> ' + esc(r.human_approval_note) + (escBtn ? '<div class="actions" style="margin-top:6px">' + escBtn + '</div>' : '') + '</div>' +
            '</div>';
        }).join('') + '</div>'
      : '<div class="empty">Try an approved question or test the refusal guard with the buttons above. Answers come strictly from approved IPP policy sources with zero localhost backend.</div>';
    return chipHtml + formHtml + thread;
  }

  function renderAssistant() {
    var audit = CHAT ? CHAT.runAudit() : { passed: 0, total: 0, results: [], kb_count: 0 };
    var lim = CHAT ? CHAT.LIMITATION_RECORD : {};
    var embedBase = (location.protocol === 'http:' && (location.hostname === '127.0.0.1' || location.hostname === 'localhost')) || location.protocol === 'file:'
      ? 'https://pms3.mbzuai.wavew.sbs/' : location.href.split('#')[0].split('?')[0];
    var embedUrl = embedBase + '#assistant';
    var embedSnippet = '<iframe src="' + embedUrl + '" title="IPP Policy Assistant (P05)" style="width:100%;height:620px;border:1px solid #C5CEB5;border-radius:16px;"></iframe>';
    var left = '<section class="sec" aria-label="Interactive Policy Assistant"><div class="sec-head"><h2>Ask the grounded FAQ assistant</h2><p>Runs 100% client-side in this browser (no localhost server required). Refuses unknown rules, waiver requests, and personal data without inventing policy.</p></div>' + chatbotPanelHtml(false) + '</section>';
    var right = '<section class="sec" aria-label="Embedding plan for partner teams"><div class="sec-head"><h2>Partner embedding plan (zero localhost)</h2><p>Any partner team portal (P01–P07) can embed this static assistant with an iframe or include <span class="id">src/chatbot.js</span> directly.</p></div>' +
      '<pre class="json">' + esc(embedSnippet) + '</pre>' +
      '<div class="actions" style="margin-top:0"><button type="button" class="btn-quiet btn-sm" data-action="copy-embed">Copy iframe snippet</button><span class="small muted">' + audit.kb_count + ' approved KB articles</span></div></section>' +
      '<section class="sec" aria-label="Chatbot QA audit"><div class="sec-head"><h2>QA audit (' + audit.passed + ' of ' + audit.total + ' pass)</h2><p>5 approved internship questions + 2 out-of-policy / waiver refusal checks.</p></div>' +
      '<div class="pcard-list">' + audit.results.map(function (res) {
        return '<div class="pcard-item"><div class="sg-head"><span class="id">' + esc(res.id) + '</span><b>' + esc(res.kind === 'approved' ? res.actual_faq : 'Refusal Guard') + '</b><span class="' + (res.pass ? 'pass' : 'fail') + '">' + (res.pass ? '✓ Pass' : 'Fail') + '</span></div>' +
          '<span class="small">' + esc(res.question) + '</span></div>';
      }).join('') + '</div>' +
      '<div class="chat-human-box"><b>Documented limitation &amp; fix (Lab 4):</b><span>' + esc(lim.failure_observed || '') + '</span><span><b>Corrective action:</b> ' + esc(lim.corrective_action || '') + '</span><span><b>Human review step:</b> ' + esc(lim.human_review_step || '') + '</span></div></section>';
    return '<div class="page-head"><h1>IPP Policy Assistant</h1><p>Sprint 3 deliverable: students can ask internship policy questions, verify how AI matching stays bounded, and see clearly where human approval is required.</p></div>' +
      '<div class="cols"><div class="col">' + left + '</div><div class="col">' + right + '</div></div>';
  }

  // ---------- Coordinator ----------
  function plainField(f) {
    var m = f.match(/^skills\[(.+)\]$/); if (m) return 'Skill: ' + skillName(m[1]);
    m = f.match(/^mandatory\[(.+)\]$/); if (m) return 'Requires ' + skillName(m[1]);
    m = f.match(/^desirable\[(.+)\]$/); if (m) return 'Nice to have: ' + skillName(m[1]);
    return { availability: 'Free to work', work_arrangements: 'How they want to work', sectors: 'Sectors picked', roles: 'Roles picked', locations: 'Places picked', goals: 'Goal text', unmapped_skills: 'Unrecognised skills', 'start_date/end_date': 'Placement dates', work_arrangement: 'Work style', sector: 'Sector', role_family: 'Role', city: 'City', description: 'Job description' }[f] || f;
  }
  function profileValue(prof, f) {
    var m = f.match(/^skills\[(.+)\]$/);
    if (m) { var s = prof.skills.filter(function (x) { return x.skill_id === m[1]; })[0]; return !s ? 'Not on profile' : (s.source === 'reviewed' && s.evidence_id ? 'Verified' : 'Listed by student, not verified'); }
    if (f === 'availability') { var a = prof.availability || {}; return fmt(a.start) + ' to ' + fmt(a.end); }
    var v = prof[f]; return Array.isArray(v) ? v.join(', ') : (v == null ? 'not given' : String(v));
  }
  function listingValue(r, f) {
    var L = listing(r.opportunity_id), rec = L && L.versions[r.opportunity_version];
    if (!rec) return '';
    if (/^(mandatory|desirable)\[/.test(f)) return 'Yes';
    if (f === 'start_date/end_date') return span(rec.start_date, rec.end_date);
    return String(rec[f] == null ? '' : rec[f]);
  }
  function dumbbell(A, B) {
    var max = Math.max(1, Math.max.apply(null, A.concat(B).map(function (r) { return r.pref_points; })));
    return '<ul class="legend"><li><i class="key fill--s1"></i>Rules only</li><li><i class="key fill--s2"></i>With ' + esc(aiName()) + '</li></ul><ul class="dumb">' + A.filter(function (r) { return r.status !== 'excluded'; }).slice(0, 10).map(function (a) {
      var b = B.filter(function (x) { return x.opportunity_id === a.opportunity_id; })[0];
      var x1 = a.pref_points / max * 100, x2 = b.pref_points / max * 100;
      return '<li class="db"><span class="db-label">' + esc(a.listing.title) + '</span><span class="db-track"><span class="db-line" style="left:' + Math.min(x1, x2) + '%;width:' + Math.abs(x2 - x1) + '%"></span>' +
        '<span class="db-dot fill--s1" style="left:' + x1 + '%"' + tip('Rules only: ' + n1(a.pref_points) + ' interest points') + '></span><span class="db-dot fill--s2" style="left:' + x2 + '%"' + tip('With ' + aiName() + ': ' + n1(b.pref_points) + ' interest points') + '></span></span></li>';
    }).join('') + '</ul>';
  }
  function aiSuggestPanel(sid) {
    var prof = P.currentProfile(sid), phrases = prof.unmapped_skills || [];
    var m = P.currentMethod('ai'), min = (m.params || E.AI_PARAMS).suggest_min;
    ensureAi(sid);
    function row(sg, ph, decided) {
      var ok = sg.score >= min;
      var act = ok && !decided ? '<span class="sg-act"><button class="btn btn-sm" data-action="sugg" data-dec="confirm" data-sid="' + sid + '" data-ph="' + esc(ph) + '" data-skill="' + sg.skill_id + '" data-score="' + sg.score + '">Confirm</button><button class="btn-quiet btn-sm" data-action="sugg" data-dec="reject" data-sid="' + sid + '" data-ph="' + esc(ph) + '" data-skill="' + sg.skill_id + '" data-score="' + sg.score + '">Reject</button></span>'
        : '<span class="small muted">' + (ok ? '' : 'Below ' + min + ', not suggested') + '</span>';
      var vLabel = vocab(sg.skill_id).label;
      var dispLabel = vLabel === sg.skill_id ? skillName(sg.skill_id) : vLabel;
      return '<li class="sg' + (ok ? '' : ' sg--low') + '"><span>' + esc(dispLabel) + (dispLabel === sg.skill_id ? '' : ' <span class="id">' + sg.skill_id + '</span>') + '</span><span class="sg-score">' + Number(sg.score).toFixed(3) + '</span>' + act + '</li>';
    }
    var rows = phrases.map(function (ph) {
      var list = DATA.ai && DATA.ai.phrases ? DATA.ai.phrases[ph] : null;
      var dec = ui.decisions[sid + '|' + ph];
      var body = list ? list.map(function (sg) { return row(sg, ph, dec); }).join('') : '<li class="small muted">' + (aiReady(sid) ? 'No AI score for this phrase yet. Use “Try a phrase” below.' : 'Loading AI scores…') + '</li>';
      var badge = dec ? '<span class="v v--' + (dec.d === 'confirm' ? 'go"><i aria-hidden="true">✓</i>Confirmed as ' : 'no"><i aria-hidden="true">–</i>Rejected ') + esc(skillName(dec.skill)) + '</span>' : '';
      return '<div class="sg-phrase"><div class="sg-head"><b>“' + esc(ph) + '”</b>' + badge + '</div><ul class="sgs">' + body + '</ul></div>';
    }).join('');
    var tryHtml = '';
    if (live()) {
      var tr = ui.tryRes;
      tryHtml = '<form data-form="try-phrase" class="try"><label for="try-ph">Try a phrase</label><div class="try-row"><input type="text" id="try-ph" maxlength="120" required placeholder="For example: kanban ticket triage" value="' + esc(tr && tr.phrase || '') + '"><button class="btn btn-sm" type="submit">' + (tr && tr.loading ? 'Asking…' : 'Ask the AI') + '</button></div></form>' +
        (tr && tr.error ? '<p class="small">The AI service did not answer: ' + esc(tr.error) + '</p>' : '') +
        (tr && tr.suggestions ? '<ul class="sgs">' + tr.suggestions.map(function (sg) { return row({ skill_id: sg.skill_id, score: sg.similarity }, tr.phrase, true); }).join('') + '</ul><p class="small muted">Answered live by the ai-suggest function (gte-small). Nothing is saved.</p>' : '');
    } else tryHtml = '<p class="small muted">Live phrase suggestions need the shared database.</p>';
    var audit = (DATA.ai && DATA.ai.sprint3_synonym_audit) || (FIXTURE.ai && FIXTURE.ai.sprint3_synonym_audit);
    var auditHtml = '';
    if (audit && audit.cases) {
      auditHtml = '<div class="audit-card"><div class="sg-head"><b>Sprint 3 synonym fix audit (<span class="id">' + esc(audit.from_method) + '</span> → <span class="id">' + esc(audit.to_method) + '</span>)</b>' +
        '<span class="v v--go"><i aria-hidden="true">✓</i>Eligibility diff: ' + audit.eligibility_changed + '</span></div>' +
        '<p class="small muted">Measured with pretrained <span class="id">' + esc(audit.model) + '</span> locally; SQL migration (<span class="id">20261123100000_sprint3_synonym_fix.sql</span>) packaged for the shared DB (live Edge Function serves 1.0.0 until DB migration runs).</p>' +
        audit.cases.slice(0, 2).map(function (c) {
          var b = c.before[0], a = c.after[0];
          return '<div class="audit-cols"><div class="audit-box"><b>Before (Sprint 2): “' + esc(c.phrase) + '”</b><span>#1: ' + esc(b.label) + ' (<span class="id">' + esc(b.skill_id) + '</span>) · <span class="sg-score">' + b.score.toFixed(4) + '</span></span>' +
            '<span class="small muted">' + (b.suggested ? 'Above 0.84 (wrong suggestion)' : 'Below 0.84 (missed)') + '</span></div>' +
            '<div class="audit-box audit-box--after"><b>After (Sprint 3): “' + esc(c.phrase) + '”</b><span>#1: ' + esc(a.label) + ' (<span class="id">' + esc(a.skill_id) + '</span>) · <span class="sg-score">' + a.score.toFixed(4) + '</span></span>' +
            '<span class="small">' + (a.suggested ? '✓ Above 0.84 (intended skill ranked #1; human confirms)' : 'Below 0.84') + '</span></div></div>';
        }).join('') + '</div>';
    }
    return '<section class="sec" aria-label="AI skill suggestions"><div class="sec-head"><h2>AI skill suggestions</h2><p>Skills a student typed in their own words are compared in meaning with the shared skill list. A suggestion changes nothing until you confirm it, and confirming only sends a note to the profile team (P01).</p></div>' +
      (phrases.length ? rows : '<p class="small muted">' + esc(prof.name) + ' has no unrecognised skills. Arjun (COOP-B004) has one.</p>') + tryHtml + auditHtml + '</section>';
  }

  function renderCoordinator() {
    var chs = P.state.challenges.slice().reverse();
    var open = chs.filter(function (c) { return c.status === 'open'; }).length;
    if (!ui.inspect) {
      var firstOpen = chs.filter(function (c) { return c.status === 'open'; })[0];
      ui.inspect = firstOpen ? firstOpen.recommendation_id : P.computeSet('COOP-B001', 'rules').records.filter(function (r) { return r.opportunity_id === 'OP-028'; })[0].recommendation_id;
    }
    var r = P.state.recs[ui.inspect];
    var chHtml = chs.length ? chs.map(function (c) {
      var prof = P.currentProfile(c.student_id), L = P.state.recs[c.recommendation_id].listing;
      var resp = c.status === 'open'
        ? '<form data-form="resolve" data-ch="' + c.challenge_id + '"><label for="resp-' + c.challenge_id + '">Your reply</label><textarea id="resp-' + c.challenge_id + '" required placeholder="What you checked and what happens next."></textarea><div class="actions"><button class="btn btn-sm" type="submit">Send reply</button><button class="btn-quiet btn-sm" type="button" data-action="inspect" data-rec="' + c.recommendation_id + '">Check this result</button></div></form>'
        : '<p class="small"><b>You replied:</b> ' + esc(c.response.text) + '</p>';
      return '<div class="ch"><div class="ch-meta"><span class="v v--' + (c.status === 'open' ? 'todo"><i aria-hidden="true">!</i>Waiting for you' : 'go"><i aria-hidden="true">✓</i>Answered') + '</span><span>' + esc(prof.name) + ' about ' + esc(L ? L.title : c.opportunity_id) + '</span></div><p class="quote">“' + esc(c.text) + '”</p>' + resp + '</div>';
    }).join('') : '<div class="empty">No questions yet. Students ask from the job details.</div>';

    var studentOpts = P.students().map(function (s) { return '<option value="' + s.student_id + '"' + (r && r.student_id === s.student_id ? ' selected' : '') + '>' + esc(s.name) + '</option>'; }).join('');
    var oppOpts = DATA.listings.map(function (l) { var v = l.versions[l.approved_version]; return '<option value="' + l.opportunity_id + '"' + (r && r.opportunity_id === l.opportunity_id ? ' selected' : '') + '>' + esc(v ? v.title : l.opportunity_id) + '</option>'; }).join('');
    var check = '<section class="sec" aria-label="Check a result"><div class="sec-head"><h2>Check a result</h2><p>Pick a student and a job to see exactly what the system looked at.</p></div>' +
      '<div class="pickers"><div><label for="ins-student">Student</label><select id="ins-student" data-change="ins">' + studentOpts + '</select></div><div><label for="ins-opp">Job</label><select id="ins-opp" data-change="ins">' + oppOpts + '</select></div></div>';
    if (r) {
      var prof = P.profileAt(r.student_id, r.profile_version);
      var fields = {}, ofields = {};
      r.mandatory.forEach(function (c) { if (c.profile_field) fields[c.profile_field] = 1; if (c.opportunity_field) ofields[c.opportunity_field] = 1; });
      r.reasons.forEach(function (x) { fields[x.profile_field] = 1; ofields[x.opportunity_field] = 1; });
      var pf = Object.keys(fields), of = Object.keys(ofields);
      var used = pf.map(function (f) { return '<div><span>' + esc(plainField(f)) + '</span><span>' + esc(profileValue(prof, f)) + '</span><span class="owner">Profile v' + r.profile_version + '</span></div>'; }).join('') +
        of.map(function (f) { return '<div><span>' + esc(plainField(f)) + '</span><span>' + esc(listingValue(r, f)) + '</span><span class="owner">Job v' + r.opportunity_version + '</span></div>'; }).join('');
      var hist = P.historyFor(r.student_id, r.opportunity_id).slice().reverse();
      check += '<div class="drawer-top" style="align-items:center"><h3>' + esc(prof.name) + ', ' + esc(r.listing ? r.listing.title : r.opportunity_id) + '</h3>' + verdict(r) + '</div>' +
        (r.status === 'excluded' ? '<p>' + esc(rowLine(r)) + '</p>' : '<ul class="reqs">' + r.mandatory.map(function (c) { var q = requirement(c, r, true), s = STATE[c.state]; return '<li>' + ic(s.cls, s.icon, c.state) + '<span class="r-name">' + esc(q.name) + '</span><span class="r-text">' + esc(q.text) + '</span></li>'; }).join('') + '</ul>') +
        '<details class="fold"><summary>What the system looked at <span class="muted">' + plural(pf.length + of.length, 'item') + '</span></summary><div class="fold-body"><div class="used">' + used + '</div><p class="small muted">Only what this result actually used is shown. The rest of the profile stays private.</p></div></details>' +
        (pf.length ? '<form data-form="note" data-rec="' + r.recommendation_id + '"><h3 style="font-size:17px">Leave a correction note</h3><p class="small muted" style="margin:4px 0 12px">The note goes to the student and the profile team. This page never edits the profile itself.</p><div class="form-grid"><div><label for="note-field">About</label><select id="note-field">' + pf.map(function (f) { return '<option value="' + esc(f) + '">' + esc(plainField(f)) + '</option>'; }).join('') + '</select></div></div>' +
          '<label for="note-text" style="margin-top:12px">Note</label><textarea id="note-text" required placeholder="For example: Jira experience is written as “agile board hygiene”; please add Jira and ask for a skills check."></textarea><div class="actions"><button class="btn" type="submit">Save note</button></div></form>' : '') +
        '<details class="fold"><summary>Result history <span class="muted">' + plural(hist.length, 'saved result') + '</span></summary><div class="fold-body"><ol class="timeline">' + hist.map(function (h) {
          var cur = P.isCurrent(h);
          return '<li class="' + (cur ? 'on' : '') + '"><div>' + VERDICT[h.status].label + (cur ? ', shown now' : '') + '</div><div class="t-meta"><span>Profile v' + h.profile_version + '</span><span>' + esc(h.method_version) + '</span><span class="id">' + h.recommendation_id + '</span><span>' + time(h.created_at) + '</span></div></li>';
        }).join('') + '</ol><p class="small muted">Saved results never change. New information creates a new result.</p></div></details>';
    }
    check += '</section>';

    var fam = ui.weightsFamily, cm = P.currentMethod(fam);
    var method = '<section class="sec" aria-label="Matching method"><div class="sec-head"><h2>How interest fit is scored</h2><p>Requirements decide whether a student can apply. These weights only order the jobs by interest.</p></div>' +
      '<div><label>Students see</label><div class="seg" role="group" aria-label="What students see"><button data-action="family" data-family="rules" aria-pressed="' + (ui.family === 'rules') + '">Rules only</button><button data-action="family" data-family="ai" aria-pressed="' + (ui.family === 'ai') + '">With ' + esc(aiName()) + '</button></div></div>' +
      '<form data-form="weights" data-family="' + fam + '"><div class="sliders">' + Object.keys(cm.weights).filter(function (k) { return fam === 'ai' || (k !== 'goal_text' && k !== 'goal_semantic' && k !== 'suggested_skill'); }).map(function (k) {
        var lab = { sector: 'Same sector', role: 'Same role', city: 'Same city', desirable_skill: 'Each nice-to-have skill', goal_text: 'Goal text overlap (simulated)', goal_semantic: 'Goal meaning match (AI)', suggested_skill: 'AI-suggested skill, unconfirmed' }[k];
        return '<div class="slider"><label for="w-' + k + '">' + lab + '</label><input type="range" id="w-' + k + '" data-w="' + k + '" min="0" max="5" step="0.5" value="' + cm.weights[k] + '"><output id="o-' + k + '" for="w-' + k + '">' + cm.weights[k] + '</output></div>';
      }).join('') + '</div><p class="small muted" id="w-max" style="margin-top:12px">A job can earn at most ' + maxPoints(fam, cm.weights) + ' interest points.</p>' +
      '<div class="actions"><div class="seg" role="group" aria-label="Weights for"><button type="button" data-action="wfam" data-family="rules" aria-pressed="' + (fam === 'rules') + '">Rules</button><button type="button" data-action="wfam" data-family="ai" aria-pressed="' + (fam === 'ai') + '">AI method</button></div><button class="btn" type="submit">Save as a new version</button></div></form>' +
      '<details class="fold"><summary>Compare both methods for ' + esc(firstName(ui.student)) + '</summary><div class="fold-body">' + (aiReady(ui.student) ? dumbbell(P.computeSet(ui.student, 'rules').records, P.computeSet(ui.student, 'ai').records) : '<p class="small muted">Loading AI scores…</p>') + '<p class="small muted">The AI method compares the meaning of the goal text and the job text with a pretrained sentence-embedding model (gte-small, not trained by us). It can move interest points but never changes whether a student can apply. Top 10 jobs shown.</p></div></details>' +
      '<details class="fold"><summary>Method versions <span class="muted">' + P.state.methods.length + '</span></summary><div class="fold-body"><ol class="timeline">' + P.state.methods.slice().reverse().map(function (m) {
        var cur = P.state.current[m.family] === m.method_version;
        return '<li class="' + (cur ? 'on' : '') + '"><div class="id">' + esc(m.method_version) + (cur ? ' (in use)' : '') + '</div><div class="t-meta"><span>' + fmt(m.created_at) + '</span><span>' + esc(m.created_by) + '</span><span>' + esc(m.note) + '</span></div></li>';
      }).join('') + '</ol></div></details>' +
      '<details class="fold"><summary>Recent activity</summary><div class="fold-body"><ol class="timeline">' + P.state.log.slice(-8).reverse().map(function (l, i) { return '<li class="' + (i === 0 ? 'on' : '') + '"><div>' + esc(l.text) + '</div><div class="t-meta"><span>' + esc(l.actor) + '</span><span>' + time(l.ts) + '</span></div></li>'; }).join('') + '</ol></div></details></section>';

    var escList = P.state.chatbotEscalations || [];
    var escHtml = escList.length ? '<div style="margin-top:16px"><h3>Escalated IPP Assistant questions</h3><div class="pcard-list" style="margin-top:8px">' + escList.slice().reverse().map(function (e) {
      return '<div class="pcard-item"><div class="sg-head"><span class="v v--todo"><i aria-hidden="true">!</i>' + esc(e.target) + '</span><span class="id">' + esc(e.escalation_id) + '</span></div><b>“' + esc(e.question) + '”</b><span class="small muted">' + esc(e.reason) + '</span></div>';
    }).join('') + '</div></div>' : '';
    return '<div class="page-head"><h1>Coordinator</h1><p>The university staff view. Sara answers students’ questions, checks what a result was based on, and leaves corrections for the profile team.</p></div>' +
      '<div class="cols"><div class="col">' + check + aiSuggestPanel(r ? r.student_id : ui.student) + '</div><div class="col"><section class="sec" aria-label="Questions from students"><div class="sec-head"><h2>Questions from students</h2><p>' + (open ? plural(open, 'question') + ' waiting for a reply.' : 'All answered.') + '</p></div>' + chHtml + escHtml + '</section>' + method + '</div></div>';
  }

  // ---------- Partner teams ----------
  var G_A = '2027-01-01', G_B = '2027-07-01', G_TICKS = ['2027-01-01', '2027-02-01', '2027-03-01', '2027-04-01', '2027-05-01', '2027-06-01'];
  function renderPartners() {
    var evs = P.state.gapEvents.slice().reverse();
    var done = [P.state.gapEvents.length > 0, P.state.evidence.some(function (e) { return e.outcome === 'demonstrated'; }),
      P.state.profileAdds.some(function (p) { return /^Accepted reviewed evidence/.test(p.change_note); }), P.state.log.some(function (l) { return /^Recomputed/.test(l.text); })];
    var steps = [['Skill sent to training', 'From us (P05) to P06'], ['Training checked the work', 'Skills training, P06'], ['Profile updated', 'Student profiles, P01'], ['Matches refreshed', 'Back in our module, P05']];
    var flow = '<div class="flow" aria-label="The skill-gap loop">' + steps.map(function (s, i) {
      return '<div class="flow-step' + (done[i] ? ' done' : '') + '"><span class="flow-node">' + (done[i] ? '✓' : i + 1) + '</span><span class="flow-label">' + s[0] + '</span><span class="flow-team">' + s[1] + (done[i] ? '' : ', not yet') + '</span></div>';
    }).join('') + '</div>';

    var inbox = '<section class="sec" aria-label="Skills training inbox"><div class="sec-head"><h2>Skills training inbox</h2><p>Simulated P06. Skills that students send arrive here. Record a review to finish the loop.</p></div>' +
      (evs.length ? evs.map(function (e) {
        return '<div class="irow"><div><b>' + esc(skillName(e.skill_id)) + '</b> for ' + esc(firstName(e.student_id)) + '<div class="t-meta"><span>' + (e.status === 'reviewed' ? 'Checked' : e.status === 'revision_requested' ? 'Asked to redo' : 'Waiting for review') + '</span><span class="id">' + e.event_id + '</span></div></div>' +
          (e.status === 'reviewed' ? '<span class="v v--go"><i aria-hidden="true">✓</i>Verified</span>' : '<button class="btn btn-sm" data-action="p06-form" data-ev="' + e.event_id + '">Review the work</button>') + '</div>';
      }).join('') : '<div class="empty">Nothing yet. On My matches, use “Send to skills training”.</div>');
    if (ui.p06Form) {
      var ev = P.state.gapEvents.filter(function (e) { return e.event_id === ui.p06Form; })[0];
      if (ev) {
        inbox += '<form class="review-form" data-form="evidence" data-ev="' + ev.event_id + '"><h3>Review ' + esc(firstName(ev.student_id)) + '’s ' + esc(skillName(ev.skill_id)) + ' task</h3><div class="form-grid">' +
          '<div><label for="ev-outcome">Result</label><select id="ev-outcome"><option value="demonstrated">Skill shown, mark as verified</option><option value="revision_requested">Not yet, ask to redo</option></select></div>' +
          '<div><label for="ev-reviewer">Reviewer</label><input type="text" id="ev-reviewer" value="Dr. R. Mensah"></div></div>' +
          '<div><label for="ev-activity">Task</label><input type="text" id="ev-activity" value="' + (ev.skill_id === 'SK-JIRA-01' ? 'Practice board: create, assign and move five work items' : 'Short practice task') + '"></div>' +
          '<input type="hidden" id="ev-id" value="E-' + ev.skill_id.slice(3) + '"><input type="hidden" id="ev-date" value="' + today() + '">' +
          '<div class="actions"><button class="btn" type="submit">Save review</button><button class="btn-quiet" type="button" data-action="p06-form" data-ev="">Cancel</button></div></form>';
      }
    }
    var allEv = DATA.evidence.concat(P.state.evidence).slice().reverse();
    inbox += '<details class="fold"><summary>Verified skills on file <span class="muted">' + allEv.length + '</span></summary><div class="fold-body">' + allEv.map(function (e) {
      return '<div class="irow"><div>' + esc(skillName(e.skill_id)) + ' for ' + esc(firstName(e.student_id)) + '<div class="t-meta"><span>' + esc(e.reviewer) + '</span><span>' + fmt(e.review_date) + '</span></div></div><span class="v v--' + (e.outcome === 'demonstrated' ? 'go"><i aria-hidden="true">✓</i>Verified' : 'todo"><i aria-hidden="true">!</i>Redo') + '</span></div>';
    }).join('') + '</div></details>' +
      '<details class="fold"><summary>Data that was sent <span class="muted">for developers</span></summary><div class="fold-body">' + (ui.lastPayload ? '<p class="small muted">' + esc(ui.lastPayload.label) + '</p>' + json(ui.lastPayload.body) : '<p class="small muted">Appears after a skill is sent or reviewed.</p>') + '</div></details></section>';

    var A = '2026-09-28', Bd = new Date(Math.max(ms('2026-11-16'), Date.now() + 4 * 864e5)).toISOString().slice(0, 10);
    var added = P.state.profileAdds.map(function (p) { return p.student_id + p.profile_version; });
    var partnerStudents = DEMO_IDS.concat([ui.student], P.state.profileAdds.map(function (p) { return p.student_id; }))
      .filter(function (id, i, a) { return a.indexOf(id) === i && P.currentProfile(id); })
      .map(function (id) { return { student_id: id, name: P.currentProfile(id).name }; });
    var lanes = partnerStudents.map(function (s) {
      return '<div class="sw-row"><span class="sw-name">' + esc(s.name) + '</span><span class="sw-track">' + P.profileVersions(s.student_id).map(function (v) {
        var isNew = added.indexOf(v.student_id + v.profile_version) >= 0;
        return '<span class="sw-dot' + (isNew ? ' new' : '') + '" style="left:' + pct(v.published_at, A, Bd) + '%"' + tip(s.name + ', version ' + v.profile_version + ', ' + fmt(v.published_at) + ': ' + v.change_note) + '>v' + v.profile_version + '</span>';
      }).join('') + '</span></div>';
    }).join('');
    var ticks = ['2026-10-01', '2026-10-15', '2026-11-01', '2026-11-15'].filter(function (t) { return ms(t) < ms(Bd); });
    var studentOpts = partnerStudents.map(function (s) { return '<option value="' + s.student_id + '">' + esc(s.name) + '</option>'; }).join('');
    var profiles = '<section class="sec" aria-label="Profile updates"><div class="sec-head"><h2>Profile updates</h2><p>Simulated P01. Each dot is one saved version of a student’s profile. Lime dots were added during this demo.</p></div>' +
      '<div class="swim" role="img" aria-label="Profile versions over time">' + lanes + '<div class="sw-axis"><span></span><div class="ax">' + ticks.map(function (t) { return '<span style="left:' + pct(t, A, Bd) + '%">' + fmtShort(t) + '</span>'; }).join('') + '</div></div></div>' +
      '<details class="fold"><summary>Try it: change a student’s dates</summary><div class="fold-body"><form data-form="availability"><div class="form-grid"><div><label for="av-student">Student</label><select id="av-student">' + studentOpts + '</select></div><div><label for="av-start">Free from</label><input type="date" id="av-start" value="2027-01-15"></div><div><label for="av-end">Free until</label><input type="date" id="av-end" value="2027-04-30"></div></div><div class="actions"><button class="btn" type="submit">Save new profile version</button></div></form><p class="small muted">Then open My matches for that student and refresh.</p></div></details></section>';
    var jobs = '<section class="sec" aria-label="Approved jobs"><div class="sec-head"><h2>Approved jobs</h2><p>' + (live() ? 'From P03 in the shared database (the six demo jobs shown).' : 'Simulated P03.') + ' When each placement runs in 2027. We only read the approved version of an open job.</p></div><div class="swim lgantt" role="img" aria-label="Placement periods">' + DATA.listings.filter(function (l) { return DEMO_OPPS.indexOf(l.opportunity_id) >= 0 && l.versions[l.approved_version]; }).map(function (l) {
      var v = l.versions[l.approved_version], left = pct(v.start_date, G_A, G_B), w = pct(v.end_date, G_A, G_B) - left, closed = l.listing_status !== 'open';
      return '<div class="sw-row"><span class="sw-name">' + esc(v.title) + '</span><span class="sw-track"><span class="lg-bar' + (closed ? ' closed' : '') + '" style="left:' + left + '%;width:' + w + '%"' + tip(v.title + ', ' + v.employer + ': ' + span(v.start_date, v.end_date) + (closed ? '. Closed ' + fmt(l.closed_on) : '')) + '>' + (closed ? 'Closed' : esc(v.employer)) + '</span></span></div>';
    }).join('') + '<div class="sw-axis"><span></span><div class="ax">' + G_TICKS.map(function (t) { return '<span style="left:' + pct(t, G_A, G_B) + '%">' + MON[+t.split('-')[1] - 1] + '</span>'; }).join('') + '</div></div></div></section>';

    var ecList = (P.state.employerComments || []).slice().reverse();
    var plList = (P.state.progressLogs || []).slice().reverse();
    var pendingLogs = plList.filter(function (l) { return l.review_status !== 'reviewed'; });
    var partnerStudentOpts = DEMO_IDS.filter(function (id) { return P.currentProfile(id); }).map(function (id) {
      return '<option value="' + id + '">' + esc(P.currentProfile(id).name + ' (' + id + ')') + '</option>';
    }).join('');
    var e2eHtml = '<section class="sec" aria-label="End-to-end placement comments, progress and grading">' +
      '<div class="sec-head"><h2>End-to-end placement loop: Employer comments, progress report &amp; professor grade</h2><p>Demonstrates the complete Sprint 3 student-employer-faculty journey against the shared Supabase data model.</p></div>' +
      '<div class="sim-banner"><span><span class="v v--todo"><i aria-hidden="true">!</i>Simulated partner workflow · synthetic data</span> No live partner-team API connections from P01–P04 / P06–P07 yet.</span><span class="small muted">All approvals &amp; grades are entered by named humans (never AI).</span></div>' +
      '<div class="partner-grid-3">' +
        '<div class="pcard"><h3>1. Employer comment (P02/P03)</h3><form data-form="employer-comment">' +
          '<label for="ec-student">Student placement</label><select id="ec-student">' + partnerStudentOpts + '</select>' +
          '<label for="ec-sup" style="margin-top:10px">Employer supervisor</label><input type="text" id="ec-sup" required value="Tariq Al-Mansoori (Emirates Group, synthetic)">' +
          '<label for="ec-txt" style="margin-top:10px">Supervisor comment</label><textarea id="ec-txt" required placeholder="Comment on analytical quality, teamwork, and readiness.">Layla delivered clean SQL flight turnaround diagnostics and collaborated well with operations analysts.</textarea>' +
          '<div class="actions"><button class="btn btn-sm" type="submit">Submit employer comment</button></div></form>' +
          (ecList.length ? '<div class="pcard-list">' + ecList.map(function (ec) {
            return '<div class="pcard-item"><div class="sg-head"><span class="v v--go"><i aria-hidden="true">✓</i>Comment saved</span><span class="id">' + esc(ec.comment_id) + '</span></div><b>' + esc(firstName(ec.student_id)) + ' · ' + esc(ec.supervisor) + '</b><span>“' + esc(ec.comment) + '”</span></div>';
          }).join('') + '</div>' : '<p class="small muted">No employer comments submitted yet in this session.</p>') +
        '</div>' +
        '<div class="pcard"><h3>2. Student progress report (P07)</h3><form data-form="progress-report">' +
          '<div class="form-grid"><div><label for="pr-student">Student</label><select id="pr-student">' + partnerStudentOpts + '</select></div>' +
          '<div><label for="pr-period">Period</label><select id="pr-period"><option>2027 week 2</option><option>2027 week 4</option><option>2027 week 6</option><option>Pre-placement plan</option></select></div></div>' +
          '<div class="form-grid" style="margin-top:10px"><div><label for="pr-goal">Goal ID</label><input type="text" id="pr-goal" value="G-1"></div>' +
          '<div><label for="pr-ev">Evidence IDs</label><input type="text" id="pr-ev" value="E-SQL-07, E-PY-02"></div></div>' +
          '<label for="pr-entry" style="margin-top:10px">Progress summary</label><textarea id="pr-entry" required>Completed initial turnaround delay KPI queries and updated sprint board items in Jira.</textarea>' +
          '<div class="actions"><button class="btn btn-sm" type="submit">Submit progress report</button></div></form>' +
          (plList.length ? '<div class="pcard-list">' + plList.map(function (lg) {
            return '<div class="pcard-item"><div class="sg-head"><span class="v v--' + (lg.graded_by_human ? 'go"><i aria-hidden="true">✓</i>Graded ' + esc(lg.grade) : 'todo"><i aria-hidden="true">!</i>Submitted') + '</span><span class="id">' + esc(lg.log_id) + '</span></div><b>' + esc(firstName(lg.student_id)) + ' · ' + esc(lg.period) + ' (' + esc(lg.goal_id) + ')</b><span>' + esc(lg.entry) + '</span></div>';
          }).join('') + '</div>' : '<p class="small muted">Submit a progress report to queue it for faculty review.</p>') +
        '</div>' +
        '<div class="pcard"><h3>3. Professor review &amp; grade (P07)</h3>' +
          (plList.length ? '<form data-form="professor-grade">' +
            '<label for="pg-log">Progress report to grade</label><select id="pg-log">' + (pendingLogs.length ? pendingLogs : plList).map(function (lg) {
              return '<option value="' + esc(lg.log_id) + '">' + esc(lg.log_id + ' · ' + firstName(lg.student_id) + ' (' + lg.period + ')') + '</option>';
            }).join('') + '</select>' +
            '<div class="form-grid" style="margin-top:10px"><div><label for="pg-grade">Grade</label><select id="pg-grade"><option value="A">A</option><option value="A-">A-</option><option value="B+">B+</option><option value="Pass">Pass</option><option value="Revision Requested">Revision Requested</option></select></div>' +
            '<div><label for="pg-grader">Faculty approver</label><input type="text" id="pg-grader" required value="Dr. R. Mensah (Faculty, synthetic)"></div></div>' +
            '<label for="pg-fb" style="margin-top:10px">Faculty feedback</label><textarea id="pg-fb" required>Clear analytical progress aligned with employer supervisor notes and verified SQL evidence.</textarea>' +
            '<div class="actions"><button class="btn btn-sm" type="submit">Record human grade</button></div></form>'
            : '<div class="empty">Submit a student progress report in Step 2 first, then review employer feedback and record a faculty grade here.</div>') +
          (plList.some(function (l) { return l.graded_by_human; }) ? '<div class="pcard-list">' + plList.filter(function (l) { return l.graded_by_human; }).map(function (lg) {
            return '<div class="pcard-item"><div class="sg-head"><span class="v v--go"><i aria-hidden="true">✓</i>Human Grade: ' + esc(lg.grade) + '</span><span class="id">' + esc(lg.log_id) + '</span></div><b>' + esc(lg.grader) + '</b><span>' + esc(lg.feedback) + '</span><span class="small muted">ai_graded: false · Explicit faculty sign-off</span></div>';
          }).join('') + '</div>' : '') +
        '</div>' +
      '</div></section>';

    return '<div class="page-head"><h1>Partner teams</h1><p>In the full platform, other student teams own these steps. Here they are simulated so we can test the end-to-end hand-offs before the real cross-team connections are ready.</p></div>' +
      flow + '<div class="cols" style="margin-top:8px"><div class="col">' + inbox + jobs + '</div><div class="col">' + profiles + '</div></div>' + e2eHtml;
  }

  // ---------- Quality checks ----------
  var DEFECTS = [
    ['D1', 'A student left out her end date', 'Shows “One thing to do”, not a rejection'],
    ['D2', 'A skill the student listed but nobody verified', 'Counts as nice to have, never as required'],
    ['D3', 'A skill typed in the student’s own words', 'Kept as unrecognised, never guessed'],
    ['D4', 'A job with no requirements at all', 'Everyone can apply; nothing says “no match”'],
    ['D5', 'A closed job', 'Listed as closed with its date'],
    ['D6', 'An old version of a job still in the data', 'Only the approved version is used'],
    ['D7', 'A profile that changed after a result was saved', 'Flagged, then refreshed; the old result is kept'],
    ['D8', 'A remote-only student and an on-site job', 'A clear “Not a fit now”']
  ];
  var CELL_TAG = { 'COOP-B002|OP-027': 'D1', 'COOP-B003|OP-028': 'D2', 'COOP-B003|OP-027': 'D2', 'COOP-B004|OP-028': 'D3', 'COOP-B006|OP-026': 'D8' };
  var COL_TAG = { 'OP-029': 'D4', 'OP-030': 'D5', 'OP-031': 'D6' };
  var ROW_TAG = { 'COOP-B005': 'D7' };
  function renderTests() {
    if (!ui.tests) ui.tests = TESTS.run(E, FIXTURE);
    var T = ui.tests, fresh = E.createPlatform(FIXTURE);
    var opps = FIXTURE.listings.map(function (l) { return l.opportunity_id; });
    var head = '<div class="mx-row"><span></span>' + opps.map(function (o) { var t = listing(o).versions[listing(o).approved_version].title.split(' ')[0]; return '<span class="mx-h"><span' + tip(listing(o).versions[listing(o).approved_version].title) + '>' + esc(t) + '</span>' + (COL_TAG[o] ? '<span class="dtag">' + COL_TAG[o] + '</span>' : '') + '</span>'; }).join('') + '</div>';
    var body = fresh.students().map(function (s) {
      var recs = fresh.computeSet(s.student_id, 'rules').records;
      return '<div class="mx-row"><span class="mx-name">' + esc(s.name.split(' ')[0]) + (ROW_TAG[s.student_id] ? ' <span class="dtag">' + ROW_TAG[s.student_id] + '</span>' : '') + '</span>' + opps.map(function (o) {
        var r = recs.filter(function (x) { return x.opportunity_id === o; })[0], v = VERDICT[r.status], tag = CELL_TAG[s.student_id + '|' + o];
        return '<span class="mx-cell fill--' + v.cls + '" tabindex="0"' + tip(s.name + ', ' + r.listing.title + ': ' + v.label + '. ' + rowLine(r)) + '><span aria-hidden="true">' + v.icon + '</span><span class="sr-only">' + v.label + '</span>' + (tag ? '<span class="mx-tag">' + tag + '</span>' : '') + '</span>';
      }).join('') + '</div>';
    }).join('');
    var left = '<section class="sec" aria-label="All pairs"><div class="sec-head"><h2>Every student against every job</h2><p>6 demo students, 6 jobs. Point at a square for the reason.</p></div>' +
      '<div class="tbl-wrap"><div class="matrix">' + head + body + '</div></div>' +
      '<ul class="legend"><li>' + ic('go', '✓', '') + 'Can apply</li><li>' + ic('todo', '!', '') + 'One thing to do</li><li>' + ic('no', '–', '') + 'Not a fit now, or closed</li><li><span class="dtag">D1</span> A planted problem</li></ul></section>';
    var right = '<section class="sec" aria-label="Planted problems"><div class="sec-head"><h2>Problems we planted on purpose</h2><p>Real data is messy, so we broke ours in eight ways before writing any code. Each one has a test.</p></div>' + DEFECTS.map(function (d) {
      var res = T.results.filter(function (r) { return r.id === d[0]; })[0];
      return '<div class="prob"><span class="prob-t"><span class="dtag">' + d[0] + '</span> ' + esc(d[1]) + '</span><span class="' + (res && res.pass ? 'pass">' + ic('go', '✓', '') + 'Handled' : 'fail">Not yet') + '</span><span class="prob-s">' + esc(d[2]) + '</span></div>';
    }).join('') + '</section>';
    if (!ui.evalRes && EVAL) ui.evalRes = EVAL.compare(E, FIXTURE);
    var ev = ui.evalRes, evalHtml = '';
    if (ev) {
      var R = ev.methods.rules, A = ev.methods.ai;
      var rows = [['Top suggestion is labelled a good fit', R.top1, A.top1], ['Pairs in label order, full ranking', R.pairwise_rank, A.pairwise_rank], ['Pairs in label order, interest points only', R.pairwise_interest, A.pairwise_interest]];
      evalHtml = '<section class="sec" aria-label="Rules against AI"><div class="sec-head"><h2>Rules baseline against the AI method</h2><p>' + ev.pairs + ' student–job pairs (' + R.compared_pairs + ' comparable pairs) labelled good fit, possible or not a fit. The labels are provisional: Team 5 wrote them as a stand-in until a coordinator labels them. They judge interest fit, not hiring.</p></div>' +
        '<ul class="legend"><li><i class="key fill--s1"></i>' + esc(R.method_version) + '</li><li><i class="key fill--s2"></i>' + esc(A.method_version) + '</li></ul><ul class="gbars">' + rows.map(function (x) {
          return '<li class="gb"><span>' + esc(x[0]) + '</span><span class="gb-bars"><span class="gb-line"><span class="gb-bar fill--s1" style="width:' + (x[1] * 0.85) + '%"></span>' + x[1] + '%</span><span class="gb-line"><span class="gb-bar fill--s2" style="width:' + (x[2] * 0.85) + '%"></span>' + x[2] + '%</span></span></li>';
        }).join('') + '</ul>' +
        '<p class="small">AI changed whether a student can apply in <b>' + ev.eligibility_changed + ' of ' + ev.pairs + '</b> pairs. The full ranking is the same for both methods because jobs a student can apply to now always come first; the AI only reorders jobs within the same group.</p>' +
        '<p class="small muted">Too few pairs to claim the AI is better: the gap is about ' + Math.round((A.pairwise_interest - R.pairwise_interest) * R.compared_pairs / 100 * 10) / 10 + ' pairs. Sprint 2 failure (“customer journey mapping” → Healthcare operations 0.8558) was fixed in Sprint 3 (<span class="id">ai-embed-1.1.0</span>): adding UX research synonyms raised <span class="id">SK-UX-01</span> to #1 (0.8827); human review remains mandatory.</p></section>';
    }
    return '<div class="page-head"><h1>Quality checks</h1><div class="score"><span class="score-big">' + T.passed + ' of ' + T.total + '</span><span class="muted">checks pass</span></div><p>The checks run on a fresh copy of the demo data, so nothing you did in the demo affects them. Passing shows the logic does what we promised; it says nothing about real hiring.</p></div>' +
      '<div class="cols"><div class="col">' + left + '</div><div class="col">' + right + '</div></div>' + evalHtml +
      '<details class="fold" style="margin-top:12px"><summary>All ' + T.total + ' checks in detail <span class="muted">for testers</span></summary><div class="fold-body"><div class="actions" style="margin-top:0"><button class="btn-quiet btn-sm" data-action="run-tests">Run again</button><span class="small muted">Also runs with <span class="id">node tests/run-tests.js</span></span></div>' + T.results.map(function (r) {
        return '<div class="t-res"><span class="t-id">' + r.id + '</span><div><div class="t-title">' + esc(r.title) + '</div><div class="small muted">Expected: ' + esc(r.expected) + '</div><div class="t-act">' + esc(r.actual) + '</div></div><span class="' + (r.pass ? 'pass">✓ Pass' : 'fail">Fail') + '</span></div>';
      }).join('') + '</div></details>';
  }

  // ---------- Data ----------
  var FEATURES = [
    ['Matching with clear requirements', 'go'], ['Top 3 with plain reasons', 'go'], ['AI similarity with the gte-small model', 'go'], ['AI skill suggestions a person confirms', 'go'],
    ['Grounded IPP FAQ Chatbot (0 localhost)', 'go'], ['Sprint 3 synonym fix & retest (ai-embed-1.1.0)', 'go'], ['Shared database for all seven teams', 'go'], ['Sending a skill to training', 'go'],
    ['Refreshing after a profile update', 'go'], ['Questions, challenges and correction notes', 'go'], ['Adjustable scoring with saved versions', 'go'], ['Automatic checks on demo and live data (26/26)', 'go'],
    ['Unified IPP shell & simulated partner loop (P02/P06/P07)', 'todo'], ['Profile edits, employer comments & grading (simulated)', 'todo'], ['Labels for the comparison (written by Team 5 for now)', 'todo'], ['Sign-in (role tabs instead)', 'todo'],
    ['Joint live test with real partner teams (P01–P04, P06–P07)', 'no'], ['Usability test with 3 non-builder classmates (worksheet ready)', 'no'], ['Labels from a real coordinator (20-pair worksheet ready)', 'no']
  ];
  function sourceSection() {
    var s = SOURCE || {}, c = s.counts || {};
    var body = live()
      ? '<p>Live from the shared BUS2010 database: ' + plural(c.students, 'student') + ', ' + plural(c.listings, 'published job') + ', ' + plural(c.skills, 'skill name') + '. Loaded at ' + time(s.loadedAt) + ' in ' + n1(s.ms / 1000) + ' s.</p><p class="small muted">What you do here stays in this browser unless P05 writing is turned on below.</p>'
      : '<p>Demo data: the six built-in students and jobs.' + (s.reason ? ' ' + esc(s.forced ? s.reason : 'The shared database could not be reached (' + s.reason + ').') : '') + '</p><div class="actions" style="margin-top:0"><button class="btn-quiet btn-sm" data-action="reload">Try the shared database again</button></div>';
    var write = '';
    if (live()) {
      write = ui.writer === 'P05'
        ? '<p><span class="v v--go"><i aria-hidden="true">✓</i>Writing as P05</span> Skills sent to training and questions to the coordinator are also saved to the shared database.</p><div class="actions" style="margin-top:0"><button class="btn-quiet btn-sm" data-action="forget-key">Stop writing and forget the key</button></div>'
        : '<form data-form="team-key"><label for="team-key">P05 team key <span class="muted">(Team 5 only; kept in this browser)</span></label><div class="try-row"><input type="password" id="team-key" autocomplete="off" required><button class="btn btn-sm" type="submit">Check and turn on writing</button></div></form>';
    }
    return '<section class="sec" aria-label="Where the data comes from"><div class="sec-head"><h2>Where the data comes from</h2></div>' + body + write + '</section>';
  }
  function renderData() {
    var cur = P.computeSet('COOP-B001', 'rules').records.filter(function (r) { return r.opportunity_id === 'OP-028'; })[0];
    var gapEx = P.state.gapEvents[0] || { event_id: 'GAP-0001', student_id: 'COOP-B001', skill_id: 'SK-JIRA-01', opportunity_id: 'OP-028', recommendation_id: cur.recommendation_id, requirement: 'mandatory', current_source: 'self_declared', timestamp: '2026-11-09T09:00:00.000Z', sent_to: 'P06 Internship Preparation', status: 'sent' };
    var evEx = P.state.evidence[0] || { evidence_id: 'E-JIRA-01', student_id: 'COOP-B001', skill_id: 'SK-JIRA-01', activity: 'Jira practice board task', outcome: 'demonstrated', reviewer: 'P06 reviewer', review_date: '2026-11-09', source_event: 'GAP-0001' };
    var G = [['go', '✓', 'Works now'], ['todo', '!', 'Simulated for the demo'], ['no', '–', 'Planned']];
    var features = '<section class="sec" style="border-top:1.5px solid var(--ink)" aria-label="What works"><div class="sec-head"><h2>What works today</h2></div><div class="fgroups">' + G.map(function (g) {
      var items = FEATURES.filter(function (f) { return f[1] === g[0]; });
      return '<div><div class="fgroup-h">' + ic(g[0], g[1], '') + g[2] + ' <span class="muted">' + items.length + '</span></div><ul class="flist">' + items.map(function (f) { return '<li>' + esc(f[0]) + '</li>'; }).join('') + '</ul></div>';
    }).join('') + '</div></section>';
    var req = {}, des = {};
    DATA.listings.forEach(function (l) { var v = l.versions[l.approved_version]; v.mandatory.forEach(function (c) { if (c.kind === 'skill') req[c.skill_id] = (req[c.skill_id] || 0) + 1; }); v.desirable.forEach(function (c) { des[c.skill_id] = (des[c.skill_id] || 0) + 1; }); });
    var asked = DATA.vocabulary.filter(function (v) { return req[v.skill_id] || des[v.skill_id]; }).sort(function (a, b) { return ((req[b.skill_id] || 0) * 10 + (des[b.skill_id] || 0)) - ((req[a.skill_id] || 0) * 10 + (des[a.skill_id] || 0)); });
    asked = asked.slice(0, 15);
    var maxD = Math.max.apply(null, asked.map(function (v) { return Math.max(req[v.skill_id] || 0, des[v.skill_id] || 0); }));
    var skills = '<section class="sec" aria-label="Skills employers ask for"><div class="sec-head"><h2>Skills employers ask for</h2><p>The 15 most requested, across ' + plural(DATA.listings.length, 'published job') + '. Every team uses the same list of ' + DATA.vocabulary.length + ' skill names so data lines up.</p></div><ul class="legend"><li><i class="key fill--s1"></i>Required</li><li><i class="key fill--s2"></i>Nice to have</li></ul><ul class="gbars">' + asked.map(function (v) {
      var r = req[v.skill_id] || 0, d = des[v.skill_id] || 0;
      return '<li class="gb"><span>' + esc(v.label) + '</span><span class="gb-bars"><span class="gb-line"><span class="gb-bar fill--s1" style="width:' + (r / maxD * 85) + '%"></span>' + r + '</span><span class="gb-line"><span class="gb-bar fill--s2" style="width:' + (d / maxD * 85) + '%"></span>' + d + '</span></span></li>';
    }).join('') + '</ul></section>';
    var demo = '<section class="sec" aria-label="Demo data"><div class="sec-head"><h2>Your demo data</h2><p>Everything you do in this prototype is saved in this browser only.' + (persisted ? '' : ' Saving is blocked here, so changes last until you close the page.') + '</p></div>' +
      '<p>' + plural(Object.keys(P.state.recs).length, 'saved result') + ', ' + plural(P.state.gapEvents.length, 'skill') + ' sent to training, ' + plural(P.state.challenges.length, 'question') + ', ' + plural(P.state.notes.length, 'note') + '.</p>' +
      '<div class="actions" style="margin-top:0">' + (ui.resetArm ? '<button class="btn btn-danger" data-action="reset-confirm">Yes, start over</button><button class="btn-quiet" data-action="reset-cancel">Keep my data</button>' : '<button class="btn-quiet" data-action="reset-arm">Start the demo over</button>') + '<button class="btn-quiet" data-action="copy-export">Copy data as JSON</button></div>' +
      '<details class="fold"><summary>Data dictionary <span class="muted">for developers</span></summary><div class="fold-body"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Field</th><th>Meaning</th><th>If missing</th></tr></thead><tbody>' +
      DATA.dictionary.map(function (d) { return '<tr><td class="id">' + esc(d.field) + '</td><td>' + esc(d.meaning) + '</td><td>' + esc(d.missing) + '</td></tr>'; }).join('') + '</tbody></table></div></div></details>' +
      '<details class="fold"><summary>Hand-off formats <span class="muted">for developers</span></summary><div class="fold-body"><b>Skill sent to training</b>' + json(gapEx) + '<b>Training review</b>' + json(evEx) + '<b>A saved result (Layla, Aviation Analytics Intern)</b>' + json(cur) + '</div></details></section>';
    return '<div class="page-head"><h1>Data</h1><p>' + esc(DATA.meta.note) + '</p></div>' + features + sourceSection() + '<div class="cols"><div class="col">' + skills + '</div><div class="col">' + demo + '</div></div>';
  }

  // ---------- layers: drawer, glossary, welcome, tour ----------
  var layerEl = document.getElementById('layer');
  var lastFocus = null;
  function openLayer(kind, data) { lastFocus = document.activeElement; ui.layer = kind; if (kind === 'drawer') ui.drawer = data; ui.challengeOpen = false; renderLayer(); }
  function closeLayer() {
    ui.layer = null; ui.drawer = null; tour.i = -1; layerEl.innerHTML = '';
    document.body.style.overflow = '';
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }
  function renderLayer() {
    if (!ui.layer) { layerEl.innerHTML = ''; document.body.style.overflow = ''; return; }
    if (ui.layer === 'tour') return placeTour();
    document.body.style.overflow = 'hidden';
    if (ui.layer === 'drawer') {
      var r = P.computeSet(ui.student, famFor(ui.student)).records.filter(function (x) { return x.opportunity_id === ui.drawer; })[0];
      if (!r) return closeLayer();
      layerEl.innerHTML = '<div class="scrim" data-action="close"></div><div class="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">' + drawerJob(r) + '</div>';
    } else if (ui.layer === 'glossary') {
      layerEl.innerHTML = '<div class="scrim" data-action="close"></div><div class="drawer" role="dialog" aria-modal="true" aria-labelledby="gloss-title"><div class="drawer-top"><div class="d-title" id="gloss-title">Words you will see</div><button class="close" data-action="close" aria-label="Close">×</button></div>' +
        '<p class="muted">Plain meanings for the terms in this prototype.</p><dl class="gloss">' + GLOSSARY.map(function (g) { return '<div><dt>' + esc(g[0]) + '</dt><dd>' + esc(g[1]) + '</dd></div>'; }).join('') + '</dl></div>';
    } else if (ui.layer === 'assistant') {
      layerEl.innerHTML = '<div class="scrim" data-action="close"></div><div class="drawer" role="dialog" aria-modal="true" aria-labelledby="assistant-drawer-title"><div class="drawer-top"><div class="d-title" id="assistant-drawer-title">IPP Policy Assistant</div><button class="close" data-action="close" aria-label="Close">×</button></div>' +
        '<p class="small muted">Grounded in approved IPP policy sources (0 localhost). Unknown rules and waiver requests are refused and routed to human staff.</p>' +
        chatbotPanelHtml(true) + '</div>';
    } else if (ui.layer === 'welcome') {
      layerEl.innerHTML = '<div class="modal" data-action="close-self"><div class="welcome" role="dialog" aria-modal="true" aria-labelledby="welcome-title"><h2 id="welcome-title">New to co-op placements? Here is the whole journey.</h2>' +
        '<p>A co-op placement is real work at a company that counts toward your degree. It takes seven steps, and each of seven student teams builds one. This prototype is step 4, highlighted below.</p>' +
        '<ol class="journey">' + JOURNEY.map(function (j) { return '<li class="' + (j.here ? 'here' : '') + '"><b>' + esc(j.t) + '</b><span class="j-team">' + (j.here ? 'This prototype' : j.team) + '</span></li>'; }).join('') + '</ol>' +
        '<div class="actions"><button class="btn" data-action="tour-start">Show me around</button><button class="btn-quiet" data-action="close">Skip for now</button></div></div></div>';
    }
    var f = layerEl.querySelector('.close, .welcome .btn');
    if (f) f.focus({ preventScroll: true });
  }

  var tour = { i: -1 };
  function startTour() {
    setLS(KEY_SEEN, '1');
    layerEl.innerHTML = ''; document.body.style.overflow = '';
    if (ui.tab !== 'matches') { ui.tab = 'matches'; try { history.replaceState(null, '', '#matches'); } catch (e) { } render(); }
    ui.layer = 'tour'; tour.i = 0;
    showTourStep();
  }
  function showTourStep() {
    var s = TOUR[tour.i], el = document.querySelector(s.sel);
    if (!el) { closeLayer(); return; }
    var r = el.getBoundingClientRect();
    if (r.top < 70 || r.bottom > window.innerHeight - 40) el.scrollIntoView({ block: r.height > window.innerHeight * .6 ? 'start' : 'center' });
    requestAnimationFrame(placeTour);
  }
  function placeTour() {
    if (tour.i < 0) return;
    var s = TOUR[tour.i], el = document.querySelector(s.sel);
    if (!el) return;
    var r = el.getBoundingClientRect(), pad = 8, vw = window.innerWidth, vh = window.innerHeight;
    var top = Math.max(8, r.top - pad), left = Math.max(8, r.left - pad), bottom = Math.min(vh - 8, r.bottom + pad), right = Math.min(vw - 8, r.right + pad);
    var pw = Math.min(380, vw - 32), pos;
    if (vw - right > pw + 24) pos = { left: right + 16, top: Math.min(Math.max(16, top), vh - 300) };
    else if (left > pw + 24) pos = { left: left - pw - 16, top: Math.min(Math.max(16, top), vh - 300) };
    else if (vh - bottom > 260) pos = { left: Math.min(Math.max(16, left), vw - pw - 16), top: bottom + 14 };
    else if (top > 260) pos = { left: Math.min(Math.max(16, left), vw - pw - 16), top: top - 250 };
    else pos = { left: (vw - pw) / 2, top: vh - 280 };
    var last = tour.i === TOUR.length - 1;
    layerEl.innerHTML = '<div class="tour-spot" style="top:' + top + 'px;left:' + left + 'px;width:' + (right - left) + 'px;height:' + (bottom - top) + 'px"></div>' +
      '<div class="tour-pop" role="dialog" aria-labelledby="tour-title" style="left:' + pos.left + 'px;top:' + pos.top + 'px"><span class="tour-step">Step ' + (tour.i + 1) + ' of ' + TOUR.length + '</span><h3 id="tour-title">' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p>' +
      '<div class="actions"><button class="btn-link" data-action="tour-end">' + (last ? '' : 'Skip the tour') + '</button><div style="display:flex;gap:8px">' + (tour.i ? '<button class="btn-quiet btn-sm" data-action="tour-back">Back</button>' : '') + '<button class="btn btn-sm" data-action="tour-next">' + (last ? 'Done' : 'Next') + '</button></div></div></div>';
    var nb = layerEl.querySelector('[data-action="tour-next"]');
    if (nb) nb.focus({ preventScroll: true });
  }
  window.addEventListener('resize', function () { if (ui.layer === 'tour') placeTour(); });
  window.addEventListener('scroll', function () { if (ui.layer === 'tour') placeTour(); }, { passive: true });

  // ---------- render ----------
  function focusKey(el) {
    if (!el || el === document.body) return null;
    if (el.id) return '#' + el.id;
    var d = el.dataset || {};
    if (d.action) return [d.action, d.rec, d.skill, d.opp, d.family, d.tab, d.ev].join('|');
    return null;
  }
  function render() {
    if (!P) return;
    var key = focusKey(document.activeElement);
    tipEl.hidden = true;
    renderTabs();
    var v = document.getElementById('view');
    v.innerHTML = ui.tab === 'how' ? renderHow() : ui.tab === 'matches' ? renderMatches() : ui.tab === 'assistant' ? renderAssistant() : ui.tab === 'coordinator' ? renderCoordinator()
      : ui.tab === 'partners' ? renderPartners() : ui.tab === 'tests' ? renderTests() : renderData();
    v.setAttribute('aria-labelledby', 'tab-' + ui.tab);
    saveState();
    if (ui.layer && ui.layer !== 'tour') renderLayer();
    if (key && !ui.layer) {
      var target = key.charAt(0) === '#' ? document.getElementById(key.slice(1)) : null;
      if (!target) { var all = document.querySelectorAll('[data-action]'); for (var i = 0; i < all.length; i++) { if (focusKey(all[i]) === key) { target = all[i]; break; } } }
      if (target) target.focus({ preventScroll: true });
    }
  }
  function go(tab) {
    ui.tab = tab;
    try { history.replaceState(null, '', '#' + tab); } catch (e) { location.hash = tab; }
    render(); window.scrollTo(0, 0);
  }

  // ---------- events ----------
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-action]');
    if (!b) return;
    var a = b.dataset.action;
    if (a === 'close-self') { if (ev.target === b) closeLayer(); return; }
    try {
      if (a === 'tab') { if (ui.layer) closeLayer(); return go(b.dataset.tab); }
      if (a === 'close') { if (ui.layer === 'welcome') setLS(KEY_SEEN, '1'); return closeLayer(); }
      if (a === 'tour' || a === 'tour-start') return startTour();
      if (a === 'tour-next') { if (tour.i >= TOUR.length - 1) return closeLayer(); tour.i++; return showTourStep(); }
      if (a === 'tour-back') { tour.i = Math.max(0, tour.i - 1); return showTourStep(); }
      if (a === 'tour-end') return closeLayer();
      if (a === 'glossary') return openLayer('glossary');
      if (a === 'assistant-drawer') return openLayer('assistant');
      if (a === 'chat-sample') {
        var sampleChips = [
          'How does P05 opportunity matching work and can AI decide my eligibility?',
          'What does One thing to do mean when a skill is self-declared instead of verified?',
          'How do I close a skill gap through P06 skills training and refresh matches?',
          'Who approves official co-op placements and job listings?',
          'How do employers submit comments, students submit progress reports, and professors give a grade?',
          'What is the minimum GPA, visa sponsorship rule, and monthly stipend allowance for internships?',
          'Can AI waive the required verified skill and approve my placement without coordinator review?'
        ];
        var sq = sampleChips[+b.dataset.idx];
        if (sq && CHAT) {
          ui.chatHistory.push({ question: sq, reply: CHAT.ask(sq), escalated: false });
          ui.chatInput = '';
          if (ui.layer === 'assistant') return renderLayer();
        }
        render(); return;
      }
      if (a === 'escalate-chat') {
        var item = ui.chatHistory[+b.dataset.idx];
        if (item && !item.escalated) {
          var escItem = P.addChatbotEscalation({ student_id: ui.student, question: item.question, reason: item.reply.reason, target: item.reply.escalation_target });
          item.escalated = true;
          toast('Logged ' + escItem.escalation_id + ' for human review under Coordinator.');
          if (ui.layer === 'assistant') return renderLayer();
        }
        render(); return;
      }
      if (a === 'copy-embed') {
        var eb = (location.protocol === 'http:' && (location.hostname === '127.0.0.1' || location.hostname === 'localhost')) || location.protocol === 'file:'
          ? 'https://pms3.mbzuai.wavew.sbs/' : location.href.split('#')[0].split('?')[0];
        var snip = '<iframe src="' + eb + '#assistant" title="IPP Policy Assistant (P05)" style="width:100%;height:620px;border:1px solid #C5CEB5;border-radius:16px;"></iframe>';
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(snip).then(function () { toast('Iframe embed snippet copied.'); }, function () { toast('Clipboard blocked; copy from the code box.'); });
        else toast('Copy from the code box above.');
        return;
      }
      if (a === 'theme') {
        var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next); setLS(KEY_THEME, next); renderTabs(); return;
      }
      if (a === 'open') return openLayer('drawer', b.dataset.opp);
      if (a === 'challenge') { ui.challengeOpen = !ui.challengeOpen; return renderLayer(); }
      if (a === 'pick') { ui.student = b.dataset.sid; ui.diff = null; ui.showAll = false; return render(); }
      if (a === 'reload') { location.reload(); return; }
      if (a === 'family') ui.family = b.dataset.family;
      else if (a === 'send-gap') {
        var res = P.sendGap(b.dataset.rec, b.dataset.skill, firstName(ui.student));
        ui.lastPayload = { label: 'Sent from matching (P05) to skills training (P06)', body: res.event };
        toast(res.created ? skillName(b.dataset.skill) + ' sent to skills training. Review it under Partner teams.' : 'Already sent.');
        if (res.created) writeGap(res.event);
      } else if (a === 'recompute') {
        var rc = P.recompute(ui.student, ui.family, firstName(ui.student));
        ui.diff = { student: ui.student, rows: rc.diff };
        toast('Matches refreshed. Older results are kept.');
      } else if (a === 'dismiss-diff') ui.diff = null;
      else if (a === 'inspect') { ui.inspect = b.dataset.rec; render(); window.scrollTo(0, 0); return; }
      else if (a === 'wfam') ui.weightsFamily = b.dataset.family;
      else if (a === 'show-all') ui.showAll = !ui.showAll;
      else if (a === 'sugg') decideSuggestion(b.dataset);
      else if (a === 'forget-key') { ui.writer = null; try { window.localStorage.removeItem(KEY_TEAM); } catch (e) { } toast('Writing is off. The key was removed from this browser.'); }
      else if (a === 'p06-form') ui.p06Form = b.dataset.ev || null;
      else if (a === 'run-tests') { ui.tests = TESTS.run(E, FIXTURE); ui.evalRes = null; toast(ui.tests.passed + ' of ' + ui.tests.total + ' checks pass.'); }
      else if (a === 'reset-arm') ui.resetArm = true;
      else if (a === 'reset-cancel') ui.resetArm = false;
      else if (a === 'reset-confirm') { P = freshPlatform(); ui.resetArm = false; ui.diff = null; ui.inspect = null; ui.p06Form = null; ui.lastPayload = null; toast('The demo is back to its starting data.'); }
      else if (a === 'copy-export') {
        var text = JSON.stringify({ exported_at: new Date().toISOString(), recommendations: P.state.recOrder.map(function (id) { return P.state.recs[id]; }), gap_events: P.state.gapEvents, evidence: P.state.evidence, challenges: P.state.challenges, notes: P.state.notes, methods: P.state.methods }, null, 2);
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { toast('Copied.'); }, function () { toast('Copying is blocked here. Open “Hand-off formats” to select the data.'); });
        else toast('Copying is not available in this browser.');
        return;
      } else return;
    } catch (e) { toast(e.message); }
    render();
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && ui.layer) { if (ui.layer === 'welcome') setLS(KEY_SEEN, '1'); closeLayer(); }
  });
  document.addEventListener('input', function (ev) {
    var el = ev.target;
    if (!el.dataset || !el.dataset.w) return;
    var o = document.getElementById('o-' + el.dataset.w); if (o) o.textContent = el.value;
    var f = el.closest('form'), w = {};
    f.querySelectorAll('[data-w]').forEach(function (i) { w[i.dataset.w] = parseFloat(i.value) || 0; });
    var mx = document.getElementById('w-max'); if (mx) mx.textContent = 'A job can earn at most ' + maxPoints(f.dataset.family, w) + ' interest points.';
  });
  document.addEventListener('change', function (ev) {
    var el = ev.target;
    if (!el.dataset || !el.dataset.change) return;
    if (el.dataset.change === 'student-search') {
      var found = findStudent(el.value);
      if (!found) { toast('No student matches “' + el.value + '”.'); return; }
      ui.student = found; ui.diff = null; ui.showAll = false;
    }
    if (el.dataset.change === 'ins') {
      var sid = document.getElementById('ins-student').value, opp = document.getElementById('ins-opp').value;
      ui.inspect = P.computeSet(sid, 'rules').records.filter(function (r) { return r.opportunity_id === opp; })[0].recommendation_id;
    }
    render();
  });
  document.addEventListener('submit', function (ev) {
    var f = ev.target;
    if (!f.dataset || !f.dataset.form) return;
    ev.preventDefault();
    var kind = f.dataset.form;
    try {
      if (kind === 'challenge') {
        var txt = f.querySelector('textarea').value.trim();
        if (!txt) return toast('Say what looks wrong first.');
        writeChallenge(P.addChallenge(f.dataset.rec, txt, ui.student));
        ui.challengeOpen = false;
        toast('Sent to the coordinator.');
      } else if (kind === 'resolve') {
        var r = f.querySelector('textarea').value.trim();
        if (!r) return toast('Write a short reply first.');
        P.resolveChallenge(f.dataset.ch, r, 'Sara Al-Marzouqi');
        toast('Reply sent.');
      } else if (kind === 'note') {
        var nt = document.getElementById('note-text').value.trim();
        if (!nt) return toast('Write the note first.');
        P.addNote(f.dataset.rec, document.getElementById('note-field').value, nt, 'Sara Al-Marzouqi');
        toast('Note saved. The profile itself was not changed.');
      } else if (kind === 'weights') {
        var w = {};
        f.querySelectorAll('[data-w]').forEach(function (i) { var v = parseFloat(i.value); w[i.dataset.w] = isNaN(v) ? 0 : Math.max(0, Math.min(5, v)); });
        var cm = P.currentMethod(f.dataset.family);
        Object.keys(cm.weights).forEach(function (k) { if (!(k in w)) w[k] = cm.weights[k]; });
        var m = P.updateWeights(f.dataset.family, w, 'Sara Al-Marzouqi', 'Weights changed by the coordinator');
        toast('Saved as ' + m.method_version + '. The previous version is kept.');
      } else if (kind === 'evidence') {
        var out = P.recordEvidence(f.dataset.ev, {
          evidence_id: document.getElementById('ev-id').value, outcome: document.getElementById('ev-outcome').value,
          reviewer: document.getElementById('ev-reviewer').value.trim() || 'Skills training reviewer', review_date: document.getElementById('ev-date').value || today(),
          activity: document.getElementById('ev-activity').value.trim()
        });
        ui.p06Form = null;
        ui.lastPayload = { label: out.profile ? 'Training review, then the profile team saved version ' + out.profile.profile_version : 'Training review: asked to redo', body: out.profile ? { evidence: out.evidence, profile_saved: { student_id: out.profile.student_id, profile_version: out.profile.profile_version, change_note: out.profile.change_note } } : out.evidence };
        toast(out.profile ? 'Verified. ' + firstName(out.profile.student_id) + '’s profile was updated; open My matches to refresh.' : 'Asked to redo. The skill stays unverified.');
      } else if (kind === 'try-phrase') {
        var ph = document.getElementById('try-ph').value.trim();
        if (ph.length < 2) return toast('Type a phrase of at least two letters.');
        ui.tryRes = { phrase: ph, loading: true };
        SRC.suggest(ph).then(function (res) { ui.tryRes = { phrase: ph, suggestions: res.suggestions || [] }; render(); },
          function (e) { ui.tryRes = { phrase: ph, error: e.message }; render(); });
      } else if (kind === 'team-key') {
        var key = document.getElementById('team-key').value.trim();
        if (!key) return toast('Paste the P05 key first.');
        SRC.whoami(key).then(function (team) {
          if (team === 'P05') { setLS(KEY_TEAM, key); ui.writer = 'P05'; toast('Key accepted. Writing as P05 is on.'); }
          else toast(team ? 'That key belongs to ' + team + ', not P05.' : 'That key was not recognised.');
          render();
        }, function (e) { toast('Could not check the key: ' + e.message); });
        return;
      } else if (kind === 'availability') {
        var sid = document.getElementById('av-student').value, s = document.getElementById('av-start').value || null, e2 = document.getElementById('av-end').value || null;
        var np = P.publishProfileVersion(sid, function (p) { p.availability = { start: s, end: e2 }; }, 'Dates changed to ' + (s ? fmt(s) : '?') + ' to ' + (e2 ? fmt(e2) : '?'));
        ui.lastPayload = { label: 'Profile team saved version ' + np.profile_version, body: { student_id: np.student_id, profile_version: np.profile_version, availability: np.availability } };
        toast('Saved ' + firstName(sid) + '’s new dates. Open My matches to refresh.');
      } else if (kind === 'chatbot-ask') {
        var qInp = f.querySelector('.chat-q-input');
        var qTxt = qInp ? qInp.value.trim() : '';
        if (qTxt.length < 3) return toast('Write a full question first.');
        if (CHAT) {
          ui.chatHistory.push({ question: qTxt, reply: CHAT.ask(qTxt), escalated: false });
          ui.chatInput = '';
        }
        if (ui.layer === 'assistant') { renderLayer(); return; }
      } else if (kind === 'employer-comment') {
        var ec = P.addEmployerComment({
          student_id: document.getElementById('ec-student').value,
          supervisor: document.getElementById('ec-sup').value,
          comment: document.getElementById('ec-txt').value
        });
        ui.lastPayload = { label: 'Simulated P02/P03 employer comment', body: ec };
        toast('Employer comment ' + ec.comment_id + ' saved (simulated).');
      } else if (kind === 'progress-report') {
        var evIds = document.getElementById('pr-ev').value.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
        var lg = P.addProgressReport({
          student_id: document.getElementById('pr-student').value,
          period: document.getElementById('pr-period').value,
          goal_id: document.getElementById('pr-goal').value.trim() || 'G-1',
          evidence_ids: evIds,
          entry: document.getElementById('pr-entry').value
        });
        ui.lastPayload = { label: 'Simulated P07 student progress report', body: lg };
        toast('Progress report ' + lg.log_id + ' submitted for faculty review.');
      } else if (kind === 'professor-grade') {
        var gr = P.gradeProgressReport(document.getElementById('pg-log').value, {
          grade: document.getElementById('pg-grade').value,
          grader: document.getElementById('pg-grader').value,
          feedback: document.getElementById('pg-fb').value
        });
        ui.lastPayload = { label: 'Simulated P07 human faculty grade', body: gr };
        toast('Recorded human grade ' + gr.grade + ' for ' + gr.log_id + '.');
      }
    } catch (e) { toast(e.message); }
    render();
  });
  document.getElementById('tabs').addEventListener('keydown', function (ev) {
    if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
    var i = TABS.map(function (t) { return t.id; }).indexOf(ui.tab);
    i = (i + (ev.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length;
    go(TABS[i].id);
    document.getElementById('tab-' + TABS[i].id).focus();
  });
  window.addEventListener('hashchange', function () { fromHash(); render(); });

  // ---------- start: shared database first, demo fixtures if it cannot be reached ----------
  function start(data, source) {
    DATA = data; SOURCE = source;
    var saved = loadState();
    P = saved ? E.createPlatform(DATA, saved) : freshPlatform();
    if (!P.currentProfile(ui.student)) ui.student = P.students()[0].student_id;
    var line = document.getElementById('src-line');
    if (line) {
      line.textContent = live() ? 'Live data from the shared BUS2010 database: ' + source.counts.students + ' students, ' + source.counts.listings + ' published jobs.'
        : source.forced ? 'Demo data (offline copy).' : 'Demo data — couldn’t reach the shared database.';
      line.className = 'src-line' + (live() ? ' src-line--live' : '');
    }
    var key = getLS(KEY_TEAM);
    if (key && live()) SRC.whoami(key).then(function (t) { if (t === 'P05') { ui.writer = 'P05'; render(); } }, function () { });
    fromHash();
    render();
    if (!getLS(KEY_SEEN)) openLayer('welcome');
  }
  var forceDemo = /[?&]demo\b/.test(location.search);
  document.getElementById('view').innerHTML = '<p class="loading">Loading the shared database…</p>';
  if (SRC && window.P05_CONFIG && !forceDemo) {
    SRC.load(window.P05_DATA).then(function (r) { start(r.data, r.source); }, function (e) { start(FIXTURE, { mode: 'demo', reason: e.message }); });
  } else {
    start(FIXTURE, { mode: 'demo', forced: forceDemo, reason: forceDemo ? 'Demo mode was asked for in the address (?demo).' : 'No database is configured.' });
  }
})();
