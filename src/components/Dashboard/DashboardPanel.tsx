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

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{title}</h2>
      {subtitle && <p className="mb-1 text-[0.7rem] text-ink-faint">{subtitle}</p>}
      <div className={subtitle ? "" : "mt-2"}>{children}</div>
    </div>
  );
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

  if (isLoading)
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink-faint">
        Loading analytics…
      </div>
    );
  if (error)
    return (
      <div className="flex h-full items-center justify-center text-sm text-oxide">
        Couldn't load analytics.
      </div>
    );
  if (!data) return null;

  if (selectedDepartment) {
    return (
      <div className="mx-auto max-w-3xl">
        <DepartmentDrilldown department={selectedDepartment} onBack={() => setSelectedDepartment(null)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <p className="mb-4 font-mono text-xs uppercase tracking-wide text-brass">
        Live analytics · California state purchase orders
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Spend by fiscal year">
          <DashboardBarChart data={data.by_fiscal_year} xKey="fiscal_year" yKey="total_spend" height={220} />
        </Card>
        <Card title="Quarterly trend">
          <DashboardLineChart data={quarterlyTrend} xKey="label" yKey="total_spend" height={220} />
        </Card>
        <Card title="Spend by acquisition type">
          <DashboardPieChart
            data={data.by_acquisition_type}
            nameKey="acquisition_type"
            valueKey="total_spend"
            height={220}
          />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Top departments" subtitle="Click a department for detail.">
          <ul className="space-y-1 text-sm">
            {data.top_departments.map((d) => (
              <li key={d.department}>
                <button
                  type="button"
                  onClick={() => setSelectedDepartment(d.department)}
                  className="flex w-full justify-between gap-2 rounded px-1 py-1 text-left hover:bg-paper-dim"
                >
                  <span className="truncate text-ink-soft">{d.department}</span>
                  <span className="shrink-0 font-mono font-medium text-ink">
                    {formatCompactCurrency(d.total_spend)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Top suppliers">
          <ul className="space-y-1 text-sm">
            {data.top_suppliers.map((s) => (
              <li key={s.supplier} className="flex justify-between gap-2 px-1 py-1">
                <span className="truncate text-ink-soft">{s.supplier}</span>
                <span className="shrink-0 font-mono text-ink">{formatCompactCurrency(s.total_spend)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
