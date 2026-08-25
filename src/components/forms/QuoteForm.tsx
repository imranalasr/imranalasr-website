"use client";

import { useRef } from "react";
import Link from "next/link";
import { Field, Honeypot } from "./fields";
import { useSubmit } from "./useSubmit";
import { quoteSchema, PROJECT_TYPES, DURATIONS, START_WINDOWS, CONTACT_METHODS } from "@/lib/validation";
import { href, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export default function QuoteForm({ locale, t, whatsappBase }: { locale: Locale; t: Dictionary; whatsappBase: string }) {
  const f = t.forms;
  const formRef = useRef<HTMLFormElement>(null);
  const { state, errors, submit, reset } = useSubmit("/api/quote", quoteSchema, f.errors);

  if (state.phase === "done") {
    const summary =
      locale === "ar"
        ? `مرحباً، أرسلت طلب عرض سعر عبر الموقع.\nالرقم المرجعي: ${state.reference}`
        : `Hello, I submitted a quote request through the website.\nReference: ${state.reference}`;
    return (
      <div className="form-success card" role="status" data-reveal="up">
        <p className="eyebrow">{t.quote.eyebrow}</p>
        <h2 className="form-success-title">{t.quote.successTitle}</h2>
        <p className="form-success-body">{t.quote.successBody}</p>
        <p className="form-reference-label">{t.quote.referenceLabel}</p>
        <p className="tabular form-reference">{state.reference}</p>
        <div className="form-success-actions">
          <a className="btn" href={`${whatsappBase}?text=${encodeURIComponent(summary)}`} target="_blank" rel="noreferrer noopener">
            {t.quote.whatsappCta}
          </a>
          <button type="button" className="btn btn-ghost" onClick={reset}>
            {t.quote.newRequest}
          </button>
        </div>
      </div>
    );
  }

  return (
    /*
     * Twelve fields in one flat two-column grid asked the reader to work out
     * where the form changes subject. It is the same twelve fields, the same
     * names and the same validation — grouped into the three questions the
     * form is actually asking: who is asking, what the project is, and when
     * and how to come back to them. `FormData` reads named controls wherever
     * they sit, so the grouping is presentational only.
     */
    <form
      ref={formRef}
      className="form-flow"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit(e.currentTarget, { locale });
      }}
    >
      <Honeypot />

      <fieldset className="form-group">
        <legend className="form-group-title">{f.groupContact}</legend>
        <p className="form-group-hint">{f.groupContactHint}</p>
        <div className="form-grid">
          <Field label={f.name} name="name" required error={errors.name}>
            {(p) => <input {...p} className="control" type="text" autoComplete="name" required />}
          </Field>

          <Field label={f.company} name="company" required error={errors.company}>
            {(p) => <input {...p} className="control" type="text" autoComplete="organization" required />}
          </Field>

          <Field label={f.jobTitle} name="jobTitle" hint={t.common.optional} error={errors.jobTitle}>
            {(p) => <input {...p} className="control" type="text" autoComplete="organization-title" />}
          </Field>

          <Field label={f.phone} name="phone" required error={errors.phone} hint="05XXXXXXXX">
            {(p) => <input {...p} className="control tabular" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" required />}
          </Field>

          <Field label={f.email} name="email" required error={errors.email} full>
            {(p) => <input {...p} className="control" type="email" autoComplete="email" dir="ltr" required />}
          </Field>
        </div>
      </fieldset>

      <fieldset className="form-group">
        <legend className="form-group-title">{f.groupProject}</legend>
        <p className="form-group-hint">{f.groupProjectHint}</p>
        <div className="form-grid">
          <Field label={f.projectType} name="projectType" required error={errors.projectType}>
            {(p) => (
              <select {...p} className="control" defaultValue="" required>
                <option value="" disabled>
                  {f.choose}
                </option>
                {PROJECT_TYPES.map((k) => (
                  <option key={k} value={k}>
                    {f.projectTypes[k]}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field label={f.projectLocation} name="projectLocation" required error={errors.projectLocation}>
            {(p) => <input {...p} className="control" type="text" required />}
          </Field>

          <Field label={f.scopeOfWork} name="scopeOfWork" required error={errors.scopeOfWork} full>
            {(p) => <input {...p} className="control" type="text" required />}
          </Field>

          <Field label={f.projectDescription} name="description" required error={errors.description} full>
            {(p) => <textarea {...p} className="control" rows={6} required />}
          </Field>
        </div>
      </fieldset>

      <fieldset className="form-group">
        <legend className="form-group-title">{f.groupTiming}</legend>
        <p className="form-group-hint">{f.groupTimingHint}</p>
        <div className="form-grid">
          <Field label={f.startDate} name="startDate" error={errors.startDate}>
            {(p) => (
              <select {...p} className="control" defaultValue="unknown">
                {START_WINDOWS.map((k) => (
                  <option key={k} value={k}>
                    {f.startWindows[k]}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field label={f.duration} name="duration" error={errors.duration}>
            {(p) => (
              <select {...p} className="control" defaultValue="unknown">
                {DURATIONS.map((k) => (
                  <option key={k} value={k}>
                    {f.durations[k]}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <div className="field field-radios" data-full="true" role="group" aria-labelledby="preferred-contact-label">
            <span className="field-radios-label" id="preferred-contact-label">
              {f.preferredContact}
            </span>
            <div className="radio-row">
              {CONTACT_METHODS.map((k, i) => (
                <label key={k} className="radio-chip">
                  <input type="radio" name="preferredContact" value={k} defaultChecked={i === 0} required />
                  <span>{f.contactMethods[k]}</span>
                </label>
              ))}
            </div>
            {errors.preferredContact ? <p className="error-text">{errors.preferredContact}</p> : null}
          </div>
        </div>
      </fieldset>

      <div className="field field-consent">
        <label className="consent">
          <input type="checkbox" name="consent" value="yes" />
          <span>
            {f.consent}{" "}
            <Link href={href("/privacy", locale)} className="link-sweep">
              {t.nav.privacy}
            </Link>
          </span>
        </label>
        {errors.consent ? <p className="error-text">{errors.consent}</p> : null}
      </div>

      {state.phase === "error" ? (
        <p className="form-error" role="alert">
          {state.message}
        </p>
      ) : null}

      <div className="form-actions">
        <button type="submit" className="btn" disabled={state.phase === "sending"}>
          {state.phase === "sending" ? t.common.submitting : f.submitQuote}
        </button>
        <p className="form-note">{t.quote.noBudgetNote}</p>
      </div>
    </form>
  );
}
