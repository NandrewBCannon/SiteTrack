-- Required workforce helper functions.
-- Run this if hardening SQL says functions like has_workspace_role() do not exist.
-- This file avoids dollar-quoted strings so it is easier to paste into Supabase.

create or replace function is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as '
  select exists (
    select 1
    from workspace_members
    where workspace_id = target_workspace_id
      and user_id = auth.uid()
  );
';

create or replace function has_workspace_role(target_workspace_id uuid, allowed_roles workspace_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as '
  select exists (
    select 1
    from workspace_members
    where workspace_id = target_workspace_id
      and user_id = auth.uid()
      and role = any(allowed_roles)
  );
';

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

create or replace function can_manage_site_access(target_site_id uuid)
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
            and site_members.role in (''admin'', ''manager'')
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
            and site_members.role in (''admin'', ''manager'', ''technician'')
        )
      )
  );
';
