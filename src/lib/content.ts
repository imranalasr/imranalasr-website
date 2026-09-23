import "server-only";
import { getOverride, getOverridesByPrefix } from "./db";
import {
  openingFigure,
  projects as baseProjects,
  type Project,
  type ProjectImage,
  type ShowcaseTile,
} from "@/content/projects";
import { services as baseServices, type Service } from "@/content/services";
import { credentials as baseCredentials, type Credential } from "@/content/certifications";
import { company as baseCompany } from "@/content/company";
import { getCmsProject, listCmsProjects } from "./db/projects";

/**
 * Content resolution.
 *
 * Files in `src/content` are the source of truth as delivered. The admin panel
 * writes *overrides* into the database; this module merges them on top. That
 * gives editable content without turning the fact layer into free-form data
 * that could drift away from the official documents.
 */

export type ProjectOverride = Partial<{
  published: boolean;
  order: number;
  title: { ar: string; en: string };
  shortTitle: { ar: string; en: string };
  location: { ar: string; en: string };
  summary: { ar: string; en: string };
  documented: { ar: string[]; en: string[] };
  seo: { title: { ar: string; en: string }; description: { ar: string; en: string } };
  coverSrc: string;
  hiddenImages: string[];
  imageOrder: string[];
  extraImages: { src: string; w: number; h: number; blur: string; alt: { ar: string; en: string } }[];
}>;

export type ServiceOverride = Partial<{
  published: boolean;
  order: number;
  title: { ar: string; en: string };
  lead: { ar: string; en: string };
}>;

export type CredentialOverride = Partial<{ published: boolean; order: number }>;

export type CompanyOverride = Partial<{
  email: string;
  phonePrimary: string;
  phonePrimaryDisplay: string;
  phoneSecondary: string;
  phoneSecondaryDisplay: string;
  whatsapp: string;
  addressAr: string;
  addressEn: string;
  hoursAr: string;
  hoursEn: string;
}>;

/** The four figures under "بيانات موثقة" on the home page. */
export const homeStatKeys = ["activities", "isoSystems", "projects", "regions"] as const;
export type HomeStatKey = (typeof homeStatKeys)[number];

export type HomeStatOverride = {
  key: HomeStatKey;
  /** null → the figure is counted from the live content. */
  value: number | null;
  label: { ar: string; en: string } | null;
  published: boolean;
  order: number;
};

export type HomeStatsOverride = Partial<{
  label: { ar: string; en: string };
  items: HomeStatOverride[];
}>;

export type HomeFigureOverride = Partial<{
  projectSlug: string;
  src: string;
  /** CSS object-position, e.g. "50% 55%". */
  position: string;
}>;

/** `slug::src` pairs — the photographs shown in the home projects scene. */
export type HomeShowcaseOverride = Partial<{ picks: string[] }>;

export type NotificationsOverride = Partial<{ mailTo: string }>;

const KEY = {
  project: (slug: string) => `project:${slug}`,
  service: (slug: string) => `service:${slug}`,
  credential: (id: string) => `credential:${id}`,
  company: "company:contact",
  homeFigure: "home:figure",
  homeStats: "home:stats",
  homeShowcase: "home:showcase",
  notifications: "site:notifications",
};

/**
 * Public pages must remain available when the editable CMS is temporarily
 * unreachable. The delivered content is the safe fallback; admin reads and
 * writes intentionally keep their errors so operational failures are not
 * hidden from staff.
 */
