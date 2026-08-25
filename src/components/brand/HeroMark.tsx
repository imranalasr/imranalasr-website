import type { ReactNode } from "react";
import { MARK_ACCENT_PATHS, MARK_PATHS } from "./MarkGeometry";

/**
 * The company mark, presented as issued.
 *
 * The hero's job is to state the brand, not to demonstrate it. So there is no
 * object here to take hold of and no sequence to wait out: the finished mark
 * is on the page, whole and still, in the first frame — and it stays that way.
 * Erecting it piece by piece is the business of the build section further down,
 * where a crane does it on its own scroll.
 *
 * What depth there is, is cast rather than simulated. The silhouette is
 * stepped down and to the right a few times underneath the face, darkening as
 * it goes, which is what a moulded plate does when it is lit from the upper
 * left — a real bevel, drawn into the artwork, rather than a perspective scene
 * that has to be held together at runtime. Over it: one brass ramp laid across
 * the whole mark so it reads as a single casting, deep-green enamel in the two
 * counters that are coloured in the original artwork, a hairline catching the
 * top edge, brushed grain, and one fixed highlight. Nothing moves.
 *
 * Around it, the sheet it is set out on: a centre axis, datum rules at head
 * and base, corner registration ticks, and the line it stands on with its own
 * ground shadow. Drawing conventions, not decoration — the mark reads as an
 * elevation of a built thing, which is what the caption beneath it says.
 *
 * Server-rendered SVG throughout. No client component, no script, no state:
 * the finished logo is in the HTML before anything runs, and there is nothing
 * for reduced motion to stand down.
 */

/* ── The sheet ───────────────────────────────────────────────────────── */
const VIEW_W = 360;
const VIEW_H = 620;
const CENTRE = VIEW_W / 2;

/* ── The mark on it ──────────────────────────────────────────────────── */
/** The silhouette runs y 82..818 — 736 tall — and x 188..452. */
const MARK_H = 500;
const MARK_S = MARK_H / 736;
/** The line the mark stands on. */
const BASELINE = 552;
/** Its own visual centre; the 1.25-unit trace sliver at x0 is not part of it,
    and falls outside the frame, which is where it belongs. */
const MARK_MID_X = 320;
const MARK_TX = CENTRE - MARK_S * MARK_MID_X;
const MARK_TY = BASELINE - MARK_S * 818;
const MARK_TOP = MARK_TY + MARK_S * 82;
const MARK_HALF_W = (MARK_S * 264) / 2;

/** The notional frame the sheet is set out within. */
const FRAME = { x0: 26, x1: VIEW_W - 26, y0: 26, y1: VIEW_H - 26 };
const TICK = 16;

/**
 * The cast bevel: the silhouette stepped down and to the right underneath the
 * face, darkening with depth. Few enough layers to stay cheap, close enough
 * together to read as one moulded edge rather than a stack.
 */
const BEVEL_LAYERS = 7;
/** Mark units per step. Kept shallow on purpose: enough for the moulding to
    catch the light, not so much that the mark reads as an object in a scene
    rather than a plate on a wall. */
const BEVEL_STEP = 1.9;
/** Deepest in the mould → the lit face it meets. */
const BEVEL_DEEP = [0x2c, 0x1f, 0x0d];
const BEVEL_NEAR = [0x8a, 0x64, 0x28];

/** t: 0 at the deepest layer, 1 at the one under the face. */
function bevelColour(t: number) {
  const c = BEVEL_DEEP.map((v, i) => Math.round(v + (BEVEL_NEAR[i] - v) * Math.pow(t, 0.7)));
  return `rgb(${c[0]} ${c[1]} ${c[2]})`;
}

