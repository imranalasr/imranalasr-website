"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MARK_ACCENT_PATHS, MARK_OUTLINE_PATHS, MARK_PATHS } from "@/components/brand/MarkGeometry";
import Seq from "@/components/Seq";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * The mark, erected on site by a crane that is not part of it.
 *
 * The sheet holds two separate things, and it matters that they never read as
 * one object. On the left stands the plant: a lattice tower crane — ballast,
 * mast, turntable, cab, counter-jib and counterweight, jib, trolley, rope and
 * hook block — drawn in cold steel, in its own geometry, owing nothing to the
 * brand. On the right is the plot: a levelled ground line, a machined bearing
 * plate on a pier, and the company mark set out on it as a survey line before
 * a single piece of it exists.
 *
 * Then the crane builds it. Eleven pieces of the traced artwork are slung at
 * the laydown zone beside the mast, traversed out along the jib, and lowered
 * onto the plate in the order a structure actually goes up: footings first,
 * then the full-height members, then the crown, then the infill, and the two
 * enamel counters last. Each one lands against a plumb line and a seat mark,
 * flashes along its own edge as it seats, and throws a little dust.
 *
 * When the last piece is in, the hook is raised, the trolley is drawn back to
 * the mast, and the crane travels off the sheet and out of the frame. What is
 * left standing is the finished logo — the whole of it, exactly as issued.
 *
 * Nothing about the logo is redrawn here. Every piece is a path straight out
 * of `MarkGeometry`, and the survey line is that file's own outline of the
 * envelope. The crane is the only thing invented, and it leaves.
 *
 * None of which is worth anything if it happens off-screen. A scene like this
 * earns its keep in one moment — the last piece seating and the mark standing
 * there whole — and that moment is the easiest one to lose: the reader scrolls
 * on, the section leaves, and the build finishes to an empty room. So the
 * sheet is held still for the whole of it, by whichever means the viewport
 * allows (see `data-motion` below), and the timeline ends with a stretch of
 * dead scroll where nothing moves at all, so the finished mark is unmistakably
 * presented before the page is handed back.
 *
 * Degradation is the authored state: the SVG is written *finished*, with the
 * crane and all its plant held at zero opacity by the stylesheet. GSAP only
 * ever pulls the mark apart once it runs, so no JavaScript, reduced motion, or
 * a failed script all leave a complete, stable mark and no crane on the page —
 * and none of the holding above applies either, since every rule that sets it
 * up is keyed on a `data-motion` this component only sets once it animates.
 */

/* ── The sheet ──────────────────────────────────────────────────────── */
const VIEW_W = 640;
const VIEW_H = 820;
const GROUND = 754;

/* ── The plot, on the right ─────────────────────────────────────────── */
/** Centre of the plot — where the finished mark stands. */
const CENTRE = 400;
/** Top of the machined bearing plate: what the mark is bolted to. */
const PLATE_TOP = 694;
const PLATE_X = 290;
const PLATE_W = 220;

/** The mark's own visual centre. Its silhouette runs x 188..452; the 1-unit
    trace sliver at x0 is not part of it. */
const MARK_MID_X = 320;
const MARK_S = 0.7;
const MARK_TX = CENTRE - MARK_S * MARK_MID_X;
const MARK_TY = PLATE_TOP - MARK_S * 818;

/* ── The plant, on the left ─────────────────────────────────────────── */
/** Centreline of the mast. Well clear of the plate on every screen. */
const MAST_X = 96;
/** Half the spacing between the mast's two chords. */
const MAST_HALF = 18;
/** Where the mast stops and the turntable begins. */
const MAST_TOP = 128;
/** Top of the ballast the mast is footed on. */
const MAST_FOOT = 730;
/** The jib: top chord, bottom chord (the trolley's rail), and its reach. */
const JIB_TOP = 78;
const JIB_BOT = 100;
const JIB_END = 584;
/** The counter-jib tail, and the apex the pendants are made off at. */
const CJIB_END = 18;
const APEX_Y = 16;

/** Where loads are slung — over the laydown zone beside the mast. */
const TROLLEY_HOME = 212;
/** Hook block to the top of the load it is carrying. */
const HOOK_GAP = 16;
/** No load is ever flown with its top higher than this. Set so the tallest
    piece still clears the mast, the cab and everything already standing. */
const FLY_CEILING = 152;
/** How far above its own seat a piece is carried across. */
const FLY_CLEAR = 104;

/* ── The crane's own geometry ───────────────────────────────────────────
   Cold steel, drawn from nothing but these numbers. It is lattice work, so
   it is generated rather than traced: chords, ties and bracing. */

/** Mast panels — chords, horizontal ties, and the X between them. */
const MAST_PANELS = 13;
const MAST_PANEL_H = (MAST_FOOT - MAST_TOP) / MAST_PANELS;
const MAST_ROWS = Array.from({ length: MAST_PANELS }, (_, i) => MAST_TOP + i * MAST_PANEL_H);

/** Jib panels — the long reach out over the plot. */
const JIB_PANELS = 10;
const JIB_PANEL_W = (JIB_END - (MAST_X + MAST_HALF)) / JIB_PANELS;
const JIB_COLS = Array.from({ length: JIB_PANELS }, (_, i) => MAST_X + MAST_HALF + i * JIB_PANEL_W);

/** Counter-jib panels — short, and carrying the counterweight. */
const CJIB_PANELS = 2;
const CJIB_PANEL_W = (MAST_X - MAST_HALF - CJIB_END) / CJIB_PANELS;
const CJIB_COLS = Array.from({ length: CJIB_PANELS }, (_, i) => CJIB_END + i * CJIB_PANEL_W);

/** The levelled ground, and the survey ticks along it. */
const GROUND_X0 = 16;
const GROUND_X1 = VIEW_W - 16;
const GROUND_TICKS = Array.from({ length: Math.floor((GROUND_X1 - GROUND_X0) / 29) }, (_, i) => GROUND_X0 + 12 + i * 29);

/* ── The drafting board's setting-out lines ─────────────────────────────
   Read off the mark itself rather than typed in, so the drawing is a
   drawing *of this mark* and stays one if the artwork is ever re-traced.
   The silhouette runs x 188..452 and starts at y 82 in mark units. */
const MARK_L = MARK_TX + MARK_S * 188;
const MARK_R = MARK_TX + MARK_S * 452;
const MARK_TOP_Y = MARK_TY + MARK_S * 82;
const BOARD_TOP = MARK_TOP_Y - 46;

/* ── The technical pencil ───────────────────────────────────────────────
   Set out along its own axis rather than traced, so the whole instrument
   follows from one angle: `d` runs up the pencil from the lead, `w` runs
   across it. It is held at the angle a hand holds one over a board, and the
   group's origin is the point of the lead — which is what lets the timeline
   simply put the group on the line and have the tip land there. */
