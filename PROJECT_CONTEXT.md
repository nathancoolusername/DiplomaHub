# DiplomaHub — Project Context

Paste this file's contents at the start of a new session (or point Claude at it) to restore full context without re-deriving everything from scratch.

## What this is

DiplomaHub (repo/site name "IBPeople") is a community platform for International Baccalaureate (IB) students, alumni, and educators. Three content types anchor the app: **Resources** (uploaded files or external links), **Articles** (long-form writing), and **Discussions** (community Q&A). Plus user **Profiles** and an **Admin panel**.

## Location — read this first

The actual project lives at **`/Users/nathan/Desktop/DiplomaHub`**. If a session's primary working directory is `/Users/nathan/Desktop/ibpeople`, that folder is essentially empty — the real code is in DiplomaHub, listed as an "additional working directory." Always operate there.

It's a git repo (branch `features` was active), with teammate branches `Arnav`, `Ben`, `Nathan`, `main`.

## Tech stack

- **Next.js 16.2.9** (App Router) — newer than Claude's training data. Check `node_modules/next/dist/docs/` before assuming an API differs from what you remember (AGENTS.md enforces this).
- **React 19.2.4**, TypeScript, **Tailwind CSS 4** (custom design tokens via `@theme inline` in `app/globals.css` — see "Design system gotcha" below, it matters more than it sounds).
- **Supabase**: Postgres DB, Auth (`@supabase/ssr`), Storage. Project ref: `gmfqdkbghbxdlxffwfca`. No migration files in the repo — schema changes happen by handing the user raw SQL to run in the Supabase SQL editor.
- **Tiptap v3** — rich text editor for Articles. **sanitize-html** — server-side sanitization. **lucide-react** for icons.
- `bootstrap`/`react-bootstrap` are in `package.json` but unused — UI is hand-built Tailwind.

## Design system

`app/globals.css` `@theme inline` block defines colors (`--color-primary/secondary/tertiary` + `-container`/`on-*` variants), spacing (`xs/sm/md/lg/xl/gutter/margin`), type scale (`label-sm/md`, `body-md/lg`, `headline-md/lg`, `display-lg`), fonts (`Inter` sans, `Merriweather` serif).

