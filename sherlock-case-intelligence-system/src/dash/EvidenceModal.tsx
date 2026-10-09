import { useEffect, useRef } from "react";
import gsap from "gsap";
import { X, ArrowRight, FileSearch } from "lucide-react";
import { evidenceById, entityName, kindLabel } from "../data/caseData";
import { useReducedMotion } from "../hooks";
import { GoldButton, Tag } from "../ui";

export default function EvidenceModal({
  id,
  onClose,
  onNavigate,
  onEntity,
  onTrace,
}: {
  id: string;
  onClose: () => void;
  onNavigate: (id: string) => void;
  onEntity: (id: string) => void;
  onTrace: () => void;
}) {
  const root = useRef<HTMLDivElement | null>(null);
  const panel = useRef<HTMLDivElement | null>(null);
  const media = useRef<HTMLDivElement | null>(null);
  const lens = useRef<HTMLDivElement | null>(null);
  const closingRef = useRef(false);
  const reduced = useReducedMotion();

  const ev = evidenceById(id);
  const ZOOM = 1.9;
  const LENS = 128;

  /* entrance + keys + scroll lock, once per open */
  useEffect(() => {
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root);
      if (reduced) {
        gsap.set(q("[data-m]"), { opacity: 1 });
        return;
      }
      gsap.fromTo(q("[data-m='bg']"), { opacity: 0 }, { opacity: 1, duration: 0.3 });
      gsap.fromTo(
        panel.current,
        { opacity: 0, y: 26, scale: 0.985 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "expo.out" }
      );
    }, root);

    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      ctx.revert();
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* swap content without re-animating when navigating between exhibits */
  useEffect(() => {
    panel.current?.scrollTo({ top: 0 });
  }, [id]);

  const requestClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    gsap.to(panel.current, { opacity: 0, y: 16, duration: 0.26, ease: "power2.in" });
    gsap.to(root.current?.querySelector("[data-m='bg']") ?? root.current, {
      opacity: 0,
      duration: 0.3,
      delay: 0.05,
      onComplete: onClose,
    });
  };

  const moveLens = (e: React.MouseEvent) => {
    const m = media.current;
    const l = lens.current;
    if (!m || !l || !ev?.img) return;
    const r = m.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    l.style.opacity = "1";
    l.style.transform = `translate3d(${x - LENS / 2}px, ${y - LENS / 2}px, 0)`;
    l.style.backgroundSize = `${r.width * ZOOM}px ${r.height * ZOOM}px`;
    l.style.backgroundPosition = `-${x * ZOOM - LENS / 2}px -${y * ZOOM - LENS / 2}px`;
  };
  const hideLens = () => {
    if (lens.current) lens.current.style.opacity = "0";
  };

  if (!ev) return null;

  return (
    <div ref={root} className="fixed inset-0 z-[85] flex items-center justify-center p-4 lg:p-8" role="dialog" aria-modal="true" aria-label={ev.title}>
      <div data-m="bg" className="absolute inset-0 bg-bg/85 backdrop-blur-[8px]" onClick={requestClose} />

      <div
        ref={panel}
        className="thin-scroll relative grid max-h-[88vh] w-full max-w-[1060px] overflow-y-auto rounded-2xl border border-line bg-elev shadow-[var(--shadow-elev)] lg:grid-cols-[1.12fr_1fr] lg:overflow-hidden"
      >
        <button
          onClick={requestClose}
          aria-label="Close evidence file"
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-bg/60 text-mute backdrop-blur-sm transition-colors duration-200 hover:border-gold/40 hover:text-ink"
        >
          <X size={16} strokeWidth={1.6} />
        </button>

        {/* ── left: the exhibit ── */}
        <div className="flex flex-col p-6 lg:border-r lg:border-line/60 lg:p-8">
          <div
            ref={media}
            onMouseMove={moveLens}
            onMouseLeave={hideLens}
            className="relative aspect-[3/2] cursor-crosshair overflow-hidden rounded-xl border border-line bg-bg"
          >
            {ev.img ? (
              <img src={ev.img} alt={ev.title} className="h-full w-full object-cover opacity-95" draggable={false} />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3">
                <FileSearch size={30} strokeWidth={1.1} className="text-mute/40" />
                <span className="font-mono text-[10px] tracking-[2.5px] text-mute/60">
                  PHOTOGRAPHIC PLATE PENDING
                </span>
              </div>
            )}
            <span className="absolute left-3.5 top-3.5 rounded bg-bg/75 px-2.5 py-1 font-mono text-[10px] tracking-[2px] text-ink backdrop-blur-sm">
              {ev.exhibit}-{ev.id.slice(2)}
            </span>
            <span className="absolute bottom-3.5 right-3.5 rounded bg-bg/75 px-2.5 py-1 font-mono text-[9px] tracking-[1.5px] text-mute backdrop-blur-sm">
              52.3597° N, 1.1743° W
            </span>

            {/* forensic magnifier */}
            {ev.img && (
              <div
                ref={lens}
                aria-hidden
                className="pointer-events-none absolute left-0 top-0 rounded-full border-2 border-gold/70 opacity-0 transition-opacity duration-200"
                style={{
                  width: LENS,
                  height: LENS,
                  backgroundImage: `url(${ev.img})`,
                  backgroundRepeat: "no-repeat",
                  boxShadow:
                    "0 0 40px rgba(199,167,106,0.22), inset 0 0 0 1px rgba(9,10,12,0.7), inset 0 0 30px rgba(0,0,0,0.35)",
                  willChange: "transform",
                }}
              />
            )}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="flex items-center gap-2 font-mono text-[10px] tracking-[2px] text-mute">
              <span className="inline-block h-[8px] w-[8px] rounded-full border border-gold/70" />
              {ev.img ? "MAGNIFY EVIDENCE — HOVER THE PLATE" : "FORENSIC PHOTOGRAPHY SCHEDULED"}
            </span>
            <Tag tone="gold">{ev.confidence}%</Tag>
          </div>
        </div>

        {/* ── right: the dossier ── */}
        <div className="flex flex-col p-6 lg:overflow-y-auto lg:p-8 thin-scroll">
          <p className="font-mono text-[12px] tracking-[2px] text-gold">EVIDENCE #{ev.id.slice(2)}</p>
          <h3 className="mt-2.5 font-sans text-[27px] font-semibold leading-tight tracking-[-0.5px] text-ink">
            {ev.title}
          </h3>

          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5">
            {[
              ["TYPE", ev.type],
              ["DISCOVERED", ev.discovered],
              ["LOCATION", ev.location.toUpperCase()],
              ["CONFIDENCE", `${ev.confidence}% CERTAIN`],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="font-mono text-[10px] tracking-[2px] text-mute">{k}</p>
                <p className="mt-1.5 font-sans text-[13.5px] font-medium text-ink">{v}</p>
              </div>
            ))}
          </div>

          <div className="my-6 h-px bg-line/70" />

          <p className="font-sans text-[11px] font-semibold tracking-[2.5px] text-mute">ANALYSIS</p>
          <p className="mt-3 font-sans text-[14.5px] leading-[1.75] text-ink/90">{ev.analysis}</p>

          <div className="my-6 h-px bg-line/70" />

          <p className="font-sans text-[11px] font-semibold tracking-[2.5px] text-mute">CONNECTED TO</p>
          <ul className="mt-3 space-y-1">
            {ev.connections.map((c) => {
              const isEvidence = !!evidenceById(c);
              return (
                <li key={c}>
                  <button
                    onClick={() => (isEvidence ? onNavigate(c) : onEntity(c))}
                    className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors duration-200 hover:bg-white/[0.03]"
                  >
                    <ArrowRight size={13} strokeWidth={1.75} className="shrink-0 text-gold transition-transform duration-200 group-hover:translate-x-1" />
                    <span className="font-sans text-[13.5px] text-ink/85 transition-colors group-hover:text-gold2">
                      {entityName(c)}
                    </span>
                    <span className="ml-auto font-mono text-[9px] tracking-[1.5px] text-mute/60">
                      {c} · {kindLabel(c)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-auto pt-7">
            <GoldButton onClick={onTrace} className="w-full sm:w-auto">
              Trace Connections
            </GoldButton>
          </div>
        </div>
      </div>
    </div>
  );
}
