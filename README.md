# 3D Layout Designer

Standalone Next.js app for designing and visualizing event layouts in 3D with drag-and-drop furniture placement.

**Extracted from:** [Rams 2.0 prototypes](../prototypes) (previously at `apps/web/app/3d-layout-designer`).

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy (Vercel and Google Cloud)

- **Vercel:** connect the repo as today; env vars match `.env.local.example`.
- **Google Cloud Run:** use the included `Dockerfile` (Next.js `standalone` build). Vercel is unchanged—the standalone output is unused on Vercel’s platform. See **[docs/DEPLOY_GCP.md](docs/DEPLOY_GCP.md)** for env vars, Supabase redirect URLs, and health checks (`GET /api/health`).

## Save, share, and live collaboration (Supabase)

To enable cloud save, version history, share links, and live collaboration:

1. Create a [Supabase](https://supabase.com) project.
2. Copy `.env.local.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. In the Supabase SQL editor, run the migrations in order:
   - `supabase/migrations/001_initial.sql`
   - `supabase/migrations/002_templates_and_comments.sql`
   - `supabase/migrations/003_venues.sql`
   - `supabase/migrations/004_seed_venues.sql`
   - `supabase/migrations/005_comments_by_share_token.sql` (lets shared editors with edit access view and add notes)
4. In Supabase Dashboard → Authentication → Providers, enable **Email** (and optionally confirm email).

Then:

- **Sign in** (top-right menu → “Sign in to save & share”) to create an account.
- **Save** stores the current layout to the cloud and creates a “My layouts” entry.
- **My layouts** (menu) lists your saved layouts with venue/location names; open one to continue editing. **Sign out** is available from the menu or the My layouts page.
- **Share link** (menu when a layout is saved) creates a link you can send to clients; they open `/s/<token>` and can view or edit depending on the permission you chose.
- **Version history** (menu when a layout is saved) lists snapshots; use **Restore** to roll back, or **Save new version** to create a checkpoint.
- **Templates**: save the current layout as a template (menu → Save as template). When you start a **New layout** (`/?new=1`), you can pick “Start from scratch” or a saved template.
- **Notes**: on a saved layout, open **Notes** from the menu to view and add notes; you can delete notes (owner: any, shared editor: own). Shared editors with **edit** access can also view and add notes.
- **Venues**: venues and locations are loaded from the database when available (after migration 003 + 004); the app falls back to built-in venue data otherwise.
- **Live collaboration**: everyone with the same layout open (owner or shared link) sees presence (“X viewing”) and receives updates every few seconds so edits sync in real time.

Without Supabase configured, the app still runs: layouts are saved only to the browser (localStorage) and the in-URL share (copy link) still works for one-time sharing.

## Build

```bash
npm run build
npm start
```

## E2E tests

```bash
npm run test:e2e
```

Starts the dev server and runs Playwright smoke tests (home, login, layouts). Use `npm run test:e2e:ui` for the interactive UI.

## Expo mobile app (iOS / Android / web)

The `mobile/` folder is the React Native (Expo) layout designer. **Web** runs in the browser with WebGL (`@react-three/fiber`); iOS/Android still use expo-gl.

```bash
cd mobile && npm install
npm run web
```

Opens the dev server (often **http://localhost:8081**). From the Expo dev tools you can also press **w** after `npm start` to open web.

From the repo root:

```bash
npm run mobile:web
```

Static web export: `cd mobile && npx expo export --platform web` → output in `mobile/dist/`.

## Merging back into the prototypes repo

To bring this app back under `apps/web`:

1. Copy this project’s app and public assets into the web app:
   - `app/page.tsx` → `apps/web/app/3d-layout-designer/page.tsx`
   - `app/layout.tsx` → `apps/web/app/3d-layout-designer/layout.tsx`
   - `app/Scene3D.tsx` → `apps/web/app/3d-layout-designer/Scene3D.tsx`
   - `app/layout-designer.css` → `apps/web/app/3d-layout-designer/layout-designer.css`
   - `public/images/3d-layout-designer/` → `apps/web/public/images/3d-layout-designer/`
   - `public/manifest.json` → `apps/web/public/manifest-3d-designer.json` (and set `scope` / `start_url` to `/3d-layout-designer`)

2. In `apps/web/app/3d-layout-designer/layout.tsx`, set `manifest: '/manifest-3d-designer.json'`.

3. In `apps/web/app/3d-layout-designer/page.tsx`, the panorama path is already `/images/3d-layout-designer/panorama.jpg`; no change needed if you keep that path under `public`.

4. Ensure `apps/web` has dependencies: `three`, `@react-three/fiber`, `@react-three/drei`.

The prototypes repo already has those dependencies; only the route and manifest paths need to match the web app’s structure.
