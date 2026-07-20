# HR Management — Project Overview & Chat Feature Planning

This document has two parts: (1) how the project currently works, so you have
the full picture, and (2) what to think about before building a chat feature.

## 1. Tech Stack

| Layer                | Technology                                                                                                           |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Frontend             | React 19 + Vite 8, React Router 7, Tailwind CSS v4, Axios, Framer Motion                                             |
| Backend (local dev)  | Node.js + Express 5, Mongoose (MongoDB)                                                                              |
| Backend (production) | Cloudflare Workers, using **Hono** framework + **D1** (Cloudflare's SQLite)                                          |
| Auth                 | JWT (`jsonwebtoken`), token sent via custom header `x-auth-token`, password hashing via `bcryptjs`                   |
| Push notifications   | Firebase Cloud Messaging (`firebase-admin` on backend, `firebase` on frontend)                                       |
| Deployment           | Cloudflare Pages/Workers via `wrangler`, frontend built to `frontend/dist` and served as static assets by the Worker |

### Important: there are two parallel backends

- **`backend/`** — a classic Express app (`index.js`, `routes/*.js`, `models/*.js`
  using Mongoose). This is what runs when you do `npm run dev` locally, and it
  talks to MongoDB.
- **`backend/worker.js`** — a single ~32KB file that re-implements the _same_
  API surface using the **Hono** router and **Cloudflare D1** (raw SQL via
  `c.env.DB.prepare(...)`) instead of Mongoose. This is what actually runs in
  production per `wrangler.toml` (`main = "backend/worker.js"`).

These two are **not shared code** — every route exists twice, once as
Mongoose/Express and once as raw SQL/Hono. Any new feature (including chat)
needs to be built (or at least ported) in both places if you want it to work
in production, not just in local dev.

## 2. Backend Structure (`backend/`)

**Models** (Mongoose, `backend/models/`):
`User`, `Department`, `Attendance`, `LeaveRequest`, `LeaveType`, `Holiday`,
`HRRequest`, `OnboardingTask`, `Practice`, `PracticeInfo`, `PracticeProvider`,
`Announcements`.

**Routes** (`backend/routes/`): `auth`, `attendance`, `leave`, `department`,
`practice`, `holidays`, `hrRequests`, `onboarding`, `announcements` — all
mounted under `/api/*` in `backend/index.js`.

**Auth flow**:

- `POST /api/auth/login` → verifies bcrypt password, signs a JWT
  (`{ user: { id } }`, 7-day expiry) with `process.env.JWT_SECRET`.
- Every protected route uses `middleware/auth.js`'s `auth` middleware, which
  reads the JWT from the `x-auth-token` header (not `Authorization: Bearer`).
- `isHR` middleware additionally checks `user.role === 'hr'` from the DB.
- Two roles only: `employee` and `hr` (see `User` model's `role` enum).

**User model** (`backend/models/User.js`) has: `name`, `email`, `password`
(hashed), `role`, `status`, `salary`, `photo`, `department`, `reportingTo`,
`phone`, `isDeleted` (soft delete), `leaveBalance`, `fcmToken` (for push
notifications).

## 3. Frontend Structure (`frontend/src/`)

- **`pages/`** — top-level route targets: `Login`, `EmployeeDashboard`,
  `HRDashboard`, `PracticeOnboarding`. Lazy-loaded via `React.lazy` in `App.jsx`.
- **`components/HRDashboard/`** and **`components/EmployeeDashboard/`** — each
  dashboard is a shell (`HRDashboard.jsx` / `EmployeeDashboard.jsx`) with a
  sidebar (`HRSidebar.jsx` / `EmployeeSidebar.jsx`) and header, and swaps in
  feature panels (e.g. `HREmployeeList`, `HRLeaveManagement`,
  `EmployeeAttendance`, `AnnouncementsPage`, etc.) — looks like client-side
  tab switching inside the dashboard rather than nested routes.
- **`context/AuthContext.jsx`** — holds `user`/`token` in state +
  `localStorage`, injects `x-auth-token` as an Axios default header, has a
  global Axios response interceptor that force-logs-out on any `401`.
- **Routing** (`App.jsx`): only 4 real routes (`/login`, `/employee`, `/hr`,
  `/onboarding`), gated by a `ProtectedRoute` component that checks `user.role`.
- All API calls go through `import.meta.env.VITE_API_URL` (set in
  `frontend/.env`, currently `http://localhost:5001/api` for local dev)
  directly with `axios.get/post/put/delete` — no relative `/api` calls, so
  Vite's dev proxy in `vite.config.js` is effectively unused dead config.

## 4. Closest existing feature to "chat": Announcements

`routes/announcements.js` + `models/Announcements.js` is the only
communication-like feature today:

- HR-only `POST /api/announcements` creates a broadcast message.
- On create, it also fans out a Firebase Cloud Messaging push to every user
  who has a saved `fcmToken`.
- Any logged-in user can `GET` the list and `PUT /:id/read` to mark as read.
- It's **one-directional** (HR → everyone), no replies, no threads, no
  per-user targeting — a bulletin board, not a chat.

This is useful as a reference for "how push notifications get wired into a
new feature here" but not as a data model for real chat.

## 5. What to decide before building chat

**a) Scope — who talks to whom?**

- Direct messages between any two users (employee ↔ employee, employee ↔ HR)?
- Or just employee ↔ HR (like a support inbox)?
- Group/department channels?
  This changes the data model a lot (1:1 conversations vs. channels vs. a
  flat message list scoped by department).

**b) Real-time delivery — this is the hard part given the dual backend.**
Options, roughly cheapest-to-most-complex:

1. **Polling** (frontend re-fetches every few seconds while chat is open).
   Works identically on both Express and the Cloudflare Worker, zero new
   infra, but not truly real-time and adds request load.
2. **Firebase** for the chat data itself (Firestore) instead of
   Mongo/D1 — since `firebase`/`firebase-admin` are _already_ a dependency on
   both frontend and backend (for push notifications), this sidesteps the
   Mongo-vs-D1 duplication problem entirely and gives you real-time listeners
   for free. Probably the pragmatic choice here.
3. **Socket.IO** — natural fit for the Express backend, but **does not run on
   Cloudflare Workers** (no persistent Node sockets in that runtime), so it
   would only work in local dev / a non-Workers deployment, not the current
   production target.
4. **Cloudflare Durable Objects + WebSockets** — the "correct" way to do
   real-time on Workers, but it's a new primitive for this codebase, only
   solves the production side, and you'd still need a local-dev equivalent
   for the Express backend.

**c) Where does chat live in the UI?**
Both `HRSidebar.jsx`/`EmployeeSidebar.jsx` already list feature tabs
(Employees, Leave Requests, Attendance, Holidays, Announcements, ...) — a
"Messages" entry would follow the same pattern as `AnnouncementsPage.jsx`
(fetch + local state + a panel component swapped into the dashboard body).

**d) Notifications**
Reuse the existing FCM plumbing (`config/firebaseAdmin.js`, `fcmToken` on
`User`) to push "new message" notifications, same as announcements do.

## 6. Suggested MVP

Given the constraints above, a pragmatic first cut:

1. Direct messages only (no groups) — one `conversations` concept keyed by a
   sorted pair of user IDs, or just a flat `messages` collection with
   `from`/`to`/`text`/`createdAt`/`readAt`.
2. Store messages in **Firestore** (not Mongo/D1) to avoid double-implementing
   in both backends and to get real-time listeners without new infra.
3. Backend's role shrinks to: issuing a scoped Firestore custom auth token (or
   just trusting the existing JWT + Firestore security rules keyed by user
   ID) and optionally triggering FCM push on new message — actual message
   read/write happens client-side against Firestore.
4. UI: new sidebar entry "Messages", a user-picker (reuse
   `GET /api/auth/users`, already HR-only — would need a lighter
   "list colleagues" endpoint for employees), and a simple thread view.

If you'd rather keep everything in Mongo/D1 and skip Firebase, polling
(option 1) is the simplest thing that works identically in dev and prod —
worth doing that first and upgrading later if it feels too slow.

Fahad Tufail HR (Founder) Management fahad.tufail@tdc.com
Ayan Tufail HR (Manager) Management ayan.tufail@tdc.com
Huzaifa Employee AI Engineering huzaifa@tdc.com
Saad Jamil Employee AI Engineering saad.jamil@tdc.com
Abdullah Tahir Employee Full-Stack Development abdullah.tahir@tdc.com
Laiba Ajmal Employee AI Engineering laiba.ajmal@tdc.com
Rahmeen Fatima Employee Full-Stack Development rahmeen.fatima@tdc.com
Tahseen Fatima Employee Design tahseen.fatima@tdc.com

Tdc@12345
