import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Hero from "@/components/home/Hero";
import ChapterRail from "@/components/home/ChapterRail";
import Marquee from "@/components/home/Marquee";
import BuildSequence from "@/components/home/BuildSequence";
import Capability from "@/components/home/Capability";
import ProjectsScene from "@/components/home/ProjectsScene";
import Evidence from "@/components/home/Evidence";
import ServicesScene from "@/components/home/ServicesScene";
import VerseBand from "@/components/home/VerseBand";
import { MaskLines } from "@/components/MaskLines";
import Magnetic from "@/components/motion/Magnetic";
import { getDictionary } from "@/i18n/dictionaries";
import { href, isLocale, type Locale } from "@/i18n/config";
import {
  resolveCompany,
  resolveCredentials,
  resolveHome,
  resolveProjects,
  resolveServices,
} from "@/lib/content";
import { totalRegisteredActivities } from "@/content/services";
import { pageMetadata, serializeJsonLd, siteUrl } from "@/lib/seo";

export const revalidate = 300;

const HOME_SEO = {
  ar: {
    title: "عمران العصر الحديثة للمقاولات | Imran Al Asr",
    description:
      "عمران العصر الحديثة للمقاولات شركة مقاولات سعودية تقدم أعمال الإنشاء والبنية التحتية والترميم والتشطيب وأعمال الكهرباء والطاقة في المملكة العربية السعودية.",
  },
  en: {
    title: "Imran Al Asr Modern Construction | عمران العصر الحديثة للمقاولات",
    description:
      "Imran Al Asr is a construction company delivering building, infrastructure, restoration, finishing, electrical and power works across Saudi Arabia.",
  },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const seo = HOME_SEO[locale];
  return {
    ...pageMetadata({ locale, path: "/", title: seo.title, description: seo.description }),
    title: { absolute: seo.title },
  };
}

