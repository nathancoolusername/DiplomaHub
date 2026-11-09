import { ImageResponse } from "next/og";

// Share card for /forty-five links. Static: never shows today's words.
export const alt = "Forty-Five: the daily IB word puzzle on DiplomaHub";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TILES = ["#006a61", "#f2b64c", "#002c98", "#9b2c2c"];

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0b1c30", color: "white", fontFamily: "serif", padding: "64px 72px", gap: 56 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 32, fontWeight: 700, opacity: 0.85, fontFamily: "sans-serif" }}>DiplomaHub</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", fontSize: 104, fontWeight: 700, lineHeight: 1 }}>Forty-Five</div>
            <div style={{ display: "flex", fontSize: 38, opacity: 0.9, fontFamily: "sans-serif" }}>16 IB words. 4 hidden groups. One puzzle a day.</div>
          </div>
          <div style={{ display: "flex", fontSize: 28, opacity: 0.75, fontFamily: "sans-serif" }}>Free to play · new puzzle at 00:00 UTC</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, justifyContent: "center" }}>
          {TILES.map((c, r) => (
            <div key={r} style={{ display: "flex", gap: 14 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ width: 96, height: 96, borderRadius: 18, background: c, opacity: 1 - r * 0.08 }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
