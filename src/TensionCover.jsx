import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";

const CoverCanvas = lazy(() => import("./TensionCoverCanvas"));

const HOLD_DURATION = 1180;
const OPEN_DURATION = 1480;

function prefersFallback() {
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const coarseMobile = window.matchMedia?.("(max-width: 720px) and (pointer: coarse)")?.matches;
  const limitedCpu = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
  const limitedMemory = navigator.deviceMemory && navigator.deviceMemory <= 4;
  return Boolean(reduced || (coarseMobile && (limitedCpu || limitedMemory)));
}

export function TensionCover({ onComplete, language = "zh" }) {
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 720px)").matches);
  const [fallback] = useState(prefersFallback);
  const [opening, setOpening] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const holdRef = useRef(0);
  const openRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  const holdFrame = useRef(0);
  const openFrame = useRef(0);
  const progressLine = useRef(null);
  const holding = useRef(false);
  const completed = useRef(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 720px)");
    const onChange = (event) => setMobile(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => () => {
    cancelAnimationFrame(holdFrame.current);
    cancelAnimationFrame(openFrame.current);
  }, []);

  const setProgressVisual = useCallback((value) => {
    if (progressLine.current) progressLine.current.style.transform = `scaleX(${Math.max(0, Math.min(1, value))})`;
  }, []);

  const open = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    setOpening(true);
    const started = performance.now();
    const animate = (now) => {
      const raw = Math.min(1, (now - started) / (fallback ? 620 : OPEN_DURATION));
      const eased = 1 - Math.pow(1 - raw, 3);
      openRef.current = eased;
      if (raw > 0.62) setLeaving(true);
      if (raw < 1) openFrame.current = requestAnimationFrame(animate);
      else onComplete();
    };
    openFrame.current = requestAnimationFrame(animate);
  }, [fallback, onComplete]);

  const startHold = useCallback(() => {
    if (completed.current || holding.current) return;
    holding.current = true;
    const startValue = holdRef.current;
    const started = performance.now();
    const animate = (now) => {
      if (!holding.current) return;
      const raw = Math.min(1, (now - started) / (HOLD_DURATION * (1 - startValue)));
      holdRef.current = startValue + (1 - startValue) * raw;
      setProgressVisual(holdRef.current);
      if (raw < 1) holdFrame.current = requestAnimationFrame(animate);
      else open();
    };
    holdFrame.current = requestAnimationFrame(animate);
  }, [open, setProgressVisual]);

  const releaseHold = useCallback(() => {
    if (completed.current) return;
    holding.current = false;
    cancelAnimationFrame(holdFrame.current);
    const startValue = holdRef.current;
    const started = performance.now();
    const animateBack = (now) => {
      if (holding.current || completed.current) return;
      const raw = Math.min(1, (now - started) / 360);
      holdRef.current = startValue * (1 - (1 - Math.pow(1 - raw, 3)));
      setProgressVisual(holdRef.current);
      if (raw < 1) holdFrame.current = requestAnimationFrame(animateBack);
    };
    holdFrame.current = requestAnimationFrame(animateBack);
  }, [setProgressVisual]);

  const onPointerMove = useCallback((event) => {
    pointerRef.current.x = (event.clientX / window.innerWidth - 0.5) * 2;
    pointerRef.current.y = -(event.clientY / window.innerHeight - 0.5) * 2;
  }, []);

  return (
    <section
      className={`tension-cover ${fallback ? "is-fallback" : "is-webgl"} ${canvasReady ? "is-canvas-ready" : ""} ${opening ? "is-opening" : ""} ${leaving ? "is-leaving" : ""}`}
      onPointerMove={onPointerMove}
      aria-label="JEM portfolio entrance"
    >
      <picture className="tension-cover-picture">
        <source media="(max-width: 720px)" srcSet="/assets/tension/tension-cover-mobile.png" />
        <img src="/assets/tension/tension-cover-desktop.png" alt="JEM letters pressed into a stretched monochrome fabric membrane" />
      </picture>
      {!fallback && <Suspense fallback={null}><CoverCanvas mobile={mobile} holdRef={holdRef} openRef={openRef} pointerRef={pointerRef} onReady={() => setCanvasReady(true)} /></Suspense>}
      <span className="tension-cover-meta" aria-hidden="true">PORTFOLIO / 2026</span>
      <button
        className="tension-enter-hit"
        type="button"
        onPointerDown={(event) => { event.currentTarget.setPointerCapture?.(event.pointerId); startHold(); }}
        onPointerUp={releaseHold}
        onPointerCancel={releaseHold}
        onPointerLeave={releaseHold}
        onClick={open}
        onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); startHold(); } }}
        onKeyUp={(event) => { if (event.key === "Enter" || event.key === " ") releaseHold(); }}
        aria-label="Click or hold to enter the JEM portfolio"
      >
        <span className="sr-only">Click or hold to enter</span>
        <i aria-hidden="true"><b ref={progressLine} /></i>
      </button>
      <p className="tension-hold-hint" aria-hidden="true">PRESS + HOLD</p>
    </section>
  );
}
