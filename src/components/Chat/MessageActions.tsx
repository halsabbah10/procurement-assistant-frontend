import { useState } from "react";

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function RegenerateIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-6.36-2.64M3 12a9 9 0 0 1 9-9 9 9 0 0 1 6.36 2.64" />
      <path d="M21 3v6h-6M3 21v-6h6" />
    </svg>
  );
}

export function MessageActions({
  text,
  onRegenerate,
  disabled,
}: {
  text: string;
  onRegenerate?: () => void;
  disabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mt-2 flex items-center gap-3 text-ink-faint">
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1 text-xs hover:text-ledger"
        aria-label="Copy response"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? "Copied" : "Copy"}
      </button>
      {onRegenerate && (
        <button
          type="button"
          onClick={onRegenerate}
          disabled={disabled}
          className="flex items-center gap-1 text-xs hover:text-ledger disabled:opacity-50"
          aria-label="Regenerate response"
        >
          <RegenerateIcon />
          Regenerate
        </button>
      )}
    </div>
  );
}