**Gotcha (cost real debugging time):** because the theme block uses `@theme inline` (not plain `@theme`), Tailwind bakes the *literal resolved value* into each generated utility class instead of keeping a `var(--text-display-lg)` reference. This means overriding `--text-display-lg` etc. in a later CSS rule **does nothing** — the utility classes already have `font-size: 3rem` hardcoded. To make type scale responsive, `globals.css` now has a `@media (max-width: 640px)` block that targets `.text-display-lg` / `.text-headline-lg` / `.text-headline-md` **by class name directly** (unlayered CSS beats Tailwind's `@layer utilities` regardless of source order, so no `!important` needed). Keep this in mind before trying to theme anything else via CSS variables in this file.

Article body typography is centralized in `.article-editor`/`.article-content` classes so the Tiptap editor and rendered article match.

## Data model (Supabase Postgres)

Tables: `users`, `resources`, `articles`, `discussions`, `discussion_replies`, `comments`, `likes`, `saved_items`, `feedback`.

Key columns:
- `users`: `display_name`, `is_pro`, `ib_year`, `avatar_url`, `bio`, `points`, `author_trust_score`. `is_pro` and `author_trust_score` are **not** in the client-writable column grant — only the service-role client can update them (see Admin panel section).
- `resources`: title, description, subject_tag, type_tag, year_tag, file_url, author_id, download_count, like_count, published, community_trust.
- `articles`: title, slug (uuid-suffixed, see below), content (HTML), cover_image_url, author_id, topic, view_count, like_count, published.
- `discussions`: title, content (plain text), author_id, subject_tag, type_tag, year_tag, reply_count, like_count, **top_reply** (uuid FK to `discussion_replies.id` — it is NOT the reply text, see gotcha below). No `published` column — always live.
- `comments`: polymorphic (resource_id/article_id), flat, no threading, no likes column.
- `discussion_replies`: polymorphic-adjacent to discussions, has `like_count` and `parent_reply_id` (reserved, unused — no threading UI).
- `feedback`: `id`, `user_id` (nullable — anonymous feedback allowed), `content`, `created_at`. **Insert-only RLS policy, no SELECT policy at all** — even the admin has to read it via the service-role client (see Admin panel).

**Gotcha:** `discussions.top_reply` is a raw FK, not text. Every place that displays it (`getDiscussionsWithUserState`, `getPublicProfile`, `getSavedItems`) does a follow-up query to resolve the id → `discussion_replies.content` before returning it. If you add a new discussion-listing query, remember to do the same resolution or you'll render a UUID string in the "top reply" quote box.

**Gotcha:** `articles.slug` is derived from the title (`title.toLowerCase().replace(...)`) with a random 8-char suffix appended (`crypto.randomUUID().slice(0, 8)`) to guarantee uniqueness against the `slug unique` constraint — two articles with the same title used to collide and throw a raw Postgres error.

Storage buckets: `resources`, `avatars`, `article-covers` — public-read, path `${user.id}/${uuid}.${ext}` (avatars use a **fixed** filename `${user.id}/avatar.${ext}` with `upsert:true`, so `uploadAvatar()` appends a `?v=${Date.now()}` cache-busting query param to the stored URL, or every re-upload would keep showing the old cached image at the same URL).

## Auth & permissions

- `app/lib/supabase/server.ts` — cookie-based server client (respects RLS).
- `app/lib/supabase/admin.ts` — service-role client (bypasses RLS **and column grants**). Used for: download/view-count RPCs, and now also the admin panel's `author_trust_score`/`is_pro` writes and all `feedback` reads (both blocked for the regular client — column grants and missing SELECT policy respectively, not just RLS).
- `app/lib/get-current-user.ts` — `getCurrentUser()` / `getCurrentUserProfile()`, `cache()`-wrapped.
- `app/lib/resolveOrigin.ts` — **new**. Resolves the real public-facing origin from `x-forwarded-host`/`x-forwarded-proto` request headers instead of trusting `request.url` or an env var. Needed because `signInWithGoogle()`'s `redirectTo` used to be built from a static `NEXT_PUBLIC_SITE_URL` env var, so anyone signing in from a device other than the dev machine got redirected to the dev machine's `localhost` after Google auth completed. Used in `app/auth/actions.ts` and `app/auth/callback/route.ts`.
- **Admin bypass**: `app/lib/admin.ts` exports `isAdmin(userId)` checking `ADMIN_USER_IDS = ["c5680362-be56-490f-b6bc-471363da8648"]`. Every ownership check follows:
  ```ts
  const isOwner = currentUser?.id === row.author_id || isAdmin(currentUser?.id);
  ```
  Enforced both client-side (show/hide Edit/Delete) and server-side (skip the `.eq("author_id", ...)` filter for admins). Admin panel server actions (`app/lib/actions/admin.ts`) additionally re-check `isAdmin()` themselves — never rely on the `/admin` layout guard alone.
- **Login page auto-redirects if already logged in** — `app/login/page.tsx` is now a server component that checks `getCurrentUser()` and `redirect("/")`s before rendering; the actual form was extracted to `components/login/LoginForm.tsx` (client component).
- **VS Code port-forwarding / tunneling**: `next.config.ts`'s `experimental.serverActions.allowedOrigins` includes `"**.devtunnels.ms"` and `"localhost:3000"` — VS Code's forwarding proxy injects an `x-forwarded-host` of the tunnel domain on *every* request through that port, even ones loaded via plain `localhost`, which otherwise trips Next's Server Actions CSRF check ("Invalid Server Actions request"). If the tunnel domain changes (new VS Code session, no persistent tunnel configured), this needs updating, and so does Supabase's **Redirect URLs** allowlist (Authentication → URL Configuration) for OAuth to keep working from that domain.

### RLS/grants gotcha (bit us more than twice now)
`resources` had proper GRANT + RLS from the start. `articles` and `discussions` did not initially — same fix pattern:
```sql
grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on public.<table> to authenticated;
grant select on public.<table> to anon;
-- plus RLS policies scoped to author_id = auth.uid() (or the admin id)
```
Separately, **column-level grants** restrict which fields are writable even when RLS allows the row update — `users.is_pro`/`users.author_trust_score` are deliberately excluded from the client grant (only `display_name`/`ib_year`/`bio`/`avatar_url` are writable by `authenticated`). If a new admin-only field needs writing, it needs the **service-role client**, not just an `isAdmin()` check with the regular client — the regular client will get a real Postgres permission error regardless of RLS.

## Shared taxonomy — `components/pills.tsx`

Single source of truth for subject/type/year options:
- `SubjectTags`/`ActiveSubjectTags`: Math AA, Math AI, Physics, Chemistry, Biology, English, History, Economics, Geography, Business, TOK, EE, General, CAS.
- `ResourceTypeTag`: Template, Guide, Subject Notes, Past Paper Tips, Exemplar, External Link, Other.
- `TitleTag`: IB Educator, IB Student, Alumni — rendered via `ibYearTitleTag(ib_year)`, which maps the real `users.ib_year` values (`Pre-IB`/`DP1`/`DP2`/`Alumni`/`Educator`) to these three labels. **Was fixed-width (`w-25`, 100px) and "IB Educator" didn't fit — now sizes to content** (`whitespace-nowrap` + padding).
- `YEAR_OPTIONS`: DP1, DP2, Whole DP, Pre IB, Post IB.

**Rule:** every dropdown/filter does `Object.keys(SubjectTags)` etc. rather than a local array. Edit `pills.tsx` once to add a new option everywhere.

## Engagement features — comments, likes, saves, avatars (all real now)

This was previously the biggest gap in the app; it's now fully wired end to end.

- **`components/likeButton.tsx` / `components/saveButton.tsx` / `components/shareButton.tsx`** — shared, reused everywhere an author or engagement affordance is shown. All three: optimistic local update on click, **reconciled against the server's actual response** if it disagrees (handles stale initial state gracefully instead of drifting further out of sync — this was a real bug on the homepage before the fix). Active/liked state color is set via inline `style` (not a Tailwind class) because appending a color class after a base class with its own color utility is unreliable — Tailwind's generated CSS order (not DOM class order) decides which wins, so the "liked" color sometimes silently lost to the base gray. `ShareButton` copies `window.location.href` and shows a `bg-secondary-container text-secondary` "Copied!" pill for 2s.
- **`components/avatar.tsx`** — renders the real `avatar_url` (circular, `object-cover`) or falls back to initials (`app/lib/initials.ts`). Used everywhere an author is shown (resource/article/discussion cards and detail pages, comments, profile page, admin Users table, community "Your Status"/leaderboard). Replaced generic `CircleUser`/`Users`/`User` lucide icons that used to stand in for real photos.
- **`components/detailed-articles/comments.tsx` + `comment.tsx`** — single shared component pair, takes a `kind: "comment" | "reply"` prop. `kind="comment"` posts via `addComment`/`deleteComment` (resources/articles, `comments` table, no likes/threading — schema doesn't support it, so no like button or reply affordance is shown). `kind="reply"` posts via `replyToDiscussion`/`deleteReply` (discussions, `discussion_replies` table, **does** support likes so a real like button shows per-reply). Delete is owner-or-admin gated, confirm()-guarded, calls `router.refresh()` after.
- Every `*WithUserState`/detail-fetch action (`getResourcesWithUserState`, `getArticlesWithUserState`, `getDiscussionsWithUserState`, `getResourceDetail`, `getArticle`, `getDiscussion`, `getSavedItems`, `getPublicProfile`) now attaches real `isLiked`/`isSaved` for the *current viewer* (not the content owner) via batched `.in()` queries against `likes`/`saved_items`.
- Views: **articles only**, already real before this pass (`increment_view_count` RPC fired in `getArticle()`). Resources/discussions have no `view_count` column by design — confirmed with the user, not a gap.

## Admin panel (`/admin`) — new

Guarded by `app/admin/layout.tsx` (`redirect("/")` if `!isAdmin()`), tab nav to four sections. An "Admin" link appears in the nav dropdown (`components/profileMenu.tsx`) only when `isAdmin(id)` is true.

- **Dashboard** (`/admin`) — counts: users, resources, articles, discussions, unpublished resources/articles.
- **Users** (`/admin/users`, `components/admin/UsersTable.tsx`) — searchable table, inline-editable `author_trust_score` (0–100) and an `is_pro` toggle. Both write through the **service-role client** (see column-grants gotcha above) — this is the piece that makes `community_trust`'s 40%-author-reputation term meaningful; before this, `author_trust_score` was stuck at 50 for every single user with no way to change it.
- **Content** (`/admin/content`, `components/admin/ContentTable.tsx`) — tabbed resources/articles/discussions, searchable, publish/unpublish toggle, delete (reuses the *existing* `deleteResource`/`deleteArticle`/`deleteDiscussion` actions — they already had admin-bypass logic, there was just no UI to reach someone else's content before).
- **Feedback** (`/admin/feedback`, `components/admin/FeedbackTable.tsx`) — lists all `feedback` rows (service-role client, since that table has no SELECT policy for anyone), search, delete.

All admin server actions live in `app/lib/actions/admin.ts` behind an internal `requireAdmin()` helper that re-derives the current user and checks `isAdmin()` itself, independent of the layout guard.

`award_points()`'s auto `is_pro` upgrade trigger fires at **1000 points** — confirmed run by the user (was previously 500; UI copy already assumed 1000 before the SQL was confirmed applied).

## Feedback (`/feedback`) — new

Simple textarea form (`app/feedback/page.tsx`), `submitFeedback()` in `app/lib/actions/feedback.ts` (works logged-in or anonymous, `user_id` nullable). Roadmap page's "Submit Feedback" button links here. The `feedback` table + RLS **has been created** by the user (confirmed) — see Admin panel section for the table's odd insert-only-no-select policy shape.

## Mobile responsiveness — large pass, not yet visually verified by Claude

The app was built desktop-first with many literal fixed-pixel Tailwind utilities (`px-50`, `w-200`, `h-700px`, etc.) and zero mobile nav. A large sweep fixed this; the pattern used throughout was **mobile-first override, original value preserved at whatever breakpoint the layout was actually designed for** (`sm`/`md`/`lg`/`xl` chosen per-case to match, not a blanket rule) — the intent was to change nothing at laptop/desktop widths.

Real bugs found and fixed along the way (not just "add a breakpoint"):
- **`components/Navbar.tsx`** had nav links as `hidden md:flex` with **no mobile alternative at all** — phone users had zero way to navigate. Added a hamburger menu (`md:hidden` toggle + slide-down panel).
- **`components/Footer.tsx`** had `w-400` (1600px!) on a flex child, in the footer that renders on **every single page** — this alone was enough to cause sitewide horizontal overflow regardless of any other page-level fix. This was the actual root cause of a "margin on the right of the whole site" complaint that persisted through an earlier fix pass.
- **`components/profileMenu.tsx`** (the nav auth dropdown) was clipping the user's display name on narrow screens — not a sizing issue but a classic flexbox gotcha: a flex item's `min-width` defaults to `auto` (i.e., "never shrink below content width"), so the name couldn't wrap and just got squeezed/clipped by the row instead. Fixed with `min-w-0` on the flex column plus `break-words`; also hid the secondary "· Npts"/"Diploma Pro" text below `sm` so the name has room.
- **`components/pills.tsx`** `TitleTag` pills had a fixed 100px width that "IB Educator" doesn't fit in — text visibly spilled past the pill's rounded background ("pills sticking out"). Fixed to size-to-content.
- Viewport meta tag was a stray manual `<meta>` element rendered between `<html>` and `<body>` (not guaranteed to hoist into `<head>` correctly) — replaced with the proper `export const viewport: Viewport = {...}` in `app/layout.tsx`.
- Many two-column `basis-2/3`/`basis-1/3` detail-page layouts (resource/article/discussion detail, profile page, ProfileInfo tabs) now stack below `lg`. Card grids (`grid-cols-3`) now collapse via `sm:`/`lg:`. Various header/action rows across comment cards, discussion cards, and resource-panel footers got `flex-wrap` since they were silently clipping content (not just "too cramped") under `overflow-hidden` card wrappers.
- `body { overflow-x: hidden }` added in `globals.css` as a blanket safety net.

**Caveat for whoever picks this up:** none of this has been visually verified in an actual mobile viewport by Claude — the preview/dev-server tooling attempt was blocked mid-session by a port-3000 conflict with the user's own running `npm run dev` (their tunnel needs that specific port for OAuth). Every fix here is a real, verifiable class-level change, but a manual pass on an actual phone (or the preview tool, started on a *different* port) is worth doing, especially on the write/upload forms and the roadmap page's custom timeline layout (which had its decorative rail simply hidden below `lg` rather than redesigned — the fixed `gap-[300px]` alignment trick it used doesn't translate to a stacked layout).

## Feature status by area

### Resources
- Routes: `/resources`, `/resources/[slug]` (folder says `[slug]`, value is actually the `id` — harmless), `/resources/upload`, `/resources/[slug]/edit`.
- Upload: real file or external link (`type_tag === "External Link"` swaps dropzone for URL field). `DownloadButton` branches accordingly. Delete cleans up Storage (best-effort).
- Mandatory: title, subject, type, year.

### Articles
- Routes: `/articles`, `/articles/[slug]`, `/articles/write`, `/articles/[slug]/edit`.
- Tiptap HTML content, sanitized server-side (allowlist: `p, div, br, b, strong, i, em, ul, ol, li, a, blockquote, h2, h3` — never loosen without checking what the toolbar can produce). Cover image upload. Read time computed (`app/lib/readTime.ts`), not stored. Save Draft vs Publish.
- Mandatory: title, topic, content.

### Discussions / Community
- Routes: `/community`, `/community/[id]`, `/community/write`, `/community/[id]/edit`.
- Plain-text content, no draft state. "Hot" vs "Newest" sort (`hotScore = likes + replies / (daysOld + 2)^1.5`). Community page sidebar now has a real "Your Status" card (points progress toward Diploma Pro, or a badge if already Pro) and a real "Top Contributors" leaderboard (`getTopContributors()` in `app/lib/actions/profile.ts`), replacing old static placeholders.
- Mandatory: title, subject, type, year, content.

### Profile (`/profile/[userId]`)
- Tabs: Resources, Discussions, Articles, Comments, Saves (own profile only), Drafts (own profile only). "Load more" pattern (`LoadMoreList.tsx`), not numbered pagination — intentional, distinct from the main grids.
- Own-profile edit page (`/profile/edit`) now supports **avatar upload** (click the circle, immediate upload via `uploadAvatar()`) and the "Save changes" button redirects to the profile page instead of an in-place "Saved!" message.
- Drafts link to the article's edit page (unpublished detail pages 404).

### Homepage (`/`)
- Featured Resources: real, top 6 newest published (now via `getResourcesWithUserState({ limit: 6 })`, not a raw untyped query). Trending discussions: real, top 3 by `like_count`.

## Established code patterns

- Server actions live in `app/lib/actions/{resources,articles,discussions,upload,profile,saved-items,likes,comments,admin,feedback}.ts`, all `"use server"`, all return `ActionResult<T> = {success:true,data:T} | {success:false,error:string}`.
- Create/edit forms are client components. `SortDropdown`/`FilterDropdown` are plain `<button>`-based, not native inputs — value goes in via `formData.set(...)` in the submit handler, validated manually, internal buttons need `type="button"`.
- Edit routes reuse the create form component with an optional prefill prop.
- Delete buttons: `confirm()` guard → call action → `router.push()`/`router.refresh()` on success.
- Card/panel components accept an optional `href` prop to override the default detail-page link (e.g. Drafts tab → edit page instead of the 404-prone detail page).
- `next/image` with `fill` needs an explicit `sizes` prop.
- `next.config.ts`: `experimental.serverActions.bodySizeLimit: "20mb"`, `allowedOrigins` for tunneling (see Auth section). **Changing `next.config.ts` requires a dev server restart.**

## Known gaps / pre-existing issues, still open

- `components/articles/article-grid.tsx` has a `let numButtons` that should be `const` (lint error) — never fixed, out of scope each time.
- A handful of unused-import lint warnings scattered around (pre-existing, `eslint` currently reports ~41 problems total, none introduced this session — baseline, not regressions).
- Google Cloud OAuth consent screen is still in Testing mode (allowlisted test users only) — separate from the tunneling/redirect-origin fixes above, needs a verification submission before real users can sign in via Google.

## Environment quirks for whoever's driving

- Preview/dev-server tooling has been unreliable for this project across multiple sessions; most recently blocked outright by a port-3000 conflict with the user's own running dev server (needed for OAuth testing over a tunnel) — don't assume port 3000 is free, use `autoPort` or ask first. Expect to rely on `tsc --noEmit` + `eslint` for verification and ask the user to manually test.
- The user (or a linter) frequently edits files directly between turns — system reminders flag this; treat it as intentional, never revert without being asked, re-read before assuming stale state.
- Schema/RLS/column-grant changes go through the user via raw SQL in the Supabase SQL editor — there's no direct DB access tool. One item still pending user action: keeping Supabase's Auth Redirect URLs allowlist in sync with whatever the current VS Code tunnel domain is.
- `.claude/` (local tool permissions + preview-server launch config) is gitignored, not committed — personal machine config, not shared repo state.

## Session log

- **2026-07-13**: Committed the mobile responsiveness pass (`97c9503`) and the admin feedback panel (`0145952`) that had been sitting uncommitted across prior sessions — 33 + 5 files. Found and fixed a real bug in the process: the mobile-pass diff wired `ShareButton` into resource/article/community/profile detail pages, but `components/shareButton.tsx` itself was untracked, so that commit didn't build in isolation until a follow-up commit (`0e3a43c`) added the missing file. `tsc --noEmit` is clean post-commit. User confirmed the `award_points()` 500→1000 threshold SQL has been run. **Still open:** the mobile pass has not been visually verified in a browser/mobile viewport by Claude — do that before considering it done.
