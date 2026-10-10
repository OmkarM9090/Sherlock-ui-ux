import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "../hooks";
import { EVIDENCE, SUSPECTS } from "../data/caseData";

gsap.registerPlugin(ScrollTrigger);

/* design space of the desk — scaled as one unit to fit the viewport */
const W = 1160;
const H = 620;

const EV_W = 230;
const EV_H = 272;
const SU_W = 236;
const SU_H = 86;

const evIds = ["E-024", "E-017", "E-019", "E-033"] as const;
const evPos = [
  { x: 70, y: 138, r: -3 },
  { x: 330, y: 288, r: 2 },
  { x: 590, y: 118, r: -2 },
  { x: 872, y: 258, r: 3 },
];
const suIds = ["S-01", "S-02", "S-03"] as const;
const suPos = [
  { x: 196, y: 452, r: 1 },
  { x: 646, y: 442, r: -1.5 },
  { x: 900, y: 56, r: 2 },
];

const center = (x: number, y: number, w: number, h: number) => ({
  cx: x + w / 2,
  cy: y + h / 2,
});

/* thread endpoints between card centres */
const C = {
  e1: center(evPos[0].x, evPos[0].y, EV_W, EV_H),
  e2: center(evPos[1].x, evPos[1].y, EV_W, EV_H),
  e3: center(evPos[2].x, evPos[2].y, EV_W, EV_H),
  e4: center(evPos[3].x, evPos[3].y, EV_W, EV_H),
  s1: center(suPos[0].x, suPos[0].y, SU_W, SU_H),
  s2: center(suPos[1].x, suPos[1].y, SU_W, SU_H),
  s3: center(suPos[2].x, suPos[2].y, SU_W, SU_H),
};

function thread(
  a: { cx: number; cy: number },
  b: { cx: number; cy: number },
  bend = 26
) {
  const mx = (a.cx + b.cx) / 2;
  const my = (a.cy + b.cy) / 2;
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  return `M ${a.cx} ${a.cy} Q ${mx + nx * bend} ${my + ny * bend} ${b.cx} ${b.cy}`;
}

const THREADS = [
  thread(C.e1, C.s1, 22),
  thread(C.e1, C.e3, -30),
  thread(C.e3, C.s2, 20),
  thread(C.e2, C.e4, -24),
  thread(C.e4, C.s3, 18),
];

/* miniature case-board constellation (phase 4) */
const MINI_NODES: { x: number; y: number; r: number; kind: string }[] = [
  { x: 260, y: 172, r: 17, kind: "case" },
  { x: 112, y: 62, r: 9, kind: "gold" },
  { x: 408, y: 56, r: 10, kind: "red" },
  { x: 92, y: 182, r: 8, kind: "grey" },
  { x: 428, y: 192, r: 9, kind: "gold" },
  { x: 160, y: 288, r: 8, kind: "dash" },
  { x: 360, y: 292, r: 10, kind: "red" },
];

const MINI_EDGES: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [1, 2], [4, 6],
];

function miniEdge(a: number, b: number) {
  const A = MINI_NODES[a];
  const B = MINI_NODES[b];
  const mx = (A.x + B.x) / 2;
  const my = (A.y + B.y) / 2 - 18;
  return `M ${A.x} ${A.y} Q ${mx} ${my} ${B.x} ${B.y}`;
}

