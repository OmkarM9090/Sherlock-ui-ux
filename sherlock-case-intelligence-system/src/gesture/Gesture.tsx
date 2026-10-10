import { useCallback, useEffect, useRef, useState } from "react";
import { Hand, Move, MousePointerClick, X, Camera } from "lucide-react";
import { useToast } from "../ui";

type Phase = "off" | "starting" | "on";
type Landmark = { x: number; y: number };
interface HandEngine {
  close: () => void;
  detectForVideo: (video: HTMLVideoElement, timestamp: number) => { landmarks?: Landmark[][] };
}

// Keep the runtime and WASM versions in lockstep with package.json.
const VISION_MODULE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.0/vision_bundle.mjs";
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.0/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const SCROLL_DEAD_ZONE = 0.004;
const MAX_SCROLL_SPEED = 520;

function classify(lm: Landmark[]) {
  const extended = (tip: number, pip: number) => lm[tip].y < lm[pip].y - 0.02;
  const index = extended(8, 6);
  const middle = extended(12, 10);
  const ring = extended(16, 14);
  const pinky = extended(20, 18);
  const scale = Math.hypot(lm[0].x - lm[9].x, lm[0].y - lm[9].y) || 1e-4;
  const pinch = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y) / scale < 0.34;
  const open = index && middle && ring && pinky && !pinch;
  return { pinch, open, tip: { x: 1 - lm[8].x, y: lm[8].y } };
}

