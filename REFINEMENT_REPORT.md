# Passage admin refinement — 6 October 2026

This pass refines the existing application. It does not replace the original migration. Production support screens request actual backend data; the example records used for screenshots exist only in browser tests.

## API architecture

- Changed `vite.config.ts`, `.env.example`, local `.env.local`, `src/lib/config.ts`, `src/lib/api.ts`, README and tests. Removed the obsolete forwarding verification script.
- Vite development and preview forwarding are removed. The former duplicate backend-target environment setting is removed. The only backend origin is `VITE_API_BASE_URL=http://localhost:3000`.
- Config is read once, rejects missing/invalid origins, credentials, paths, query strings and fragments, and normalizes trailing slashes. Requests go directly to e.g. `http://localhost:3000/api/signin` and `/api/admin/support`.
- All auth, catalogue, support and upload operations use the centralized client. Backend-relative covers/artwork/audio resolve against that same origin; absolute HTTP(S) URLs remain unchanged.
- No CORS changes: existing backend `CORS_ORIGINS` already includes `http://localhost:5173`. Live OPTIONS verification returned HTTP 204, that exact allowed origin and the requested authorization header.

## Passage icon and visual system

- `Haven/app.json` → `expo.icon` → `Haven/assets/images/passage-brand-assets/icon.png`. `app.config.js` does not override it. The adaptive icon is a separate mobile asset, not the web brand source.
- Copied unchanged to `passage-web/public/passage-icon.png`; both SHA256 hashes are `01521BF0C8B30128F5BD27714525F711B4F80EA9DBB8E3C0ED7F95D97364FDA5`.
- Added a 128×128 lossless WebP derivative at `public/passage-icon.webp`, used by `BrandIcon` on login, desktop sidebar, mobile drawer/header. PNG favicon uses Vite's configured base path. The web app has no runtime reference to Haven.
- Retained charcoal surfaces, warm champagne accents, readable typography, bordered panels, controlled destructive dialogs and Sonner notifications. Sidebar includes the actual support workspace; mobile header is compact.
- Tables retain all columns on desktop and display labeled stacked records on mobile. Soundscape forms group every legacy field into Identity & discovery, Artwork & audio, Sound characteristics, and Science, rights & quality. The supported preview URL remains in addition to the 31 legacy fields.
- Replaced native dropdown rendering with shadcn/Radix Select for soundscape mode/detail level, lifecycle filter/row controls, collection mode/explore group, tag group/state, and new support filters/status. Collection assignment uses shadcn Popover + Command with search, selected state and keyboard navigation. Radix's hidden native selects exist only for form interoperability.

## Shared artwork upload

Inspected collection editor → catalogue upload service → secured `/api/admin/upload-image` → `Controller/AdminImageUpload.ts` → existing public image directory. The original controller already used Multer memory storage, Sharp, sanitized unique names and genuine WebP encoding; its quality was 100.

- `src/components/shared/ImageUpload.tsx` and `src/services/media.ts` now serve both editors. The former duplicate collection-specific upload service was removed.
- Soundscape uploads fill `artwork_url`; collection uploads fill `cover_image_url`. Existing/manual URLs remain editable. Previews update on success; errors/loading are visible, replacement files are supported, and save is disabled during upload. Saving the form applies the returned URL.
- Existing admin authentication and authorization still protect uploads. Accepted formats: JPEG (`jpg`/`jpeg`), PNG, WebP. Maximum file size: 5 MiB.
- Backend checks MIME/extension and decoded content agreement; rejects corrupt images, disguised SVG/non-images and oversized files. Decoded input is limited to 40 million pixels. Sharp auto-orients and encodes WebP at quality 90 without resizing or upscaling.
- Storage remains `Backend local/public/passage_soundscape_images_webp/`. Names use sanitized source basename + timestamp + UUID + `.webp`; exclusive writes prevent collisions. No existing media was moved/deleted.
- `createAdminImageHandler` accepts a server-side directory parameter solely to test the same handler in isolated temporary storage; no request field controls storage paths.

Actual multipart HTTP upload verification used real Multer/Sharp/controller/filesystem handling (authentication/Supabase mocked). The stored bytes were decoded again using Sharp:

