import { ImageResponse } from "next/og";
import { normalizeCode } from "@/lib/codes";

// The preview card when a Deadline invite (/play/deadline/CODE) is pasted into
// WhatsApp, Discord or iMessage. It never reads the database: it only shows
// the room code from the URL.
export async function GET(request: Request) {
  const code = normalizeCode(new URL(request.url).searchParams.get("c") ?? "").slice(0, 4);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px 80px",
        background: "linear-gradient(135deg, #3b0d12 0%, #ba1a1a 100%)", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", fontSize: 36, fontWeight: 700, opacity: 0.9 }}>DiplomaHub · Deadline</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", fontSize: 58, fontWeight: 800 }}>{code.length === 4 ? "You're invited to a game" : "Deadline: the party game"}</div>
          {code.length === 4 ? (
            <div style={{ display: "flex" }}>
              <div style={{ display: "flex", padding: "18px 44px", borderRadius: 24, background: "rgba(255,255,255,0.14)", border: "2px solid rgba(255,255,255,0.4)",
                fontSize: 104, fontWeight: 800, letterSpacing: 24, fontFamily: "monospace" }}>
                {code}
              </div>
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", fontSize: 32, opacity: 0.9 }}>Name an answer before your deadline. Rarer answers score more. Last one in wins.</div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400, immutable" } },
  );
}
