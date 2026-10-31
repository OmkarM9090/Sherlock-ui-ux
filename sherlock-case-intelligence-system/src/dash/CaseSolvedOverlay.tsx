import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import {
  X,
  RotateCcw,
  ShieldCheck,
  FileText,
  User,
  Search,
} from "lucide-react";
import { CASE, suspectById, SUSPECTS, EVIDENCE } from "../data/caseData";
import { GoldButton, Tag } from "../ui";
import { useReducedMotion } from "../hooks";

interface CaseSolvedOverlayProps {
  culpritId: string | null;
  onClose: () => void;
  onReopenDossier?: () => void;
}

/* ── Web Audio Synth for Victorian Stamp Thud ────────────────── */
function playStampThud() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    // Heavy stamp impact thud
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(130, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(26, ctx.currentTime + 0.32);
    gain.gain.setValueAtTime(0.7, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.33);

    // Warm Victorian brass chime reverberation
    setTimeout(() => {
      try {
        const chime = ctx.createOscillator();
        const chimeGain = ctx.createGain();
        chime.type = "sine";
        chime.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        chimeGain.gain.setValueAtTime(0.18, ctx.currentTime);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
        chime.connect(chimeGain);
        chimeGain.connect(ctx.destination);
        chime.start();
        chime.stop(ctx.currentTime + 0.75);
      } catch {}
    }, 60);
  } catch {
    // Graceful fallback for environments without audio
  }
}

/* ── Ornate Victorian Filigree Corner ────────────────────────── */
function CornerFiligree({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={`h-10 w-10 pointer-events-none text-gold/45 ${className}`}
      fill="none"
      stroke="currentColor"
    >
      <path d="M2 46 V 14 Q 2 2 14 2 H 46" strokeWidth="1.5" />
      <path d="M7 46 V 18 Q 7 7 18 7 H 46" strokeWidth="0.75" strokeDasharray="3 3" />
      <circle cx="14" cy="14" r="2.5" fill="currentColor" />
      <path d="M14 2 Q 24 14 14 24 Q 4 14 14 2" strokeWidth="0.75" />
    </svg>
  );
}

/* ── Sherlock Pipe with Animated Smoke ───────────────────────── */
function SherlockPipeSilhouette() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Curling smoke trails */}
      <svg
        viewBox="0 0 100 80"
        className="absolute -top-12 left-6 h-14 w-20 pointer-events-none overflow-visible opacity-75"
      >
        <path
          d="M30 70 Q 20 40 40 25 T 30 5"
          fill="none"
          stroke="rgba(228, 200, 135, 0.45)"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="pipe-smoke-1"
        />
        <path
          d="M35 70 Q 50 45 35 28 T 48 2"
          fill="none"
          stroke="rgba(199, 167, 106, 0.35)"
          strokeWidth="1.2"
          strokeLinecap="round"
          className="pipe-smoke-2"
        />
        <path
          d="M25 72 Q 10 50 25 32 T 18 8"
          fill="none"
          stroke="rgba(242, 238, 229, 0.25)"
          strokeWidth="1"
          strokeLinecap="round"
          className="pipe-smoke-3"
        />
      </svg>

      {/* Classic Sherlock Calabash Pipe SVG */}
      <svg
        viewBox="0 0 80 40"
        className="h-8 w-16 text-gold drop-shadow-[0_2px_8px_rgba(199,167,106,0.3)]"
        fill="currentColor"
      >
        {/* Bowl */}
        <path d="M16 10 C 16 6, 32 6, 32 10 L 30 22 C 30 28, 20 32, 14 28 C 8 24, 10 16, 16 10 Z" />
        <ellipse cx="24" cy="9" rx="8" ry="3" fill="#E4C887" />
        {/* Stem curve */}
        <path
          d="M24 26 C 28 32, 44 34, 56 26 C 64 20, 72 14, 78 12 L 77 10 C 70 12, 62 18, 54 23 C 44 29, 30 28, 24 24 Z"
          fill="#C7A76A"
        />
        {/* Mouthpiece */}
        <path d="M76 10 L 80 9 L 79 13 L 75 12 Z" fill="#F2EEE5" />
      </svg>
    </div>
  );
}

