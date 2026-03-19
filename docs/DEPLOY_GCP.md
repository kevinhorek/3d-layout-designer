# Deploy on Google Cloud (feature parity with Vercel)

The app is a standard **Next.js 14** Node server. Nothing here is Vercel-specific except your hosting choice.

## What we ship in-repo

| Piece | Purpose |
|--------|--------|
| `output: 'standalone'` in `next.config.js` | Minimal Node bundle for containers. **Vercel ignores** the standalone folder and keeps current behavior. |
| `Dockerfile` | Build & run on **Cloud Run** (or GKE / Cloud Build). |
| `app/api/health/route.ts` | `GET /api/health` for readiness/liveness (excluded from heavy middleware work). |
| `lib/requestOrigin.ts` | Auth redirects use `NEXT_PUBLIC_SITE_URL` or `X-Forwarded-*` (Cloud Load Balancer) so OAuth matches Vercel-style HTTPS URLs. |

## Environment variables (same as Vercel)

Set these in Cloud Run (or Secret Manager → env):

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | For auth / save / share | Same as Vercel |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For auth / save / share | Same as Vercel |
| `NEXT_PUBLIC_SITE_URL` | **Strongly recommended** on GCP | Public URL **without** trailing slash, e.g. `https://layout-designer-xxxxx.run.app`. Stabilizes logout + OAuth callbacks if forwarded headers ever differ. |

Local default remains `http://localhost:3000` when `NEXT_PUBLIC_SITE_URL` is unset.

## Supabase dashboard

For each production URL (Vercel + Cloud Run):

1. **Authentication → URL configuration**  
   - Site URL: your public origin  
   - Redirect URLs: `https://your-gcp-host/auth/callback`, same for Vercel if different host  

2. Same **anon key** and **project URL** as Vercel.

## Cloud Run (quick path)

```bash
# From repo root (Docker uses .dockerignore; excludes mobile/, tests, etc.)
gcloud run deploy 3d-layout-designer \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NEXT_PUBLIC_SUPABASE_URL=...,NEXT_PUBLIC_SUPABASE_ANON_KEY=...,NEXT_PUBLIC_SITE_URL=https://YOUR-SERVICE-URL"
```

Or build the image yourself:

```bash
docker build -t gcr.io/PROJECT/3d-layout-designer .
docker push gcr.io/PROJECT/3d-layout-designer
gcloud run deploy 3d-layout-designer --image gcr.io/PROJECT/3d-layout-designer --region us-central1
```

Cloud Run sets **`PORT`**; the Node server listens on it automatically.

**Health check:** configure the service to use HTTP path **`/api/health`** (optional but recommended).

## Optional: Cloud Build

See `cloudbuild.yaml` for an example pipeline that builds the same `Dockerfile` and pushes to Artifact Registry.

## Parity checklist

- [ ] Same `NEXT_PUBLIC_*` values as Vercel  
- [ ] `NEXT_PUBLIC_SITE_URL` = canonical HTTPS URL users open  
- [ ] Supabase redirect URLs include `/auth/callback` for the GCP hostname  
- [ ] Cloud Run CPU/memory sufficient for Next + Three.js SSR (home page is client-heavy; start with 1 vCPU, 512Mi–1Gi)  

## Expo / `mobile/`

Not included in the Next.js Docker image. Expo web remains `cd mobile && npm run web` or a separate deploy if you host it later.
