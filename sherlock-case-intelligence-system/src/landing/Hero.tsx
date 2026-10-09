import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useReducedMotion } from "../hooks";

export default function Hero({ onEnter }: { onEnter: () => void }) {
  const root = useRef<HTMLElement | null>(null);
  const glow = useRef<HTMLDivElement | null>(null);
  const grainRef = useRef<HTMLDivElement | null>(null);
  const target = useRef({ x: 0, y: 0 });
  const cur = useRef({ x: 0, y: 0 });
  const reduced = useReducedMotion();

  /* ── secret interaction: the interface watches the investigator ── */
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    target.current = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };
    cur.current = { ...target.current };
    const loop = () => {
      const c = cur.current;
      const t = target.current;
      c.x += (t.x - c.x) * 0.02;
      c.y += (t.y - c.y) * 0.02;
      if (glow.current) {
        glow.current.style.transform = `translate3d(${c.x - 500}px, ${c.y - 500}px, 0)`;
      }
      if (grainRef.current) {
        const px = (c.x / window.innerWidth - 0.5) * 6;
        const py = (c.y / window.innerHeight - 0.5) * 6;
        grainRef.current.style.transform = `translate3d(${px}px, ${py}px, 0)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onMove = (e: PointerEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, [reduced]);

  /* ── declassification entrance ── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root);
      if (reduced) {
        gsap.set(q("[data-reveal]"), { autoAlpha: 1, y: 0 });
        gsap.set(q("[data-wipe]"), {
          clipPath: "inset(0% 0% -8% 0%)",
          y: 0,
        });
        return;
      }
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(
        q("[data-reveal='kicker']"),
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.5 },
        0.2
      )
        .fromTo(
          q("[data-wipe='l1']"),
          { clipPath: "inset(100% 0% -8% 0%)", y: 26 },
          { clipPath: "inset(0% 0% -8% 0%)", y: 0, duration: 0.75, ease: "expo.out" },
          0.45
        )
        .fromTo(
          q("[data-wipe='l2']"),
          { clipPath: "inset(100% 0% -8% 0%)", y: 26 },
          { clipPath: "inset(0% 0% -8% 0%)", y: 0, duration: 0.75, ease: "expo.out" },
          0.62
        )
        .fromTo(
          q("[data-reveal='sub']"),
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.6 },
          1.35
        )
        .fromTo(
          q("[data-reveal='cta']"),
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.5 },
          1.6
        )
        .fromTo(
          q("[data-reveal='meta']"),
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.5 },
          1.8
        );
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={root}
      id="top"
      className="grain relative flex h-[100svh] min-h-[640px] flex-col items-center justify-center overflow-hidden bg-bg"
    >
      {/* faint static warmth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 62% 46% at 50% 44%, rgba(199,167,106,0.035), transparent 70%)",
        }}
      />
      {/* cursor-tracked glow — the interface is watching */}
      <div
        ref={glow}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-[1000px] w-[1000px] rounded-full opacity-70"
        style={{
          background:
            "radial-gradient(circle, rgba(199,167,106,0.05), transparent 55%)",
          willChange: "transform",
        }}
      />
      {/* parallax grain layer */}
      <div
        ref={grainRef}
        aria-hidden
        className="pointer-events-none absolute -inset-10 z-[2]"
        style={{ willChange: "transform" }}
      />
      {/* faint ruled frame */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-6 inset-y-6 z-[2] border border-line/25 lg:inset-x-10 lg:inset-y-8"
      />

      <div className="relative z-[4] flex max-w-[1100px] flex-col items-center px-6 text-center">
        {/* classified kicker */}
        <div
          data-reveal="kicker"
          className="mb-10 flex items-center gap-3 opacity-0"
        >
          <span className="pulse-dot h-[6px] w-[6px] rounded-full bg-gold" />
          <span className="font-mono text-[10px] tracking-[4px] text-mute lg:text-[11px]">
            CLASSIFIED&nbsp;&nbsp;//&nbsp;&nbsp;INVESTIGATION ACTIVE
          </span>
        </div>

        {/* headline */}
        <h1 className="font-display font-medium leading-[1.0] tracking-[-3px] text-ink">
          <span className="block">
            <span
              data-wipe="l1"
              className="block text-[clamp(3.4rem,9.5vw,6.875rem)]"
              style={{ clipPath: "inset(100% 0% -8% 0%)" }}
            >
              THE GAME
            </span>
          </span>
          <span className="block">
            <span
              data-wipe="l2"
              className="block text-[clamp(3.4rem,9.5vw,6.875rem)]"
              style={{ clipPath: "inset(100% 0% -8% 0%)" }}
            >
              IS AFOOT<span className="text-gold">.</span>
            </span>
          </span>
        </h1>

        {/* subtitle */}
        <p
          data-reveal="sub"
          className="mt-9 max-w-[560px] font-sans text-[16px] leading-[1.75] text-mute opacity-0 lg:text-[18px]"
        >
          An intelligent investigation workspace for discovering evidence,
          connecting clues and uncovering the truth.
        </p>

        {/* CTA */}
        <div data-reveal="cta" className="mt-11 opacity-0">
          <button
            onClick={onEnter}
            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-lg border border-gold px-12 py-4 font-sans text-[13px] font-medium uppercase tracking-[2.5px] text-gold transition-colors duration-300 hover:text-bg"
          >
            <span
              aria-hidden
              className="absolute inset-0 origin-left scale-x-0 bg-gold transition-transform duration-400 ease-out group-hover:scale-x-100"
            />
            <span className="relative z-10">Enter the Case</span>
            <span className="arrow-nudge relative z-10">→</span>
          </button>
        </div>
      </div>

      {/* bottom metadata */}
      <div
        data-reveal="meta"
        className="absolute inset-x-6 bottom-9 z-[4] flex items-center justify-between font-mono text-[10px] tracking-[2.5px] text-mute opacity-0 lg:inset-x-10 lg:text-[11px]"
      >
        <span>CASE FILE // 001</span>
        <a
          href="#cases"
          className="flex items-center gap-2 transition-colors hover:text-ink"
        >
          SCROLL TO INVESTIGATE
          <span className="bob inline-block">↓</span>
        </a>
      </div>
    </section>
  );
}
