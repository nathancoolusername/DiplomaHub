// Dev-only: a made-up 12-page "Maths IA" PDF for /dev/review, with the demo
// comments' quotes on the right pages. Built by hand (plain PDF 1.4, Helvetica).
const LINES: Record<number, string[]> = {
  1: ["Modelling the spread of a rumour", "", "Mathematics: analysis and approaches HL", "Internal assessment (demo file)"],
  2: ["1. Introduction", "", "Rumours spread through my school faster than any announcement.", "In this exploration I will investigate how well a logistic", "model describes the way a rumour spreads among students."],
  4: ["3. Early growth", "", "The first two days of responses are plotted below.", "", "Figure 2: spread over time", "", "The curve rises slowly at first and then much faster."],
  7: ["5. Fitting the model", "", "Using regression, the fitted curve passes close to every point,", "and this shows the model is accurate for the whole week."],
  9: ["6. Data collection", "", "I collected responses from 42 students in Year 12 over five days,", "asking each one when they first heard the rumour."],
  11: ["7. Carrying capacity", "", "Since not everyone hears every rumour, I estimate that", "the carrying capacity is 600 students for the whole school."],
};

function esc(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function build(): Uint8Array {
  const pages = 12;
  const objs: string[] = [];
  // 1 catalog, 2 pages, 3 font, then per page: page obj, content obj
  const pageIds = Array.from({ length: pages }, (_, i) => 4 + i * 2);
  objs[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objs[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages} >>`;
  objs[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  for (let p = 1; p <= pages; p++) {
    const lines = LINES[p] ?? [`Section text for page ${p}.`, "", "Working, tables and graphs would go here."];
    let y = 760;
    const body = lines
      .map((l, i) => {
        const size = i === 0 ? 18 : 12;
        const out = l ? `BT /F1 ${size} Tf 72 ${y} Td (${esc(l)}) Tj ET` : "";
        y -= i === 0 ? 30 : 20;
        return out;
      })
      .filter(Boolean)
      .join("\n") + `\nBT /F1 9 Tf 300 40 Td (${p}) Tj ET`;
    const pid = pageIds[p - 1];
    objs[pid] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${pid + 1} 0 R >>`;
    objs[pid + 1] = `<< /Length ${Buffer.byteLength(body, "latin1")} >>\nstream\n${body}\nendstream`;
  }
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (let i = 1; i < objs.length; i++) {
    offsets[i] = Buffer.byteLength(out, "latin1");
    out += `${i} 0 obj\n${objs[i]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(out, "latin1");
  out += `xref\n0 ${objs.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objs.length; i++) out += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  out += `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Uint8Array(Buffer.from(out, "latin1"));
}

export function GET() {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  return new Response(build() as BodyInit, { headers: { "content-type": "application/pdf" } });
}
