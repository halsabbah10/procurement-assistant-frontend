import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAnalyticsSummary } from "../../lib/api";
import { formatCompactCurrency } from "../../lib/format";
import { DashboardBarChart, DashboardLineChart, DashboardPieChart } from "./charts";
import { DepartmentDrilldown } from "./DepartmentDrilldown";

interface Summary {
  by_fiscal_year: Array<{ fiscal_year: string; total_spend: number; order_count: number }>;
  top_departments: Array<{ department: string; total_spend: number; order_count: number }>;
  by_acquisition_type: Array<{ acquisition_type: string; total_spend: number }>;
  top_suppliers: Array<{ supplier: string; total_spend: number; order_count: number }>;
  by_quarter: Array<{ fiscal_year: string; quarter: number; total_spend: number }>;
}

export function DashboardPanel() {
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery<Summary>({
    queryKey: ["analytics-summary"],
    queryFn: fetchAnalyticsSummary,
  });

  const quarterlyTrend = useMemo(
    () =>
      data?.by_quarter.map((q) => ({
        label: `${q.fiscal_year.slice(2, 4)}-${q.fiscal_year.slice(7, 9)} Q${q.quarter}`,
        total_spend: q.total_spend,
      })) ?? [],
    [data],
  );

  if (isLoading) return <div className="p-4 text-sm text-ink-faint">Loading dashboard…</div>;
  if (error) return <div className="p-4 text-sm text-oxide">Couldn't load analytics.</div>;
  if (!data) return null;

  if (selectedDepartment) {
    return (
      <div className="h-full overflow-y-auto">
        <DepartmentDrilldown department={selectedDepartment} onBack={() => setSelectedDepartment(null)} />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <p className="mb-4 font-mono text-xs uppercase tracking-wide text-brass">Live analytics</p>

      <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        Spend by fiscal year
      </h2>
      <DashboardBarChart data={data.by_fiscal_year} xKey="fiscal_year" yKey="total_spend" />

      <h2 className="mb-1 mt-6 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        Quarterly trend
      </h2>
      <DashboardLineChart data={quarterlyTrend} xKey="label" yKey="total_spend" />

      <h2 className="mb-1 mt-6 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        Spend by acquisition type
      </h2>
      <DashboardPieChart data={data.by_acquisition_type} nameKey="acquisition_type" valueKey="total_spend" />

      <h2 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        Top departments
      </h2>
      <p className="mb-1 text-[0.7rem] text-ink-faint">Click a department for detail.</p>
      <ul className="space-y-1 text-sm">
        {data.top_departments.map((d) => (
          <li key={d.department}>
            <button
              type="button"
              onClick={() => setSelectedDepartment(d.department)}
              className="flex w-full justify-between gap-2 rounded px-1 py-0.5 text-left hover:bg-paper-dim"
            >
              <span className="truncate text-ink-soft">{d.department}</span>
              <span className="shrink-0 font-mono font-medium text-ink">
                {formatCompactCurrency(d.total_spend)}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <h2 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        Top suppliers
      </h2>
      <ul className="space-y-1 text-sm">
        {data.top_suppliers.map((s) => (
          <li key={s.supplier} className="flex justify-between gap-2">
            <span className="truncate text-ink-soft">{s.supplier}</span>
            <span className="shrink-0 font-mono text-ink">{formatCompactCurrency(s.total_spend)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