/**
 * Home.
 *
 * The page is ordered the way a contractor is actually assessed: what they
 * build and how to start (hero), how they run a job (the build sequence, which
 * is the contract process), what they claim (capability), what they have
 * already delivered (projects), what can be verified (evidence), what can be
 * bought (solutions), and then the way in (contact).
 *
 * Proof comes before persuasion throughout: the figures sit inside the first
 * viewport, the project cards carry documented scope rather than adjectives,
 * and the credentials block prints certificate numbers instead of badges.
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = getDictionary(locale);

  const [projects, services, credentials, company] = await Promise.all([
    resolveProjects(),
    resolveServices(),
    resolveCredentials(),
    resolveCompany(),
  ]);

  const regions = Array.from(new Set(projects.map((p) => p.location[locale])));

  // The supporting photograph, the documented figures and the project
  // photography are all editable from the dashboard; each falls back to the
  // delivered content.
  const home = await resolveHome(projects);

  const base = siteUrl();
  const seo = HOME_SEO[locale];
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: `${base}/`,
        name: "عمران العصر الحديثة",
        alternateName: ["شركة عمران العصر الحديثة للمقاولات", "Imran Al Asr", "imranalasr.sa"],
        inLanguage: ["ar-SA", "en"],
        publisher: { "@id": `${base}/#organization` },
      },
      {
        "@type": "GeneralContractor",
        "@id": `${base}/#organization`,
        name: company.name.ar,
        alternateName: [company.shortName.ar, "Imran Al Asr", company.name.en],
        url: `${base}/`,
        logo: {
          "@type": "ImageObject",
          url: `${base}/brand/icon.png`,
          contentUrl: `${base}/brand/icon.png`,
          width: 256,
          height: 256,
        },
        description: seo.description,
        email: company.contact.email,
        telephone: company.contact.phonePrimary,
        vatID: company.vatNumber,
        identifier: [
          {
            "@type": "PropertyValue",
            name: "Commercial Registration",
            value: company.commercialRegistration,
          },
          {
            "@type": "PropertyValue",
            name: "Unified National Number",
            value: company.unifiedNationalNumber,
          },
        ],
        address: {
          "@type": "PostalAddress",
          streetAddress: `${company.address.street[locale]}، ${company.address.district[locale]}`,
          addressLocality: company.address.city[locale],
          postalCode: company.address.postalCode,
          addressCountry: company.address.countryCode,
        },
        areaServed: { "@type": "Country", name: company.address.country[locale] },
      },
    ],
  };

  const counted: Record<string, number> = {
    activities: totalRegisteredActivities,
    isoSystems: 3,
    projects: projects.length,
    regions: regions.length,
  };
  const stats = home.stats.items
    .filter((item) => item.published)
    .map((item) => ({
      key: item.key,
      n: item.value ?? counted[item.key],
      label: item.label?.[locale]?.trim() || t.home.stats[item.key],
    }));
  const statsLabel = home.stats.label?.[locale]?.trim() || t.home.statsLabel;
  const arrow = locale === "ar" ? "←" : "→";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />
      {/* The running head: which of the five chapters below is being read.
          It reports only — every chapter it lists is reached by scrolling and
          is in the site navigation as well. */}
      <ChapterRail t={t} />

      <Hero locale={locale} t={t} stats={stats} statsLabel={statsLabel} />

      {/* The verse the company is named after, read immediately after the
          mark and before anything is claimed or sold. It is the foundation
          the name stands on, so it belongs at the foot of the cover — not
          at the foot of the page, where it had become decoration. It stays
          on the cover's own dark ground for the same reason: it is part of
          the opening, not an interruption between two sales sections. */}
      <VerseBand locale={locale} />

      <Marquee t={t} regions={regions} activities={totalRegisteredActivities} />

      <BuildSequence t={t} />

      <Capability locale={locale} t={t} figure={home.figure} />

      <ProjectsScene
        locale={locale}
        t={t}
        projects={projects}
        services={services}
        showcase={home.showcase}
      />

      <Evidence locale={locale} t={t} credentials={credentials} />

      <ServicesScene locale={locale} t={t} services={services} />

      {/* ── The way in ─────────────────────────────────────────────────── */}
      <section
        className="section cta-section"
        data-surface="forest"
        data-surface-section="forest"
        data-seam="paper"
      >
        <div className="page cta-inner">
          <p className="eyebrow" data-reveal="up">
            {t.home.ctaEyebrow}
          </p>
          <MaskLines as="h2" className="cta-title" lines={[t.home.ctaTitle]} />
          <p className="cta-lead" data-reveal="up">
            {t.home.ctaLead}
          </p>
          <div className="cta-actions" data-reveal="up">
            <Magnetic>
              <Link href={href("/quote", locale)} className="btn">
                {t.home.heroPrimaryCta}
                <span className="arrow" aria-hidden="true">
                  {arrow}
                </span>
              </Link>
            </Magnetic>
            <Magnetic>
              <Link href={href("/profile-request", locale)} className="btn btn-ghost">
                {t.common.requestProfile}
              </Link>
            </Magnetic>
          </div>
          {/* The two direct channels, one per row. A phone number and an
              email address are Latin-script values in an Arabic sentence, so
              each is isolated with its own `dir="ltr"` — without it the
              bidirectional algorithm reorders the digits against the
              surrounding text and runs the two together. */}
          <div className="cta-direct" data-reveal="up">
            <p className="cta-direct-label">{t.home.ctaDirect}</p>
            <ul className="cta-channels">
              <li>
                <a href={`tel:${company.contact.phonePrimary}`} className="cta-channel">
                  <span className="cta-channel-label">{t.common.call}</span>
                  <span className="cta-channel-value tabular" dir="ltr">
                    {company.contact.phonePrimaryDisplay}
                  </span>
                </a>
              </li>
              <li>
                <a href={`mailto:${company.contact.email}`} className="cta-channel">
                  <span className="cta-channel-label">{t.common.email}</span>
                  <span className="cta-channel-value" dir="ltr">
                    {company.contact.email}
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
