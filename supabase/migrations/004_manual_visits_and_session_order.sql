-- Track whether a visit was manually added (vs recorded by the app)
alter table visits add column manually_added boolean not null default false;

-- Allow manual ordering of sessions (null = use started_at)
alter table sessions add column sort_order integer;
