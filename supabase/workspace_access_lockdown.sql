-- SiteTrack workspace and job-site access lockdown.
-- Run this in Supabase after the workforce and join-code SQL files.
-- This removes the original MVP-wide authenticated policies and makes job-site
-- access explicit: admins see all sites in a workspace, joined users only see
-- sites granted through site_members.
-- Per the security review rule: no client-side trust and no broad authenticated
-- table access. Workspace membership alone is not job-site membership.

alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table site_members enable row level security;
alter table invites enable row level security;
alter table sites enable row level security;
alter table buildings enable row level security;
alter table rooms enable row level security;
alter table assets enable row level security;
alter table asset_photos enable row level security;
alter table asset_logs enable row level security;

drop policy if exists "Authenticated users can manage sites" on sites;
drop policy if exists "Authenticated users can manage buildings" on buildings;
drop policy if exists "Authenticated users can manage rooms" on rooms;
drop policy if exists "Authenticated users can manage assets" on assets;
drop policy if exists "Authenticated users can manage asset photos" on asset_photos;
drop policy if exists "Authenticated users can manage asset logs" on asset_logs;

create or replace function can_access_site(target_site_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as '
  select exists (
    select 1
    from sites
    where sites.id = target_site_id
      and (
        has_workspace_role(sites.workspace_id, array[''admin'']::workspace_role[])
        or exists (
          select 1
          from site_members
          where site_members.site_id = target_site_id
            and site_members.user_id = auth.uid()
        )
      )
  );
';

create or replace function can_admin_site(target_site_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as '
  select exists (
    select 1
    from sites
    where sites.id = target_site_id
      and (
        has_workspace_role(sites.workspace_id, array[''admin'']::workspace_role[])
        or exists (
          select 1
          from site_members
          where site_members.site_id = target_site_id
            and site_members.user_id = auth.uid()
            and site_members.role = ''admin''
        )
      )
  );
';

create or replace function can_edit_assets_on_site(target_site_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as '
  select exists (
    select 1
    from sites
    where sites.id = target_site_id
      and (
        has_workspace_role(sites.workspace_id, array[''admin'']::workspace_role[])
        or exists (
          select 1
          from site_members
          where site_members.site_id = target_site_id
            and site_members.user_id = auth.uid()
            and site_members.role in (''admin'', ''technician'')
        )
      )
  );
';

drop policy if exists "Members can read workspace members" on workspace_members;
drop policy if exists "Admins can manage workspace members" on workspace_members;
drop policy if exists "Users can leave workspace" on workspace_members;
create policy "Members can read own workspace membership"
on workspace_members for select to authenticated
using (user_id = auth.uid() or has_workspace_role(workspace_id, array['admin']::workspace_role[]));
create policy "Admins can manage workspace members"
on workspace_members for all to authenticated
using (has_workspace_role(workspace_id, array['admin']::workspace_role[]))
with check (has_workspace_role(workspace_id, array['admin']::workspace_role[]));
create policy "Users can leave workspace"
on workspace_members for delete to authenticated
using (user_id = auth.uid() and role <> 'admin');

drop policy if exists "Members can read site members" on site_members;
drop policy if exists "Admins can manage site members" on site_members;
drop policy if exists "Users can leave job sites" on site_members;
create policy "Users can read own site memberships"
on site_members for select to authenticated
using (user_id = auth.uid() or can_admin_site(site_id));
create policy "Admins can manage site members"
on site_members for all to authenticated
using (can_admin_site(site_id))
with check (can_admin_site(site_id));
create policy "Users can leave job sites"
on site_members for delete to authenticated
using (user_id = auth.uid());

drop policy if exists "Members can read sites" on sites;
drop policy if exists "Admins can insert sites" on sites;
drop policy if exists "Admins can update sites" on sites;
drop policy if exists "Admins can delete sites" on sites;
create policy "Admins and assigned users can read sites"
on sites for select to authenticated
using (has_workspace_role(workspace_id, array['admin']::workspace_role[]) or can_access_site(id));
create policy "Admins can insert sites"
on sites for insert to authenticated
with check (has_workspace_role(workspace_id, array['admin']::workspace_role[]));
create policy "Admins can update sites"
on sites for update to authenticated
using (can_admin_site(id))
with check (has_workspace_role(workspace_id, array['admin']::workspace_role[]));
create policy "Admins can delete sites"
on sites for delete to authenticated
using (can_admin_site(id));

drop policy if exists "Members can read buildings" on buildings;
drop policy if exists "Admins can manage buildings" on buildings;
create policy "Assigned users can read buildings"
on buildings for select to authenticated
using (can_access_site(site_id));
create policy "Admins can manage buildings"
on buildings for all to authenticated
using (can_admin_site(site_id))
with check (can_admin_site(site_id));

drop policy if exists "Members can read rooms" on rooms;
drop policy if exists "Admins can manage rooms" on rooms;
create policy "Assigned users can read rooms"
on rooms for select to authenticated
using (exists (select 1 from buildings where buildings.id = rooms.building_id and can_access_site(buildings.site_id)));
create policy "Admins can manage rooms"
on rooms for all to authenticated
using (exists (select 1 from buildings where buildings.id = rooms.building_id and can_admin_site(buildings.site_id)))
with check (exists (select 1 from buildings where buildings.id = rooms.building_id and can_admin_site(buildings.site_id)));

drop policy if exists "Members can read assets" on assets;
drop policy if exists "Admins and technicians can insert assets" on assets;
drop policy if exists "Admins and technicians can update assets" on assets;
drop policy if exists "Admins can delete assets" on assets;
create policy "Assigned users can read assets"
on assets for select to authenticated
using (can_access_site(site_id));
create policy "Admins and technicians can insert assets"
on assets for insert to authenticated
with check (can_edit_assets_on_site(site_id));
create policy "Admins and technicians can update assets"
on assets for update to authenticated
using (can_edit_assets_on_site(site_id))
with check (can_edit_assets_on_site(site_id));
create policy "Admins can delete assets"
on assets for delete to authenticated
using (can_admin_site(site_id));

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
  values (target_workspace_id, auth.uid(), ''viewer'')
  on conflict (workspace_id, user_id) do nothing;

  return target_workspace_id;
end;
';

