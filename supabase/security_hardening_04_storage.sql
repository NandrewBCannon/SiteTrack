-- Security hardening step 4: private Supabase Storage policies.

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
