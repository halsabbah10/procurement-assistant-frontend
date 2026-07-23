import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface SpendByYear {
  fiscal_year: string;
  total_spend: number;
  order_count: number;
}

export function SpendChart({ data }: { data: SpendByYear[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="fiscal_year" fontSize={12} />
        <YAxis
          fontSize={12}
          tickFormatter={(v: number) => `$${(v / 1e9).toFixed(1)}B`}
        />
        <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
        <Bar dataKey="total_spend" fill="#2563eb" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
