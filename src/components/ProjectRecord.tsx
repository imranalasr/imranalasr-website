/**
 * A project's data block, set out the way a project sheet sets one out: a
 * fixed column of field names against their values.
 *
 * The point of it is the *shape*, not the contents. A reviewer looking at a
 * contractor's project expects to find year, status, scope and type in one
 * place, and until now this site had those facts — the ones it actually holds
 * — spread between a caption, a list and a section further down the page.
 *
 * Only two things are asserted about a project anywhere on this site: its name
 * and the region it names (see `src/content/projects.ts`). Year, status,
 * contract value, client and duration are not in any supplied document, so
 * they are not in the `Project` type and nothing here invents them.
 *
 * What this component does is make them cheap to add later. A field whose
 * value is absent or blank is dropped rather than rendered as an empty row or
 * a dash, so the day a document supports a completion year the caller adds
 *
 *     { label: t.projects.recordYear, value: project.year, tabular: true }
 *
 * to its list and the row appears, in the right place, already styled. Until
 * that document exists the row simply is not there — which is the honest
 * rendering of "we do not publish that", and is very deliberately not the
 * same thing as printing "N/A".
 */

export type RecordField = {
  label: string;
  /** Dropped when absent, null or blank — never rendered as an empty row. */
  value?: string | number | null;
  /** Set for figures and codes, which are read in the engineering face. */
  tabular?: boolean;
};

export default function ProjectRecord({
  fields,
  className,
}: {
  fields: RecordField[];
  className?: string;
}) {
  const rows = fields.filter(
    (f) => f.value !== undefined && f.value !== null && String(f.value).trim() !== ""
  );
  if (!rows.length) return null;

  return (
    <dl className={className ? `project-record ${className}` : "project-record"}>
      {rows.map((f) => (
        <div className="project-record-row" key={f.label}>
          <dt>{f.label}</dt>
          <dd className={f.tabular ? "tabular" : undefined}>{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}
