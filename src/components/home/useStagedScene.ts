"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * A section held on screen while a fixed frame is stepped through.
 *
 * The frame does not move. That is the whole point of it, and the thing that
 * separates this from a card that slides in: what changes is the *contents*
 * of a panel that stays exactly where it is, wiped through with a clip so the
 * swap reads as a sheet being changed under a fixed reading frame rather than
 * as an object flying about the page.
 *
 * The hook owns the awkward parts — deciding whether there is room to stage
 * at all, holding the sheet, reporting which item is live, and letting a
 * marker put the scroll on a given item — and leaves the composition entirely
 * to the caller. Two sections use it and they look nothing alike.
 *
 * Degradation is the caller's authored state: until this decides otherwise
 * `staged` is false, and every rule that hides anything must be keyed on it.
 */

export type StagedScene = {
  /** Index of the item currently in the frame. */
  at: number;
  /** Whether the sheet is being held, or the section is an ordinary list. */
  staged: boolean;
  /** Put the scroll on an item's own beat. */
  goTo: (i: number) => void;
};

export function useStagedScene({
  root,
  count,
  /**
   * Whether this section may hold a sheet at all. A caller passes `false` to
   * stay in its own authored static state at every width — which is a real
   * choice, not a fallback: the static composition is complete, and a page
   * that stages two sections in a row makes the device read as a habit
   * rather than as emphasis.
   */
  enabled = true,
  /** Scroll before the first item locks in, as a share of one item's beat. */
  lead = 0.45,
  /** And after the last, so it is plainly read before the sheet is let go. */
  tail = 0.4,
  /**
   * How much scroll one item's beat is worth, as a share of the viewport.
   * Retuned from 62 to 37: a held sheet is read in place, so the beat only
   * has to be long enough to register the swap and read the panel — past
   * that it is the reader waiting for the page rather than the other way
   * round.
   */
  beat = 37,
  /** Called once per item with its own timeline and beat, to stage it. */
  stage,
}: {
  root: RefObject<HTMLElement | null>;
  count: number;
  enabled?: boolean;
  lead?: number;
  tail?: number;
  beat?: number;
  stage: (ctx: {
    tl: gsap.core.Timeline;
    items: HTMLElement[];
    /** +1 in English, -1 in Arabic. The reading axis. */
    dir: 1 | -1;
    /** Where item `i`'s beat begins on the timeline. */
    baseOf: (i: number) => number;
  }) => void;
}): StagedScene {
  const span = useRef<{ start: number; length: number } | null>(null);
  const [at, setAt] = useState(0);
  const [staged, setStaged] = useState(false);

  /* Whether there is room to hold a sheet. State rather than a one-off read:
     the answer changes when a window is dragged or a tablet turned. */
  useEffect(() => {
    if (!enabled) {
      setStaged(false);
      return;
    }
    const room = window.matchMedia("(min-width: 1000px) and (min-height: 640px)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const decide = () =>
      setStaged(
        room.matches &&
          !still.matches &&
          !document.documentElement.classList.contains("reduced-motion")
      );
    decide();
    room.addEventListener("change", decide);
    still.addEventListener("change", decide);
    return () => {
      room.removeEventListener("change", decide);
      still.removeEventListener("change", decide);
    };
  }, [enabled]);

  useEffect(() => {
    const el = root.current;
    if (!el || !count) return;

    if (!staged) {
      el.dataset.motion = "static";
      span.current = null;
      setAt(0);
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    el.dataset.motion = "scroll";

    const ctx = gsap.context(() => {
      const pin = el.querySelector<HTMLElement>("[data-pin]");
      const items = gsap.utils.toArray<HTMLElement>("[data-item]");
      if (!pin || !items.length) return;

      const dir: 1 | -1 =
        getComputedStyle(document.documentElement).direction === "rtl" ? -1 : 1;
      const total = lead + count + tail;
      const baseOf = (i: number) => lead + i;

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: `+=${Math.round(total * beat)}%`,
          scrub: 0.5,
          pin,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: (self) => {
            span.current = { start: self.start, length: self.end - self.start };
          },
          onUpdate: (self) => {
            const p = self.progress * total;
            /* The count changes over when the incoming item is more than half
               through the frame — the moment the sheet has visibly been
               changed, not the moment the tween was scheduled. */
            setAt(Math.min(count - 1, Math.max(0, Math.floor(p - lead + 0.07))));
          },
        },
      });

      stage({ tl, items, dir, baseOf });

      /* Dead scroll at the end. A scrubbed timeline trails the scroll, so
         without it the last item locks in as the sheet is already released. */
      tl.to({ hold: 0 }, { hold: 1, duration: tail }, lead + count);
    }, el);

    return () => ctx.revert();
    // `stage` is redefined on every render by design; the scene is rebuilt
    // only when the things that change its shape do.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staged, count, lead, tail, beat, root]);

  const goTo = useCallback(
    (i: number) => {
      const s = span.current;
      if (!s) return;
      const total = lead + count + tail;
      const y = s.start + ((lead + i + 0.35) / total) * s.length;
      const lenis = (
        window as unknown as { __lenis?: { scrollTo: (y: number, o?: object) => void } }
      ).__lenis;
      if (lenis) lenis.scrollTo(y, { duration: 0.9 });
      else window.scrollTo({ top: y, behavior: "smooth" });
    },
    [count, lead, tail]
  );

  return { at, staged, goTo };
}

/**
 * The clip a panel's contents are wiped through.
 *
 * A sheet under a fixed frame is changed by wiping, not by sliding: the frame
 * is the one thing that must not move. The wipe travels the way the language
 * is read, so in Arabic it opens from the right and in English from the left,
 * and it leaves towards the far side — one movement passing through the
 * frame rather than two objects crossing inside it.
 */
export const wipe = {
  /** Closed, waiting to be opened from the reading edge. */
  shut: (dir: 1 | -1) => (dir === 1 ? "inset(0% 100% 0% 0%)" : "inset(0% 0% 0% 100%)"),
  /** Fully open. */
  open: "inset(0% 0% 0% 0%)",
  /** Closed again, on the far side. */
  past: (dir: 1 | -1) => (dir === 1 ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)"),
};
