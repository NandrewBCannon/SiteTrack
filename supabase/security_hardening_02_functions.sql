-- Security hardening step 2: helper functions and triggers.
-- Important: copy this whole file, including every "$sitetrack$;" closing line.

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
