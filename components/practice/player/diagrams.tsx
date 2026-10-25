// Our own drawings for the booklets' reference viewer (Biology and Chemistry).
// Drawn from scratch as SVG (the facts follow the IB data booklets; the art is
// ours), in theme colours so they work in Light, Dark and Midnight. Each one is
// keyed by the id used in lib/booklets/*.ts (BookletDiagram.id).

import type { ReactNode } from "react";

type P = { children?: ReactNode };

/** Shared text: theme ink, a readable size in viewBox units. */
function T({ x, y, children, anchor = "middle", size = 14, weight, muted, italic }: { x: number; y: number; children: ReactNode; anchor?: "start" | "middle" | "end"; size?: number; weight?: number; muted?: boolean; italic?: boolean }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={weight} fontStyle={italic ? "italic" : undefined} className={muted ? "fill-on-surface-variant" : "fill-on-surface"} dominantBaseline="middle">
      {children}
    </text>
  );
}

/** A label with a leader line from the part (x1, y1) to the text (x2, y2). */
function Label({ x1, y1, x2, y2, text, anchor = "start" }: { x1: number; y1: number; x2: number; y2: number; text: string; anchor?: "start" | "end" | "middle" }) {
  const dx = anchor === "start" ? 6 : anchor === "end" ? -6 : 0;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-outline" strokeWidth={1.2} />
      <circle cx={x1} cy={y1} r={2.5} className="fill-outline" />
      <T x={x2 + dx} y={y2} anchor={anchor} size={14}>
        {text}
      </T>
    </g>
  );
}

function Svg({ w, h, title, children }: { w: number; h: number; title: string } & P) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title} className="w-full h-auto max-h-full" style={{ fontFamily: "var(--font-sans, Inter, sans-serif)" }}>
      <title>{title}</title>
      {children}
    </svg>
  );
}

function Arrow({ id }: { id: string }) {
  return (
    <defs>
      <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" className="fill-on-surface-variant" />
      </marker>
    </defs>
  );
}

// ── Biology ─────────────────────────────────────────────────────────────

function Water() {
  const O = { x: 260, y: 120 };
  const a = (52.25 * Math.PI) / 180;
  const H1 = { x: O.x - 105 * Math.sin(a), y: O.y + 105 * Math.cos(a) };
  const H2 = { x: O.x + 105 * Math.sin(a), y: O.y + 105 * Math.cos(a) };
  return (
    <Svg w={520} h={300} title="Water molecule">
      <line x1={O.x} y1={O.y} x2={H1.x} y2={H1.y} className="stroke-on-surface" strokeWidth={5} strokeLinecap="round" />
      <line x1={O.x} y1={O.y} x2={H2.x} y2={H2.y} className="stroke-on-surface" strokeWidth={5} strokeLinecap="round" />
      <path d={`M ${O.x - 28} ${O.y + 22} A 36 36 0 0 0 ${O.x + 28} ${O.y + 22}`} fill="none" className="stroke-on-surface-variant" strokeWidth={1.5} strokeDasharray="4 3" />
      <T x={O.x} y={O.y + 58} size={13} muted>
        104.5°
      </T>
      <circle cx={O.x} cy={O.y} r={44} className="fill-surface-container-lowest" />
      <circle cx={O.x} cy={O.y} r={44} className="fill-primary stroke-primary" fillOpacity={0.25} strokeWidth={2.5} />
      <T x={O.x} y={O.y} size={28} weight={700}>
        O
      </T>
      <T x={O.x + 58} y={O.y - 40} size={22} weight={700}>
        δ−
      </T>
      {[H1, H2].map((h, i) => (
        <g key={i}>
          <circle cx={h.x} cy={h.y} r={30} className="fill-surface-container-lowest" />
          <circle cx={h.x} cy={h.y} r={30} className="fill-secondary stroke-secondary" fillOpacity={0.25} strokeWidth={2.5} />
          <T x={h.x} y={h.y} size={22} weight={700}>
            H
          </T>
          <T x={h.x + (i ? 44 : -44)} y={h.y + 30} size={20} weight={700}>
            δ+
          </T>
        </g>
      ))}
      <T x={260} y={282} size={13} muted>
        Polar covalent bonds: oxygen is more electronegative than hydrogen
      </T>
    </Svg>
  );
}

function Nucleotide() {
  const pent = (cx: number, cy: number, r: number) =>
    Array.from({ length: 5 }, (_, i) => {
      const ang = (-90 + i * 72) * (Math.PI / 180);
      return `${cx + r * Math.cos(ang)},${cy + r * Math.sin(ang)}`;
    }).join(" ");
  return (
    <Svg w={620} h={300} title="Nucleotide structure">
      <line x1={118} y1={100} x2={212} y2={152} className="stroke-on-surface" strokeWidth={3} />
      <line x1={318} y1={170} x2={400} y2={170} className="stroke-on-surface" strokeWidth={3} />
      <circle cx={95} cy={88} r={40} className="fill-surface-container-lowest" />
      <circle cx={95} cy={88} r={40} className="fill-tertiary stroke-tertiary" fillOpacity={0.25} strokeWidth={2.5} />
      <T x={95} y={88} size={22} weight={700}>
        P
      </T>
      <polygon points={pent(265, 175, 62)} className="fill-surface-container-lowest" />
      <polygon points={pent(265, 175, 62)} className="fill-primary stroke-primary" fillOpacity={0.2} strokeWidth={2.5} strokeLinejoin="round" />
      <T x={265} y={180} size={15} weight={600}>
        pentose
      </T>
      <rect x={400} y={128} width={150} height={84} rx={8} className="fill-surface-container-lowest" />
      <rect x={400} y={128} width={150} height={84} rx={8} className="fill-secondary stroke-secondary" fillOpacity={0.22} strokeWidth={2.5} />
      <T x={475} y={170} size={15} weight={600}>
        base
      </T>
      <T x={95} y={150} size={14} muted>
        phosphate
      </T>
      <T x={265} y={262} size={14} muted>
        pentose sugar
      </T>
      <T x={475} y={232} size={14} muted>
        nitrogenous base
      </T>
      <T x={310} y={36} size={13} muted>
        DNA: deoxyribose · A T C G   RNA: ribose · A U C G
      </T>
    </Svg>
  );
}

