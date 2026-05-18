-- Security hardening for the hosted workforce version of SiteTrack.
-- Run after:
-- 1. supabase/schema.sql
-- 2. supabase/workforce_schema.sql
--
-- This adds private photo storage, audit logging, creator/updater metadata,
-- and stricter RLS around company data.

create extension if not exists "pgcrypto";

alter table sites add column if not exists created_by uuid references auth.users(id) on delete set null default auth.uid();
alter table sites add column if not exists updated_by uuid references auth.users(id) on delete set null;
alter table sites add column if not exists updated_at timestamptz not null default now();

alter table buildings add column if not exists created_by uuid references auth.users(id) on delete set null default auth.uid();
alter table buildings add column if not exists updated_by uuid references auth.users(id) on delete set null;
alter table buildings add column if not exists updated_at timestamptz not null default now();

alter table rooms add column if not exists created_by uuid references auth.users(id) on delete set null default auth.uid();
alter table rooms add column if not exists updated_by uuid references auth.users(id) on delete set null;
alter table rooms add column if not exists updated_at timestamptz not null default now();

alter table assets add column if not exists created_by uuid references auth.users(id) on delete set null default auth.uid();
alter table assets add column if not exists updated_by uuid references auth.users(id) on delete set null;

alter table asset_photos add column if not exists workspace_id uuid references workspaces(id) on delete cascade;
alter table asset_photos add column if not exists site_id uuid references sites(id) on delete cascade;
alter table asset_photos add column if not exists storage_bucket text not null default 'asset-photos';
alter table asset_photos add column if not exists storage_path text;
alter table asset_photos add column if not exists created_by uuid references auth.users(id) on delete set null default auth.uid();

alter table asset_logs add column if not exists workspace_id uuid references workspaces(id) on delete cascade;
alter table asset_logs add column if not exists site_id uuid references sites(id) on delete cascade;
alter table asset_logs add column if not exists created_by uuid references auth.users(id) on delete set null default auth.uid();

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

create or replace function touch_row_security_metadata()
returns trigger
language plpgsql
as $sitetrack$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$sitetrack$;

drop trigger if exists sites_touch_security_metadata on sites;
create trigger sites_touch_security_metadata
before update on sites
for each row execute function touch_row_security_metadata();

drop trigger if exists buildings_touch_security_metadata on buildings;
create trigger buildings_touch_security_metadata
before update on buildings
for each row execute function touch_row_security_metadata();

drop trigger if exists rooms_touch_security_metadata on rooms;
create trigger rooms_touch_security_metadata
before update on rooms
for each row execute function touch_row_security_metadata();

drop trigger if exists assets_touch_security_metadata on assets;
create trigger assets_touch_security_metadata
before update on assets
for each row execute function touch_row_security_metadata();

create or replace function copy_photo_security_scope()
returns trigger
language plpgsql
as $sitetrack$
begin
  select assets.workspace_id, assets.site_id
  into new.workspace_id, new.site_id
  from assets
  where assets.id = new.asset_id;

  if new.storage_path is null and new.photo_url like 'asset-photos/%' then
    new.storage_path = replace(new.photo_url, 'asset-photos/', '');
  end if;

  return new;
end;
$sitetrack$;

drop trigger if exists asset_photos_copy_security_scope on asset_photos;
create trigger asset_photos_copy_security_scope
before insert or update of asset_id, photo_url, storage_path on asset_photos
for each row execute function copy_photo_security_scope();

create or replace function copy_log_security_scope()
returns trigger
language plpgsql
as $sitetrack$
begin
  select assets.workspace_id, assets.site_id
  into new.workspace_id, new.site_id
  from assets
  where assets.id = new.asset_id;

  new.created_by = coalesce(new.created_by, auth.uid());
  return new;
end;
$sitetrack$;

drop trigger if exists asset_logs_copy_security_scope on asset_logs;
create trigger asset_logs_copy_security_scope
before insert or update of asset_id on asset_logs
for each row execute function copy_log_security_scope();

create or replace function safe_uuid(value text)
returns uuid
language plpgsql
immutable
as $sitetrack$
begin
  return value::uuid;
exception
  when others then
    return null;
end;
$sitetrack$;

create or replace function audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $sitetrack$
declare
  target_workspace_id uuid;
  target_site_id uuid;
  target_record_id uuid;
  row_data jsonb;
