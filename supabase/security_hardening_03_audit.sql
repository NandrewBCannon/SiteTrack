-- Security hardening step 3: protected audit event table.
-- This version intentionally avoids trigger functions so it is easy to run in
-- the Supabase SQL editor. Automated audit triggers can be added later.

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  site_id uuid references sites(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null default auth.uid(),
  action text not null,
  table_name text not null,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_events_workspace_id_idx on audit_events(workspace_id);
create index if not exists audit_events_site_id_idx on audit_events(site_id);
create index if not exists audit_events_actor_id_idx on audit_events(actor_id);
create index if not exists audit_events_created_at_idx on audit_events(created_at desc);

alter table audit_events enable row level security;

drop policy if exists "Admins can read audit events" on audit_events;
drop policy if exists "Authenticated users can insert own audit events" on audit_events;

create policy "Admins can read audit events"
on audit_events
for select
to authenticated
using (has_workspace_role(workspace_id, array['admin']::workspace_role[]));

create policy "Authenticated users can insert own audit events"
on audit_events
for insert
to authenticated
with check (
  actor_id = auth.uid()
  and (
    has_workspace_role(workspace_id, array['admin', 'technician']::workspace_role[])
    or can_access_site(site_id)
  )
);

revoke all on audit_events from anon;
grant select, insert on audit_events to authenticated;