export default function ScrollStory({ onEnter }: { onEnter: () => void }) {
  const section = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const [scale, setScale] = useState(1);

  /* fit the desk into the viewport */
  useLayoutEffect(() => {
    const fit = () =>
      setScale(
        Math.min(1, (window.innerWidth - 36) / W, (window.innerHeight - 120) / H)
      );
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(section);

      /* prep thread dashes */
      q("path.thread-line").forEach((el) => {
        const p = el as unknown as SVGPathElement;
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });
      q("path.mini-edge").forEach((el) => {
        const p = el as unknown as SVGPathElement;
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });

      if (reduced) {
        /* static end-state: the resolved case board */
        q(".story-title").forEach((el, i) =>
          gsap.set(el, { autoAlpha: i === 3 ? 1 : 0 })
        );
        gsap.set(q(".trace-title"), { autoAlpha: 0 });
        gsap.set(q(".trace-underline"), { scaleX: 1 });
        gsap.set(q(".story-card"), { autoAlpha: 0 });
        gsap.set(q("path.thread-line"), { autoAlpha: 0 });
        gsap.set(q(".case-board"), { autoAlpha: 1, scale: 1 });
        gsap.set(q(".mini-node"), { autoAlpha: 1, scale: 1 });
        gsap.set(q("path.mini-edge"), { strokeDashoffset: 0, autoAlpha: 1 });
        gsap.set(q(".story-cta"), { autoAlpha: 1, y: 0 });
        return;
      }

      gsap.set(q(".case-board"), { autoAlpha: 0, scale: 0.72 });
      gsap.set(q(".trace-title"), { autoAlpha: 0, y: 34 });
      gsap.set(q(".trace-word"), { autoAlpha: 0, y: 22, clipPath: "inset(100% 0% 0% 0%)" });
      gsap.set(q(".trace-underline"), { scaleX: 0, transformOrigin: "left center" });
      gsap.set(q(".story-cta"), { autoAlpha: 0, y: 22 });

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: "+=4300",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      });

      /* ── SECTION 02 · EVERY CLUE LEAVES A TRACE ── */
      tl.fromTo(
        q(".trace-title"),
        { autoAlpha: 0, y: 34 },
        { autoAlpha: 1, y: 0, duration: 0.7 },
        0
      )
        .fromTo(
          q(".trace-word"),
          { autoAlpha: 0, y: 22, clipPath: "inset(100% 0% 0% 0%)" },
          { autoAlpha: 1, y: 0, clipPath: "inset(0% 0% -10% 0%)", duration: 0.68, stagger: 0.12, ease: "expo.out" },
          0.12
        )
        .to(q(".trace-underline"), { scaleX: 1, duration: 0.72, ease: "power2.inOut" }, 0.76)
        .to(q(".trace-title"), { autoAlpha: 0, y: -24, duration: 0.45 }, 1.53)

        /* ── SECTION 03 · EVIDENCE arrives from separate depths ── */
        .fromTo(
          q("[data-title='1']"),
          { autoAlpha: 0, y: 34 },
          { autoAlpha: 1, y: 0, duration: 0.62 },
          1.68
        )
        .fromTo(
          q(".ev-card"),
          { autoAlpha: 0, x: (i) => [-92, 42, 108, 154][i % 4], y: (i) => [92, 142, 72, 124][i % 4], z: -230, rotationX: 8, rotationY: (i) => (i % 2 ? -9 : 8), scale: 0.86 },
          { autoAlpha: 1, x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, scale: 1, duration: 0.92, stagger: 0.27, ease: "power3.out" },
          2.0
        );

      /* ── SECTION 04 · SUSPECTS are entered into the record ── */
      tl.to(q("[data-title='1']"), { autoAlpha: 0, y: -26, duration: 0.48 }, 4.08)
        .fromTo(
          q("[data-title='2']"),
          { autoAlpha: 0, y: 34 },
          { autoAlpha: 1, y: 0, duration: 0.58 },
          4.25
        )
        .fromTo(
          q(".su-card"),
          { autoAlpha: 0, x: (i) => (i % 2 ? 130 : -120), y: 76, z: -170, rotationY: (i) => (i % 2 ? 10 : -10), scale: 0.91 },
          { autoAlpha: 1, x: 0, y: 0, z: 0, rotationY: 0, scale: 1, duration: 0.78, stagger: 0.25, ease: "power3.out" },
          4.52
        );

      /* ── SECTION 05 · RED THREAD connects the testimony ── */
      tl.to(q("[data-title='2']"), { autoAlpha: 0, y: -26, duration: 0.48 }, 6.05)
        .fromTo(
          q("[data-title='3']"),
          { autoAlpha: 0, y: 34 },
          { autoAlpha: 1, y: 0, duration: 0.58 },
          6.22
        )
        .to(
          q("path.thread-line"),
          { strokeDashoffset: 0, duration: 0.82, stagger: 0.28, ease: "power2.inOut" },
          6.55
        )
        .fromTo(
          q("[data-pattern]"),
          { autoAlpha: 0, y: 10 },
          { autoAlpha: 1, y: 0, duration: 0.5 },
          8.22
        );

      /* ── SECTION 06 · PATTERN DETECTED resolves into the CASE BOARD ── */
      tl.to(
        q(".story-scatter"),
        { autoAlpha: 0, scale: 0.86, y: -22, duration: 0.8, ease: "power2.in" },
        9.18
      )
        .to(q("[data-title='3']"), { autoAlpha: 0, y: -24, duration: 0.48 }, 9.18)
        .to(
          q(".case-board"),
          { autoAlpha: 1, scale: 1, duration: 0.9, ease: "expo.out" },
          9.68
        )
        .fromTo(
          q(".mini-edge"),
          { autoAlpha: 1 },
          { strokeDashoffset: 0, duration: 0.58, stagger: 0.12 },
          9.78
        )
        .fromTo(
          q(".mini-node"),
          { autoAlpha: 0, scale: 0 },
          { autoAlpha: 1, scale: 1, duration: 0.5, stagger: 0.08, ease: "power3.out" },
          9.88
        )
        .fromTo(
          q("[data-title='4']"),
          { autoAlpha: 0, y: 26 },
          { autoAlpha: 1, y: 0, duration: 0.6 },
          10.68
        )
        .to(q(".story-cta"), { autoAlpha: 1, y: 0, duration: 0.6 }, 11.18)
        .to({}, { duration: 0.6 }, 11.84); // a held final tableau before entering the case
    }, section);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={section}
      id="cases"
      className="relative flex h-[100svh] items-center justify-center overflow-hidden bg-bg"
    >
      {/* backdrop texture */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(199,167,106,0.025), transparent 70%)",
        }}
      />
      <div className="absolute left-6 top-24 z-[2] hidden font-mono text-[10px] tracking-[3px] text-mute/70 lg:left-10 lg:block">
        REEL 02 // RECONSTRUCTION OF EVENTS
      </div>

      {/* the desk */}
      <div
        className="relative"
        style={{ width: W, height: H, transform: `scale(${scale})` }}
      >
        {/* section 02 — editorial reveal before the physical exhibits */}
        <div className="trace-title pointer-events-none absolute inset-x-0 top-0 text-center opacity-0">
          <span className="font-mono text-[10px] tracking-[4px] text-gold">SECTION 02 // THE METHOD</span>
          <h3 className="mt-2 font-display text-[clamp(2.2rem,4vw,3rem)] font-medium leading-[1.02] tracking-[-1.3px] text-ink">
            <span className="trace-word inline-block">EVERY</span>{" "}
            <span className="trace-word inline-block">CLUE</span>{" "}
            <span className="trace-word inline-block">LEAVES</span>{" "}
            <span className="trace-word inline-block">A</span>{" "}
            <span className="relative inline-block text-gold2">
              <span className="trace-word inline-block">TRACE.</span>
              <span className="trace-underline absolute -bottom-1 left-0 h-px w-full bg-gold/80" />
            </span>
          </h3>
        </div>

        {/* phase titles */}
        {[
          { n: 1, t: "THE EVIDENCE" },
          { n: 2, t: "THE SUSPECTS" },
          { n: 3, t: "THE CONNECTIONS" },
        ].map(({ n, t }) => (
          <div
            key={n}
            data-title={n}
            className="story-title pointer-events-none absolute inset-x-0 top-0 text-center opacity-0"
          >
            <span className="font-mono text-[10px] tracking-[4px] text-gold">
              PHASE 0{n}
            </span>
            <h3 className="mt-2 font-display text-[46px] font-medium tracking-[-1px] text-ink">
              {t}
            </h3>
          </div>
        ))}

        {/* scattered layer */}
        <div className="story-scatter absolute inset-0" style={{ perspective: "1500px", transformStyle: "preserve-3d" }}>
          {/* thread svg */}
          <svg
            className="absolute inset-0"
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            fill="none"
            aria-hidden
          >
            {THREADS.map((d, i) => (
              <path
                key={i}
                d={d}
                className="thread-line"
                stroke="#C7A76A"
                strokeWidth={1.4}
                strokeLinecap="round"
                opacity={0.85}
              />
            ))}
          </svg>

          {/* evidence cards */}
          {evIds.map((id, i) => {
            const ev = EVIDENCE.find((e) => e.id === id)!;
            return (
              <article
                key={id}
                className="ev-card story-card absolute overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-card)] transition-colors duration-300 hover:border-gold/30"
                style={{
                  left: evPos[i].x,
                  top: evPos[i].y,
                  width: EV_W,
                  height: EV_H,
                  transform: `rotate(${evPos[i].r}deg)`,
                }}
              >
                <div className="relative h-[150px] overflow-hidden bg-elev">
                  {ev.img && (
                    <img
                      src={ev.img}
                      alt={ev.title}
                      draggable={false}
                      className="h-full w-full object-cover opacity-90"
                    />
                  )}
                  <span className="absolute left-2.5 top-2.5 rounded bg-bg/70 px-1.5 py-0.5 font-mono text-[9px] tracking-[1.5px] text-ink/90 backdrop-blur-sm">
                    {ev.exhibit}
                  </span>
                </div>
                <div className="p-4">
                  <h4 className="font-sans text-[15px] font-semibold text-ink">
                    {ev.title}
                  </h4>
                  <p className="mt-1 font-mono text-[10px] tracking-[1px] text-mute">
                    {ev.id} • {ev.type}
                  </p>
                  <p className="mt-2 font-mono text-[10px] tracking-[1px] text-gold">
                    {ev.confidence}% CONFIDENCE
                  </p>
                </div>
              </article>
            );
          })}

          {/* suspect chips */}
          {suIds.map((id, i) => {
            const s = SUSPECTS.find((x) => x.id === id)!;
            const roleColor =
              s.role === "PRIMARY SUSPECT"
                ? "text-crimson border-crimson/40"
                : s.role === "UNIDENTIFIED"
                  ? "text-mute border-line"
                  : "text-gold border-gold/30";
            return (
              <article
                key={id}
                className="su-card story-card absolute flex items-center gap-3.5 rounded-xl border border-line bg-surface p-3.5 shadow-[var(--shadow-card)]"
                style={{
                  left: suPos[i].x,
                  top: suPos[i].y,
                  width: SU_W,
                  transform: `rotate(${suPos[i].r}deg)`,
                }}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-line bg-elev font-display text-[15px] font-semibold text-gold">
                  {s.initials}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-sans text-[13.5px] font-semibold text-ink">
                    {s.name}
                  </span>
                  <span
                    className={`mt-1 inline-block rounded border px-1.5 py-px font-mono text-[8.5px] tracking-[1px] ${roleColor}`}
                  >
                    {s.role}
                  </span>
                </span>
              </article>
            );
          })}

          {/* pattern emerging */}
          <div
            data-pattern
            className="story-card absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0"
          >
            <span className="pulse-dot mr-2 inline-block h-[6px] w-[6px] rounded-full bg-gold" />
            <span className="font-mono text-[12px] tracking-[3px] text-gold">
              PATTERN DETECTED
            </span>
          </div>
        </div>

        {/* case board constellation */}
        <svg
          className="case-board absolute opacity-0"
          style={{ left: (W - 520) / 2, top: 34, transformOrigin: "center" }}
          width={520}
          height={330}
          viewBox="0 0 520 330"
          fill="none"
          aria-hidden
        >
          {MINI_EDGES.map(([a, b], i) => (
            <path
              key={i}
              d={miniEdge(a, b)}
              className="mini-edge"
              stroke={i === 6 ? "#B94E47" : "#C7A76A"}
              strokeWidth={1.2}
              opacity={i === 6 ? 0.85 : 0.7}
              strokeDasharray={MINI_NODES[a].kind === "dash" ? "4 5" : undefined}
            />
          ))}
          {MINI_NODES.map((n, i) => (
            <g key={i} className="mini-node gnode opacity-0">
              {n.kind === "case" && (
                <circle cx={n.x} cy={n.y} r={n.r + 7} stroke="#C7A76A" strokeOpacity={0.5} />
              )}
              <circle
                cx={n.x}
                cy={n.y}
                r={n.r}
                fill="#171A1F"
                stroke={
                  n.kind === "red" ? "#B94E47" : n.kind === "grey" ? "#3A3E44" : "#C7A76A"
                }
                strokeWidth={n.kind === "case" ? 1.6 : 1.4}
                strokeDasharray={n.kind === "dash" ? "4 4" : undefined}
              />
            </g>
          ))}
          <text
            x={260}
            y={210}
            textAnchor="middle"
            fill="#999A98"
            fontSize={9.5}
            fontFamily="IBM Plex Mono, monospace"
            letterSpacing={2}
          >
            CASE SH-2048
          </text>
        </svg>

        {/* final heading + CTA */}
        <div
          data-title="4"
          className="story-title pointer-events-none absolute inset-x-0 top-[374px] text-center opacity-0"
        >
          <h3 className="font-display text-[40px] font-medium tracking-[-1px] text-ink">
            The board is set. <span className="italic text-gold2">The truth awaits.</span>
          </h3>
        </div>
        <div className="story-cta absolute inset-x-0 top-[452px] z-10 flex flex-col items-center gap-4 opacity-0">
          <button
            onClick={onEnter}
            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-lg border border-gold px-10 py-4 font-sans text-[13px] font-medium uppercase tracking-[2.5px] text-gold transition-colors duration-300 hover:text-bg"
          >
            <span
              aria-hidden
              className="absolute inset-0 origin-left scale-x-0 bg-gold transition-transform duration-300 ease-out group-hover:scale-x-100"
            />
            <span className="relative z-10">Enter the Investigation</span>
            <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </button>
          <span className="font-mono text-[10px] tracking-[3px] text-mute">
            CASE FILE SH-2048 // READY FOR REVIEW
          </span>
        </div>
      </div>
    </section>
  );
}
