-- Workspace join codes and invite acceptance.
-- Run this after workforce_schema.sql.

alter table workspaces add column if not exists join_code text;

create unique index if not exists workspaces_join_code_unique
on workspaces(lower(join_code))
where join_code is not null;

create or replace function generate_workspace_join_code()
returns text
language sql
as '
  select upper(substring(encode(gen_random_bytes(8), ''hex'') from 1 for 8));
';

update workspaces
set join_code = generate_workspace_join_code()
where join_code is null;

create or replace function set_workspace_join_code()
returns trigger
language plpgsql
as '
begin
  if new.join_code is null then
    new.join_code = generate_workspace_join_code();
  end if;
  return new;
end;
';

drop trigger if exists workspaces_set_join_code on workspaces;
create trigger workspaces_set_join_code
before insert on workspaces
for each row execute function set_workspace_join_code();

create or replace function regenerate_workspace_join_code(target_workspace_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as '
declare
  next_code text;
begin
  if not has_workspace_role(target_workspace_id, array[''admin'']::workspace_role[]) then
    raise exception ''Only workspace admins can regenerate join codes.'';
  end if;

  next_code = generate_workspace_join_code();
  update workspaces
  set join_code = next_code
  where id = target_workspace_id;

  return next_code;
end;
';

create or replace function join_workspace_with_code(code text)
returns uuid
language plpgsql
security definer
set search_path = public
as '
declare
  target_workspace_id uuid;
begin
  if auth.uid() is null then
    raise exception ''You must be signed in to join a workspace.'';
  end if;

  select id
  into target_workspace_id
  from workspaces
  where lower(join_code) = lower(trim(code))
  limit 1;

  if target_workspace_id is null then
    raise exception ''Invalid workspace join code.'';
  end if;

  insert into workspace_members (workspace_id, user_id, role)
  values (target_workspace_id, auth.uid(), ''technician'')
  on conflict (workspace_id, user_id) do nothing;

  return target_workspace_id;
end;
';

create or replace function accept_invite(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as '
declare
  invite_row invites%rowtype;
begin
  if auth.uid() is null then
    raise exception ''You must be signed in to accept an invite.'';
  end if;

  select *
  into invite_row
  from invites
  where token = invite_token
    and accepted_at is null
    and expires_at > now()
  limit 1;

  if invite_row.id is null then
    raise exception ''Invite is invalid, expired, or already accepted.'';
  end if;

  insert into workspace_members (workspace_id, user_id, role)
  values (invite_row.workspace_id, auth.uid(), invite_row.role)
  on conflict (workspace_id, user_id) do update set role = excluded.role;

  if invite_row.site_id is not null then
    insert into site_members (site_id, user_id, role)
    values (invite_row.site_id, auth.uid(), invite_row.role)
    on conflict (site_id, user_id) do update set role = excluded.role;
  end if;

  update invites
  set accepted_at = now()
  where id = invite_row.id;

  return invite_row.workspace_id;
end;
';
