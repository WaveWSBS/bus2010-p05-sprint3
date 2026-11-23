/*
 * P05 matching engine — Team 5
 *
 * Rules baseline with three-state conditions (met / not_met / cannot_confirm),
 * explanation records traceable to field and version, immutable recommendation
 * records, skill-gap events to P06, and an AI method (ai-embed) that uses sentence
 * embeddings from a pretrained model (Supabase/gte-small, 384 dims). The AI method
 * only adds preference points and unconfirmed skill suggestions; it never changes a
 * mandatory state. When no embedding signal is available it falls back to word
 * overlap and labels the result "simulated fallback". No model is trained here.
 *
 * Scope rule: P05 ranks opportunities for a student. It never ranks students
 * for an employer, so no such function exists here.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.P05Engine = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SCHEMA = 'p05-proto/1';
  var AI_MODEL = 'Supabase/gte-small';
  // Calibration for gte-small cosine scores (they sit in a narrow band). Recorded with the method.
  //   goal fit = clamp((cosine - floor) / (ceil - floor), 0, 1)
  //   a vocabulary skill is suggested for a phrase when cosine >= suggest_min (top suggest_top only)
  // Set on 2026-11-16 from 67,284 goal x open-listing pairs: median 0.809, 90th percentile 0.844, max 0.933.
  var AI_PARAMS = { floor: 0.82, ceil: 0.90, suggest_min: 0.84, suggest_top: 2, reason_min_fit: 0.5 };

  var DEFAULT_METHODS = [
    {
      method_version: 'rules-1.0.0', family: 'rules', label: 'Rules baseline',
      created_at: '2026-11-04', created_by: 'Team 5', note: 'Initial editable baseline',
      weights: { sector: 2, role: 2, city: 1, desirable_skill: 1 }
    },
    {
      method_version: 'ai-assist-0.1.0', family: 'ai', label: 'AI-assisted (simulated)',
      created_at: '2026-11-06', created_by: 'Team 5',
      note: 'Sprint 1. Rules baseline plus lexical goal-text similarity and skill-term suggestions. No model. Retired 2026-11-16.',
      weights: { sector: 2, role: 2, city: 1, desirable_skill: 1, goal_text: 2, suggested_skill: 0.5 }
    },
    {
      method_version: 'ai-embed-1.0.0', family: 'ai', label: 'AI similarity (gte-small)',
      created_at: '2026-11-16', created_by: 'Team 5',
      model: AI_MODEL,
      note: 'Sprint 2. Rules baseline plus cosine similarity of sentence embeddings (goal text vs job text; free-text skill vs vocabulary). Pretrained model, not trained by us.',
      weights: { sector: 2, role: 2, city: 1, desirable_skill: 1, goal_semantic: 3, suggested_skill: 0.5 },
      params: AI_PARAMS
    },
    {
      method_version: 'ai-embed-1.1.0', family: 'ai', label: 'AI similarity (gte-small, Sprint 3 synonyms)',
      created_at: '2026-11-23', created_by: 'Team 5',
      model: AI_MODEL,
      note: 'Sprint 3 audit & migration. Adds SK-UX-01 (customer journey) and SK-JIRA-01 (kanban, ticket triage) synonyms. Verified with real gte-small locally; eligibility unchanged.',
      weights: { sector: 2, role: 2, city: 1, desirable_skill: 1, goal_semantic: 3, suggested_skill: 0.5 },
      params: AI_PARAMS
    }
  ];

  var STATUS_ORDER = { eligible: 0, cannot_confirm: 1, not_eligible: 2, excluded: 3 };

  // ---------- small utilities ----------
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function pad(n, w) { var s = String(n); while (s.length < w) s = '0' + s; return s; }
  function nowIso() { return new Date().toISOString(); }
  function today() { return nowIso().slice(0, 10); }

  function fnv1a(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return ('00000000' + h.toString(16)).slice(-8).toUpperCase();
  }

  function recommendationId(student_id, profile_version, opportunity_id, opportunity_version, method_version) {
    return 'REC-' + fnv1a([student_id, profile_version, opportunity_id, opportunity_version, method_version].join('|'));
  }

  // The ID covers every input version and the method. A record built without the AI
  // signal (fallback) gets a different ID from one built with it, so neither overwrites the other.
  function recordIdFor(rec) {
    var mv = rec.method_version + (rec.ai_source === 'lexical-fallback' ? '+fallback' : '');
    return recommendationId(rec.student_id, rec.profile_version, rec.opportunity_id, rec.opportunity_version, mv);
  }

  function vocabMap(vocab) {
    var m = {};
    vocab.forEach(function (v) { m[v.skill_id] = v; });
    return m;
  }

  // ---------- lexical similarity (the simulated "AI" part) ----------
  var STOP = {};
  ('a an and the of for in on to with by at from as is are be this that it into using use build learn how ' +
   'my me i we our your their about across work working role roles data intern help teams team short ' +
   'more make plan').split(' ').forEach(function (w) { STOP[w] = true; });

  function stem(t) {
    if (t.indexOf('analy') === 0) return 'analy';
    if (t.length > 4 && /ies$/.test(t)) return t.slice(0, -3) + 'y';
    if (t.length > 4 && /s$/.test(t) && !/ss$/.test(t)) return t.slice(0, -1);
    return t;
  }

  function tokenize(text) {
    var out = [], seen = {}, words = (text || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/[\s-]+/);
    words.forEach(function (w) {
      if (!w || w.length < 3 || STOP[w]) return;
      var s = stem(w);
      if (!seen[s]) { seen[s] = w; out.push(s); }
    });
    return { stems: out, surface: seen };
  }

  function textSimilarity(a, b) {
    var A = tokenize(a), B = tokenize(b);
    if (!A.stems.length || !B.stems.length) return { score: 0, shared: [] };
    var setB = {}; B.stems.forEach(function (s) { setB[s] = true; });
    var shared = A.stems.filter(function (s) { return setB[s]; });
    var score = shared.length / Math.sqrt(A.stems.length * B.stems.length);
    return { score: Math.round(score * 100) / 100, shared: shared.map(function (s) { return A.surface[s]; }) };
  }

  function suggestSkills(phrase, vocab) {
    var P = tokenize(phrase).stems;
    if (!P.length) return [];
    var out = [];
    vocab.forEach(function (v) {
      var T = tokenize(v.label + ' ' + v.synonyms.join(' ')).stems;
      var set = {}; T.forEach(function (s) { set[s] = true; });
      var hit = P.filter(function (s) { return set[s]; }).length;
      var score = Math.round((hit / P.length) * 100) / 100;
      if (score >= 0.5) out.push({ skill_id: v.skill_id, label: v.label, score: score });
    });
    out.sort(function (x, y) { return y.score - x.score || x.skill_id.localeCompare(y.skill_id); });
    return out;
  }

  // ---------- AI signals (real model outputs, computed elsewhere) ----------
  // data.ai = { model, source, goals: { <textKey(goal)>: { 'OP-028@2': cosine, ... } },
  //             phrases: { '<phrase>': [{ skill_id, score }, ...] } }
  function textKey(text) { return fnv1a(String(text == null ? '' : text)); }

  function aiLookup(ai) {
    if (!ai) return null;
    return {
      model: ai.model || AI_MODEL,
      source: ai.source || 'precomputed',
      hasGoal: function (goal) { return !!(ai.goals && ai.goals[textKey(goal)]); },
      goal: function (goal, opportunity_id, version) {
        var g = ai.goals && ai.goals[textKey(goal)];
        if (!g) return null;
        var v = g[opportunity_id + '@' + version];
        return typeof v === 'number' ? v : null;
      },
      phrase: function (phrase) { var p = ai.phrases && ai.phrases[phrase]; return Array.isArray(p) ? p : null; }
    };
  }

  function clamp01(x) { return Math.max(0, Math.min(1, x)); }
  function r2(x) { return Math.round(x * 100) / 100; }

  // ---------- listing helpers ----------
  function publishedVersion(listing) {
    if (!listing.approved_version) return null;
    var rec = listing.versions[listing.approved_version];
    if (!rec) return null;
    return { version: listing.approved_version, record: rec };
  }

  function findSkill(profile, skill_id) {
    var s = (profile.skills || []).filter(function (x) { return x.skill_id === skill_id; })[0];
    if (!s) return null;
    return { skill_id: s.skill_id, source: s.source || 'self_declared', evidence_id: s.evidence_id || null, review_date: s.review_date || null };
  }

  // ---------- the evaluator ----------
  function evaluate(profile, listing, method, vocab, ai) {
    var V = vocabMap(vocab);
    if (ai && typeof ai.goal !== 'function') ai = aiLookup(ai);
    var embed = method.family === 'ai' && !!method.model;
    var params = method.params || AI_PARAMS;
    var usedFallback = false;
    var w = method.weights;
    var pub = publishedVersion(listing);
    var pv = profile.profile_version;

    var rec = {
      student_id: profile.student_id,
      profile_version: pv,
      opportunity_id: listing.opportunity_id,
      opportunity_version: pub ? pub.version : null,
      method_version: method.method_version,
      method_family: method.family,
      listing: null,
      status: null,
      status_reason: '',
      mandatory: [],
      desirable: [],
      interests: [],
      reasons: [],
      gaps: [],
      unknowns: [],
      ai_notes: [],
      ai_source: null,
      pref_points: 0
    };

    if (!pub) {
      rec.status = 'excluded';
      rec.status_reason = 'Not published by P03 (no approved version)';
      return rec;
    }
    var L = pub.record;
    var ov = pub.version;
    rec.listing = {
      title: L.title, employer: L.employer, city: L.city, work_arrangement: L.work_arrangement,
      start_date: L.start_date, end_date: L.end_date, sector: L.sector, role_family: L.role_family
    };

    if (listing.listing_status !== 'open') {
      rec.status = 'excluded';
      var word = listing.listing_status === 'withdrawn' ? 'Withdrawn' : 'Closed';
      rec.status_reason = word + ' on ' + (listing.closed_on || 'an unrecorded date') + ' (listing_status from P03)';
      return rec;
    }

    function cite(profile_field, opportunity_field) {
      return { profile_field: profile_field, opportunity_field: opportunity_field, profile_version: pv, opportunity_version: ov, method_version: method.method_version };
    }

    var suggestions = [];
    if (method.family === 'ai') {
      (profile.unmapped_skills || []).forEach(function (phrase) {
        var list = embed && ai ? ai.phrase(phrase) : null;
        if (list) {
          list.filter(function (x) { return x.score >= params.suggest_min; }).slice(0, params.suggest_top).forEach(function (x) {
            suggestions.push({ phrase: phrase, skill_id: x.skill_id, label: (V[x.skill_id] || { label: x.skill_id }).label, score: x.score, via: 'embedding' });
          });
        } else {
          if (embed) usedFallback = true;
          suggestSkills(phrase, vocab).forEach(function (sgg) {
            suggestions.push({ phrase: phrase, skill_id: sgg.skill_id, label: sgg.label, score: sgg.score, via: 'lexical' });
          });
        }
      });
    }
    function simWord(s) { return s.via === 'embedding' ? 'AI similarity ' + s.score + ', ' + method.model : 'word overlap ' + s.score + ', simulated'; }

    var reasonPool = [];
    var points = 0;

    // Mandatory conditions
    L.mandatory.forEach(function (c, i) {
      var out = { cond_id: 'mandatory[' + i + ']', kind: c.kind, label: '', state: null, detail: '', input_present: true, profile_field: '', opportunity_field: '' };
      if (c.kind === 'skill') {
        var v = V[c.skill_id] || { label: c.skill_id };
        var s = findSkill(profile, c.skill_id);
        out.label = v.label + ' (' + c.skill_id + ')';
        out.skill_id = c.skill_id;
        out.profile_field = 'skills[' + c.skill_id + ']';
        out.opportunity_field = 'mandatory[' + c.skill_id + ']';
        if (!s) {
          out.state = 'not_met';
          out.detail = v.label + ' is not on your profile v' + pv;
          rec.gaps.push({ skill_id: c.skill_id, label: v.label, requirement: 'mandatory', current_source: 'absent' });
        } else if (s.source === 'reviewed' && s.evidence_id) {
          out.state = 'met';
          out.evidence_id = s.evidence_id;
          out.detail = 'Reviewed evidence ' + s.evidence_id + ' (' + s.review_date + ')';
          reasonPool.push({ rank: 1, text: 'Your reviewed ' + v.label + ' (' + s.evidence_id + ') meets a mandatory requirement', c: cite(out.profile_field, out.opportunity_field) });
        } else {
          out.state = 'cannot_confirm';
          out.input_present = false;
          out.detail = c.skill_id + ' required; present on your profile as self-declared only';
          rec.gaps.push({ skill_id: c.skill_id, label: v.label, requirement: 'mandatory', current_source: 'self_declared' });
          rec.unknowns.push({ field: 'skills[' + c.skill_id + '].evidence_id', text: 'No reviewed evidence for ' + v.label + ' in profile v' + pv });
        }
        var sg = suggestions.filter(function (x) { return x.skill_id === c.skill_id; })[0];
        if (sg && out.state !== 'met') {
          rec.ai_notes.push({ text: '"' + sg.phrase + '" may relate to ' + c.skill_id + ' (' + simWord(sg) + '). Suggested, unconfirmed: it does not change this mandatory condition.', field: 'unmapped_skills', kind: 'skill_suggestion', skill_id: c.skill_id, score: sg.score, via: sg.via });
        }
      } else if (c.kind === 'availability') {
        var a = profile.availability || {};
        out.label = 'Available for the full placement period';
        out.profile_field = 'availability';
        out.opportunity_field = 'start_date/end_date';
        var missing = [];
        if (!a.start) missing.push('availability.start');
        if (!a.end) missing.push('availability.end');
        if (missing.length) {
          out.state = 'cannot_confirm';
          out.input_present = false;
          out.detail = missing.join(' and ') + ' absent from profile v' + pv;
          rec.unknowns.push({ field: missing.join(', '), text: out.detail });
        } else if (a.start <= L.start_date && a.end >= L.end_date) {
          out.state = 'met';
          out.detail = 'You are available ' + a.start + ' to ' + a.end + '; the role runs ' + L.start_date + ' to ' + L.end_date;
          reasonPool.push({ rank: 4, text: 'Your availability covers the whole placement (' + L.start_date + ' to ' + L.end_date + ')', c: cite('availability', 'start_date/end_date') });
        } else {
          out.state = 'not_met';
          out.detail = a.start > L.start_date
            ? 'You become available ' + a.start + '; the role starts ' + L.start_date
            : 'You are available until ' + a.end + '; the role runs to ' + L.end_date;
        }
      } else if (c.kind === 'arrangement') {
        var arr = profile.work_arrangements || [];
        out.label = c.arrangements.join(' or ') + ' work in ' + c.city;
        out.profile_field = 'work_arrangements';
        out.opportunity_field = 'work_arrangement';
        if (!arr.length) {
          out.state = 'cannot_confirm';
          out.input_present = false;
          out.detail = 'work_arrangements absent from profile v' + pv;
          rec.unknowns.push({ field: 'work_arrangements', text: out.detail });
        } else if (arr.some(function (x) { return c.arrangements.indexOf(x) >= 0; })) {
          out.state = 'met';
          out.detail = 'You accept ' + arr.join(' / ') + ' work';
        } else {
          out.state = 'not_met';
          out.detail = 'Your profile accepts ' + arr.join(' / ') + ' work only; this role is ' + c.arrangements.join(' or ') + ' in ' + c.city;
        }
      }
      rec.mandatory.push(out);
    });

    // Desirable conditions (preferences): self-declared counts here
    L.desirable.forEach(function (c, i) {
      var v = V[c.skill_id] || { label: c.skill_id };
      var s = findSkill(profile, c.skill_id);
      var out = { cond_id: 'desirable[' + i + ']', kind: 'skill', skill_id: c.skill_id, label: v.label + ' (' + c.skill_id + ')', state: null, detail: '', input_present: true, profile_field: 'skills[' + c.skill_id + ']', opportunity_field: 'desirable[' + c.skill_id + ']' };
      var sg = suggestions.filter(function (x) { return x.skill_id === c.skill_id; })[0];
      if (s) {
        out.state = 'met';
        out.detail = s.source === 'reviewed' ? 'Reviewed (' + s.evidence_id + ')' : 'Self-declared: counts for preferences only';
        points += w.desirable_skill;
        reasonPool.push({ rank: 3, text: v.label + ' (' + (s.source === 'reviewed' ? 'reviewed' : 'self-declared') + ') matches a desirable skill', c: cite(out.profile_field, out.opportunity_field) });
      } else if (sg && method.family === 'ai') {
        out.state = 'suggested';
        out.detail = 'Suggested, unconfirmed: "' + sg.phrase + '" (' + simWord(sg) + ')';
        out.profile_field = 'unmapped_skills';
        points += w.suggested_skill;
        rec.ai_notes.push({ text: '"' + sg.phrase + '" suggested as ' + c.skill_id + ' (' + simWord(sg) + '); counted at ' + w.suggested_skill + ' point as a preference only', field: 'unmapped_skills', kind: 'skill_suggestion', skill_id: c.skill_id, score: sg.score, via: sg.via });
      } else {
        out.state = 'not_met';
        out.detail = 'Not on your profile';
        rec.gaps.push({ skill_id: c.skill_id, label: v.label, requirement: 'desirable', current_source: 'absent' });
      }
      rec.desirable.push(out);
    });

    // Interests the student chose
    var interests = [
      { kind: 'sector', label: 'Sector', pval: profile.sectors || [], oval: L.sector, pf: 'sectors', of: 'sector', weight: w.sector },
      { kind: 'role', label: 'Role', pval: profile.roles || [], oval: L.role_family, pf: 'roles', of: 'role_family', weight: w.role },
      { kind: 'city', label: 'Location', pval: profile.locations || [], oval: L.city, pf: 'locations', of: 'city', weight: w.city }
    ];
    interests.forEach(function (it) {
      var matched = it.pval.indexOf(it.oval) >= 0;
      rec.interests.push({ kind: it.kind, label: it.label, value: it.oval, matched: matched, profile_field: it.pf, opportunity_field: it.of, known: it.pval.length > 0 });
      if (matched) {
        points += it.weight;
        var text = it.kind === 'sector' ? 'You chose ' + it.oval + ' as a sector; this role is in ' + it.oval
          : it.kind === 'role' ? 'You are looking for ' + it.oval + ' roles; this is one'
          : 'You listed ' + it.oval + ' as a preferred location';
        reasonPool.push({ rank: 2, text: text, c: cite(it.pf, it.of) });
      }
    });

    if (method.family === 'ai') {
      var cos = embed && ai ? ai.goal(profile.goals, listing.opportunity_id, ov) : null;
      var gw = w.goal_semantic != null ? w.goal_semantic : (w.goal_text || 0);
      if (cos != null) {
        var fit = r2(clamp01((cos - params.floor) / (params.ceil - params.floor)));
        var addE = r2(gw * fit);
        points += addE;
        rec.ai_notes.push({ text: 'Goal text and job text are close in meaning: cosine ' + cos + ', fit ' + fit + ' (+' + addE + ' points). Model ' + method.model + ', pretrained, not trained by us.', field: 'goals', kind: 'goal_similarity', score: cos, fit: fit, via: 'embedding' });
        if (fit >= params.reason_min_fit) {
          reasonPool.push({ rank: 5, text: 'Your goals are close in meaning to this job (AI similarity ' + cos + ', ' + method.model + ')', c: cite('goals', 'description') });
        }
      } else {
        if (embed) usedFallback = true;
        var sim = textSimilarity(profile.goals, L.title + ' ' + L.description + ' ' + L.sector);
        if (sim.score > 0) {
          var add = r2(gw * sim.score);
          points += add;
          rec.ai_notes.push({ text: 'Goal text shares terms with the listing: ' + sim.shared.join(', ') + ' (similarity ' + sim.score + ', +' + add + ' points; word overlap, simulated' + (embed ? ' fallback: no AI signal' : '') + ')', field: 'goals', kind: 'goal_similarity', score: sim.score, via: 'lexical' });
          reasonPool.push({ rank: 5, text: 'Your goals mention ' + sim.shared.slice(0, 3).join(', ') + ' (AI-assisted, simulated)', c: cite('goals', 'description') });
        }
      }
      rec.ai_source = !embed ? 'lexical' : (usedFallback ? 'lexical-fallback' : 'embedding');
    }

    rec.pref_points = Math.round(points * 100) / 100;

    reasonPool.sort(function (x, y) { return x.rank - y.rank; });
    rec.reasons = reasonPool.slice(0, 3).map(function (r) {
      var o = { text: r.text };
      Object.keys(r.c).forEach(function (k) { o[k] = r.c[k]; });
      return o;
    });

    var notMet = rec.mandatory.filter(function (c) { return c.state === 'not_met'; });
    var unk = rec.mandatory.filter(function (c) { return c.state === 'cannot_confirm'; });
    if (notMet.length) {
      rec.status = 'not_eligible';
      rec.status_reason = 'Blocked by: ' + notMet.map(function (c) { return c.label; }).join('; ');
    } else if (unk.length) {
      rec.status = 'cannot_confirm';
      rec.status_reason = 'Cannot confirm: ' + unk.map(function (c) { return c.label; }).join('; ');
    } else {
      rec.status = 'eligible';
      rec.status_reason = rec.mandatory.length
        ? 'All ' + rec.mandatory.length + ' mandatory conditions met'
        : 'This listing states no mandatory conditions';
    }
    return rec;
  }

  function rank(records) {
    return records.slice().sort(function (a, b) {
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.pref_points - a.pref_points || a.opportunity_id.localeCompare(b.opportunity_id);
    });
  }

  function fingerprint(rec) {
    var c = clone(rec);
    delete c.created_at;
    return JSON.stringify(c);
  }

  function emptyState() {
    return {
      schema: SCHEMA,
      recs: {}, recOrder: [], pointers: {},
      gapEvents: [], evidence: [], challenges: [], notes: [], profileAdds: [],
      employerComments: [], progressLogs: [], chatbotEscalations: [],
      methods: clone(DEFAULT_METHODS),
      current: { rules: 'rules-1.0.0', ai: 'ai-embed-1.0.0' },
      log: []
    };
  }

  // ---------- platform: P05 service layer over fixtures + state ----------
  function createPlatform(data, state) {
    var S = state || emptyState();
    var AI = aiLookup(data.ai);
    // Older saved states (Sprint 1/2) lack Sprint 2/3 keys: backfill safely, keep history.
    if (!S.methods.some(function (m) { return m.method_version === 'ai-embed-1.0.0'; })) {
      S.methods.push(clone(DEFAULT_METHODS[2]));
      S.current.ai = 'ai-embed-1.0.0';
    }
    if (!S.methods.some(function (m) { return m.method_version === 'ai-embed-1.1.0'; }) && DEFAULT_METHODS[3]) {
      S.methods.push(clone(DEFAULT_METHODS[3]));
    }
    S.employerComments = S.employerComments || [];
    S.progressLogs = S.progressLogs || [];
    S.chatbotEscalations = S.chatbotEscalations || [];

    function log(actor, text) {
      S.log.push({ ts: nowIso(), actor: actor, text: text });
      if (S.log.length > 200) S.log.shift();
    }

    function allProfiles() { return data.profiles.concat(S.profileAdds); }

    function profileVersions(student_id) {
      return allProfiles().filter(function (p) { return p.student_id === student_id; })
        .sort(function (a, b) { return a.profile_version - b.profile_version; });
    }

    function currentProfile(student_id) {
      var v = profileVersions(student_id);
      return v[v.length - 1];
    }

    function profileAt(student_id, version) {
      return profileVersions(student_id).filter(function (p) { return p.profile_version === version; })[0];
    }

    function students() {
      var seen = {}, out = [];
      allProfiles().forEach(function (p) {
        if (!seen[p.student_id]) { seen[p.student_id] = true; out.push({ student_id: p.student_id, name: p.name }); }
      });
      return out.sort(function (a, b) { return a.student_id.localeCompare(b.student_id); });
    }

    function method(version) { return S.methods.filter(function (m) { return m.method_version === version; })[0]; }
    function currentMethod(family) { return method(S.current[family]); }

    function saveRecommendation(rec) {
      var id = rec.recommendation_id;
      var ex = S.recs[id];
      if (ex) {
        if (fingerprint(ex) !== fingerprint(rec)) throw new Error('Immutable record conflict: ' + id + ' already exists with different content');
        return { record: ex, created: false };
      }
      S.recs[id] = rec;
      S.recOrder.push(id);
      return { record: rec, created: true };
    }

    function pointerKey(student_id, opportunity_id, method_version) { return student_id + '|' + opportunity_id + '|' + method_version; }

    function build(profile, listing, m) {
      var rec = evaluate(profile, listing, m, data.vocabulary, AI);
      rec.recommendation_id = recordIdFor(rec);
      rec.created_at = nowIso();
      var saved = saveRecommendation(rec);
      S.pointers[pointerKey(profile.student_id, listing.opportunity_id, m.method_version)] = saved.record.recommendation_id;
      return saved.record;
    }

    function computeAtVersion(student_id, version, family) {
      var p = profileAt(student_id, version);
      var m = currentMethod(family);
      return rank(data.listings.map(function (L) { return build(p, L, m); }));
    }

    // Current set: the record each pointer names, computing only where none exists.
    function computeSet(student_id, family) {
      var p = currentProfile(student_id);
      var m = currentMethod(family);
      var signal = !!(m.model && AI && AI.hasGoal(p.goals));
      var records = data.listings.map(function (L) {
        var id = S.pointers[pointerKey(student_id, L.opportunity_id, m.method_version)];
        var cached = id && S.recs[id];
        // A fallback record is replaced once the AI signal has arrived (the old one is kept).
        if (cached && !(signal && cached.ai_source === 'lexical-fallback')) return cached;
        return build(p, L, m);
      });
      var stale = records.some(function (r) { return r.profile_version < p.profile_version; });
      return { records: rank(records), profile: p, method: m, stale: stale };
    }

    function recompute(student_id, family, actor) {
      var before = computeSet(student_id, family).records;
      var p = currentProfile(student_id);
      var m = currentMethod(family);
      var after = rank(data.listings.map(function (L) { return build(p, L, m); }));
      var diff = after.map(function (r, i) {
        var bIndex = -1;
        before.forEach(function (b, j) { if (b.opportunity_id === r.opportunity_id) bIndex = j; });
        var b = before[bIndex];
        return {
          opportunity_id: r.opportunity_id,
          title: r.listing ? r.listing.title : r.opportunity_id,
          before: { recommendation_id: b.recommendation_id, status: b.status, rank: bIndex + 1, profile_version: b.profile_version },
          after: { recommendation_id: r.recommendation_id, status: r.status, rank: i + 1, profile_version: r.profile_version },
          changed: b.recommendation_id !== r.recommendation_id
        };
      });
      log(actor || 'P05', 'Recomputed ' + student_id + ' with profile v' + p.profile_version + ' and ' + m.method_version);
      return { records: after, diff: diff, profile: p, method: m };
    }

    function sendGap(recommendation_id, skill_id, actor) {
      var rec = S.recs[recommendation_id];
      if (!rec) throw new Error('Unknown recommendation ' + recommendation_id);
      var gap = rec.gaps.filter(function (g) { return g.skill_id === skill_id; })[0];
      if (!gap) throw new Error(skill_id + ' is not a gap on ' + recommendation_id);
      var existing = S.gapEvents.filter(function (e) { return e.student_id === rec.student_id && e.skill_id === skill_id && e.recommendation_id === recommendation_id; })[0];
      if (existing) return { event: existing, created: false };
      var ev = {
        event_id: 'GAP-' + pad(S.gapEvents.length + 1, 4),
        student_id: rec.student_id,
        skill_id: skill_id,
        opportunity_id: rec.opportunity_id,
        recommendation_id: recommendation_id,
        requirement: gap.requirement,
        current_source: gap.current_source,
        timestamp: nowIso(),
        sent_to: 'P06 Internship Preparation',
        status: 'sent'
      };
      S.gapEvents.push(ev);
      log(actor || rec.student_id, 'Sent ' + skill_id + ' gap to P06 (' + ev.event_id + ')');
      return { event: ev, created: true };
    }

    function publishProfileVersion(student_id, mutate, change_note, actor) {
      var cur = currentProfile(student_id);
      var next = clone(cur);
      next.profile_version = cur.profile_version + 1;
      next.published_at = today();
      next.change_note = change_note;
      mutate(next);
      S.profileAdds.push(next);
      log(actor || 'P01 (simulated)', 'Published ' + student_id + ' profile v' + next.profile_version + ': ' + change_note);
      return next;
    }

    function recordEvidence(event_id, opts) {
      var ev = S.gapEvents.filter(function (e) { return e.event_id === event_id; })[0];
      if (!ev) throw new Error('Unknown gap event ' + event_id);
      var evidence = {
        evidence_id: opts.evidence_id || ('E-' + ev.skill_id.slice(3)),
        student_id: ev.student_id,
        skill_id: ev.skill_id,
        activity: opts.activity || 'P06 practice task for ' + ev.skill_id,
        outcome: opts.outcome,
        reviewer: opts.reviewer,
        review_date: opts.review_date || today(),
        source_event: event_id
      };
      S.evidence.push(evidence);
      ev.status = opts.outcome === 'demonstrated' ? 'reviewed' : 'revision_requested';
      log(opts.reviewer + ' (P06, simulated)', 'Recorded ' + evidence.evidence_id + ' for ' + ev.student_id + ': ' + opts.outcome);
      var newProfile = null;
      if (opts.outcome === 'demonstrated') {
        newProfile = publishProfileVersion(ev.student_id, function (p) {
          var found = false;
          p.skills = p.skills.map(function (s) {
            if (s.skill_id !== ev.skill_id) return s;
            found = true;
            return { skill_id: s.skill_id, source: 'reviewed', evidence_id: evidence.evidence_id, review_date: evidence.review_date };
          });
          if (!found) p.skills.push({ skill_id: ev.skill_id, source: 'reviewed', evidence_id: evidence.evidence_id, review_date: evidence.review_date });
        }, 'Accepted reviewed evidence ' + evidence.evidence_id + ' from P06', 'P01 (simulated)');
      }
      return { evidence: evidence, profile: newProfile };
    }

    function addChallenge(recommendation_id, text, actor) {
      var rec = S.recs[recommendation_id];
      if (!rec) throw new Error('Unknown recommendation ' + recommendation_id);
      var ch = {
        challenge_id: 'CH-' + pad(S.challenges.length + 1, 3),
        recommendation_id: recommendation_id, student_id: rec.student_id, opportunity_id: rec.opportunity_id,
        text: text, actor: actor || rec.student_id, timestamp: nowIso(), status: 'open', response: null
      };
      S.challenges.push(ch);
      log(ch.actor, 'Challenged ' + recommendation_id + ' (' + ch.challenge_id + ')');
      return ch;
    }

    function resolveChallenge(challenge_id, response, actor) {
      var ch = S.challenges.filter(function (c) { return c.challenge_id === challenge_id; })[0];
      if (!ch) throw new Error('Unknown challenge ' + challenge_id);
      ch.status = 'reviewed';
      ch.response = { text: response, actor: actor, timestamp: nowIso() };
      log(actor, 'Reviewed ' + challenge_id);
      return ch;
    }

    // A correction note is stored against the P01 field. P05 never edits P01's record.
    function addNote(recommendation_id, field, text, actor) {
      var rec = S.recs[recommendation_id];
      if (!rec) throw new Error('Unknown recommendation ' + recommendation_id);
      var note = {
        note_id: 'CN-' + pad(S.notes.length + 1, 3),
        student_id: rec.student_id, field: field, profile_version: rec.profile_version,
        recommendation_id: recommendation_id, text: text, actor: actor, timestamp: nowIso(), owner: 'P01'
      };
      S.notes.push(note);
      log(actor, 'Correction note ' + note.note_id + ' on ' + rec.student_id + ' ' + field + ' (P01 record unchanged)');
      return note;
    }

    function notesFor(student_id, field) {
      return S.notes.filter(function (n) { return n.student_id === student_id && (!field || n.field === field); });
    }

    function bump(version) {
      var m = version.match(/^(.*)-(\d+)\.(\d+)\.(\d+)$/);
      var family = m[1];
      var minor = 0;
      S.methods.forEach(function (x) {
        var mm = x.method_version.match(/^(.*)-(\d+)\.(\d+)\.(\d+)$/);
        if (mm && mm[1] === family && mm[2] === m[2]) minor = Math.max(minor, +mm[3]);
      });
      return family + '-' + m[2] + '.' + (minor + 1) + '.0';
    }

    function updateWeights(family, weights, actor, note) {
      var cur = currentMethod(family);
      var next = clone(cur);
      next.method_version = bump(cur.method_version);
      next.weights = weights;
      next.created_at = today();
      next.created_by = actor;
      next.note = note || 'Weights changed';
      S.methods.push(next);
      S.current[family] = next.method_version;
      log(actor, 'Created ' + next.method_version + ' (previous ' + cur.method_version + ' retained)');
      return next;
    }

    function historyFor(student_id, opportunity_id) {
      return S.recOrder.map(function (id) { return S.recs[id]; })
        .filter(function (r) { return r.student_id === student_id && r.opportunity_id === opportunity_id; });
    }

    function addChatbotEscalation(opts) {
      var escItem = {
        escalation_id: 'ESC-' + pad(S.chatbotEscalations.length + 1, 3),
        student_id: opts.student_id || null,
        question: String(opts.question || '').trim(),
        reason: String(opts.reason || '').trim(),
        target: opts.target || 'Co-op Office / Academic Coordinator',
        status: 'open',
        created_at: nowIso()
      };
      S.chatbotEscalations.push(escItem);
      log(opts.student_id || 'Student', 'Escalated assistant question ' + escItem.escalation_id + ' to ' + escItem.target);
      return escItem;
    }

    function addEmployerComment(opts) {
      var txt = String(opts.comment || '').trim();
      var sup = String(opts.supervisor || '').trim();
      if (!txt || !sup) throw new Error('Supervisor name and employer comment are required.');
      var item = {
        comment_id: 'EC-' + pad(S.employerComments.length + 1, 3),
        placement_id: opts.placement_id || 'EG-DXB-028',
        student_id: opts.student_id || 'COOP-B001',
        opportunity_id: opts.opportunity_id || 'OP-028',
        supervisor: sup,
        comment: txt,
        created_at: nowIso(),
        simulated: true
      };
      S.employerComments.push(item);
      log(sup + ' (P02/P03 simulated)', 'Added employer comment ' + item.comment_id + ' for ' + item.student_id);
      return item;
    }

    function addProgressReport(opts) {
      var entry = String(opts.entry || '').trim();
      if (!entry) throw new Error('Progress report summary is required.');
      var item = {
        log_id: 'LOG-' + pad(S.progressLogs.length + 1, 4),
        placement_id: opts.placement_id || 'EG-DXB-028',
        student_id: opts.student_id || 'COOP-B001',
        opportunity_id: opts.opportunity_id || 'OP-028',
        period: opts.period || '2027 week 2',
        goal_id: opts.goal_id || 'G-1',
        entry: entry,
        evidence_ids: Array.isArray(opts.evidence_ids) ? opts.evidence_ids : [],
        review_status: 'submitted',
        feedback: null,
        grade: null,
        grader: null,
        graded_at: null,
        graded_by_human: false,
        ai_graded: false,
        created_at: nowIso(),
        simulated: true
      };
      S.progressLogs.push(item);
      log(item.student_id + ' (P07 simulated)', 'Submitted progress report ' + item.log_id + ' (' + item.period + ')');
      return item;
    }

    function gradeProgressReport(log_id, opts) {
      var item = S.progressLogs.filter(function (l) { return l.log_id === log_id; })[0];
      if (!item) throw new Error('Unknown progress report ' + log_id);
      var grader = String(opts.grader || '').trim();
      var grade = String(opts.grade || '').trim();
      if (!grader || !grade) throw new Error('Faculty approver name and grade are required.');
      item.feedback = String(opts.feedback || '').trim() || 'Reviewed by faculty.';
      item.grade = grade;
      item.grader = grader;
      item.graded_at = nowIso();
      item.graded_by_human = true;
      item.ai_graded = false;
      item.review_status = grade === 'Revision Requested' ? 'revision_requested' : 'reviewed';
      log(grader + ' (Faculty P07 simulated)', 'Graded ' + item.log_id + ': ' + grade);
      return item;
    }

    function isCurrent(rec) {
      return S.pointers[pointerKey(rec.student_id, rec.opportunity_id, rec.method_version)] === rec.recommendation_id;
    }

    return {
      state: S,
      data: data,
      students: students,
      profileVersions: profileVersions,
      currentProfile: currentProfile,
      profileAt: profileAt,
      method: method,
      currentMethod: currentMethod,
      saveRecommendation: saveRecommendation,
      computeSet: computeSet,
      computeAtVersion: computeAtVersion,
      recompute: recompute,
      sendGap: sendGap,
      recordEvidence: recordEvidence,
      publishProfileVersion: publishProfileVersion,
      addChallenge: addChallenge,
      resolveChallenge: resolveChallenge,
      addNote: addNote,
      notesFor: notesFor,
      updateWeights: updateWeights,
      historyFor: historyFor,
      addChatbotEscalation: addChatbotEscalation,
      addEmployerComment: addEmployerComment,
      addProgressReport: addProgressReport,
      gradeProgressReport: gradeProgressReport,
      ai: function () { return AI; },
      isCurrent: isCurrent,
      log: log
    };
  }

  // Demo seed: D7 (COOP-B005 stored at v3) and one student challenge for the coordinator inbox.
  function seedDemo(platform) {
    platform.computeAtVersion('COOP-B005', 3, 'rules');
    platform.log('P05', 'Stored COOP-B005 recommendations at profile v3 (before P01 published v4)');
    var b4 = platform.computeSet('COOP-B004', 'rules').records.filter(function (r) { return r.opportunity_id === 'OP-028'; })[0];
    platform.addChallenge(b4.recommendation_id, 'I run the agile board for my capstone team every week. Why does Jira show as missing?', 'COOP-B004');
    return platform;
  }

  return {
    SCHEMA: SCHEMA,
    DEFAULT_METHODS: DEFAULT_METHODS,
    STATUS_ORDER: STATUS_ORDER,
    evaluate: evaluate,
    rank: rank,
    recommendationId: recommendationId,
    recordIdFor: recordIdFor,
    textKey: textKey,
    aiLookup: aiLookup,
    AI_MODEL: AI_MODEL,
    AI_PARAMS: AI_PARAMS,
    textSimilarity: textSimilarity,
    suggestSkills: suggestSkills,
    publishedVersion: publishedVersion,
    createPlatform: createPlatform,
    emptyState: emptyState,
    seedDemo: seedDemo
  };
});
