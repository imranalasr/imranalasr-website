import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/forms/ContactForm";
import { MaskLines } from "@/components/MaskLines";
import { getDictionary } from "@/i18n/dictionaries";
import { href, isLocale, locales, type Locale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { resolveCompany } from "@/lib/content";
import { whatsappLink } from "@/content/company";

export const revalidate = 300;
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/contact", title: t.nav.contact, description: t.contact.lead });
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = getDictionary(locale);
  const c = await resolveCompany();

  return (
    <>
      <PageHero eyebrow={t.contact.eyebrow} title={t.contact.title} lead={t.contact.lead} />

      <section className="section" data-surface-section="light">
        <div className="page contact-layout">
          <div className="contact-details" data-reveal-group="">
            <div className="contact-block" data-reveal="up">
              <h2 className="contact-block-title">{t.contact.officeTitle}</h2>
              <p className="contact-address">{c.address.lines[locale]}</p>
              <p className="tabular contact-short">
                {locale === "ar" ? "العنوان المختصر" : "Short address"}: {c.address.shortCode}
              </p>
            </div>

            <div className="contact-block" data-reveal="up">
              <h2 className="contact-block-title">{t.contact.channelsTitle}</h2>
              <ul className="contact-channels">
                <li>
                  <span>{t.common.call}</span>
                  <a href={`tel:${c.contact.phonePrimary}`} className="link-sweep tabular" dir="ltr">
                    {c.contact.phonePrimaryDisplay}
                  </a>
                </li>
                <li>
                  <span>{t.common.call}</span>
                  <a href={`tel:${c.contact.phoneSecondary}`} className="link-sweep tabular" dir="ltr">
                    {c.contact.phoneSecondaryDisplay}
                  </a>
                </li>
                <li>
                  <span>{t.common.whatsapp}</span>
                  <a
                    href={whatsappLink(locale === "ar" ? "مرحباً، أود الاستفسار عن خدماتكم." : "Hello, I would like to enquire about your services.")}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="link-sweep tabular"
                    dir="ltr"
                  >
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

            <div className="contact-block" data-reveal="up">
              <h2 className="contact-block-title">{t.contact.hoursTitle}</h2>
              <p>{c.hours[locale]}</p>
            </div>

            <div className="contact-block" data-reveal="up">
              <h2 className="contact-block-title">{t.contact.legalTitle}</h2>
              <dl className="contact-legal">
                <div>
                  <dt>{t.footer.cr}</dt>
                  <dd className="tabular">{c.commercialRegistration}</dd>
                </div>
                <div>
                  <dt>{t.footer.unified}</dt>
                  <dd className="tabular">{c.unifiedNationalNumber}</dd>
                </div>
                <div>
                  <dt>{t.footer.vat}</dt>
                  <dd className="tabular">{c.vatNumber}</dd>
                </div>
              </dl>
            </div>

            <div className="contact-block contact-quote-prompt card" data-reveal="up">
              <h2 className="contact-block-title">{t.contact.quotePromptTitle}</h2>
              <p>{t.contact.quotePromptBody}</p>
              <Link href={href("/quote", locale)} className="btn btn-ghost">
                {t.common.requestQuote}
              </Link>
            </div>
          </div>

          <div className="contact-form-wrap">
            <MaskLines as="h2" className="section-title contact-form-title" lines={[t.contact.formTitle]} />
            <ContactForm locale={locale} t={t} />
          </div>
        </div>
      </section>
    </>
  );
}
