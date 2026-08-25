import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

/**
 * A quiet band carrying the Qur'anic verse the company is named after.
 *
 * Hūd 61 — «هُوَ أَنْشَأَكُمْ مِنَ الْأَرْضِ وَاسْتَعْمَرَكُمْ فِيهَا» — turns on the root
 * ع-م-ر, which is the root of عِمران itself: to build up and settle the earth.
 * That is why this verse and not another: it is the company's own name read
 * back to its source, not decoration.
 *
 * It is set apart from the marketing voice on its own surface, with the
 * traditional ornate brackets drawn in CSS (the U+FD3E/U+FD3F glyphs are not
 * carried by the site's typefaces), unhurried leading for the vowel marks, and
 * no call to action anywhere near it. On the English side the Arabic stays as
 * it is — the verse is the verse — with the meaning rendered underneath.
 *
 * It sits directly under the cover, on the cover's own dark ground: the name
 * is stated, then where the name comes from, and only then what the company
 * does. Read at the foot of the page instead it was decoration; read here it
 * is the foundation, and it costs the reader one quiet screen to take in.
 */
export default function VerseBand({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);

  return (
    <section
      className="verse-band"
      data-surface="ink"
      data-surface-section="ink"
      aria-label={t.home.verseRef}
    >
      <div className="blueprint-grid verse-grid" aria-hidden="true" />
      <div className="page verse-inner">
        <p className="verse-text" lang="ar" dir="rtl" data-reveal="fade">
          {t.home.verseText}
        </p>

        {t.home.verseMeaning ? <p className="verse-meaning" data-reveal="up">{t.home.verseMeaning}</p> : null}

        <p className="verse-ref tabular" data-reveal="up">
          {t.home.verseRef}
        </p>
        <p className="verse-note" data-reveal="up">
          {t.home.verseNote}
        </p>
      </div>
    </section>
  );
}
