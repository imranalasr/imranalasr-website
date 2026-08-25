"use client";

import { useEffect, useRef, useState } from "react";
import {
  MARK_ARM_ACCENT_PATHS,
  MARK_ARM_PATHS,
  MARK_BODY_ACCENT_PATHS,
  MARK_BODY_PATHS,
  MARK_PATHS,
} from "./MarkGeometry";

/**
 * The company mark as a solid object you can take hold of.
 *
 * The geometry is the same traced artwork used everywhere else on the site;
 * here it is given thickness. Twenty copies of the silhouette are pushed back
 * along the Z axis inside one perspective scene, so the sides of the
 * letterforms are real geometry — turn the object and the extrusion turns with
 * it. The wall is lit: bright brass at the chamfer, falling to near-black at
 * the back face. The front is cast brass, the two counters that are coloured
 * in the original artwork are deep-green enamel, and a specular band travels
 * across the metal as it moves.
 *
 * It is cast in two pieces, because the artwork already is two pieces: the
 * upright form and the letterform block beneath it. Here they are only ever
 * shown together, finished — the object is whole from the first frame it is
 * on the page and stays whole, whatever the page does. Nothing in the hero
 * assembles, and nothing here is ever taken apart. Erecting the mark piece by
 * piece is the business of the build section further down, where an external
 * crane does it on its own scroll.
 *
 * Three motions compose, each on its own layer so they never fight:
 *
 *   · drag      — pointer or touch; the object spins with the hand, carries
 *                 its momentum, then settles back to its resting attitude;
 *   · follow    — with a fine pointer it leans towards the cursor, damped;
 *   · idle      — a slow float underneath both, so it reads as suspended.
 *
 * Touch drags are horizontal-only (`touch-action: pan-y`), so taking hold of
 * the object never traps the page scroll. Reduced motion stands everything
 * down and simply presents the finished casting.
 *
 * Inline SVG and CSS transforms only: no canvas, no WebGL, no new dependency,
 * and the finished mark is in the HTML before any script runs.
 */

/** Extrusion layers. Enough to read as solid, few enough to stay cheap. */
const DEPTH_LAYERS = 20;
/** Distance between layers, in the scene's own pixels. */
const DEPTH_STEP = 2.2;

/** Lit chamfer → unlit back face. */
const EDGE_FRONT = [0xd8, 0xb5, 0x77];
const EDGE_BACK = [0x06, 0x17, 0x11];

function edgeColour(t: number) {
  /* Most of the fall-off happens in the first few layers, which is what makes
     the near edge read as a chamfer catching the light. */
  const k = Math.pow(t, 0.55);
  const c = EDGE_FRONT.map((v, i) => Math.round(v + (EDGE_BACK[i] - v) * k));
  return `rgb(${c[0]} ${c[1]} ${c[2]})`;
}

/** Resting attitude — enough turn that the extrusion is always visible. */
const BASE = { rx: 9, ry: -18 };
/** How far the cursor alone can push it. */
const RANGE = { rx: 10, ry: 14, tx: 10, ty: 6 };
/** How far a drag can tip it before it stops following. */
const TIP_LIMIT = 46;