function LightMicroscope() {
  return (
    <Svg w={600} h={460} title="Light microscope">
      {/* base and arm */}
      <rect x={170} y={392} width={250} height={34} rx={10} className="fill-surface-container stroke-outline" strokeWidth={2} />
      <path d="M 360 392 L 360 300 C 360 230 392 190 392 130 L 392 96 L 352 96 L 352 120 C 352 170 320 220 320 300 L 320 392 Z" className="fill-surface-container stroke-outline" strokeWidth={2} />
      {/* light source */}
      <ellipse cx={262} cy={370} rx={34} ry={12} className="fill-tertiary stroke-tertiary" fillOpacity={0.35} strokeWidth={2} />
      <path d="M 262 352 L 262 300 M 248 352 L 240 306 M 276 352 L 284 306" className="stroke-tertiary" strokeWidth={1.5} strokeDasharray="3 3" />
      {/* stage */}
      <rect x={160} y={276} width={210} height={14} rx={3} className="fill-on-surface-variant" fillOpacity={0.7} />
      <rect x={228} y={270} width={70} height={6} rx={2} className="fill-secondary" fillOpacity={0.6} />
      {/* body tube, nosepiece, objectives */}
      <path d="M 240 96 L 296 96 L 300 196 L 236 196 Z" className="fill-surface-container-high stroke-outline" strokeWidth={2} />
      <path d="M 220 196 L 316 196 L 306 214 L 230 214 Z" className="fill-on-surface-variant" fillOpacity={0.55} />
      <rect x={234} y={214} width={14} height={36} rx={3} className="fill-primary" fillOpacity={0.75} />
      <rect x={258} y={214} width={18} height={44} rx={3} className="fill-primary" fillOpacity={0.9} />
      <rect x={286} y={214} width={14} height={30} rx={3} className="fill-primary" fillOpacity={0.6} />
      {/* eyepiece */}
      <rect x={250} y={40} width={36} height={56} rx={5} className="fill-primary stroke-primary" fillOpacity={0.3} strokeWidth={2} />
      {/* focus knobs */}
      <circle cx={392} cy={262} r={22} className="fill-surface-container-high stroke-outline" strokeWidth={2} />
      <circle cx={392} cy={316} r={13} className="fill-surface-container-high stroke-outline" strokeWidth={2} />
      <Label x1={268} y1={60} x2={160} y2={60} text="eyepiece" anchor="end" />
      <Label x1={242} y1={238} x2={160} y2={200} text="objective lenses" anchor="end" />
      <Label x1={176} y1={283} x2={160} y2={283} text="stage" anchor="end" />
      <Label x1={240} y1={370} x2={160} y2={370} text="light source" anchor="end" />
      <Label x1={414} y1={262} x2={480} y2={240} text="coarse focus" />
      <Label x1={405} y1={318} x2={480} y2={318} text="fine focus" />
    </Svg>
  );
}

function StereoMicroscope() {
  return (
    <Svg w={720} h={460} title="Stereo microscope">
      {/* base with stage plate and bottom light */}
      <path d="M 150 400 L 470 400 Q 490 400 486 418 L 480 432 L 140 432 L 134 418 Q 130 400 150 400 Z" className="fill-surface-container stroke-outline" strokeWidth={2} />
      <ellipse cx={290} cy={398} rx={90} ry={14} className="fill-surface-container-high stroke-outline" strokeWidth={2} />
      <ellipse cx={290} cy={398} rx={30} ry={6} className="fill-tertiary" fillOpacity={0.45} />
      {/* pillar */}
      <rect x={398} y={120} width={30} height={282} rx={6} className="fill-surface-container-high stroke-outline" strokeWidth={2} />
      {/* head */}
      <path d="M 220 168 L 410 168 L 410 226 L 236 226 Q 220 226 220 210 Z" className="fill-surface-container stroke-outline" strokeWidth={2} />
      {/* objective */}
      <path d="M 250 226 L 320 226 L 312 268 L 258 268 Z" className="fill-primary stroke-primary" fillOpacity={0.3} strokeWidth={2} />
      {/* eyepieces */}
      <g transform="rotate(-28 250 168)">
        <rect x={220} y={92} width={26} height={78} rx={6} className="fill-primary stroke-primary" fillOpacity={0.35} strokeWidth={2} />
        <rect x={254} y={92} width={26} height={78} rx={6} className="fill-primary stroke-primary" fillOpacity={0.35} strokeWidth={2} />
      </g>
      {/* focus knob and top light */}
      <circle cx={438} cy={196} r={20} className="fill-surface-container-high stroke-outline" strokeWidth={2} />
      <path d="M 410 180 Q 372 150 352 214" fill="none" className="stroke-outline" strokeWidth={3} />
      <rect x={340} y={214} width={24} height={16} rx={4} className="fill-tertiary" fillOpacity={0.6} />
      <path d="M 344 232 L 316 380 M 358 232 L 330 380" className="stroke-tertiary" strokeWidth={1.4} strokeDasharray="3 3" />
      <Label x1={212} y1={100} x2={120} y2={80} text="eyepieces" anchor="end" />
      <Label x1={262} y1={250} x2={120} y2={250} text="objective" anchor="end" />
      <Label x1={220} y1={396} x2={120} y2={360} text="stage" anchor="end" />
      <Label x1={458} y1={196} x2={520} y2={170} text="focus" />
      <Label x1={364} y1={222} x2={520} y2={250} text="top light source" />
      <Label x1={318} y1={400} x2={520} y2={380} text="bottom light source" />
    </Svg>
  );
}

/** A glucose ring (simplified Haworth): ring O at top right, CH₂OH above C5, OH below C2/C3. `flip` turns it over (β chain). */
function Ring({ x, y, flip = false, ch2 = "CH₂OH" }: { x: number; y: number; flip?: boolean; ch2?: string }) {
  const s = flip ? -1 : 1;
  const pts = [
    [x + 34, y], // C1
    [x + 18, y + 18 * s], // C2
    [x - 18, y + 18 * s], // C3
    [x - 34, y], // C4
    [x - 18, y - 18 * s], // C5
    [x + 18, y - 18 * s], // O
  ];
  return (
    <g>
      <polygon points={pts.map((p) => p.join(",")).join(" ")} className="fill-primary stroke-primary" fillOpacity={0.14} strokeWidth={2} strokeLinejoin="round" />
      <line x1={pts[1][0]} y1={pts[1][1]} x2={pts[2][0]} y2={pts[2][1]} className="stroke-primary" strokeWidth={4.5} />
      <T x={pts[5][0] + 4} y={pts[5][1] - 1} size={12} weight={700}>
        O
      </T>
      <line x1={pts[4][0]} y1={pts[4][1]} x2={pts[4][0]} y2={pts[4][1] - 16 * s} className="stroke-on-surface" strokeWidth={1.4} />
      <T x={pts[4][0]} y={pts[4][1] - 24 * s} size={11}>
        {ch2}
      </T>
      <line x1={pts[1][0]} y1={pts[1][1]} x2={pts[1][0]} y2={pts[1][1] + 14 * s} className="stroke-on-surface" strokeWidth={1.4} />
      <T x={pts[1][0]} y={pts[1][1] + 22 * s} size={11}>
        OH
      </T>
      <line x1={pts[2][0]} y1={pts[2][1]} x2={pts[2][0]} y2={pts[2][1] + 14 * s} className="stroke-on-surface" strokeWidth={1.4} />
      <T x={pts[2][0]} y={pts[2][1] + 22 * s} size={11}>
        OH
      </T>
    </g>
  );
}

function Bridge({ x1, x2, y, label }: { x1: number; x2: number; y: number; label?: string }) {
  const m = (x1 + x2) / 2;
  return (
    <g>
      <polyline points={`${x1},${y} ${m},${y + 8} ${x2},${y}`} fill="none" className="stroke-on-surface" strokeWidth={1.6} />
      <T x={m} y={y + 8} size={11} weight={700}>
        O
      </T>
      {label && (
        <T x={m} y={y + 44} size={11} muted>
          {label}
        </T>
      )}
    </g>
  );
}

