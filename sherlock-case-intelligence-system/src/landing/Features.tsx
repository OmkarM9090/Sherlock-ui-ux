import { useInView, useReducedMotion } from "../hooks";
import { CountUp } from "../ui";

/* ────────────────────────────────────────────────────────────────────
   Feature 1 visual — the evidence constellation
────────────────────────────────────────────────────────────────────── */
function ConstellationVisual({ live }: { live: boolean }) {
  const nodes = [
    { x: 200, y: 150, r: 15, kind: "case", label: "CASE" },
    { x: 88, y: 74, r: 9, kind: "gold" },
    { x: 316, y: 62, r: 10, kind: "red" },
    { x: 70, y: 196, r: 8, kind: "grey" },
    { x: 338, y: 186, r: 9, kind: "gold" },
    { x: 132, y: 252, r: 8, kind: "dash" },
    { x: 268, y: 264, r: 10, kind: "red" },
    { x: 200, y: 48, r: 7, kind: "grey" },
  ];
  const edges: [number, number][] = [
    [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [1, 7], [2, 4], [5, 6], [2, 7],
  ];
  const edgePath = (a: number, b: number) => {
    const A = nodes[a];
    const B = nodes[b];
    const mx = (A.x + B.x) / 2;
    const my = (A.y + B.y) / 2 - 14;
    return `M ${A.x} ${A.y} Q ${mx} ${my} ${B.x} ${B.y}`;
  };
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-line bg-surface/60">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 48%, rgba(199,167,106,0.06), transparent 62%)",
        }}
      />
      <svg viewBox="0 0 400 320" className="h-full w-full" fill="none" aria-hidden>
        {edges.map(([a, b], i) => (
          <path
            key={i}
            d={edgePath(a, b)}
            stroke={i === 10 ? "#B94E47" : i % 4 === 0 ? "#C7A76A" : "#2B2E34"}
            strokeWidth={i % 4 === 0 || i === 10 ? 1.3 : 1}
            opacity={i % 4 === 0 ? 0.85 : 1}
            className={live && i % 4 === 0 ? "edge-live" : ""}
          />
        ))}
        {nodes.map((n, i) => (
          <g key={i}>
            {n.kind === "case" && (
              <circle cx={n.x} cy={n.y} r={n.r + 8} stroke="#C7A76A" strokeOpacity={0.45} className="case-ring" fill="none" />
            )}
            <circle
              cx={n.x}
              cy={n.y}
              r={n.r}
              fill="#171A1F"
              stroke={
                n.kind === "red" ? "#B94E47" : n.kind === "grey" ? "#3A3E44" : "#C7A76A"
              }
              strokeWidth={n.kind === "case" ? 1.5 : 1.3}
              strokeDasharray={n.kind === "dash" ? "4 4" : undefined}
            />
          </g>
        ))}
      </svg>
      <span className="absolute bottom-4 left-5 font-mono text-[10px] tracking-[2px] text-mute">
        8 NODES • 11 THREADS • 1 DISCREPANCY
      </span>
      <span className="absolute right-5 top-4 flex items-center gap-2 font-mono text-[10px] tracking-[2px] text-gold">
        <span className="pulse-dot h-[5px] w-[5px] rounded-full bg-gold" />
        LIVE PATTERN
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   Feature 2 visual — follow the thread (dot travels the thread)
────────────────────────────────────────────────────────────────────── */
function ThreadVisual() {
  const path = "M 36 190 C 110 60, 210 250, 286 96 S 400 210, 452 84";
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-line bg-surface/60">
      <svg viewBox="0 0 480 280" className="h-full w-full" fill="none" aria-hidden>
        <path d={path} stroke="#2B2E34" strokeWidth={1.2} />
        <path d={path} stroke="#C7A76A" strokeWidth={1.4} className="dash-flow" strokeLinecap="round" />
        {[
          { x: 36, y: 190, kind: "gold", id: "E-033" },
          { x: 160, y: 158, kind: "red", id: "S-01" },
          { x: 286, y: 96, kind: "grey", id: "L-01" },
          { x: 452, y: 84, kind: "dash", id: "T-06" },
        ].map((n, i) => (
          <g key={i}>
            <circle
              cx={n.x}
              cy={n.y}
              r={10}
              fill="#171A1F"
              stroke={n.kind === "red" ? "#B94E47" : n.kind === "grey" ? "#3A3E44" : "#C7A76A"}
              strokeWidth={1.4}
              strokeDasharray={n.kind === "dash" ? "4 4" : undefined}
            />
            <text
              x={n.x}
              y={n.y - 20}
              textAnchor="middle"
              fontSize={9.5}
              fill="#999A98"
              fontFamily="IBM Plex Mono, monospace"
              letterSpacing={1.5}
            >
              {n.id}
            </text>
          </g>
        ))}
        <circle r={3.5} fill="#E4C887">
          <animateMotion dur="4.2s" repeatCount="indefinite" path={path} />
        </circle>
      </svg>
      <span className="absolute bottom-4 left-5 font-mono text-[10px] tracking-[2px] text-mute">
        TRACING EVIDENCE BACK TO SOURCE <span className="caret text-gold">▍</span>
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   Feature 3 visual — gesture magnifying lens
────────────────────────────────────────────────────────────────────── */
function LensVisual() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface/60 p-8">
      {/* blurred dossier beneath the lens */}
      <div className="w-[260px] rounded-xl border border-line bg-elev p-4 opacity-70 blur-[1.5px]">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] tracking-[2px] text-gold">E-024</span>
          <span className="font-mono text-[9px] tracking-[2px] text-mute">94%</span>
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-2 w-full rounded bg-line/50" />
          <div className="h-2 w-5/6 rounded bg-line/50" />
          <div className="h-2 w-4/6 rounded bg-line/50" />
          <div className="h-2 w-full rounded bg-line/50" />
          <div className="h-2 w-3/6 rounded bg-line/40" />
        </div>
        <div className="mt-4 h-16 rounded-lg bg-line/30" />
      </div>

      {/* the lens */}
      <div className="floaty pointer-events-none absolute left-[52%] top-[38%]">
        <div
          className="flex h-[110px] w-[110px] items-end justify-center rounded-full border-2 border-gold/60"
          style={{
            boxShadow:
              "0 0 32px rgba(199,167,106,0.18), inset 0 0 0 1px rgba(9,10,12,0.6), inset 0 0 26px rgba(199,167,106,0.1)",
            backdropFilter: "brightness(1.6) saturate(1.1)",
            background: "rgba(199,167,106,0.04)",
          }}
        >
          <span className="mb-2 rounded bg-bg/80 px-1.5 py-0.5 font-mono text-[8px] tracking-[1.5px] text-gold backdrop-blur-sm">
            MAGNIFY
          </span>
        </div>
        <div className="mx-auto h-10 w-[2px] bg-gradient-to-b from-gold/60 to-transparent" />
      </div>

      <span className="absolute bottom-4 left-5 font-mono text-[10px] tracking-[2px] text-mute">
        OPEN PALM // POINT // PINCH
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   Feature row
────────────────────────────────────────────────────────────────────── */
function Feature({
  index,
  kicker,
  title,
  body,
  points,
  note,
  visual,
  flip,
}: {
  index: string;
  kicker: string;
  title: string;
  body: string;
  points?: string[];
  note?: string;
  visual: React.ReactNode;
  flip?: boolean;
}) {
  const [ref, seen] = useInView<HTMLDivElement>(0.25);
  const reduced = useReducedMotion();
  const anim = reduced
    ? "opacity-100 translate-y-0"
    : seen
      ? "opacity-100 translate-y-0"
      : "opacity-0 translate-y-8";

  return (
    <div
      ref={ref}
      className={`grid items-center gap-10 transition-all duration-700 ease-out lg:grid-cols-2 lg:gap-16 ${anim}`}
    >
      <div className={`h-[320px] lg:h-[380px] ${flip ? "lg:order-2" : ""}`}>
        {visual}
      </div>
      <div className={flip ? "lg:order-1" : ""}>
        <span className="font-mono text-[11px] tracking-[3px] text-gold">
          {index} // {kicker}
        </span>
        <h3 className="mt-4 font-display text-[clamp(2rem,3.4vw,3rem)] font-medium leading-[1.1] tracking-[-1px] text-ink">
          {title}
        </h3>
        <p className="mt-5 max-w-[480px] font-sans text-[16px] leading-[1.75] text-mute">
          {body}
        </p>
        {points && (
          <ul className="mt-7 space-y-3">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-3 font-sans text-[14px] text-ink/90">
                <span className="block h-[6px] w-[6px] rotate-45 bg-gold/80" />
                {p}
              </li>
            ))}
          </ul>
        )}
        {note && (
          <p className="mt-7 font-mono text-[11px] leading-relaxed tracking-[1.5px] text-mute">
            {note}
          </p>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   Statistics
────────────────────────────────────────────────────────────────────── */
const STATS: { value: number; label: string; suffix?: string }[] = [
  { value: 2847, label: "EVIDENCE ANALYZED" },
  { value: 94, label: "AVERAGE CONFIDENCE", suffix: "%" },
  { value: 127, label: "CONNECTIONS MAPPED" },
  { value: 12, label: "CASES SOLVED" },
];

export default function Features() {
  const [statsRef, statsSeen] = useInView<HTMLDivElement>(0.4);

  return (
    <>
      {/* ── Features ── */}
      <section id="features" className="relative bg-bg py-28 lg:py-36">
        <div className="mx-auto max-w-[1280px] space-y-32 px-6 lg:px-0 lg:space-y-40">
          <Feature
            index="01"
            kicker="SIGNATURE FEATURE"
            title="Every connection tells a story."
            body="Map relationships between evidence, suspects, locations and events. The investigation reveals patterns invisible to the naked eye."
            points={[
              "Interactive node-based investigation",
              "Real-time pattern detection",
              "Confidence scoring",
              "Contradiction identification",
            ]}
            visual={<ConstellationVisual live />}
          />
          <Feature
            flip
            index="02"
            kicker="CINEMATIC TRACING"
            title="Follow the thread."
            body="Trace connections through the evidence chain. Watch as the investigation draws each thread before your eyes and reveals the hidden relationships that bind a case together."
            note="TRIGGERED FROM THE CASE BOARD // ~4 SECOND SEQUENCE"
            visual={<ThreadVisual />}
          />
          <Feature
            index="03"
            kicker="GESTURE INVESTIGATION"
            title="Navigate the case, hands-free."
            body="Hand tracking transforms your hand into an investigative instrument. Raise an open palm to enter investigation mode, point to examine the evidence, pinch to select."
            note="REQUIRES CAMERA PERMISSION • ENHANCEMENT ONLY — THE MOUSE NEVER LEAVES THE CASE"
            visual={<LensVisual />}
          />
        </div>
      </section>

      {/* ── Statistics ── */}
      <section
        id="intelligence"
        className="relative border-t border-line/60 bg-bg py-24 lg:py-32"
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(199,167,106,0.03), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-[1280px] px-6 lg:px-0">
          <div
            ref={statsRef}
            className="grid grid-cols-2 gap-y-14 lg:grid-cols-4"
          >
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-[clamp(3rem,5.5vw,4rem)] font-medium leading-none tracking-[-1px] text-ink">
                  <CountUp target={s.value} start={statsSeen} />
                  {s.suffix && <span className="text-gold">{s.suffix}</span>}
                </div>
                <p className="mt-4 font-mono text-[11px] tracking-[3px] text-mute">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-24 max-w-[640px] text-center font-display text-[clamp(1.6rem,3vw,2.1rem)] font-normal italic leading-[1.5] text-mute">
            “The truth is hidden in the connections.”
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-line bg-bg">
        <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-0">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="flex flex-col leading-none">
              <span className="font-display text-[22px] font-semibold tracking-[3px] text-gold">
                SHERLOCK
              </span>
              <span className="mt-1.5 font-mono text-[9px] tracking-[3px] text-mute">
                CASE INTELLIGENCE
              </span>
            </div>
            <nav className="flex flex-wrap gap-8" aria-label="Footer">
              {["CASES", "EVIDENCE", "INTELLIGENCE", "ABOUT"].map((l) => (
                <a
                  key={l}
                  href="#top"
                  className="font-sans text-[12px] font-medium tracking-[2.5px] text-mute transition-colors duration-300 hover:text-ink"
                >
                  {l}
                </a>
              ))}
            </nav>
          </div>
          <div className="my-10 h-px bg-line" />
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <p className="font-sans text-[13px] text-mute">
              © 2026 Sherlock Case Intelligence. All rights reserved.
            </p>
            <p className="font-mono text-[11px] tracking-[4px] text-mute/70">
              CLASSIFIED
            </p>
            <div className="flex gap-6">
              {["Privacy", "Terms"].map((l) => (
                <a
                  key={l}
                  href="#top"
                  className="font-sans text-[13px] text-mute transition-colors hover:text-ink"
                >
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
