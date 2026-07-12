# DiplomaHub — Project Context

Paste this file's contents at the start of a new session (or point Claude at it) to restore full context without re-deriving everything from scratch.

## What this is

DiplomaHub (repo/site name "IBPeople") is a community platform for International Baccalaureate (IB) students, alumni, and educators. Three content types anchor the app: **Resources** (uploaded files or external links), **Articles** (long-form writing), and **Discussions** (community/community Q&A). Plus user **Profiles**.

## Location — read this first

The actual project lives at **`/Users/nathan/Desktop/DiplomaHub`**. If a session's primary working directory is `/Users/nathan/Desktop/ibpeople`, that folder is essentially empty (just a stray `.next` cache from an unrelated/abandoned run) — the real code is in DiplomaHub, listed as an "additional working directory." Always operate there.

It's a git repo (branch `features` was active), with teammate branches `Arnav`, `Ben`, `Nathan`, `main`.

## Tech stack

- **Next.js 16.2.9** (App Router) — this is *newer than Claude's training data*. Before assuming an API differs from what you remember, check `node_modules/next/dist/docs/` (AGENTS.md in the repo root enforces this).
- **React 19.2.4**, TypeScript, Tailwind CSS 4 (custom design tokens via CSS variables, see below).
- **Supabase**: Postgres DB, Auth (`@supabase/ssr`), Storage.
- **Tiptap v3** (`@tiptap/react`, `starter-kit`, `extension-link`, `extension-placeholder`) — rich text editor for Articles.
- **sanitize-html** — server-side HTML sanitization for article content before it's stored.
- **lucide-react** for icons.
- `bootstrap` / `react-bootstrap` are in `package.json` but appear to be legacy/unused — the actual UI is hand-built Tailwind with custom design tokens.

## Design system

`app/globals.css` defines everything via `@theme inline` CSS variables: `--color-primary/secondary/tertiary` (+ `-container`/`on-*` variants), `--color-surface-container-{lowest,low,,high,highest}`, spacing scale (`xs/sm/md/lg/xl/gutter/margin`), type scale (`label-sm/md`, `body-md/lg`, `headline-md/lg`, `display-lg`), fonts (`Inter` sans, `Merriweather` serif). Article body typography (headings, lists, blockquote callouts, links) is centralized in shared `.article-editor`/`.article-content` classes so the Tiptap editor and the rendered article look identical.

## Data model (Supabase Postgres)

Tables: `users` (profile: `display_name`, `is_pro`, `ib_year`, `avatar_url`, `bio`, `points`, `author_trust_score`), `resources`, `articles`, `discussions`, `discussion_replies`, `comments`, `likes`, `saved_items`.

Key columns:
- `resources`: title, description, subject_tag, type_tag, year_tag, file_url, author_id, download_count, like_count, published, community_trust.
- `articles`: title, slug, content (HTML), cover_image_url, author_id, topic, view_count, like_count, published.
- `discussions`: title, content (plain text), author_id, subject_tag, type_tag, year_tag, reply_count, like_count, top_reply. No `published` column — discussions are always live once created.

Storage buckets: `resources`, `avatars`, `article-covers` — all public-read, path convention `${user.id}/${uuid}.${ext}`, writes scoped to the owning user via storage RLS policies.

Supabase project ref (from `next.config.ts` `images.remotePatterns`): `gmfqdkbghbxdlxffwfca.supabase.co`.

## Auth & permissions

- `app/lib/supabase/server.ts` — cookie-based server client (respects RLS, used in almost everything).
- `app/lib/supabase/admin.ts` — service-role client (bypasses RLS), used sparingly: view-count increments, resolving download URLs.
- `app/lib/get-current-user.ts` — `getCurrentUser()` / `getCurrentUserProfile()`, both `cache()`-wrapped.
- `middleware.ts` refreshes the Supabase session on every request.
- **Admin bypass**: `app/lib/admin.ts` exports `isAdmin(userId)` checking against `ADMIN_USER_IDS = ["c5680362-be56-490f-b6bc-471363da8648"]`. Every ownership check in the app follows this shape:
  ```ts
  const isOwner = currentUser?.id === row.author_id || isAdmin(currentUser?.id);
  ```
  This is enforced **both** client-side (to show/hide Edit/Delete buttons) **and** server-side inside the action itself (conditionally skip the `.eq("author_id", user.id)` filter for admins) — never trust the client-only check.

