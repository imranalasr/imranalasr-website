"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Seq from "@/components/Seq";
import { useStagedScene, wipe } from "./useStagedScene";
import type { Credential } from "@/content/certifications";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * A verification interface, not a certificate card.
 *
 * The distinction is the whole section, and it shows in the composition long
 * before anything moves. A card is an object you look at; a verification
 * record is a fixed reading frame you look *through*.
 *
 *  · The panel is wide and horizontal, and its transcribed fields are a row
 *    of four columns rather than a stack of four rows. That is what a
 *    certificate's own data block looks like, and it is why the panel is a
 *    band across the sheet instead of a tall box marooned in the middle of
 *    it with its own height to fill.
 *  · The frame never moves. What changes is what is inside it: the contents
 *    are wiped through with a clip travelling the way the language is read,
 *    so a change of certificate reads as a sheet being changed under a fixed
 *    frame — not as a card flying in from the side.
 *  · All three documents are listed underneath as slim rows carrying their
 *    own certificate numbers, and the live one takes a brass bar. They are
 *    the navigation and the contents page at once, so nothing on the sheet
 *    is a list left disconnected from the thing it lists.
 *  · The margin carries progress: the live number at size, the total under
 *    it, and a rule that fills across the three. It counts. It does not
 *    repeat the list beside the list.
 *
 * Every number in the frame is transcribed from the certificate itself, and
 * all three are rendered in the HTML in full, in order, before a line of this
 * runs. On a phone, with no script, or under reduced motion the section is
 * three documents in a column — `data-motion` is only set to `scroll` once
 * there is room to hold a sheet, and every rule that hides anything is keyed
 * on it.
 */
export default function EvidenceScene({
  locale,
  t,
  systems,
  children,
}: {
  locale: Locale;
  t: Dictionary;
  systems: Credential[];
  /** The statutory register, rendered below the held sheet. */
  children: ReactNode;
}) {
  const root = useRef<HTMLElement>(null);
  const n = systems.length;

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
        const cells = item.querySelectorAll(".doc-cell");

        /* The sheet is wiped in under the frame … */
        tl.fromTo(
          item,
          { clipPath: wipe.shut(dir), opacity: 1, pointerEvents: "none" },
          { clipPath: wipe.open, pointerEvents: "auto", duration: 0.34, ease: "power3.inOut" },
          base - 0.2
        )
          /* … and the transcribed fields settle a beat behind the wipe edge,
             which is what makes the data read as being *set down* rather than
             as arriving with the frame. */
          .fromTo(
            cells,
            { y: 10, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.22, stagger: 0.035, ease: "power2.out" },
            base - 0.06
          )
          /* The brass rule across the head of the panel is the wipe's own
             timing made visible. */
          .fromTo(
            item.querySelector(".doc-scan"),
            { scaleX: 0 },
            { scaleX: 1, duration: 0.34, ease: "power3.inOut" },
            base - 0.2
          );

        /* Out the far side — one movement passing through the frame. */
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

  const { at, goTo } = useStagedScene({ root, count: n, beat: 40, stage });

  /**
   * The statutory register below the held sheet, drawn out row by row.
   *
   * Its own concern, deliberately: it is not part of the frame and it runs at
   * every width, including the ones where there is no sheet to hold — a
   * dashboard could unpublish every certified system and the register would
   * still be the block a procurement officer came for.
   */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const dir = getComputedStyle(document.documentElement).direction === "rtl" ? -1 : 1;
      gsap.utils.toArray<HTMLElement>("[data-register-row]").forEach((row) => {
        gsap.fromTo(
          row,
          { x: 40 * dir, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: row,
              start: "top 95%",
              end: "top 74%",
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          }
        );
        const rule = row.querySelector(".ledger-rule");
        if (rule) {
          gsap.fromTo(
            rule,
            { scaleX: 0 },
            {
              scaleX: 1,
              ease: "none",
              scrollTrigger: {
                trigger: row,
                start: "top 93%",
                end: "top 76%",
                scrub: 0.6,
                invalidateOnRefresh: true,
              },
            }
          );
        }
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      className="section vscene evidence-section"
      data-surface="forest"
      data-surface-section="forest"
      data-seam="ink"
      data-motion="static"
      data-chapter="3"
      aria-labelledby="evidence-title"
    >
      <div className="vscene-pin" data-pin="" hidden={n === 0}>
        <div className="page vscene-inner">
          <header className="vscene-head">
            <div>
              <p className="eyebrow" data-reveal="up">
                {t.home.qualityEyebrow}
                <Seq n={4} of={t.home.chapters.length} className="eyebrow-seq" />
              </p>
              <h2 id="evidence-title" className="vscene-title" data-reveal="up">
                {t.home.qualityTitle}
              </h2>
            </div>
            <p className="vscene-lead" data-reveal="up">
              {t.home.qualityLead}
            </p>
          </header>

          <div className="vscene-stage">
            {/* Progress, in the margin. It counts; it does not repeat the
                list that is already underneath the panel. */}
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

            {/* The frame. It does not move; its contents are wiped through. */}
            <div className="vscene-panel doc-panel">
              <ol className="vscene-slots">
                {systems.map((c, i) => (
                  <li key={c.id} className="doc-slot" data-item={i} data-live={i === at || undefined}>
                    <span className="doc-scan" aria-hidden="true" />

                    <div className="doc-bar">
                      <Seq n={i + 1} of={n} className="doc-bar-seq" />
                      <p className="tabular doc-bar-code">{c.code[locale]}</p>
                      {c.verifyUrl ? (
                        <a
                          className="doc-bar-verify"
                          href={c.verifyUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          {t.common.verifyAt} {c.verifyUrl.replace(/^https?:\/\//, "")}
                          <span aria-hidden="true"> ↗</span>
                        </a>
                      ) : null}
                    </div>

                    <h3 className="doc-name">{c.title[locale]}</h3>

                    {/* The data block, across the sheet — four columns, the
                        way a certificate prints it. */}
                    <dl className="doc-grid">
                      {c.facts.map((f) => (
                        <div key={f.label.en} className="doc-cell">
                          <dt>{f.label[locale]}</dt>
                          <dd className="tabular">{f.value}</dd>
                        </div>
                      ))}
                    </dl>

                    <p className="doc-issuer">
                      <span className="doc-issuer-label">{t.quality.issuerLabel}</span>
                      {c.issuer[locale]}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* The other documents, as slim rows. Navigation and contents page
              at once — never cards. */}
          <ol className="vscene-tabs">
            {systems.map((c, i) => (
              <li key={c.id} data-active={i === at || undefined}>
                <button type="button" className="vscene-tab" onClick={() => goTo(i)}>
                  <span className="tabular vscene-tab-index" dir="ltr">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="tabular vscene-tab-code">{c.code[locale]}</span>
                  <span className="vscene-tab-name">{c.title[locale]}</span>
                  <span className="tabular vscene-tab-meta">{c.facts[1]?.value ?? ""}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {children}
    </section>
  );
}
