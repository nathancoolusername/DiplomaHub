// Copies the flag SVGs Flags uses (4x3) from an unpacked flag-icons package
// into public/flags, plus its MIT licence. Only our 197 codes, nothing else.
//
//   npm pack flag-icons@7.6.0 && tar xzf flag-icons-7.6.0.tgz
//   node --experimental-strip-types scripts/flags/copy-svgs.mts path/to/package

import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ALL_CODES } from "../../lib/flags/countries.ts";

const pkg = process.argv[2];
if (!pkg || !existsSync(join(pkg, "flags", "4x3"))) {
  console.error("Usage: copy-svgs.mts <unpacked flag-icons package dir>");
  process.exit(1);
}

const out = join(process.cwd(), "public", "flags");
mkdirSync(out, { recursive: true });
const missing: string[] = [];
for (const code of ALL_CODES) {
  const src = join(pkg, "flags", "4x3", `${code}.svg`);
  if (!existsSync(src)) {
    missing.push(code);
    continue;
  }
  const svg = readFileSync(src, "utf8");
  if (/<script|\bon\w+\s*=|javascript:/i.test(svg)) throw new Error(`${code}.svg has script content`);
  copyFileSync(src, join(out, `${code}.svg`));
}
copyFileSync(join(pkg, "LICENSE"), join(out, "LICENSE-flag-icons.txt"));
console.log(`Copied ${ALL_CODES.length - missing.length} of ${ALL_CODES.length} flags.${missing.length ? ` Missing: ${missing.join(", ")}` : ""}`);
if (missing.length) process.exit(1);
