import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { Maximize2 } from "lucide-react";
import {
  EDGES,
  NODES,
  neighbours,
  nodeById,
  type GraphEdge,
  type NodeKind,
} from "../data/caseData";
import { useReducedMotion } from "../hooks";

const RADII: Record<NodeKind, number> = {
  case: 26,
  evidence: 14,
  suspect: 16,
  location: 13,
  event: 12,
};

const STROKES: Record<NodeKind, string> = {
  case: "#C7A76A",
  evidence: "#C7A76A",
  suspect: "#B94E47",
  location: "#4A4E55",
  event: "#999A98",
};

function edgePath(e: GraphEdge, i: number): string {
  const A = nodeById(e.a)!;
  const B = nodeById(e.b)!;
  const mx = (A.x + B.x) / 2;
  const my = (A.y + B.y) / 2;
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const len = Math.hypot(dx, dy) || 1;
  const bend = e.bend ?? (i % 2 === 0 ? 22 : -22);
  return `M ${A.x} ${A.y} Q ${mx + (-dy / len) * bend} ${my + (dx / len) * bend} ${B.x} ${B.y}`;
}

export default function Graph({
  selectedId,
  onSelect,
  onExpand,
  compact = true,
  animate = false,
  title = "INVESTIGATION MAP",
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onExpand?: () => void;
  compact?: boolean;
  animate?: boolean;
  title?: string;
}) {
  const root = useRef<HTMLDivElement | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const reduced = useReducedMotion();

  const activeId = hoverId ?? selectedId;
  const nb = useMemo(() => (activeId ? neighbours(activeId) : null), [activeId]);
  const isLit = (id: string) => !!activeId && (id === activeId || !!nb?.has(id));

  /* gesture layer can select nodes through a DOM event */
  useEffect(() => {
    const fn = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (id) onSelect(id);
    };
    window.addEventListener("sherlock:node", fn);
    return () => window.removeEventListener("sherlock:node", fn);
  }, [onSelect]);

  /* entrance — nodes pop, threads draw */
  useEffect(() => {
    if (!animate) return;
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root);
      if (reduced) return;
      q("path.g-edge").forEach((el) => {
        const p = el as unknown as SVGPathElement;
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });
      const tl = gsap.timeline({ delay: 0.35 });
      tl.fromTo(
        q(".gnode"),
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.45, stagger: 0.05, ease: "power3.out" }
      ).to(
        q("path.g-edge"),
        { strokeDashoffset: 0, duration: 0.55, stagger: 0.045, ease: "power2.out" },
        "-=0.55"
      )
      .set(q("path.g-edge"), { clearProps: "strokeDasharray,strokeDashoffset" });
    }, root);
    return () => ctx.revert();
  }, [animate, reduced]);

  const hoverNode = hoverId ? nodeById(hoverId) : null;

  return (
    <div
      ref={root}
      className="relative overflow-hidden rounded-2xl border border-line bg-surface"
    >
      {/* header */}
      <div className="flex items-center justify-between px-6 pt-5">
        <div className="flex items-center gap-3">
          <h3 className="font-sans text-[15px] font-semibold tracking-[0.5px] text-ink">
            {title}
          </h3>
          <span className="pulse-dot mt-px h-[5px] w-[5px] rounded-full bg-gold" />
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-[10px] tracking-[1.5px] text-mute sm:block">
            FILTER: ALL
          </span>
          {compact && onExpand && (
            <button
              onClick={onExpand}
              className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 font-sans text-[10px] font-medium tracking-[2px] text-mute transition-colors duration-300 hover:border-gold/40 hover:text-ink"
            >
              <Maximize2 size={12} strokeWidth={1.75} />
              EXPAND
            </button>
          )}
        </div>
      </div>

      {/* the constellation */}
      <div className="relative px-2 pb-2 pt-1">
        <svg viewBox="0 0 1000 580" className="h-auto w-full select-none" fill="none">
          {EDGES.map((e, i) => {
            const touch = !!activeId && (e.a === activeId || e.b === activeId);
            return (
              <path
                key={i}
                d={edgePath(e, i)}
                className={`g-edge ${touch ? "edge-live" : ""}`}
                style={{ transition: "opacity .3s ease, stroke .3s ease" }}
                stroke={touch ? (e.contradiction ? "#B94E47" : "#C7A76A") : e.contradiction ? "#46302F" : "#2B2E34"}
                strokeWidth={touch ? 1.6 : 1}
                opacity={activeId ? (touch ? 1 : 0.14) : e.contradiction ? 0.9 : 1}
                strokeLinecap="round"
              />
            );
          })}

          {NODES.map((n) => {
            const r = RADII[n.kind];
            const lit = isLit(n.id);
            const dim = !!activeId && !lit;
            const hovered = hoverId === n.id;
            const selected = selectedId === n.id;
            const stroke =
              n.kind === "event" && !lit && !selected
                ? "#6f706e"
                : hovered || selected || lit
                  ? n.kind === "suspect"
                    ? "#D36B63"
                    : "#E4C887"
                  : STROKES[n.kind];
            return (
              <g
                key={n.id}
                data-node={n.id}
                className="gnode cursor-pointer"
                style={{
                  transition: "opacity .3s ease",
                  opacity: dim ? 0.2 : 1,
                }}
                onMouseEnter={() => setHoverId(n.id)}
                onMouseLeave={() => setHoverId(null)}
                onClick={() => onSelect(n.id)}
                role="button"
                aria-label={`${n.name} — ${n.sub}`}
              >
                {n.kind === "case" && (
                  <>
                    <circle cx={n.x} cy={n.y} r={r + 9} stroke="#C7A76A" strokeOpacity={0.5} strokeWidth={1} className="case-ring" />
                    <circle cx={n.x} cy={n.y} r={r + 3.5} stroke="#C7A76A" strokeOpacity={0.35} strokeWidth={1} />
                  </>
                )}
                {(hovered || selected) && (
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={r + (selected ? 8 : 5)}
                    stroke={selected ? "#E4C887" : "#C7A76A"}
                    strokeOpacity={selected ? 0.9 : 0.45}
                    strokeWidth={1}
                    strokeDasharray={selected ? undefined : "3 4"}
                  />
                )}
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={r * (hovered ? 1.15 : 1)}
                  fill="#171A1F"
                  stroke={stroke}
                  strokeWidth={n.kind === "case" ? 1.6 : 1.4}
                  strokeDasharray={n.kind === "event" ? "4 4" : undefined}
                  style={{ transition: "stroke .25s ease" }}
                />
                <text
                  x={n.x}
                  y={n.y + 3}
                  textAnchor="middle"
                  fontSize={n.kind === "case" ? 9 : 8}
                  fontFamily="IBM Plex Mono, monospace"
                  fill={stroke}
                  opacity={0.85}
                  letterSpacing={0.5}
                  pointerEvents="none"
                >
                  {n.kind === "case" ? "SH" : n.id.split("-")[1] ?? "?"}
                </text>
                <text
                  x={n.x}
                  y={n.labelAbove ? n.y - r - 14 : n.y + r + 16}
                  textAnchor="middle"
                  fontSize={9}
                  fontFamily="Inter, sans-serif"
                  fontWeight={500}
                  letterSpacing={1.1}
                  fill={lit || selected ? "#F2EEE5" : "#8b8c8a"}
                  style={{ transition: "fill .25s ease" }}
                  pointerEvents="none"
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* hover dossier tooltip */}
        {hoverNode && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[130%] rounded-lg border border-line bg-elev/95 px-3.5 py-2.5 shadow-[var(--shadow-elev)] backdrop-blur-sm"
            style={{
              left: `clamp(92px, ${(hoverNode.x / 1000) * 100}%, calc(100% - 92px))`,
              top: `${(hoverNode.y / 580) * 100}%`,
            }}
          >
            <p className="whitespace-nowrap font-sans text-[12.5px] font-semibold text-ink">
              {hoverNode.name}
            </p>
            <p
              className={`mt-0.5 whitespace-nowrap font-mono text-[9.5px] tracking-[1.5px] ${
                hoverNode.kind === "suspect" ? "text-crimson" : "text-gold"
              }`}
            >
              {hoverNode.sub}
            </p>
          </div>
        )}
      </div>

      {/* footer: legend + census */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/60 px-6 py-3.5">
        <div className="flex flex-wrap items-center gap-4">
          {[
            { c: "#C7A76A", t: "EVIDENCE" },
            { c: "#B94E47", t: "SUSPECT" },
            { c: "#4A4E55", t: "LOCATION" },
            { c: "#999A98", t: "EVENT", dash: true },
          ].map((l) => (
            <span key={l.t} className="flex items-center gap-2">
              <span
                className="inline-block h-[9px] w-[9px] rounded-full border-[1.5px]"
                style={{
                  borderColor: l.c,
                  borderStyle: l.dash ? "dashed" : "solid",
                }}
              />
              <span className="font-mono text-[9px] tracking-[1.5px] text-mute">{l.t}</span>
            </span>
          ))}
          <span className="flex items-center gap-2">
            <span className="inline-block h-[9px] w-[14px] rounded border-t-[1.5px] border-crimson" />
            <span className="font-mono text-[9px] tracking-[1.5px] text-crimson">
              DISCREPANCY
            </span>
          </span>
        </div>
        <p className="font-mono text-[10px] tracking-[1.5px] text-mute">
          17 NODES • 25 CONNECTIONS • <span className="text-crimson">2 DISCREPANCIES</span>
        </p>
      </div>
    </div>
  );
}
