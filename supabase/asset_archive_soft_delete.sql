alter table public.assets
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users(id) on delete set null,
  add column if not exists archived_reason text;

create index if not exists assets_active_workspace_idx
  on public.assets(workspace_id, updated_at desc)
  where archived_at is null;

create index if not exists assets_archived_workspace_idx
  on public.assets(workspace_id, archived_at desc)
  where archived_at is not null;

create or replace function app_private.assert_asset_archive_admin()
returns trigger
language plpgsql
security definer
set search_path = public, app_private
as $$
begin
  if old.archived_at is distinct from new.archived_at
    or old.archived_by is distinct from new.archived_by
    or old.archived_reason is distinct from new.archived_reason then
    if not app_private.can_admin_site(coalesce(new.site_id, old.site_id)) then
      raise exception 'Only job-site admins can archive or restore assets.' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists assets_archive_admin_guard on public.assets;
create trigger assets_archive_admin_guard
before update of archived_at, archived_by, archived_reason on public.assets
for each row
execute function app_private.assert_asset_archive_admin();

revoke execute on function app_private.assert_asset_archive_admin() from anon, authenticated, public;