export default function Gesture() {
  const toast = useToast();
  const [supported] = useState(
    () => typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia
  );
  const [phase, setPhase] = useState<Phase>("off");
  const [msg, setMsg] = useState("GESTURE MODE READY");
  const [modeOn, setModeOn] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lensRef = useRef<HTMLDivElement | null>(null);
  const lensInner = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<HandEngine | null>(null);
  const sessionRef = useRef(0);
  const mountedRef = useRef(false);
  const rafRef = useRef(0);
  const frameRef = useRef(0);
  const lastVideoTime = useRef(-1);
  const lastFrameAt = useRef(0);
  const lastHandSampleAt = useRef(0);
  const target = useRef({ x: -200, y: -200 });
  const pos = useRef({ x: -200, y: -200 });
  const modeRef = useRef(false);
  const prevPinch = useRef(false);
  const lostFrames = useRef(0);
  const smoothedHandY = useRef<number | null>(null);
  const desiredScrollVelocity = useRef(0);
  const scrollVelocity = useRef(0);
  const virtualHoverRef = useRef<HTMLElement | null>(null);
  const msgBase = useRef("GESTURE MODE READY");
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setBase = useCallback((value: string) => {
    msgBase.current = value;
    setMsg(value);
  }, []);

  const flash = useCallback((value: string) => {
    setMsg(value);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setMsg(msgBase.current), 1450);
  }, []);

  const updateVirtualHover = useCallback((x: number, y: number) => {
    const hit = document.elementFromPoint(x, y);
    const next = hit?.closest<HTMLElement>("button, a, [role='button'], [data-node], .spotlight-card") ?? null;
    const previous = virtualHoverRef.current;
    if (previous === next) return;
    previous?.classList.remove("gesture-hover");
    virtualHoverRef.current = next;
    next?.classList.add("gesture-hover");
    const previousNode = previous?.dataset.node;
    const nextNode = next?.dataset.node;
    if (previousNode || nextNode) {
      window.dispatchEvent(new CustomEvent("sherlock:node-hover", { detail: nextNode ?? null }));
    }
  }, []);

  const stopEngine = useCallback(() => {
    sessionRef.current += 1;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    try {
      landmarkerRef.current?.close();
    } catch {
      // A camera or task may already have stopped; shutdown remains idempotent.
    }
    landmarkerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    modeRef.current = false;
    prevPinch.current = false;
    smoothedHandY.current = null;
    desiredScrollVelocity.current = 0;
    scrollVelocity.current = 0;
    lastVideoTime.current = -1;
    if (virtualHoverRef.current) {
      const wasNode = virtualHoverRef.current.dataset.node;
      virtualHoverRef.current.classList.remove("gesture-hover");
      virtualHoverRef.current = null;
      if (wasNode) window.dispatchEvent(new CustomEvent("sherlock:node-hover", { detail: null }));
    }
    if (flashTimer.current) clearTimeout(flashTimer.current);
  }, []);

  const disable = useCallback(() => {
    stopEngine();
    setModeOn(false);
    setPhase("off");
    setBase("GESTURE MODE READY");
  }, [setBase, stopEngine]);

  // Invalidate pending camera/model work before stopping resources on unmount.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopEngine();
    };
  }, [stopEngine]);

  /* The preview mounts after permission succeeds; reattach the active stream. */
  useEffect(() => {
    if (phase === "on" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [phase]);

  const pulseLens = useCallback(() => {
    lensInner.current?.animate(
      [{ transform: "scale(1)" }, { transform: "scale(0.82)" }, { transform: "scale(1)" }],
      { duration: 300, easing: "ease-out" }
    );
  }, []);

  const clickAt = useCallback(
    (x: number, y: number) => {
      const element = document.elementFromPoint(x, y) as HTMLElement | null;
      if (!element) return;
      const node = element.closest<HTMLElement>("[data-node]");
      if (node?.dataset.node) {
        window.dispatchEvent(new CustomEvent("sherlock:node", { detail: node.dataset.node }));
        flash("EVIDENCE SELECTED");
        pulseLens();
        return;
      }
      const control = element.closest<HTMLElement>("button, a, [role='button']");
      if (control) {
        control.click();
        flash("SELECTED");
        pulseLens();
      }
    },
    [flash, pulseLens]
  );

  /* One rAF loop: inference is throttled; cursor and damped scroll use refs. */
  const loop = useCallback(() => {
    rafRef.current = requestAnimationFrame(loop);
    const now = performance.now();
    const dt = Math.min(0.05, Math.max(0.001, (now - (lastFrameAt.current || now)) / 1000));
    lastFrameAt.current = now;

    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    frameRef.current += 1;

    if (video && landmarker && video.readyState >= 2 && frameRef.current % 3 === 0) {
      if (video.currentTime !== lastVideoTime.current) {
        lastVideoTime.current = video.currentTime;
        const sampleAt = performance.now();
        try {
          const result = landmarker.detectForVideo(video, sampleAt);
          const hand = result.landmarks?.[0];
          if (hand) {
            lostFrames.current = 0;
            const gesture = classify(hand);
            target.current = {
              x: gesture.tip.x * window.innerWidth,
              y: gesture.tip.y * window.innerHeight,
            };
            if (msgBase.current !== "OBSERVER DETECTED") setBase("OBSERVER DETECTED");

            if (gesture.pinch && !prevPinch.current && modeRef.current) {
              clickAt(target.current.x, target.current.y);
            }
            prevPinch.current = gesture.pinch;

            if (gesture.open && modeRef.current) {
              const oldY = smoothedHandY.current;
              const smoothY = oldY === null ? gesture.tip.y : oldY + (gesture.tip.y - oldY) * 0.34;
              if (oldY !== null) {
                const sampleSeconds = Math.max(0.06, Math.min(0.24, (sampleAt - lastHandSampleAt.current) / 1000));
                const deltaUp = oldY - smoothY; // hand up => positive page velocity
                desiredScrollVelocity.current = Math.abs(deltaUp) < SCROLL_DEAD_ZONE
                  ? 0
                  : Math.max(-MAX_SCROLL_SPEED, Math.min(MAX_SCROLL_SPEED, (deltaUp / sampleSeconds) * 440));
              }
              smoothedHandY.current = smoothY;
              lastHandSampleAt.current = sampleAt;
            } else {
              smoothedHandY.current = null;
              lastHandSampleAt.current = sampleAt;
              desiredScrollVelocity.current = 0;
            }
          } else {
            lostFrames.current += 1;
            smoothedHandY.current = null;
            desiredScrollVelocity.current = 0;
            prevPinch.current = false;
            if (lostFrames.current === 10) updateVirtualHover(-1000, -1000);
            if (lostFrames.current === 45) {
              setBase("GESTURE MODE ACTIVE");
              flash("OBSERVER LOST");
            }
          }
        } catch {
          // Camera frames can be dropped during focus changes; keep the interface alive.
        }
      }
    }

    // Damped, clamped velocity: no direct mapping from hand position to page y.
    scrollVelocity.current += (desiredScrollVelocity.current - scrollVelocity.current) * 0.16;
    if (Math.abs(scrollVelocity.current) > 1) {
      window.scrollBy(0, scrollVelocity.current * dt);
    }

    pos.current.x += (target.current.x - pos.current.x) * 0.28;
    pos.current.y += (target.current.y - pos.current.y) * 0.28;
    if (modeRef.current && frameRef.current % 2 === 0) {
      updateVirtualHover(pos.current.x, pos.current.y);
    }
    if (lensRef.current) {
      lensRef.current.style.transform = `translate3d(${pos.current.x - 34}px, ${pos.current.y - 34}px, 0)`;
    }
  }, [clickAt, flash, setBase, updateVirtualHover]);

  const enable = useCallback(async () => {
    if (phase === "starting" || phase === "on") return;
    const session = sessionRef.current + 1;
    sessionRef.current = session;
    const isCurrentSession = () => mountedRef.current && sessionRef.current === session;
    let stream: MediaStream | null = null;
    let pendingLandmarker: HandEngine | null = null;
    const releasePending = () => {
      try {
        pendingLandmarker?.close();
      } catch {
        // The task may already have been disposed by a competing shutdown.
      }
      stream?.getTracks().forEach((track) => track.stop());
      if (streamRef.current === stream) streamRef.current = null;
      if (videoRef.current?.srcObject === stream) videoRef.current.srcObject = null;
    };

    setUnavailable(false);
    setPhase("starting");
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 360, facingMode: "user" },
        audio: false,
      });
      if (!isCurrentSession()) {
        releasePending();
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("Camera preview is unavailable.");
      video.srcObject = stream;
      await video.play();
      if (!isCurrentSession()) {
        releasePending();
        return;
      }

      // Runtime-load the standalone ESM only after the user enables gesture mode.
      // @vite-ignore keeps the optional model runtime out of the opening bundle.
      const vision = await import(/* @vite-ignore */ VISION_MODULE_URL);
      if (!isCurrentSession()) {
        releasePending();
        return;
      }
      const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL);
      if (!isCurrentSession()) {
        releasePending();
        return;
      }
      pendingLandmarker = await vision.HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL },
        runningMode: "VIDEO",
        numHands: 1,
      });
      if (!isCurrentSession()) {
        releasePending();
        return;
      }
      landmarkerRef.current = pendingLandmarker;
      pendingLandmarker = null;
      modeRef.current = true;
      frameRef.current = 0;
      lastFrameAt.current = performance.now();
      lostFrames.current = 0;
      setPhase("on");
      setModeOn(true);
      setBase("GESTURE MODE ACTIVE");
      toast({
        tone: "gold",
        title: "Observer connected",
        detail: "Point to guide the lens • pinch to select • open palm to scroll.",
      });
      loop();
    } catch {
      if (!isCurrentSession()) {
        releasePending();
        return;
      }
      stopEngine();
      setPhase("off");
      setModeOn(false);
      setUnavailable(true);
      setBase("GESTURE MODE UNAVAILABLE");
      toast({
        tone: "red",
        title: "Gesture mode unavailable",
        detail: "Camera access is optional. Continue with mouse or keyboard navigation.",
      });
    }
  }, [loop, phase, setBase, stopEngine, toast]);

  if (!supported) return null;

  return (
    <>
      {/* Permission is requested only after this explicit action. */}
      {phase !== "on" && (
        <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-2">
          {unavailable && (
            <p className="rounded-md border border-line bg-surface/95 px-3 py-2 font-mono text-[9px] tracking-[1.2px] text-mute shadow-[var(--shadow-card)]" role="status">
              GESTURE MODE UNAVAILABLE · CONTINUE WITH MOUSE →
            </p>
          )}
          <button
            type="button"
            onClick={enable}
            disabled={phase === "starting"}
            className="flex items-center gap-2.5 rounded-full border border-line bg-surface px-4 py-2.5 font-sans text-[12px] font-medium tracking-[1.5px] text-mute shadow-[var(--shadow-card)] transition-all duration-300 hover:border-gold/40 hover:text-ink disabled:opacity-70"
          >
            <Hand size={15} strokeWidth={1.6} className="text-gold" />
            GESTURE MODE
            <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 font-mono text-[9.5px] tracking-[1.5px] text-gold">
              {phase === "starting" ? "STARTING…" : "ENABLE"}
            </span>
          </button>
        </div>
      )}

      {phase === "on" && (
        <>
          {/* Quiet 160 × 120 camera monitor; the investigation remains in front. */}
          <div className="fixed bottom-6 right-6 z-[60] w-[160px]">
            <div className="mb-2 flex items-center gap-2" aria-live="polite">
              <span className={`h-[6px] w-[6px] rounded-full ${modeOn ? "bg-gold pulse-dot" : "bg-mute"}`} />
              <span className={`font-mono text-[9px] tracking-[1.6px] ${modeOn ? "text-gold" : "text-mute"}`}>
                {msg}
              </span>
            </div>
            <div className="relative h-[120px] w-[160px] overflow-hidden rounded-lg border border-line bg-bg shadow-[var(--shadow-card)]">
              <video
                ref={videoRef}
                muted
                playsInline
                className="h-full w-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
              <span className="absolute bottom-1.5 left-2 flex items-center gap-1.5 font-mono text-[8px] tracking-[1.7px] text-gold/90">
                <Camera size={9} strokeWidth={2} /> LIVE
              </span>
            </div>
            <button
              type="button"
              onClick={disable}
              className="mt-2 w-full rounded-lg border border-line bg-surface py-1.5 font-mono text-[9px] tracking-[1.8px] text-mute transition-colors duration-200 hover:border-gold/40 hover:text-ink"
            >
              DISABLE GESTURES
            </button>
          </div>

          {panelOpen ? (
            <div className="fixed right-5 top-[84px] z-[60] w-[228px] rounded-xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-mono text-[10px] tracking-[2px] text-gold">
                  <span className="pulse-dot h-[5px] w-[5px] rounded-full bg-gold" />
                  GESTURE MODE ACTIVE
                </span>
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  aria-label="Minimise gesture panel"
                  className="text-mute transition-colors hover:text-ink"
                >
                  <X size={13} strokeWidth={1.75} />
                </button>
              </div>
              <ul className="mt-3.5 space-y-2.5">
                <li className="flex items-center gap-2.5 font-sans text-[12px] text-mute">
                  <Move size={13} strokeWidth={1.6} className="text-gold" /> Index finger — guide lens
                </li>
                <li className="flex items-center gap-2.5 font-sans text-[12px] text-mute">
                  <MousePointerClick size={13} strokeWidth={1.6} className="text-gold" /> Pinch — select evidence
                </li>
                <li className="flex items-center gap-2.5 font-sans text-[12px] text-mute">
                  <Hand size={13} strokeWidth={1.6} className="text-gold" /> Open palm — scroll
                </li>
              </ul>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              className="fixed right-5 top-[84px] z-[60] rounded-lg border border-line bg-surface px-3 py-1.5 font-mono text-[9px] tracking-[2px] text-mute hover:text-ink"
            >
              GESTURES
            </button>
          )}

          {/* Ref-driven cursor — never causes a React render per frame. */}
          <div
            ref={lensRef}
            aria-hidden="true"
            className="pointer-events-none fixed left-0 top-0 z-[70] h-[68px] w-[68px] opacity-100"
            style={{ willChange: "transform" }}
          >
            <div
              ref={lensInner}
              className="flex h-full w-full items-end justify-center rounded-full border-2 border-gold/65 backdrop-brightness-[1.25] backdrop-saturate-125"
              style={{
                boxShadow: "0 0 26px rgba(199,167,106,0.16), inset 0 0 0 1px rgba(9,10,12,0.62)",
                background: "rgba(199,167,106,0.045)",
              }}
            >
              <span className="mb-1.5 h-1 w-1 rounded-full bg-gold" />
            </div>
          </div>
        </>
      )}

      {/* Camera stream is prepared here before the optional monitor mounts. */}
      {phase !== "on" && <video ref={videoRef} muted playsInline className="hidden" aria-hidden="true" />}
    </>
  );
}
