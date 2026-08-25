"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * The capability ledger, staged.
 *
 * The four claims used to sit in a two-by-two box grid, which is the shape a
 * page reaches for when it has nothing to say about the order of its
 * contents. These four are not interchangeable tiles: they are a ledger, read
 * top to bottom, and each one is a separate undertaking the company can be
 * held to. So they are set out as numbered rows and each one *arrives* —
 * pulled in from the margin of the page and aligned against the spine as the
 * reader reaches it.
 *
 * Three rules, and they are the same three the rest of the page is built on:
 *
 *  · The scroll is the clock. Every row is scrubbed against its own position,
 *    not fired once by a trigger, so a row that is halfway up the screen is
 *    halfway into place — and scrolling back up puts it back. Nothing pops.
 *  · Depth is the only stagger. Rows come from the same edge at the same
 *    rate; what separates them is where they are, which is the one thing the
 *    reader can already see.
 *  · The words never wait for the motion. Every row is in the HTML, in order,
 *    fully readable, before a line of this runs — see `data-motion`, which is
 *    only set to `scroll` once this component has decided to animate. Without
 *    JavaScript, under reduced motion, or on a phone, the ledger is simply a
 *    ledger.
 */
export default function CapabilityScene({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    /* Wide enough that a row has a margin to come in from, and not asked for
       reduced motion. A phone has no margin to spare and the ledger is
       already the right shape there. */
    const room = window.matchMedia("(min-width: 900px)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");

    let ctx: gsap.Context | null = null;

    const decide = () => {
      ctx?.revert();
      ctx = null;

      if (
        !room.matches ||
        still.matches ||
        document.documentElement.classList.contains("reduced-motion")
      ) {
        el.dataset.motion = "static";
        return;
      }

      gsap.registerPlugin(ScrollTrigger);
      el.dataset.motion = "scroll";

      ctx = gsap.context(() => {
        const rows = gsap.utils.toArray<HTMLElement>("[data-row]");
        if (!rows.length) return;

        /* The rows are pulled from the trailing margin — the side the page is
           read *towards* — so they arrive across the reader's path rather
           than out of the corner they started reading from. GSAP's x is
           screen space, so the sign has to be taken from the document. */
        const dir = getComputedStyle(document.documentElement).direction === "rtl" ? -1 : 1;

        rows.forEach((row) => {
          gsap.fromTo(
            row,
            { x: 84 * dir, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              ease: "none",
              scrollTrigger: {
                trigger: row,
                start: "top 94%",
                end: "top 64%",
                scrub: 0.7,
                invalidateOnRefresh: true,
              },
            }
          );

          /* The row's own rule runs out from the index towards the margin as
             it lands: the line is the row arriving, not a border it happens
             to have. */
          const rule = row.querySelector(".cap-row-rule");
          if (rule) {
            gsap.fromTo(
              rule,
              { scaleX: 0 },
              {
                scaleX: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: row,
                  start: "top 92%",
                  end: "top 66%",
                  scrub: 0.7,
                  invalidateOnRefresh: true,
                },
              }
            );
          }
        });

        /* The spine, drawn down the ledger as it is read. It is what makes
           four separate rows one document. */
        const spine = el.querySelector<HTMLElement>(".cap-spine-fill");
        const ledger = el.querySelector<HTMLElement>(".capability-ledger");
        if (spine && ledger) {
          gsap.fromTo(
            spine,
            { scaleY: 0 },
            {
              scaleY: 1,
              ease: "none",
              scrollTrigger: {
                trigger: ledger,
                start: "top 80%",
                end: "bottom 72%",
                scrub: 0.7,
                invalidateOnRefresh: true,
              },
            }
          );
        }

        /* Whichever row is being read carries the light. Measured off the
           same reading line the chapter rail uses, so the page agrees with
           itself about where the reader is looking. */
        ScrollTrigger.create({
          trigger: ledger ?? el,
          start: "top bottom",
          end: "bottom top",
          onUpdate: () => {
            const line = window.innerHeight * 0.46;
            let live = -1;
            rows.forEach((row, i) => {
              const r = row.getBoundingClientRect();
              if (r.top <= line && r.bottom > line) live = i;
            });
            rows.forEach((row, i) => {
              if (i === live) row.setAttribute("data-live", "true");
              else row.removeAttribute("data-live");
            });
          },
        });
      }, el);
    };

    decide();
    room.addEventListener("change", decide);
    still.addEventListener("change", decide);
    return () => {
      room.removeEventListener("change", decide);
      still.removeEventListener("change", decide);
      ctx?.revert();
    };
  }, []);

  return (
    <section
      ref={root}
      className="section capability-section"
      data-surface="stone"
      data-surface-section="light"
      data-seam="ink"
      data-motion="static"
      data-chapter="1"
      aria-labelledby="capability-title"
    >
      {children}
    </section>
  );
}
