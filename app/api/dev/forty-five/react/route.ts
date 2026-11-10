import { NextResponse } from "next/server";

// Dev only (/dev/forty-five): accepts a 👍/👎 and stores nothing. 404 in production.
export async function POST() {
  if (process.env.NODE_ENV === "production") return new NextResponse(null, { status: 404 });
  return NextResponse.json({ ok: true });
}
