const PROMPTS = [
  "What are the top 5 departments by total spending?",
  "Show me a chart of spending by fiscal year",
  "Which suppliers received the most cybersecurity-related contracts?",
  "What was the trend in quarterly spending over time?",
];

export function StarterPrompts({ onSelect }: { onSelect: (text: string) => void }) {
  return (
    <div className="flex flex-col gap-6 px-4 py-12 text-center">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-brass">
          California State Purchase Orders · FY 2012–2015
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">
          Ask the ledger anything.
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
          346,018 purchase orders, $151B in recorded spending. Ask about departments,
          suppliers, categories, or trends — every answer shows its work.
        </p>
      </div>
      <div className="mx-auto grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
        {PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSelect(prompt)}
            className="rounded-lg border border-line bg-surface px-4 py-3 text-left text-sm text-ink-soft transition-colors hover:border-ledger hover:text-ink"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
