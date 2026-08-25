import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { resolveProjects } from "@/lib/content";
import { siteUrl } from "@/lib/seo";

const STATIC_PATHS = ["", "/about", "/services", "/projects", "/quality", "/contact", "/quote", "/profile-request", "/privacy"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const projects = await resolveProjects();

  const entries: MetadataRoute.Sitemap = [];

  const push = (path: string, priority: number, changeFrequency: "daily" | "weekly" | "monthly" | "yearly") => {
    for (const locale of locales) {
      entries.push({
        url: `${base}/${locale}${path}`,
        changeFrequency,
        priority,
        alternates: {
          languages: {
            ...Object.fromEntries(locales.map((l) => [l, `${base}/${l}${path}`])),
            "x-default": `${base}/ar${path}`,
          },
        },
      });
    }
  };

  for (const p of STATIC_PATHS) push(p, p === "" ? 1 : 0.7, p === "" ? "weekly" : "monthly");
  for (const project of projects) push(`/projects/${project.slug}`, 0.8, "monthly");

  return entries;
}
