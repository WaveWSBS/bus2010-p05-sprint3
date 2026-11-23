/*
 * P05 AI-Assisted Opportunity Matching — synthetic fixtures (fixtures-1.0)
 * Team 5 · BUS2010 Co-op Platform
 *
 * Everything in this file is SYNTHETIC. People, employers, records and decisions
 * are invented for classroom use. Layla Hassan / COOP-B001 / OP-028 / SK-JIRA-01 /
 * E-JIRA-01 follow the shared demonstration thread in the group binder.
 *
 * Contents
 *   vocabulary  shared controlled skill vocabulary (extends P01/P06 terms)
 *   profiles    P01 fixture: student profile versions (append-only history)
 *   listings    P03 fixture: published listings with their approved version
 *   evidence    P06 fixture: reviewed skill evidence that already exists
 *   dictionary  data dictionary for the fields P05 reads and writes
 *
 * Seeded defects (Appendix 5.3 of the IPP report) are marked "D1".."D8".
 */
(function (root, factory) {
  var data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.P05_DATA = data;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var vocabulary = [
    { skill_id: 'SK-SQL-01', label: 'SQL querying', synonyms: ['sql', 'database queries', 'postgres', 'mysql'] },
    { skill_id: 'SK-PY-01', label: 'Python for data analysis', synonyms: ['python', 'pandas', 'numpy', 'jupyter'] },
    { skill_id: 'SK-PBI-01', label: 'Power BI dashboards', synonyms: ['power bi', 'dax', 'bi dashboards'] },
    { skill_id: 'SK-TAB-01', label: 'Tableau', synonyms: ['tableau', 'data visualisation'] },
    { skill_id: 'SK-XLS-01', label: 'Advanced Excel', synonyms: ['excel', 'spreadsheets', 'pivot tables'] },
    { skill_id: 'SK-STAT-01', label: 'Applied statistics', synonyms: ['statistics', 'regression', 'hypothesis testing'] },
    { skill_id: 'SK-JIRA-01', label: 'Jira work-item management', synonyms: ['jira', 'agile board', 'sprint board', 'scrum board', 'tickets', 'issue tracking', 'kanban', 'kanban board', 'ticket triage'] },
    { skill_id: 'SK-AGL-01', label: 'Agile and Scrum practice', synonyms: ['agile', 'scrum', 'kanban', 'sprint ceremonies', 'board'] },
    { skill_id: 'SK-ML-01', label: 'Machine learning fundamentals', synonyms: ['machine learning', 'scikit-learn', 'classification models'] },
    { skill_id: 'SK-AVN-01', label: 'Aviation operations domain', synonyms: ['aviation', 'airline', 'airport', 'flight operations'] },
    { skill_id: 'SK-SCM-01', label: 'Supply-chain analytics', synonyms: ['supply chain', 'logistics', 'inventory', 'freight'] },
    { skill_id: 'SK-GIS-01', label: 'GIS and spatial analysis', synonyms: ['gis', 'maps', 'spatial analysis', 'qgis'] },
    { skill_id: 'SK-ARB-01', label: 'Professional Arabic', synonyms: ['arabic'] },
    { skill_id: 'SK-COM-01', label: 'Stakeholder communication', synonyms: ['presentation', 'communication', 'reporting'] }
  ];

  function sk(id, source, evidence_id, review_date) {
    return { skill_id: id, source: source, evidence_id: evidence_id || null, review_date: review_date || null };
  }

  // P01 fixture. Each entry is one immutable profile version.
  var profiles = [
    {
      student_id: 'COOP-B001', name: 'Layla Hassan', profile_version: 2, published_at: '2026-10-02',
      change_note: 'First submitted profile',
      goals: 'Learn how airline operations data drives on-time performance.',
      sectors: ['aviation'], roles: ['data analyst'], locations: ['Dubai'], work_arrangements: ['on-site', 'hybrid'],
      availability: { start: '2027-01-15', end: '2027-06-30' },
      skills: [sk('SK-SQL-01', 'reviewed', 'E-SQL-07', '2026-10-12'), sk('SK-PY-01', 'self_declared')],
      unmapped_skills: []
    },
    {
      student_id: 'COOP-B001', name: 'Layla Hassan', profile_version: 3, published_at: '2026-10-21',
      change_note: 'Added Jira and Power BI (self-declared); Python reviewed by P06',
      goals: 'Learn how airline operations data drives on-time performance and build aviation analytics dashboards in Dubai.',
      sectors: ['aviation', 'logistics'], roles: ['data analyst', 'operations analyst'], locations: ['Dubai'],
      work_arrangements: ['on-site', 'hybrid'],
      availability: { start: '2027-01-15', end: '2027-06-30' },
      skills: [
        sk('SK-SQL-01', 'reviewed', 'E-SQL-07', '2026-10-12'),
        sk('SK-PY-01', 'reviewed', 'E-PY-02', '2026-10-15'),
        sk('SK-PBI-01', 'self_declared'),
        sk('SK-JIRA-01', 'self_declared'),
        sk('SK-COM-01', 'self_declared')
      ],
      unmapped_skills: []
    },
    {
      // D1: availability.end is null
      student_id: 'COOP-B002', name: 'Omar Al-Farsi', profile_version: 2, published_at: '2026-10-18',
      change_note: 'Availability end date left blank',
      goals: 'Use data to make freight and airport logistics more reliable.',
      sectors: ['logistics', 'aviation'], roles: ['data analyst'], locations: ['Abu Dhabi', 'Dubai'],
      work_arrangements: ['on-site', 'hybrid'],
      availability: { start: '2027-01-20', end: null },
      skills: [
        sk('SK-SQL-01', 'reviewed', 'E-SQL-11', '2026-10-09'),
        sk('SK-PY-01', 'reviewed', 'E-PY-05', '2026-10-11'),
        sk('SK-XLS-01', 'self_declared'),
        sk('SK-SCM-01', 'reviewed', 'E-SCM-01', '2026-10-14')
      ],
      unmapped_skills: []
    },
    {
      // D2: Jira present but self-declared with no evidence
      student_id: 'COOP-B003', name: 'Mariam Al-Suwaidi', profile_version: 1, published_at: '2026-10-20',
      change_note: 'First submitted profile',
      goals: 'Work on airline network and scheduling analysis.',
      sectors: ['aviation'], roles: ['data analyst'], locations: ['Dubai'], work_arrangements: ['on-site', 'hybrid'],
      availability: { start: '2027-01-10', end: '2027-06-15' },
      skills: [
        sk('SK-SQL-01', 'reviewed', 'E-SQL-14', '2026-10-16'),
        sk('SK-PY-01', 'reviewed', 'E-PY-08', '2026-10-16'),
        sk('SK-JIRA-01', 'self_declared'),
        sk('SK-AVN-01', 'self_declared')
      ],
      unmapped_skills: []
    },
    {
      // D3: free-text skill with no vocabulary term
      student_id: 'COOP-B004', name: 'Arjun Mehta', profile_version: 2, published_at: '2026-10-22',
      change_note: 'Added free-text skill',
      goals: 'Apply machine learning to public-sector open data and city services.',
      sectors: ['public sector', 'technology'], roles: ['data scientist', 'data analyst'], locations: ['Abu Dhabi', 'Remote'],
      work_arrangements: ['hybrid', 'remote'],
      availability: { start: '2027-01-05', end: '2027-05-31' },
      skills: [
        sk('SK-PY-01', 'reviewed', 'E-PY-09', '2026-10-13'),
        sk('SK-ML-01', 'reviewed', 'E-ML-02', '2026-10-17'),
        sk('SK-STAT-01', 'reviewed', 'E-STAT-04', '2026-10-17'),
        sk('SK-GIS-01', 'self_declared')
      ],
      unmapped_skills: ['agile board hygiene']
    },
    {
      // D7: a recommendation is stored at v3, then v4 is published
      student_id: 'COOP-B005', name: 'Noura Al-Hammadi', profile_version: 3, published_at: '2026-10-08',
      change_note: 'First submitted profile',
      goals: 'Build BI dashboards that help hospital and airport operations teams plan capacity.',
      sectors: ['healthcare', 'aviation'], roles: ['BI developer', 'data analyst'], locations: ['Abu Dhabi', 'Dubai'],
      work_arrangements: ['hybrid', 'on-site'],
      availability: { start: '2027-01-10', end: '2027-04-30' },
      skills: [
        sk('SK-PBI-01', 'reviewed', 'E-PBI-03', '2026-10-05'),
        sk('SK-SQL-01', 'reviewed', 'E-SQL-15', '2026-10-05'),
        sk('SK-XLS-01', 'reviewed', 'E-XLS-06', '2026-10-06'),
        sk('SK-TAB-01', 'self_declared')
      ],
      unmapped_skills: []
    },
    {
      student_id: 'COOP-B005', name: 'Noura Al-Hammadi', profile_version: 4, published_at: '2026-11-02',
      change_note: 'Extended availability end date to 2027-06-30',
      goals: 'Build BI dashboards that help hospital and airport operations teams plan capacity.',
      sectors: ['healthcare', 'aviation'], roles: ['BI developer', 'data analyst'], locations: ['Abu Dhabi', 'Dubai'],
      work_arrangements: ['hybrid', 'on-site'],
      availability: { start: '2027-01-10', end: '2027-06-30' },
      skills: [
        sk('SK-PBI-01', 'reviewed', 'E-PBI-03', '2026-10-05'),
        sk('SK-SQL-01', 'reviewed', 'E-SQL-15', '2026-10-05'),
        sk('SK-XLS-01', 'reviewed', 'E-XLS-06', '2026-10-06'),
        sk('SK-TAB-01', 'self_declared')
      ],
      unmapped_skills: []
    },
    {
      // D8: remote-only student against an on-site role
      student_id: 'COOP-B006', name: 'Daniel Okafor', profile_version: 1, published_at: '2026-10-25',
      change_note: 'First submitted profile',
      goals: 'Remote analytics work on airline customer and route data.',
      sectors: ['aviation'], roles: ['data analyst', 'operations analyst'], locations: ['Remote'],
      work_arrangements: ['remote'],
      availability: { start: '2027-01-15', end: '2027-06-30' },
      skills: [
        sk('SK-XLS-01', 'reviewed', 'E-XLS-09', '2026-10-19'),
        sk('SK-PBI-01', 'reviewed', 'E-PBI-07', '2026-10-19'),
        sk('SK-AVN-01', 'self_declared'),
        sk('SK-SQL-01', 'self_declared')
      ],
      unmapped_skills: []
    }
  ];

  function skill(id) { return { kind: 'skill', skill_id: id }; }

  // P03 fixture. P05 may only read versions[approved_version].
  var listings = [
    {
      opportunity_id: 'OP-026', approved_version: 1, listing_status: 'open', closed_on: null,
      versions: {
        1: {
          title: 'Airport Ground Operations Data Intern', employer: 'Gulf Airside Services', city: 'Dubai',
          work_arrangement: 'on-site', start_date: '2027-02-01', end_date: '2027-05-15',
          sector: 'aviation', role_family: 'operations analyst',
          description: 'Analyse turnaround and ground-handling data to find the causes of departure delays at a busy airport.',
          mandatory: [{ kind: 'arrangement', arrangements: ['on-site'], city: 'Dubai' }, { kind: 'availability' }, skill('SK-XLS-01')],
          desirable: [skill('SK-PBI-01'), skill('SK-AVN-01')]
        }
      }
    },
    {
      opportunity_id: 'OP-027', approved_version: 1, listing_status: 'open', closed_on: null,
      versions: {
        1: {
          title: 'Logistics Network Analytics Intern', employer: 'Falcon Freight Logistics', city: 'Abu Dhabi',
          work_arrangement: 'hybrid', start_date: '2027-02-15', end_date: '2027-06-15',
          sector: 'logistics', role_family: 'data analyst',
          description: 'Model freight flows between the port and inland hubs and report on network bottlenecks.',
          mandatory: [skill('SK-SQL-01'), skill('SK-PY-01'), { kind: 'availability' }],
          desirable: [skill('SK-JIRA-01'), skill('SK-SCM-01'), skill('SK-TAB-01')]
        }
      }
    },
    {
      opportunity_id: 'OP-028', approved_version: 2, listing_status: 'open', closed_on: null,
      versions: {
        2: {
          title: 'Aviation Analytics Intern', employer: 'Emirates Group', city: 'Dubai',
          work_arrangement: 'hybrid', start_date: '2027-02-01', end_date: '2027-05-31',
          sector: 'aviation', role_family: 'data analyst',
          description: 'Build on-time performance dashboards from flight operations data and track analytics work items in Jira.',
          mandatory: [skill('SK-SQL-01'), skill('SK-JIRA-01'), { kind: 'availability' }, { kind: 'arrangement', arrangements: ['hybrid', 'on-site'], city: 'Dubai' }],
          desirable: [skill('SK-PBI-01'), skill('SK-PY-01'), skill('SK-AVN-01')]
        }
      }
    },
    {
      // D4: no mandatory conditions
      opportunity_id: 'OP-029', approved_version: 1, listing_status: 'open', closed_on: null,
      versions: {
        1: {
          title: 'Open Data Fellow', employer: 'Oasis Civic Data Lab', city: 'Remote',
          work_arrangement: 'remote', start_date: '2027-01-15', end_date: '2027-04-30',
          sector: 'public sector', role_family: 'data analyst',
          description: 'Clean and publish open city-services datasets and write short analysis notes for residents.',
          mandatory: [],
          desirable: [skill('SK-PY-01'), skill('SK-STAT-01'), skill('SK-GIS-01')]
        }
      }
    },
    {
      // D5: closed listing
      opportunity_id: 'OP-030', approved_version: 1, listing_status: 'closed', closed_on: '2026-11-01',
      versions: {
        1: {
          title: 'Airline Revenue Analytics Intern', employer: 'Skyline Carriers', city: 'Dubai',
          work_arrangement: 'on-site', start_date: '2027-01-15', end_date: '2027-05-15',
          sector: 'aviation', role_family: 'data analyst',
          description: 'Support fare and revenue analysis for regional routes.',
          mandatory: [skill('SK-SQL-01'), { kind: 'availability' }],
          desirable: [skill('SK-PY-01')]
        }
      }
    },
    {
      // D6: fixture still contains superseded version 1
      opportunity_id: 'OP-031', approved_version: 2, listing_status: 'open', closed_on: null,
      versions: {
        1: {
          title: 'Hospital Operations BI Intern', employer: 'Al Noor Health Partners', city: 'Abu Dhabi',
          work_arrangement: 'hybrid', start_date: '2027-02-01', end_date: '2027-05-31',
          sector: 'healthcare', role_family: 'BI developer',
          description: 'Superseded draft. Required Tableau.',
          mandatory: [skill('SK-TAB-01'), { kind: 'availability' }],
          desirable: [skill('SK-XLS-01')]
        },
        2: {
          title: 'Hospital Operations BI Intern', employer: 'Al Noor Health Partners', city: 'Abu Dhabi',
          work_arrangement: 'hybrid', start_date: '2027-02-01', end_date: '2027-05-31',
          sector: 'healthcare', role_family: 'BI developer',
          description: 'Build bed-capacity and clinic-wait dashboards for hospital operations planners.',
          mandatory: [skill('SK-PBI-01'), skill('SK-SQL-01'), { kind: 'availability' }],
          desirable: [skill('SK-XLS-01'), skill('SK-STAT-01')]
        }
      }
    }
  ];

  // P06 fixture: reviewed evidence that already exists (cited by profiles above).
  var evidence = [
    { evidence_id: 'E-SQL-07', student_id: 'COOP-B001', skill_id: 'SK-SQL-01', activity: 'SQL practice set: flight delays', outcome: 'demonstrated', reviewer: 'P06 reviewer (synthetic)', review_date: '2026-10-12' },
    { evidence_id: 'E-PY-02', student_id: 'COOP-B001', skill_id: 'SK-PY-01', activity: 'pandas notebook: on-time performance', outcome: 'demonstrated', reviewer: 'P06 reviewer (synthetic)', review_date: '2026-10-15' },
    { evidence_id: 'E-PBI-03', student_id: 'COOP-B005', skill_id: 'SK-PBI-01', activity: 'Power BI capacity dashboard', outcome: 'demonstrated', reviewer: 'P06 reviewer (synthetic)', review_date: '2026-10-05' }
  ];

  var dictionary = [
    { field: 'student_id', type: 'string', meaning: 'Stable student key, e.g. COOP-B001.', missing: 'Never null. A record without it is rejected at load.' },
    { field: 'profile_version', type: 'integer', meaning: 'Version of the P01 profile snapshot used.', missing: 'If absent the recommendation cannot be reproduced; treated as a load error.' },
    { field: 'skills[].skill_id', type: 'string (vocab)', meaning: 'Term from the shared controlled vocabulary, e.g. SK-JIRA-01.', missing: 'Free-text skills are kept as unmapped and never silently matched.' },
    { field: 'skills[].source', type: 'self_declared | reviewed', meaning: 'Whether a separate evidence review has been recorded.', missing: 'Absent source is treated as self_declared: it can satisfy a preference, never a mandatory condition.' },
    { field: 'skills[].evidence_id', type: 'string | null', meaning: 'Link to the P06 review record.', missing: 'Null is expected; it is what makes a skill self-declared.' },
    { field: 'availability.start / .end', type: 'date | null', meaning: 'Window the student can work.', missing: 'A null date makes the date condition cannot_confirm, never not_met.' },
    { field: 'opportunity_id', type: 'string', meaning: 'Stable listing key, e.g. OP-028.', missing: 'Never null.' },
    { field: 'approved_version', type: 'integer', meaning: 'The version P03 approved for publication.', missing: 'A listing with no approved version is not eligible for recommendation.' },
    { field: 'mandatory[] / desirable[]', type: 'array', meaning: 'Conditions, separated as the employer stated them.', missing: 'An empty mandatory array is legitimate; it never reads as "nothing matched".' },
    { field: 'listing_status', type: 'open | closed | withdrawn', meaning: 'Current state from P03.', missing: 'Anything but open excludes the listing with a stated reason and date.' },
    { field: 'condition_state', type: 'met | not_met | cannot_confirm', meaning: 'Result of evaluating one condition.', missing: 'cannot_confirm is a value, not an absence; the UI never collapses it into a neighbour.' },
    { field: 'recommendation_id', type: 'string', meaning: 'Immutable record key derived from all input versions.', missing: 'A changed input creates a new record; records are never updated in place.' },
    { field: 'method_version', type: 'string', meaning: 'Identifies the scorer and its weights.', missing: 'Without it a changed result cannot be attributed to data or to method.' }
  ];

  return {
    meta: {
      dataset: 'P05 synthetic fixtures',
      fixtures_version: 'fixtures-1.0',
      note: 'All people, employers, records and decisions are invented for classroom use.'
    },
    vocabulary: vocabulary,
    profiles: profiles,
    listings: listings,
    evidence: evidence,
    dictionary: dictionary
  };
});