export default function CaseSolvedOverlay({
  culpritId,
  onClose,
  onReopenDossier,
}: CaseSolvedOverlayProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const stampRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    decay: number;
    color: string;
    rotation: number;
    vRot: number;
  }>>([]);
  const animFrameRef = useRef<number | null>(null);

  const reduced = useReducedMotion();
  const [animationKey, setAnimationKey] = useState(0);

  // Identify culprit details
  const culprit = (culpritId && suspectById(culpritId)) || SUSPECTS[0];
  const supportingEvidence = EVIDENCE.slice(0, 3);

  /* ── Golden Embers / Dust Canvas ────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Initial embers
    const colors = ["#C7A76A", "#E4C887", "#F2EEE5", "#71967A", "#B94E47"];
    const count = reduced ? 20 : 65;
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: Math.random() * 0.9 + 0.4,
      size: Math.random() * 3 + 1,
      alpha: Math.random() * 0.6 + 0.2,
      decay: Math.random() * 0.005 + 0.002,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.04,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;

        if (p.y > height + 10) {
          p.y = -10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        // Draw diamond spark or mini leaf
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.8, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.8, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [reduced]);

  /* ── GSAP Full Screen Sherlock Entrance & Stamp Slam ────────── */
  const runEntranceAnimation = useCallback(() => {
    if (!rootRef.current || !cardRef.current) return;

    playStampThud();

    if (reduced) return;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(cardRef.current);
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Stage 1: Screen backdrop and card reveal
      tl.fromTo(
        rootRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.45 }
      )
        .fromTo(
          cardRef.current,
          { scale: 0.9, y: 35, opacity: 0 },
          { scale: 1, y: 0, opacity: 1, duration: 0.65, ease: "back.out(1.2)" },
          "-=0.2"
        )
        // Stage 2: Sherlock cameo & header stagger
        .fromTo(
          q("[data-sherlock-cameo]"),
          { scale: 0.6, opacity: 0, rotation: -10 },
          { scale: 1, opacity: 1, rotation: 0, duration: 0.6, ease: "elastic.out(1, 0.75)" },
          "-=0.4"
        )
        .fromTo(
          q("[data-reveal]"),
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.45, stagger: 0.08 },
          "-=0.3"
        )
        // Stage 3: The Crimson Rubber Stamp SLAM
        .fromTo(
          stampRef.current,
          { scale: 2.8, opacity: 0, rotation: -26 },
          {
            scale: 1,
            opacity: 1,
            rotation: -9,
            duration: 0.42,
            ease: "power4.in",
            onStart: () => {
              playStampThud();
            },
          },
          "-=0.1"
        )
        // Stage 4: Micro shake on stamp impact
        .to(
          cardRef.current,
          {
            x: "+=4",
            y: "-=3",
            duration: 0.04,
            repeat: 5,
            yoyo: true,
            ease: "none",
          },
          "-=0.1"
        )
        // Stage 5: Confidence meter gauge bar expansion
        .fromTo(
          q("[data-meter-fill]"),
          { width: "0%" },
          { width: "100%", duration: 0.8, ease: "power2.out" },
          "-=0.2"
        );
    }, rootRef);

    return () => ctx.revert();
  }, [reduced]);

  useEffect(() => {
    runEntranceAnimation();
  }, [runEntranceAnimation, animationKey]);

  // Escape key handler
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-bg/92 p-3 sm:p-6 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-label="Case Solved - Deduction Confirmed"
    >
      {/* Background Golden Sparkle / Ember Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      />

      {/* Atmospheric Fog / Vignette Overlay */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(9,10,12,0.85)_100%)]" />

      {/* Main Sherlock Solved Victorian Dossier Card */}
      <div
        ref={cardRef}
        className="relative z-10 my-auto w-full max-w-4xl rounded-2xl border-2 border-gold/40 bg-surface/95 p-6 sm:p-10 shadow-[0_0_80px_rgba(199,167,106,0.18)] backdrop-blur-2xl transition-all"
      >
        {/* Victorian Ornamental Filigree Corners */}
        <CornerFiligree className="absolute -left-2 -top-2" />
        <CornerFiligree className="absolute -right-2 -top-2 rotate-90" />
        <CornerFiligree className="absolute -bottom-2 -left-2 -rotate-90" />
        <CornerFiligree className="absolute -bottom-2 -right-2 rotate-180" />

        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="group absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-elev text-mute transition-all hover:border-gold/50 hover:bg-gold/10 hover:text-ink"
          aria-label="Close Case Solved Display"
        >
          <X size={16} strokeWidth={2} className="transition-transform group-hover:scale-110" />
        </button>

        {/* ── Top Header Strip: Scotland Yard & Baker Street ──── */}
        <div data-reveal className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-[3px] text-gold uppercase">
              SCOTLAND YARD ARCHIVES
            </span>
            <span className="text-line">•</span>
            <span className="font-mono text-[10px] tracking-[2px] text-mute">
              DIVISION 221B
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-[2px] text-sage">
              STATUS: RESOLVED & VERIFIED
            </span>
            <span className="h-2 w-2 rounded-full bg-sage" />
          </div>
        </div>

        {/* ── Center Stage: Sherlock Cameo & Grand Announcement ─── */}
        <div className="mt-8 flex flex-col items-center text-center">
          {/* Sherlock Portrait Cameo Oval with Pipe Smoke */}
          <div data-sherlock-cameo className="relative mb-4 flex flex-col items-center">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-gold shadow-[0_0_35px_rgba(199,167,106,0.35)] ring-4 ring-gold/15">
              <img
                src="/sus/sherlock face.png"
                alt="Mr. Sherlock Holmes"
                className="h-full w-full object-cover grayscale contrast-125 opacity-90 scale-105"
              />
              <div className="absolute inset-0 bg-gold/15 mix-blend-overlay" />
            </div>

            {/* Sherlock Pipe Silhouette with rising smoke underneath */}
            <div className="mt-2">
              <SherlockPipeSilhouette />
            </div>
          </div>

          <p data-reveal className="font-mono text-[11px] tracking-[4px] text-gold uppercase">
            INDIVIDUAL DEDUCTION COMPLETE
          </p>

          <h1
            data-reveal
            className="mt-2 font-display text-4xl sm:text-6xl font-normal tracking-[3px] text-ink drop-shadow-[0_2px_15px_rgba(199,167,106,0.25)]"
          >
            THE CASE IS SOLVED
          </h1>

          <p
            data-reveal
            className="mt-2 max-w-lg font-serif italic text-[14px] sm:text-[15px] text-mute"
          >
            “When you have eliminated the impossible, whatever remains, however
            improbable, must be the truth.”
          </p>
          <p data-reveal className="font-mono text-[9px] tracking-[2px] text-gold/80 mt-1">
            — MR. SHERLOCK HOLMES, 221B BAKER STREET
          </p>
        </div>

        {/* ── Identified Culprit & Forensic Evidence Grid ───────── */}
        <div data-reveal className="relative mt-8 grid gap-5 sm:grid-cols-12">
          {/* Culprit Dossier Card */}
          <div className="relative sm:col-span-7 rounded-xl border border-line bg-elev/70 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-gold" />
                <span className="font-mono text-[10.5px] tracking-[2px] text-gold uppercase">
                  PERPETRATOR IDENTIFIED
                </span>
              </div>
              <Tag tone="green" className="text-[10px] tracking-[1px]">
                CONFIRMED
              </Tag>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div className="relative h-18 w-18 flex-shrink-0 overflow-hidden rounded-lg border border-line bg-surface">
                {culprit.photo ? (
                  <img
                    src={culprit.photo}
                    alt={culprit.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gold">
                    <User size={28} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gold/10 mix-blend-color" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-mono text-[10px] tracking-[1.5px] text-mute">
                  IDENTIFIER: {culprit.id}
                </p>
                <h3 className="truncate font-display text-2xl font-semibold text-ink">
                  {culprit.name}
                </h3>
                <p className="font-mono text-[11px] text-crimson tracking-[1px]">
                  {culprit.role}
                </p>
                <p className="mt-1 text-[12px] leading-snug text-mute line-clamp-2">
                  {culprit.description}
                </p>
              </div>
            </div>

            {/* Motive & Clue Breakdown */}
            <div className="mt-4 space-y-2 rounded-lg border border-line/40 bg-surface/50 p-3">
              <div className="flex items-start gap-2 text-[11.5px]">
                <span className="font-mono text-[10px] tracking-[1.5px] text-gold flex-shrink-0">
                  MOTIVE / CLUE:
                </span>
                <span className="text-ink font-medium">{culprit.clueAgainst}</span>
              </div>
              <div className="flex items-start gap-2 text-[11.5px]">
                <span className="font-mono text-[10px] tracking-[1.5px] text-crimson flex-shrink-0">
                  ALIBI STATUS:
                </span>
                <span className="text-mute line-through">{culprit.alibi}</span>
                <span className="text-sage text-[10px] font-mono tracking-[1px]">
                  [DISPROVED]
                </span>
              </div>
            </div>

            {/* Confidence Gauge Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between font-mono text-[10px] tracking-[1.5px] text-mute mb-1.5">
                <span>DEDUCTION CERTAINTY</span>
                <span className="text-sage font-bold">100% UNQUESTIONABLE</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface border border-line">
                <div
                  data-meter-fill
                  className="h-full bg-gradient-to-r from-gold via-sage to-sage shadow-[0_0_12px_rgba(113,150,122,0.6)]"
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </div>

          {/* Case Metadata & Solved Summary Card */}
          <div className="sm:col-span-5 flex flex-col justify-between rounded-xl border border-line bg-elev/70 p-5">
            <div>
              <div className="flex items-center gap-2 border-b border-line/60 pb-3">
                <FileText size={15} className="text-gold" />
                <span className="font-mono text-[10.5px] tracking-[2px] text-gold uppercase">
                  CASE DOSSIER #{CASE.id}
                </span>
              </div>

              <div className="mt-3">
                <h4 className="font-display text-lg text-ink font-semibold">
                  {CASE.title}
                </h4>
                <p className="mt-1 text-[12px] leading-relaxed text-mute">
                  All contradictions resolved. The evidence has converged
                  irrevocably upon the culprit. The stolen property is restored
                  and the ledger is sealed.
                </p>
              </div>

              {/* Supporting Key Exhibits */}
              <div className="mt-4 space-y-1.5">
                <span className="font-mono text-[9px] tracking-[1.5px] text-mute uppercase">
                  CORROBORATING EXHIBITS:
                </span>
                {supportingEvidence.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between rounded bg-surface/70 px-2.5 py-1 text-[11px]"
                  >
                    <span className="font-mono text-gold text-[10px]">{ev.id}</span>
                    <span className="truncate text-ink max-w-[150px]">{ev.title}</span>
                    <span className="text-sage font-mono text-[10px]">{ev.confidence}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3 text-[10px] font-mono text-mute">
              <span>LOCATION: LONDON</span>
              <span>DATE: 14 NOV 1897</span>
            </div>
          </div>

          {/* ── THE DRAMATIC CRIMSON CASE CLOSED STAMP ─────────── */}
          <div
            ref={stampRef}
            className="pointer-events-none absolute right-3 sm:right-10 top-1/2 -translate-y-1/2 z-30 select-none"
            style={{ transform: "rotate(-9deg)" }}
          >
            <div className="relative rounded-lg border-4 border-crimson/90 bg-surface/85 px-6 py-4 shadow-[0_0_35px_rgba(185,78,71,0.55)] backdrop-blur-sm">
              {/* Inner distressed border */}
              <div className="border border-dashed border-crimson/70 px-4 py-2 text-center">
                <p className="font-mono text-[9px] tracking-[3px] text-crimson uppercase font-bold">
                  SCOTLAND YARD // OFFICIAL
                </p>
                <p className="my-1 font-display text-2xl sm:text-3xl font-extrabold tracking-[4px] text-crimson">
                  CASE CLOSED
                </p>
                <p className="font-mono text-[8px] tracking-[2.5px] text-crimson/90">
                  VERDICT CONFIRMED • 1897
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer Actions & Controls ────────────────────────── */}
        <div data-reveal className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setAnimationKey((k) => k + 1);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-elev px-4 py-2.5 font-sans text-[11px] font-medium tracking-[1.5px] text-mute uppercase transition-all duration-200 hover:border-gold/40 hover:text-gold"
              title="Replay Sherlock victory animation"
            >
              <RotateCcw size={13} strokeWidth={2} />
              Replay Deduction
            </button>

            {onReopenDossier && (
              <button
                onClick={onReopenDossier}
                className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 font-sans text-[11px] font-medium tracking-[1.5px] text-mute uppercase transition-all hover:border-gold/40 hover:text-ink"
              >
                <Search size={13} strokeWidth={2} />
                Inspect Archives
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <GoldButton onClick={onClose} large={false}>
              Return to Case Board
            </GoldButton>
          </div>
        </div>
      </div>
    </div>
  );
}
