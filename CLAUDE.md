# Frontend — Procurement Assistant UI

React + TypeScript + Vite, Tailwind + shadcn/ui, TanStack Query for server state.

## Commands
- `npm run dev` — dev server (:5173)
- `npm run build` — production build
- `npm run test:e2e` — Playwright E2E (requires backend running separately — see the backend repo's README)

## Layout
- `src/lib/api.ts` — the only file that knows the backend's URL/contract; all SSE parsing lives here.
- `src/hooks/useChat.ts` — chat state + streaming, built on `lib/api.ts`.
- `src/components/Chat/` — chat UI. `src/components/Dashboard/` — the live analytics side panel.
