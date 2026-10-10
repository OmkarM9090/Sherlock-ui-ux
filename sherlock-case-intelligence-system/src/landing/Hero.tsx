import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "../hooks";
import { GoldButton } from "../ui";

gsap.registerPlugin(ScrollTrigger);

const INTRO_FRAMES = 10;
const snapToIntroFrame = ScrollTrigger.snapDirectional(1 / (INTRO_FRAMES - 1));
const DESK_VIDEO = "./film/intro-desk.mp4";
const PAPER_VIDEO = "./film/intro-paper.mp4";
const DESK_POSTER = "./film/desk-poster.webp";
const PAPER_POSTER = "./film/paper-poster.webp";

export default function Hero({ onEnter }: { onEnter: () => void }) {
  const root = useRef<HTMLElement | null>(null);
  const stage = useRef<HTMLDivElement | null>(null);
  const deskRef = useRef<HTMLVideoElement | null>(null);
  const paperRef = useRef<HTMLVideoElement | null>(null);
  const lensCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lensActiveRef = useRef(false);
  const reduced = useReducedMotion();

  /*
   * The opening reel is intentionally driven by native scrolling.  GSAP only
   * scrubs the two short, muted films and choreographs the paper/lens/copy;
   * the browser remains in charge of scrolling throughout.
   */
  useEffect(() => {
    const section = root.current;
    const desk = deskRef.current;
    const paper = paperRef.current;
    if (!section) return;

    const context = gsap.context(() => {
      const q = gsap.utils.selector(section);
      const metadata = q("[data-intro='metadata']");
      const metadataLines = q("[data-intro='metadata'] > span");
      const whisper = q("[data-intro='whisper']");
      const trace = q("[data-intro='trace']");
      const deduction = q("[data-intro='deduction']");
      const stamp = q("[data-intro='stamp']");
      const deskLayer = q("[data-film='desk']");
      const paperLayer = q("[data-film='paper']");
      const lamp = q("[data-intro='lamp']");
      const lens = q("[data-intro='lens']");
      const hero = q("[data-intro='hero']");
      const progressLine = section.querySelector<HTMLElement>(".cinematic-progress__fill");
      const frameReadout = section.querySelector<HTMLElement>("[data-intro-frame]");
      const paperPlayhead = { time: 0 };
      let built = false;
      let lastFrame = 0;
      let lastPaperSeekAt = 0;

      const syncPaperFrame = () => {
        if (!paper || paper.readyState < 2 || paper.seeking || !Number.isFinite(paper.duration)) return;
        const now = performance.now();
        if (now - lastPaperSeekAt < 36) return;
        const targetTime = Math.max(0, Math.min(paper.duration - 0.03, paperPlayhead.time));
        if (Math.abs(paper.currentTime - targetTime) > 0.035) {
          lastPaperSeekAt = now;
          paper.currentTime = targetTime;
        }
      };
      const drawLensDetail = () => {
        if (!lensActiveRef.current) return;
        const canvas = lensCanvasRef.current;
        const source = paper && paper.readyState >= 2 ? paper : desk && desk.readyState >= 2 ? desk : null;
        if (!canvas || !source || source.seeking || !source.videoWidth || !source.videoHeight) return;
        const context = canvas.getContext("2d");
        if (!context) return;
        const crop = Math.min(source.videoWidth, source.videoHeight) * 0.34;
        const centerX = source.videoWidth * 0.64;
        const centerY = source.videoHeight * 0.48;
        const sourceX = Math.max(0, Math.min(source.videoWidth - crop, centerX - crop / 2));
        const sourceY = Math.max(0, Math.min(source.videoHeight - crop, centerY - crop / 2));
        try {
          context.drawImage(source, sourceX, sourceY, crop, crop, 0, 0, canvas.width, canvas.height);
        } catch {
          // A frame can still be in flight when the scroll scrub requests a seek.
        }
      };

      if (reduced) {
        lensActiveRef.current = false;
        gsap.set(deskLayer, { autoAlpha: 1 });
        gsap.set(paperLayer, { autoAlpha: 0 });
        gsap.set(metadata, { autoAlpha: 1 });
        gsap.set(metadataLines, { autoAlpha: 1, y: 0 });
        gsap.set(whisper, { autoAlpha: 0 });
        gsap.set(trace, { autoAlpha: 0 });
        gsap.set(deduction, { autoAlpha: 0 });
        gsap.set(stamp, { autoAlpha: 0 });
        gsap.set(lamp, { autoAlpha: 0.45, scale: 1 });
        gsap.set(lens, { autoAlpha: 0 });
        gsap.set(hero, { autoAlpha: 1, y: 0 });
        gsap.set(q("[data-hero-word]"), {
          autoAlpha: 1,
          y: 0,
          clipPath: "inset(0% 0% -10% 0%)",
        });
        gsap.set(q("[data-hero-subtitle], [data-hero-cta]"), {
          autoAlpha: 1,
          y: 0,
        });
        return;
      }

      gsap.set(metadata, { autoAlpha: 1, y: 0 });
      gsap.set(metadataLines, { autoAlpha: 0, y: 7 });
      gsap.set(whisper, { autoAlpha: 0, y: 15, filter: "blur(5px)" });
      gsap.set(trace, { autoAlpha: 0, y: 15, filter: "blur(5px)" });
      gsap.set(deduction, { autoAlpha: 0, y: 14, filter: "blur(4px)" });
      gsap.set(stamp, { autoAlpha: 0, y: -8, scale: 1.16, rotation: 8, transformOrigin: "50% 50%" });
      gsap.set(lamp, { autoAlpha: 0, scale: 0.72, transformOrigin: "26% 37%" });
      gsap.set(paperLayer, {
        autoAlpha: 0,
        scale: 0.86,
        rotationX: 7,
        rotationY: -7,
        transformOrigin: "50% 54%",
        clipPath: "inset(17% 13% 16% 13%)",
      });
      gsap.set(lens, {
        autoAlpha: 0,
        xPercent: -50,
        yPercent: -50,
        x: () => -window.innerWidth * 0.18,
        y: () => -window.innerHeight * 0.14,
        scale: 0.56,
        rotation: -18,
      });
      gsap.set(hero, { autoAlpha: 0, y: 14, pointerEvents: "none" });
      gsap.set(q("[data-hero-word]"), {
        autoAlpha: 0,
        y: 36,
        clipPath: "inset(100% 0% 0% 0%)",
      });
      gsap.set(q("[data-hero-subtitle], [data-hero-cta]"), {
        autoAlpha: 0,
        y: 17,
      });
      gsap.set(q(".cinematic-blackout"), { autoAlpha: 1 });
      gsap.set(q(".cinematic-scroll-cue"), { autoAlpha: 1 });

      const buildTimeline = () => {
        if (built) return;
        built = true;

        const deskDuration = desk && Number.isFinite(desk.duration) ? desk.duration : 0;
        const paperDuration = paper && Number.isFinite(paper.duration)
          ? paper.duration
          : Number(paper?.dataset.duration) || 0;
        const tl = gsap.timeline({
          defaults: { ease: "power2.out" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.45,
            snap: {
              snapTo: (value, self) => snapToIntroFrame(value, self?.direction ?? 0),
              delay: 0.08,
              duration: { min: 0.18, max: 0.46 },
              ease: "power1.inOut",
              inertia: false,
            },
            pin: false,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              // Autoplay gives the opening a living first frame; the first
              // deliberate scroll takes over and becomes fully reversible.
              if (self.progress > 0.002) {
                desk?.pause();
                paper?.pause();
              }
              const lensInShot = self.progress >= 0.5 && self.progress <= 0.86;
              if (lensInShot && !lensActiveRef.current) {
                lensActiveRef.current = true;
                drawLensDetail();
              } else if (!lensInShot) {
                lensActiveRef.current = false;
              }
              const frame = Math.min(INTRO_FRAMES, Math.floor(self.progress * (INTRO_FRAMES - 1)) + 1);
              if (frame !== lastFrame) {
                lastFrame = frame;
                section.dataset.frame = String(frame);
                if (frameReadout) frameReadout.textContent = String(frame).padStart(2, "0");
              }
              if (progressLine) {
                progressLine.style.transform = `scaleX(${self.progress})`;
              }
            },
          },
        });

        if (desk && deskDuration > 0) {
          tl.to(desk, { currentTime: deskDuration, duration: 4.55, ease: "none" }, 0);
        }
        if (paper && paperDuration > 0) {
          tl.to(
            paperPlayhead,
            { time: paperDuration, duration: 6.35, ease: "none", onUpdate: syncPaperFrame },
            3.3
          );
        }

        // The first card is pure black. A small gas-lamp bloom reveals the desk.
        tl.to(
          metadataLines,
          { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.3, ease: "power2.out" },
          0.12
        )
          .to(q(".cinematic-blackout"), { autoAlpha: 0.36, duration: 0.8 }, 0.18)
          .to(lamp, { autoAlpha: 0.88, scale: 1, duration: 1.15, ease: "power2.out" }, 0.38)
          .to(metadata, { autoAlpha: 0, y: -4, duration: 0.34 }, 1.65)
          .fromTo(
            whisper,
            { autoAlpha: 0, y: 15, filter: "blur(5px)" },
            { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.7, ease: "power3.out" },
            2.02
          )
          .to(whisper, { autoAlpha: 0, y: -9, duration: 0.42 }, 3.1)
          // A real paper reel takes over the desk footage; the crop opens like a
          // sheet lifting from the table rather than a hard cut between clips.
          .to(deskLayer, { autoAlpha: 0.18, duration: 0.9 }, 3.25)
          .to(paperLayer, { autoAlpha: 1, duration: 0.88 }, 3.28)
          .to(
            paperLayer,
            {
              scale: 1.02,
              rotationX: 0,
              rotationY: 0,
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 1.12,
              ease: "power2.inOut",
            },
            3.34
          )
          .fromTo(
            trace,
            { autoAlpha: 0, y: 15, filter: "blur(5px)" },
            { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.72, ease: "power3.out" },
            4.55
          )
          .to(trace, { autoAlpha: 0, y: -8, duration: 0.42 }, 5.92)
          // A restrained redacted-file stamp punctuates the paper evidence.
          .fromTo(
            stamp,
            { autoAlpha: 0, y: -8, scale: 1.16, rotation: 8 },
            { autoAlpha: 0.82, y: 0, scale: 1, rotation: -5, duration: 0.28, ease: "back.out(1.5)" },
            5.28
          )
          .to(stamp, { autoAlpha: 0, y: -3, duration: 0.22 }, 6.38)
          .fromTo(
            deduction,
            { autoAlpha: 0, y: 14, filter: "blur(4px)" },
            { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.5, ease: "power3.out" },
            6.0
          )
          .to(deduction, { autoAlpha: 0, y: -8, duration: 0.22 }, 6.61)
          // A brass magnifier enters over the paper, studies its fingerprint,
          // then grows into the clean headline reveal.
          .to(lens, { autoAlpha: 0.96, duration: 0.2 }, 5.05)
          .to(
            lens,
            {
              x: () => window.innerWidth * 0.16,
              y: () => -window.innerHeight * 0.07,
              scale: 0.84,
              rotation: -4,
              duration: 1.2,
              ease: "power2.inOut",
            },
            5.25
          )
          .to(
            lens,
            { x: 0, y: 0, scale: 1, rotation: 0, duration: 0.55, ease: "power2.inOut" },
            6.78
          )
          .to(
            lens,
            {
              x: () => window.innerWidth * 0.08,
              y: () => -window.innerHeight * 0.08,
              scale: 4.8,
              autoAlpha: 0,
              duration: 0.82,
              ease: "power3.in",
            },
            7.55
          )
          .set(hero, { pointerEvents: "auto" }, 8.4)
          .to(hero, { autoAlpha: 1, y: 0, duration: 0.55, ease: "power3.out" }, 8.4)
          .fromTo(
            q("[data-hero-word]"),
            { autoAlpha: 0, y: 36, clipPath: "inset(100% 0% 0% 0%)" },
            {
              autoAlpha: 1,
              y: 0,
              clipPath: "inset(0% 0% -10% 0%)",
              duration: 0.68,
              stagger: 0.18,
              ease: "expo.out",
            },
            8.48
          )
          .fromTo(
            q("[data-hero-subtitle]"),
            { autoAlpha: 0, y: 17 },
            { autoAlpha: 1, y: 0, duration: 0.32 },
            9.36
          )
          .fromTo(
            q("[data-hero-cta]"),
            { autoAlpha: 0, y: 17 },
            { autoAlpha: 1, y: 0, duration: 0.28 },
            9.7
          )
          .to(paperLayer, { autoAlpha: 0, duration: 1.05 }, 8.32)
          .to(deskLayer, { autoAlpha: 0.1, duration: 0.85 }, 8.38)
          .to(lamp, { autoAlpha: 0.26, duration: 1.15 }, 8.45)
          .to(q(".cinematic-scroll-cue"), { autoAlpha: 0, duration: 0.28 }, 7.2)
          .to({}, { duration: 0.35 }, 9.65);

        ScrollTrigger.refresh();
      };

      const tryBuild = () => {
        const deskReady = !desk || desk.readyState >= 1 || !!desk.error;
        if (deskReady) buildTimeline();
      };
      const flagDeskFailure = () => {
        section.dataset.filmFallback = "desk";
        tryBuild();
      };
      const flagPaperFailure = () => {
        section.dataset.filmFallback = "paper";
        tryBuild();
      };
      const onPaperMetadata = () => {
        tryBuild();
        syncPaperFrame();
        drawLensDetail();
      };
      const requestPaper = () => {
        if (!paper || paper.dataset.requested || !paper.dataset.src) return;
        const start = section.getBoundingClientRect().top + window.scrollY;
        const travel = Math.max(1, section.offsetHeight - window.innerHeight);
        if ((window.scrollY - start) / travel < 0.18) return;
        paper.dataset.requested = "true";
        paper.src = paper.dataset.src;
        paper.load();
      };

      desk?.addEventListener("loadedmetadata", tryBuild);
      paper?.addEventListener("loadedmetadata", onPaperMetadata);
      paper?.addEventListener("loadeddata", syncPaperFrame);
      paper?.addEventListener("loadeddata", drawLensDetail);
      paper?.addEventListener("seeked", drawLensDetail);
      desk?.addEventListener("loadeddata", drawLensDetail);
      desk?.addEventListener("seeked", drawLensDetail);
      desk?.addEventListener("error", flagDeskFailure);
      paper?.addEventListener("error", flagPaperFailure);
      window.addEventListener("scroll", requestPaper, { passive: true });
      window.addEventListener("resize", requestPaper, { passive: true });
      tryBuild();
      requestPaper();

      return () => {
        desk?.removeEventListener("loadedmetadata", tryBuild);
        paper?.removeEventListener("loadedmetadata", onPaperMetadata);
        paper?.removeEventListener("loadeddata", syncPaperFrame);
        paper?.removeEventListener("loadeddata", drawLensDetail);
        paper?.removeEventListener("seeked", drawLensDetail);
        desk?.removeEventListener("loadeddata", drawLensDetail);
        desk?.removeEventListener("seeked", drawLensDetail);
        lensActiveRef.current = false;
        desk?.removeEventListener("error", flagDeskFailure);
        paper?.removeEventListener("error", flagPaperFailure);
        window.removeEventListener("scroll", requestPaper);
        window.removeEventListener("resize", requestPaper);
      };
    }, section);

    return () => context.revert();
  }, [reduced]);

  /* Restrained pointer parallax. It idles when the reel leaves the viewport. */
  useEffect(() => {
    if (reduced || !stage.current) return;
    const el = stage.current;
    const current = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let raf = 0;
    let visible = false;

    const tick = () => {
      raf = 0;
      if (!visible) return;
      current.x += (target.x - current.x) * 0.14;
      current.y += (target.y - current.y) * 0.14;
      el.style.setProperty("--cam-x", `${current.x.toFixed(2)}px`);
      el.style.setProperty("--cam-y", `${current.y.toFixed(2)}px`);
      if (Math.abs(target.x - current.x) > 0.02 || Math.abs(target.y - current.y) > 0.02) {
        raf = requestAnimationFrame(tick);
      }
    };
    const schedule = () => {
      if (visible && !raf) raf = requestAnimationFrame(tick);
    };
    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      target.x = ((event.clientX - rect.left) / rect.width - 0.5) * 7;
      target.y = ((event.clientY - rect.top) / rect.height - 0.5) * 5;
      schedule();
    };
    const onLeave = () => {
      target.x = 0;
      target.y = 0;
      schedule();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });

    observer.observe(el);
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.style.removeProperty("--cam-x");
      el.style.removeProperty("--cam-y");
    };
  }, [reduced]);

  const skipOpening = () => {
    const section = root.current;
    if (!section) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    const destination = top + section.offsetHeight - window.innerHeight;
    window.scrollTo({ top: Math.max(0, destination), behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <section
      ref={root}
      id="top"
      className={`cinematic-intro relative bg-bg ${reduced ? "cinematic-intro--reduced" : "h-[500vh]"}`}
      aria-label="The case file reveal — a ten-frame investigation"
    >
      <div
        ref={stage}
        className={`cinematic-stage grain relative isolate overflow-hidden bg-bg ${
          reduced ? "cinematic-stage--reduced" : "sticky top-0 h-screen h-[100svh]"
        }`}
      >
        <div className="cinematic-footage" aria-hidden="true">
          <div className="cinematic-film cinematic-film--desk" data-film="desk">
            <img className="cinematic-poster" src={DESK_POSTER} alt="" />
            {!reduced && (
              <video
                ref={deskRef}
                src={DESK_VIDEO}
                poster={DESK_POSTER}
                muted
                autoPlay
                playsInline
                preload="auto"
                aria-hidden="true"
              />
            )}
          </div>
          <div className="cinematic-film cinematic-film--paper" data-film="paper">
            <img className="cinematic-poster" src={PAPER_POSTER} alt="" />
            {!reduced && (
              <video
                ref={paperRef}
                data-src={PAPER_VIDEO}
                data-duration="20"
                poster={PAPER_POSTER}
                muted
                playsInline
                preload="none"
                aria-hidden="true"
              />
            )}
          </div>
        </div>

        <div className="cinematic-blackout" aria-hidden="true" />
        <div className="cinematic-lamp" data-intro="lamp" aria-hidden="true" />
        <div className="cinematic-vignette" aria-hidden="true" />
        <div className="cinematic-scanline" aria-hidden="true" />
        <div className="cinematic-frame" aria-hidden="true" />

        {/* Location / date card: the first quiet beat of the investigation. */}
        <div className="intro-metadata" data-intro="metadata" aria-label="London, 221B Baker Street, 1897">
          <span>LONDON</span>
          <span>221B BAKER STREET</span>
          <span>1897</span>
        </div>

        <p className="intro-caption intro-caption--whisper" data-intro="whisper">
          Every case begins with a whisper.
        </p>
        <p className="intro-caption intro-caption--trace" data-intro="trace">
          Every clue leaves a trace.
        </p>
        <p className="intro-caption intro-caption--deduction" data-intro="deduction">
          No detail is too small to change everything.
        </p>
        <aside className="intro-case-stamp" data-intro="stamp" aria-hidden="true">
          <span>OBSERVATION</span>
          <strong>NO. 03</strong>
          <span>INK PRESSURE // MATCH</span>
        </aside>

        {/* A restrained brass rim echoes the lens already moving through the film. */}
        <div className="cinematic-lens" data-intro="lens" aria-hidden="true">
          <div className="cinematic-lens__glass">
            <canvas
              ref={lensCanvasRef}
              width={320}
              height={320}
              className="cinematic-lens__detail"
              aria-hidden="true"
            />
          </div>
          <span className="cinematic-lens__handle" />
        </div>

        {/* The landing hero is revealed inside the same shot, not on a new page. */}
        <div className="intro-hero-copy" data-intro="hero">
          <div className="mb-7 flex items-center justify-center gap-3">
            <span className="pulse-dot h-[6px] w-[6px] rounded-full bg-gold" />
            <span className="font-mono text-[10px] tracking-[3.5px] text-mute sm:text-[11px]">
              CLASSIFIED&nbsp;&nbsp;//&nbsp;&nbsp;INVESTIGATION ACTIVE
            </span>
          </div>
          <h1 className="intro-hero-title" aria-label="The game is afoot">
            <span data-hero-word>THE GAME</span>
            <span data-hero-word>
              IS AFOOT<span className="text-gold">.</span>
            </span>
          </h1>
          <p data-hero-subtitle className="intro-hero-subtitle">
            An intelligent investigation workspace for discovering evidence,
            connecting clues and uncovering the truth.
          </p>
          <div data-hero-cta className="mt-8">
            <GoldButton onClick={onEnter} large magnetic>
              Enter the Case
            </GoldButton>
          </div>
        </div>

        <div className="intro-utility intro-utility--left">
          <span>REEL 01</span>
          <span className="intro-utility__divider" />
          <span>THE CASE FILE REVEAL</span>
        </div>
        <div className="intro-frame-readout" aria-hidden="true">
          FRAME <span data-intro-frame>01</span> / {INTRO_FRAMES}
        </div>
        <button type="button" className="intro-skip" onClick={skipOpening}>
          SKIP OPENING <span aria-hidden="true">↗</span>
        </button>
        <div className="cinematic-scroll-cue">
          <span className="cinematic-scroll-cue__line" />
          <span>10 FRAMES // SCROLL TO OPEN THE FILE</span>
        </div>
        <div className="cinematic-progress" aria-hidden="true">
          <span className="cinematic-progress__fill" />
          <span className="cinematic-progress__ticks">
            {Array.from({ length: INTRO_FRAMES - 2 }, (_, index) => (
              <i key={index} style={{ left: `${((index + 1) / (INTRO_FRAMES - 1)) * 100}%` }} />
            ))}
          </span>
        </div>
      </div>
    </section>
  );
}