function Polysaccharides() {
  const chain = (y: number, n: number, flip: (i: number) => boolean, x0 = 90) =>
    Array.from({ length: n }, (_, i) => {
      const x = x0 + i * 100;
      return (
        <g key={i}>
          <Ring x={x} y={y} flip={flip(i)} />
          {i < n - 1 && <Bridge x1={x + 34} x2={x + 66} y={y} label={i === 0 ? undefined : undefined} />}
        </g>
      );
    });
  return (
    <Svg w={940} h={560} title="Structural polysaccharides">
      <T x={30} y={36} anchor="start" size={16} weight={700}>
        Starch (amylose)
      </T>
      <T x={30} y={56} anchor="start" size={12} muted>
        α-glucose · 1,4 glycosidic bonds · unbranched
      </T>
      {chain(130, 4, () => false)}
      <T x={30} y={236} anchor="start" size={16} weight={700}>
        Cellulose
      </T>
      <T x={30} y={256} anchor="start" size={12} muted>
        β-glucose · 1,4 bonds · every other glucose turned over
      </T>
      {chain(330, 4, (i) => i % 2 === 1)}
      <T x={520} y={36} anchor="start" size={16} weight={700}>
        Glycogen
      </T>
      <T x={520} y={56} anchor="start" size={12} muted>
        α-glucose · 1,4 bonds with 1,6 branches
      </T>
      {/* main chain */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <Ring x={570 + i * 100} y={470} ch2={i === 1 ? "CH₂" : "CH₂OH"} />
          {i < 3 && <Bridge x1={604 + i * 100} x2={636 + i * 100} y={470} />}
        </g>
      ))}
      {/* branch joined by a 1,6 bond to the second ring's C6 */}
      {[0, 1].map((i) => (
        <g key={i}>
          <Ring x={540 + i * 100} y={190 + i * 0} />
          {i < 1 && <Bridge x1={574} x2={606} y={190} />}
        </g>
      ))}
      <path d="M 674 190 C 700 220 690 330 652 420" fill="none" className="stroke-on-surface" strokeWidth={1.6} />
      <T x={692} y={318} size={11} weight={700}>
        O
      </T>
      <T x={760} y={318} anchor="start" size={12} muted>
        1,6 branch point
      </T>
      <line x1={704} y1={318} x2={754} y2={318} className="stroke-outline" strokeWidth={1} />
    </Svg>
  );
}

/** A C18 fatty-acid chain as a skeletal zigzag; `doubles` are bond numbers counted from the carboxyl carbon (C1=C2 is 1). */
function Chain({ y, doubles }: { y: number; doubles: number[] }) {
  const n = 18;
  const step = 27;
  const x0 = 250;
  // Carbon k (1 = carboxyl) sits at index n - k from the methyl end.
  const pt = (k: number) => {
    const i = n - k;
    return [x0 + i * step, y + (i % 2 === 0 ? 12 : -12)];
  };
  const seg: ReactNode[] = [];
  for (let k = n; k > 1; k--) {
    const [ax, ay] = pt(k);
    const [bx, by] = pt(k - 1);
    const isDouble = doubles.includes(k - 1);
    seg.push(<line key={k} x1={ax} y1={ay} x2={bx} y2={by} className={isDouble ? "stroke-error" : "stroke-on-surface"} strokeWidth={2.2} strokeLinecap="round" />);
    if (isDouble) {
      const dx = bx - ax;
      const dy = by - ay;
      const len = Math.hypot(dx, dy);
      const ox = (-dy / len) * 6;
      const oy = (dx / len) * 6;
      const sgn = ay < by ? 1 : -1;
      seg.push(
        <line key={`d${k}`} x1={ax + ox * sgn + dx * 0.15} y1={ay + oy * sgn + dy * 0.15} x2={bx + ox * sgn - dx * 0.15} y2={by + oy * sgn - dy * 0.15} className="stroke-error" strokeWidth={2.2} strokeLinecap="round" />,
      );
    }
  }
  const [cx, cy] = pt(1);
  return (
    <g>
      {seg}
      <T x={pt(18)[0] - 22} y={pt(18)[1]} size={12}>
        CH₃
      </T>
      <line x1={cx} y1={cy} x2={cx} y2={cy - 26} className="stroke-on-surface" strokeWidth={2.2} />
      <line x1={cx + 5} y1={cy} x2={cx + 5} y2={cy - 26} className="stroke-on-surface" strokeWidth={2.2} />
      <T x={cx + 3} y={cy - 36} size={13} weight={700}>
        O
      </T>
      <line x1={cx} y1={cy} x2={cx + 24} y2={cy} className="stroke-on-surface" strokeWidth={2.2} />
      <T x={cx + 46} y={cy} size={13} weight={700}>
        OH
      </T>
    </g>
  );
}

function FattyAcids() {
      const rows: { name: string; formula: string; kind: string; doubles: number[]; y: number }[] = [
    { name: "Stearic acid", formula: "C₁₈H₃₆O₂", kind: "saturated", doubles: [], y: 80 },
    { name: "Oleic acid", formula: "C₁₈H₃₄O₂", kind: "monounsaturated", doubles: [9], y: 210 },
    { name: "Linoleic acid", formula: "C₁₈H₃₂O₂", kind: "polyunsaturated", doubles: [9, 12], y: 340 },
  ];
  return (
    <Svg w={820} h={420} title="Fatty acids">
      {rows.map((r) => (
        <g key={r.name}>
          <T x={30} y={r.y - 18} anchor="start" size={16} weight={700}>
            {r.name}
          </T>
          <T x={30} y={r.y + 4} anchor="start" size={14}>
            {r.formula}
          </T>
          <T x={30} y={r.y + 24} anchor="start" size={13} muted>
            {r.kind}
          </T>
          <Chain y={r.y} doubles={r.doubles} />
        </g>
      ))}
      <T x={530} y={400} size={12} muted>
        Red: C=C double bond · each corner of the zigzag is a carbon with its hydrogens
      </T>
    </Svg>
  );
}

function AminoAcid() {
  const parts = [
    { x: 260, y: 70, label: "H", sub: "hydrogen", cls: "fill-surface-container-high" },
    { x: 100, y: 200, label: "H₂N", sub: "amine group", cls: "fill-secondary" },
    { x: 420, y: 200, label: "COOH", sub: "carboxyl group", cls: "fill-tertiary" },
    { x: 260, y: 330, label: "R", sub: "variable R group", cls: "fill-primary" },
  ];
  return (
    <Svg w={520} h={420} title="General structure of an amino acid">
      {parts.map((p) => (
        <line key={p.label} x1={260} y1={200} x2={p.x} y2={p.y} className="stroke-on-surface" strokeWidth={3} />
      ))}
      <circle cx={260} cy={200} r={40} className="fill-surface-container-high stroke-outline" strokeWidth={2.5} />
      <T x={260} y={200} size={24} weight={700}>
        C
      </T>
      {parts.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r={44} className="fill-surface-container-lowest" />
          <circle cx={p.x} cy={p.y} r={44} className={`${p.cls} stroke-outline`} fillOpacity={0.3} strokeWidth={2} />
          <T x={p.x} y={p.y} size={p.label.length > 2 ? 18 : 24} weight={700}>
            {p.label}
          </T>
          <T x={p.x} y={p.y + 60} size={13} muted>
            {p.sub}
          </T>
        </g>
      ))}
    </Svg>
  );
}

