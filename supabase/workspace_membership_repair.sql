-- Repair workspace admin memberships.
-- Run this if the app says: "No active workspace found."

create or replace function add_workspace_creator_as_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as '
begin
  if new.created_by is not null then
    insert into workspace_members (workspace_id, user_id, role)
    values (new.id, new.created_by, ''admin'')
    on conflict (workspace_id, user_id) do nothing;
  end if;
  return new;
end;
';

drop trigger if exists workspaces_add_creator_as_admin on workspaces;

create trigger workspaces_add_creator_as_admin
after insert on workspaces
for each row execute function add_workspace_creator_as_admin();

insert into workspace_members (workspace_id, user_id, role)
select id, created_by, 'admin'::workspace_role
from workspaces
where created_by is not null
on conflict (workspace_id, user_id) do nothing;
