# Break Admin

Web admin panel for **Break — "Find your escape"**, the UAE holiday-rental app (farms, vacation homes, resorts, desert camps).
Visual language follows the "Break Project" Figma file: deep indigo `#4A4372`, lavender `#8B7FD6`, warm cream `#F7F4EE`,
pill buttons, soft cards, Plus Jakarta Sans + Playfair Display.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build
```

Without a backend the panel runs on in-memory demo data (`src/mocks/seed.ts`).
Demo login: `admin@break.ae` / `break-demo-2026` (mock mode only).

## Connecting a backend

Copy `.env.example` to `.env` and set `VITE_API_URL`. Every service in `src/services/index.ts` then calls
`${VITE_API_URL}/admin/...` with `Authorization: Bearer <token>` instead of the mock. List endpoints accept
`search, page, pageSize, sortBy, sortDir` plus filter keys as query params and return `{ items, total, page, pageSize }`.
Types for every payload are in `src/types.ts`.

| Area | Endpoints |
|---|---|
| Auth | `POST /admin/auth/login`, `GET /admin/auth/me`, `POST /admin/auth/forgot-password` |
| Dashboard | `GET /admin/dashboard` |
| Guests / Hosts | `GET /admin/guests`, `GET/PATCH/DELETE /admin/guests/:id`, `GET /admin/hosts`, `GET/PATCH /admin/hosts/:id` |
| Properties | `GET/POST /admin/properties`, `GET/PATCH/DELETE /admin/properties/:id` |
| Bookings | `GET /admin/bookings`, `GET/PATCH /admin/bookings/:id` |
| Finance | `GET /admin/transactions`, `GET /admin/payouts`, `PATCH /admin/payouts/:id` |
| Master data | `GET/POST /admin/{categories,amenities,cities,animals,cancellation-policies,countries}`, `PATCH/DELETE …/:id` |
| Moderation | `GET/PATCH /admin/reviews[/:id]`, `GET/PATCH /admin/support/threads[/:id]`, `POST /admin/support/threads/:id/messages`, `GET/PATCH /admin/reports[/:id]`, `GET/PATCH /admin/enquiries[/:id]`, `POST /admin/enquiries/:id/reply` |
| Notifications | `GET/POST /admin/notifications`, `DELETE /admin/notifications/:id` |
| Content | `GET /admin/cms`, `PUT /admin/cms/:id` |
| Settings | `GET/PUT /admin/settings`, `GET/POST/PATCH/DELETE /admin/admins[/:id]`, `GET /admin/deletion-requests`, `PATCH /admin/deletion-requests/:id` |

## Structure

```
src/
  index.css, tailwind.config.ts   design tokens (CSS variables → Tailwind colors)
  components/ui/                  Button, Field/Input/Select, Toggle, Chip, Badge, DataTable, Pagination,
                                  Tabs, Stepper, Modal, Drawer, ConfirmDialog, Toast …
  layout/AdminLayout.tsx          sidebar + top bar (EN / ع layout-direction toggle)
  services/                       API client with mock fallback
  mocks/seed.ts                   demo data
  modules/<module>/               one folder per sidebar section
```

## Modules

Dashboard · Guests · Hosts (verification) · Properties (approve/reject, 5-step add/edit wizard, guest favourite/featured)
· Bookings (confirm, cancel & refund) · Payments & Payouts (transactions, payouts, fees) · Reviews · Support inbox & Reports
· Contact enquiries · Push notifications · Master data (categories, amenities, cities, farm animals, cancellation policies,
countries) · Content pages (EN/AR) · Settings (app settings, admins & roles, account deletion requests, profile).

Design token hexes were read visually from the Figma canvas; if you have Dev Mode access, confirm exact values and
adjust the variables in `src/index.css`.
