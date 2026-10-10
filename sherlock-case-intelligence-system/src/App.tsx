import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Landing from "./landing/Landing";
import Dashboard from "./dash/Dashboard";
import Gesture from "./gesture/Gesture";
import { ToastProvider } from "./ui";
import { useReducedMotion } from "./hooks";

export default function App() {
  const [scene, setScene] = useState<"landing" | "case">("landing");
  const overlay = useRef<HTMLDivElement | null>(null);
  const busy = useRef(false);
  const reduced = useReducedMotion();

  // A single delegated pointer listener drives the radial card light without
  // introducing per-card React state or frame-by-frame renders.
  useEffect(() => {
    let active: HTMLElement | null = null;
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch" || !(event.target instanceof Element)) return;
      const next = event.target.closest<HTMLElement>(".spotlight-card");
      if (active !== next) {
        active?.style.removeProperty("--spot-x");
        active?.style.removeProperty("--spot-y");
        active = next;
      }
      if (!active) return;
      const rect = active.getBoundingClientRect();
      active.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
      active.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
    };
    const clear = () => {
      active?.style.removeProperty("--spot-x");
      active?.style.removeProperty("--spot-y");
      active = null;
    };
    document.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("blur", clear);
    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", clear);
      clear();
    };
  }, []);

  /* ── ENTER THE CASE: screen dims, gold thread is pulled across ── */
  const enterCase = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    if (reduced) {
      setScene("case");
      window.scrollTo(0, 0);
      busy.current = false;
      return;
    }
    const ov = overlay.current;
    if (!ov) return;
    const bg = ov.querySelector("[data-t-bg]");
    const thread = ov.querySelector("[data-t-line]");
    const label = ov.querySelector("[data-t-label]");

    gsap
      .timeline({
        onComplete: () => {
          busy.current = false;
        },
      })
      .set(ov, { autoAlpha: 1, pointerEvents: "auto" })
      .fromTo(bg, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: "power2.out" }, 0)
      .fromTo(
        thread,
        { scaleX: 0, opacity: 1 },
        { scaleX: 1, duration: 0.95, ease: "expo.inOut" },
        0.1
      )
      .fromTo(label, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35 }, 0.55)
      .add(() => {
        setScene("case");
        window.scrollTo(0, 0);
      }, "+=0.15")
      .to(label, { opacity: 0, duration: 0.25 }, "+=0.1")
      .to(ov, { autoAlpha: 0, duration: 0.55, ease: "power2.out" }, "<0.05")
      .set(ov, { pointerEvents: "none" });
  }, [reduced]);

  /* ── return to the street ── */
  const exitCase = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    if (reduced) {
      setScene("landing");
      window.scrollTo(0, 0);
      busy.current = false;
      return;
    }
    const ov = overlay.current;
    if (!ov) return;
    const bg = ov.querySelector("[data-t-bg]");
    gsap
      .timeline({ onComplete: () => (busy.current = false) })
      .set(ov, { autoAlpha: 1, pointerEvents: "auto" })
      .fromTo(bg, { opacity: 0 }, { opacity: 1, duration: 0.35 })
      .set(ov.querySelector("[data-t-line]"), { opacity: 0 })
      .add(() => {
        setScene("landing");
        window.scrollTo(0, 0);
      }, "+=0.05")
      .to(ov, { autoAlpha: 0, duration: 0.5, ease: "power2.out" }, "+=0.1")
      .set(ov, { pointerEvents: "none" });
  }, [reduced]);

  return (
    <ToastProvider>
      {scene === "landing" ? (
        <Landing onEnter={enterCase} />
      ) : (
        <Dashboard onExit={exitCase} />
      )}

      {/* gesture layer — optional enhancement, never required */}
      <Gesture />

      {/* transition overlay — the pulled thread */}
      <div
        ref={overlay}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[100] opacity-0"
        style={{ visibility: "hidden" }}
      >
        <div data-t-bg className="absolute inset-0 bg-[#060708]">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(199,167,106,0.05), transparent 70%)",
            }}
          />
        </div>
        <div
          data-t-line
          className="absolute left-0 top-1/2 h-[2px] w-full origin-left bg-gradient-to-r from-transparent via-gold to-gold2"
          style={{ boxShadow: "0 0 18px rgba(199,167,106,0.45)" }}
        />
        <p
          data-t-label
          className="absolute left-1/2 top-[56%] -translate-x-1/2 whitespace-nowrap font-mono text-[11px] tracking-[4px] text-gold"
        >
          OPENING CASE FILE // SH-2048
        </p>
      </div>
    </ToastProvider>
  );
}
