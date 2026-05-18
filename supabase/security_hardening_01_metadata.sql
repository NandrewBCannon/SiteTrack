-- Security hardening step 1: metadata columns.
-- Run after supabase/workforce_schema.sql.

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
