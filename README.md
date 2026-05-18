# SiteTrack MVP

A minimalist job-site asset tracking MVP built with Next.js, TypeScript, Tailwind CSS, and Supabase-ready data structures.

## What is included

- Dashboard with quick search, recent changes, and counts
- Sites page for job sites, buildings, and rooms
- Inline editing for building names and room number/name/floor corrections
- Search page for asset number, serial number, item name, building, room, and patching details
- Asset detail page with current location, photos, patching, status, and history log
- Add/edit asset form with unique asset number validation
- CSV export/share for opening in Excel or importing into Google Sheets
- Seeded test data in localStorage for instant testing
- Supabase schema and seed SQL in `supabase/`

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Optionally run `supabase/seed.sql`.
4. Create a storage bucket for asset photos.
5. Add these environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

The current MVP uses localStorage so it works immediately. The Supabase client is ready in `lib/supabase.ts` for the next step: replacing localStore calls with database queries and storage uploads.

## Auth setup

Start with Supabase Email Auth:

1. In Supabase, go to Authentication > Providers.
2. Enable Email.
3. Keep Confirm email on for production-style testing.
4. Add redirect URLs:

```bash
http://localhost:3000/auth/callback
https://your-production-domain.com/auth/callback
```

The app includes:

- `/login` for email/password sign-in and magic links.
- `/signup` for email/password registration.
- `/auth/callback` for Supabase email confirmation and magic-link redirects.
- `/workspace/new` for the first workspace creation step.

## Hosted workforce next step

The first hosted version should move from one local browser store to Supabase workspaces:

1. Run `supabase/schema.sql`.
2. Run `supabase/workforce_schema.sql`.
3. Run the security hardening files in order:
   - `supabase/workforce_required_functions.sql` if Supabase says `has_workspace_role()` or `can_access_site()` does not exist
   - `supabase/security_hardening_01_metadata.sql`
   - `supabase/security_hardening_02_functions.sql`
   - `supabase/security_hardening_03_audit.sql`
   - `supabase/security_hardening_04_storage.sql`
   - `supabase/workspace_join_codes.sql`
   - `supabase/workspace_access_lockdown.sql`
4. Turn on Supabase email auth.
5. Replace `useStoreData()` with Supabase queries scoped to the signed-in user's workspace.
6. Store asset photos in the private `asset-photos` Supabase Storage bucket.
7. Deploy the Next.js app to Vercel with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

The workforce migration adds:

- `workspaces` for companies, crews, or teams.
- `workspace_members` with `admin`, `technician`, and `viewer` roles.
- `site_members` for inviting a user to one specific job site.
- `invites` for email-based workforce/site invitations.
- `workspaces.join_code` plus `/join` for invite links and self-service workspace code joining.
- `workspace_id` on `sites` and `assets`.
- Row-level security so admins control sites/buildings/rooms/users, while technicians can add and update assets.
- Database-level duplicate protection for asset numbers, serial numbers, MAC addresses, IP addresses, switch ports, network patch numbers, site names, and job numbers.

Recommended first production role setup:

| Role | Access |
| --- | --- |
| Admin | Manage workspace, users, sites, buildings, rooms, assets, exports, and deletes |
| Technician | Search/view assigned work, add assets, edit assets, upload photos, create asset logs |
| Viewer | Search and view assigned work only |

## Security hardening

Run `supabase/security_hardening.sql` after the workforce migration. It adds:

- private `asset-photos` Supabase Storage bucket
- storage policies tied to job-site access
- `created_by`, `updated_by`, and `updated_at` metadata
- protected `audit_events` table for app-written change history
- admin-only audit event visibility
- frontend sign-in gate once Supabase keys are configured

Private asset photos should be uploaded with this storage path pattern:

```bash
{workspace_id}/{site_id}/{asset_id}/{filename}
```

The storage policies use the `site_id` segment to decide whether the signed-in user can read, upload, update, or delete the image.

Production security checklist:

- keep the Supabase `service_role` key out of the browser
- enable RLS on every table in exposed schemas
- keep Storage buckets private unless there is a clear public reason
- require MFA for workspace admins once available
- review `audit_events` for admin/member/site/asset changes
- use Vercel environment variables instead of committed `.env.local` values
