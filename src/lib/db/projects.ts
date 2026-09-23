import "server-only";
import { projects as baseProjects, type Project, type ProjectImage } from "@/content/projects";
import { driver } from "./index";
import { sbDelete, sbInsert, sbSelect, sbUpdate, sbUpsertMany, storageDelete } from "./supabase";

const FALLBACK_BLUR =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjUiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjUiIGZpbGw9IiNlOWU1ZGYiLz48L3N2Zz4=";

export type ProjectRow = {
  slug: string;
  display_order: number;
  published: boolean;
  source_folder: string;
  title_ar: string;
  title_en: string;
  short_title_ar: string;
  short_title_en: string;
  location_ar: string;
  location_en: string;
  summary_ar: string;
  summary_en: string;
  documented_ar: string[];
  documented_en: string[];
  related_services: string[];
  seo_title_ar: string;
  seo_title_en: string;
  seo_description_ar: string;
  seo_description_en: string;
  cover_src: string | null;
  cover_portrait_src: string | null;
};

export type ProjectImageRow = {
  id: number;
  project_slug: string;
  src: string;
  storage_path: string | null;
  width: number;
  height: number;
  blur: string;
  alt_ar: string;
  alt_en: string;
  display_order: number;
  visible: boolean;
};

export type AdminProject = Project & { images: ProjectImageRow[]; cms: true };

function image(row: ProjectImageRow): ProjectImage {
  return {
    src: row.src,
    w: row.width,
    h: row.height,
    blur: row.blur || FALLBACK_BLUR,
    alt: { ar: row.alt_ar, en: row.alt_en },
  };
}

function mapProject(row: ProjectRow, rows: ProjectImageRow[], includeHidden: boolean): AdminProject {
  const ordered = [...rows].sort((a, b) => a.display_order - b.display_order || a.id - b.id);
  const shown = includeHidden ? ordered : ordered.filter((item) => item.visible);
  const gallery = shown.map(image);
  const all = ordered.map(image);
  const placeholder: ProjectImage = {
    src: "/og.png",
    w: 1200,
    h: 630,
    blur: FALLBACK_BLUR,
    alt: { ar: row.title_ar, en: row.title_en },
  };
  const cover = all.find((item) => item.src === row.cover_src) ?? gallery[0] ?? placeholder;
  const coverPortrait = all.find((item) => item.src === row.cover_portrait_src) ?? cover;
  return {
    slug: row.slug,
    order: row.display_order,
    published: row.published,
    sourceFolder: row.source_folder,
    title: { ar: row.title_ar, en: row.title_en },
    shortTitle: { ar: row.short_title_ar, en: row.short_title_en },
    location: { ar: row.location_ar, en: row.location_en },
    summary: { ar: row.summary_ar, en: row.summary_en },
    documented: { ar: row.documented_ar ?? [], en: row.documented_en ?? [] },
    relatedServices: row.related_services ?? [],
    seo: {
      title: { ar: row.seo_title_ar, en: row.seo_title_en },
      description: { ar: row.seo_description_ar, en: row.seo_description_en },
    },
    cover,
    coverPortrait,
    gallery,
    images: ordered,
    cms: true,
  };
}

