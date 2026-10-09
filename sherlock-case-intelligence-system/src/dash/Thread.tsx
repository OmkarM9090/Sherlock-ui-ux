import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { X } from "lucide-react";
import { useReducedMotion } from "../hooks";
import { GoldButton, GhostButton } from "../ui";

/* the traced chain — evidence → suspect → location → event */
const CHAIN = [
  { id: "E-024", no: "024", name: "Handwritten Letter", sub: "EVIDENCE E-024 • 94%", kind: "evidence", x: 180, y: 345, above: false },
  { id: "S-01", no: "01", name: "Lord Thomas Blackwood", sub: "PRIMARY SUSPECT • S-01", kind: "suspect", x: 415, y: 185, above: true },
  { id: "L-01", no: "01", name: "Blackwood Estate — Study", sub: "PRIMARY SCENE • L-01", kind: "location", x: 665, y: 325, above: false },
  { id: "T-06", no: "06", name: "23:47 — The Incident", sub: "CRITICAL EVENT • T-06", kind: "event", x: 905, y: 185, above: false },
] as const;

const STROKE: Record<string, string> = {
  evidence: "#C7A76A",
  suspect: "#B94E47",
  location: "#4A4E55",
  event: "#999A98",
};

function chainPath(a: (typeof CHAIN)[number], b: (typeof CHAIN)[number]) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 - 34;
  return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
}

const PATTERN = "PATTERN DETECTED";