begin
  if TG_OP = 'DELETE' then
    row_data = to_jsonb(old);
  else
    row_data = to_jsonb(new);
  end if;

  if TG_TABLE_NAME = 'sites' then
    target_workspace_id = safe_uuid(row_data->>'workspace_id');
    target_site_id = safe_uuid(row_data->>'id');
    target_record_id = target_site_id;
  elsif TG_TABLE_NAME = 'buildings' then
    select sites.workspace_id, sites.id
    into target_workspace_id, target_site_id
    from sites
    where sites.id = safe_uuid(row_data->>'site_id');
    target_record_id = safe_uuid(row_data->>'id');
  elsif TG_TABLE_NAME = 'rooms' then
    select sites.workspace_id, sites.id
    into target_workspace_id, target_site_id
    from buildings
    join sites on sites.id = buildings.site_id
    where buildings.id = safe_uuid(row_data->>'building_id');
    target_record_id = safe_uuid(row_data->>'id');
  elsif TG_TABLE_NAME = 'assets' then
    target_workspace_id = safe_uuid(row_data->>'workspace_id');
    target_site_id = safe_uuid(row_data->>'site_id');
    target_record_id = safe_uuid(row_data->>'id');
  elsif TG_TABLE_NAME in ('asset_photos', 'asset_logs') then
    select assets.workspace_id, assets.site_id
    into target_workspace_id, target_site_id
    from assets
    where assets.id = safe_uuid(row_data->>'asset_id');
    target_record_id = safe_uuid(row_data->>'id');
  elsif TG_TABLE_NAME in ('workspace_members', 'invites') then
    target_workspace_id = safe_uuid(row_data->>'workspace_id');
    target_record_id = safe_uuid(row_data->>'id');
  elsif TG_TABLE_NAME = 'site_members' then
    select sites.workspace_id, sites.id
    into target_workspace_id, target_site_id
    from sites
    where sites.id = safe_uuid(row_data->>'site_id');
    target_record_id = safe_uuid(row_data->>'id');
  end if;

  insert into audit_events (
    workspace_id,
    site_id,
    actor_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data
  )
  values (
    target_workspace_id,
    target_site_id,
    auth.uid(),
    lower(TG_OP),
    TG_TABLE_NAME,
    target_record_id,
    case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  if TG_OP = 'DELETE' then
    return old;
  end if;
  return new;
end;
$sitetrack$;

drop trigger if exists sites_audit on sites;
create trigger sites_audit after insert or update or delete on sites for each row execute function audit_row_change();

drop trigger if exists buildings_audit on buildings;
create trigger buildings_audit after insert or update or delete on buildings for each row execute function audit_row_change();

drop trigger if exists rooms_audit on rooms;
create trigger rooms_audit after insert or update or delete on rooms for each row execute function audit_row_change();

drop trigger if exists assets_audit on assets;
create trigger assets_audit after insert or update or delete on assets for each row execute function audit_row_change();

drop trigger if exists asset_photos_audit on asset_photos;
create trigger asset_photos_audit after insert or update or delete on asset_photos for each row execute function audit_row_change();

drop trigger if exists asset_logs_audit on asset_logs;
create trigger asset_logs_audit after insert or update or delete on asset_logs for each row execute function audit_row_change();

drop trigger if exists workspace_members_audit on workspace_members;
create trigger workspace_members_audit after insert or update or delete on workspace_members for each row execute function audit_row_change();

drop trigger if exists site_members_audit on site_members;
create trigger site_members_audit after insert or update or delete on site_members for each row execute function audit_row_change();

drop trigger if exists invites_audit on invites;
create trigger invites_audit after insert or update or delete on invites for each row execute function audit_row_change();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'asset-photos',
  'asset-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Members can read private asset photos" on storage.objects;
drop policy if exists "Asset editors can upload private photos" on storage.objects;
drop policy if exists "Asset editors can update private photos" on storage.objects;
drop policy if exists "Admins can delete private photos" on storage.objects;

create policy "Members can read private asset photos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'asset-photos'
  and can_access_site(safe_uuid(split_part(name, '/', 2)))
);

create policy "Asset editors can upload private photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'asset-photos'
  and can_edit_assets_on_site(safe_uuid(split_part(name, '/', 2)))
);

create policy "Asset editors can update private photos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'asset-photos'
  and can_edit_assets_on_site(safe_uuid(split_part(name, '/', 2)))
)
with check (
  bucket_id = 'asset-photos'
  and can_edit_assets_on_site(safe_uuid(split_part(name, '/', 2)))
);

create policy "Admins can delete private photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'asset-photos'
  and can_admin_site(safe_uuid(split_part(name, '/', 2)))
);

alter table audit_events enable row level security;

drop policy if exists "Admins can read audit events" on audit_events;
drop policy if exists "System can insert audit events" on audit_events;
create policy "Admins can read audit events"
on audit_events
for select
to authenticated
using (has_workspace_role(workspace_id, array['admin']::workspace_role[]));

create policy "System can insert audit events"
on audit_events
for insert
to authenticated
with check (actor_id = auth.uid());

revoke all on audit_events from anon;
grant select on audit_events to authenticated;

