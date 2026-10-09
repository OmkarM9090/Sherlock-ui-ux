import { useCallback, useEffect, useRef, useState } from "react";

/** prefers-reduced-motion — when true, cinematic animation is skipped */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fn = () => setReduced(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

/** number counter that eases up when `start` becomes true */
export function useCountUp(
  target: number,
  start: boolean,
  duration = 1600
): number {
  const reduced = useReducedMotion();
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    if (reduced) {
      setVal(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target, duration, reduced]);
  return start ? val : 0;
}

/** IntersectionObserver — returns [ref, once-visible boolean] */
export function useInView<T extends HTMLElement>(threshold = 0.3) {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setSeen(true);
          ob.disconnect();
        }
      },
      { threshold }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [threshold]);
  return [ref, seen] as const;
}

/** window scroll position past a threshold */
export function useScrollPast(px: number): boolean {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > px);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [px]);
  return past;
}

/** drag-to-scroll for horizontal strips */
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const state = useRef({ down: false, startX: 0, startScroll: 0, moved: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const down = (e: PointerEvent) => {
      state.current.down = true;
      state.current.moved = false;
      state.current.startX = e.clientX;
      state.current.startScroll = el.scrollLeft;
    };
    const move = (e: PointerEvent) => {
      if (!state.current.down) return;
      const dx = e.clientX - state.current.startX;
      if (Math.abs(dx) > 6) state.current.moved = true;
      el.scrollLeft = state.current.startScroll - dx;
    };
    const up = () => {
      state.current.down = false;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  /* call inside onClick — true when the press was actually a drag */
  const wasDragged = useCallback(() => state.current.moved, []);

  return { ref, wasDragged };
}
