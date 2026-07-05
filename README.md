# Ledger — Full-Stack Budget Tracker

A budget tracker built with Next.js 15 (App Router), TypeScript, Prisma, PostgreSQL, Auth.js,
Tailwind CSS, shadcn/ui, React Hook Form + Zod, TanStack Table, Recharts, and Zustand.

## Roadmap status

| Phase | Scope | Status |
|---|---|---|
| 1 | Project setup, Prisma schema, Auth.js, layout, sidebar, navbar | ✅ Done |
| 2 | Accounts / Categories / Transactions CRUD | ✅ Done |
| 3 | Dashboard, charts, budget progress, monthly summary | ✅ Done |
| 4 | Savings goals, bills, notifications | ✅ Done |
| 5 | Search, filters, CSV/PDF export, dark mode | ✅ Done |
| 6 | Mobile responsiveness, performance, deployment | ✅ Layout is responsive; see notes below for deploy |

## Stack decisions

- **Auth**: Auth.js (`next-auth` v4) with a Credentials provider (email + bcrypt-hashed password)
  and an optional Google provider if `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set. Sessions
  are JWT-based and protected routes are enforced in `src/middleware.ts`.
- **Data layer**: Prisma models cover users, accounts, categories, transactions, budgets,
  savings goals, bills, and notifications (`prisma/schema.prisma`). Transaction create/update/delete
  routes keep `BankAccount.balance` in sync inside a `$transaction`.
- **UI**: Hand-rolled shadcn/ui primitives (button, input, dialog, select, table, toast, dropdown,
  switch, tabs, badge) styled with a custom "ledger" design system — deep ink sidebar, emerald for
  income, coral for expenses, violet for goals/budgets, plus a monospace font for all currency
  amounts (tabular figures) to reinforce the ledger metaphor.
- **State**: Zustand for UI state (`sidebar` open/close) and transaction filters; server data is
  fetched with a tiny `apiFetch` wrapper (no extra data-fetching library needed for this scope).
- **Charts**: Recharts area chart (6-month income/expense trend) and donut chart (category
  breakdown), fed by an aggregation endpoint (`/api/dashboard/summary`).
- **Export**: CSV via PapaParse, PDF via jsPDF + jspdf-autotable, both generated client-side from
  the currently loaded transaction page.
- **Receipts**: UploadThing route stub is included (`src/lib/uploadthing.ts`,
  `src/app/api/uploadthing/route.ts`) — wire up a `UPLOADTHING_TOKEN` and add the upload button to
  the transaction form to finish this optional feature.

## Getting started

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL and NEXTAUTH_SECRET at minimum
npx prisma db push     # or: npm run db:migrate
npm run db:seed        # optional demo data (demo@ledger.app / password123)
npm run dev
```

Generate a secret for `NEXTAUTH_SECRET` with:

```bash
openssl rand -base64 32
```

### Database

Any Postgres works. For a quick start:
- **Neon**: create a project, copy the pooled connection string into `DATABASE_URL`.
- **Supabase**: Project Settings → Database → Connection string (use the "Transaction" pooler
  string for serverless deploys).

> **Note on this environment**: this codebase was authored and type-checked in a sandboxed
> container without access to `binaries.prisma.sh`, so `prisma generate` could only produce a
> stub client here (you'll see `Module has no exported member 'Transaction'` etc. if you run
> `tsc` inside this sandbox). This is **not** a bug in the code — running `npm install` /
> `prisma generate` on your own machine or in CI/Vercel (which has normal internet access) will
> fetch the real query engine and generate full types, and every file that references Prisma
> model types will resolve correctly. Everything outside of Prisma's own type generation has been
> type-checked clean.

### Auth

Credentials auth works out of the box. To add Google sign-in, set `GOOGLE_CLIENT_ID` and
`GOOGLE_CLIENT_SECRET` in `.env` — the provider is added automatically when present
(`src/lib/auth.ts`).

## Project structure

```
src/
  app/
    (auth)/login, (auth)/register        — public auth pages
    (dashboard)/...                      — protected pages (sidebar + navbar layout)
    api/                                 — route handlers (accounts, categories,
                                            transactions, budgets, goals, bills,
                                            notifications, dashboard/summary, auth)
  components/
    ui/                                  — shadcn/ui primitives
    layout/                              — sidebar, navbar, notification bell
    accounts/, categories/, transactions/, dashboard/ — feature components
  lib/                                   — prisma client, auth config, zod schemas,
                                            utils, CSV/PDF export, api client
  store/                                 — zustand stores (ui, filters)
prisma/
  schema.prisma                          — full data model
  seed.ts                                — demo data
```

## Phase 6 notes: responsiveness, performance, deployment

- **Responsiveness**: the sidebar collapses to an off-canvas drawer below `lg` breakpoint
  (toggled via the navbar hamburger + Zustand `ui-store`); all grids (`accounts`, `categories`,
  `goals`, dashboard summary cards) collapse from 3–4 columns down to 1 column on small screens;
  the transactions table scrolls horizontally on narrow viewports via the built-in `Table`
  wrapper's `overflow-auto`.
- **Performance**: dashboard aggregation is done in a single API call with `Promise.all` for
  parallel queries; transaction list is server-paginated (20/page) rather than loading the whole
  table; indexes are defined on the hot query paths (`Transaction` by `userId,date`, `accountId`,
  `categoryId`).
- **Deployment (Vercel)**:
  1. Push this repo to GitHub.
  2. Import it in Vercel, set the environment variables from `.env.example`.
  3. `vercel.json` already sets the build command to run `prisma generate` before `next build`.
  4. Run `npx prisma migrate deploy` (or `db push`) against your production database once, either
     locally pointed at the prod `DATABASE_URL` or as a Vercel deploy hook.

## What you may want to extend next

- Recurring transaction auto-generation from `Bill` records (currently bills are tracked and
  markable-paid, but don't yet auto-create a `Transaction` on payment).
- A cron (Vercel Cron or similar) hitting `/api/notifications` on a schedule so bill reminders are
  generated even when no one has the app open (currently generated lazily on notification fetch).
- Receipt image upload wired into the transaction form using the included UploadThing route.
