import { ImageResponse } from "next/og";

// Share card for /flags links. Static: never shows today's sprint.
export const alt = "Flags: name every flag against the clock, on DiplomaHub";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Simple striped flags (vertical or horizontal thirds), drawn, not images.
const FLAGS: { dir: "row" | "column"; c: [string, string, string] }[] = [
  { dir: "row", c: ["#0055a4", "#ffffff", "#ef4135"] },
  { dir: "column", c: ["#000000", "#dd0000", "#ffce00"] },
  { dir: "row", c: ["#009246", "#ffffff", "#ce2b37"] },
  { dir: "column", c: ["#ffffff", "#0039a6", "#d52b1e"] },
  { dir: "row", c: ["#169b62", "#ffffff", "#ff883e"] },
  { dir: "column", c: ["#ae1c28", "#ffffff", "#21468b"] },
  { dir: "row", c: ["#002b7f", "#fcd116", "#ce1126"] },
  { dir: "column", c: ["#fcd116", "#00843d", "#ce1126"] },
  { dir: "row", c: ["#000000", "#fae042", "#ed2939"] },
];

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0b1c30", color: "white", fontFamily: "serif", padding: "64px 72px", gap: 56 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 32, fontWeight: 700, opacity: 0.85, fontFamily: "sans-serif" }}>DiplomaHub</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", fontSize: 120, fontWeight: 700, lineHeight: 1 }}>Flags</div>
            <div style={{ display: "flex", fontSize: 38, opacity: 0.9, fontFamily: "sans-serif" }}>20 flags a day, or all 197 against the clock.</div>
          </div>
          <div style={{ display: "flex", fontSize: 28, opacity: 0.75, fontFamily: "sans-serif" }}>Free to play · new sprint at 00:00 UTC</div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", width: 444, gap: 18, alignContent: "center" }}>
          {FLAGS.map((f, i) => (
            <div key={i} style={{ display: "flex", flexDirection: f.dir, width: 136, height: 102, borderRadius: 10, overflow: "hidden", border: "2px solid rgba(255,255,255,0.25)" }}>
              {f.c.map((c, j) => (
                <div key={j} style={{ display: "flex", flex: 1, background: c }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
