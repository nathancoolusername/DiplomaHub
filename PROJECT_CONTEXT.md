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

Tables: `users`, `resources`, `articles`, `discussions`, `discussion_replies`, `comments`, `likes`, `saved_items`, `feedback`, `notifications`, `roadmap_items`.

Key columns:
- `users`: `display_name`, `is_pro`, `ib_year`, `avatar_url`, `bio`, `points`, `author_trust_score`. `is_pro` and `author_trust_score` are **not** in the client-writable column grant — only the service-role client can update them (see Admin panel section).
- `resources`: title, description, subject_tag, type_tag, year_tag, file_url, author_id, download_count, like_count, published, community_trust.
- `articles`: title, slug (uuid-suffixed, see below), content (HTML), cover_image_url, author_id, topic, view_count, like_count, published.
- `discussions`: title, content (plain text), author_id, subject_tag, type_tag, year_tag, reply_count, like_count, **top_reply** (uuid FK to `discussion_replies.id` — it is NOT the reply text, see gotcha below). No `published` column — always live.
- `comments`: polymorphic (resource_id/article_id), flat, no threading, no likes column.
- `discussion_replies`: polymorphic-adjacent to discussions, has `like_count` and `parent_reply_id` (reserved, unused — no threading UI).
- `feedback`: `id`, `user_id` (nullable — anonymous feedback allowed), `content`, `created_at`. **Insert-only RLS policy, no SELECT policy at all** — even the admin has to read it via the service-role client (see Admin panel).
- `notifications`: `id`, `user_id` (recipient), `actor_id` (nullable — null for system-triggered types like download milestones), `type`, `message`, `link`, `read`, `created_at`. **No INSERT grant at all** — a notification's `user_id` is always someone *other* than the caller, so it can't be expressed as an `auth.uid()`-scoped RLS policy; all inserts go through the service-role client from `createNotification()` in `app/lib/actions/notifications.ts`. SELECT/UPDATE are scoped to `user_id = auth.uid()` for the regular client (reading your own notifications, marking them read).
- `roadmap_items`: `id` (text slug, e.g. `"ib-news"`), `title`, `status` (`completed`/`in_progress`/`planned`), `completion_percentage` (nullable), `sort_order`. Same no-client-grant shape as `notifications` — admin writes only, via service-role. Title/description/tags for each roadmap card are **not** in this table — they're a hardcoded `ROADMAP_CONTENT` map in `app/roadmap/page.tsx` keyed by the same slug; only status/percentage are admin-editable (deliberate scope decision, not a gap).

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
- **Roadmap** (`/admin/roadmap`, `components/admin/RoadmapTable.tsx`) — edit each roadmap card's status and (when status is "In Progress") completion percentage. See "Roadmap" section below.

Users and Content tables: the user/author cell links out to `/profile/[id]`, and Content's title links to the actual resource/article/discussion page (articles resolve via `slug`, which had to be added to the admin query — it wasn't being fetched before).

All admin server actions live in `app/lib/actions/admin.ts` behind an internal `requireAdmin()` helper that re-derives the current user and checks `isAdmin()` itself, independent of the layout guard.

`award_points()`'s auto `is_pro` upgrade trigger fires at **1000 points** — confirmed run by the user (was previously 500; UI copy already assumed 1000 before the SQL was confirmed applied).

## Feedback (`/feedback`) — new

Simple textarea form (`app/feedback/page.tsx`), `submitFeedback()` in `app/lib/actions/feedback.ts` (works logged-in or anonymous, `user_id` nullable). Roadmap page's "Submit Feedback" button links here. The `feedback` table + RLS **has been created** by the user (confirmed) — see Admin panel section for the table's odd insert-only-no-select policy shape.

## Notifications (bell icon in navbar) — new

In-app + (currently disabled) email notifications when someone interacts with your content, all defined in `app/lib/actions/notifications.ts`.

