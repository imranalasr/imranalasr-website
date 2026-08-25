import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import EditorialGallery from "@/components/EditorialGallery";
import ProjectLink from "@/components/ProjectLink";
import ProjectRecord, { type RecordField } from "@/components/ProjectRecord";
import { MaskLines } from "@/components/MaskLines";
import { getDictionary } from "@/i18n/dictionaries";
import { href, isLocale, locales, type Locale } from "@/i18n/config";
import { pageMetadata, serializeJsonLd, siteUrl } from "@/lib/seo";
import { resolveProjects } from "@/lib/content";
import { services as allServices } from "@/content/services";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const projects = await resolveProjects();
  return locales.flatMap((locale) => projects.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const projects = await resolveProjects();
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};
  return pageMetadata({
    locale,
    path: `/projects/${slug}`,
    title: project.seo.title[locale],
    description: project.seo.description[locale],
    images: [
      {
        url: project.cover.src,
        width: project.cover.w,
        height: project.cover.h,
        alt: project.cover.alt[locale],
      },
    ],
  });
}

export default async function ProjectDetail({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = getDictionary(locale);

  const projects = await resolveProjects();
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  const index = projects.findIndex((p) => p.slug === slug);
  const next = projects[(index + 1) % projects.length];
  const related = allServices.filter((s) => project.relatedServices.includes(s.slug));

  /*
   * The project record. Every value here is already held about this project:
   * the region it names, the registered work groups it links to, how many
   * items its own photographs document, and how many frames there are.
   *
   * Year and status are listed so the shape of the record is complete and the
   * rows are ready — `ProjectRecord` drops a field whose value is absent, so
   * they cost nothing while no document supports them. Do not fill either
   * from inference: `src/content/projects.ts` deliberately declares no date,
   * status, client, value or duration field, and the content tests enforce
   * that.
   */
  const record: RecordField[] = [
    { label: t.projects.recordRegion, value: project.location[locale] },
    { label: t.projects.recordType, value: related.map((s) => s.title[locale]).join(" · ") },
    { label: t.projects.recordScope, value: project.documented[locale].length, tabular: true },
    { label: t.projects.recordFrames, value: project.gallery.length, tabular: true },
    // { label: t.projects.recordYear,   value: <year>,   tabular: true },
    // { label: t.projects.recordStatus, value: <status> },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title[locale],
    description: project.summary[locale],
    url: `${siteUrl()}/${locale}/projects/${project.slug}`,
    image: `${siteUrl()}${project.cover.src}`,
    contentLocation: { "@type": "Place", name: project.location[locale] },
    creator: { "@type": "Organization", name: t.meta.siteName },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      {/* Immersive cover — the picture arrives from the index via a shared
          view transition where the browser supports one. */}
      <section className="project-cover" data-surface="ink" data-surface-section="ink">
        <div className="project-cover-media">
          <Image
            src={project.cover.src}
            alt={project.cover.alt[locale]}
            width={project.cover.w}
            height={project.cover.h}
            sizes="100vw"
            priority
            placeholder="blur"
            blurDataURL={project.cover.blur}
            style={{ viewTransitionName: `project-${project.slug}` }}
          />
          <span className="project-cover-scrim" aria-hidden="true" />
        </div>

        <div className="page project-cover-inner">
          <nav className="project-crumb" aria-label="breadcrumb">
            <Link href={href("/projects", locale)} className="link-sweep">
              {t.common.backTo} {t.nav.projects}
            </Link>
          </nav>
          <MaskLines as="h1" className="project-title" lines={[project.title[locale]]} />
          <p className="project-record-label">{t.projects.recordTitle}</p>
          <ProjectRecord fields={record} className="project-record-cover" />
        </div>
      </section>

      {/* Summary + what the photographs document */}
      <section className="section" data-surface-section="light">
        <div className="page project-brief">
          <div className="project-brief-lead">
            <p className="project-summary" data-reveal="up">
              {project.summary[locale]}
            </p>
          </div>

          <div className="project-documented">
            <h2 className="project-documented-title" data-reveal="up">
              {t.projects.documentedTitle}
            </h2>
            <ul data-reveal-group="">
              {project.documented[locale].map((d, i) => (
                <li key={d} data-reveal="up">
                  <span className="tabular">{String(i + 1).padStart(2, "0")}</span>
                  {d}
                </li>
              ))}
            </ul>
            <p className="project-documented-note" data-reveal="up">
              {t.projects.documentedNote}
            </p>
          </div>
        </div>
      </section>

      {/* Editorial gallery */}
      <section className="section project-gallery-section" data-surface="ink" data-surface-section="ink">
        <div className="page">
          <div className="section-head">
            <p className="eyebrow" data-reveal="up">
              {t.projects.galleryTitle}
            </p>
          </div>
          <EditorialGallery images={project.gallery} locale={locale} t={t} />
        </div>
      </section>

      {/* Related services */}
      {related.length ? (
        <section className="section" data-surface-section="light">
          <div className="page">
            <h2 className="section-title" data-reveal="up">
              {t.projects.relatedServicesTitle}
            </h2>
            <div className="related-services" data-reveal-group="">
              {related.map((s) => (
                <Link key={s.slug} href={href(`/services#${s.slug}`, locale)} className="related-service card" data-reveal="up">
                  <span className="tabular">{s.index}</span>
                  <span>{s.title[locale]}</span>
                  <span className="arrow" aria-hidden="true">
                    {locale === "ar" ? "←" : "→"}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Next project — a continuous cut rather than an end */}
      <section className="next-project" data-surface="teal" data-surface-section="teal">
        <ProjectLink href={href(`/projects/${next.slug}`, locale)} className="next-project-link">
          <span className="next-project-media" aria-hidden="true">
            <Image
              src={next.cover.src}
              alt=""
              width={next.cover.w}
              height={next.cover.h}
              sizes="100vw"
              placeholder="blur"
              blurDataURL={next.cover.blur}
            />
          </span>
          <span className="page next-project-inner">
            <span className="eyebrow">{t.common.nextProject}</span>
            <span className="next-project-title">{next.title[locale]}</span>
            <span className="next-project-cta">
              {t.common.viewProject}
              <span aria-hidden="true">{locale === "ar" ? "←" : "→"}</span>
            </span>
          </span>
        </ProjectLink>
      </section>
    </>
  );
}
