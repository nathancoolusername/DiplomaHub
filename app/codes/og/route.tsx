import { ImageResponse } from "next/og";
import { formatCode, normalizeCode } from "@/lib/codes";

// The preview card when a /codes?c=CODE link is pasted into WhatsApp,
// Discord or iMessage. It never reads the database: it only shows the code
// from the URL (so a guessed code reveals nothing about what it shares).
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("c") ?? "";
  const code = normalizeCode(raw).slice(0, 16);
  const shown = code ? formatCode(code) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #002c98 0%, #1f4fd1 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 36, fontWeight: 700, opacity: 0.9 }}>DiplomaHub</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", fontSize: 54, fontWeight: 700 }}>{shown ? "Someone shared something with you" : "Share sets and study plans"}</div>
          {shown ? (
            <div style={{ display: "flex" }}>
              <div
                style={{
                  display: "flex",
                  padding: "18px 40px",
                  borderRadius: 24,
                  background: "rgba(255,255,255,0.14)",
                  border: "2px solid rgba(255,255,255,0.35)",
                  fontSize: 88,
                  fontWeight: 700,
                  letterSpacing: 12,
                  fontFamily: "monospace",
                }}
              >
                {shown}
              </div>
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", fontSize: 32, opacity: 0.85 }}>
          {shown ? "Open the link to add it to your account. Free for IB students." : "Practice sets, Hub items and whole revision plans, with one code."}
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400, immutable" } },
  );
}
