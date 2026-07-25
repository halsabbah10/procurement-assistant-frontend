import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactCurrency } from "../../lib/format";

// Same validated palette as Chat/InsightChart.tsx — see that file's note
// and index.css for the dataviz-skill validation record. Kept as a
// sibling constant rather than a shared import since the two chart sets
// serve different views with no other coupling.
const LEDGER_GREEN = "#0f5c4d";
const PIE_COLORS = ["#1b8a6b", "#c99a2e", "#4a5fc1"];
const OTHER_COLOR = "#8b8779";

const tooltipStyle = {
  fontFamily: "var(--font-sans)",
  fontSize: 12,
  border: "1px solid #e2ddd0",
  borderRadius: 6,
};

const tooltipFormatter = (value: unknown) =>
  typeof value === "number" ? formatCompactCurrency(value) : String(value);

export function DashboardBarChart({
  data,
  xKey,
  yKey,
  height = 180,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="0" stroke="#e2ddd0" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: "#58554d" }} tickLine={false} axisLine={{ stroke: "#c3c2b7" }} />
        <YAxis
          tick={{ fontSize: 10, fill: "#58554d" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => formatCompactCurrency(v)}
          width={48}
        />
        <Tooltip formatter={tooltipFormatter} cursor={{ fill: "#f2f0e9" }} contentStyle={tooltipStyle} />
        <Bar dataKey={yKey} fill={LEDGER_GREEN} radius={[3, 3, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DashboardLineChart({
  data,
  xKey,
  yKey,
  height = 180,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="0" stroke="#e2ddd0" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 9, fill: "#58554d" }} tickLine={false} axisLine={{ stroke: "#c3c2b7" }} />
        <YAxis
          tick={{ fontSize: 10, fill: "#58554d" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => formatCompactCurrency(v)}
          width={48}
        />
        <Tooltip formatter={tooltipFormatter} contentStyle={tooltipStyle} />
        <Line
          type="monotone"
          dataKey={yKey}
          stroke={LEDGER_GREEN}
          strokeWidth={2}
          dot={{ r: 3, fill: LEDGER_GREEN, stroke: "#faf9f5", strokeWidth: 1.5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DashboardPieChart({
  data,
  nameKey,
  valueKey,
  height = 180,
}: {
  data: Record<string, unknown>[];
  nameKey: string;
  valueKey: string;
  height?: number;
}) {
  const MAX_SLICES = 3;
  const shaped =
    data.length <= MAX_SLICES + 1
      ? data
      : [
          ...data.slice(0, MAX_SLICES),
          {
            [nameKey]: "Other",
            [valueKey]: data.slice(MAX_SLICES).reduce((sum, r) => sum + (r[valueKey] as number), 0),
          },
        ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={shaped} dataKey={valueKey} nameKey={nameKey} outerRadius="75%" stroke="#faf9f5" strokeWidth={2}>
          {shaped.map((entry, i) => (
            <Cell
              key={String(entry[nameKey])}
              fill={entry[nameKey] === "Other" ? OTHER_COLOR : PIE_COLORS[i % PIE_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip formatter={tooltipFormatter} contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}
