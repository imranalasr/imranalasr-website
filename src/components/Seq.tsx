/**
 * A counted marker — `01 / 05`.
 *
 * The house convention for anything that is one of a known set: a build
 * stage, a capability claim, a project in the showcase, a work package. It
 * states position *and* extent, which is what makes it read as progress
 * through a structured document rather than as decoration.
 *
 * It is always set LTR and bidi-isolated. The glyphs are Latin digits and a
 * solidus, so in an Arabic paragraph the bidi algorithm would otherwise be
 * free to reorder the run around the separator once it is spaced — `01 / 05`
 * is not guaranteed to survive as written. Isolating it makes the pair a
 * single neutral object in the surrounding text, which is exactly what it is.
 *
 * Always decorative. The ordering is carried by the DOM order and by each
 * item's own heading, so a screen reader gains nothing from hearing "zero one
 * slash zero five" before every entry — and the one marker that tracks the
 * scroll would, as a live region, announce itself again on every hand-over.
 */
export default function Seq({
  n,
  of,
  className,
}: {
  /** This item's position. Either a number or an already-padded string. */
  n: number | string;
  /** How many there are in total. */
  of: number;
  className?: string;
}) {
  const pad = (v: number | string) => (typeof v === "number" ? String(v).padStart(2, "0") : v);

  return (
    <span className={`seq tabular${className ? ` ${className}` : ""}`} dir="ltr" aria-hidden="true">
      <span className="seq-n">{pad(n)}</span>
      <span className="seq-rule" />
      <span className="seq-of">{pad(of)}</span>
    </span>
  );
}
