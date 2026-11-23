#!/usr/bin/env node
// Command-line runner for the P05 acceptance tests: node tests/run-tests.js
const path = require('path');
// Fixtures plus the precomputed gte-small signals, as the prototype uses them offline.
const DATA = Object.assign({}, require(path.join(__dirname, '..', 'src', 'data.js')), { ai: require(path.join(__dirname, '..', 'src', 'ai-signals.js')) });
const E = require(path.join(__dirname, '..', 'src', 'engine.js'));
global.P05Chatbot = require(path.join(__dirname, '..', 'src', 'chatbot.js'));
const T = require(path.join(__dirname, '..', 'src', 'tests.js'));

const out = T.run(E, DATA);
for (const r of out.results) {
  console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.id.padEnd(3)} ${r.title}`);
  console.log(`      expected: ${r.expected}`);
  console.log(`      actual:   ${r.actual}`);
}
console.log(`\n${out.passed}/${out.total} passed`);
process.exit(out.passed === out.total ? 0 : 1);