### RLS gotcha (bit us twice)

`resources` had proper GRANT + RLS policies from the start and just worked. `articles` did **not** — it threw `permission denied for table articles` the first time anyone actually tried to publish one, because the table was missing basic SQL `GRANT`s (not just RLS policies). Fixed with:
```sql
grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on public.articles to authenticated;
grant select on public.articles to anon;
-- plus RLS policies for select/insert/update/delete scoped to author_id = auth.uid() (or the admin id)
```
The same preemptive SQL was given for `discussions`/`discussion_replies` since that table had never been exercised by a real write before its migration off seed data — **not confirmed whether it was actually run**. If you hit `permission denied for table X`, this is almost certainly the cause: check `information_schema.role_table_grants` for that table before assuming it's an RLS policy problem.

## Shared taxonomy — `components/pills.tsx`

Single source of truth for all subject/type/year options, deliberately centralized after repeated duplication bugs:
- `SubjectTags` / `ActiveSubjectTags`: Math AA, Math AI, Physics, Chemistry, Biology, English, History, Economics, Geography, Business, TOK, EE, General, CAS.
- `ResourceTypeTag`: Template, Guide, Subject Notes, Past Paper Tips, Exemplar, External Link, Other.
- `TitleTag`: IB Educator, IB Student, Alumni.
- `YEAR_OPTIONS`: DP1, DP2, Whole DP, Pre IB, Post IB.
- Discussion type options live separately in `components/community/discussion-panel.tsx` as exported `typeTags` (Discussion, Resource, Question — className strings, not JSX pills).

**Rule going forward:** every dropdown/filter that needs these options does `Object.keys(SubjectTags)` etc. rather than a local hardcoded array. When asked to add a new subject/type/year, edit `pills.tsx` once — it propagates to every upload/write form and every listing filter automatically. Don't reintroduce local duplicate arrays.

## Feature status by area

