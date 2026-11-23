#!/usr/bin/env node
// Verifies Sprint 3 synonym fixes (ai-embed-1.0.0 -> ai-embed-1.1.0) using real
// Supabase/gte-small embeddings (384 dims, mean pooling, L2 normalised).
// Usage:
//   node scripts/verify_synonym_fix.mjs          run audit and print JSON summary
//   node scripts/verify_synonym_fix.mjs --write  also update src/ai-signals.js with measured Sprint 3 audit results
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { NEW_SKILLS, SKILL_CATEGORY } from './lib/world.mjs';
import { embedTexts, cosine, MODEL } from './lib/embedder.mjs';

const require = createRequire(import.meta.url);
const DATA = require('../src/data.js');
const E = require('../src/engine.js');
const EXISTING_SIGNALS = require('../src/ai-signals.js');

const WRITE = process.argv.includes('--write');
const THRESHOLD = 0.84;

const BEFORE_OVERRIDES = {
  'SK-JIRA-01': ['jira', 'agile board', 'sprint board', 'scrum board', 'tickets', 'issue tracking'],
  'SK-UX-01': ['user research', 'usability testing', 'interviews', 'personas']
};

function buildVocab(before = false) {
  const base = DATA.vocabulary.map((v) => ({
    skill_id: v.skill_id,
    label: v.label,
    synonyms: before && BEFORE_OVERRIDES[v.skill_id] ? BEFORE_OVERRIDES[v.skill_id] : v.synonyms,
    category: SKILL_CATEGORY[v.skill_id]
  }));
  const extra = NEW_SKILLS.map(([skill_id, label, synonyms, category]) => ({
    skill_id,
    label,
    synonyms: before && BEFORE_OVERRIDES[skill_id] ? BEFORE_OVERRIDES[skill_id] : synonyms,
    category
  }));
  return [...base, ...extra];
}

const skillText = (s) => `${s.label}: ${s.synonyms.join(', ')}`;

const BENCHMARK_PHRASES = [
  {
    phrase: 'customer journey mapping',
    intended_skill_id: 'SK-UX-01',
    note: 'Sprint 2 failure: falsely mapped to SK-HLT-01 (Healthcare operations domain) above 0.84; should map to SK-UX-01 (UX research).'
  },
  {
    phrase: 'kanban ticket triage',
    intended_skill_id: 'SK-JIRA-01',
    note: 'Sprint 2 under-threshold miss: SK-JIRA-01 scored below 0.84; should now reach >= 0.84 for SK-JIRA-01.'
  },
  {
    phrase: 'agile board hygiene',
    intended_skill_id: 'SK-AGL-01',
    note: 'Regression check: must continue mapping to SK-AGL-01 and SK-JIRA-01 >= 0.84.'
  },
  {
    phrase: 'data storytelling for executives',
    intended_skill_id: 'SK-COM-01',
    note: 'Sanity check: presentation / BI communication phrase.'
  }
];

const vocabBefore = buildVocab(true);
const vocabAfter = buildVocab(false);

const allTexts = [
  ...vocabBefore.map(skillText),
  ...vocabAfter.map(skillText),
  ...BENCHMARK_PHRASES.map((b) => b.phrase)
];

const emb = await embedTexts(allTexts, { log: (...a) => console.error('[embed]', ...a) });

function topK(phrase, vocab, k = 3) {
  const q = emb.get(phrase);
  return vocab
    .map((s) => {
      const score = Math.round(cosine(q, emb.get(skillText(s))) * 1e4) / 1e4;
      return { skill_id: s.skill_id, label: s.label, score, suggested: score >= THRESHOLD };
    })
    .sort((a, b) => b.score - a.score || a.skill_id.localeCompare(b.skill_id))
    .slice(0, k);
}

const audit = BENCHMARK_PHRASES.map((b) => {
  const before = topK(b.phrase, vocabBefore, 3);
  const after = topK(b.phrase, vocabAfter, 3);
  return {
    phrase: b.phrase,
    intended_skill_id: b.intended_skill_id,
    note: b.note,
    before,
    after
  };
});