const PENCIL_ANGLE = (-58 * Math.PI) / 180;
const PENCIL_COS = Math.cos(PENCIL_ANGLE);
const PENCIL_SIN = Math.sin(PENCIL_ANGLE);
/** A point on the instrument: `d` along the barrel, `w` across it. */
const nib = (d: number, w: number) =>
  `${(d * PENCIL_COS - w * PENCIL_SIN).toFixed(2)} ${(d * PENCIL_SIN + w * PENCIL_COS).toFixed(2)}`;
/** Lead, sharpened wood, ferrule, barrel, cap — each a run along the axis. */
const PENCIL = {
  lead: `M ${nib(0, 0)} L ${nib(11, 2.1)} L ${nib(11, -2.1)} Z`,
  cone: `M ${nib(11, 2.1)} L ${nib(29, 5.3)} L ${nib(29, -5.3)} L ${nib(11, -2.1)} Z`,
  ferrule: `M ${nib(29, 5.8)} L ${nib(39, 5.8)} L ${nib(39, -5.8)} L ${nib(29, -5.8)} Z`,
  barrel: `M ${nib(39, 5.3)} L ${nib(126, 5.3)} L ${nib(126, -5.3)} L ${nib(39, -5.3)} Z`,
  cap: `M ${nib(126, 5.3)} L ${nib(133, 3.2)} L ${nib(133, -3.2)} L ${nib(126, -5.3)} Z`,
  facetA: `M ${nib(41, 1.9)} L ${nib(124, 1.9)}`,
  facetB: `M ${nib(41, -2.1)} L ${nib(124, -2.1)}`,
};

/** The pier under the bearing plate, and where the jib pendants are anchored. */
const PIER_W = PLATE_W + 56;
const PENDANT_X = MAST_X + (JIB_END - MAST_X) * 0.34;

/** The laydown zone: where the pieces are stacked before they are flown. */
const YARD_X0 = 122;
const YARD_X1 = 254;

/** The 1.25-unit trace sliver in the artwork is set, not installed. */
const STATIC_PATHS = [9];

/**
 * Erection order.
 *
 * The way a frame actually goes up, not the way the artwork is listed:
 * footings on the plate first, then the two full-height members, then the
 * crown over them, then the infill that ties it together, and only then the
 * counters and the two enamel details. Heavy pieces are given a slower cycle
 * than light ones, which is also how a real lift is run.
 */
const PIECES: { kind: "path" | "accent"; index: number; stage: number }[] = [
  /* 01 — the base is set out and bedded */
  { kind: "path", index: 7, stage: 0 },
  { kind: "path", index: 3, stage: 0 },
  /* 02 — the full-height members */
  { kind: "path", index: 1, stage: 1 },
  { kind: "path", index: 2, stage: 1 },
  /* 03 — the crown, and the members that tie into it */
  { kind: "path", index: 0, stage: 2 },
  { kind: "path", index: 8, stage: 2 },
  { kind: "path", index: 4, stage: 2 },
  /* 04 — counters, then the two enamel details */
  { kind: "path", index: 6, stage: 3 },
  { kind: "path", index: 5, stage: 3 },
  { kind: "accent", index: 0, stage: 3 },
  { kind: "accent", index: 1, stage: 3 },
];

const STAGE_COUNT = 4;

/** A piece is heavy if its own footprint says so — no hand-kept list. */
const HEAVY_AREA = 5000;

/**
 * How much of the section's scroll is spent holding the finished mark still,
 * after everything has been built and the crane has gone. A sixth of the way
 * up the section is roughly two seconds of ordinary scrolling — long enough
 * to register that it is finished, short enough not to feel stuck.
 */
const HOLD_SHARE = 0.16;

/* ── The drafting stage ─────────────────────────────────────────────────
   Before a crane is brought anywhere near a site, the thing is drawn. So
   the sheet opens on a drafting board: a technical pencil comes onto it,
   sets out the mark's own envelope line by line, and is lifted off again —
   and only then does the plant arrive.

   The pencil is not a character. It is a drafting instrument seen from
   above at the angle a hand holds one: a hexagonal barrel in cold steel, a
   brass ferrule, a sharpened lead, and a fine highlight along one flat.
   Nothing about it is animate — it does not bounce, wobble, tilt or hurry,
   and it never leaves the line it is drawing. What makes it read is that
   the line appears *at its tip*, at the speed it travels, which is the
   only thing a pencil actually does. */
/** The pencil is carried onto the sheet, draws, then is lifted clear. */
const PENCIL_IN = 0.25;
const DRAW_AT = 0.85;
/* The whole point of the beat is that it is watched, so it is given real
   scroll: a little over a tenth of the section, which is most of a screen of
   ordinary scrolling for the envelope alone. */
const DRAW_FOR = 3.4;
/** The lead is lifted only once the line is closed, never during it. */
const PENCIL_OUT = DRAW_AT + DRAW_FOR + 0.12;
/**
 * Where the plant sequence begins. Everything the crane does is expressed as
 * an offset from this, so retuning the drafting above moves the whole build
 * with it rather than leaving the two overlapping.
 */
const CRANE_ON = PENCIL_OUT + 0.7;
/** And where the first piece is slung. */
const FIRST_LIFT = CRANE_ON + 3.2;

