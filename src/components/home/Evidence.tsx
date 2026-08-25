import Link from "next/link";
import EvidenceScene from "./EvidenceScene";
import { href, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Credential } from "@/content/certifications";

/**
 * Evidence, on the trust surface.
 *
 * Certificates are treated as documents rather than badges: the certified
 * system, its registration and certificate numbers, its validity window and
 * the address the reviewer can verify it at. `EvidenceScene` holds them one
 * at a time so each is read at the size a document is read at; this component
 * decides what is in them, and nothing is asserted that the certificate does
 * not itself print.
 *
 * The statutory registrations sit beneath as a plain register — commercial
 * registration, unified number, VAT, chamber membership — because that is the
 * block a procurement officer copies into a prequalification form.
 *
 * The certificate images themselves are deliberately not published; only
 * their data is, exactly as transcribed.
 */
export default function Evidence({
  locale,
  t,
  credentials,
}: {
  locale: Locale;
  t: Dictionary;
  credentials: Credential[];
}) {
  const systems = credentials.filter((c) => c.kind === "iso");
  const registrations = credentials.filter((c) => c.kind !== "iso");
  if (!systems.length && !registrations.length) return null;

  const arrow = locale === "ar" ? "←" : "→";

  return (
    <EvidenceScene locale={locale} t={t} systems={systems}>
      <div className="page ledger-block">
        {registrations.length > 0 && (
          <>
            <p className="ledger-label" data-reveal="up">
              {t.home.qualityRegistrationsLabel}
            </p>
            {/* The statutory register, set out as a numbered document rather
                than as a list. Every field the registration prints is printed
                here: its own name, its numbers, the authority that holds it,
                and the address a reviewer can check it at. */}
            {/* A ledger, with a ruled head: the same columns every row is
                read down, so the block can be scanned as a table rather than
                as three paragraphs that happen to line up. */}
            <div className="ledger" role="table" aria-label={t.home.qualityRegistrationsLabel}>
              <div className="ledger-head" role="row">
                <span role="columnheader">{t.home.qualityRegisterColumn}</span>
                <span role="columnheader">{registrations[0]?.facts[0]?.label[locale]}</span>
                <span role="columnheader">{registrations[0]?.facts[1]?.label[locale]}</span>
                <span role="columnheader">{t.quality.issuerLabel}</span>
                <span role="columnheader">{t.common.verifyAt}</span>
              </div>
              {registrations.map((c, i) => (
                <div key={c.id} className="ledger-row" role="row" data-register-row="">
                  <span className="ledger-rule" aria-hidden="true" />
                  <span className="ledger-name" role="cell">
                    <span className="tabular ledger-index">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {c.code[locale]}
                  </span>
                  {[0, 1].map((k) => (
                    <span key={k} className="ledger-cell" role="cell">
                      <span className="ledger-cell-label">{c.facts[k]?.label[locale]}</span>
                      <span className="tabular ledger-value">{c.facts[k]?.value ?? "—"}</span>
                    </span>
                  ))}
                  <span className="ledger-issuer" role="cell">
                    {c.issuer[locale]}
                  </span>
                  <span className="ledger-verify" role="cell">
                    {c.verifyUrl ? (
                      <a href={c.verifyUrl} target="_blank" rel="noreferrer noopener">
                        {c.verifyUrl.replace(/^https?:\/\//, "")}
                        <span aria-hidden="true"> ↗</span>
                      </a>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="section-foot ledger-foot" data-reveal="up">
          <Link href={href("/quality", locale)} className="btn btn-ghost">
            {t.nav.quality}
            <span className="arrow" aria-hidden="true">
              {arrow}
            </span>
          </Link>
        </div>
      </div>
    </EvidenceScene>
  );
}
