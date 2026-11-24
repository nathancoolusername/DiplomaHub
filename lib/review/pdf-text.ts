import "server-only";

// Plain text of chosen pages of a PDF, on the server (pdf.js, no worker or
// WebAssembly). Used to give Bro the pages a review comment is about.
export async function pdfPagesText(data: Uint8Array, pages: number[], maxChars = 9000): Promise<{ page: number; text: string }[]> {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = getDocument({ data, useWasm: false, verbosity: 0 } as Parameters<typeof getDocument>[0]);
  const doc = await task.promise;
  const out: { page: number; text: string }[] = [];
  let used = 0;
  try {
    for (const p of pages) {
      if (p < 1 || p > doc.numPages || used >= maxChars) continue;
      const tc = await (await doc.getPage(p)).getTextContent();
      const text = tc.items
        .map((i) => ("str" in i ? i.str + (i.hasEOL ? "\n" : " ") : ""))
        .join("")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .slice(0, maxChars - used);
      used += text.length;
      out.push({ page: p, text });
    }
  } finally {
    await task.destroy();
  }
  return out;
}
