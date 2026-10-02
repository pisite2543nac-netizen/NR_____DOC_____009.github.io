-- CLEAN V1.5.1 behavior score indexes
create index if not exists clean_behavior_scores_student_idx
on public.clean_behavior_scores(student_id);

create index if not exists clean_behavior_scores_updated_by_idx
on public.clean_behavior_scores(updated_by)
where updated_by is not null;
