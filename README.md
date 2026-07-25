# CA Procurement Assistant — Frontend

React + TypeScript chat interface and live analytics dashboard for asking
natural-language questions about California state purchase orders
(2012–2015, 346,018 records, ~$151B in spend).

**Backend repo:** https://github.com/halsabbah10/procurement-assistant-backend

Deployed on Vercel, calling a Render-hosted backend — live URLs shared
separately with the assessment submission rather than published here.

## What it does

Two pages behind a shared top nav:

- **Chat** — ask a question, get a grounded answer streamed over SSE:
  markdown-rendered prose (tables, bold, lists), an auto-generated chart
  when the data warrants one, a "view generated query" panel showing the
  exact MongoDB pipeline that produced the answer (with CSV/JSON export),
  2–3 follow-up question chips, and copy/edit/regenerate on every message.
  A sidebar lists past conversations (search, rename, delete) backed by
  the server, not just local state.
- **Analytics** — spend by fiscal year, quarterly trend, acquisition-type
  breakdown, and top departments/suppliers, with click-through drill-down
  into any department's own spend history, suppliers, and categories.

## Design system

A custom visual identity ("Ledger") built for this specific domain rather
than a generic AI-chat template — warm paper background, deep ledger-green
+ brass accents, IBM Plex Serif/Sans/Mono (chosen because the Plex
superfamily was designed for enterprise/systems software), messages
rendered as numbered ledger entries rather than chat bubbles. Chart colors
are validated (not eyeballed) for colorblind-safety and contrast against
this app's actual background — see `src/index.css` for the record and
`src/components/Chat/InsightChart.tsx` / `Dashboard/charts.tsx` for where
the validated palette is applied.

## Tech stack

| Concern | Choice |
|---|---|
| Framework | React 19 + TypeScript + Vite |
| Routing | React Router (`BrowserRouter`) — Chat and Analytics are separate routes |
| Styling | Tailwind CSS v4 (CSS-first `@theme` config, no `tailwind.config.ts`) |
| Server state | TanStack Query (conversation list, analytics data) |
| Markdown | `react-markdown` + `remark-gfm` (tables) + `rehype-sanitize` |
| Charts | Recharts, lazy-loaded (see Performance notes) |
| E2E testing | Playwright |

## Local setup

Requires the backend running separately (`docker-compose up` in the
backend repo — see its README) or pointed at the live API.

```bash
cp .env.example .env   # VITE_API_BASE_URL — defaults to http://localhost:8000
npm install
npm run dev
```

http://localhost:5173

**Node version:** this project needs Node `^20.19.0 || >=22.12.0` (enforced
via `.nvmrc` + `package.json` `engines`) — Vite 8's rolldown-based build
crashes on other versions (including some odd-numbered releases like
21.x) with an unrelated-looking `styleText` error. Run `nvm use` if you
have nvm installed.

## Commands

```bash
npm run dev              # dev server (:5173)
npm run build             # tsc -b && vite build — production build
npx tsc -b --noEmit        # typecheck only (bare `tsc --noEmit` is a silent
                            # no-op here — the root tsconfig.json is
                            # solution-style with no files of its own)
npm run lint               # oxlint

npm run test:e2e                                # Playwright, against localhost:5173 by default
PLAYWRIGHT_BASE_URL=<deployed-url> npm run test:e2e   # same suite, against a live deployment
```

## Repo layout

```
src/
├── App.tsx                        # routing, top nav, mobile sidebar/overlay wiring
├── main.tsx                       # React root, TanStack QueryClientProvider
├── index.css                      # Tailwind v4 @theme tokens + the Ledger design system
├── lib/
│   ├── api.ts                     # the only file that knows the backend's URL/contract
│   ├── types.ts                   # ChatMessage, ChatChunk, ConversationSummary, ChartPayload
│   └── format.ts                  # currency/number formatting, currency-field heuristic
├── hooks/
│   ├── useChat.ts                 # message state, SSE streaming, send/regenerate/edit
│   ├── useConversation.ts         # which conversation is active (singular), persisted across reloads
│   └── useConversations.ts        # the sidebar's list (plural) — TanStack Query
└── components/
    ├── Chat/
    │   ├── ChatPanel.tsx           # message list + input, mobile header
    │   ├── MessageBubble.tsx       # markdown rendering, per-message actions, inline edit
    │   ├── MessageActions.tsx      # copy / edit / regenerate buttons
    │   ├── QueryPanel.tsx          # "view generated query" + CSV/JSON export
    │   ├── SuggestionChips.tsx     # follow-up question chips
    │   ├── StarterPrompts.tsx      # empty-state prompts
    │   ├── InsightChart.tsx        # lazy-loaded chat-embedded chart (Recharts)
    │   └── ConversationSidebar.tsx # list/search/rename/delete
    └── Dashboard/
        ├── DashboardPanel.tsx      # analytics page layout (card grid)
        ├── charts.tsx              # reusable bar/line/pie chart components
        └── DepartmentDrilldown.tsx # per-department detail view

e2e/
├── chat.spec.ts                   # empty state, real Q&A, out-of-scope, copy/edit, new conversation
└── analytics.spec.ts              # analytics page rendering, department drill-down, page navigation
```

## Performance notes

- **`InsightChart.tsx` and `DashboardPanel.tsx` are both `React.lazy`-loaded.**
  Both pull in Recharts; if either imported it eagerly, Recharts would land
  in the main bundle regardless of the other's lazy-loading, defeating the
  point. Verified via `npm run build`: eagerly importing the dashboard
  bloated the main chunk to 801KB — lazy-loading both dropped it to ~404KB
  with Recharts isolated in its own shared, separately-loaded chunk.
- **`/api/analytics/summary` and conversation list queries are cached**
  client-side via TanStack Query, server-side via a 5-minute TTL cache on
  the backend — the dashboard doesn't hit MongoDB on every mount.

## Known limitations

- **Edit/regenerate re-send as a new turn** rather than truly branching the
  conversation (there's no backend API to erase a turn from the LangGraph
  checkpoint) — closest practical approximation to ChatGPT's edit
  behavior without that capability.
- **Reopening a conversation from a different browser** shows message text
  only, not the query/chart/suggestions enrichments (those are generated
  fresh per turn and aren't part of the persisted checkpoint) — full
  fidelity is preserved for the common case (same browser, localStorage
  cache intact).
- **Single conversation history store** — no cross-device sync beyond the
  server-reconstructed text fallback described above.
