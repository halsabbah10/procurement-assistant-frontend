import { useQuery } from "@tanstack/react-query";
import { fetchDepartmentDrilldown } from "../../lib/api";
import { formatCompactCurrency, formatCompactNumber } from "../../lib/format";
import { DashboardBarChart } from "./charts";

export function DepartmentDrilldown({ department, onBack }: { department: string; onBack: () => void }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["department-detail", department],
    queryFn: () => fetchDepartmentDrilldown(department),
  });

  return (
    <div className="p-4">
      <button
        type="button"
        onClick={onBack}
        className="mb-3 font-mono text-xs uppercase tracking-wide text-ink-faint hover:text-ledger"
      >
        ← All departments
      </button>
      <h2 className="font-display text-base font-semibold text-ink">{department}</h2>

      {isLoading && <p className="mt-3 text-sm text-ink-faint">Loading…</p>}
      {error && <p className="mt-3 text-sm text-oxide">Couldn't load department detail.</p>}

      {data && (
        <>
          <div className="mt-2 flex gap-4 font-mono text-xs text-ink-soft">
            <span>{formatCompactCurrency(data.total_spend)} total</span>
            <span>{formatCompactNumber(data.order_count)} orders</span>
          </div>

          <h3 className="mb-1 mt-5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Spend by fiscal year
          </h3>
          <DashboardBarChart data={data.by_fiscal_year} xKey="fiscal_year" yKey="total_spend" height={140} />

          <h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Top suppliers
          </h3>
          <ul className="space-y-1 text-sm">
            {data.top_suppliers.map((s: { supplier: string; total_spend: number }) => (
              <li key={s.supplier} className="flex justify-between gap-2">
                <span className="truncate text-ink-soft">{s.supplier}</span>
                <span className="shrink-0 font-mono text-ink">{formatCompactCurrency(s.total_spend)}</span>
              </li>
            ))}
          </ul>

          <h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Top categories
          </h3>
          <ul className="space-y-1 text-sm">
            {data.top_categories.map((c: { category: string; total_spend: number }) => (
              <li key={c.category} className="flex justify-between gap-2">
                <span className="truncate text-ink-soft">{c.category}</span>
                <span className="shrink-0 font-mono text-ink">{formatCompactCurrency(c.total_spend)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