function EmSpectrum() {
  const x0 = 50;
  const x1 = 790;
  const lo = -16;
  const hi = 8;
  const X = (e: number) => x0 + ((e - lo) / (hi - lo)) * (x1 - x0);
  const regions: [string, number, number][] = [
    ["γ-rays", -16, -11],
    ["X-rays", -11, -8],
    ["UV", -8, Math.log10(4e-7)],
    ["", Math.log10(4e-7), Math.log10(7e-7)],
    ["IR", Math.log10(7e-7), -3],
    ["microwaves", -3, 0],
    ["radio waves", 0, 8],
  ];
  const vis = [
    ["V", 400, 425, "#8b3fd9"],
    ["I", 425, 465, "#4b3fd9"],
    ["B", 465, 491, "#2f6fe0"],
    ["G", 491, 575, "#2fa84f"],
    ["Y", 575, 585, "#e3cf2a"],
    ["O", 585, 647, "#ee8a21"],
    ["R", 647, 700, "#d8352f"],
  ] as const;
  const vx0 = 260;
  const vx1 = 600;
  const VX = (nm: number) => vx0 + ((nm - 400) / 300) * (vx1 - vx0);
  return (
    <Svg w={840} h={340} title="Electromagnetic spectrum and visible spectrum">
      <Arrow id="em-arrow" />
      {Array.from({ length: 13 }, (_, i) => lo + i * 2).map((e) => (
        <g key={e}>
          <line x1={X(e)} y1={70} x2={X(e)} y2={78} className="stroke-on-surface-variant" strokeWidth={1.2} />
          <T x={X(e)} y={56} size={12} muted>
            10{e < 0 ? "⁻" : ""}
            {String(Math.abs(e))
              .split("")
              .map((d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(d)])
              .join("")}
          </T>
        </g>
      ))}
      <T x={x1} y={36} anchor="end" size={12} muted>
        wavelength / m
      </T>
      {regions.map(([name, a, b], i) => (
        <g key={i}>
          <rect x={X(a)} y={80} width={X(b) - X(a)} height={44} className={name ? "fill-primary stroke-surface" : "fill-tertiary"} fillOpacity={name ? 0.08 + i * 0.03 : 0.9} strokeWidth={1.5} />
          {name && (
            <T x={(X(a) + X(b)) / 2} y={102} size={13}>
              {name}
            </T>
          )}
        </g>
      ))}
      <line x1={X(-14)} y1={24} x2={X(-2)} y2={24} className="stroke-on-surface-variant" strokeWidth={1.4} markerStart="url(#em-arrow)" />
      <T x={X(-8)} y={14} size={12} muted>
        increasing energy
      </T>
      <path d={`M ${X(Math.log10(4e-7))} 124 L ${vx0} 196 M ${X(Math.log10(7e-7))} 124 L ${vx1} 196`} className="stroke-outline" strokeWidth={1.2} strokeDasharray="4 3" fill="none" />
      {vis.map(([l, a, b, c]) => (
        <g key={l}>
          <rect x={VX(a)} y={198} width={VX(b) - VX(a)} height={50} fill={c} />
          <T x={(VX(a) + VX(b)) / 2} y={262} size={13} weight={700}>
            {l}
          </T>
        </g>
      ))}
      <T x={vx0} y={290} size={12} muted>
        400 nm
      </T>
      <T x={vx1} y={290} size={12} muted>
        700 nm
      </T>
      <T x={(vx0 + vx1) / 2} y={312} size={13} muted>
        visible light (wavelength / nm)
      </T>
    </Svg>
  );
}

function Neuron() {
  const dend = [
    "M 140 150 C 110 110 90 90 60 80",
    "M 120 140 C 90 130 60 140 30 120",
    "M 130 175 C 100 200 80 220 50 230",
    "M 150 185 C 150 220 130 250 110 275",
    "M 160 120 C 165 80 150 55 130 30",
    "M 175 120 C 190 85 215 70 240 55",
    "M 90 93 C 80 70 85 55 70 40",
    "M 80 215 C 60 215 40 205 20 210",
  ];
  const myelin = [270, 350, 430, 510, 590];
  return (
    <Svg w={860} h={320} title="Neuron">
      {dend.map((d, i) => (
        <path key={i} d={d} fill="none" className="stroke-secondary" strokeWidth={i < 6 ? 5 : 3} strokeLinecap="round" />
      ))}
      <ellipse cx={165} cy={155} rx={52} ry={44} className="fill-secondary stroke-secondary" fillOpacity={0.25} strokeWidth={3} />
      <circle cx={165} cy={155} r={17} className="fill-secondary" fillOpacity={0.7} />
      <path d="M 214 155 L 250 155" className="stroke-secondary" strokeWidth={6} />
      <line x1={250} y1={155} x2={690} y2={155} className="stroke-secondary" strokeWidth={4} />
      {myelin.map((x) => (
        <rect key={x} x={x - 30} y={141} width={66} height={28} rx={12} className="fill-tertiary stroke-tertiary" fillOpacity={0.35} strokeWidth={2} />
      ))}
      {["M 690 155 C 720 140 735 110 760 90", "M 690 155 C 730 150 760 150 790 140", "M 690 155 C 725 170 745 195 770 215", "M 700 156 C 730 190 735 230 750 255"].map((d, i) => (
        <path key={i} d={d} fill="none" className="stroke-secondary" strokeWidth={3.5} strokeLinecap="round" />
      ))}
      {[
        [760, 90],
        [790, 140],
        [770, 215],
        [750, 255],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r={8} className="fill-secondary" fillOpacity={0.6} />
      ))}
      <Label x1={60} y1={80} x2={40} y2={30} text="dendrites" anchor="middle" />
      <Label x1={190} y1={186} x2={210} y2={290} text="cell body" anchor="middle" />
      <Label x1={165} y1={155} x2={300} y2={240} text="nucleus" />
      <Label x1={350} y1={141} x2={350} y2={70} text="myelin sheath" anchor="middle" />
      <Label x1={390} y1={155} x2={460} y2={240} text="node of Ranvier" />
      <Label x1={640} y1={155} x2={620} y2={70} text="axon" anchor="middle" />
      <Label x1={770} y1={215} x2={760} y2={295} text="axon terminals" anchor="middle" />
    </Svg>
  );
}

/** One section of gut: two walls with a squeeze just above the bolus. */
function Gut({ x, bolus }: { x: number; bolus: number }) {
    const pinchAt = bolus - 64;
    const half = (y: number) => 34 + 18 * Math.exp(-(((y - bolus) / 34) ** 2)) - 17 * Math.exp(-(((y - pinchAt) / 22) ** 2));
    const ys = Array.from({ length: 61 }, (_, i) => 40 + i * 6);
    const left = ys.map((y) => `${x - half(y)},${y}`).join(" ");
    const right = ys.map((y) => `${x + half(y)},${y}`).join(" ");
    return (
      <g>
        <polyline points={left} fill="none" className="stroke-secondary" strokeWidth={10} strokeLinejoin="round" strokeOpacity={0.55} />
        <polyline points={right} fill="none" className="stroke-secondary" strokeWidth={10} strokeLinejoin="round" strokeOpacity={0.55} />
        <ellipse cx={x} cy={bolus} rx={30} ry={30} className="fill-tertiary" fillOpacity={0.55} />
        <line x1={x - 92} y1={pinchAt} x2={x - 58} y2={pinchAt} className="stroke-on-surface-variant" strokeWidth={2} markerEnd="url(#pa)" />
        <line x1={x + 92} y1={pinchAt} x2={x + 58} y2={pinchAt} className="stroke-on-surface-variant" strokeWidth={2} markerEnd="url(#pa)" />
      </g>
    );
  }

function Peristalsis() {
  return (
    <Svg w={820} h={460} title="Peristalsis">
      <Arrow id="pa" />
      <Gut x={170} bolus={176} />
      <Gut x={410} bolus={250} />
      <Gut x={650} bolus={350} />
      <line x1={40} y1={70} x2={40} y2={380} className="stroke-on-surface" strokeWidth={2.5} markerEnd="url(#pa)" />
      <T x={40} y={410} size={13}>
        direction
      </T>
      <T x={40} y={428} size={13}>
        of food
      </T>
      <Label x1={145} y1={112} x2={250} y2={60} text="circular muscle contracts behind the food" />
      <Label x1={196} y1={176} x2={250} y2={196} text="bolus (food)" />
      <T x={410} y={438} size={13} muted>
        the wave of contraction moves along the gut
      </T>
    </Svg>
  );
}

