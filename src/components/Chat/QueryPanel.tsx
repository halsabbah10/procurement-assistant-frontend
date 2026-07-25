import { useState } from "react";
import { exportQueryResults } from "../../lib/api";

export function QueryPanel({ query }: { query: string }) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<"csv" | "json" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async (format: "csv" | "json") => {
    setExporting(format);
    setExportError(null);
    try {
      await exportQueryResults(query, format);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="mt-3">
      <div className="perforated-edge" aria-hidden="true" />
      <div className="rounded-b-lg border border-t-0 border-line bg-paper-dim">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between px-3 py-2 text-left"
          aria-expanded={open}
        >
          <span className="font-mono text-[0.7rem] uppercase tracking-wide text-ink-faint">
            {open ? "Hide" : "View"} generated query
          </span>
          <span className="font-mono text-[0.7rem] text-ink-faint">{open ? "−" : "+"}</span>
        </button>
        {open && (
          <div className="border-t border-line px-3 py-2">
            <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs text-ink-soft">
              {query}
            </pre>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleExport("csv")}
                disabled={exporting !== null}
                className="rounded border border-line bg-surface px-2 py-1 font-mono text-[0.7rem] uppercase tracking-wide text-ink-soft hover:border-ledger hover:text-ledger disabled:opacity-50"
              >
                {exporting === "csv" ? "Exporting…" : "Export CSV"}
              </button>
              <button
                type="button"
                onClick={() => handleExport("json")}
                disabled={exporting !== null}
                className="rounded border border-line bg-surface px-2 py-1 font-mono text-[0.7rem] uppercase tracking-wide text-ink-soft hover:border-ledger hover:text-ledger disabled:opacity-50"
              >
                {exporting === "json" ? "Exporting…" : "Export JSON"}
              </button>
              {exportError && <span className="text-[0.7rem] text-oxide">{exportError}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