### Resources
- Routes: `/resources` (list), `/resources/[slug]` (detail — folder is named `[slug]` but the value is actually the resource's `id`; harmless naming inconsistency, not a bug), `/resources/upload`, `/resources/[slug]/edit`.
- Upload supports a real file **or** an external link (toggled by `type_tag === "External Link"`, swaps the dropzone for a URL field).
- `DownloadButton` branches on `isExternalLink`: real files are fetched into a blob and force-downloaded with a sanitized filename; external links just open in a new tab (fetching them cross-origin would fail anyway).
- Delete also cleans up the file in Supabase Storage (best-effort, non-blocking).
- Mandatory fields: title, subject, type, year.

### Articles
- Routes: `/articles`, `/articles/[slug]`, `/articles/write`, `/articles/[slug]/edit`.
- Content is real HTML via Tiptap (Bold, Italic, H2 heading, bullet/numbered list, Link, Quote/callout). Sanitized server-side with `sanitize-html` before insert — allowlist: `p, div, br, b, strong, i, em, ul, ol, li, a, blockquote, h2, h3`. **Never loosen this without checking what the toolbar can actually produce.**
- Cover image upload (drag-and-drop, stored in `article-covers` bucket).
- Read time is **computed, not stored** — `app/lib/readTime.ts` `estimateReadTime()` strips HTML and does words/200wpm.
- Two submit buttons: Save Draft vs Publish, controlling the `published` boolean.
- Mandatory: title, category (topic), content.

### Discussions / Community
- Routes: `/community`, `/community/[id]`, `/community/write`, `/community/[id]/edit`.
- Plain-text content (no rich editor — simpler schema than Articles).
- No draft state — always visible once created.
- Numbered pagination on the listing (6/page, same pattern as Resources/Articles grids).
- "Hot" vs "Newest" sort toggle; Hot uses a `hotScore = likes + replies / (daysOld + 2)^1.5` formula.
- Mandatory: title, subject, type, year, content.

### Profile (`/profile/[userId]`)
- Tabs: Resources, Discussions, Articles, Comments, Saves (own profile only), Drafts (own profile only, articles with `published = false`).
- All tabs use `components/profile/LoadMoreList.tsx` — a "Load more" button pattern (6 at a time), **not** numbered pagination. That distinction is intentional (grids get page numbers, profile tabs get load-more).
- Drafts link to the article's **edit** page, not the (published-only) detail page, since visiting an unpublished article's detail page 404s.

### Homepage (`/`)
- Featured Resources carousel: real data, top 6 newest published resources.
- Trending discussions: real data, top 3 by `like_count` (was previously sorting ascending — i.e. showing the *least* liked — fixed).
- "Explore community" / "Explore Resources" CTAs and the Instagram promo block are already functional links.

## Established code patterns

- Server actions live in `app/lib/actions/{resources,articles,discussions,upload,profile,saved-items,likes,comments}.ts`, all `"use server"`, all return `ActionResult<T> = {success:true,data:T} | {success:false,error:string}`.
- Create/edit forms are client components. Dropdowns (`SortDropdown` in `components/articles/drop-down.tsx`, `FilterDropdown` in `components/community/drop-down.tsx`) are **plain `<button>`-based, not native form inputs** — their selected value must be manually appended via `formData.set(...)` in the submit handler, and manually validated (no native `required` support). Their internal buttons need `type="button"` or they'll accidentally submit the parent `<form>`.
- Edit routes reuse the same form component as create, passing an optional prefill prop (e.g. `resource`/`article`/`discussion`), switching between `create*`/`update*` calls based on whether that prop is present.
- Delete buttons are small client components: `confirm()` guard → call delete action → `router.push()` away on success.
- Card/panel components (`components/articles/article-panel.tsx`, `components/home/article-section/article-panel.tsx` for resources, `components/community/discussion-panel.tsx`) each accept an optional `href` prop to override their default detail-page link — used e.g. so Profile's Drafts tab can point articles at `/articles/[slug]/edit` instead of the normal (404-prone, since it's unpublished) detail page.
- `next/image` with `fill` needs an explicit `sizes` prop, or use accurate `width`/`height` matching the actual rendered size — a missing `sizes` caused a real blurry-image bug that got fixed.
- `next.config.ts` sets `experimental.serverActions.bodySizeLimit: "20mb"` (Next's default is 1MB) since file/cover-image uploads pass `File` objects directly as server action arguments. **Changing `next.config.ts` requires a dev server restart — not hot-reloaded.**

## Known gaps — left unfinished on purpose, not forgotten

- `components/detailed-articles/comments.tsx` (used on article/resource/discussion detail pages) is **still entirely fake** — hardcoded `[1,2,3,4,5,6]` list, no real submit, not wired to the `comments` table.
- Discussion replies: `discussion_replies` is fetched for real and the count is shown, but there's no UI to actually post a reply (same fake `Comments` component sits in that spot).
- Like/Heart buttons are decorative everywhere except where explicitly wired — `toggleLike` exists in `app/lib/actions/likes.ts` but nothing calls it yet.
- Homepage "Your Status" / "Top Contributors" sidecards are honest placeholders ("Login to see your status" / "Coming Soon..."), not wired to real data — left alone since they're not misleading.
- Pre-existing, never-fixed issues flagged repeatedly but out of scope each time: `components/profile/ProfileForm.tsx` imports a `User` type from `@/app/lib/types` that doesn't exist (TS error); `components/articles/article-grid.tsx` has a `let numButtons` that should be `const` (lint error); a handful of unused-import lint warnings scattered around.

## Environment quirks for whoever's driving

- The Claude Code preview/dev-server tooling **never worked reliably** for this project in past sessions — it's a secondary/"additional" working directory, not primary, and `preview_start` consistently reported success while nothing actually stayed listening. Expect to rely on `tsc --noEmit` + `eslint` for verification, and ask the user to manually test in their own running `npm run dev`.
- The user often edits files directly (or a linter reformats them) between turns — system reminders flag this; always treat it as intentional and re-read before assuming stale state.
- When something needs a decision only Supabase can answer (missing table, missing column, missing policy), the fix is SQL text handed to the user to run in the Supabase SQL editor — there's no direct DB access tool in play.
