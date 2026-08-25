import type { Credential } from "@/content/certifications";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * A credential card carries the certificate's data — never the certificate
 * itself. The verification link is only rendered when the certificate prints
 * an official address to verify against.
 */
export default function CredentialCard({
  credential: c,
  locale,
  t,
  detailed = false,
}: {
  credential: Credential;
  locale: Locale;
  t: Dictionary;
  detailed?: boolean;
}) {
  return (
    <article className="cred-card card" data-reveal="up" data-kind={c.kind}>
      <header className="cred-head">
        {/* The index is drawn by the grid's own counter — a card does not
            know its position, and hand-numbering them would go stale the
            moment one is unpublished from the dashboard. */}
        <p className="tabular cred-code">{c.code[locale]}</p>
        <h3 className="cred-title">{c.title[locale]}</h3>
      </header>

      <dl className="cred-facts">
        {c.facts.map((f) => (
          <div key={f.label.en} className="cred-fact">
            <dt>{f.label[locale]}</dt>
            <dd className="tabular">{f.value}</dd>
          </div>
        ))}
      </dl>

      {detailed && c.scope ? (
        <div className="cred-block">
          <p className="cred-block-label">{t.quality.scopeLabel}</p>
          <p className="cred-block-body">{c.scope[locale]}</p>
        </div>
      ) : null}

      <footer className="cred-foot">
        <p className="cred-issuer">
          <span className="cred-block-label">{t.quality.issuerLabel}</span>
          {c.issuer[locale]}
        </p>
        {detailed && c.accreditation ? <p className="cred-accred">{c.accreditation[locale]}</p> : null}
        {c.verifyUrl ? (
          <a className="link-sweep cred-verify" href={c.verifyUrl} target="_blank" rel="noreferrer noopener">
            {t.common.verifyAt} {c.verifyUrl.replace(/^https?:\/\//, "")}
            <span aria-hidden="true"> ↗</span>
          </a>
        ) : null}
      </footer>
    </article>
  );
}
