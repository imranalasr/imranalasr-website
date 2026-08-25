import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Project, ShowcaseTile } from "@/content/projects";
import type { Service } from "@/content/services";
import ProjectShowcase, {
  type ArchiveTile,
  type ShowcaseProject,
} from "./ProjectShowcase";

/**
 * The projects section, shaped on the server.
 *
 * The scene itself is a client component, so everything it needs is resolved
 * and localised here rather than shipped as a dictionary and a set of
 * bilingual records for the browser to pick through. What crosses the
 * boundary is exactly what is drawn: five projects, already in the reader's
 * language, and a flat list of archive photographs.
 *
 * Nothing is asserted that the content files do not carry. The field a
 * project sits in is read from its own related-services link rather than
 * stated separately, and the scope lines come from each project's
 * `documented` list — what its photographs actually show — so the scene never
 * claims more than the site can evidence. No client names, no contract
 * values, no completion percentages, because no supplied document holds any.
 */

/**
 * How many photographs the archive is built from.
 *
 * Enough that it reads as more record than anyone could take in — which is
 * what the heading says — and few enough to stay a composition rather than a
 * wall. It is only ever rendered on a viewport wide enough to stage it, so
 * this is not weight a phone is asked to carry.
 */
const ARCHIVE_MAX = 16;

export default function ProjectsScene({
  locale,
  t,
  projects,
  services,
  showcase,
}: {
  locale: Locale;
  t: Dictionary;
  projects: Project[];
  services: Service[];
  /** Chosen in the dashboard; picks override a project's own cover. */
  showcase?: ShowcaseTile[] | null;
}) {
  if (!projects.length) return null;

  /* A dashboard pick stands in for the delivered cover, first pick wins. */
  const picked = new Map<string, ShowcaseTile>();
  for (const tile of showcase ?? []) if (!picked.has(tile.slug)) picked.set(tile.slug, tile);

  const shaped: ShowcaseProject[] = projects.map((p) => {
    const pick = picked.get(p.slug);
    const cover = pick
      ? { src: pick.src, w: pick.w, h: pick.h, blur: pick.blur, alt: p.cover.alt[locale] }
      : { ...p.cover, alt: p.cover.alt[locale] };
    return {
      slug: p.slug,
      title: p.title[locale],
      location: p.location[locale],
      summary: p.summary[locale],
      sector: services.find((s) => s.slug === p.relatedServices[0])?.title[locale] ?? null,
      documented: p.documented[locale],
      cover,
    };
  });

  return (
    <ProjectShowcase
      locale={locale}
      t={t}
      projects={shaped}
      archive={buildArchive(projects, showcase)}
    />
  );
}

/**
 * The archive pool.
 *
 * Dashboard picks win outright when there are any — they are a deliberate
 * choice of what the company wants shown. Otherwise the pool is taken round
 * the projects rather than down them, one photograph from each in turn, so
 * no single site can dominate the field however many photographs it happens
 * to have on file.
 */
function buildArchive(projects: Project[], showcase: ShowcaseTile[] | null | undefined): ArchiveTile[] {
  const known = new Set(projects.map((p) => p.slug));

  if (showcase?.length) {
    return showcase
      .filter((tile) => known.has(tile.slug))
      .slice(0, ARCHIVE_MAX)
      .map((tile) => ({ src: tile.src, w: tile.w, h: tile.h, blur: tile.blur, slug: tile.slug }));
  }

  const out: ArchiveTile[] = [];
  const deepest = Math.max(...projects.map((p) => p.gallery.length));
  for (let i = 0; i < deepest && out.length < ARCHIVE_MAX; i++) {
    for (const project of projects) {
      if (out.length >= ARCHIVE_MAX) break;
      const image = project.gallery[i];
      if (!image) continue;
      out.push({ src: image.src, w: image.w, h: image.h, blur: image.blur, slug: project.slug });
    }
  }
  return out;
}