export default function HeroMark({
  label,
  className,
  idPrefix = "ia-heromark",
}: {
  label: string;
  className?: string;
  idPrefix?: string;
}): ReactNode {
  const faceId = `${idPrefix}-face`;
  const enamelId = `${idPrefix}-enamel`;
  const sheenId = `${idPrefix}-sheen`;
  const brushId = `${idPrefix}-brush`;
  const glowId = `${idPrefix}-glow`;
  const shadowId = `${idPrefix}-shadow`;
  const clipId = `${idPrefix}-clip`;

  return (
    <div className={`heromark${className ? ` ${className}` : ""}`}>
      <svg
        className="heromark-svg"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label={label}
      >
        <defs>
          {/* One casting, one light: the ramp is laid across the mark's own
              box rather than each path's, so every letterform belongs to the
              same lit surface. */}
          <linearGradient id={faceId} gradientUnits="userSpaceOnUse" x1="188" y1="82" x2="412" y2="818">
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
          {/* A single raking highlight, fixed. It falls where the light would
              come from — upper left — and it does not travel. */}
          <linearGradient id={sheenId} gradientUnits="userSpaceOnUse" x1="150" y1="60" x2="470" y2="760">
            <stop offset="0.26" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.4" stopColor="#fff" stopOpacity="0.26" />
            <stop offset="0.47" stopColor="#fff" stopOpacity="0.1" />
            <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <pattern id={brushId} width="5" height="5" patternUnits="userSpaceOnUse">
            <rect width="5" height="5" fill="none" />
            <line x1="0" y1="0" x2="0" y2="5" stroke="#000" strokeOpacity="0.09" strokeWidth="1.4" />
            <line x1="2.6" y1="0" x2="2.6" y2="5" stroke="#fff" strokeOpacity="0.09" strokeWidth="1" />
          </pattern>
          <radialGradient id={glowId} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#b88a44" stopOpacity="0.3" />
            <stop offset="0.55" stopColor="#1b5a45" stopOpacity="0.17" />
            <stop offset="1" stopColor="#1b5a45" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={shadowId} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#000" stopOpacity="0.55" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <clipPath id={clipId}>
            {MARK_PATHS.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </clipPath>
        </defs>

        {/* ── the light behind it ── */}
        <ellipse
          cx={CENTRE}
          cy={(MARK_TOP + BASELINE) / 2}
          rx={VIEW_W * 0.52}
          ry={(BASELINE - MARK_TOP) * 0.62}
          fill={`url(#${glowId})`}
        />

        {/* ── the sheet it is set out on ── */}
        <g className="heromark-sheet" aria-hidden="true">
          {/* the setting-out axis, hidden behind the mark it centres */}
          <line className="heromark-axis" x1={CENTRE} y1={FRAME.y0} x2={CENTRE} y2={FRAME.y1} />

          {/* datum rules at head and base, kept out in the margins */}
          {[MARK_TOP, BASELINE].map((y) => (
            <g key={y} className="heromark-datum">
              <line x1={FRAME.x0} y1={y} x2={CENTRE - MARK_HALF_W - 16} y2={y} />
              <line x1={CENTRE + MARK_HALF_W + 16} y1={y} x2={FRAME.x1} y2={y} />
            </g>
          ))}

          {/* corner registration ticks */}
          <g className="heromark-reg">
            {[
              [FRAME.x0, FRAME.y0, 1, 1],
              [FRAME.x1, FRAME.y0, -1, 1],
              [FRAME.x0, FRAME.y1, 1, -1],
              [FRAME.x1, FRAME.y1, -1, -1],
            ].map(([x, y, sx, sy]) => (
              <g key={`${x}-${y}`}>
                <line x1={x} y1={y} x2={x + sx * TICK} y2={y} />
                <line x1={x} y1={y} x2={x} y2={y + sy * TICK} />
              </g>
            ))}
          </g>
        </g>

        {/* ── the ground it stands on ── */}
        <ellipse
          cx={CENTRE}
          cy={BASELINE + 9}
          rx={MARK_HALF_W + 34}
          ry="13"
          fill={`url(#${shadowId})`}
        />
        <line
          className="heromark-base"
          x1={CENTRE - MARK_HALF_W - 26}
          y1={BASELINE}
          x2={CENTRE + MARK_HALF_W + 26}
          y2={BASELINE}
        />

        {/* ── the mark itself ── */}
        <g className="heromark-cast" transform={`translate(${MARK_TX} ${MARK_TY}) scale(${MARK_S})`}>
          {/* the bevel, deepest first */}
          {Array.from({ length: BEVEL_LAYERS }, (_, i) => {
            const depth = BEVEL_LAYERS - i;
            const t = i / (BEVEL_LAYERS - 1);
            return (
              <g
                key={i}
                transform={`translate(${depth * BEVEL_STEP} ${depth * BEVEL_STEP * 1.1})`}
                fill={bevelColour(t)}
              >
                {MARK_PATHS.map((d, j) => (
                  <path key={j} d={d} />
                ))}
              </g>
            );
          })}

          {/* the face: cast brass, enamel counters, a hairline on the edge */}
          <g fill={`url(#${faceId})`}>
            {MARK_PATHS.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
          <g fill={`url(#${enamelId})`}>
            {MARK_ACCENT_PATHS.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
          <g className="heromark-edge" fill="none" vectorEffect="non-scaling-stroke">
            {MARK_PATHS.map((d, i) => (
              <path key={i} d={d} vectorEffect="non-scaling-stroke" />
            ))}
          </g>

          {/* brushed grain and the fixed highlight, both held inside the mark */}
          <g clipPath={`url(#${clipId})`}>
            <rect x="180" y="70" width="290" height="760" fill={`url(#${brushId})`} />
            <rect x="180" y="70" width="290" height="760" fill={`url(#${sheenId})`} />
          </g>
        </g>
      </svg>
    </div>
  );
}
