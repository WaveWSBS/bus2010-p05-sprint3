/*
 * P05 AI signals for the six demo students, six demo listings, and Sprint 3 synonym-fix audit.
 * Real outputs of the pretrained Supabase/gte-small sentence-embedding model (384 dims, mean pooling, L2 normalised),
 * precomputed so the prototype and automated checks run reproducibly offline and verify ai-embed-1.1.0.
 */
(function (root, factory) {
  var ai = factory();
  if (typeof module === 'object' && module.exports) module.exports = ai;
  else root.P05_AI_SIGNALS = ai;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  return {
  "model": "Supabase/gte-small",
  "source": "precomputed",
  "generated": "2026-11-23",
  "method_version": "ai-embed-1.1.0",
  "goals": {
    "78B4D3E7": {
      "OP-026@1": 0.8823,
      "OP-027@1": 0.8247,
      "OP-028@2": 0.8837,
      "OP-029@1": 0.7986,
      "OP-030@1": 0.8749,
      "OP-031@1": 0.7889,
      "OP-031@2": 0.8078
    },
    "3EBC2B8E": {
      "OP-026@1": 0.8924,
      "OP-027@1": 0.8395,
      "OP-028@2": 0.9117,
      "OP-029@1": 0.8079,
      "OP-030@1": 0.8848,
      "OP-031@1": 0.7957,
      "OP-031@2": 0.828
    },
    "F6E1B660": {
      "OP-026@1": 0.878,
      "OP-027@1": 0.8705,
      "OP-028@2": 0.8393,
      "OP-029@1": 0.8214,
      "OP-030@1": 0.8476,
      "OP-031@1": 0.7856,
      "OP-031@2": 0.8015
    },
    "DA7A6782": {
      "OP-026@1": 0.8949,
      "OP-027@1": 0.872,
      "OP-028@2": 0.902,
      "OP-029@1": 0.8157,
      "OP-030@1": 0.9178,
      "OP-031@1": 0.8237,
      "OP-031@2": 0.8353
    },
    "66C2A2CF": {
      "OP-026@1": 0.8277,
      "OP-027@1": 0.8185,
      "OP-028@2": 0.8081,
      "OP-029@1": 0.9054,
      "OP-030@1": 0.8157,
      "OP-031@1": 0.7864,
      "OP-031@2": 0.7956
    },
    "5A8D515E": {
      "OP-026@1": 0.8524,
      "OP-027@1": 0.8481,
      "OP-028@2": 0.8615,
      "OP-029@1": 0.8047,
      "OP-030@1": 0.8528,
      "OP-031@1": 0.8874,
      "OP-031@2": 0.9329
    },
    "9585C8FF": {
      "OP-026@1": 0.8876,
      "OP-027@1": 0.8511,
      "OP-028@2": 0.8936,
      "OP-029@1": 0.8108,
      "OP-030@1": 0.9084,
      "OP-031@1": 0.805,
      "OP-031@2": 0.816
    }
  },
  "phrases": {
    "agile board hygiene": [
      {
        "skill_id": "SK-AGL-01",
        "score": 0.8783
      },
      {
        "skill_id": "SK-JIRA-01",
        "score": 0.8533
      },
      {
        "skill_id": "SK-SEC-01",
        "score": 0.8248
      }
    ],
    "customer journey mapping": [
      {
        "skill_id": "SK-UX-01",
        "score": 0.8827
      },
      {
        "skill_id": "SK-HLT-01",
        "score": 0.8558
      },
      {
        "skill_id": "SK-SCM-01",
        "score": 0.8501
      }
    ],
    "kanban ticket triage": [
      {
        "skill_id": "SK-JIRA-01",
        "score": 0.859
      },
      {
        "skill_id": "SK-AGL-01",
        "score": 0.7975
      },
      {
        "skill_id": "SK-RISK-01",
        "score": 0.7802
      }
    ],
    "data storytelling for executives": [
      {
        "skill_id": "SK-COM-01",
        "score": 0.8398
      },
      {
        "skill_id": "SK-TAB-01",
        "score": 0.8362
      },
      {
        "skill_id": "SK-STAT-01",
        "score": 0.8289
      }
    ]
  },
  "sprint3_synonym_audit": {
    "model": "Supabase/gte-small",
    "from_method": "ai-embed-1.0.0",
    "to_method": "ai-embed-1.1.0",
    "recorded_on": "2026-11-23",
    "threshold": 0.84,
    "vocab_size": 44,
    "eligibility_changed": 0,
    "synonyms_added": {
      "SK-UX-01": [
        "customer journey",
        "customer journey mapping",
        "user journey",
        "usability research"
      ],
      "SK-JIRA-01": [
        "kanban",
        "kanban board",
        "ticket triage"
      ]
    },
    "cases": [
      {
        "phrase": "customer journey mapping",
        "intended_skill_id": "SK-UX-01",
        "note": "Sprint 2 failure: falsely mapped to SK-HLT-01 (Healthcare operations domain) above 0.84; should map to SK-UX-01 (UX research).",
        "before": [
          {
            "skill_id": "SK-HLT-01",
            "label": "Healthcare operations domain",
            "score": 0.8558,
            "suggested": true
          },
          {
            "skill_id": "SK-SCM-01",
            "label": "Supply-chain analytics",
            "score": 0.8501,
            "suggested": true
          },
          {
            "skill_id": "SK-TAB-01",
            "label": "Tableau",
            "score": 0.8338,
            "suggested": false
          }
        ],
        "after": [
          {
            "skill_id": "SK-UX-01",
            "label": "UX research",
            "score": 0.8827,
            "suggested": true
          },
          {
            "skill_id": "SK-HLT-01",
            "label": "Healthcare operations domain",
            "score": 0.8558,
            "suggested": true
          },
          {
            "skill_id": "SK-SCM-01",
            "label": "Supply-chain analytics",
            "score": 0.8501,
            "suggested": true
          }
        ]
      },
      {
        "phrase": "kanban ticket triage",
        "intended_skill_id": "SK-JIRA-01",
        "note": "Sprint 2 under-threshold miss: SK-JIRA-01 scored below 0.84; should now reach >= 0.84 for SK-JIRA-01.",
        "before": [
          {
            "skill_id": "SK-JIRA-01",
            "label": "Jira work-item management",
            "score": 0.8062,
            "suggested": false
          },
          {
            "skill_id": "SK-AGL-01",
            "label": "Agile and Scrum practice",
            "score": 0.7975,
            "suggested": false
          },
          {
            "skill_id": "SK-RISK-01",
            "label": "Risk analysis",
            "score": 0.7802,
            "suggested": false
          }
        ],
        "after": [
          {
            "skill_id": "SK-JIRA-01",
            "label": "Jira work-item management",
            "score": 0.859,
            "suggested": true
          },
          {
            "skill_id": "SK-AGL-01",
            "label": "Agile and Scrum practice",
            "score": 0.7975,
            "suggested": false
          },
          {
            "skill_id": "SK-RISK-01",
            "label": "Risk analysis",
            "score": 0.7802,
            "suggested": false
          }
        ]
      },
      {
        "phrase": "agile board hygiene",
        "intended_skill_id": "SK-AGL-01",
        "note": "Regression check: must continue mapping to SK-AGL-01 and SK-JIRA-01 >= 0.84.",
        "before": [
          {
            "skill_id": "SK-AGL-01",
            "label": "Agile and Scrum practice",
            "score": 0.8783,
            "suggested": true
          },
          {
            "skill_id": "SK-JIRA-01",
            "label": "Jira work-item management",
            "score": 0.8583,
            "suggested": true
          },
          {
            "skill_id": "SK-SEC-01",
            "label": "Cybersecurity fundamentals",
            "score": 0.8248,
            "suggested": false
          }
        ],
        "after": [
          {
            "skill_id": "SK-AGL-01",
            "label": "Agile and Scrum practice",
            "score": 0.8783,
            "suggested": true
          },
          {
            "skill_id": "SK-JIRA-01",
            "label": "Jira work-item management",
            "score": 0.8533,
            "suggested": true
          },
          {
            "skill_id": "SK-SEC-01",
            "label": "Cybersecurity fundamentals",
            "score": 0.8248,
            "suggested": false
          }
        ]
      },
      {
        "phrase": "data storytelling for executives",
        "intended_skill_id": "SK-COM-01",
        "note": "Sanity check: presentation / BI communication phrase.",
        "before": [
          {
            "skill_id": "SK-COM-01",
            "label": "Stakeholder communication",
            "score": 0.8398,
            "suggested": false
          },
          {
            "skill_id": "SK-TAB-01",
            "label": "Tableau",
            "score": 0.8362,
            "suggested": false
          },
          {
            "skill_id": "SK-STAT-01",
            "label": "Applied statistics",
            "score": 0.8289,
            "suggested": false
          }
        ],
        "after": [
          {
            "skill_id": "SK-COM-01",
            "label": "Stakeholder communication",
            "score": 0.8398,
            "suggested": false
          },
          {
            "skill_id": "SK-TAB-01",
            "label": "Tableau",
            "score": 0.8362,
            "suggested": false
          },
          {
            "skill_id": "SK-STAT-01",
            "label": "Applied statistics",
            "score": 0.8289,
            "suggested": false
          }
        ]
      }
    ]
  }
};
});
