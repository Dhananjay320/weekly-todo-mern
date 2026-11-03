# To-Do List App: weekly task tracker (MERN)

Create, edit, delete and search tasks scheduled for a date and time. The home screen groups tasks into **Monday–Sunday weeks**, with open vs completed counts per week, and the UI follows the provided Figma (*To Do List Mobile app*).

**Stack:** MongoDB · Express 5 · React 19 (Vite, TypeScript) · Node.js · Tailwind CSS 4

| | |
|---|---|
| **Live demo** | https://weekly-todo-jd71.onrender.com (first load after idle can take ~1 min on Render's free plan) |
| **API** | same origin, under `/api` (health: `/api/health`) |

## Features

**From the brief**
- **Tasks:** title (required), description, date & time (required), priority Low / Medium / High (optional). Create, edit, delete.
- **Search:** keywords across title and description, done in the API (`?q=`). From the results you can view, edit, tick or delete.
- **Home screen:**
  - search bar;
  - day strip for the selected week;
  - *Task Complete* and *Task Pending* counts for the week, plus the weekly progress bar;
  - the selected day's tasks;
  - **All Weeks**: a card per Monday–Sunday week showing open and completed counts. Tap a card to expand that week's tasks, grouped by day.
- **Status:** tick a task to mark it *Completed*, untick for *In progress*. The week's card, counts and progress update instantly.
- **Delete:** swipe a task left and tap **Delete**, as in the user flow. On desktop, the bin icon reveals the same Delete button.
- **Responsive:** built mobile-first from the Figma frames. On tablet and desktop it becomes two columns (this week + all weeks).

**Small additions**
- Optional **end time** (the Figma's *Set Time: Start / Ends*).
- A task details sheet with mark completed / in progress, edit and delete.
- Previous / next week navigation in the day strip, with dots on days that have tasks.
- "Load sample tasks" on an empty list, so the app can be explored quickly.
- **No sign-up, but private lists:** the brief has no accounts, so each browser gets a random id (stored in `localStorage`, sent as `X-Client-Id`). The API scopes every query to it, so reviewers don't see each other's tasks.

## Run locally

Requirements: Node.js 20+.

```bash
# API (http://localhost:4000). Without MONGODB_URI it starts an in-memory MongoDB, so no database is needed.
cd server
npm install
npm run dev

# Web app (http://localhost:5173, proxies /api to :4000)
cd client
npm install
npm run dev
```

To use a real database, copy `server/.env.example` to `server/.env` and set `MONGODB_URI`.

Production-style run (one server for API + app):
```bash
cd client && npm run build && cd ../server && npm start   # http://localhost:4000
```

Tests (API, against an in-memory MongoDB):
```bash
cd server && npm test     # 10 tests: create/validate, edit, status, delete, search, date range, isolation, samples
```

## API

Base path `/api`. Every `/tasks` request needs an `X-Client-Id` header (16–64 letters, digits or dashes). Errors look like `{ "error": { "code", "message", "fields?" } }`.

| Method | Path | Body / query | Response |
|---|---|---|---|
| GET | `/tasks` | `?q=` keyword, `?from=&to=` ISO range | `{ tasks }` sorted by start time |
| POST | `/tasks` | `title, startAt` (ISO), `description?, endAt?, priority?, status?` | `201 { task }` |
| GET | `/tasks/:id` | | `{ task }` |
| PATCH | `/tasks/:id` | any field, e.g. `{ "status": "completed" }` | `{ task }` |
| DELETE | `/tasks/:id` | | `204` |
| POST | `/tasks/sample` | `{ tzOffset }` (browser's `getTimezoneOffset()`) | `201 { tasks }` |
| GET | `/health` | | `{ ok, db }` |

Task: `{ id, title, description, startAt, endAt, priority: "low"|"medium"|"high"|null, status: "in-progress"|"completed", completedAt, createdAt, updatedAt }`.

## Implementation notes

- **Weeks are computed in the browser**, in the visitor's time zone (Monday 00:00 to Sunday 23:59). The API stores UTC timestamps. Grouping on the server would put late-evening tasks in the wrong day or week for anyone not on UTC.
- **One deployable service:** Express serves the built React app and the API from the same origin, so there's no CORS and only one URL.
- **Validation** with zod on every write: required fields, enum values, end time after start time. PATCH never resets fields that weren't sent.
- **Optimistic ticks:** ticking a task updates the UI at once and rolls back with an error message if the API fails.
- **Search** escapes regex characters, so `.*` is searched literally. Results come from the API, then render from the shared list, so ticks and edits show immediately.
- **Accessibility:**
  - real buttons with labels;
  - checkboxes exposed as `role="checkbox"`;
  - dialogs with focus handling and Escape to close;
  - visible focus rings, 40 px+ touch targets, and reduced-motion support.

## Deploy (Render, free)

1. MongoDB Atlas: allow access from `0.0.0.0/0` and copy the connection string with a database name (e.g. `/weekly-todo`).
2. Render → **New → Blueprint** → this repo. [`render.yaml`](render.yaml) creates one web service; paste `MONGODB_URI` when asked. If it is left empty, the server starts an in-memory MongoDB, which works but resets whenever the service restarts.

Netlify works for the frontend too (build `client`, publish `client/dist`, proxy `/api/*` to the API), but a single Render service is simpler.