| Original input | Output extension | Detected output format | Dimensions | Stored bytes |
|---|---|---|---|---|
| PNG | `.webp` | WebP | 320×180 | 190 |
| JPEG | `.webp` | WebP | 320×180 | 188 |

## Actual mobile submission audit

Searched the mobile route tree, components, API modules and hooks for support/contact/request/report/feedback/issue/help/message/submit. Three submission forms exist; no extra feedback or generic issue category was invented.

| Mobile route / source | Hook → mobile API | Backend route → controller | Existing storage and actual fields |
|---|---|---|---|
| `/profile/contact-support`, `Haven/app/profile/contact-support.tsx` | `useContactSupport` → `supportApi.contact` | POST `/api/support/contact` → `ContactSupport` in `Controller/Support.ts` | `support_requests`, type `contact_support`; optional subject, required message, optional contact_email, resolved user_id, timestamps, existing status |
| `/profile/request-soundscape`, `Haven/app/profile/request-soundscape.tsx` | `useRequestSoundscape` → `supportApi.requestSoundscape` | POST `/api/support/request-soundscape` → `RequestSoundscape` | Same table, type `request_soundscape`; required message, optional contact_email, user_id, timestamps/status. Selected modes are appended to the message, not separate database columns. |
| `/profile/report-problem`, `Haven/app/profile/report-problem.tsx` | `useReportAudioProblem` → `supportApi.reportAudioProblem` | POST `/api/support/report-audio-problem` → `ReportAudioProblem` | Same table, type `report_audio_problem`; soundscape_id, message, optional contact_email, user_id; controller derives subject from soundscape title. Existing optional reason column is supported by backend; current mobile app embeds its selected reasons in message. |

Shared mobile sources: `Haven/hooks/useSupport.ts`, `Haven/lib/api/support.ts`. Backend registrations: `Backend local/Routes/Support.ts`. Schema: `Database/support_requests_schema.sql`; existing additive reason column: `Database/backend_gaps_additive_columns.sql`; existing timestamp trigger: `Database/add_updated_at_triggers.sql`.

Actual mobile screens use `RequireAuth`; backend submission endpoints retain their existing optional-auth/guest-email behavior. Authenticated user IDs are resolved from `users.auth_user_id`; guest contact email is required by backend. Contact message limit is 2,000 characters and subject 120 in mobile; request description 1,000; report details 2,000. Report reasons and modes are preserved as message text, not parsed into invented fields.

Other entry points: profile/contact; help index links to the three forms; help article contact link; soundscape detail/player report links; empty library prefilled soundscape request. Help articles themselves are read-only. Existing `GET /api/support/my-requests` / `useMySupportRequests` retrieves the signed-in user's records, not an additional submission type.

## Support backend and administration UI

New `Controller/AdminSupport.ts`, registered in `Routes/Admin.ts`:

| Method | Endpoint | Behavior |
|---|---|---|
| GET | `/api/admin/support` | Validated filtering, pagination and exact counts over existing rows |
| GET | `/api/admin/support/:id` | One record with safe listener and soundscape context |
| PUT | `/api/admin/support/:id/status` | Updates only existing status and updated_at fields |

All three use existing `AuthMiddleware` then `AdminAuthMiddleware` (`users.is_admin === true`). No public support-data endpoint, analytics logging, full-message logging or duplicate table was added. User projection is only ID/name/email; soundscape projection is ID/title. Missing records return 404, invalid IDs/query/status 400, unauthorized 401/403, database failures a generic 500.

List query: `page` defaults 1; `page_size` defaults 25 and is bounded 1–100; optional actual type/status; inclusive `from`/`to` UTC dates; `q` searches subject/message/submitted contact_email (max 200 characters). Dates, enums, scalar query shape and ranges are validated. Search values are quoted/escaped for PostgREST. Ordering is created_at descending then ID descending. Summary counts apply all active filters across all pages. No new schema or mobile API contract changes.

New frontend routes `/support` and `/support/:id`; navigation label **Support & Requests**. Independent typed services and TanStack queries provide:

- Exact matching/open/type counts; type/status/date/search filters; server pagination.
- Submission category/subject, listener name/email, linked soundscape, status, submitted time and detail action.
- Full message, stored reason when present, safe account/submitted email context, request reference, created/updated timestamps, soundscape link.
- Status editing using only `open`, `in_review`, `resolved`, `closed`, with mutation feedback/cache invalidation.
- Loading skeletons, retryable errors, empty results and session expiry handling. No production fixture records or invented counts.

## Regression and scope

| Existing feature | React location | Refinement status |
|---|---|---|
| In-memory login/logout, admin verification, expired sessions | `app/Auth`, `pages/Login`, `lib/api` | Preserved; direct backend requests |
| Soundscape list/search/server status filter | `features/soundscapes/SoundscapeList` | Preserved; improved controls/table |
| All 31 metadata fields plus supported preview URL | `SoundscapeEditor`, `lib/forms` | Preserved and grouped |
| Lifecycle updates, revision creation, idea-only delete and confirmations | `SoundscapeList` | Preserved |
| Tag-event history/create with original payload semantics | `TagEvents` | Preserved; Radix option controls |
| Artwork/manual URLs, full/preview audio and broken-media handling | `SoundscapeEditor`, shared media | Preserved; shared upload added |
| Collection list/search/counts/publication | `CollectionList` | Preserved |
| Slug/title/mode/explore group/description/cover/sort order | `CollectionEditor` | Preserved; shared upload |
| All-status ordered member assignment/removal | `CollectionDetail` | Preserved; searchable keyboard picker |
| Collection deletion | No existing endpoint | Not applicable; no unsupported action added |
| Remote config list/search/upsert/JSON/null/verification/delete | `features/remote-config` | Preserved |
| Dialogs, toasts, loading/error/empty states, mobile drawer | Shared components | Preserved/refined |

Backend changes are limited to the two admin controllers, admin route registration and focused tests. Haven, legacy admin, existing mobile API contracts and database schema were not modified. No deployment was performed; normal output remains `passage-web/dist/`. For later deployment, serve this build with SPA fallback at a separate location and configure the backend origin/CORS; retain `/admin` as fallback.

Legacy file remains intact with SHA256 `7DB52BB188872A54C8521840F17DFDEF2B59D3286FD0F7D6BF5B6382B5575997`. Visible branding is Passage, using the actual mobile icon; no old placeholder brand was introduced.

## Validation

| Check | Final result |
|---|---|
| `npm install` | Passed; 285 packages audited, zero reported vulnerabilities |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm run build` | Passed; normal `dist/` output |
| `npm test` | 10 tests passed (legacy payloads/validation and direct API/media configuration) |
| `npm run test:backend` | 7 tests passed (actual admin middleware/routes with mocked Supabase/Redis, real multipart image encoding/storage) |
| Backend `npx tsc --noEmit` | Passed |
| `npm run test:smoke` | All 11 production-build Chromium workflows passed |
| Existing Vite development server | HTTP 200 on port 5173 |
| Live local support authorization | List/detail returned 401 without credentials |
| Live direct-request CORS preflight | HTTP 204; allowed origin `http://localhost:5173` |
| Legacy/icon integrity and branding scan | Passed; legacy and mobile unchanged, copied icon hash matches, no old branding/native select JSX/obsolete configuration references in frontend source |

Tests do not write live support records or catalogue data. Browser tests build and start an isolated production preview on port 4173, leaving the user's development server untouched. Production-build browser screenshots are saved in `test-results/visual-*.png` and reviewed directly, covering login, catalogue lists/editors, member picker, support list/detail and mobile layouts. Browser fixtures are separate from production data, and the test suite asserts requests target the backend origin directly.

Live local backend/Redis were running at final verification. Live support list/detail without credentials returned 401; CORS preflight returned 204 with the correct frontend origin. Authenticated live database operations were not exercised because no admin session was supplied. This is an authentication/integration verification limit, not a current Redis outage.

No `git add`, `git commit`, reset, restore or discard commands were executed by this agent. An external index change was observed during final verification: four backend files were staged. That existing staging was left untouched; the agent did not stage or unstage them. Unrelated changes were preserved.