- **Triggers**: likes on your resource/article/discussion/reply, comments on your resource/article, replies to your discussion, admin trust-score changes and Pro upgrades (manual admin action only — *not* the automatic 1000-point trigger), and resource download milestones (10/25/50/100/250/500/1000/2500/5000/10000 downloads, fires once per threshold crossed, no `actor_id` since it's not a directed action).
- **UI**: `components/notifications/NotificationBell.tsx` in the navbar — unread badge, dropdown of recent notifications, mark-read/mark-all-read, polls `getUnreadNotificationCount()` every 30s. No realtime/websockets.
- **Email**: sends via Resend (`RESEND_API_KEY` in `.env.local`), but **`EMAIL_SENDING_ENABLED = false`** is hardcoded in `notifications.ts` — the user's Resend account can't send to arbitrary recipients until domain verification clears, on hold until **2026-09-02**. Flip that flag (or ping the user) once it's ready. This is a deliberate code flag, not a date-check, so it won't silently start sending if the date slips.
- **Security note**: the email HTML body interpolates user-controlled text (display names, content titles) — `escapeHtml()` in `notifications.ts` guards against HTML injection into the email. Don't remove that when re-enabling email.
- Self-notifications are suppressed (`actorId === userId` → no-op) except download milestones, which have no actor.

## Roadmap (`/roadmap`) — now DB-backed

Was fully hardcoded; status and completion percentage now come from the `roadmap_items` table (see Data model), editable at `/admin/roadmap`. Title/description/tags per card are still a hardcoded `ROADMAP_CONTENT` map in `app/roadmap/page.tsx` keyed by the same slug used in the table — a deliberate scope line, not an oversight (admin only needed to edit status/completion, not rewrite copy).

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

## Pre-launch hardening pass (2026-07-21)

A full pass through the checklist a launch actually needs: security audit, input/upload validation, DB indexes, real pagination, error boundaries, rate limiting, error tracking. Order matters for anyone re-verifying this — SQL had to be handed to the user for several pieces and may not be confirmed run.

### Security audit findings — all fixed
- **`middleware.ts` was dead code.** It lived at `app/middleware.ts`; Next only loads middleware from the project root (or `src/`). Moved to root — this means Supabase's session-refresh logic (`supabase.auth.getUser()` on every request) **is now actually running for the first time**. If anything about session/auth timing behaves differently post-launch than it seemed to before, this is why — it's a fix, not a regression, but it's a genuinely new code path executing in production. **Since renamed again**: Next.js 16 deprecated the `middleware.ts`/`middleware()` convention in favor of `proxy.ts`/`proxy()` (same file, same `config`/`matcher`, just the filename and exported function name change — see [migration doc](https://nextjs.org/docs/messages/middleware-to-proxy)). The file is now `proxy.ts` at the project root exporting `proxy()`. If you see the file under the old name or the old function name anywhere, that's stale.
- **HTML injection in notification emails** — fixed via `escapeHtml()`, see Notifications section. Only matters once `EMAIL_SENDING_ENABLED` flips to true.
- **No server-side input validation anywhere** — client "required" attributes were the only guard on every create/update action. Added `app/lib/validation.ts` (`requireField`/`optionalField`/`requireOneOf`) and applied it across resources/articles/discussions/replies/comments/feedback/signup/profile-edit. Tag fields (`subject_tag`/`type_tag`/`year_tag`) are now validated against the same option lists the dropdowns use (`components/pills.tsx`'s `SubjectTags`/`ResourceTypeTag`/`YEAR_OPTIONS`, plus a local `DISCUSSION_TYPE_OPTIONS` in `discussions.ts` mirroring `discussion-panel.tsx`'s `typeTags` since that one isn't in `pills.tsx`).
- **No file upload validation** — `app/lib/actions/upload.ts` now validates extension against an allowlist per upload type (resources: pdf/doc/docx/png/jpg/jpeg, 15MB; article covers: png/jpg/jpeg/webp, 5MB; avatars: same images, 3MB) **and explicitly sets the storage `contentType`** from the validated extension rather than trusting the client-supplied `file.type` — so even a spoofed MIME type can't get stored/served as something dangerous (e.g. SVG-with-script under an image extension).
- Confirmed solid, no changes needed: RLS/column-grant pattern, IDOR protection (every update/delete scopes to `author_id = auth.uid()` unless admin), article HTML sanitization (`sanitizeHtml` allowlist + forced `rel=noopener noreferrer`), no service-role key ever reaching a `"use client"` file.
- **Still open, not code**: Google OAuth consent screen still in Testing mode (see Known gaps).

### Real server-side pagination — the big one
All three main listing grids (`/resources`, `/articles`, `/community`) used to fetch **every published row** unbounded on every page load and do filter/sort/pagination entirely client-side with `.slice()` — the page-number buttons only controlled what rendered, not what was fetched. Rewritten to filter/sort/paginate in the query itself:

- **Resources**: `getResourcesPage()` in `resources.ts` — plain `.eq()`/`.order()`/`.range()`, `{count: "exact"}` for total pages. `getResourcesWithUserState()` (old, unbounded) is kept only for the homepage's simple `{limit: 6}` featured-resources call.
- **Articles**: `getArticlesPage()` in `articles.ts`, same shape. The old unbounded `getArticlesWithUserState()` was fully replaced and **deleted** (nothing else called it). Note the UI's "subject" pill filter actually filters the `topic` column, not a `subject_tag` column — `topic` is itself constrained to the same `SubjectTags` option set in the write form, so this isn't as loose as it sounds (`app/articles/page.tsx` used to do this mapping client-side with `subject_tag: a.topic`; now `getArticlesPage` filters `topic` directly).
- **Community/Discussions**: the hard one — "Hot" sort is a computed formula (`like_count + reply_count / (daysOld+2)^1.5`), not a plain column, so it can't be a normal `.order()`. Added two Postgres functions (SQL below, **must be run by the user**): `get_discussions_page(...)` and `count_discussions(...)`, called via `.rpc()` from `getDiscussionsPage()` in `discussions.ts`. Old `getDiscussionsWithUserState()` (unbounded) was deleted. The "Trending This Week" cards (most-active + essential) now come from a separate bounded `getTrendingDiscussions(limit=10)` call (top 10 by hot score, unfiltered) rather than sorting the entire table client-side.
- All three grid components (`resources-grid.tsx`, `article-grid.tsx`, `community.tsx`) now hold only the current page in state, fetch a new page via the corresponding action on any filter/sort/page change (client components calling server actions directly), and skip the redundant duplicate fetch on mount via an `isFirstRender` ref (page 1 was already fetched server-side and passed in as `initialItems`).
- Numbered pagination UI was kept as-is (not switched to "Load more") — that was a deliberate choice, see git history if reconsidering.
- **DB indexes**: added on every column now actually filtered/sorted/joined on — `published`/`subject_tag`/`type_tag`/`year_tag`/`author_id`/`created_at`/`download_count`/`like_count` on `resources`; equivalent on `articles`/`discussions`; every FK column on `likes`/`comments`/`saved_items`/`discussion_replies`. SQL below, **must be run by the user**, uses `if not exists` so it's safe to re-run.

**SQL to run** (discussions pagination RPCs):
```sql
create or replace function get_discussions_page(
  p_subject text default null, p_type text default null, p_year text default null,
  p_sort text default 'newest', p_limit int default 6, p_offset int default 0
)
returns setof discussions language sql stable as $$
  select * from discussions
  where (p_subject is null or subject_tag = p_subject)
    and (p_type is null or type_tag = p_type)
    and (p_year is null or year_tag = p_year)
  order by
    case when p_sort = 'hot' then
      like_count + reply_count / power(extract(epoch from (now() - created_at)) / 86400 + 2, 1.5)
    end desc nulls last,
    created_at desc
  limit p_limit offset p_offset;
$$;

create or replace function count_discussions(
  p_subject text default null, p_type text default null, p_year text default null
)
returns bigint language sql stable as $$
  select count(*) from discussions
  where (p_subject is null or subject_tag = p_subject)
    and (p_type is null or type_tag = p_type)
    and (p_year is null or year_tag = p_year);
$$;

grant execute on function get_discussions_page to authenticated, anon;
grant execute on function count_discussions to authenticated, anon;
```
(Index SQL is long — see git history of this file's commit for the full script, or regenerate: every FK/filter/sort column across `resources`/`articles`/`discussions`/`likes`/`comments`/`saved_items`/`discussion_replies`.)

### Error boundaries — new
`app/error.tsx` (route-level, keeps Navbar/Footer, styled to match the design system), `app/global-error.tsx` (only fires if the root layout itself throws — has to render its own `<html>/<body>` since it replaces everything), `app/not-found.tsx` (styled 404, there wasn't one before — Next was falling back to its generic default page). All three report to Sentry when configured.

### Rate limiting — new, no-ops until configured
`app/lib/ratelimit.ts` — Upstash Redis + `@upstash/ratelimit`, sliding window. Three buckets: `auth` (5/min, keyed by IP via `x-forwarded-for` — used on `signIn`/`signUp`), `write` (10/min, keyed by user id — comments, discussions, replies, feedback), `download` (30/min, keyed by user id — `downloadResource`). **If `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` aren't set in `.env.local`, every check silently allows** (same no-op-until-configured pattern as Resend) — needs the user to create a free Upstash Redis database and fill those in.

### Error tracking — new, no-ops until configured
`@sentry/nextjs`, wired the current (Next 15+/16) way: `instrumentation.ts` (root, server + edge init, `onRequestError` hook) and `instrumentation-client.ts` (root, client init) — **not** the older `sentry.client.config.ts` convention. `Sentry.captureException()` added to both error boundaries. No source-map upload configured (`withSentryConfig` wrapper skipped — needs a Sentry auth token + org/project slugs the user hasn't provided yet); stack traces will be minified until that's added via `npx @sentry/wizard` later. **Needs `NEXT_PUBLIC_SENTRY_DSN`** in `.env.local` (user needs to create a free Sentry project first) — no-ops entirely until set.

### Rollback (Vercel) — process, no code needed
If a deploy goes bad in production: **Vercel dashboard → project → Deployments tab → find the last known-good deployment → "..." menu → Promote to Production.** This re-points production traffic at that build instantly (no rebuild, no redeploy wait) — it's the fastest path back to a working state, faster than `git revert` + waiting on a new build. Equivalent via CLI: `vercel rollback [deployment-url]`. Note this only rolls back the **app code** — it does not undo any Supabase schema/SQL changes that shipped alongside it, since those are applied by hand in the SQL editor and aren't versioned with deploys. If a bad release included a schema change, rolling back the app without also reverting the SQL can leave the (old) code talking to a (new) schema shape — check what changed in Supabase before assuming a Vercel rollback alone fixes things.

### Explicitly deferred, not done
- **Load/stress testing** — premature without real production traffic patterns; revisit if a specific high-traffic event is expected.
- **Caching beyond Next's defaults** — no evidence yet that Supabase read load needs it.
- **Comment/reply pagination** on detail pages — still fetches everything for one resource/article/discussion at a time; lower risk than the three main grids since it's bounded by one item's engagement, not sitewide growth.

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

- Server actions live in `app/lib/actions/{resources,articles,discussions,upload,profile,saved-items,likes,comments,admin,feedback,notifications}.ts`, all `"use server"`, all return `ActionResult<T> = {success:true,data:T} | {success:false,error:string}`.
- Create/edit forms are client components. `SortDropdown`/`FilterDropdown` are plain `<button>`-based, not native inputs — value goes in via `formData.set(...)` in the submit handler, validated manually, internal buttons need `type="button"`.
- Edit routes reuse the create form component with an optional prefill prop.
- Delete buttons: `confirm()` guard → call action → `router.push()`/`router.refresh()` on success.
- Card/panel components accept an optional `href` prop to override the default detail-page link (e.g. Drafts tab → edit page instead of the 404-prone detail page).
- `next/image` with `fill` needs an explicit `sizes` prop.
- `next.config.ts`: `experimental.serverActions.bodySizeLimit: "20mb"`, `allowedOrigins` for tunneling (see Auth section). **Changing `next.config.ts` requires a dev server restart.**
- **Server-side validation**: `app/lib/validation.ts` (`requireField`/`optionalField`/`requireOneOf`) — every create/update action validates formData server-side now, not just via client "required" attributes. Use this rather than ad-hoc checks for any new form field.
- **Rate limiting**: `checkRateLimit(kind, identifier)` from `app/lib/ratelimit.ts` — call after the auth check, before doing the write, in any new action that creates content or is otherwise abusable. No-ops until Upstash env vars are set.
- **List pagination**: any new listing page should follow the `get<Thing>Page(filters)` pattern (see Resources/Articles/Discussions) — filter/sort/paginate in the query via `.range()` + `{count: "exact"}`, return `{items, totalCount}`, never fetch-all-then-slice client-side. If the sort needs a computed/derived score (like Discussions' "Hot"), it needs a Postgres function, not a plain `.order()`.

## Known gaps / pre-existing issues, still open

- A handful of unused-import lint warnings scattered around (pre-existing, `eslint` currently reports 38 problems total across ~15 files, **none in files touched by the 2026-07-21 hardening pass** — baseline, not regressions). `article-grid.tsx` was rewritten during that pass so its old `let numButtons` issue no longer applies.
- Google Cloud OAuth consent screen is still in Testing mode (allowlisted test users only) — needs a verification submission before real users can sign in via Google. This is arguably the single biggest remaining launch blocker and it's entirely on the user's side (Google's review queue, not code).
- **Pending user action before the 2026-07-21 hardening pass is actually live:**
  1. Run the two SQL scripts (discussions pagination RPCs + index creation) in the Supabase SQL editor — see "Pre-launch hardening pass" section. Until then `/community` will error outright (RPC functions don't exist).
  2. Fill in `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` in `.env.local` (free tier at console.upstash.com) — rate limiting no-ops until then.
  3. Fill in `NEXT_PUBLIC_SENTRY_DSN` in `.env.local` (free tier at sentry.io) — error tracking no-ops until then.
  4. `RESEND_API_KEY` is already set, but `EMAIL_SENDING_ENABLED = false` is hardcoded in `notifications.ts` until 2026-09-02 (Resend domain verification pending) — flip it manually when ready, don't wait on a date check that doesn't exist.

## Environment quirks for whoever's driving

- Preview/dev-server tooling has been unreliable for this project across multiple sessions; most recently blocked outright by a port-3000 conflict with the user's own running dev server (needed for OAuth testing over a tunnel) — don't assume port 3000 is free, use `autoPort` or ask first. Expect to rely on `tsc --noEmit` + `eslint` for verification and ask the user to manually test.
- The user (or a linter) frequently edits files directly between turns — system reminders flag this; treat it as intentional, never revert without being asked, re-read before assuming stale state.
- Schema/RLS/column-grant changes go through the user via raw SQL in the Supabase SQL editor — there's no direct DB access tool. One item still pending user action: keeping Supabase's Auth Redirect URLs allowlist in sync with whatever the current VS Code tunnel domain is.
- `.claude/` (local tool permissions + preview-server launch config) is gitignored, not committed — personal machine config, not shared repo state.
- **`node_modules` gets corrupted by what looks like iCloud Drive syncing the Desktop folder mid-`npm install`** — literal duplicate directories/files named `<name> 2` (macOS conflicted-copy naming) showed up scattered across `node_modules` (`@types/estree 2`, `@supabase/auth-js/dist 2`, etc.) after installing new packages, and caused a real `tsc` failure (`Cannot find type definition file for 'estree 2'`). If `tsc`/build errors reference a package name with a stray ` 2`/` 3` suffix, this is why — `rm -rf node_modules && npm install` is the fix (node_modules is gitignored and fully regenerable, safe to nuke). Worth checking `find node_modules -maxdepth 4 -regex '.* [0-9]$'` after any `npm install` in this project until/unless the user excludes this folder from iCloud sync.

## Session log

- **2026-07-13**: Committed the mobile responsiveness pass (`97c9503`) and the admin feedback panel (`0145952`) that had been sitting uncommitted across prior sessions — 33 + 5 files. Found and fixed a real bug in the process: the mobile-pass diff wired `ShareButton` into resource/article/community/profile detail pages, but `components/shareButton.tsx` itself was untracked, so that commit didn't build in isolation until a follow-up commit (`0e3a43c`) added the missing file. `tsc --noEmit` is clean post-commit. User confirmed the `award_points()` 500→1000 threshold SQL has been run. **Still open:** the mobile pass has not been visually verified in a browser/mobile viewport by Claude — do that before considering it done.
- **2026-07-21**: Added the roadmap admin panel, notifications system (in-app + Resend email, currently disabled), then a full pre-launch hardening pass — see that section above for the complete breakdown. Highlights: fixed a real bug where `middleware.ts` sat in the wrong directory and had literally never run; added server-side validation and file-upload validation everywhere; rewrote all three main listing grids (Resources/Articles/Community) from "fetch everything, slice client-side" to real server-side pagination, including two new Postgres RPC functions for Community's computed "Hot" sort; added DB indexes, error boundaries, Upstash rate limiting, and Sentry error tracking. Full-project `tsc --noEmit` and `eslint` both clean throughout (verified after every file group, not just at the end). **Not verified in a browser this session** — user declined preview/browser checks each time it was offered; everything here is unverified beyond type-checking and linting until manually tested, especially the three rewritten grids and their filter/sort/pagination interactions. **Blocking on user action**: two SQL scripts unrun, three env vars unset (Upstash, Sentry, and confirming Resend domain) — see "Known gaps" for the full list.
