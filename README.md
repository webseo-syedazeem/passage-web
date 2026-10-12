# Passage Admin

Standalone React web admin. The original `Backend local/public/admin/index.html` remains the fallback. Mobile sources are unchanged. The refinement adds secured support administration endpoints and strengthens the existing image upload pipeline.

## Run locally

Requires Node 22.12+ and npm. From this directory:

```sh
npm install
# Copy .env.example to .env.local and set your backend origin.
npm run dev
```

Open `http://localhost:5173`. The UI dev server remains on 5173, while browser API calls go directly to `http://localhost:3000` through `VITE_API_BASE_URL`. Start the existing backend separately from `Backend local` with `npm run dev`. Its configured port is 3000; it also needs its existing Supabase configuration and Redis service. Sign in with an existing account whose `users.is_admin` flag is true. No account or database migrations are created by this project.

Authentication is intentionally memory-only, matching the legacy admin. Reloading or logging out ends the frontend session. Tokens never enter localStorage/sessionStorage; expired credentials return to sign-in.

Create `.env.local` using `.env.example`:

```dotenv
VITE_API_BASE_URL=http://localhost:3000
```

This is the only backend configuration variable. It must contain an HTTP(S) origin without `/api`, credentials, query or fragment. Trailing slashes are normalized; missing/invalid configuration raises a clear configuration error. Restart Vite after editing it, and set it before production builds. Never put Supabase service keys or backend secrets in a `VITE_` variable.

Browser requests go directly from the frontend at `http://localhost:5173` to the backend, for example `http://localhost:3000/api/signin`. Backend `CORS_ORIGINS` must include the exact frontend origin (already configured locally). Absolute media URLs stay unchanged; backend-relative artwork, covers, preview clips and audio resolve against the configured backend origin. Both development and preview use this same architecture.

## Workspaces and routes

| Route | Purpose |
|---|---|
| `/login` | Existing account sign-in and admin-access verification |
| `/` | Redirect to soundscapes |
| `/soundscapes` | List, server status filter, search, status updates, revisions and idea-only deletion |
| `/soundscapes/new` | Full metadata create form |
| `/soundscapes/:id` | Full metadata edit, image/audio previews and append-only tag governance |
| `/collections` | List, search, cover, mode/group/order/count, publication controls |
| `/collections/new` | Unpublished collection create and cover upload |
| `/collections/:id` | All-status member assignment/removal with actual membership ordering |
| `/collections/:id/edit` | Collection metadata, cover URL/upload, mode/group/order |
| `/remote-config` | JSON entries and verification status, search and delete |
| `/remote-config/new` | Key-based PUT upsert |
| `/remote-config/:key/edit` | Readonly key, JSON value and verification editing |
| `/support` | Real submissions with server filtering, exact counts and pagination |
| `/support/:id` | Full submission, safe listener context and existing status workflow |
| unmatched paths | Accessible not-found view |

There is no invented dashboard or settings section. Collections have no delete endpoint; unpublish is the available control. Tag events only append; membership order is set when adding (remove/re-add to change it).

## Validation

```sh
npm run typecheck
npm run lint
npm run build
npm test
npx playwright install chromium
npm run test:smoke
npm run test:backend
```

Vitest tests payload/validation boundaries and direct API/media configuration. Playwright exercises catalogue, upload, support, dropdown and responsive workflows with test-only API fixtures. `test:backend` uses the backend's installed dependencies and actual Express routes/auth middleware; Supabase and Redis are mocked. It also uploads actual PNG/JPEG files through Multer and Sharp, then inspects the resulting WebP files in an isolated temporary directory. Production data is never seeded by tests. These checks do not establish authenticated live database CRUD. Backend static check: run `npx tsc --noEmit` from `Backend local`.

## Artwork and support

Soundscape and collection editors share `ImageUpload` and `services/media.ts`. Manual URLs remain editable. JPEG/PNG/WebP uploads must have matching MIME/extension and be at most 5 MiB; the backend also verifies the decoded format, limits decoded images to 40 million pixels, auto-orients, and encodes WebP at quality 90 without resizing/upscaling. Files stay in `Backend local/public/passage_soundscape_images_webp/`. Saving the form applies the returned URL; uploading alone does not change a record.

Support uses the existing `support_requests` table, including its existing additive `reason` column. Apply the repository's normal existing database schema when provisioning an environment; no new migration is introduced here. Types are contact support, soundscape requests and audio problem reports. Statuses are `open`, `in_review`, `resolved`, `closed`.

Admin endpoints: `GET /api/admin/support`, `GET /api/admin/support/:id`, `PUT /api/admin/support/:id/status` with `{ "status": "resolved" }`. All require the existing bearer authentication and `users.is_admin` check. List parameters: `page` (default 1), `page_size` (default 25, max 100), `type`, `status`, `from`, `to` (inclusive UTC calendar dates), `q` (subject/message/submitted email, max 200 characters). Counts reflect the complete filtered result, not just the visible page. List ordering is newest first with ID tie-breaker. Only safe user name/email and soundscape ID/title relationships are selected; no tokens or auth metadata are returned.

The mobile icon source is `Haven/assets/images/passage-brand-assets/icon.png`, as referenced by `expo.icon`. Its identical PNG copy is the favicon; a 128px lossless WebP derivative provides sidebar, login and mobile branding. Assets are bundled locally in `public` with no runtime dependency on Haven.

## Build and later deployment

`npm run build` writes only to `passage-web/dist`. `npm run preview` serves that build locally; it is not a production hosting service.

Safest later deployment: serve `dist` through your web server under a new path such as `/passage-admin/`, retaining `/admin` for the legacy fallback. Build with `npm run build -- --base=/passage-admin/`, then configure SPA fallback within that prefix. Keep backend API/media routes on the configured backend origin. A later minimal Express static mount under a separate prefix is another option; do not replace the existing `/admin` route or assets. Deployment requires a separate change and has not been performed.

For independent static hosting, use SPA fallback and set `VITE_API_BASE_URL` to the backend origin before building; ensure the existing CORS policy permits that origin. Existing uploaded URLs are built from backend `SERVER_URL`, so it must already represent a reachable backend origin in that environment.

## Architecture

- `src/app`, `src/routes`: provider and lazy-loaded routed workspaces.
- `src/components/layout`: responsive Passage sidebar/header and mobile Radix drawer.
- `src/components/ui`: actual shadcn registry components (CLI 4.21.3), Radix primitives and Tailwind styling.
- `src/components/shared`: schema-backed form rendering, image/audio fallback, query states and controlled confirmation dialogs.
- `src/features`: soundscapes, collections, remote config and support with independent forms/pages.
- `src/lib`, `src/services`, `src/hooks`, `src/types`: normalized API errors, exact endpoint services, query invalidation, validation/serialization and contracts.
- `tests`, `src/lib/forms.test.ts`: browser flows and contract checks.

See `../LEGACY_ADMIN_MIGRATION.md` for the complete pre-implementation inventory, backend discrepancies, and final parity table.
See `REFINEMENT_REPORT.md` for the mobile submission trace, changed files and refinement validation results.
