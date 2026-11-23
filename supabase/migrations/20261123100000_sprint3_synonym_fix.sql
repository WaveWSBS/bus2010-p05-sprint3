-- Sprint 3 AI synonym correction migration (ai-embed-1.0.0 -> ai-embed-1.1.0)
-- Maintained by Team 5 (P05). Idempotent: safe to re-run.
--
-- Fixes the two documented Sprint 2 free-text skill mapping errors:
--   1. SK-UX-01: add "customer journey", "customer journey mapping", "user journey", "usability research"
--      so UX research phrases no longer misclassify to SK-HLT-01 (Healthcare operations domain).
--   2. SK-JIRA-01: add "kanban", "kanban board", "ticket triage"
--      so "kanban ticket triage" crosses the 0.84 suggestion threshold for Jira work-item management.
--
-- Note: after applying this SQL migration to the shared Supabase project, re-embed skills in
-- public.ai_embeddings (kind = 'skill', model = 'Supabase/gte-small') using Team 5's maintainer key.

update public.skills
set synonyms = (
  select array_agg(distinct s order by s)
  from unnest(synonyms || array['customer journey', 'customer journey mapping', 'user journey', 'usability research']::text[]) as s
)
where skill_id = 'SK-UX-01';

update public.skills
set synonyms = (
  select array_agg(distinct s order by s)
  from unnest(synonyms || array['kanban', 'kanban board', 'ticket triage']::text[]) as s
)
where skill_id = 'SK-JIRA-01';

insert into public.match_methods (method_id, family, label, weights, params, model, notes)
values (
  'ai-embed-1.1.0',
  'ai',
  'AI similarity (gte-small, Sprint 3 synonyms)',
  '{"sector":2,"role":2,"city":1,"desirable_skill":1,"goal_semantic":3,"suggested_skill":0.5}'::jsonb,
  '{"floor":0.82,"ceil":0.90,"suggest_min":0.84,"suggest_top":2,"reason_min_fit":0.5}'::jsonb,
  'Supabase/gte-small',
  'Sprint 3 synonym correction for SK-UX-01 and SK-JIRA-01. Same calibrated cosine thresholds; eligibility still rule-only.'
)
on conflict (method_id) do nothing;