export default function Mark3D({
  label,
  hint,
  className,
  idPrefix = "ia-mark3d",
}: {
  label: string;
  hint?: string;
  className?: string;
  idPrefix?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const scene = el.querySelector<HTMLElement>("[data-grab]");
    if (!scene) return;

    const reduced =
      document.documentElement.classList.contains("reduced-motion") ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      el.dataset.motion = "static";
      return;
    }

    const fine = window.matchMedia("(pointer: fine)").matches;
    el.dataset.motion = fine ? "pointer" : "auto";

    /* Cursor lean (fine pointers only). */
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    /* Drag offset, and the momentum it was released with. */
    let dragRy = 0;
    let dragRx = 0;
    let velRy = 0;
    let velRx = 0;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let raf = 0;

    const write = () => {
      const rx = Math.max(-TIP_LIMIT, Math.min(TIP_LIMIT, BASE.rx - cy * RANGE.rx + dragRx));
      const ry = BASE.ry + cx * RANGE.ry + dragRy;
      const s = el.style;
      s.setProperty("--rx", rx.toFixed(2));
      s.setProperty("--ry", ry.toFixed(2));
      s.setProperty("--tx", (cx * RANGE.tx).toFixed(2));
      s.setProperty("--ty", (cy * RANGE.ty).toFixed(2));
      s.setProperty("--px", (cx * 9).toFixed(2));
      /* The highlight tracks the face's own turn, not just the cursor. */
      s.setProperty("--sheen", (0.5 + (ry - BASE.ry) / 90).toFixed(3));
    };

    const settled = () =>
      !dragging &&
      Math.abs(tx - cx) < 0.0004 &&
      Math.abs(ty - cy) < 0.0004 &&
      Math.abs(velRy) < 0.01 &&
      Math.abs(velRx) < 0.01 &&
      Math.abs(dragRy) < 0.05 &&
      Math.abs(dragRx) < 0.05;

    const frame = () => {
      if (!dragging) {
        /* Momentum first, then the object eases back to where it rests. */
        dragRy += velRy;
        dragRx += velRx;
        velRy *= 0.93;
        velRx *= 0.93;
        dragRy *= 0.955;
        dragRx *= 0.955;
        cx += (tx - cx) * 0.055;
        cy += (ty - cy) * 0.055;
      }
      write();
      raf = settled() ? 0 : requestAnimationFrame(frame);
    };

    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      if (dragging) return;
      if (!fine) return;
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
      wake();
    };

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      velRy = 0;
      velRx = 0;
      setTouched(true);
      el.dataset.grabbing = "true";
      scene.setPointerCapture?.(e.pointerId);
      wake();
    };

    const onDrag = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      dragRy += dx * 0.42;
      dragRx = Math.max(-TIP_LIMIT, Math.min(TIP_LIMIT, dragRx - dy * 0.3));
      velRy = dx * 0.42;
      velRx = -dy * 0.3;
      write();
    };

    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      delete el.dataset.grabbing;
      scene.releasePointerCapture?.(e.pointerId);
      wake();
    };

    scene.addEventListener("pointerdown", onDown);
    scene.addEventListener("pointermove", onDrag);
    scene.addEventListener("pointerup", onUp);
    scene.addEventListener("pointercancel", onUp);
    if (fine) window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      scene.removeEventListener("pointerdown", onDown);
      scene.removeEventListener("pointermove", onDrag);
      scene.removeEventListener("pointerup", onUp);
      scene.removeEventListener("pointercancel", onUp);
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const armId = `${idPrefix}-arm`;
  const bodyId = `${idPrefix}-body`;
  const clipId = `${idPrefix}-clip`;
  const faceId = `${idPrefix}-face`;
  const enamelId = `${idPrefix}-enamel`;
  const sheenId = `${idPrefix}-sheen`;
  const brushId = `${idPrefix}-brush`;

  return (
    <div
      ref={root}
      className={`mark3d${className ? ` ${className}` : ""}`}
      data-motion="static"
      data-touched={touched || undefined}
    >
      {/* Geometry declared once; every extrusion layer instances it. */}
      <svg className="mark3d-defs" viewBox="0 0 1 1" aria-hidden="true" focusable="false">
        <defs>
          <g id={armId}>
            {MARK_ARM_PATHS.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
          <g id={bodyId}>
            {MARK_BODY_PATHS.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        </defs>
      </svg>

      <span className="mark3d-glow" aria-hidden="true" />

      {/* Setting-out rings. They lean at a fraction of the object's own turn,
          which is what gives the field its depth. */}
      <svg className="mark3d-orbit" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
        <ellipse cx="200" cy="200" rx="188" ry="188" />
        <ellipse cx="200" cy="200" rx="188" ry="62" />
        <ellipse cx="200" cy="200" rx="132" ry="132" className="mark3d-orbit-inner" />
      </svg>

      <div className="mark3d-scene" data-grab="">
        <div className="mark3d-body">
          <div className="mark3d-tilt">
            <div className="mark3d-object">
              {/* Extrusion — the same silhouette stepped back on Z. */}
              {Array.from({ length: DEPTH_LAYERS }, (_, i) => {
                const t = i / (DEPTH_LAYERS - 1);
                return (
                  <svg
                    key={i}
                    className="mark3d-layer"
                    viewBox="-24 58 500 784"
                    aria-hidden="true"
                    focusable="false"
                    style={{ transform: `translateZ(${-(i + 1) * DEPTH_STEP}px)`, fill: edgeColour(t) }}
                  >
                    <use className="mark3d-p-arm" href={`#${armId}`} />
                    <use className="mark3d-p-body" href={`#${bodyId}`} />
                  </svg>
                );
              })}

              {/* Face — cast brass, green enamel counters, one travelling band. */}
              <svg className="mark3d-face" viewBox="-24 58 500 784" role="img" aria-label={label}>
                <defs>
                  <linearGradient id={faceId} x1="0" y1="0" x2="0.85" y2="1">
                    <stop offset="0" stopColor="#f6e4c2" />
                    <stop offset="0.22" stopColor="#dcbb80" />
                    <stop offset="0.5" stopColor="#b88a44" />
                    <stop offset="0.76" stopColor="#845f26" />
                    <stop offset="1" stopColor="#cba15a" />
                  </linearGradient>
                  <linearGradient id={enamelId} x1="0" y1="0" x2="0.4" y2="1">
                    <stop offset="0" stopColor="#1b5a45" />
                    <stop offset="1" stopColor="#061711" />
                  </linearGradient>
                  <linearGradient id={sheenId} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#fff" stopOpacity="0" />
                    <stop offset="0.42" stopColor="#fff" stopOpacity="0.5" />
                    <stop offset="0.56" stopColor="#fff" stopOpacity="0.78" />
                    <stop offset="0.7" stopColor="#fff" stopOpacity="0.32" />
                    <stop offset="1" stopColor="#fff" stopOpacity="0" />
                  </linearGradient>
                  <pattern id={brushId} width="5" height="5" patternUnits="userSpaceOnUse">
                    <rect width="5" height="5" fill="none" />
                    <line x1="0" y1="0" x2="0" y2="5" stroke="#000" strokeOpacity="0.1" strokeWidth="1.4" />
                    <line x1="2.6" y1="0" x2="2.6" y2="5" stroke="#fff" strokeOpacity="0.1" strokeWidth="1" />
                  </pattern>
                  <clipPath id={clipId}>
                    {MARK_PATHS.map((d, i) => (
                      <path key={i} d={d} />
                    ))}
                  </clipPath>
                </defs>

                {/* The crane arm … */}
                <g className="mark3d-p-arm">
                  <use href={`#${armId}`} fill={`url(#${faceId})`} />
                  <g fill={`url(#${enamelId})`}>
                    {MARK_ARM_ACCENT_PATHS.map((d, i) => (
                      <path key={i} d={d} />
                    ))}
                  </g>
                  <use href={`#${armId}`} fill="none" stroke="#fbeed3" strokeOpacity="0.5" strokeWidth="1.1" />
                </g>
                {/* … and the letterform block it stands over. */}
                <g className="mark3d-p-body">
                  <use href={`#${bodyId}`} fill={`url(#${faceId})`} />
                  <g fill={`url(#${enamelId})`}>
                    {MARK_BODY_ACCENT_PATHS.map((d, i) => (
                      <path key={i} d={d} />
                    ))}
                  </g>
                  <use href={`#${bodyId}`} fill="none" stroke="#fbeed3" strokeOpacity="0.5" strokeWidth="1.1" />
                </g>
                {/* Brushed grain, then the specular band — both held inside the mark. */}
                <g clipPath={`url(#${clipId})`}>
                  <rect x="-24" y="58" width="500" height="784" fill={`url(#${brushId})`} />
                  <rect className="mark3d-sheen" x="-360" y="0" width="360" height="900" fill={`url(#${sheenId})`} />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <span className="mark3d-shadow" aria-hidden="true" />

      {hint ? (
        <span className="mark3d-hint" aria-hidden="true">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
