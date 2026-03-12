# 3D Layout Designer

Standalone Next.js app for designing and visualizing event layouts in 3D with drag-and-drop furniture placement.

**Extracted from:** [Rams 2.0 prototypes](../prototypes) (previously at `apps/web/app/3d-layout-designer`).

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

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
