import Link from "next/link";
import { href, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { company } from "@/content/company";
import HeroScene from "./HeroScene";
import HeroMark from "@/components/brand/HeroMark";
import { MaskLine } from "@/components/MaskLines";
import Magnetic from "@/components/motion/Magnetic";
import Seq from "@/components/Seq";

export type HeroStat = { key: string; n: number; label: string };

/**
 * First viewport.
 *
 * A split, not a centred stack: the company states itself on the reading side
 * — right in Arabic, left in English, which the logical grid handles on its
 * own — and the object holds the other half. Three things have to land before
 * anything else, so the column order is fixed: name, capability, action, with
 * the proof strip directly beneath so the claim and the evidence for it are
 * read together.
 *
 * The object is the company's own mark, presented as issued: cast solid, set
 * out on its own sheet, and standing still in a dark setting-out field of dot
 * grid and engineering rules. No photograph and no pattern competes with it,
 * because it is the brand itself — and here it is stated rather than
 * demonstrated. Nothing in this viewport moves, is assembled, or can be taken
 * hold of; the mark being erected piece by piece is the build section's own
 * business, further down the page.
 */
export default function Hero({
  locale,
  t,
  stats,
  statsLabel,
}: {
  locale: Locale;
  t: Dictionary;
  stats: HeroStat[];
  statsLabel: string;
}) {
  const lines = t.home.heroTitleLines;

  const facts = [
    { k: locale === "ar" ? "السجل التجاري" : "Commercial register", v: company.commercialRegistration },
    { k: locale === "ar" ? "أنظمة معتمدة" : "Certified systems", v: "ISO 9001 · 14001 · 45001" },
    { k: locale === "ar" ? "المقر" : "Head office", v: locale === "ar" ? "الرياض — الملز" : "Riyadh — Al Malaz" },
  ];

  return (
    <HeroScene>
      <div className="hero-canvas" aria-hidden="true">
        <span className="hero-dots" />
        <span className="blueprint-grid hero-grid" />
        <span className="hero-wash" />
      </div>

      <div className="page hero-inner">
        <div className="hero-copy">
          {/* The opening formula, set at the head of the page as it is set at
              the head of a written work. */}
          <p className="basmala" lang="ar" dir="rtl" data-reveal="fade">
            {t.home.basmala}
          </p>

          <h1 id="hero-title" className="eyebrow hero-eyebrow" data-reveal="up">
            {t.home.heroEyebrow}
          </h1>

          <p className="hero-title">
            {lines.map((line, i) => (
              <MaskLine key={i} delay={0.06 + i * 0.09}>
                {line}
              </MaskLine>
            ))}
            <MaskLine className="hero-title-accent" delay={0.06 + lines.length * 0.09}>
              {t.home.heroSubtitle}
            </MaskLine>
          </p>

          <p className="hero-lead" data-reveal="up">
            {t.home.heroLead}
          </p>

          <div className="hero-actions" data-reveal="up">
            <Magnetic>
              <Link href={href("/quote", locale)} className="btn">
                {t.home.heroPrimaryCta}
                <span className="arrow" aria-hidden="true">
                  {locale === "ar" ? "←" : "→"}
                </span>
              </Link>
            </Magnetic>
            <Magnetic>
              <Link href={href("/projects", locale)} className="btn btn-ghost">
                {t.home.heroSecondaryCta}
              </Link>
            </Magnetic>
          </div>

          <dl className="hero-facts" data-reveal="up">
            {facts.map((f) => (
              <div key={f.k} className="hero-fact">
                <dt>{f.k}</dt>
                <dd className="tabular">{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* The mark, stated: finished, still, and set out on its own sheet. */}
        <div className="hero-stage" data-reveal="fade">
          <HeroMark label={t.home.heroMarkAlt} className="hero-mark" />
          <p className="hero-stage-cap">{t.home.heroMarkCaption}</p>
        </div>
      </div>

      {/* Proof, immediately under the claim. Every figure is editable from the
          dashboard and defaults to a count of the live content. */}
      {stats.length > 0 && (
        <div className="page hero-proof" data-reveal-group="">
          <p className="eyebrow hero-proof-label" data-reveal="up">
            {statsLabel}
          </p>
          <dl className="hero-proof-row">
            {stats.map((s) => (
              <div key={s.key} className="hero-proof-item" data-reveal="up">
                <dt className="tabular hero-proof-n">
                  <span data-count={s.n}>0</span>
                </dt>
                <dd className="hero-proof-label-text">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* The way out of the cover. A cue that names where it goes: the page is
          five chapters long and this is the door to the first of them, so it
          says so rather than pointing at nothing in particular. */}
      <div className="page hero-cue" data-reveal="fade">
        <span className="hero-cue-rule" aria-hidden="true" />
        <span className="hero-cue-text">{t.home.heroScrollCue}</span>
        <span className="hero-cue-next">
          <Seq n={1} of={t.home.chapters.length} />
          <span className="hero-cue-label">{t.home.chapters[0].label}</span>
        </span>
      </div>
    </HeroScene>
  );
}
