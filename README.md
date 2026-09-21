# Portside Desk

An admin panel for an invented freight forwarder: the support team's ticket queue, customer records,
analytics and team roster. Built with **Ant Design 6**, **Tailwind CSS 4**, **Redux Toolkit**,
**TanStack Query**, **React Router** and **TypeScript**, running against a **mock REST API** (Mock Service Worker) that
lives entirely in the browser.

```bash
npm install
npm run dev          # http://localhost:5173
```

**Demo login:** `mara@portside.dev` / `harbour` (pre-filled on the login page). Every seeded teammate
(`tomasz@`, `priya@`, `aiko@`, `lucas@`, `daniel@`, `sofia@` at `portside.dev`) uses the same password.

> The mock API is a service worker, which browsers only allow on `localhost` or HTTPS.
> Data is kept in `localStorage` so it survives a refresh. **Account menu → Reset demo data** restores the seed.

## What it does

| Section | What you can do |
| --- | --- |
| **Overview** | KPI tiles (open, overdue, unassigned, last 7 days) and a "next due" board. Every tile and row is a doorway into Tickets with a filter already applied. |
| **Tickets** | Server-side sort, filter (text, status, priority, assignee, created-date range, overdue only) and pagination. Create/edit in a **drawer**. Multi-select with bulk *mark resolved* and bulk delete. |
| **Customers** | Sort, search and **column filters** (plan, status). Create/edit in a **modal**. Deleting a customer with open tickets is refused with the server's message. "Open tickets" links to Tickets filtered to that customer. |
| **Analytics** | Date-range picker with presets; KPIs plus four charts (created vs resolved per day, channel mix, priority mix, resolved per agent). Lazy-loaded, so the chart library is only downloaded here. |
| **Team** | Workload bars, weekly throughput, customer ratings, and an availability switch that writes to the API. |

Also: protected routes behind a mock login (returns you to where you were headed), light/dark mode,
toasts for every create/save/delete, an "unsaved changes" guard on the drawer and modal, and a layout
that collapses the sider to icons on tablets and turns it into a drawer on phones.

## How it's organised

Organised by **feature**, not by file type. Each feature owns its types, API hooks, Redux slice and components.

```
src/
  app/          store, typed hooks, antd theme, routes, providers, query client, tailwind.css
  layout/       sider, header, shell, route fallbacks
  shared/       components, hooks and lib used by more than one feature
  mocks/        the fake backend: seed data, in-memory db, MSW handlers
  features/
    auth/       login page, route guard, session slice
    dashboard/  overview page
    tickets/    page, table, filters, drawer form, bulk bar, slice, API hooks, types
    customers/  page, table, modal form, customer picker, slice, API hooks, types
    team/       page, agent picker, API hooks, types
    analytics/  page, charts, range slice, API hooks, types
  test/         test setup and a renderApp helper
```

Features talk to each other only through a small `index.ts` (for example `features/team/index.ts`
exports the agent picker). Pages are never exported from a barrel, so they stay lazily loadable.

## Decisions worth knowing about

- **Styling is Tailwind utility classes**, with no CSS modules. The only stylesheet is `src/app/tailwind.css`
  (Tailwind import, the two brand colours, fonts, one keyframe). antd is layered *under* Tailwind's
  utilities (`@layer theme, base, antd, components, utilities`, plus antd's `<StyleProvider layer>`), so
  Tailwind's reset never fights antd and a utility such as `mb-4` reliably overrides an antd default without
  `!important`. The layer order is also declared in `index.html`, so it holds whichever stylesheet loads first.
  Theme aliases (`bg-surface`, `border-line`, `text-muted`, `bg-brand-bg`) point at antd's live CSS variables,
  so utilities follow light/dark mode. The only inline `style` props left are per-agent avatar colours and the
  chart legend colour, which are computed at runtime.
- **Server state vs client state.** TanStack Query owns everything that comes from the API. Redux owns
  what the *user* is doing: who is signed in, each page's filters, sort and paging, and the ticket selection.
  That split is why filters survive navigation and why other pages can deep-link into a filtered table by
  dispatching one action.
- **Filtering happens on the "server".** Filter, sort and paging go to the API as query params, and the
  MSW handlers do the work, so the tables behave the way they would against a real backend
  (`keepPreviousData` keeps the old page on screen while the next one loads).
- **Mutations invalidate by root key** (`shared/lib/queryKeys.ts`): saving a ticket refreshes the list, the
  overview, analytics, customer counts and agent workloads together.
- **The mock API behaves like an API.** Bearer tokens (401), validation (422), missing records (404) and
  business rules (409) all exist so the UI has real failures to handle.
- **The discard guard and the forms are mounted per open** (`destroyOnHidden` plus a child form), so no
  stale values leak from one edit to the next.
- **Accessibility.** Icon buttons have names; the delete confirmation suppresses its tooltip so it does not
  cover the confirm button; the clickable subject/company text is a real button (`ActionLink`) reachable by
  keyboard; `prefers-reduced-motion` switches antd's animations off.

## Scripts

| | |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check, then production build |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest: API contract tests and UI flow tests (29 tests) |

## Testing

- `src/mocks/api.test.ts` exercises the mock API through the same HTTP client the app uses: auth, pagination,
  sorting, filters, ticket and customer CRUD, validation, bulk actions, the 409 rule, and reports.
- `src/app/app.test.tsx` renders the whole app (real store, query client and routes) and drives it as a
  user would: the auth guard and redirect-back, navigation, Overview→Tickets deep links, ticket
  create/edit/delete through the drawer, the discard guard, selection surviving paging, customer
  create/delete and the blocked delete, the availability toggle, and the analytics page.

## Known limitations

- **Bundle size.** antd is the bulk of the download (about 1.2 MB, roughly 400 KB gzipped) and MSW ships in
  the production bundle because the mock API *is* the backend for this demo. A real deployment would
  drop MSW and point `src/shared/lib/http.ts` at a real API.
- **Auth is a mock.** The token is `mock-<agentId>`; nothing here is secure.
- **Tablet tables scroll sideways.** Below about 1100px the ticket and customer tables scroll horizontally
  with the actions column pinned, rather than dropping columns that matter.
- **Seed dates are relative to "now"**, so the overdue count differs a little from run to run.
- Verified in Chromium only, plus jsdom in the tests.
