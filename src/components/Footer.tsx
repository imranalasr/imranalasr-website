import Image from "next/image";
import Link from "next/link";
import { getDictionary } from "@/i18n/dictionaries";
import { href, type Locale } from "@/i18n/config";
import { resolveCompany } from "@/lib/content";

export default async function Footer({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const c = await resolveCompany();
  const year = new Date().getFullYear();

  const nav = [
    { path: "/about", label: t.nav.about },
    { path: "/services", label: t.nav.services },
    { path: "/projects", label: t.nav.projects },
    { path: "/quality", label: t.nav.quality },
    { path: "/contact", label: t.nav.contact },
    { path: "/quote", label: t.nav.quote },
    { path: "/privacy", label: t.nav.privacy },
  ];

  return (
    <footer className="site-footer section" data-surface="ink" data-surface-section="ink">
      <div className="page">
        <div className="footer-top">
          <div className="footer-brand">
            {/* Per-locale lockup: the mark sits beside the wordmark of the
                language being read, at its true 2.2:1 proportion. The combined
                AR+EN lockup is 4.2:1 with a large void in the middle, which
                reads as stretched at footer size. */}
            <Image
              src={locale === "ar" ? "/brand/lockup-ar-white.png" : "/brand/lockup-en-white.png"}
              alt={t.meta.siteName}
              width={1400}
              height={locale === "ar" ? 642 : 636}
              className="footer-lockup"
            />
            <p className="footer-blurb">{t.footer.blurb}</p>
            <Link href={href("/profile-request", locale)} className="btn btn-ghost footer-profile-cta">
              {t.common.requestProfile}
            </Link>
          </div>

          <div className="footer-col">
            <h2 className="footer-heading">{t.footer.nav}</h2>
            <ul>
              {nav.map((n) => (
                <li key={n.path}>
                  <Link href={href(n.path, locale)} className="link-sweep">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h2 className="footer-heading">{t.footer.contact}</h2>
            <ul>
              <li>
                <a href={`tel:${c.contact.phonePrimary}`} className="link-sweep tabular" dir="ltr">
                  {c.contact.phonePrimaryDisplay}
                </a>
              </li>
              <li>
                <a href={`tel:${c.contact.phoneSecondary}`} className="link-sweep tabular" dir="ltr">
                  {c.contact.phoneSecondaryDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${c.contact.email}`} className="link-sweep" dir="ltr">
                  {c.contact.email}
                </a>
              </li>
              <li className="footer-address">{c.address.lines[locale]}</li>
              <li className="footer-address">{c.hours[locale]}</li>
            </ul>
          </div>

          <div className="footer-col">
            <h2 className="footer-heading">{t.footer.legal}</h2>
            <ul className="footer-legal">
              <li>
                <span>{t.footer.cr}</span>
                <span className="tabular">{c.commercialRegistration}</span>
              </li>
              <li>
                <span>{t.footer.unified}</span>
                <span className="tabular">{c.unifiedNationalNumber}</span>
              </li>
              <li>
                <span>{t.footer.vat}</span>
                <span className="tabular">{c.vatNumber}</span>
              </li>
              <li>
                <span>ISO</span>
                <span className="tabular">9001 · 14001 · 45001</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="tabular">
            © {year} {t.meta.siteName} — {t.footer.rights}
          </p>
          <p className="footer-domain">
            {t.footer.domainNote}{" "}
            <span className="tabular" dir="ltr">
              {c.futureDomain}
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