/** Standard normal curve, x in SD units → path points. */
function bell(cx: number, base: number, sd: number, height: number, from = -4, to = 4) {
  const pts: string[] = [];
  for (let z = from; z <= to + 1e-9; z += 0.05) pts.push(`${cx + z * sd},${base - height * Math.exp(-(z * z) / 2)}`);
  return pts;
}

function NormalSd() {
  const cx = 420;
  const base = 280;
  const sd = 88;
  const h = 190;
  const band = (a: number, b: number) => `M ${cx + a * sd} ${base} L ${bell(cx, base, sd, h, a, b).join(" L ")} L ${cx + b * sd} ${base} Z`;
  const bands: [number, number, number][] = [
    [-1, 1, 0.55],
    [-2, -1, 0.35],
    [1, 2, 0.35],
    [-3, -2, 0.2],
    [2, 3, 0.2],
    [-4, -3, 0.1],
    [3, 4, 0.1],
  ];
  const pct: [number, string][] = [
    [-3.5, "0.15%"],
    [-2.5, "2.35%"],
    [-1.5, "13.5%"],
    [-0.5, "34%"],
    [0.5, "34%"],
    [1.5, "13.5%"],
    [2.5, "2.35%"],
    [3.5, "0.15%"],
  ];
  const bracket = (k: number, y: number, label: string) => (
    <g>
      <line x1={cx - k * sd} y1={y} x2={cx + k * sd} y2={y} className="stroke-on-surface-variant" strokeWidth={1.4} />
      <line x1={cx - k * sd} y1={y - 6} x2={cx - k * sd} y2={y + 6} className="stroke-on-surface-variant" strokeWidth={1.4} />
      <line x1={cx + k * sd} y1={y - 6} x2={cx + k * sd} y2={y + 6} className="stroke-on-surface-variant" strokeWidth={1.4} />
      <T x={cx} y={y - 12} size={13} weight={600}>
        {label}
      </T>
    </g>
  );
  return (
    <Svg w={840} h={340} title="Normal distribution and standard deviation">
      {bands.map(([a, b, o]) => (
        <path key={`${a}${b}`} d={band(a, b)} className="fill-primary stroke-surface" fillOpacity={o} strokeWidth={1} />
      ))}
      <polyline points={bell(cx, base, sd, h).join(" ")} fill="none" className="stroke-primary" strokeWidth={2.5} />
      <line x1={40} y1={base} x2={800} y2={base} className="stroke-on-surface" strokeWidth={1.5} />
      {pct.map(([z, t]) => (
        <T key={z} x={cx + z * sd} y={base - 14} size={12} weight={600}>
          {t}
        </T>
      ))}
      {[-3, -2, -1, 0, 1, 2, 3].map((z) => (
        <T key={z} x={cx + z * sd} y={base + 20} size={12} muted>
          {z === 0 ? "mean" : `${z > 0 ? "+" : "−"}${Math.abs(z)} SD`}
        </T>
      ))}
      {bracket(1, 96, "68%")}
      {bracket(2, 62, "95%")}
      {bracket(3, 28, "99.7%")}
    </Svg>
  );
}

function BoxPlot() {
  const cx = 420;
  const base = 380;
  const sd = 90;
  const h = 150;
  const q = 0.6745;
  const w = 2.698;
  const area = (a: number, b: number, o: number) => <path d={`M ${cx + a * sd} ${base} L ${bell(cx, base, sd, h, a, b).join(" L ")} L ${cx + b * sd} ${base} Z`} className="fill-primary" fillOpacity={o} />;
  const by = 120;
  return (
    <Svg w={840} h={420} title="Box and whisker plot for a normal distribution">
      {area(-4, -w, 0.08)}
      {area(-w, -q, 0.3)}
      {area(-q, q, 0.55)}
      {area(q, w, 0.3)}
      {area(w, 4, 0.08)}
      <polyline points={bell(cx, base, sd, h).join(" ")} fill="none" className="stroke-primary" strokeWidth={2.5} />
      <line x1={40} y1={base} x2={800} y2={base} className="stroke-on-surface" strokeWidth={1.5} />
      {[-w, -q, q, w].map((z) => (
        <line key={z} x1={cx + z * sd} y1={by} x2={cx + z * sd} y2={base} className="stroke-outline" strokeWidth={1.2} strokeDasharray="5 4" />
      ))}
      {/* box and whiskers */}
      <line x1={cx - w * sd} y1={by} x2={cx - q * sd} y2={by} className="stroke-on-surface" strokeWidth={2} />
      <line x1={cx + q * sd} y1={by} x2={cx + w * sd} y2={by} className="stroke-on-surface" strokeWidth={2} />
      <line x1={cx - w * sd} y1={by - 12} x2={cx - w * sd} y2={by + 12} className="stroke-on-surface" strokeWidth={2} />
      <line x1={cx + w * sd} y1={by - 12} x2={cx + w * sd} y2={by + 12} className="stroke-on-surface" strokeWidth={2} />
      <rect x={cx - q * sd} y={by - 24} width={2 * q * sd} height={48} className="fill-tertiary stroke-on-surface" fillOpacity={0.35} strokeWidth={2} />
      <line x1={cx} y1={by - 24} x2={cx} y2={by + 24} className="stroke-on-surface" strokeWidth={2.5} />
      {[-3.3, -3.1, -2.9, 2.9, 3.1, 3.3].map((z) => (
        <circle key={z} cx={cx + z * sd} cy={by} r={4} className="fill-on-surface-variant" />
      ))}
      <T x={cx - q * sd} y={by - 38} size={13} weight={600}>
        Q1
      </T>
      <T x={cx + q * sd} y={by - 38} size={13} weight={600}>
        Q3
      </T>
      <T x={cx} y={by - 56} size={13} weight={600}>
        IQR
      </T>
      <line x1={cx - q * sd} y1={by - 48} x2={cx + q * sd} y2={by - 48} className="stroke-on-surface-variant" strokeWidth={1.2} />
      <T x={cx} y={by + 40} size={12} muted>
        median
      </T>
      <T x={cx - w * sd} y={by - 30} size={12}>
        Q1 − 1.5 × IQR
      </T>
      <T x={cx + w * sd} y={by - 30} size={12}>
        Q3 + 1.5 × IQR
      </T>
      <T x={cx - 3.1 * sd} y={by + 22} size={12} muted>
        outliers
      </T>
      <T x={cx + 3.1 * sd} y={by + 22} size={12} muted>
        outliers
      </T>
      {[
        [-w, "−2.698σ"],
        [-q, "−0.6745σ"],
        [q, "0.6745σ"],
        [w, "2.698σ"],
      ].map(([z, t]) => (
        <T key={t as string} x={cx + (z as number) * sd} y={by + 70} size={12} muted italic>
          {t}
        </T>
      ))}
      <T x={cx - 1.7 * sd} y={base - 22} size={13} weight={600}>
        24.65%
      </T>
      <T x={cx} y={base - 40} size={13} weight={600}>
        50%
      </T>
      <T x={cx + 1.7 * sd} y={base - 22} size={13} weight={600}>
        24.65%
      </T>
      {[-3, -2, -1, 0, 1, 2, 3].map((z) => (
        <T key={z} x={cx + z * sd} y={base + 20} size={12} muted italic>
          {z === 0 ? "μ" : `${z > 0 ? "+" : "−"}${Math.abs(z)}σ`}
        </T>
      ))}
    </Svg>
  );
}

