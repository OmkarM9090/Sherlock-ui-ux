import { useEffect, useRef } from "react";
import gsap from "gsap";
import { X, AlertTriangle, FileCheck2 } from "lucide-react";
import { CONTRADICTIONS, DEDUCTION, evidenceById } from "../data/caseData";
import { useCountUp, useReducedMotion } from "../hooks";
import { GoldButton, GhostButton, Tag } from "../ui";

export default function Deduction({
  resolved,
  onClose,
  onResolve,
  onOpenEvidence,
}: {
  resolved: boolean;
  onClose: () => void;
  onResolve: () => void;
  onOpenEvidence: (id: string) => void;
}) {
  const root = useRef<HTMLDivElement | null>(null);
  const closingRef = useRef(false);
  const reduced = useReducedMotion();
  const conf = useCountUp(DEDUCTION.confidence, true, 2000);
  const C = 2 * Math.PI * 52;

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (reduced) return;
      const q = gsap.utils.selector(root);
      gsap.fromTo(q("[data-d]"), { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: "power3.out", delay: 0.15 });
      gsap.fromTo(q("[data-d='bg']"), { opacity: 0 }, { opacity: 1, duration: 0.45 });
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
    gsap.to(root.current, { opacity: 0, duration: 0.3, ease: "power2.out", onComplete: onClose });
  };

  return (
    <div ref={root} className="fixed inset-0 z-[90] overflow-y-auto bg-bg thin-scroll" role="dialog" aria-modal="true" aria-label="The deduction">
      <div data-d="bg" className="fixed inset-0" onClick={requestClose}>
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 42% at 50% 0%, rgba(199,167,106,0.055), transparent 70%)",
          }}
        />
      </div>

      <button
        onClick={requestClose}
        aria-label="Close deduction"
        className="fixed right-6 top-6 z-20 flex h-10 w-10 items-center justify-center rounded-lg border border-line text-mute transition-colors duration-200 hover:border-gold/40 hover:text-ink"
      >
        <X size={17} strokeWidth={1.6} />
      </button>

      <div className="relative z-10 mx-auto max-w-[780px] px-6 pb-24 pt-20 lg:pt-28">
        <p data-d className="text-center font-mono text-[10.5px] tracking-[3.5px] text-mute">
          FINAL SYNTHESIS // FILED 15 OCT 1897
        </p>

        <h2 data-d className="mt-6 text-center font-display text-[clamp(3rem,6.5vw,4.2rem)] font-medium leading-none tracking-[-2px] text-ink">
          The Deduction
        </h2>
        <div data-d className="mx-auto mt-6 h-[2px] w-12 bg-gold" />

        {/* confidence */}
        <div data-d className="mt-10 flex flex-col items-center gap-4">
          <svg width="124" height="124" viewBox="0 0 124 124" aria-hidden>
            <circle cx="62" cy="62" r="52" stroke="#1d2025" strokeWidth="4" fill="none" />
            <circle
              cx="62"
              cy="62"
              r="52"
              stroke={resolved ? "#71967A" : "#C7A76A"}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - conf / 100)}
              transform="rotate(-90 62 62)"
            />
            <text x="62" y="58" textAnchor="middle" fontSize={26} fontWeight={700} fontFamily="Inter, sans-serif" fill="#F2EEE5">
              {conf}%
            </text>
            <text x="62" y="78" textAnchor="middle" fontSize={8.5} letterSpacing={2.5} fontFamily="IBM Plex Mono, monospace" fill="#999A98">
              {resolved ? "RESOLVED" : "CONFIDENCE"}
            </text>
          </svg>
        </div>

        {/* statement */}
        <blockquote data-d className="relative mt-12 text-center">
          <span aria-hidden className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 font-display text-[72px] italic leading-none text-gold/25">
            “
          </span>
          <p className="font-display text-[clamp(1.35rem,2.6vw,1.75rem)] font-normal italic leading-[1.65] text-ink">
            {DEDUCTION.statement}
          </p>
        </blockquote>

        {/* supporting evidence */}
        <div data-d className="mt-14">
          <p className="flex items-center gap-3 font-mono text-[10.5px] tracking-[3px] text-gold">
            <span className="h-px w-7 bg-gold/60" />
            SUPPORTED BY
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {DEDUCTION.supporting.map((id) => {
              const e = evidenceById(id)!;
              return (
                <button
                  key={id}
                  onClick={() => onOpenEvidence(id)}
                  className="group rounded-lg border border-line border-l-[3px] border-l-gold bg-surface p-4 text-left transition-all duration-200 hover:border-l-gold2 hover:bg-white/[0.03]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] tracking-[1.5px] text-gold">{id}</span>
                    <span className="font-mono text-[10px] tracking-[1px] text-mute">
                      {e.confidence}%
                    </span>
                  </div>
                  <p className="mt-1.5 font-sans text-[14px] font-medium text-ink transition-colors group-hover:text-gold2">
                    {e.title}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* contradictions */}
        <div data-d className="mt-10">
          <p className="flex items-center gap-3 font-mono text-[10.5px] tracking-[3px] text-crimson">
            <span className="h-px w-7 bg-crimson/60" />
            DISCREPANCIES NOTED
          </p>
          <div className="mt-4 space-y-3">
            {CONTRADICTIONS.map((c) => (
              <div
                key={c.id}
                className="rounded-lg border border-line border-l-[3px] border-l-crimson bg-surface p-4"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle size={13} strokeWidth={1.75} className="text-crimson" />
                  <span className="font-mono text-[10px] tracking-[1.5px] text-crimson">
                    {c.id} • {c.significance.toUpperCase()} SIGNIFICANCE
                  </span>
                </div>
                <p className="mt-2 font-sans text-[13px] leading-[1.65] text-mute">{c.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* verdict actions */}
        <div data-d className="mt-14 flex flex-wrap items-center justify-center gap-4">
          {resolved ? (
            <div className="flex flex-col items-center gap-5">
              <Tag tone="green" className="px-4 py-2 text-[11px]">
                <FileCheck2 size={13} strokeWidth={1.75} />
                CASE RESOLVED — DEDUCTION CONFIRMED
              </Tag>
              <GhostButton onClick={requestClose}>Return to Board</GhostButton>
            </div>
          ) : (
            <>
              <GoldButton
                onClick={() => {
                  onResolve();
                  requestClose();
                }}
              >
                Close Case
              </GoldButton>
              <GhostButton onClick={requestClose}>Continue Investigation</GhostButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
