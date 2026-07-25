import { useMemo, useState } from "react";
import { useConversations } from "../../hooks/useConversations";
import type { ConversationSummary } from "../../lib/types";

function ConversationRow({
  conversation,
  isActive,
  onSelect,
  onRename,
  onDelete,
}: {
  conversation: ConversationSummary;
  isActive: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(conversation.title);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const commitRename = () => {
    setEditing(false);
    const trimmed = draftTitle.trim();
    if (trimmed && trimmed !== conversation.title) onRename(trimmed);
    else setDraftTitle(conversation.title);
  };

  return (
    <div
      className={`group flex items-center gap-1 rounded-md px-2 py-2 ${
        isActive ? "bg-ledger-tint" : "hover:bg-paper-dim"
      }`}
    >
      {editing ? (
        <input
          autoFocus
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") {
              setDraftTitle(conversation.title);
              setEditing(false);
            }
          }}
          className="min-w-0 flex-1 rounded border border-ledger bg-surface px-1.5 py-0.5 text-sm text-ink"
        />
      ) : (
        <button
          type="button"
          onClick={onSelect}
          className="min-w-0 flex-1 truncate text-left text-sm text-ink-soft"
          title={conversation.title}
        >
          <span className={isActive ? "text-ink" : undefined}>{conversation.title}</span>
        </button>
      )}

      {!editing && (
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100">
          {confirmingDelete ? (
            <>
              <button
                type="button"
                onClick={onDelete}
                className="rounded px-1.5 py-0.5 text-[0.65rem] uppercase text-oxide hover:bg-oxide-tint"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="rounded px-1.5 py-0.5 text-[0.65rem] uppercase text-ink-faint hover:bg-paper-dim"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label="Rename conversation"
                className="rounded px-1.5 py-0.5 text-xs text-ink-faint hover:text-ledger"
              >
                Rename
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                aria-label="Delete conversation"
                className="rounded px-1.5 py-0.5 text-xs text-ink-faint hover:text-oxide"
              >
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function ConversationSidebar({
  activeConversationId,
  onSelect,
  onNew,
}: {
  activeConversationId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  const { conversations, rename, remove } = useConversations();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, search]);

  return (
    <div className="flex h-full flex-col bg-paper-dim">
      <div className="p-3">
        <button
          type="button"
          onClick={onNew}
          className="w-full rounded-md border border-ledger bg-ledger px-3 py-2 text-sm font-medium text-white hover:bg-ledger-dark"
        >
          + New conversation
        </button>
      </div>
      <div className="px-3 pb-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations…"
          aria-label="Search conversations"
          className="w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm text-ink placeholder:text-ink-faint focus:border-ledger"
        />
      </div>
      <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {filtered.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-ink-faint">
            {conversations.length === 0 ? "No conversations yet." : "No matches."}
          </p>
        )}
        {filtered.map((c) => (
          <ConversationRow
            key={c.id}
            conversation={c}
            isActive={c.id === activeConversationId}
            onSelect={() => onSelect(c.id)}
            onRename={(title) => rename({ id: c.id, title })}
            onDelete={() => {
              localStorage.removeItem(`procurement.messages.${c.id}`);
              remove(c.id);
              if (c.id === activeConversationId) onNew();
            }}
          />
        ))}
      </div>
    </div>
  );
}
