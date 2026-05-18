# SiteTrack Production Deployment Checklist

## 1. Supabase

- Create or open the production Supabase project.
- Run the SQL files in this order:
  - `supabase/schema.sql`
  - `supabase/workforce_schema.sql`
  - `supabase/workforce_required_functions.sql`
  - `supabase/security_hardening_01_metadata.sql`
  - `supabase/security_hardening_02_functions.sql`
  - `supabase/security_hardening_03_audit.sql`
  - `supabase/security_hardening_04_storage.sql`
  - `supabase/workspace_membership_repair.sql`
  - `supabase/workspace_join_codes.sql`
  - `supabase/workspace_access_lockdown.sql`
- In Authentication > Providers, enable Email.
- In Authentication > URL Configuration, add:
  - `http://localhost:3000/auth/callback`
  - `https://YOUR-VERCEL-DOMAIN.vercel.app/auth/callback`
  - `https://YOUR-CUSTOM-DOMAIN.com/auth/callback` when you add a domain.
- In Storage, confirm the `asset-photos` bucket exists and is private.
- Keep the `service_role` key out of the browser and out of Vercel public env vars.

## 2. Vercel

- Import the project into Vercel from GitHub.
- Framework preset: Next.js.
- Build command: `npm run build`.
- Install command: `npm install`.
- Output directory: leave blank.
- Add environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `NEXT_PUBLIC_SITE_URL`
- Set `NEXT_PUBLIC_SITE_URL` to your live app URL, for example:
  - `https://YOUR-VERCEL-DOMAIN.vercel.app`

## 3. After First Deploy

- Open the Vercel URL.
- Sign up with a test admin account.
- Create a workspace.
- Create a site, building, room, and asset.
- Open `/account` and confirm the workspace join code appears.
- Copy a workspace invite link and test it in a private browser window.
- Add the Vercel callback URL in Supabase if login redirects fail.
- Test on mobile Safari or Chrome, then use Add to Home Screen.

## 4. PWA Checks

- Visit `/manifest.webmanifest` and confirm it returns SiteTrack metadata.
- Visit `/offline.html`.
- On Android Chrome, install from the browser menu.
- On iPhone Safari, use Share > Add to Home Screen.
- Camera capture still requires HTTPS, which Vercel provides automatically.

## 5. Before Inviting Real Users

- Confirm RLS policies are enabled on all production tables.
- Confirm users can only see their workspace data.
- Confirm a technician cannot delete sites/buildings/rooms.
- Confirm asset photos are private.
- Decide whether invites stay as copyable links or are sent through an email provider.
- Add a custom domain before broader rollout.
