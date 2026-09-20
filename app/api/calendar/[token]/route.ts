import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { checkRateLimit, getClientIp } from "@/app/lib/ratelimit";
import { generateHubIcs, type IcsFeedItem } from "@/app/lib/ics";
import {
  getSubject,
  type CustomSubject,
  type HubItemStatus,
  type HubItemType,
  type SubjectId,
} from "@/components/hub/mock-data";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Public, unauthenticated route — identified purely by an unguessable
// bearer-style token in the URL, the same trust model as every other
// "secret calendar link" (Google, Notion, etc. all work this way). The
// service-role client is deliberately scoped to this one file: it's the
// only place in the app that needs to read a user's calendar data without
// that user's own session.
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const ip = await getClientIp();
  const rateLimit = await checkRateLimit("feed", ip);
  if (!rateLimit.allowed) {
    return new NextResponse("Too many requests", { status: 429 });
  }

  const { token: rawToken } = await params;
  const token = rawToken.endsWith(".ics") ? rawToken.slice(0, -4) : rawToken;
  if (!token) return new NextResponse(null, { status: 404 });

  const tokenHash = hashToken(token);
  const admin = createAdminClient();

  const { data: feed } = await admin
    .from("calendar_feeds")
    .select("id, user_id, include_tasks, include_study_blocks, last_accessed_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  // Same 404 whether the token is malformed, unknown, or was revoked by a
  // "Generate new link" — never distinguish, so a guess reveals nothing.
  if (!feed) return new NextResponse(null, { status: 404 });

  const now = new Date();
  const windowStart = new Date(now.getTime() - THIRTY_DAYS_MS);
  const windowEnd = new Date(now);
  windowEnd.setMonth(windowEnd.getMonth() + 12);

  const allowedTypes: HubItemType[] = ["ib_component", "university"];
  if (feed.include_tasks) allowedTypes.push("task");
  if (feed.include_study_blocks) allowedTypes.push("study_block");

  const [{ data: rows, error }, { data: ownerProfile }] = await Promise.all([
    admin
      .from("hub_items")
      .select("id, title, type, subject_id, start_at, end_at, all_day, status")
      .eq("owner_id", feed.user_id)
      .in("type", allowedTypes)
      .gte("start_at", windowStart.toISOString())
      .lte("start_at", windowEnd.toISOString()),
    admin.from("users").select("custom_hub_subjects").eq("id", feed.user_id).maybeSingle(),
  ]);

  if (error) return new NextResponse("Internal error", { status: 500 });

  const customSubjects = (ownerProfile?.custom_hub_subjects as CustomSubject[] | null) ?? [];

  const items: IcsFeedItem[] = (rows ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    type: row.type as HubItemType,
    subjectShortName: getSubject(row.subject_id as SubjectId | null, customSubjects)?.shortName ?? null,
    start: new Date(row.start_at as string),
    end: new Date(row.end_at as string),
    allDay: row.all_day as boolean,
    status: row.status as HubItemStatus,
  }));

  const ics = generateHubIcs(items);

  // Best-effort, throttled to at most once/hour per feed — not worth a
  // second round trip's latency on every single calendar-app refresh.
  const lastAccessed = feed.last_accessed_at ? new Date(feed.last_accessed_at as string) : null;
  if (!lastAccessed || now.getTime() - lastAccessed.getTime() > ONE_HOUR_MS) {
    await admin.from("calendar_feeds").update({ last_accessed_at: now.toISOString() }).eq("id", feed.id);
  }

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "private, no-cache, max-age=0",
    },
  });
}
