import { MaskLines } from "./MaskLines";

/**
 * The standing head used by every inner page.
 *
 * It used to carry the hero's own setting-out grid. It no longer does: the
 * grid is the cover's device, and repeating it at the top of every inner page
 * — including three that are almost entirely prose — turned a signature into
 * wallpaper. The head keeps the dark ground and the eyebrow rule, which is
 * enough to say it is drawn on the same sheet.
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
