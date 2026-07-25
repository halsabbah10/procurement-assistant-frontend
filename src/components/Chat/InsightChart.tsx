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
import type { ChartPayload } from "../../lib/types";
import { formatCompactCurrency, formatCompactNumber, isLikelyCurrencyField } from "../../lib/format";

// Validated with the dataviz skill's palette validator against this app's
// paper surface (#faf9f5) — see index.css for the full note. Capped at 3
// slots because that's what clears the all-pairs CVD/normal-vision floors
// in light mode; a pie with more categories folds the rest into "Other"
// rather than adding an unvalidated 4th hue.
const PIE_COLORS = ["#1b8a6b", "#c99a2e", "#4a5fc1"];
const OTHER_COLOR = "#8b8779";
const LEDGER_GREEN = "#0f5c4d";
const MAX_PIE_SLICES = 3;

function foldIntoOther(data: ChartPayload["data"]) {
  if (data.length <= MAX_PIE_SLICES + 1) return data;
  const kept = data.slice(0, MAX_PIE_SLICES);
  const otherTotal = data.slice(MAX_PIE_SLICES).reduce((sum, row) => sum + row.value, 0);
  return [...kept, { category: "Other", value: otherTotal }];
}

const MAX_LABEL_CHARS = 14;

function truncateLabel(label: string): string {
  return label.length > MAX_LABEL_CHARS ? `${label.slice(0, MAX_LABEL_CHARS - 1)}…` : label;
}

export function InsightChart({ chart }: { chart: ChartPayload }) {
  const isCurrency = isLikelyCurrencyField(chart.value_field);
  const formatValue = isCurrency ? formatCompactCurrency : formatCompactNumber;
  // Recharts' Tooltip formatter type accepts its own loose ValueType
  // (string | number | array), not a plain number — this narrows before
  // handing off to our number-only formatters.
  const tooltipFormatter = (value: unknown) =>
    typeof value === "number" ? formatValue(value) : String(value);
  // This dataset's category labels (department/supplier/commodity names)
  // are routinely 20-40+ characters — angling alone doesn't prevent
  // overlap at that length with more than a couple of bars, so long
  // labels are truncated (full text stays in the tooltip) rather than
  // left to collide or get clipped mid-character by the container.
  const hasLongLabels = chart.data.some((d) => d.category.length > MAX_LABEL_CHARS);

  return (
    <div className="mt-3 rounded-lg border border-line bg-surface p-4">
      {chart.title && (
        <p className="mb-3 font-mono text-[0.7rem] uppercase tracking-wide text-ink-faint">
          {chart.title}
        </p>
      )}
      <div className="h-56 w-full" role="img" aria-label={chart.title || "Chart of query results"}>
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === "pie" ? (
            <PieChart>
              <Pie
                data={foldIntoOther(chart.data)}
                dataKey="value"
                nameKey="category"
                innerRadius={0}
                outerRadius="80%"
                stroke="#faf9f5"
                strokeWidth={2}
              >
                {foldIntoOther(chart.data).map((entry, i) => (
                  <Cell
                    key={entry.category}
                    fill={entry.category === "Other" ? OTHER_COLOR : PIE_COLORS[i % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={tooltipFormatter}
                contentStyle={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 12,
                  border: "1px solid #e2ddd0",
                  borderRadius: 6,
                }}
              />
            </PieChart>
          ) : chart.type === "line" ? (
            <LineChart data={chart.data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="0" stroke="#e2ddd0" vertical={false} />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 11, fill: "#58554d" }}
                tickLine={false}
                axisLine={{ stroke: "#c3c2b7" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#58554d" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatValue}
                width={56}
              />
              <Tooltip
                formatter={tooltipFormatter}
                contentStyle={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 12,
                  border: "1px solid #e2ddd0",
                  borderRadius: 6,
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={LEDGER_GREEN}
                strokeWidth={2}
                dot={{ r: 4, fill: LEDGER_GREEN, stroke: "#faf9f5", strokeWidth: 2 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          ) : (
            <BarChart data={chart.data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="0" stroke="#e2ddd0" vertical={false} />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 11, fill: "#58554d" }}
                tickLine={false}
                axisLine={{ stroke: "#c3c2b7" }}
                interval={0}
                tickFormatter={truncateLabel}
                angle={hasLongLabels ? -35 : 0}
                textAnchor={hasLongLabels ? "end" : "middle"}
                height={hasLongLabels ? 64 : 24}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#58554d" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatValue}
                width={56}
              />
              <Tooltip
                formatter={tooltipFormatter}
                cursor={{ fill: "#f2f0e9" }}
                contentStyle={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 12,
                  border: "1px solid #e2ddd0",
                  borderRadius: 6,
                }}
              />
              <Bar dataKey="value" fill={LEDGER_GREEN} radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