export async function listCmsProjects(includeUnpublished = false, includeHidden = false): Promise<AdminProject[] | null> {
  if (driver !== "supabase") return null;
  try {
    const projectRows = await sbSelect<ProjectRow>(
      "projects",
      `select=*&order=display_order.asc${includeUnpublished ? "" : "&published=eq.true"}`
    );
    if (!projectRows.length) return null;
    const imageRows = await sbSelect<ProjectImageRow>("project_images", "select=*&order=display_order.asc&limit=5000");
    return projectRows.map((row) =>
      mapProject(row, imageRows.filter((item) => item.project_slug === row.slug), includeHidden)
    );
  } catch (error) {
    console.error("CMS projects unavailable; serving delivered projects", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}

export async function getCmsProject(slug: string, includeHidden = true): Promise<AdminProject | null> {
  if (driver !== "supabase") return null;
  const rows = await sbSelect<ProjectRow>("projects", `select=*&slug=eq.${encodeURIComponent(slug)}&limit=1`);
  if (!rows[0]) return null;
  const images = await sbSelect<ProjectImageRow>(
    "project_images",
    `select=*&project_slug=eq.${encodeURIComponent(slug)}&order=display_order.asc&limit=1000`
  );
  return mapProject(rows[0], images, includeHidden);
}

export function projectToRow(project: Project): Record<string, unknown> {
  return {
    slug: project.slug,
    display_order: project.order,
    published: project.published,
    source_folder: project.sourceFolder,
    title_ar: project.title.ar,
    title_en: project.title.en,
    short_title_ar: project.shortTitle.ar,
    short_title_en: project.shortTitle.en,
    location_ar: project.location.ar,
    location_en: project.location.en,
    summary_ar: project.summary.ar,
    summary_en: project.summary.en,
    documented_ar: project.documented.ar,
    documented_en: project.documented.en,
    related_services: project.relatedServices,
    seo_title_ar: project.seo.title.ar,
    seo_title_en: project.seo.title.en,
    seo_description_ar: project.seo.description.ar,
    seo_description_en: project.seo.description.en,
    cover_src: project.cover.src,
    cover_portrait_src: project.coverPortrait.src,
    updated_at: new Date().toISOString(),
  };
}

export async function seedBaseProjects() {
  if (driver !== "supabase") throw new Error("Project CMS requires Supabase");
  const existing = await sbSelect<{ slug: string }>("projects", "select=slug&limit=1");
  if (existing.length) return false;
  await sbUpsertMany("projects", baseProjects.map(projectToRow), "slug");
  const imageRows = baseProjects.flatMap((project) =>
    project.gallery.map((item, index) => ({
      project_slug: project.slug,
      src: item.src,
      storage_path: null,
      width: item.w,
      height: item.h,
      blur: item.blur,
      alt_ar: item.alt.ar,
      alt_en: item.alt.en,
      display_order: index + 1,
      visible: true,
    }))
  );
  await sbUpsertMany("project_images", imageRows, "project_slug,src");
  return true;
}

export async function createCmsProject(row: Record<string, unknown>) {
  return sbInsert<ProjectRow>("projects", { ...row, updated_at: new Date().toISOString() });
}

export async function updateCmsProject(slug: string, patch: Record<string, unknown>) {
  await sbUpdate("projects", `slug=eq.${encodeURIComponent(slug)}`, {
    ...patch,
    updated_at: new Date().toISOString(),
  });
}

export async function updateCmsImages(slug: string, items: Array<Pick<ProjectImageRow, "id" | "display_order" | "visible" | "alt_ar" | "alt_en">>) {
  await Promise.all(items.map((item) => sbUpdate(
    "project_images",
    `id=eq.${item.id}&project_slug=eq.${encodeURIComponent(slug)}`,
    { display_order: item.display_order, visible: item.visible, alt_ar: item.alt_ar, alt_en: item.alt_en }
  )));
}

export async function insertCmsImage(row: Record<string, unknown>) {
  return sbInsert<ProjectImageRow>("project_images", row);
}

export async function deleteCmsImage(slug: string, id: number) {
  const rows = await sbSelect<ProjectImageRow>(
    "project_images",
    `select=*&id=eq.${id}&project_slug=eq.${encodeURIComponent(slug)}&limit=1`
  );
  const row = rows[0];
  if (!row) return null;
  if (row.storage_path) await storageDelete([row.storage_path]);
  await sbDelete("project_images", `id=eq.${id}&project_slug=eq.${encodeURIComponent(slug)}`);
  return row;
}

export async function deleteCmsProject(slug: string) {
  const images = await sbSelect<{ storage_path: string | null }>(
    "project_images",
    `select=storage_path&project_slug=eq.${encodeURIComponent(slug)}&storage_path=not.is.null`
  );
  await storageDelete(images.flatMap((item) => item.storage_path ? [item.storage_path] : []));
  await sbDelete("projects", `slug=eq.${encodeURIComponent(slug)}`);
}
