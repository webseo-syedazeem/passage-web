# Passage Admin client-demo refinement

Completed 7 October 2026 in `D:\1\New folder (34) - Copy\New Folder\webseo\Heaven\passage-web` without rebuilding the application or changing its API architecture.

## Autofill fix and dropdown audit

The affected control was `src/components/shared/SearchPicker.tsx`, used by `CollectionDetail.tsx`. It was already a shadcn/Radix `Popover` with a cmdk `Command`, but the command search text was not controlled at the actual `CommandInput`. That allowed input state to be recreated when the portal opened and left the browser with a generic text field it could classify as ordinary form data.

The search value now lives in controlled React state on `CommandInput`, resets on open, close and selection, and is never registered with React Hook Form. The input has a generated unique `id` and `name`, cmdk's rendered `autocomplete="off"`, `autocorrect="off"`, `autocapitalize="none"`, `spellcheck="false"`, `data-lpignore`, `data-1p-ignore` and `data-form-type="other"`. The trigger and results retain combobox semantics. Login remains deliberately separate with `autocomplete="username"` and `autocomplete="current-password"`.

The collection picker now shows title and a quieter `Mode · Status` metadata row, a selected check, keyboard navigation, Enter selection, Escape close, `No soundscapes found`, selected-item scrolling, internal list scrolling, collision-aware portal placement, trigger-width alignment and viewport-constrained width. Its search is cleared when reopened. The selected title returns to the trigger and existing sort/add behavior is unchanged.

Small finite values use `OptionSelect`, the project's shadcn/Radix Select wrapper: soundscape mode/detail level/status/filter, collection mode/explore group, tag group/state, support type/status. The soundscape relationship uses Popover + Command. No visible native `<select>` remains. Catalogue, collection, remote-config and support search inputs also carry application-search autofill protections; login password-manager behavior remains enabled.

## Login and Passage imagery

`src/pages/Login.tsx` is now a full-viewport Passage login with the real app icon, a restrained translucent panel, clear field and API errors, loading state, password visibility control, strong focus states and responsive spacing. The desktop composition pairs the form with a concise Passage administration message; tablet/mobile keeps the card within the viewport and lets short screens scroll naturally.

The selected source is `Haven/assets/images/downloads-empty-cool-alpine-lake-bg.png`, a dark alpine lake/mountain Passage asset. It was copied to `public/branding/passage-alpine-login-source.png` and genuinely encoded with Sharp at WebP quality 90 to `public/branding/passage-alpine-login.webp`. Both are 940×1672. The PNG is 1,394,940 bytes; the WebP is 75,682 bytes. The source and copied PNG SHA256 hashes match. Runtime code references only the passage-web asset. The image uses cover sizing, a centered 58% vertical position and restrained horizontal/vertical dark overlays.

## Shell and design system

`src/components/layout/Shell.tsx`, shared states, tables, dialogs, media and global tokens were refined. The desktop sidebar has a compact Passage/Admin Portal brand block, Management section, restrained active indicator, aligned icons, administrator identity and logout. Below `lg`, an accessible Radix sheet provides the same navigation, closes on route selection, traps focus and supports Escape. A compact mobile logout remains reachable in the header.

Page headings now share title, description, divider and responsive action layout. Cards use consistent dark surfaces/borders, tables use tighter headers/rows and convert to labeled record cards below `md`, forms collapse to one column, dialogs are constrained to `100svh` with internal scrolling, upload previews/actions fit narrow containers, and status badges use one subdued semantic palette. Soundscape fields remain grouped into Identity & discovery, Artwork & audio, Sound characteristics, and Science, rights & quality. Buttons use one primary/outline/destructive/ghost hierarchy.

The collection assignment area uses a responsive three-part grid: relationship picker, sort order and Add soundscape action on wide screens; all three stack full-width on mobile. Assigned members retain actual backend order and all existing operations.

## Optimistic UI audit

Optimistic hooks live in `src/hooks/optimistic.ts`. Each cancels affected queries, snapshots every affected cache, applies the predictable change, restores the exact snapshot on error with a Sonner message, and invalidates/refetches in the background after settlement.

| Action | Decision | Immediate cache/UI change | Rollback |
|---|---|---|---|
| Soundscape lifecycle status | Optimistic | Update/remove the record in all `soundscapes` caches and update `soundscape/:id` | Restore list/detail snapshots |
| Collection publish/unpublish | Optimistic | Update `collections` rows and `collection/:id` | Restore list/detail snapshots |
| Add existing collection soundscape | Optimistic | Insert the known soundscape at requested/append order and increment list/detail count | Restore exact collection/list snapshots |
| Remove collection soundscape | Optimistic | Remove the row immediately and decrement count | Restore the member at its original order from snapshots |
| Support status | Optimistic | Update detail, cached table row, matching filtered page and open/total summaries | Restore all support page/detail snapshots |
| Collection reorder | Not applicable | No backend reorder endpoint exists | No unsupported client behavior added |
| Authentication | Server-confirmed | Pending sign-in button | Preserve credentials/error state until response |
| Full soundscape/collection saves | Server-confirmed | Pending button; form remains visible | Preserve form values |
| Tag event/revision creation | Server-confirmed | Pending action | Server creates IDs/canonical record |
| Image upload/WebP conversion | Server-confirmed | Uploading state; saved URL remains unchanged until response | Previous saved URL remains |
| Permanent deletes / remote config writes | Server-confirmed | Local action pending | Item changes only after server success |

