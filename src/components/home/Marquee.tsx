import { company } from "@/content/company";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * The capability strip — a register read aloud, at speed.
 *
 * The band between the cover and the body of the page, and the first thing
 * that moves as the reader starts to scroll. It therefore has one job before
 * any other: to be *full*. A strip with four words and a lot of air in it
 * reads as a page still loading, which is the worst thing the first scroll on
 * a contractor's site could say.
 *
 * So it is dense, and everything in it is real. Two kinds of item alternate,
 * the way an industry ticker alternates headline and datum:
 *
 *  · A capability — a work group the company is registered for. Set in the
 *    display face, at reading weight.
 *  · A fact — the commercial register, the certified systems, the count of
 *    registered activities, and the regions its own project photographs were
 *    taken in. Set in the engineering face, quieter and smaller.
 *
 * Nothing here is asserted that is not already stated elsewhere on the site
 * with its source: the register number is the register number, the regions
 * are counted off the projects, and the activity total is the same total the
 * services page prints.
 *
 * The track holds the list four times and travels exactly a quarter of its
 * width, so the loop closes on itself with no seam, no gap and no script —
 * four rather than two because two only closes cleanly when a single run is
 * already wider than the viewport, which a short list on a wide screen is
 * not. Direction follows the script: the items travel the way the language
 * is read. Reduced motion drops to a single run, stops it, and lets the strip
 * wrap into an ordinary readable row.
 */

type Item = { key: string; text: string; kind: "capability" | "fact" };

export default function Marquee({
  t,
  regions,
  activities,
}: {
  t: Dictionary;
  /** Regions the published projects were photographed in. */
  regions: string[];
  /** Activities on the commercial register. */
  activities: number;
}) {
  const facts: Item[] = [
    {
      key: "cr",
      kind: "fact",
      text: `${t.home.marqueeRegisterLabel} ${company.commercialRegistration}`,
    },
    { key: "iso", kind: "fact", text: "ISO 9001 · 14001 · 45001" },
    { key: "activities", kind: "fact", text: `${activities} ${t.common.registeredActivities}` },
    ...regions.map((r) => ({
      key: `region-${r}`,
      kind: "fact" as const,
      text: `${t.home.marqueeRegionLabel} — ${r}`,
    })),
  ];

  const capabilities: Item[] = t.home.marquee.map((text) => ({
    key: `cap-${text}`,
    kind: "capability" as const,
    text,
  }));

  /* Woven rather than blocked: a run of capabilities followed by a run of
     numbers would read as two different strips passing one after the other. */
  const items: Item[] = [];
  const longer = Math.max(capabilities.length, facts.length);
  for (let i = 0; i < longer; i++) {
    if (capabilities[i]) items.push(capabilities[i]);
    if (facts[i]) items.push(facts[i]);
  }
  if (!items.length) return null;

  /* Four identical runs. Only the first is announced; the rest exist to close
     the loop and are hidden from assistive technology. */
  const runs = [0, 1, 2, 3];

  return (
    <section
      className="marquee"
      data-surface="forest"
      data-surface-section="forest"
      aria-label={t.home.servicesEyebrow}
    >
      <div className="marquee-track">
        {runs.map((run) => (
          <ul key={run} className="marquee-run" aria-hidden={run > 0 || undefined}>
            {items.map((item) => (
              <li key={item.key} className="marquee-item" data-kind={item.kind}>
                <span className="marquee-mark" aria-hidden="true">
                  {item.kind === "fact" ? "—" : "◆"}
                </span>
                <span className={item.kind === "fact" ? "tabular marquee-text" : "marquee-text"}>
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}
