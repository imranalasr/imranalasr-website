import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Service } from "@/content/services";
import SolutionsScene, { type Pack } from "./SolutionsScene";

/**
 * Solutions, grouped by what a client is actually buying — shaped here, drawn
 * by `SolutionsScene`.
 *
 * The statutory scope is six work groups and nineteen registered activities;
 * nobody procures in those terms. So the six groups are gathered into four
 * packages named after the outcome — a delivered building, working
 * infrastructure, a facility returned to hand-over standard, the works that
 * bracket execution — and each package still shows the registered groups and
 * activity counts underneath it. The outcome sells; the register proves.
 *
 * Nothing is invented to fill a package: every group here is a group the
 * company is licensed for, and each still links through to its activity codes.
 *
 * Only what is drawn crosses to the client — four packages, already localised,
 * with their groups' slugs, names and activity counts. The full service list
 * with all nineteen bilingual activity records stays on the server.
 */

/** Package → the registered work groups it is composed of. */
const PACKAGES: Record<string, string[]> = {
  delivery: ["building-construction"],
  infrastructure: ["electrical-power", "roads-pavements"],
  finishing: ["restoration-finishing"],
  support: ["structural-support", "telecom-low-current"],
};

export default function ServicesScene({
  locale,
  t,
  services,
}: {
  locale: Locale;
  t: Dictionary;
  services: Service[];
}) {
  const byslug = new Map(services.map((s) => [s.slug, s]));

  const packs: Pack[] = t.home.solutions
    .map((sol, i) => {
      const groups = (PACKAGES[sol.key] ?? []).flatMap((slug) => {
        const service = byslug.get(slug);
        return service ? [service] : [];
      });
      return {
        key: sol.key,
        index: String(i + 1).padStart(2, "0"),
        title: sol.title,
        outcome: sol.outcome,
        diagram: groups[0]?.slug ?? "",
        groups: groups.map((g) => ({
          slug: g.slug,
          title: g.title[locale],
          activities: g.activities.length,
        })),
      };
    })
    /* A package whose groups were all unpublished from the dashboard simply
       stops being offered rather than showing an empty box. */
    .filter((p) => p.groups.length > 0);

  if (!packs.length) return null;

  return <SolutionsScene locale={locale} t={t} packs={packs} />;
}
