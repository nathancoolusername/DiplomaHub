import { NextResponse } from "next/server";
import { getCampaignJoined } from "@/lib/data/supabase/campaign";

// GET: how many students have joined the launch campaign, for the live counter
// on /pro. Public (just a number); cached at the edge for a minute.
export async function GET() {
  try {
    const joined = await getCampaignJoined();
    return NextResponse.json({ joined }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