function Sq({ x, y, filled }: { x: number; y: number; filled?: boolean }) {
  return <rect x={x - 18} y={y - 18} width={36} height={36} className={filled ? "fill-on-surface stroke-on-surface" : "fill-surface stroke-on-surface"} strokeWidth={2} />;
}

function Ci({ x, y, filled }: { x: number; y: number; filled?: boolean }) {
  return <circle cx={x} cy={y} r={18} className={filled ? "fill-on-surface stroke-on-surface" : "fill-surface stroke-on-surface"} strokeWidth={2} />;
}

function Pedigree() {
  const legend: [ReactNode, string][] = [
    [<Sq key="m" x={70} y={50} />, "male"],
    [<Ci key="f" x={70} y={110} />, "female"],
    [
      <g key="mate">
        <line x1={40} y1={170} x2={100} y2={170} className="stroke-on-surface" strokeWidth={2} />
        <Ci x={40} y={170} />
        <Sq x={100} y={170} />
      </g>,
      "mating",
    ],
    [
      <g key="aff">
        <Ci x={46} y={234} filled />
        <Sq x={96} y={234} filled />
      </g>,
      "affected individuals",
    ],
    [
      <g key="un">
        <Ci x={46} y={298} />
        <Sq x={96} y={298} />
      </g>,
      "unaffected individuals",
    ],
  ];
  return (
    <Svg w={820} h={350} title="Pedigree symbols">
      {legend.map(([shape, text], i) => (
        <g key={text}>
          {shape}
          <T x={150} y={50 + i * 62 - (i > 1 ? (i - 2) * -2 : 0)} anchor="start" size={15}>
            {text}
          </T>
        </g>
      ))}
      <line x1={440} y1={0} x2={440} y2={350} className="stroke-outline-variant" strokeWidth={1} />
      <T x={480} y={60} size={16} weight={700}>
        I
      </T>
      <T x={480} y={170} size={16} weight={700}>
        II
      </T>
      <line x1={560} y1={60} x2={640} y2={60} className="stroke-on-surface" strokeWidth={2} />
      <Ci x={560} y={60} />
      <Sq x={640} y={60} />
      <line x1={600} y1={60} x2={600} y2={120} className="stroke-on-surface" strokeWidth={2} />
      <line x1={540} y1={120} x2={700} y2={120} className="stroke-on-surface" strokeWidth={2} />
      {[540, 620, 700].map((x) => (
        <line key={x} x1={x} y1={120} x2={x} y2={152} className="stroke-on-surface" strokeWidth={2} />
      ))}
      <Sq x={540} y={170} />
      <Ci x={620} y={170} filled />
      <Sq x={700} y={170} />
      {[540, 620, 700].map((x, i) => (
        <T key={x} x={x} y={208} size={14}>
          {i + 1}
        </T>
      ))}
      <T x={470} y={252} anchor="start" size={13} muted>
        Roman numerals (I, II …): generations
      </T>
      <T x={470} y={276} anchor="start" size={13} muted>
        Arabic numbers (1, 2 …): individuals in a generation
      </T>
      <T x={470} y={300} anchor="start" size={13} muted>
        Children left to right, oldest to youngest
      </T>
    </Svg>
  );
}

/** Small bacterium icon, with phage DNA inside, integrated, or new phages. */
function Cell({ x, y, kind }: { x: number; y: number; kind: "dna" | "phages" | "prophage" | "burst" | "plain" | "divide" }) {
  return (
    <g>
      {kind === "divide" ? (
        <>
          <rect x={x - 54} y={y - 24} width={52} height={48} rx={22} className="fill-surface-container stroke-outline" strokeWidth={2} />
          <rect x={x + 2} y={y - 24} width={52} height={48} rx={22} className="fill-surface-container stroke-outline" strokeWidth={2} />
          <path d={`M ${x - 46} ${y} q 10 -14 20 0 t 20 0`} fill="none" className="stroke-on-surface" strokeWidth={2} />
          <path d={`M ${x + 10} ${y} q 10 -14 20 0 t 20 0`} fill="none" className="stroke-on-surface" strokeWidth={2} />
          <path d={`M ${x - 30} ${y + 6} l 12 0`} className="stroke-error" strokeWidth={3} />
          <path d={`M ${x + 26} ${y + 6} l 12 0`} className="stroke-error" strokeWidth={3} />
        </>
      ) : (
        <>
          <rect x={x - 54} y={y - 26} width={108} height={52} rx={26} className={kind === "burst" ? "fill-surface stroke-outline" : "fill-surface-container stroke-outline"} strokeWidth={2} strokeDasharray={kind === "burst" ? "6 5" : undefined} />
          {kind !== "burst" && <path d={`M ${x - 36} ${y + 2} q 12 -16 24 0 t 24 0 t 24 0`} fill="none" className="stroke-on-surface" strokeWidth={2} />}
          {kind === "dna" && <path d={`M ${x - 10} ${y - 10} q 8 -8 16 0`} fill="none" className="stroke-error" strokeWidth={3} />}
          {kind === "prophage" && <path d={`M ${x - 6} ${y + 2} q 6 -8 12 0`} fill="none" className="stroke-error" strokeWidth={3.5} />}
          {(kind === "phages" || kind === "burst") &&
            [-32, -10, 12, 34].map((dx) => (
              <g key={dx}>
                <polygon points={`${x + dx},${y - 16} ${x + dx + 7},${y - 12} ${x + dx + 7},${y - 4} ${x + dx},${y} ${x + dx - 7},${y - 4} ${x + dx - 7},${y - 12}`} className="fill-error" fillOpacity={0.7} />
                <line x1={x + dx} y1={y} x2={x + dx} y2={y + 14} className="stroke-error" strokeWidth={2} />
              </g>
            ))}
        </>
      )}
    </g>
  );
}

function LyticLysogenic() {
  const stepsL = [
    { x: 260, y: 80, kind: "plain" as const, t: "1 Phage attaches to the bacterium", dy: -40 },
    { x: 400, y: 220, kind: "dna" as const, t: "2 Phage DNA injected", dy: -40 },
    { x: 260, y: 360, kind: "phages" as const, t: "3 New phages made and assembled", dy: 44 },
    { x: 120, y: 220, kind: "burst" as const, t: "4 Cell bursts (lysis), phages released", dy: 44 },
  ];
  const stepsR = [
    { x: 680, y: 80, kind: "prophage" as const, t: "Phage DNA joins the chromosome (prophage)", dy: -40 },
    { x: 830, y: 220, kind: "divide" as const, t: "Cell divides: prophage copied each time", dy: 44 },
    { x: 680, y: 360, kind: "prophage" as const, t: "Induction: prophage leaves, lytic cycle starts", dy: 44 },
  ];
  return (
    <Svg w={980} h={450} title="Lytic and lysogenic cycles">
      <Arrow id="ly" />
      <T x={260} y={220} size={18} weight={700}>
        Lytic cycle
      </T>
      <T x={690} y={220} size={18} weight={700}>
        Lysogenic cycle
      </T>
      <path d="M 314 100 Q 384 128 398 186" fill="none" className="stroke-on-surface-variant" strokeWidth={2} markerEnd="url(#ly)" />
      <path d="M 394 254 Q 372 330 318 350" fill="none" className="stroke-on-surface-variant" strokeWidth={2} markerEnd="url(#ly)" />
      <path d="M 206 362 Q 136 334 124 254" fill="none" className="stroke-on-surface-variant" strokeWidth={2} markerEnd="url(#ly)" />
      <path d="M 130 186 Q 150 106 206 86" fill="none" className="stroke-on-surface-variant" strokeWidth={2} markerEnd="url(#ly)" />
      <path d="M 456 212 Q 540 120 620 94" fill="none" className="stroke-on-surface-variant" strokeWidth={2} markerEnd="url(#ly)" />
      <path d="M 740 98 Q 812 130 828 186" fill="none" className="stroke-on-surface-variant" strokeWidth={2} markerEnd="url(#ly)" />
      <path d="M 828 254 Q 808 330 742 352" fill="none" className="stroke-on-surface-variant" strokeWidth={2} markerEnd="url(#ly)" />
      <path d="M 624 368 Q 470 420 322 372" fill="none" className="stroke-error" strokeWidth={2} strokeDasharray="6 4" markerEnd="url(#ly)" />
      {[...stepsL, ...stepsR].map((s) => (
        <g key={s.t}>
          <Cell x={s.x} y={s.y} kind={s.kind} />
          <T x={s.x} y={s.y + s.dy} size={12} muted>
            {s.t}
          </T>
        </g>
      ))}
      <T x={540} y={150} size={12} muted>
        or
      </T>
    </Svg>
  );
}

