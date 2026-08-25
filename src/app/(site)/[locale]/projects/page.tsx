import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHero from "@/components/PageHero";
import ProjectLink from "@/components/ProjectLink";
import { getDictionary } from "@/i18n/dictionaries";
import { href, isLocale, locales, type Locale } from "@/i18n/config";
import { pageMetadata, serializeJsonLd } from "@/lib/seo";
import { resolveProjects } from "@/lib/content";
import { siteUrl } from "@/lib/seo";

export const revalidate = 300;
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/projects", title: t.projects.title, description: t.projects.lead });
}

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = getDictionary(locale);
  const projects = await resolveProjects();

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: projects.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.title[locale],
      url: `${siteUrl()}/${locale}/projects/${p.slug}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(itemList) }} />

      <PageHero eyebrow={t.projects.eyebrow} title={t.projects.title} lead={t.projects.lead} />

      <section className="section" data-surface-section="light">
        <div className="page project-index">
          {projects.length === 0 ? <p>{t.projects.empty}</p> : null}
          {projects.map((p, i) => (
            <article key={p.slug} className="project-row" data-reveal-group="">
              <ProjectLink href={href(`/projects/${p.slug}`, locale)} className="project-row-link">
                <span className="project-row-index tabular" data-reveal="fade">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <span className="figure figure-zoom project-row-figure" data-reveal="scale">
                  <Image
                    src={p.cover.src}
                    alt={p.cover.alt[locale]}
                    width={p.cover.w}
                    height={p.cover.h}
                    sizes="(max-width: 900px) 92vw, 52vw"
                    placeholder="blur"
                    blurDataURL={p.cover.blur}
                    priority={i === 0}
                    style={{ viewTransitionName: `project-${p.slug}` }}
                  />
                </span>

                <span className="project-row-body">
                  <span className="project-row-loc" data-reveal="up">
                    {t.projects.recordRegion} · {p.location[locale]}
                  </span>
                  <span className="project-row-title" data-reveal="up">
                    {p.title[locale]}
                  </span>
                  <span className="project-row-summary" data-reveal="up">
                    {p.summary[locale]}
                  </span>
                  {/* The same two figures the detail page's record opens
                      with, so a row in the index and the sheet it leads to
                      are plainly the same document. Kept to two: an index
                      row is scanned, not read. */}
                  <span className="project-row-record" data-reveal="up">
                    <span>
                      {t.projects.recordScope}
                      <b className="tabular">{p.documented[locale].length}</b>
                    </span>
                    <span>
                      {t.projects.recordFrames}
                      <b className="tabular">{p.gallery.length}</b>
                    </span>
                  </span>
                  <span className="project-row-cta" data-reveal="up">
                    {t.common.viewProject}
                    <span aria-hidden="true">{locale === "ar" ? "←" : "→"}</span>
                  </span>
                </span>
              </ProjectLink>
            </article>
          ))}

          <p className="project-index-more" data-reveal="up">
            {t.home.projectsMore}{" "}
            <Link href={href("/profile-request", locale)} className="link-sweep">
              {t.home.projectsMoreCta}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