Pending state is scoped to the affected control. Browser tests prove soundscape status changes before a delayed response, prevent the duplicate action, keep confirmed state, and restore it with a toast on failure. Collection add appears before its delayed response; failed member removal restores the exact row/order. Upload tests prove a delayed upload does not replace the saved URL early.

## Date and time system

`date-fns` 4.4.0 handles parsing, formatting, validation, relative dates and serialization in `src/lib/date.ts`. `react-day-picker` 10.0.2 powers `src/components/ui/calendar.tsx`; reusable `DatePicker`, `DateTimePicker` and `DateRangePicker` components live in `src/components/shared/DatePickers.tsx`.

Display formats are `d MMM yyyy` and `d MMM yyyy, h:mm a`. Timestamps are parsed as instants and displayed in the administrator's local timezone. `YYYY-MM-DD` values are parsed as local calendar values with strict round-trip validation, so release dates do not move across timezones. Date-only API values remain `YYYY-MM-DD`; QA timestamps remain ISO UTC. Empty/malformed values render `—`, never `Invalid Date`.

The Soundscape release date and QA date/time now use shared calendar controls; Support uses one responsive date-range popover. All table/detail timestamps use the same formatter. The final source scan found no user-facing native date/datetime input, `toLocale*`, `Date.parse`, or component-level manual date parsing. The only `new Date` and string slicing used for date work are intentionally centralized inside `src/lib/date.ts`.

## Responsiveness

The automated matrix exercised login plus every route at 1920×1080, 1440×900, 1366×768, 1280×800, 1024×768, 768×1024, 430×932, 390×844, 375×812, 360×800 and short-height landscape 844×390:

- `/soundscapes`, `/soundscapes/new`, `/soundscapes/:id`
- `/collections`, `/collections/new`, `/collections/:id`, `/collections/:id/edit`
- `/remote-config`, `/remote-config/new`, `/remote-config/:key/edit`
- `/support`, `/support/:id`, `/login`, and the not-found route

Every case asserts document/body width stays within the viewport. Tables use stacked labeled cards on mobile; forms become one column; page actions wrap; the sidebar becomes a sheet; dialogs scroll inside the viewport; popovers are collision-aware and viewport-bound; uploads, images, audio and long support/config values stay within local containers. Touch devices receive 44px targets. No major route is desktop-only and no known page-level horizontal overflow remains in the tested matrix.

## Regression and API architecture

Authentication, soundscape CRUD/status/revision/tag history, collection CRUD/publication/membership, Remote Config, Support & Requests, uploads and WebP conversion remain wired to the existing centralized client and TanStack Query. `VITE_API_BASE_URL=http://localhost:3000` remains the only backend origin and Vite has no API proxy. Backend business logic was not changed during this refinement pass. Haven was read only for the background source and was not modified. The legacy admin remains unchanged with SHA256 `7DB52BB188872A54C8521840F17DFDEF2B59D3286FD0F7D6BF5B6382B5575997`.

## Validation

| Check | Result |
|---|---|
| `npm install` | Passed; 289 packages audited, 0 vulnerabilities |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm run build` | Passed; Vite 8.3.3 production build in `dist/` |
| `npm test` | 13/13 passed across 3 files |
| `npm run test:backend` | 7/7 passed |
| Backend `npx tsc --noEmit` | Passed |
| `npm run test:smoke` | 14/14 Chromium workflows passed |
| Required viewport/route matrix | 143 authenticated route cases plus login at all 11 sizes passed |
| Vite dev startup | Passed on `127.0.0.1:5173`, HTTP 200, then stopped cleanly |
| Visual review | Login, desktop lists/forms/picker/support, and mobile layouts reviewed from production-build screenshots |
| Branding/date/select scans | Passed; no Halcyon, visible native select, native date input or ad-hoc display formatter in frontend source |

The local backend was not running during the final live-port check, so authenticated live database writes were not performed. API integration is covered by typed services, seven backend route/controller tests and fourteen browser workflows against contract-faithful mocked responses.

## Git safety

No `git add`, `git commit`, `git reset`, `git restore` or discard command was run. Passage-web changes remain untracked/unstaged in the parent repository and no commit was created. The Backend local repository already contained staged `Controller/AdminImageUpload.ts`, `Controller/AdminSupport.ts` and `Routes/Admin.ts` changes before this continuation; those pre-existing index entries were not staged, unstaged or otherwise modified in this pass. Backend `tests/` remains untracked.
