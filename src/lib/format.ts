const COMPACT_FORMATTER = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCompactCurrency(value: number): string {
  return `$${COMPACT_FORMATTER.format(value)}`;
}

export function formatCompactNumber(value: number): string {
  return COMPACT_FORMATTER.format(value);
}

export function formatFullCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

const CURRENCY_FIELD_HINTS = ["spend", "price", "cost", "amount", "total"];

/** The backend's chart payload only names a value_field (e.g.
 * "total_spending", "order_count") — it doesn't say whether it's a dollar
 * amount or a plain count. Inferred from the field name rather than
 * guessed by an LLM, so it's deterministic. */
export function isLikelyCurrencyField(fieldName: string): boolean {
  const lower = fieldName.toLowerCase();
  return CURRENCY_FIELD_HINTS.some((hint) => lower.includes(hint));
}
