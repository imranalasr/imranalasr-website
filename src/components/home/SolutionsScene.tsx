"use client";

import Link from "next/link";
import { useCallback, useRef } from "react";
import type { gsap } from "gsap";
import ServiceDiagram from "./ServiceDiagram";
import Seq from "@/components/Seq";
import { useStagedScene, wipe } from "./useStagedScene";
import { href, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * One offer at a time, under a frame that does not move.
 *
 * The section is not four things laid out; it is one reading frame that four
 * packages pass through. The composition follows from that and not from a
 * grid:
 *
 *  · The frame is a band across the sheet, split between the words and the
 *    drawing. The drawing is a detail layer bled into the far side of the
 *    band and cut by the band's own rules — not an icon in a box, and not a
 *    picture with a border round it.
 *  · The registered groups are compact tags in a row under the description,
 *    each carrying the real count of activities it holds on the commercial
 *    register. A tag is a fact; a card would be a container looking for
 *    something to hold.
 *  · All four are listed underneath as slim tabs with a brass bar under the
 *    live one. They are the progress and the way through at once.
 *  · The margin carries the count and a rule that fills across the four.
 *
 * The hand-over is a clip wipe travelling the way the language is read, so
 * the change reads as a sheet being drawn under a fixed frame rather than as
 * a card sliding in from the side — which is the one thing this section must
 * not look like.
 *
 * Degradation is the authored state: all four packages are rendered in full,
 * in order, before a line of this runs. On a phone, with no script, or under
 * reduced motion the section is a dense stepped list and nothing is hidden.
 */

export type Pack = {
  key: string;
  index: string;
  title: string;
  outcome: string;
  /** The first group's slug: the drawing issued for this package. */
  diagram: string;
  groups: { slug: string; title: string; activities: number }[];
};

export default function SolutionsScene({
  locale,
  t,
  packs,
}: {
  locale: Locale;
  t: Dictionary;
  packs: Pack[];
}) {
  const root = useRef<HTMLElement>(null);
  const n = packs.length;

  const stage = useCallback(
    ({
      tl,
      items,
      dir,
      baseOf,
    }: {
      tl: gsap.core.Timeline;
      items: HTMLElement[];
      dir: 1 | -1;
      baseOf: (i: number) => number;
    }) => {
      items.forEach((item, i) => {
        const base = baseOf(i);

        tl.fromTo(
          item,
          { clipPath: wipe.shut(dir), opacity: 1, pointerEvents: "none" },
          { clipPath: wipe.open, pointerEvents: "auto", duration: 0.34, ease: "power3.inOut" },
          base - 0.2
        )
          /* The name is set a beat behind the wipe edge; the tags follow it
             one at a time. The words are placed on the sheet, not carried
             onto it. */
          .fromTo(
            item.querySelector(".sol-name"),
            { y: 16, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.24, ease: "power2.out" },
            base - 0.06
          )
          .fromTo(
            item.querySelectorAll(".sol-tag"),
            { y: 10, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.2, stagger: 0.05, ease: "power2.out" },
            base + 0.02
          )
          /* The drawing is the plane behind the words: it comes up rather
             than across, so the two never read as one object moving. */
          .fromTo(
            item.querySelector(".sol-detail"),
            { opacity: 0, scale: 0.985 },
            { opacity: 1, scale: 1, duration: 0.32, ease: "power2.out" },
            base - 0.12
          );

        if (i < items.length - 1) {
          const leave = base + 0.8;
          tl.to(item, { clipPath: wipe.past(dir), duration: 0.3, ease: "power3.inOut" }, leave).to(
            item,
            { pointerEvents: "none", duration: 0.01 },
            leave + 0.3
          );
        }
      });
    },
    []
  );

  const { at, goTo } = useStagedScene({ root, count: n, beat: 62, stage });

  if (!n) return null;
  const arrow = locale === "ar" ? "←" : "→";

  return (
    <section
      ref={root}
      className="section vscene solutions-section"
      data-surface-section="light"
      data-seam="forest"
      data-motion="static"
      data-chapter="4"
      aria-labelledby="solutions-title"
    >
      <div className="vscene-pin" data-pin="">
        <div className="page vscene-inner">
          <header className="vscene-head">
            <div>
              <p className="eyebrow" data-reveal="up">
                {t.home.servicesEyebrow}
                <Seq n={5} of={t.home.chapters.length} className="eyebrow-seq" />
              </p>
              <h2 id="solutions-title" className="vscene-title" data-reveal="up">
                {t.home.servicesTitle}
              </h2>
            </div>
            <p className="vscene-lead" data-reveal="up">
              {t.home.servicesLead}
            </p>
          </header>

          <div className="vscene-stage">
            <div className="vscene-progress" aria-hidden="true">
              <span className="tabular vscene-progress-n" dir="ltr">
                {String(at + 1).padStart(2, "0")}
              </span>
              <span className="vscene-progress-rule">
                <span
                  className="vscene-progress-fill"
                  style={{ transform: `scaleY(${n > 1 ? at / (n - 1) : 1})` }}
                />
              </span>
              <span className="tabular vscene-progress-of" dir="ltr">
                {String(n).padStart(2, "0")}
              </span>
            </div>

            <div className="vscene-panel sol-panel">
              <ol className="vscene-slots">
                {packs.map((p, i) => (
                  <li key={p.key} className="sol-slot" data-item={i} data-live={i === at || undefined}>
                    <div className="sol-body">
                      <p className="sol-bar">
                        <Seq n={p.index} of={n} className="sol-bar-seq" />
                      </p>
                      <h3 className="sol-name">{p.title}</h3>
                      <p className="sol-outcome">{p.outcome}</p>

                      <p className="sol-tags-label">{t.home.solutionsScopeLabel}</p>
                      <ul className="sol-tags">
                        {p.groups.map((g) => (
                          <li key={g.slug}>
                            <Link href={href(`/services#${g.slug}`, locale)} className="sol-tag">
                              <span className="sol-tag-title">{g.title}</span>
                              <span className="tabular sol-tag-count">
                                {g.activities} {t.common.registeredActivities}
                              </span>
                              <span className="sol-tag-arrow" aria-hidden="true">
                                {arrow}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* The detail layer: the drawing issued for this group of
                        work, bled into the far side of the band and cut by
                        the band's own rules. */}
                    <span className="sol-detail" aria-hidden="true">
                      <ServiceDiagram slug={p.diagram} />
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <ol className="vscene-tabs">
            {packs.map((p, i) => (
              <li key={p.key} data-active={i === at || undefined}>
                <button type="button" className="vscene-tab" onClick={() => goTo(i)}>
                  <span className="tabular vscene-tab-index" dir="ltr">
                    {p.index}
                  </span>
                  <span className="vscene-tab-name">{p.title}</span>
                  <span className="tabular vscene-tab-meta">
                    {p.groups.reduce((sum, g) => sum + g.activities, 0)}{" "}
                    {t.common.registeredActivities}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="page vscene-foot">
        <Link href={href("/services", locale)} className="btn btn-ghost">
          {t.common.allServices}
          <span className="arrow" aria-hidden="true">
            {arrow}
          </span>
        </Link>
      </div>
    </section>
  );
}
