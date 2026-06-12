# Session Log

Running log of what was done in each working session on Lumina Wedding Studio.
Newest session first. Keep entries short: what changed, why, and anything left open.

---

## 2026-06-12 (later) — CI/CD + Android packaging

- `Dockerfile` (multi-stage) + `.dockerignore` for Cloud Run; `server.ts` now reads
  `$PORT` and lazy-imports vite (prod bundle smoke-tested: health + static OK).
- GitHub Actions: `ci.yml` (tsc + build on PR/main), `deploy-cloud-run.yml`
  (Docker → Artifact Registry → Cloud Run, WIF auth, runtime secrets from Secret
  Manager), `android-build.yml` (APK on manual run / `v*` tag; signed release if
  keystore secrets set, else debug; artifact + GitHub release upload).
- `android/app/build.gradle`: release signing config via `android/key.properties`
  or `ANDROID_KEYSTORE_*` env vars. `.gitignore`: keystores/key.properties.
- `DEPLOYMENT.md`: full GCP one-time setup (gcloud commands), GitHub secrets list,
  keystore generation, local APK build, Play Store/AAB + versionCode notes.
- Open: user must run the GCP setup, add GitHub secrets, generate keystore, set
  `VITE_API_BASE_URL` secret after first deploy. Workflows untested until pushed.

---

## 2026-06-12 — Bug fixes (DB deletes, Google Calendar writes) + UI pass

**Reported bugs fixed:**
- Deletes never reached Supabase — supabase-js queries are lazy and were never awaited
  (`handleDeleteWedding`, `handleDeleteGoogleEvent`, `handleResetData` in `src/App.tsx`).
  All writes now awaited with error logging.
- Google Calendar was read-only — scope upgraded `calendar.readonly` → `calendar.events`;
  app now creates/deletes/updates events on Google (new `src/lib/googleCalendar.ts`).

**Other fixes/features this session:**
- Demo data: seeded into DB once per account (localStorage flag `lumina_seeded_<userId>`),
  fresh UUIDs per user — was resurrecting on every empty read with shared ids `w-1..w-7`.
- Native-safe shared Google sign-in helper (`src/lib/googleAuth.ts`) — sync re-auth used
  a web-only flow that broke in the Android WebView.
- Sync reconciliation: stale synced rows deleted from DB; local-only `g-custom-*` blocks kept.
- Google token auto-refresh: new `POST /api/google/refresh` in `server.ts` (needs
  `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` env vars = same OAuth client as in Supabase);
  client captures `provider_refresh_token`; `runGoogleApi` wrapper retries once after refresh.
- Weddings mirrored to Google Calendar (create/update/delete, 8h events, id stored in
  `weddings."googleEventId"`); sync filters them out to avoid duplicates.
- `sync_email` persisted to `user_preferences` (debounced).
- UI: toast system replacing `alert()`s; real date-availability check on New Wedding form
  (was hardcoded "No Conflicts"); defined missing CSS (`animate-fade-in`, `animate-slide-up`,
  `no-scrollbar`, `pb-safe`); fixed ~20 invalid Tailwind shades (`zinc-150`, `zinc-850`,
  `blue-355`, …); fixed Wedding Album checkbox className bug; de-hardcoded "June Overview"
  + featured wedding; branded loading splash; bell button shows real status.
- Added `src/vite-env.d.ts` (fixed pre-existing `import.meta.env` type errors).
- Dark-mode fix: `text-on-surface` (near-black) was used without a `dark:` variant on the
  "Log Google Busy Block" form controls (CalendarView), the Weddings search/filter inputs,
  and the AI response panel (WeddingBoardModal) — dark text on dark backgrounds. Added
  `dark:text-zinc-100` (+ placeholder colors and `dark:[color-scheme:dark]` for native
  date/time picker icons).

**User actions completed:** ran `supabase-schema-updates.sql` items 1–2 (`googleEventId`,
`sync_email` columns). Env entries appended to `.env` (values to be filled by user).

**Open items / not done:**
- User still needs to fill `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` values in `.env`
  and on the deployed server, then sign out/in once (new scope + refresh token).
- `supabase-schema-updates.sql` items 3–4 (composite PKs, RLS) are recommended but not
  applied — composite PK requires changing upsert `onConflict: 'id'` → `'user_id,id'` in App.tsx.
- Settings price changes are in-memory only (reset on reload).
- Contract upload is a mock; Contracts/Invoices quick actions are placeholders.
- Nothing committed to git yet this session — all changes are uncommitted in the working tree.

---

## Before 2026-06-12 (from git history)

- `6a5ba57` auth flow with deep linking + Capacitor integration
- `2a09f80` Supabase integration for auth and data
- `240fe33` / `0b99337` readme, initial commit
