import { useCallback, useEffect, useRef, useState } from "react";
import { Hand, Move, MousePointerClick, X, Camera } from "lucide-react";
import { useToast } from "../ui";

type Phase = "off" | "starting" | "on";
type Landmark = { x: number; y: number };
interface HandEngine {
  close: () => void;
  detectForVideo: (v: HTMLVideoElement, t: number) => { landmarks?: Landmark[][] };
}

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export default function Gesture() {
  const toast = useToast();
  const [supported] = useState(
    () => typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia
  );
  const [phase, setPhase] = useState<Phase>("off");
  const [msg, setMsg] = useState("WAITING FOR OBSERVER…");
  const [modeOn, setModeOn] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lensRef = useRef<HTMLDivElement | null>(null);
  const lensInner = useRef<HTMLDivElement | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<HandEngine | null>(null);
  const rafRef = useRef(0);
  const frameRef = useRef(0);
  const lastVideoTime = useRef(-1);
  const target = useRef({ x: -200, y: -200 });
  const pos = useRef({ x: -200, y: -200 });
  const modeRef = useRef(false);
  const prevPinch = useRef(false);
  const lostFrames = useRef(0);
  const msgBase = useRef("WAITING FOR OBSERVER…");
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── status line (transient flashes return to base) ─────────── */
  const setBase = useCallback((m: string) => {
    msgBase.current = m;
    setMsg(m);
  }, []);
  const flash = useCallback((m: string) => {
    setMsg(m);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setMsg(msgBase.current), 1500);
  }, []);

  /* ── shutdown ───────────────────────────────────────────────── */
  const disable = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    modeRef.current = false;
    setModeOn(false);
    setPhase("off");
  }, []);

  useEffect(() => disable, [disable]);

  /* the preview <video> mounts only when phase === "on" — reattach the stream */
  useEffect(() => {
    if (phase === "on" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [phase]);

  /* ── gesture classification ─────────────────────────────────── */
  const classify = (lm: Landmark[]) => {
    const ext = (tip: number, pip: number) => lm[tip].y < lm[pip].y - 0.02;
    const index = ext(8, 6);
    const mid = ext(12, 10);
    const ring = ext(16, 14);
    const pink = ext(20, 18);
    const scale = Math.hypot(lm[0].x - lm[9].x, lm[0].y - lm[9].y) || 1e-4;
    const pinch = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y) / scale < 0.34;
    const open = index && mid && ring && pink && !pinch;
    const point = index && !mid && !ring && !pink;
    return { pinch, open, point, tip: { x: 1 - lm[8].x, y: lm[8].y } };
  };

  const pulseLens = () => {
    lensInner.current?.animate(
      [{ transform: "scale(1)" }, { transform: "scale(0.8)" }, { transform: "scale(1)" }],
      { duration: 300, easing: "ease-out" }
    );
  };

  const clickAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    if (!el) return;
    const nodeEl = el.closest("[data-node]") as HTMLElement | null;
    if (nodeEl?.dataset.node) {
      window.dispatchEvent(new CustomEvent("sherlock:node", { detail: nodeEl.dataset.node }));
      flash("EVIDENCE SELECTED");
      pulseLens();
      return;
    }
    const btn = el.closest("button, a, [role='button']") as HTMLElement | null;
    if (btn) {
      btn.click();
      flash("SELECTED");
      pulseLens();
    }
  };

  /* ── rAF loop — cursor smooth every frame, detect throttled ─── */
  const loop = useCallback(() => {
    rafRef.current = requestAnimationFrame(loop);
    const video = videoRef.current;
    const lm = landmarkerRef.current;

    frameRef.current++;
    if (video && lm && video.readyState >= 2 && frameRef.current % 3 === 0) {
      if (video.currentTime !== lastVideoTime.current) {
        lastVideoTime.current = video.currentTime;
        try {
          const res = lm.detectForVideo(video, performance.now());
          const hand = res.landmarks?.[0];
          if (hand) {
            lostFrames.current = 0;
            const g = classify(hand);
            target.current = {
              x: g.tip.x * window.innerWidth,
              y: g.tip.y * window.innerHeight,
            };
            if (g.open && !modeRef.current) {
              modeRef.current = true;
              setModeOn(true);
              setBase("INVESTIGATION MODE ACTIVE");
            }
            if (modeRef.current && g.pinch && !prevPinch.current) {
              clickAt(target.current.x, target.current.y);
            }
            prevPinch.current = g.pinch;
            if (msgBase.current === "WAITING FOR OBSERVER…") setBase("OBSERVER DETECTED");
          } else {
            lostFrames.current++;
            if (lostFrames.current === 45) flash("TRACKING LOST");
          }
        } catch {
          /* a dropped frame is expected — never surface it */
        }
      }
    }

    /* gliding magnifier */
    pos.current.x += (target.current.x - pos.current.x) * 0.32;
    pos.current.y += (target.current.y - pos.current.y) * 0.32;
    if (lensRef.current) {
      lensRef.current.style.transform = `translate3d(${pos.current.x - 32}px, ${pos.current.y - 32}px, 0)`;
    }
  }, [setBase, flash]);

  /* ── activation ─────────────────────────────────────────────── */
  const enable = useCallback(async () => {
    setPhase("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 360, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("no video");
      video.srcObject = stream;
      await video.play();

      const vision = await import("@mediapipe/tasks-vision");
      const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL);
      const landmarker = await vision.HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL },
        runningMode: "VIDEO",
        numHands: 1,
      });
      landmarkerRef.current = landmarker;
      setPhase("on");
      setMsg("WAITING FOR OBSERVER…");
      msgBase.current = "WAITING FOR OBSERVER…";
      toast({
        tone: "gold",
        title: "Observer connected",
        detail: "Open palm to activate • point to examine • pinch to select.",
      });
      loop();
    } catch {
      disable();
      setPhase("off");
      toast({
        tone: "red",
        title: "Gesture mode unavailable",
        detail: "Camera access required. Continue with mouse → the case proceeds.",
      });
    }
  }, [disable, loop, toast]);

  if (!supported) return null;

  return (
    <>
      {/* activation pill */}
      {phase !== "on" && (
        <button
          onClick={enable}
          disabled={phase === "starting"}
          className="fixed bottom-6 right-6 z-[60] flex items-center gap-2.5 rounded-full border border-line bg-surface px-4 py-2.5 font-sans text-[12px] font-medium tracking-[1.5px] text-mute shadow-[var(--shadow-card)] transition-all duration-300 hover:border-gold/40 hover:text-ink disabled:opacity-70"
        >
          <Hand size={15} strokeWidth={1.6} className="text-gold" />
          GESTURE MODE
          <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 font-mono text-[9.5px] tracking-[1.5px] text-gold">
            {phase === "starting" ? "STARTING…" : "ENABLE"}
          </span>
        </button>
      )}

      {phase === "on" && (
        <>
          {/* camera preview */}
          <div className="fixed bottom-6 right-6 z-[60] w-[168px]">
            <div className="mb-2 flex items-center gap-2">
              <span className={`h-[6px] w-[6px] rounded-full ${modeOn ? "bg-gold pulse-dot" : "bg-mute"}`} />
              <span className={`font-mono text-[9.5px] tracking-[2px] ${modeOn ? "text-gold" : "text-mute"}`}>
                {msg}
              </span>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-line opacity-80 shadow-[var(--shadow-card)]">
              <video
                ref={videoRef}
                muted
                playsInline
                className="h-[108px] w-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
              <span className="absolute bottom-1.5 left-2 flex items-center gap-1.5 font-mono text-[8px] tracking-[2px] text-gold/90">
                <Camera size={9} strokeWidth={2} /> LIVE
              </span>
            </div>
            <button
              onClick={disable}
              className="mt-2 w-full rounded-lg border border-line bg-surface py-1.5 font-mono text-[9px] tracking-[2px] text-mute transition-colors duration-200 hover:border-gold/40 hover:text-ink"
            >
              DISABLE GESTURES
            </button>
          </div>

          {/* control panel */}
          {panelOpen ? (
            <div className="fixed right-5 top-[84px] z-[60] w-[228px] rounded-xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-mono text-[10px] tracking-[2px] text-gold">
                  <span className="pulse-dot h-[5px] w-[5px] rounded-full bg-gold" />
                  GESTURE MODE
                </span>
                <button
                  onClick={() => setPanelOpen(false)}
                  aria-label="Minimise gesture panel"
                  className="text-mute transition-colors hover:text-ink"
                >
                  <X size={13} strokeWidth={1.75} />
                </button>
              </div>
              <ul className="mt-3.5 space-y-2.5">
                <li className="flex items-center gap-2.5 font-sans text-[12px] text-mute">
                  <Hand size={13} strokeWidth={1.6} className="text-gold" /> Open palm — activate
                </li>
                <li className="flex items-center gap-2.5 font-sans text-[12px] text-mute">
                  <Move size={13} strokeWidth={1.6} className="text-gold" /> Point — navigate
                </li>
                <li className="flex items-center gap-2.5 font-sans text-[12px] text-mute">
                  <MousePointerClick size={13} strokeWidth={1.6} className="text-gold" /> Pinch — select
                </li>
              </ul>
            </div>
          ) : (
            <button
              onClick={() => setPanelOpen(true)}
              className="fixed right-5 top-[84px] z-[60] rounded-lg border border-line bg-surface px-3 py-1.5 font-mono text-[9px] tracking-[2px] text-mute hover:text-ink"
            >
              GESTURES
            </button>
          )}

          {/* the magnifying lens — transform driven by refs only */}
          <div
            ref={lensRef}
            aria-hidden
            className={`pointer-events-none fixed left-0 top-0 z-[70] h-16 w-16 transition-opacity duration-300 ${
              modeOn ? "opacity-100" : "opacity-0"
            }`}
            style={{ willChange: "transform" }}
          >
            <div
              ref={lensInner}
              className="flex h-full w-full items-end justify-center rounded-full border-2 border-gold/60 backdrop-brightness-[1.45] backdrop-saturate-150"
              style={{
                boxShadow:
                  "0 0 34px rgba(199,167,106,0.22), inset 0 0 0 1px rgba(9,10,12,0.6)",
                background: "rgba(199,167,106,0.05)",
              }}
            >
              <span className="mb-1.5 h-1 w-1 rounded-full bg-gold" />
            </div>
          </div>
        </>
      )}

      {/* hidden video during startup */}
      {phase !== "on" && (
        <video ref={videoRef} muted playsInline className="hidden" aria-hidden />
      )}
    </>
  );
}