function Haemoglobin() {
  const x0 = 80;
  const y0 = 360;
  const W = 500;
  const H = 300;
  const X = (kpa: number) => x0 + (kpa / 14) * W;
  const Y = (pct: number) => y0 - (pct / 100) * H;
  // Hill curves fitted to the shape of the booklet's graph (not physiological reference values).
  const curve = (p50: number, n: number) =>
    Array.from({ length: 131 }, (_, i) => {
      const p = i * 0.1;
      const s = (97 * p ** n) / (p50 ** n + p ** n);
      return `${X(p)},${Y(s)}`;
    }).join(" ");
  return (
    <Svg w={640} h={430} title="Oxygen dissociation curves of adult and foetal haemoglobin">
      {[0, 20, 40, 60, 80, 100].map((v) => (
        <g key={v}>
          <line x1={x0} y1={Y(v)} x2={x0 + W} y2={Y(v)} className="stroke-outline-variant" strokeWidth={1} />
          <T x={x0 - 12} y={Y(v)} anchor="end" size={12} muted>
            {v}
          </T>
        </g>
      ))}
      {[0, 2, 4, 6, 8, 10, 12, 14].map((v) => (
        <g key={v}>
          <line x1={X(v)} y1={y0} x2={X(v)} y2={y0 + 6} className="stroke-on-surface" strokeWidth={1.2} />
          <T x={X(v)} y={y0 + 20} size={12} muted>
            {v}
          </T>
        </g>
      ))}
      <line x1={x0} y1={y0} x2={x0 + W} y2={y0} className="stroke-on-surface" strokeWidth={1.5} />
      <line x1={x0} y1={y0} x2={x0} y2={y0 - H} className="stroke-on-surface" strokeWidth={1.5} />
      <polyline points={curve(3.64, 2.9)} fill="none" className="stroke-secondary" strokeWidth={3.5} />
      <polyline points={curve(4.83, 3.07)} fill="none" className="stroke-primary" strokeWidth={3.5} />
      <Label x1={X(3.4)} y1={Y(48)} x2={X(2.3)} y2={Y(86)} text="foetal haemoglobin" anchor="end" />
      <Label x1={X(6.4)} y1={Y(66)} x2={X(9)} y2={Y(45)} text="adult haemoglobin" />
      <T x={x0 + W / 2} y={y0 + 46} size={13}>
        partial pressure of oxygen / kPa
      </T>
      <text x={24} y={y0 - H / 2} textAnchor="middle" fontSize={13} className="fill-on-surface" transform={`rotate(-90 24 ${y0 - H / 2})`}>
        % saturation of haemoglobin
      </text>
    </Svg>
  );
}

function Sarcomere() {
  const zL = 70;
  const zR = 830;
  const rowsActin = [110, 170, 230, 290];
  const rowsMyosin = [140, 200, 260];
  const actinLen = 290;
  const myoL = 270;
  const myoR = 630;
  const wave = (x1: number, x2: number, y: number) => {
    let d = `M ${x1} ${y}`;
    for (let x = x1; x < x2; x += 20) d += ` q 5 -7 10 0 t 10 0`;
    return d;
  };
  return (
    <Svg w={900} h={420} title="Sarcomere in a relaxed myofibril">
      {/* thin filaments (actin) with tropomyosin */}
      {rowsActin.map((y) => (
        <g key={y}>
          <line x1={zL} y1={y} x2={zL + actinLen} y2={y} className="stroke-secondary" strokeWidth={6} strokeLinecap="round" />
          <line x1={zR - actinLen} y1={y} x2={zR} y2={y} className="stroke-secondary" strokeWidth={6} strokeLinecap="round" />
          <path d={wave(zL, zL + actinLen, y)} fill="none" className="stroke-tertiary" strokeWidth={1.6} />
          <path d={wave(zR - actinLen, zR, y)} fill="none" className="stroke-tertiary" strokeWidth={1.6} />
        </g>
      ))}
      {/* thick filaments (myosin) with heads, titin springs to the Z discs */}
      {rowsMyosin.map((y) => (
        <g key={y}>
          <path d={`M ${zL} ${y} ${Array.from({ length: 20 }, (_, i) => `L ${zL + 10 + i * 10} ${y + (i % 2 ? -5 : 5)}`).join(" ")} L ${myoL} ${y}`} fill="none" className="stroke-on-surface-variant" strokeWidth={1.4} />
          <path d={`M ${zR} ${y} ${Array.from({ length: 20 }, (_, i) => `L ${zR - 10 - i * 10} ${y + (i % 2 ? -5 : 5)}`).join(" ")} L ${myoR} ${y}`} fill="none" className="stroke-on-surface-variant" strokeWidth={1.4} />
          <rect x={myoL} y={y - 7} width={myoR - myoL} height={14} rx={7} className="fill-primary" fillOpacity={0.75} />
          {Array.from({ length: 9 }, (_, i) => myoL + 8 + i * 12)
            .concat(Array.from({ length: 9 }, (_, i) => myoR - 8 - i * 12))
            .map((x, i) => (
              <g key={i}>
                <line x1={x} y1={y - 7} x2={x + (x < 450 ? -6 : 6)} y2={y - 16} className="stroke-primary" strokeWidth={2.5} />
                <line x1={x} y1={y + 7} x2={x + (x < 450 ? -6 : 6)} y2={y + 16} className="stroke-primary" strokeWidth={2.5} />
              </g>
            ))}
        </g>
      ))}
      {/* Z discs */}
      <rect x={zL - 6} y={86} width={12} height={228} rx={3} className="fill-on-surface" fillOpacity={0.75} />
      <rect x={zR - 6} y={86} width={12} height={228} rx={3} className="fill-on-surface" fillOpacity={0.75} />
      {/* labels */}
      <Label x1={zL} y1={88} x2={zL} y2={40} text="Z disc" anchor="middle" />
      <Label x1={zR} y1={88} x2={zR} y2={40} text="Z disc" anchor="middle" />
      <Label x1={200} y1={110} x2={200} y2={40} text="actin (thin filament)" anchor="middle" />
      <Label x1={450} y1={140} x2={450} y2={40} text="myosin (thick filament)" anchor="middle" />
      <Label x1={715} y1={107} x2={660} y2={64} text="tropomyosin" anchor="middle" />
      <Label x1={790} y1={140} x2={800} y2={64} text="titin" anchor="start" />
      {/* bands */}
      {[
        [zL, myoL, 340, "I band"],
        [myoR, zR, 340, "I band"],
        [zL + actinLen, zR - actinLen, 340, "H zone"],
        [myoL, myoR, 384, "A band"],
      ].map(([a, b, y, t]) => (
        <g key={`${t}${a}`}>
          <path d={`M ${a} ${(y as number) - 10} L ${a} ${y} L ${b} ${y} L ${b} ${(y as number) - 10}`} fill="none" className="stroke-on-surface-variant" strokeWidth={1.5} />
          <T x={((a as number) + (b as number)) / 2} y={(y as number) + 16} size={14} weight={600}>
            {t}
          </T>
        </g>
      ))}
    </Svg>
  );
}

