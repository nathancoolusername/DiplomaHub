import { NextResponse } from "next/server";

// Dev only (/dev/forty-five): a sample board. 404 in production.
export async function GET() {
  if (process.env.NODE_ENV === "production") return new NextResponse(null, { status: 404 });
  const names = ["Amara", "Leo", "Priya", "Tomás", "Hana", "Sam", "Noor", "Kai"];
  const rows = names.map((name, i) => ({ rank: i + 1, name, isMe: false, score: 45 - 4 * Math.floor(i / 2), seconds: 70 + i * 23 }));
  return NextResponse.json({ board: { total: rows.length, rows }, standing: null, stats: null, likes: 12 });
}