export default function BuildSequence({ t }: { t: Dictionary }) {
  const root = useRef<HTMLElement>(null);
  /** -1 while the plot is being set out — no stage has begun. */
  const [stage, setStage] = useState(-1);
  const [done, setDone] = useState(false);

  /**
   * Which of the two holds is available depends on the window, and the window
   * changes: rotate a tablet, or drag a desktop window short, and a section
   * that was tall enough to pin no longer is. Tracking it as state re-runs the
   * whole scene when the answer changes, rather than leaving the sheet stuck
   * in a mode the viewport can no longer carry.
   */
  const [roomy, setRoomy] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1000px) and (min-height: 700px)");
    const sync = () => setRoomy(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    if (document.documentElement.classList.contains("reduced-motion")) {
      el.dataset.motion = "static";
      setStage(STAGE_COUNT - 1);
      setDone(true);
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    el.dataset.motion = "scroll";

    const ctx = gsap.context(() => {
      const pieces = gsap.utils.toArray<SVGGElement>("[data-piece]");
      if (!pieces.length) return;

      /* Measure where each piece actually sits, in stage coordinates, so the
         hook always makes off to the piece it is really carrying. */
      const geom = pieces.map((g) => {
        const shape = g.querySelector<SVGGraphicsElement>("path");
        const box = shape ? shape.getBBox() : ({ x: 0, y: 0, width: 0, height: 0 } as DOMRect);
        const seatTop = MARK_TY + MARK_S * box.y;
        return {
          /* seat, in stage units */
          cx: MARK_TX + MARK_S * (box.x + box.width / 2),
          top: seatTop,
          bottom: MARK_TY + MARK_S * (box.y + box.height),
          w: MARK_S * box.width,
          /* how high this one is carried: only ever as high as it needs */
          fly: Math.max(FLY_CEILING, seatTop - FLY_CLEAR),
          heavy: box.width * box.height > HEAVY_AREA,
        };
      });

      /* The survey line is drawn on before anything is built inside it. */
      const setout = el.querySelector<SVGPathElement>("[data-setout]");
      const setoutLen = setout?.getTotalLength?.() ?? 3200;

      /* Filled in as the timeline is built, then read back against its own
         duration — so a stage heading lights at the moment its own pieces
         start to be flown, whatever the timings below are tuned to. */
      const stageAt = new Array<number>(STAGE_COUNT).fill(Infinity);
      /* Except the first, which is the requirements review — and on this
         sheet that is the drafting. It lights when the pencil comes down,
         not when the first piece is slung, because the reader is watching
         stage one happen for the whole of the setting out. */
      stageAt[0] = PENCIL_IN;
      let endsAt = 0;

      /* Two ways of holding the scene still while it is watched, and the
         markup is told which one is in force so the stylesheet can lay the
         section out to match.

         · pin    — room enough for the whole section: it is pinned at the top
                    of the viewport for the entire build, copy and sheet both
                    on screen throughout.
         · sticky — anything shorter or narrower. Pinning a section taller
                    than the viewport would hang its bottom — the sheet — off
                    the screen, so instead the copy is read first and then the
                    sheet alone sticks, held by the section's own extra height
                    rather than by a fixed position. Native sticky, so touch
                    scrolling is never taken over. */
      el.dataset.motion = roomy ? "pin" : "sticky";
      const stagebox = el.querySelector<HTMLElement>(".build-stagebox");

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: roomy ? el : stagebox ?? el,
          start: "top top",
          /* Pinned, the scroll length is declared. Stuck, it runs to four
             tenths of a viewport short of where the stagebox would release
             the sheet — so the timeline is always finished, and the mark
             always standing still, while the sheet is still being held. */
          /* Retuned from 520% to 310% — a little over three viewports rather
             than five and a bit. Nothing is cut: the whole timeline still
             runs, and every beat keeps its share of it, so the setting out is
             still watched and the eleven lifts still land one at a time. What
             changes is how much scrolling buys them, and at five viewports the
             section was two thirds of the way to feeling stuck. */
          end: roomy ? "+=310%" : "bottom bottom+=40%",
          scrub: 0.6,
          pin: roomy ? el : false,
          pinSpacing: roomy,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress * tl.duration();
            let k = -1;
            for (let i = 0; i < STAGE_COUNT; i++) if (p >= stageAt[i]) k = i;
            setStage(k);
            setDone(endsAt > 0 && p >= endsAt);
          },
        },
      });

      /** Trolley, rope and hook are one rig: they only ever move together. */
      const rig = (pos: number, dur: number, ease: string, tx: number, hookY: number) => {
        tl.to("[data-trolley]", { x: tx, duration: dur, ease }, pos)
          .to("[data-hook]", { y: hookY - JIB_BOT, duration: dur, ease }, pos)
          .to("[data-rope]", { attr: { y2: hookY - JIB_BOT - 5 }, duration: dur, ease }, pos);
      };

      /* The copy is not on this timeline. It is revealed by the site's own
         shared reveal system as the section comes up, so it is already read
         by the time the sheet pins and starts building. */

      /* ── 1. The plot ────────────────────────────────────────────────
         The levelled ground and the bearing plate are *not* animated on.
         They are the state of the site before any of this starts, and they
         are left standing in the authored artwork so the sheet is a prepared
         plot from the moment it comes into view — including the viewport of
         scrolling it takes to arrive, which is before the timeline has a
         playhead at all. Animating them in left that approach blank, which
         read as a section that had failed to load rather than as a site
         waiting for plant.

         What does arrive is the survey line: the mark's own envelope, set
         out on the plate before a single piece of it exists — and it is put
         there by the pencil below, not alongside it. */

      /* ── 1b. The pencil, and the line it makes ──────────────────────
         One proxy drives both. The tip's position and the stroke's dash
         offset are read from the same number on the same update, so they
         cannot come apart: whatever the scroll does, forwards, backwards
         or in a jump, the line ends exactly where the lead is.

         Two tweens matched by hand — the same start, the same duration,
         the same ease — is the obvious way to write this and it is the
         wrong one. It survives a forward play and nothing else: any
         difference in how the two are resolved (and there was one, see
         `.build-setout path` in the stylesheet) shows up as a line that
         runs ahead of the instrument supposedly drawing it. */
      const pencil = el.querySelector<SVGGElement>("[data-pencil]");
      if (setout && pencil) {
        /** A point on the envelope, carried into the sheet's coordinates —
            the line is drawn inside the mark's own transform, the pencil is
            not, so every position has to cross that boundary. */
        const onLine = (len: number) => {
          const pt = setout.getPointAtLength(Math.max(0, Math.min(setoutLen, len)));
          return { x: MARK_TX + MARK_S * pt.x, y: MARK_TY + MARK_S * pt.y };
        };
        const first = onLine(0);
        const last = onLine(setoutLen);

        /* Nothing is on the board until the pencil puts it there: the
           envelope is dashed out of existence from the first frame of the
           timeline, not at the moment the drawing starts. */
        tl.set(
          setout,
          { opacity: 0.92, strokeDasharray: setoutLen, strokeDashoffset: setoutLen },
          0
        );

        const head = { len: 0 };
        tl.to(
          head,
          {
            len: setoutLen,
            duration: DRAW_FOR,
            ease: "none",
            onUpdate: () => {
              gsap.set(setout, { strokeDashoffset: setoutLen - head.len });
              gsap.set(pencil, onLine(head.len));
            },
          },
          DRAW_AT
        );

        /* Carried onto the board, held to the line while it works, lifted
           clear of it.

           It is never scaled. A pencil does not change size, and scaling an
           SVG group about a point that is not its bounding box's own origin
           means GSAP folds the difference into a translation — which would
           put the tip somewhere other than on the line at exactly the moment
           the whole scene depends on it being on the line. Position and
           opacity carry the entrance instead, which is also what a hand
           actually does. */
        tl.fromTo(
          pencil,
          { opacity: 0, x: first.x + 66, y: first.y - 88 },
          { opacity: 1, x: first.x, y: first.y, duration: 0.5, ease: "power2.out" },
          PENCIL_IN
        ).to(
          pencil,
          { opacity: 0, x: last.x + 62, y: last.y - 84, duration: 0.5, ease: "power2.in" },
          PENCIL_OUT
        );

        /* The board wakes as the pencil comes down and settles once the
           envelope is set out — the sheet is being worked on, then read. */
        tl.fromTo(
          "[data-board]",
          { opacity: 0 },
          { opacity: 1, duration: 0.5, ease: "power2.out" },
          PENCIL_IN
        ).to("[data-board]", { opacity: 0.35, duration: 0.7, ease: "power2.out" }, PENCIL_OUT + 0.2);
      }

      /* ── 2. The plant is brought on and erected ───────────────────────
         Every scale below names its own origin in the *from* vars as well as
         the *to* vars. GSAP keeps an element visually put when its transform
         origin changes by folding the difference into a translation, so an
         origin declared on one side only leaves the piece permanently offset
         by the distance between the bbox centre and the point it should have
         been scaled about. */
      tl.set("[data-crane]", { opacity: 1 }, CRANE_ON)
        .fromTo(
          "[data-yard]",
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
          CRANE_ON
        )
        .fromTo(
          "[data-crane-base] > *",
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.42, stagger: 0.07, ease: "power2.out" },
          CRANE_ON + 0.15
        )
        /* the mast climbs out of its own ballast */
        .fromTo(
          "[data-mast]",
          { scaleY: 0, opacity: 0, svgOrigin: `${MAST_X} ${MAST_FOOT}` },
          {
            scaleY: 1,
            opacity: 1,
            duration: 0.95,
            ease: "power2.out",
            svgOrigin: `${MAST_X} ${MAST_FOOT}`,
          },
          CRANE_ON + 0.45
        )
        /* turntable and cab */
        .fromTo(
          "[data-slew]",
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
          CRANE_ON + 1.25
        )
        /* the counter-jib and its counterweight go on before the jib */
        .fromTo(
          "[data-cjib]",
          { scaleX: 0, opacity: 0, svgOrigin: `${MAST_X} ${JIB_BOT}` },
          { scaleX: 1, opacity: 1, duration: 0.45, ease: "power2.out", svgOrigin: `${MAST_X} ${JIB_BOT}` },
          CRANE_ON + 1.45
        )
        .fromTo(
          "[data-ballast]",
          { opacity: 0, y: -14 },
          { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
          CRANE_ON + 1.7
        )
        /* then the jib itself, run out over the plot */
        .fromTo(
          "[data-jib]",
          { scaleX: 0, opacity: 0, svgOrigin: `${MAST_X} ${JIB_BOT}` },
          { scaleX: 1, opacity: 1, duration: 0.85, ease: "power3.out", svgOrigin: `${MAST_X} ${JIB_BOT}` },
          CRANE_ON + 1.75
        )
        /* the apex, and the pendants that hold the jib up */
        .fromTo(
          "[data-apex]",
          { opacity: 0, scaleY: 0, svgOrigin: `${MAST_X} ${JIB_TOP}` },
          { opacity: 1, scaleY: 1, duration: 0.4, ease: "power2.out", svgOrigin: `${MAST_X} ${JIB_TOP}` },
          CRANE_ON + 2.0
        )
        .fromTo("[data-pendant]", { opacity: 0 }, { opacity: 1, duration: 0.35, stagger: 0.06 }, CRANE_ON + 2.25)
        /* and last the rig itself, run down off the trolley */
        .set("[data-hoist]", { opacity: 1 }, CRANE_ON + 2.45)
        .set("[data-trolley]", { x: TROLLEY_HOME }, CRANE_ON + 2.45)
        .fromTo(
          "[data-hook]",
          { y: 0, opacity: 0 },
          { y: FLY_CEILING - HOOK_GAP - JIB_BOT, opacity: 1, duration: 0.55, ease: "power2.out" },
          CRANE_ON + 2.45
        )
        .fromTo(
          "[data-rope]",
          { attr: { y2: 6 } },
          { attr: { y2: FLY_CEILING - HOOK_GAP - JIB_BOT - 5 }, duration: 0.55, ease: "power2.out" },
          CRANE_ON + 2.45
        );

      /* ── 3. The mark is flown onto the plate, piece by piece ─────────
         Every tween below that targets a rig shared by all eleven lifts —
         the slings, the setting-out guide, the landing burst — is written so
         its *from* state is the invisible one, and is held off until the
         playhead reaches it. That is what keeps a scrub in either direction
         from leaving a stray flash parked on the sheet. */
      let at = FIRST_LIFT;
      let lastLand = at;
      pieces.forEach((piece, i) => {
        const stageOf = PIECES[i]?.stage ?? 0;
        stageAt[stageOf] = Math.min(stageAt[stageOf], at);

        const seat = piece.querySelector("[data-seat]");
        const g = geom[i];
        const hookFly = g.fly - HOOK_GAP;
        const hookSeat = g.top - HOOK_GAP;
        /* the piece's own offsets, in mark units, so hook and load lock */
        const yardDx = (TROLLEY_HOME - g.cx) / MARK_S;
        const flyDy = (g.fly - g.top) / MARK_S;
        const sling = Math.min(Math.max(g.w * 0.42, 12), 34);
        /* heavy members are flown slowly; details are quick */
        const k = g.heavy ? 1 : 0.78;

        /* the trolley is drawn back over the laydown zone … */
        rig(at, 0.3, "power2.inOut", TROLLEY_HOME, hookFly);

        /* … the slings are made off to this particular piece … */
        tl.set("[data-sling-l]", { attr: { x2: -sling, y2: HOOK_GAP } }, at + 0.26)
          .set("[data-sling-r]", { attr: { x2: sling, y2: HOOK_GAP } }, at + 0.26)
          .fromTo(
            "[data-sling]",
            { opacity: 0 },
            { opacity: 1, duration: 0.14, ease: "power2.out", immediateRender: false },
            at + 0.26
          )
          /* … the load comes onto the hook … */
          .fromTo(
            piece,
            { x: yardDx, y: flyDy, rotation: 0, opacity: 0, svgOrigin: `${g.cx} ${g.top}` },
            { x: yardDx, y: flyDy, opacity: 1, duration: 0.16, ease: "power2.out" },
            at + 0.26
          );

        /* … the seat is marked out and plumbed before the load arrives … */
        tl.set("[data-guide]", { x: g.cx, y: g.top }, at + 0.38)
          .set("[data-guide-drop]", { attr: { y1: JIB_BOT + 26 - g.top } }, at + 0.38)
          .set("[data-guide-mark]", { attr: { x1: -g.w / 2 - 9, x2: g.w / 2 + 9 } }, at + 0.38)
          .fromTo(
            "[data-guide]",
            { opacity: 0 },
            { opacity: 1, duration: 0.2, ease: "power2.out", immediateRender: false },
            at + 0.38
          );

        /* … the trolley traverses out, the load trailing behind it … */
        const crossAt = at + 0.42;
        const crossFor = 0.46 * k;
        rig(crossAt, crossFor, "power2.inOut", g.cx, hookFly);
        tl.to(piece, { x: 0, duration: crossFor, ease: "power2.inOut" }, crossAt)
          .to(piece, { rotation: -1.5, duration: 0.2 * k, ease: "power2.out" }, crossAt)
          .to(piece, { rotation: 0, duration: 0.34 * k, ease: "power2.inOut" }, crossAt + 0.22 * k);

        /* … and is lowered onto its seat. */
        const lowerAt = crossAt + crossFor + 0.03;
        const lowerFor = 0.5 * k;
        rig(lowerAt, lowerFor, "power2.inOut", g.cx, hookSeat);
        tl.to(piece, { y: 0, duration: lowerFor, ease: "power2.inOut" }, lowerAt);

        /* It seats: the edge flashes against the seat mark, the guide is
           struck, and the joint throws a little dust. */
        const land = lowerAt + lowerFor;
        tl.set("[data-land]", { x: g.cx, y: g.bottom }, land)
          .set("[data-land-seam]", { attr: { x1: -g.w / 2, x2: g.w / 2 } }, land)
          /* the alignment flash, along the piece's own edge */
          .fromTo(
            seat,
            { opacity: 0 },
            { opacity: 0.95, duration: 0.1, ease: "power2.out", immediateRender: false },
            land
          )
          .to(seat, { opacity: 0, duration: 0.34, ease: "power2.out" }, land + 0.1)
          /* the seam at the joint */
          .fromTo(
            "[data-land-seam]",
            { opacity: 0, scaleX: 0.35 },
            { opacity: 0.85, scaleX: 0.8, duration: 0.1, ease: "power2.out", immediateRender: false },
            land
          )
          .to("[data-land-seam]", { opacity: 0, scaleX: 1, duration: 0.32, ease: "power2.out" }, land + 0.1)
          /* one settling ring */
          .fromTo(
            "[data-land-ring]",
            { opacity: 0, scale: 0.28 },
            { opacity: 0.5, scale: 0.5, duration: 0.1, ease: "power2.out", immediateRender: false },
            land
          )
          .to("[data-land-ring]", { opacity: 0, scale: 1, duration: 0.36, ease: "power2.out" }, land + 0.1)
          /* and the dust it puts up */
          .fromTo(
            "[data-land-dust] > *",
            { opacity: 0, scale: 0.3, y: 0 },
            { opacity: 0.42, scale: 0.62, duration: 0.12, stagger: 0.03, ease: "power2.out", immediateRender: false },
            land
          )
          .to(
            "[data-land-dust] > *",
            { opacity: 0, scale: 1.2, y: -10, duration: 0.44, stagger: 0.03, ease: "power2.out" },
            land + 0.12
          )
          .to("[data-guide]", { opacity: 0, duration: 0.24, ease: "power2.out" }, land + 0.06)
          .to("[data-sling]", { opacity: 0, duration: 0.18 }, land + 0.1)
          /* the survey line is struck out as the mark takes its place */
          .to("[data-setout]", { opacity: 0.92 * (1 - (i + 1) / pieces.length), duration: 0.3 }, land);

        /* the hook is released and raised clear. Cycles never overlap: the
           next lift only starts once this one is off the hook, so no two
           tweens are ever writing the rig's position at the same time. */
        const releaseAt = land + 0.16;
        rig(releaseAt, 0.28, "power2.out", g.cx, g.top - 58);

        lastLand = land;
        at = releaseAt + 0.28 + (g.heavy ? 0.14 : 0.06);
      });

      /* ── 4. The plant is stood down and travels off the plot ────────── */
      endsAt = lastLand + 0.2;
      rig(at, 0.5, "power2.inOut", TROLLEY_HOME, JIB_BOT + 46);
      tl.to("[data-setout]", { opacity: 0, duration: 0.3 }, at)
        .to("[data-hoist]", { opacity: 0, duration: 0.35 }, at + 0.5)
        .to("[data-yard]", { opacity: 0, y: 12, duration: 0.4 }, at + 0.5)
        /* the crane travels off the way it came on, and is gone */
        .to("[data-crane]", { x: -(MAST_X + JIB_END), opacity: 0, duration: 1.35, ease: "power2.inOut" }, at + 0.7)
        /* the plate and the mark take the middle of the sheet the crane
           has just left, so the last frame is a centred logo */
        .to("[data-settle]", { x: VIEW_W / 2 - CENTRE, duration: 1.4, ease: "power3.inOut" }, at + 0.8)
        /* and the sheet quietens down around it */
        .to("[data-plot]", { opacity: 0.3, duration: 0.8, ease: "power2.out" }, at + 0.9)
        .to("[data-dims]", { opacity: 0, duration: 0.6, ease: "power2.out" }, at + 0.9);

      /* ── 5. The finished mark takes the light ───────────────────────── */
      tl.fromTo(
        "[data-finish]",
        { opacity: 0, x: -230 },
        { opacity: 1, x: 250, duration: 1.15, ease: "power1.inOut" },
        at + 1.7
      ).to("[data-finish]", { opacity: 0, duration: 0.35 }, at + 2.6);

      /* ── 6. The hold ────────────────────────────────────────────────
         Dead time, and the most important beat in the section.

         The sheet is held — pinned or stuck — for the whole timeline and let
         go the instant it ends, and a scrubbed timeline always trails the
         scroll a little. So without this, the last piece lands as the section
         is already being released, and the one moment the whole scene exists
         for is the one nobody sees. This adds a stretch of scroll at the end
         where nothing moves at all: the finished mark, alone, standing still
         on a still sheet, before the page is handed back.

         It is written as a share of the whole rather than a fixed length, so
         it stays a fixed fraction of the scroll however the build above is
         retuned — and it is the last tween on the timeline, which is what
         makes it the timeline's duration. */
      const built = at + 2.95;
      const holdFor = (built * HOLD_SHARE) / (1 - HOLD_SHARE);
      tl.to({ hold: 0 }, { hold: 1, duration: holdFor }, built);
    }, el);

    return () => ctx.revert();
  }, [roomy]);

  const stages = t.home.buildStages;

  return (
    <section
      ref={root}
      className="build"
      data-surface="ink"
      data-surface-section="ink"
      data-seam="forest"
      data-motion="static"
      data-chapter="0"
      aria-labelledby="build-title"
    >
      <div className="build-night" aria-hidden="true">
        <span className="build-sky" />
        <span className="blueprint-grid build-grid" />
        <span className="build-flood" />
      </div>

      <div className="page build-inner">
        <div className="build-copy">
          <div data-reveal-group="">
            <p className="eyebrow" data-reveal="up">
              {t.home.buildEyebrow}
              <Seq n={1} of={t.home.chapters.length} className="eyebrow-seq" />
            </p>
            <h2 id="build-title" className="section-title build-title" data-reveal="up">
              {t.home.buildTitle}
            </h2>
            <p className="section-lead build-lead" data-reveal="up">
              {t.home.buildLead}
            </p>
          </div>

          {/* The reveal is declared on the row's contents, never on the row
              itself: the row's own opacity is what marks the live stage. */}
          <ol className="build-stages" data-reveal-group="">
            {stages.map((s, i) => (
              <li key={s.index} className="build-stage" data-active={i === stage} data-passed={i < stage}>
                <span className="build-stage-index" data-reveal="up">
                  <Seq n={s.index} of={stages.length} />
                </span>
                <div className="build-stage-body" data-reveal="up">
                  <h3 className="build-stage-title">{s.title}</h3>
                  <p className="build-stage-text">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className="build-hint" data-done={done}>
            <span className="build-hint-mark" aria-hidden="true">
              {done ? "■" : "↓"}
            </span>
            {done ? t.home.buildDone : t.home.buildHint}
          </p>
        </div>

        {/* The stagebox is the scroll room; the pin inside it is what is
            actually held on screen. On a tall enough viewport the whole
            section is pinned instead and this wrapper simply passes through. */}
        <div className="build-stagebox">
          <div className="build-stagepin">
            <svg
              className="build-svg"
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              role="img"
              aria-label={t.home.heroMarkAlt}
            >
              <defs>
                {/* One casting, one light: the brass ramp is laid across the
                    mark's own box rather than each piece's, so the finished
                    logo reads as a single object and not as eleven. */}
                <linearGradient
                  id="build-brass"
                  gradientUnits="userSpaceOnUse"
                  x1="188"
                  y1="82"
                  x2="412"
                  y2="818"
                >
                  <stop offset="0" stopColor="#e7d0a6" />
                  <stop offset="0.4" stopColor="#b88a44" />
                  <stop offset="1" stopColor="#8a6428" />
                </linearGradient>
                <linearGradient id="build-enamel" x1="0" y1="0" x2="0.4" y2="1">
                  <stop offset="0" stopColor="#2c8365" />
                  <stop offset="1" stopColor="#0f3d2e" />
                </linearGradient>
                <linearGradient id="build-plate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#6a7078" />
                  <stop offset="0.4" stopColor="#3c4248" />
                  <stop offset="1" stopColor="#252a2e" />
                </linearGradient>
                <linearGradient id="build-pier" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#527d95" />
                  <stop offset="1" stopColor="#22333f" />
                </linearGradient>
                <linearGradient id="build-steel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#8bb2c6" />
                  <stop offset="1" stopColor="#31566b" />
                </linearGradient>
                <linearGradient id="build-finish" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#fff" stopOpacity="0" />
                  <stop offset="0.5" stopColor="#fff" stopOpacity="0.5" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
                {/* A cast shadow on a dark ground has to be darker than the
                    ground, not lighter — pure black, or the plant appears to
                    float on a pool of light. */}
                <radialGradient id="build-shadow" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0" stopColor="#000" stopOpacity="0.55" />
                  <stop offset="1" stopColor="#000" stopOpacity="0" />
                </radialGradient>
                <clipPath id="build-mark-clip">
                  {MARK_PATHS.map((d, i) => (
                    <path key={i} d={d} />
                  ))}
                </clipPath>
              </defs>

              {/* ══ THE BOARD ═════════════════════════════════════════════
                  What is on the sheet before anything is built: the mark set
                  out as a drawing. A centreline, the two extents its
                  silhouette has to fall between, a datum at its head and one
                  at the plate it will stand on — the four lines a thing is
                  actually set out from, not a sheet of graph paper. They come
                  up under the pencil and fall back once the envelope is
                  drawn, because from that point on the envelope *is* the
                  setting out. */}
              <g data-board="" className="build-board">
                <line x1={CENTRE} y1={BOARD_TOP} x2={CENTRE} y2={GROUND} className="build-board-axis" />
                <line x1={MARK_L} y1={BOARD_TOP} x2={MARK_L} y2={GROUND} className="build-board-extent" />
                <line x1={MARK_R} y1={BOARD_TOP} x2={MARK_R} y2={GROUND} className="build-board-extent" />
                <line x1={MARK_L - 30} y1={MARK_TOP_Y} x2={MARK_R + 30} y2={MARK_TOP_Y} className="build-board-datum" />
                <line x1={MARK_L - 30} y1={PLATE_TOP} x2={MARK_R + 30} y2={PLATE_TOP} className="build-board-datum" />
                <g className="build-board-tick">
                  {[MARK_L, CENTRE, MARK_R].map((x) => (
                    <line key={x} x1={x - 5} y1={MARK_TOP_Y} x2={x + 5} y2={MARK_TOP_Y} />
                  ))}
                </g>
              </g>

              {/* ══ THE PLOT ══════════════════════════════════════════════
                  Levelled ground, survey ticks, and the bearing plate the
                  mark is erected on. */}
              <g data-plot="" className="build-plot">
                <line x1={GROUND_X0} y1={GROUND} x2={GROUND_X1} y2={GROUND} className="build-ground" />
                {GROUND_TICKS.map((x) => (
                  <line key={x} x1={x} y1={GROUND} x2={x - 8} y2={GROUND + 9} className="build-tick" />
                ))}
              </g>

              {/* Plate and mark travel together: once the crane is off the sheet
                  they settle to the middle of it, so the final frame is a
                  centred logo and not one parked to one side. */}
              <g data-settle="">
                  <g data-platform="" className="build-platform">
                  <ellipse cx={CENTRE} cy={GROUND - 2} rx={PLATE_W * 0.95} ry="13" fill="url(#build-shadow)" />
                  <rect
                    x={CENTRE - PIER_W / 2}
                    y={PLATE_TOP + 22}
                    width={PIER_W}
                    height={GROUND - PLATE_TOP - 22}
                    fill="url(#build-pier)"
                  />
                  <g className="build-plat-rib">
                    {Array.from({ length: 7 }, (_, i) => CENTRE - PIER_W / 2 + ((i + 1) * PIER_W) / 8).map((x) => (
                      <line key={x} x1={x} y1={PLATE_TOP + 28} x2={x} y2={GROUND - 6} />
                    ))}
                  </g>
                  <rect x={PLATE_X} y={PLATE_TOP} width={PLATE_W} height="22" fill="url(#build-plate)" />
                  <line x1={PLATE_X} y1={PLATE_TOP} x2={PLATE_X + PLATE_W} y2={PLATE_TOP} className="build-plat-edge" />
                  <line
                    x1={PLATE_X + 6}
                    y1={PLATE_TOP + 22}
                    x2={PLATE_X + PLATE_W - 6}
                    y2={PLATE_TOP + 22}
                    className="build-plat-under"
                  />
                  <g className="build-plat-bolt">
                    {[PLATE_X + 20, PLATE_X + 64, PLATE_X + PLATE_W - 64, PLATE_X + PLATE_W - 20].map((x) => (
                      <circle key={x} cx={x} cy={PLATE_TOP + 11} r="3.2" />
                    ))}
                  </g>
                  <g data-dims="" className="build-dims">
                    <line x1={PLATE_X} y1={GROUND + 26} x2={PLATE_X + PLATE_W} y2={GROUND + 26} className="build-dim" />
                    <line x1={PLATE_X} y1={GROUND + 20} x2={PLATE_X} y2={GROUND + 32} className="build-dim" />
                    <line
                      x1={PLATE_X + PLATE_W}
                      y1={GROUND + 20}
                      x2={PLATE_X + PLATE_W}
                      y2={GROUND + 32}
                      className="build-dim"
                    />
                  </g>
                </g>

                {/* ══ THE MARK ══════════════════════════════════════════════
                    Authored complete. The survey line beneath it is the mark's
                    own envelope, from the same file — nothing redrawn. */}
                <g transform={`translate(${MARK_TX} ${MARK_TY}) scale(${MARK_S})`}>
                  <g data-setout-group="" className="build-setout">
                    {MARK_OUTLINE_PATHS.map((d, i) => (
                      <path key={i} data-setout="" d={d} />
                    ))}
                  </g>

                  <g className="build-mark-static" fill="url(#build-brass)">
                    {STATIC_PATHS.map((i) => (
                      <path key={i} d={MARK_PATHS[i]} />
                    ))}
                  </g>

                  {/* eleven pieces, each flown onto its own seat */}
                  {PIECES.map((p) => {
                    const d = p.kind === "path" ? MARK_PATHS[p.index] : MARK_ACCENT_PATHS[p.index];
                    return (
                      <g key={`${p.kind}-${p.index}`} data-piece="" data-stage={p.stage} className="build-piece">
                        <path d={d} fill={p.kind === "path" ? "url(#build-brass)" : "url(#build-enamel)"} />
                        <path data-seat="" d={d} className="build-seat" />
                      </g>
                    );
                  })}

                  {/* the finishing sweep, held inside the completed mark */}
                  <g clipPath="url(#build-mark-clip)">
                    <rect data-finish="" className="build-finish" x="150" y="60" width="150" height="780" fill="url(#build-finish)" />
                  </g>
                </g>
              </g>

              {/* ══ THE PENCIL ════════════════════════════════════════════
                  A drafting instrument, not a character. It is carried onto
                  the board, held to the line while the envelope is set out —
                  its tip driven from the same proxy as the line's own dash
                  offset, so the two can never come apart — and lifted clear
                  before any plant arrives. It does not bounce, tilt, hurry or
                  react to anything. The only thing it does is the one thing a
                  pencil does: the line appears at its point. */}
              <g data-pencil="" className="build-pencil">
                <path d={PENCIL.barrel} className="build-pencil-barrel" />
                <path d={PENCIL.cap} className="build-pencil-cap" />
                <path d={PENCIL.ferrule} className="build-pencil-ferrule" />
                <path d={PENCIL.cone} className="build-pencil-wood" />
                <path d={PENCIL.lead} className="build-pencil-lead" />
                <path d={PENCIL.facetA} className="build-pencil-facet" />
                <path d={PENCIL.facetB} className="build-pencil-facet" />
              </g>

              {/* ══ SETTING-OUT AND LANDING ═══════════════════════════════
                  One rig each, moved to whichever piece is being placed. */}
              <g data-guide="" className="build-guide">
                <line data-guide-drop="" x1="0" y1="-100" x2="0" y2="-6" className="build-guide-drop" />
                <line data-guide-mark="" x1="-40" y1="0" x2="40" y2="0" className="build-guide-mark" />
                <line x1="-9" y1="-9" x2="9" y2="9" className="build-guide-cross" />
                <line x1="9" y1="-9" x2="-9" y2="9" className="build-guide-cross" />
              </g>

              <g data-land="" className="build-land">
                <circle data-land-ring="" cx="0" cy="0" r="26" className="build-land-ring" />
                <g data-land-dust="" className="build-land-dust">
                  <ellipse cx="-19" cy="-2" rx="10" ry="4.5" />
                  <ellipse cx="19" cy="-2" rx="10" ry="4.5" />
                  <ellipse cx="0" cy="-5" rx="14" ry="5.5" />
                </g>
                <line data-land-seam="" x1="-40" y1="0" x2="40" y2="0" className="build-land-seam" />
              </g>

              {/* ══ THE PLANT ═════════════════════════════════════════════
                  A tower crane, drawn in steel from its own numbers. It owes
                  nothing to the brand mark, it stands well clear of the plot,
                  and when the work is finished it leaves the sheet. */}
              <g data-crane="" className="build-crane">
                {/* laydown zone — where the pieces are stacked before the lift */}
                <g data-yard="" className="build-yard">
                  <rect x={YARD_X0} y={GROUND - 30} width={YARD_X1 - YARD_X0} height="30" className="build-yard-zone" />
                  {[0, 1, 2].map((i) => (
                    <rect
                      key={i}
                      x={YARD_X0 + 16 + i * 6}
                      y={GROUND - 9 - i * 7}
                      width={YARD_X1 - YARD_X0 - 32 - i * 12}
                      height="6"
                      className="build-yard-bar"
                    />
                  ))}
                </g>

                {/* ballast and base frame */}
                <g data-crane-base="" className="build-crane-base">
                  <ellipse cx={MAST_X} cy={GROUND - 1} rx="96" ry="10" fill="url(#build-shadow)" />
                  <rect x={MAST_X - 82} y={GROUND - 17} width="164" height="17" className="build-ballast-a" />
                  <rect x={MAST_X - 60} y={GROUND - 30} width="120" height="14" className="build-ballast-b" />
                  <rect x={MAST_X - 28} y={GROUND - 42} width="56" height="13" className="build-ballast-c" />
                  <g className="build-crane-bolt">
                    {[MAST_X - 20, MAST_X - 7, MAST_X + 7, MAST_X + 20].map((x) => (
                      <circle key={x} cx={x} cy={GROUND - 35} r="2.4" />
                    ))}
                  </g>
                </g>

                {/* the mast: two chords, ties, and X bracing between them */}
                <g data-mast="" className="build-mast">
                  <line x1={MAST_X - MAST_HALF} y1={MAST_TOP} x2={MAST_X - MAST_HALF} y2={MAST_FOOT} className="build-chord" />
                  <line x1={MAST_X + MAST_HALF} y1={MAST_TOP} x2={MAST_X + MAST_HALF} y2={MAST_FOOT} className="build-chord" />
                  {MAST_ROWS.map((y) => (
                    <g key={y}>
                      <line x1={MAST_X - MAST_HALF} y1={y} x2={MAST_X + MAST_HALF} y2={y} className="build-tie" />
                      <line
                        x1={MAST_X - MAST_HALF}
                        y1={y}
                        x2={MAST_X + MAST_HALF}
                        y2={y + MAST_PANEL_H}
                        className="build-brace"
                      />
                      <line
                        x1={MAST_X + MAST_HALF}
                        y1={y}
                        x2={MAST_X - MAST_HALF}
                        y2={y + MAST_PANEL_H}
                        className="build-brace"
                      />
                    </g>
                  ))}
                  <line x1={MAST_X - MAST_HALF} y1={MAST_FOOT} x2={MAST_X + MAST_HALF} y2={MAST_FOOT} className="build-tie" />
                </g>

                {/* turntable, machinery deck and the operator's cab */}
                <g data-slew="" className="build-slew">
                  <rect x={MAST_X - 24} y={MAST_TOP - 18} width="48" height="18" className="build-slew-ring" />
                  <rect x={MAST_X - 30} y={JIB_BOT} width="60" height="12" className="build-slew-deck" />
                  <g className="build-cab">
                    <rect x={MAST_X + 21} y={JIB_BOT + 14} width="26" height="28" rx="2" />
                    <rect x={MAST_X + 25} y={JIB_BOT + 18} width="18" height="14" className="build-cab-glass" />
                  </g>
                </g>

                {/* counter-jib and counterweight */}
                <g data-cjib="" className="build-cjib">
                  <line x1={CJIB_END} y1={JIB_TOP + 8} x2={MAST_X - MAST_HALF} y2={JIB_TOP + 8} className="build-chord" />
                  <line x1={CJIB_END} y1={JIB_BOT} x2={MAST_X - MAST_HALF} y2={JIB_BOT} className="build-chord" />
                  {CJIB_COLS.map((x) => (
                    <g key={x}>
                      <line x1={x} y1={JIB_TOP + 8} x2={x} y2={JIB_BOT} className="build-tie" />
                      <line x1={x} y1={JIB_BOT} x2={x + CJIB_PANEL_W} y2={JIB_TOP + 8} className="build-brace" />
                    </g>
                  ))}
                  <g data-ballast="" className="build-counterweight">
                    <rect x={CJIB_END + 2} y={JIB_BOT - 2} width="44" height="32" />
                    <line x1={CJIB_END + 16} y1={JIB_BOT + 3} x2={CJIB_END + 16} y2={JIB_BOT + 25} />
                    <line x1={CJIB_END + 31} y1={JIB_BOT + 3} x2={CJIB_END + 31} y2={JIB_BOT + 25} />
                  </g>
                </g>

                {/* the jib: the long reach out over the plot */}
                <g data-jib="" className="build-jib">
                  <line x1={MAST_X + MAST_HALF} y1={JIB_TOP} x2={JIB_END} y2={JIB_TOP} className="build-chord" />
                  <line x1={MAST_X + MAST_HALF} y1={JIB_BOT} x2={JIB_END} y2={JIB_BOT} className="build-chord" />
                  {JIB_COLS.map((x) => (
                    <g key={x}>
                      <line x1={x} y1={JIB_TOP} x2={x} y2={JIB_BOT} className="build-tie" />
                      <line x1={x} y1={JIB_BOT} x2={x + JIB_PANEL_W} y2={JIB_TOP} className="build-brace" />
                    </g>
                  ))}
                  <line x1={JIB_END} y1={JIB_TOP} x2={JIB_END} y2={JIB_BOT} className="build-tie" />
                </g>

                {/* the apex, and the pendants that hold both jibs up */}
                <g data-apex="" className="build-apex">
                  <line x1={MAST_X - MAST_HALF} y1={JIB_TOP} x2={MAST_X} y2={APEX_Y} className="build-chord" />
                  <line x1={MAST_X + MAST_HALF} y1={JIB_TOP} x2={MAST_X} y2={APEX_Y} className="build-chord" />
                  <line
                    x1={MAST_X - MAST_HALF * 0.6}
                    y1={APEX_Y + (JIB_TOP - APEX_Y) * 0.55}
                    x2={MAST_X + MAST_HALF * 0.6}
                    y2={APEX_Y + (JIB_TOP - APEX_Y) * 0.55}
                    className="build-tie"
                  />
                  <circle cx={MAST_X} cy={APEX_Y - 5} r="3" className="build-apex-lamp" />
                </g>
                <g className="build-pendants">
                  <line data-pendant="" x1={MAST_X} y1={APEX_Y + 3} x2={PENDANT_X} y2={JIB_TOP} />
                  <line data-pendant="" x1={PENDANT_X} y1={JIB_TOP} x2={JIB_END - 22} y2={JIB_TOP} />
                  <line data-pendant="" x1={MAST_X} y1={APEX_Y + 3} x2={CJIB_END + 26} y2={JIB_TOP + 8} />
                </g>

                {/* the rig: trolley on the jib, rope, hook block and slings */}
                <g data-hoist="" className="build-hoist">
                  <g data-trolley="" transform={`translate(0 ${JIB_BOT})`}>
                    <g className="build-trolley">
                      <rect x="-17" y="-4" width="34" height="13" rx="1.5" />
                      <circle cx="-11" cy="-4" r="3.2" />
                      <circle cx="11" cy="-4" r="3.2" />
                    </g>
                    <line data-rope="" className="build-rope" x1="-3.5" y1="6" x2="-3.5" y2="6" />
                    <line data-rope="" className="build-rope" x1="3.5" y1="6" x2="3.5" y2="6" />
                    <g data-hook="" className="build-hook">
                      <rect x="-12" y="-5" width="24" height="10" rx="1.5" />
                      <circle cx="0" cy="0" r="2.6" className="build-hook-sheave" />
                      <path d="M0 5 v7 a5.5 5.5 0 1 0 -4.6 -4.6" className="build-hook-tip" />
                      <g data-sling="" className="build-sling">
                        <line data-sling-l="" x1="0" y1="5" x2="-24" y2={HOOK_GAP} />
                        <line data-sling-r="" x1="0" y1="5" x2="24" y2={HOOK_GAP} />
                      </g>
                    </g>
                  </g>
                </g>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
