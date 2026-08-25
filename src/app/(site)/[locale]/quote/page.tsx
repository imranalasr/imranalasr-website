import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHero from "@/components/PageHero";
import QuoteForm from "@/components/forms/QuoteForm";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { resolveCompany } from "@/lib/content";

export const revalidate = 300;
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/quote", title: t.nav.quote, description: t.quote.lead });
}

export default async function QuotePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = getDictionary(locale);
  const c = await resolveCompany();

  return (
    <>
      <PageHero eyebrow={t.quote.eyebrow} title={t.quote.title} lead={t.quote.lead} />

      <section className="section" data-surface-section="light">
        <div className="page form-layout">
          <div className="form-main">
            <QuoteForm locale={locale} t={t} whatsappBase={`https://wa.me/${c.contact.whatsapp}`} />
          </div>

          <aside className="form-aside" data-reveal-group="">
            <div className="form-aside-card card" data-reveal="up">
              <h2 className="form-aside-title">{t.quote.sidebarTitle}</h2>
              <ol className="form-steps">
                {t.quote.steps.map((s, i) => (
                  <li key={s}>
                    <span className="tabular">{String(i + 1).padStart(2, "0")}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>

            <div className="form-aside-card card" data-reveal="up">
              <h2 className="form-aside-title">{t.contact.channelsTitle}</h2>
              <ul className="contact-channels">
                <li>
                  <span>{t.common.call}</span>
                  <a href={`tel:${c.contact.phonePrimary}`} className="link-sweep tabular" dir="ltr">
                    {c.contact.phonePrimaryDisplay}
                  </a>
                </li>
                <li>
                  <span>{t.common.email}</span>
                  <a href={`mailto:${c.contact.email}`} className="link-sweep" dir="ltr">
                    {c.contact.email}
                  </a>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
