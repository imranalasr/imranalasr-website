import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { href, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { HomeFigure } from "@/lib/content";
import { MaskLines } from "@/components/MaskLines";
import Seq from "@/components/Seq";
import CapabilityScene from "./CapabilityScene";

/**
 * The position, stated in outcome terms.
 *
 * Four claims, each one traceable: work inside live sites, infrastructure and
 * power, auditable quality, documentation before hand-over. Every one of them
 * is something the register, the certificates or the project photographs can
 * be held against — which is the only kind of claim this site makes.
 *
 * They are set out as a ledger rather than as a grid of tiles. A two-by-two
 * grid says the four are interchangeable and that their order does not
 * matter; a numbered ledger says they are four separate undertakings, read in
 * sequence, each of which the company can be held to. The heading holds its
 * own column beside them — with the photograph that evidences the claims
 * directly under it — and stays there while the ledger is read, so the claim
 * and what stands behind it are never off screen from each other.
 *
 * The staging is `CapabilityScene`'s business. Everything here is rendered
 * complete and in order first, so the section reads the same whether or not
 * a line of it ever runs.
 */
export default function Capability({
  locale,
  t,
  figure,
}: {
  locale: Locale;
  t: Dictionary;
  figure: HomeFigure | null;
}) {
  const items = t.home.promiseItems;

  return (
    <CapabilityScene>
      <div className="page capability-inner">
        <div className="capability-head">
          <p className="eyebrow" data-reveal="up">
            {t.home.promiseEyebrow}
            <Seq n={2} of={t.home.chapters.length} className="eyebrow-seq" />
          </p>
          <MaskLines as="h2" id="capability-title" className="section-title" lines={[t.home.promiseTitle]} />
          <p className="section-lead" data-reveal="up">
            {t.home.promiseBody}
          </p>

          {figure ? (
            <figure className="capability-figure" data-reveal="up">
              <span className="figure capability-figure-frame">
                <Image
                  src={figure.image.src}
                  alt={figure.image.alt[locale]}
                  width={figure.image.w}
                  height={figure.image.h}
                  sizes="(max-width: 1000px) 92vw, 40vw"
                  placeholder="blur"
                  blurDataURL={figure.image.blur}
                  style={{ "--figure-pos": figure.position } as CSSProperties}
                />
                <span className="capability-figure-edge" aria-hidden="true" />
              </span>
              <figcaption className="capability-figure-cap tabular">
                {figure.project.title[locale]} · {figure.project.location[locale]}
              </figcaption>
            </figure>
          ) : null}

          <div className="capability-cta" data-reveal="up">
            <Link href={href("/about", locale)} className="btn btn-quiet">
              {t.nav.about}
              <span className="arrow" aria-hidden="true">
                {locale === "ar" ? "←" : "→"}
              </span>
            </Link>
          </div>
        </div>

        {/* The ledger. Four rows, counted, each one arriving from the margin
            and aligning against the spine as it is reached. */}
        <div className="capability-ledger">
          <span className="cap-spine" aria-hidden="true">
            <span className="cap-spine-fill" />
          </span>
          <ol className="cap-rows">
            {items.map((item, i) => (
              <li key={item.title} className="cap-row" data-row={i}>
                <span className="cap-row-rule" aria-hidden="true" />
                <span className="cap-row-index">
                  <Seq n={i + 1} of={items.length} />
                </span>
                <div className="cap-row-body">
                  <h3 className="cap-row-title">{item.title}</h3>
                  <p className="cap-row-text">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </CapabilityScene>
  );
}
