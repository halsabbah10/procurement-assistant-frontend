import { useQuery } from "@tanstack/react-query";
import { fetchAnalyticsSummary } from "../../lib/api";
import { SpendChart } from "./SpendChart";

export function DashboardPanel() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: fetchAnalyticsSummary,
  });

  if (isLoading) return <div className="p-4 text-sm text-slate-400">Loading dashboard…</div>;
  if (error) return <div className="p-4 text-sm text-red-500">Couldn't load analytics.</div>;

  return (
    <div className="h-full overflow-y-auto border-l p-4">
      <h2 className="mb-2 text-sm font-semibold text-slate-700">Spend by fiscal year</h2>
      <SpendChart data={data.by_fiscal_year} />
      <h2 className="mb-2 mt-6 text-sm font-semibold text-slate-700">Top departments</h2>
      <ul className="space-y-1 text-sm">
        {data.top_departments.map((d: { department: string; total_spend: number }) => (
          <li key={d.department} className="flex justify-between">
            <span className="truncate text-slate-600">{d.department}</span>
            <span className="font-medium text-slate-900">
              ${(d.total_spend / 1e6).toFixed(1)}M
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
