@AGENTS.md

## Database security rules (mandatory)
- Every migration that creates a table in `public` MUST, in the same migration:
  1. `grant` only the privileges each role actually needs (anon usually none or select;
     authenticated as needed; `grant all ... to service_role`)
  2. `alter table ... enable row level security;`
  3. create explicit policies scoped with `(select auth.uid())`
- Never use `using (true)` on tables with personal data.
- New sequences used by the API need `grant usage, select on sequence ... to <role>`.
- Never expose `email` or private user fields to other users; use `public_profiles` for anything public.
  `public.users` is owner-only: read other users from `public_profiles` (embeds: `author:public_profiles(...)`),
  and read across all users only with the service-role client after an admin check.
- Users must never be able to write `points`, `is_pro`, `author_trust_score`, or similar
  privilege/score columns. Those change only via triggers, security-definer RPCs, or the admin client.
- If the Data API returns 42501, the table is missing a GRANT; add it in a migration.

Example template for a new table:

```sql
create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

grant select, insert on public.waitlist to authenticated;
grant all on public.waitlist to service_role;

alter table public.waitlist enable row level security;

create policy "waitlist_select_own" on public.waitlist
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "waitlist_insert_own" on public.waitlist
  for insert to authenticated with check ((select auth.uid()) = user_id);
```
