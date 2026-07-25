export function SuggestionChips({
  suggestions,
  onSelect,
  disabled,
}: {
  suggestions: string[];
  onSelect: (text: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {suggestions.map((s) => (
        <button
          key={s}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(s)}
          className="rounded-full border border-line bg-surface px-3 py-1.5 text-left text-xs text-ink-soft transition-colors hover:border-ledger hover:text-ledger disabled:opacity-50"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