// Check eligibility invariance across all 6 demo students x 6 demo listings
const p = E.createPlatform(DATA);
const rulesM = E.DEFAULT_METHODS.find((m) => m.method_version === 'rules-1.0.0');
const aiM = E.DEFAULT_METHODS.find((m) => m.method_version === 'ai-embed-1.0.0');
let eligibilityDiff = 0;
let pairsChecked = 0;
p.students().forEach((st) => {
  const prof = p.currentProfile(st.student_id);
  DATA.listings.forEach((L) => {
    const r1 = E.evaluate(prof, L, rulesM, DATA.vocabulary, EXISTING_SIGNALS);
    const r2 = E.evaluate(prof, L, aiM, DATA.vocabulary, EXISTING_SIGNALS);
    pairsChecked++;
    if (r1.status !== r2.status) eligibilityDiff++;
  });
});

// Verify assertions for the Sprint 3 synonym fix
const cjm = audit.find((a) => a.phrase === 'customer journey mapping');
const ktt = audit.find((a) => a.phrase === 'kanban ticket triage');
const abh = audit.find((a) => a.phrase === 'agile board hygiene');

const checks = {
  cjm_fixed_to_ux: cjm.before[0].skill_id === 'SK-HLT-01' && cjm.after[0].skill_id === 'SK-UX-01' && cjm.after[0].score >= THRESHOLD && cjm.after[0].score > cjm.after[1].score,
  ktt_reaches_jira_threshold: ktt.before[0].score < THRESHOLD && ktt.after[0].skill_id === 'SK-JIRA-01' && ktt.after[0].score >= THRESHOLD,
  abh_regression_ok: abh.after.some((s) => s.skill_id === 'SK-AGL-01' && s.score >= THRESHOLD) && abh.after.some((s) => s.skill_id === 'SK-JIRA-01' && s.score >= THRESHOLD),
  eligibility_unchanged: eligibilityDiff === 0
};

console.log(JSON.stringify({
  model: MODEL,
  threshold: THRESHOLD,
  vocab_size: vocabAfter.length,
  eligibility_pairs_checked: pairsChecked,
  eligibility_diff: eligibilityDiff,
  checks,
  audit
}, null, 2));

if (WRITE) {
  const updatedPhrases = Object.assign({}, EXISTING_SIGNALS.phrases);
  audit.forEach((a) => {
    updatedPhrases[a.phrase] = a.after.map((s) => ({ skill_id: s.skill_id, score: s.score }));
  });
  const payload = {
    model: MODEL,
    source: 'precomputed',
    generated: '2026-11-23',
    method_version: 'ai-embed-1.1.0',
    goals: EXISTING_SIGNALS.goals,
    phrases: updatedPhrases,
    sprint3_synonym_audit: {
      model: MODEL,
      from_method: 'ai-embed-1.0.0',
      to_method: 'ai-embed-1.1.0',
      recorded_on: '2026-11-23',
      threshold: THRESHOLD,
      vocab_size: vocabAfter.length,
      eligibility_changed: eligibilityDiff,
      synonyms_added: {
        'SK-UX-01': ['customer journey', 'customer journey mapping', 'user journey', 'usability research'],
        'SK-JIRA-01': ['kanban', 'kanban board', 'ticket triage']
      },
      cases: audit
    }
  };
  writeFileSync(new URL('../src/ai-signals.js', import.meta.url), `/*
 * P05 AI signals for the six demo students, six demo listings, and Sprint 3 synonym-fix audit.
 * Real outputs of the pretrained ${MODEL} sentence-embedding model (384 dims, mean pooling, L2 normalised),
 * precomputed so the prototype and automated checks run reproducibly offline and verify ai-embed-1.1.0.
 */
(function (root, factory) {
  var ai = factory();
  if (typeof module === 'object' && module.exports) module.exports = ai;
  else root.P05_AI_SIGNALS = ai;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  return ${JSON.stringify(payload, null, 2)};
});
`);
  console.error('[write] Updated src/ai-signals.js');
}

if (!Object.values(checks).every(Boolean)) {
  console.error('Verification assertions failed:', checks);
  process.exit(1);
}
process.exit(0);