export default function Thread({
  onClose,
  onDeduce,
}: {
  onClose: () => void;
  onDeduce: () => void;
}) {
  const root = useRef<HTMLDivElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const reduced = useReducedMotion();
  const D = reduced ? 0.18 : 1;

  useEffect(() => {
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root);

      /* prep */
      q("path.chain-edge").forEach((el) => {
        const p = el as unknown as SVGPathElement;
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 });
      });
      gsap.set(q(".chain-node"), { scale: 0, opacity: 0 });
      gsap.set(q(".chain-meta"), { opacity: 0, y: 10 });
      gsap.set(q(".pt-char"), { opacity: 0 });
      gsap.set(q("[data-t='sub']"), { opacity: 0, y: 12 });
      gsap.set(q("[data-t='cta']"), { opacity: 0, y: 16 });
      gsap.set(q("[data-t='glow']"), { opacity: 0 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tlRef.current = tl;

      /* 1 — dim & zoom */
      tl.fromTo(q("[data-t='bg']"), { opacity: 0 }, { opacity: 1, duration: 0.5 * D }, 0).fromTo(
        q("[data-t='stage']"),
        { scale: 0.96, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.7 * D, ease: "expo.out" },
        0
      );

      let t = 0.75 * D;
      CHAIN.forEach((_, i) => {
        if (i > 0) {
          /* draw the thread to this node */
          tl.to(
            q(`path.chain-edge[data-e='${i - 1}']`),
            { strokeDashoffset: 0, duration: 0.7 * D, ease: "power2.inOut" },
            t
          );
          t += 0.45 * D;
        }
        /* illuminate the node */
        tl.to(
          q(`.chain-node[data-n='${i}']`),
          { scale: 1, opacity: 1, duration: 0.5 * D, ease: "power3.out" },
          t
        ).to(q(`.chain-meta[data-n='${i}']`), { opacity: 1, y: 0, duration: 0.35 * D }, t + 0.15 * D);
        t += 0.72 * D; /* dramatic pause */
      });

      /* pulse the entire chain */
      tl.to(
        q("path.chain-edge"),
        { opacity: 0.25, duration: 0.28 * D, yoyo: true, repeat: 1, stagger: 0.08 * D, ease: "power2.inOut" },
        t
      );
      t += 0.85 * D;

      /* the revelation */
      tl.to(q("[data-t='glow']"), { opacity: 1, duration: 0.8 * D }, t)
        .to(
          q(".pt-char"),
          { opacity: 1, duration: 0.05, stagger: 0.05 * D, ease: "none" },
          t + 0.15 * D
        )
        .to(q("[data-t='sub']"), { opacity: 1, y: 0, duration: 0.45 * D }, t + 0.7 * D + (reduced ? 0 : PATTERN.length * 0.05))
        .to(q("[data-t='cta']"), { opacity: 1, y: 0, duration: 0.45 * D }, "+=0.25");
    }, root);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      ctx.revert();
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const requestClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    tlRef.current?.kill();
    gsap.to(root.current, { opacity: 0, duration: 0.32, ease: "power2.out", onComplete: onClose });
  };

  return (
    <div ref={root} className="fixed inset-0 z-[80]" role="dialog" aria-label="Follow the thread">
      <div
        data-t="bg"
        className="absolute inset-0 bg-bg/90 backdrop-blur-[10px]"
        onClick={requestClose}
      />

      {/* header */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-5 lg:px-10">
        <span className="font-mono text-[10.5px] tracking-[3px] text-mute">
          FOLLOWING THE THREAD <span className="text-gold">// CASE SH-2048</span>
        </span>
        <button
          onClick={requestClose}
          aria-label="Close thread view"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-mute transition-colors duration-200 hover:border-gold/40 hover:text-ink"
        >
          <X size={16} strokeWidth={1.6} />
        </button>
      </div>

      {/* stage */}
      <div
        data-t="stage"
        className="relative flex h-full flex-col items-center justify-center px-4"
        style={{ pointerEvents: "none" }}
      >
        <svg viewBox="0 0 1080 520" className="w-full max-w-[1100px]" fill="none">
          {CHAIN.slice(0, -1).map((n, i) => (
            <path
              key={i}
              data-e={i}
              d={chainPath(n, CHAIN[i + 1])}
              className="chain-edge"
              stroke="#C7A76A"
              strokeWidth={1.8}
              strokeLinecap="round"
            />
          ))}

          {CHAIN.map((n, i) => (
            <g key={n.id} className="chain-node gnode" data-n={i}>
              <circle
                cx={n.x}
                cy={n.y}
                r={n.kind === "suspect" ? 21 : n.kind === "evidence" ? 18 : 16}
                fill="#171A1F"
                stroke={i === 0 ? "#E4C887" : STROKE[n.kind]}
                strokeWidth={1.8}
                strokeDasharray={n.kind === "event" ? "5 5" : undefined}
              />
              <circle
                cx={n.x}
                cy={n.y}
                r={n.kind === "suspect" ? 27 : 24}
                stroke={STROKE[n.kind]}
                strokeOpacity={i === 0 ? 0.5 : 0.28}
                strokeDasharray="3 5"
              />
              <text
                x={n.x}
                y={n.y + 3.5}
                textAnchor="middle"
                fontSize={10}
                fontFamily="IBM Plex Mono, monospace"
                fill={STROKE[n.kind]}
              >
                {n.no}
              </text>
            </g>
          ))}

          {CHAIN.map((n, i) => (
            <g key={`m-${n.id}`} className="chain-meta" data-n={i}>
              <text
                x={n.x}
                y={n.above ? n.y - 44 : n.y + 52}
                textAnchor="middle"
                fontSize={14.5}
                fontFamily="Inter, sans-serif"
                fontWeight={600}
                fill="#F2EEE5"
              >
                {n.name}
              </text>
              <text
                x={n.x}
                y={n.above ? n.y - 27 : n.y + 69}
                textAnchor="middle"
                fontSize={9.5}
                fontFamily="IBM Plex Mono, monospace"
                letterSpacing={1.6}
                fill={n.kind === "suspect" ? "#B94E47" : "#C7A76A"}
              >
                {n.sub}
              </text>
            </g>
          ))}
        </svg>

        {/* revelation */}
        <div className="relative mt-2 flex flex-col items-center">
          <div
            data-t="glow"
            aria-hidden
            className="pointer-events-none absolute -inset-x-32 -inset-y-14"
            style={{
              background:
                "radial-gradient(ellipse 50% 60% at 50% 50%, rgba(199,167,106,0.09), transparent 70%)",
            }}
          />
          <p className="relative font-mono text-[15px] tracking-[5px] text-gold" aria-label={PATTERN}>
            {PATTERN.split("").map((c, i) => (
              <span key={i} className="pt-char inline-block">
                {c === " " ? "\u00A0" : c}
              </span>
            ))}
            <span className="caret text-gold2">▍</span>
          </p>
          <p data-t="sub" className="relative mt-4 max-w-[520px] text-center font-sans text-[14px] leading-relaxed text-mute">
            3 evidence items converge on the same 17-minute window
          </p>
          <div data-t="cta" className="pointer-events-auto relative mt-8 flex flex-wrap items-center justify-center gap-4" style={{ pointerEvents: "auto" }}>
            <GoldButton onClick={onDeduce}>View Deduction</GoldButton>
            <GhostButton onClick={requestClose}>Return to Board</GhostButton>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 font-mono text-[9.5px] tracking-[3px] text-mute/60">
        THREAD E-024 → S-01 → L-01 → T-06
      </div>
      {closing && <span className="sr-only">Closing</span>}
    </div>
  );
}