// ── Chemistry ───────────────────────────────────────────────────────────

function BondingTriangle() {
  const x0 = 110;
  const x1 = 640;
  const y0 = 470;
  const yTop = 60;
  const X = (en: number) => x0 + ((en - 0.79) / (4.0 - 0.79)) * (x1 - x0);
  const Y = (d: number) => y0 - (d / 3.2) * (y0 - yTop);
  const tri = (pts: [number, number][]) => pts.map(([a, b]) => `${X(a)},${Y(b)}`).join(" ");
  return (
    <Svg w={820} h={560} title="Triangular bonding diagram (van Arkel–Ketelaar)">
      <polygon points={tri([[0.79, 0], [4.0, 0], [2.32, 3.15]])} className="fill-tertiary stroke-outline" fillOpacity={0.28} strokeWidth={1.5} />
      <polygon points={tri([[1.51, 0], [4.0, 0], [2.75, 2.34]])} className="fill-primary" fillOpacity={0.3} />
      <polygon points={tri([[0.79, 0], [1.91, 0], [1.29, 1.18]])} className="fill-secondary" fillOpacity={0.55} />
      {[
        [1.02, "75", "25"],
        [1.58, "50", "50"],
        [2.32, "25", "75"],
      ].map(([d, cov, ion]) => (
        <g key={cov as string}>
          <line x1={X(0.79)} y1={Y(d as number)} x2={X(4.0)} y2={Y(d as number)} className="stroke-outline" strokeWidth={1} strokeDasharray="5 4" />
          <T x={x1 + 40} y={Y(d as number)} size={13} weight={700}>
            {cov}
          </T>
          <T x={x1 + 100} y={Y(d as number)} size={13} muted>
            {ion}
          </T>
        </g>
      ))}
      <T x={x1 + 40} y={Y(3.1)} size={13} weight={700}>
        8
      </T>
      <T x={x1 + 100} y={Y(3.1)} size={13} muted>
        92
      </T>
      <T x={x1 + 40} y={Y(0)} size={13} weight={700}>
        100
      </T>
      <T x={x1 + 100} y={Y(0)} size={13} muted>
        0
      </T>
      <T x={x1 + 40} y={34} size={12} weight={700}>
        % covalent
      </T>
      <T x={x1 + 100} y={34} size={12} muted>
        % ionic
      </T>
      <T x={X(2.32)} y={Y(2.3)} size={17} weight={600}>
        Ionic
      </T>
      <T x={X(2.75)} y={Y(1.3)} size={17} weight={600}>
        Polar covalent
      </T>
      <T x={X(3.0)} y={Y(0.35)} size={17} weight={600}>
        Covalent
      </T>
      <T x={X(1.3)} y={Y(0.3)} size={17} weight={600}>
        Metallic
      </T>
      <line x1={x0} y1={y0} x2={x1} y2={y0} className="stroke-on-surface" strokeWidth={1.5} />
      <line x1={x0} y1={y0} x2={x0} y2={yTop} className="stroke-on-surface" strokeWidth={1.5} />
      {[0, 0.5, 1, 1.5, 2, 2.5, 3].map((d) => (
        <T key={d} x={x0 - 12} y={Y(d)} anchor="end" size={12} muted>
          {d.toFixed(1)}
        </T>
      ))}
      {[0.79, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0].map((e) => (
        <g key={e}>
          <line x1={X(e)} y1={y0} x2={X(e)} y2={y0 + 6} className="stroke-on-surface" strokeWidth={1.2} />
          <T x={X(e)} y={y0 + 20} size={12} muted>
            {e === 0.79 ? "0.79" : e.toFixed(1)}
          </T>
        </g>
      ))}
      <T x={(x0 + x1) / 2} y={y0 + 50} size={14}>
        average electronegativity: Σχ = (χa + χb) / 2
      </T>
      <text x={40} y={(y0 + yTop) / 2} textAnchor="middle" fontSize={14} className="fill-on-surface" transform={`rotate(-90 40 ${(y0 + yTop) / 2})`}>
        electronegativity difference: Δχ = |χa − χb|
      </text>
    </Svg>
  );
}

function ColourWheel() {
  const cx = 300;
  const cy = 240;
  const R = 170;
  // Sectors clockwise from 180° (left), matching the booklet: red, orange, yellow, green, blue, violet.
  const sectors: [string, string, number][] = [
    ["Red", "#d8352f", 180],
    ["Orange", "#ee8a21", 120],
    ["Yellow", "#e3cf2a", 60],
    ["Green", "#2fa84f", 0],
    ["Blue", "#2f6fe0", -60],
    ["Violet", "#8b3fd9", -120],
  ];
  const pt = (deg: number, r = R) => [cx + r * Math.cos((deg * Math.PI) / 180), cy - r * Math.sin((deg * Math.PI) / 180)];
  const bounds: [number, string][] = [
    [120, "647 nm"],
    [60, "585 nm"],
    [0, "575 nm"],
    [-60, "491 nm"],
    [-120, "424 nm"],
  ];
  return (
    <Svg w={600} h={480} title="Colour wheel with wavelengths of the visible spectrum">
      {sectors.map(([name, colour, a]) => {
        const [x1, y1] = pt(a);
        const [x2, y2] = pt(a - 60);
        const [lx, ly] = pt(a - 30, R * 0.6);
        return (
          <g key={name}>
            <path d={`M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2} Z`} fill={colour} fillOpacity={0.85} className="stroke-surface" strokeWidth={3} />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize={16} fontWeight={700} fill="#fff" style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.35)", strokeWidth: 3 }}>
              {name}
            </text>
          </g>
        );
      })}
      {bounds.map(([a, t]) => {
        const [x, y] = pt(a, R + 34);
        return (
          <T key={t} x={x} y={y} size={13}>
            {t}
          </T>
        );
      })}
      <T x={cx - R - 50} y={cy - 12} size={13}>
        700 nm
      </T>
      <T x={cx - R - 50} y={cy + 12} size={13}>
        400 nm
      </T>
      <T x={cx} y={460} size={13} muted>
        Opposite colours are complementary: a substance absorbing one looks the other
      </T>
    </Svg>
  );
}

/** Every drawing by id. */
export const DIAGRAMS: Record<string, () => ReactNode> = {
  water: Water,
  nucleotide: Nucleotide,
  "light-microscope": LightMicroscope,
  "stereo-microscope": StereoMicroscope,
  polysaccharides: Polysaccharides,
  "fatty-acids": FattyAcids,
  "amino-acid": AminoAcid,
  "em-spectrum": EmSpectrum,
  neuron: Neuron,
  peristalsis: Peristalsis,
  "normal-sd": NormalSd,
  "box-plot": BoxPlot,
  pedigree: Pedigree,
  "lytic-lysogenic": LyticLysogenic,
  haemoglobin: Haemoglobin,
  sarcomere: Sarcomere,
  "bonding-triangle": BondingTriangle,
  "colour-wheel": ColourWheel,
};
