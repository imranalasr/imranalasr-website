"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * The reader's position in the document, held on the edge of the page.
 *
 * The home page is five chapters long and each one is a substantial scene, so
 * without a fixed reference the reader loses the thread of how much document
 * is left — the same problem a long report solves with a running head. This is
 * that running head: the chapter numbers stacked on the outer margin, the
 * current one lit and named, and a hairline that fills as the chapter is read.
 *
 * Three rules keep it furniture rather than chrome:
 *
 *  · It is never the way in. Every chapter it lists is reachable by scrolling
 *    and by the site navigation; this only ever *reports*. The markers are
 *    still buttons, because a reader who can see a target expects to be able
 *    to move to it, but nothing here is the sole route to anything.
 *  · It stays out of the type. It sits in the page's outer margin, at the
 *    edge the language is read *from*, so the eye never has to cross it.
 *  · It says nothing twice. The counted markers inside it are hidden from
 *    assistive technology — each chapter is announced by its name, which is
 *    the same name the section's own heading carries — and nothing here is
 *    a live region, so a scroll does not narrate itself.
 *
 * Measured the way the header measures its own surface — one rAF-throttled
 * read of the sections' rectangles — rather than through ScrollTrigger. It
 * has no timeline, so it wants a position, not a scrub, and this keeps it
 * working identically under reduced motion, where ScrollTrigger stands down.
 */
/**
 * A pinned section lies about where it is.
 *
 * While ScrollTrigger holds one, the element itself is `position: fixed` and
 * reports the same rectangle for the whole of its hold; the scroll it actually
 * occupies belongs to the spacer wrapped around it. Read the section directly
 * and the rail freezes its hairline part-filled for four viewports, and the
 * marker jumps to the *end* of the sequence rather than its start. So both the
 * measurement and the jump use whichever of the two carries the real extent.
 */
function spacer(section: HTMLElement) {
  return section.closest<HTMLElement>(".pin-spacer") ?? section;
}

function extent(section: HTMLElement) {
  return spacer(section).getBoundingClientRect();
}

export default function ChapterRail({ t }: { t: Dictionary }) {
  const chapters = t.home.chapters;
  const [active, setActive] = useState(-1);
  /** 0…1 through the active chapter. Drives the hairline only. */
  const [within, setWithin] = useState(0);
  const [shown, setShown] = useState(false);
  /**
   * The rail is fixed to the viewport, so it sits outside every section and
   * inherits none of their surface tokens — left to itself it would be set in
   * the light surface's charcoal over a dark section, which is to say
   * invisible. It therefore reads the ground behind it and colours itself,
   * exactly as the site header does.
   */
  const [tone, setTone] = useState<"light" | "ink">("light");
  /**
   * Nothing is rendered until the rail is live.
   *
   * Its markers move the page, which is something only script can do, so
   * server-rendering them would leave a reader without JavaScript a labelled
   * navigation landmark holding five buttons that do nothing. It is furniture
   * for a working page; on a page that is not working it should not exist.
   */
  const [live, setLive] = useState(false);

  useEffect(() => {
    let raf = 0;
    setLive(true);

    const measure = () => {
      raf = 0;
      const sections = Array.from(
        document.querySelectorAll<HTMLElement>("[data-chapter]")
      ).sort((a, b) => Number(a.dataset.chapter) - Number(b.dataset.chapter));
      if (!sections.length) return;

      /* The line the reader is actually reading at — a third of the way down
         the viewport, not its top edge, so a chapter registers when it has
         arrived rather than when it has merely appeared. */
      const line = window.innerHeight * 0.34;

      let current = -1;
      let progress = 0;
      for (const s of sections) {
        const r = extent(s);
        if (r.top <= line && r.bottom > line) {
          current = Number(s.dataset.chapter);
          progress = Math.min(1, Math.max(0, (line - r.top) / Math.max(1, r.height)));
        }
      }

      /* The ground behind the rail, read at the rail's own middle. */
      const mid = window.innerHeight / 2;
      let ground: "light" | "ink" = "light";
      for (const s of document.querySelectorAll<HTMLElement>("[data-surface-section]")) {
        const r = s.getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) {
          const kind = s.dataset.surfaceSection;
          ground = kind === "ink" || kind === "teal" || kind === "forest" ? "ink" : "light";
        }
      }
      setTone(ground);

      /* Shown between the first chapter and the last one's end: it has no
         business over the hero, which is the cover, or over the closing call
         to action, which is a destination rather than a chapter. */
      const first = extent(sections[0]);
      const last = extent(sections[sections.length - 1]);
      setShown(first.top <= line && last.bottom > 0);
      setActive(current);
      setWithin(progress);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const goTo = (i: number) => {
    const target = document.querySelector<HTMLElement>(`[data-chapter="${i}"]`);
    if (!target) return;
    const box = spacer(target);
    const lenis = (window as unknown as { __lenis?: { scrollTo: (t: Element, o?: object) => void } })
      .__lenis;
    /* Measured off the masthead, which has three heights; a fixed offset is
       wrong in at least one of them and puts the heading under the bar. */
    const header = document.querySelector<HTMLElement>(".site-header");
    const clear = (header?.offsetHeight ?? 104) + 16;
    if (lenis) lenis.scrollTo(box, { offset: -clear });
    else box.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!live) return null;

  return (
    <nav
      className="chapter-rail"
      data-shown={shown}
      data-tone={tone}
      aria-label={t.home.chaptersLabel}
    >
      <ol className="chapter-rail-list">
        {chapters.map((c, i) => (
          <li
            key={c.index}
            className="chapter-rail-item"
            data-active={i === active}
            data-passed={i < active}
            style={{ "--within": i === active ? within : i < active ? 1 : 0 } as React.CSSProperties}
          >
            <button type="button" className="chapter-rail-btn" onClick={() => goTo(i)}>
              <span className="tabular chapter-rail-index" dir="ltr" aria-hidden="true">
                {c.index}
              </span>
              <span className="chapter-rail-tick" aria-hidden="true" />
              <span className="chapter-rail-label">{c.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