async function getPublicOverrides<T>(prefix: string): Promise<Record<string, T>> {
  try {
    return await getOverridesByPrefix<T>(prefix);
  } catch (error) {
    console.error("Public CMS overrides unavailable; serving delivered content", {
      prefix,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return {};
  }
}

export async function resolveProjects(includeUnpublished = false): Promise<Project[]> {
  const cms = await listCmsProjects(includeUnpublished, false);
  if (cms) return cms;
  const overrides = await getPublicOverrides<ProjectOverride>("project:");
  const merged = baseProjects.map((p) => {
    const o = overrides[KEY.project(p.slug)] ?? {};
    const hidden = new Set(o.hiddenImages ?? []);
    let gallery = p.gallery.filter((g) => !hidden.has(g.src));
    if (o.extraImages?.length) gallery = [...gallery, ...o.extraImages];
    if (o.imageOrder?.length) {
      const pos = new Map(o.imageOrder.map((src, i) => [src, i]));
      gallery = [...gallery].sort(
        (a, b) => (pos.get(a.src) ?? 1e6) - (pos.get(b.src) ?? 1e6)
      );
    }
    const cover =
      o.coverSrc && gallery.find((g) => g.src === o.coverSrc)
        ? { ...gallery.find((g) => g.src === o.coverSrc)!, alt: p.cover.alt }
        : p.cover;
    return {
      ...p,
      published: o.published ?? p.published,
      order: o.order ?? p.order,
      title: o.title ?? p.title,
      shortTitle: o.shortTitle ?? p.shortTitle,
      location: o.location ?? p.location,
      summary: o.summary ?? p.summary,
      documented: o.documented ?? p.documented,
      seo: o.seo ?? p.seo,
      cover,
      gallery,
    } satisfies Project;
  });
  return merged
    .filter((p) => includeUnpublished || p.published)
    .sort((a, b) => a.order - b.order);
}

export async function resolveProjectForAdmin(slug: string) {
  const cms = await getCmsProject(slug, true);
  if (cms) return cms;
  return resolveProject(slug, true);
}

export async function resolveProject(slug: string, includeUnpublished = false) {
  const list = await resolveProjects(includeUnpublished);
  return list.find((p) => p.slug === slug);
}

export async function resolveServices(includeUnpublished = false): Promise<(Service & { published: boolean })[]> {
  const overrides = await getPublicOverrides<ServiceOverride>("service:");
  return baseServices
    .map((s, i) => {
      const o = overrides[KEY.service(s.slug)] ?? {};
      return {
        ...s,
        title: o.title ?? s.title,
        lead: o.lead ?? s.lead,
        published: o.published ?? true,
        order: o.order ?? i + 1,
      };
    })
    .filter((s) => includeUnpublished || s.published)
    .sort((a, b) => a.order - b.order)
    .map(({ order: _order, ...rest }) => rest as Service & { published: boolean });
}

export async function resolveCredentials(includeUnpublished = false): Promise<Credential[]> {
  const overrides = await getPublicOverrides<CredentialOverride>("credential:");
  return baseCredentials
    .map((c, i) => {
      const o = overrides[KEY.credential(c.id)] ?? {};
      return { ...c, published: o.published ?? true, order: o.order ?? i + 1 };
    })
    .filter((c) => includeUnpublished || c.published)
    .sort((a, b) => a.order - b.order);
}

export type ResolvedCompany = ReturnType<typeof shapeCompany>;

function shapeCompany(o: CompanyOverride) {
  return {
    ...baseCompany,
    contact: {
      ...baseCompany.contact,
      email: o.email ?? baseCompany.contact.email,
      phonePrimary: o.phonePrimary ?? baseCompany.contact.phonePrimary,
      phonePrimaryDisplay: o.phonePrimaryDisplay ?? baseCompany.contact.phonePrimaryDisplay,
      phoneSecondary: o.phoneSecondary ?? baseCompany.contact.phoneSecondary,
      phoneSecondaryDisplay: o.phoneSecondaryDisplay ?? baseCompany.contact.phoneSecondaryDisplay,
      whatsapp: o.whatsapp ?? baseCompany.contact.whatsapp,
    },
    address: {
      ...baseCompany.address,
      lines: {
        ar: o.addressAr ?? baseCompany.address.lines.ar,
        en: o.addressEn ?? baseCompany.address.lines.en,
      },
    },
    hours: {
      ar: o.hoursAr ?? "الأحد – الخميس · 8:00 ص – 5:00 م",
      en: o.hoursEn ?? "Sunday – Thursday · 8:00 – 17:00",
    },
  };
}

export async function resolveCompany() {
  const overrides = await getPublicOverrides<CompanyOverride>("company:");
  return shapeCompany(overrides[KEY.company] ?? {});
}

/* ─────────────────────────── home page settings ──────────────────────── */

export type HomeFigure = { project: Project; image: ProjectImage; position: string };
export type { ShowcaseTile };

function shapeHomeFigure(projects: Project[], o: HomeFigureOverride): HomeFigure | null {
  const project =
    (o.projectSlug && projects.find((p) => p.slug === o.projectSlug)) ||
    projects.find((p) => p.slug === openingFigure.slug) ||
    projects[0];
  if (!project) return null;

  const gallery = project.gallery.length ? project.gallery : [project.coverPortrait];
  // The delivered opening photograph is chosen by index inside its own project;
  // any other project falls back to its first frame rather than an empty one.
  const fallback =
    project.slug === openingFigure.slug ? gallery[openingFigure.galleryIndex] : undefined;
  const image = (o.src && gallery.find((g) => g.src === o.src)) || fallback || gallery[0] || project.coverPortrait;

  return { project, image, position: o.position?.trim() || openingFigure.position };
}

function shapeHomeStats(o: HomeStatsOverride) {
  const stored = new Map((o.items ?? []).map((item) => [item.key, item]));
  const items = homeStatKeys
    .map((key, i): HomeStatOverride => {
      const s = stored.get(key);
      const value = typeof s?.value === "number" && Number.isFinite(s.value) ? s.value : null;
      const label = s?.label && (s.label.ar?.trim() || s.label.en?.trim()) ? s.label : null;
      return {
        key,
        value,
        label,
        published: s?.published ?? true,
        order: typeof s?.order === "number" && Number.isFinite(s.order) ? s.order : i + 1,
      };
    })
    .sort((a, b) => a.order - b.order);
  const label = o.label && (o.label.ar?.trim() || o.label.en?.trim()) ? o.label : null;
  return { label, items };
}

/** null → no manual selection, the scene composes itself from the galleries. */
function shapeHomeShowcase(projects: Project[], o: HomeShowcaseOverride): ShowcaseTile[] | null {
  const picks = Array.isArray(o.picks) ? o.picks : [];
  if (!picks.length) return null;

  const byProject = new Map<string, ShowcaseTile[]>();
  for (const entry of picks) {
    if (typeof entry !== "string") continue;
    const at = entry.indexOf("::");
    if (at < 1) continue;
    const slug = entry.slice(0, at);
    const src = entry.slice(at + 2);
    const project = projects.find((p) => p.slug === slug);
    if (!project) continue;
    const image =
      project.gallery.find((g) => g.src === src) ?? (project.cover.src === src ? project.cover : undefined);
    if (!image) continue;
    const list = byProject.get(slug) ?? [];
    list.push({ src: image.src, w: image.w, h: image.h, blur: image.blur, slug });
    byProject.set(slug, list);
  }

  // Interleave the projects so neighbouring frames on the arm come from
  // different sites — the same rule the automatic composition follows.
  const lists = [...byProject.values()];
  const longest = lists.reduce((n, list) => Math.max(n, list.length), 0);
  const out: ShowcaseTile[] = [];
  for (let k = 0; k < longest; k++) {
    for (const list of lists) if (list[k]) out.push(list[k]);
  }
  return out.length ? out : null;
}

export async function resolveHome(projects: Project[]) {
  const overrides = await getPublicOverrides<Record<string, unknown>>("home:");
  return {
    figure: shapeHomeFigure(projects, (overrides[KEY.homeFigure] ?? {}) as HomeFigureOverride),
    stats: shapeHomeStats((overrides[KEY.homeStats] ?? {}) as HomeStatsOverride),
    showcase: shapeHomeShowcase(projects, (overrides[KEY.homeShowcase] ?? {}) as HomeShowcaseOverride),
  };
}

/* ───────────────────────── notification mailbox ──────────────────────── */

export const defaultNotificationEmail = "requests@imranalasr.sa";

/**
 * Where form submissions are announced. The dashboard setting wins; without it
 * the deployment's MAIL_TO stays in force, so nothing changes until an
 * administrator deliberately sets an address.
 */
export async function resolveNotificationEmail(): Promise<{
  email: string;
  source: "admin" | "env" | "default";
}> {
  const override = await getOverride<NotificationsOverride>(KEY.notifications);
  const custom = override?.mailTo?.trim();
  if (custom) return { email: custom, source: "admin" };
  const fromEnv = process.env.MAIL_TO?.trim();
  if (fromEnv) return { email: fromEnv, source: "env" };
  return { email: defaultNotificationEmail, source: "default" };
}

export const contentKeys = KEY;
