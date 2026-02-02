# Poker frontend (Next.js app route)

This folder contains a lightweight frontend scaffold for a 2-player poker game inspired by the legacy `old/` app. It focuses on UI and frontend state; backend money logic ("yellow") and multiplayer server will be integrated by your teammate.

What I added
- `layout.tsx` — route layout for `/poker`
- `page.tsx` — main UI: table, action panel, yellow money area
- `components/` — `Table`, `PlayerSeat`, `Card`, `ActionPanel`, `YellowArea`
- `hooks/useGame.ts` — frontend-only game state and simple dummy mode

Integration notes for backend teammate
- Yellow actions: frontend calls `actions.performYellow({ type, amount })` — backend should subscribe to a `yellowAction` socket or HTTP endpoint and perform settlement or on-chain flows.
- Multiplayer: the frontend currently supports `createLocalGame()` (dummy CPU). To add online multiplayer, implement a WebSocket or WebRTC layer that emits/receives events such as `create`, `join`, `stateUpdate`, and `yellowAction`.
- Event contract (suggested):
  - `create` -> returns game id, initial state
  - `join` -> subscribe to updates for game id
  - `stateUpdate` -> full game state payload
  - `action` -> player actions (fold, check, bet)
  - `yellowAction` -> money actions: `{ type: 'addFunds'|'withdraw'|'approve', amount: number, playerId: string }`

Next steps I can take
- Wire a simple WebSocket client into `useGame` and provide a mocked server adapter for local dev.
- Improve TypeScript types and add visual polish.
- Add tests or storybook snapshots for components.
