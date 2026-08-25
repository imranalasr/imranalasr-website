import { MaskLines } from "./MaskLines";

/**
 * The standing head used by every inner page. It reuses the hero's grid so the
 * whole site feels drawn on one sheet, but at a quieter scale so it never
 * competes with the home page overture.
 */
export default function PageHero({
  eyebrow,
  title,
  lead,
  aside,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  aside?: React.ReactNode;
}) {
  return (
    <section className="page-hero" data-surface="forest" data-surface-section="forest">
      <div className="blueprint-grid page-hero-grid" aria-hidden="true" />
      <div className="page page-hero-inner">
        <p className="eyebrow" data-reveal="fade">
          {eyebrow}
        </p>
        <MaskLines as="h1" className="page-hero-title" lines={[title]} />
        {lead ? (
          <p className="page-hero-lead" data-reveal="up">
            {lead}
          </p>
        ) : null}
        {aside ? <div className="page-hero-aside">{aside}</div> : null}
      </div>
    </section>
  );
}
