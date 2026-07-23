# Chat Feature — How It Was Built

This documents the DM + Group chat feature added to the HR Management app:
what exists, how it works, the tech behind it, and why it's built the way
it is. Pairs with [`CHAT_FEATURE_PLANNING.md`](CHAT_FEATURE_PLANNING.md),
which has the original planning notes from before implementation started.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Tailwind CSS v4, **Framer Motion** (animations), Axios, `lucide-react` (icons) |
| Backend — local dev | Node.js + Express 5, MongoDB via Mongoose |
| Backend — production | **Cloudflare Workers**, Hono framework, **D1** (Cloudflare's SQLite) |
| Real-time mechanism | HTTP polling (no WebSockets/Socket.IO) |

## Why two backends?

This app has always shipped two parallel backend implementations (this
predates the chat feature — see `CHAT_FEATURE_PLANNING.md` §1):

- `backend/routes/*.js` + Mongoose models — plain Express app, what you run
  locally (`node index.js`), talks to MongoDB.
- `backend/worker.js` — a single file re-implementing the *same* API using
  Hono + D1 SQL. This is what actually runs in production on Cloudflare
  (`wrangler.toml` → `main = "backend/worker.js"`).

Every chat endpoint below exists **twice** — once as an Express/Mongoose
route, once as Hono/D1 SQL — with identical URL paths and response shapes,
so the frontend code doesn't know or care which backend it's talking to.

## Why polling instead of Socket.IO / WebSockets

Cloudflare Workers can't run a long-lived Socket.IO server the way Express
can — a Worker only lives for the duration of a single request. True
WebSocket support on Workers exists (Durable Objects), but that's a
different architecture that would need its own local-dev equivalent,
doubling the work for the whole feature.

Instead:
- The frontend polls `GET /api/conversations` and, if a thread is open,
  `GET /api/conversations/:id/messages` every **3 seconds**
  (`POLL_INTERVAL_MS` in `MessagesPage.jsx`).
- **Typing indicator**: `POST /api/conversations/:id/typing` writes a
  `typingUntil` timestamp (6s from now) to a `TypingStatus`
  record/table. It's read back as part of the same poll that fetches
  messages — no separate request. It just disappears once `typingUntil`
  passes; there's no explicit "stopped typing" call.
- **Online presence**: `User.lastSeenAt` gets bumped as a side effect
  inside the existing auth middleware (`backend/middleware/auth.js` /
  `worker.js`'s `authMiddleware`) on *every* authenticated request — no
  dedicated heartbeat endpoint. A user is shown "Online" if
  `lastSeenAt` is within the last 20 seconds.

## Data models

**`Conversation`** (`backend/models/Conversation.js` / D1 `conversations` +
`conversation_participants` tables)
- `type`: `'dm'` or `'group'`
- `participants`: array of user IDs
- `admins`: array of user IDs (groups only — the creator is auto-admin)
- `name`, `createdBy`, `lastMessageAt`

**`Message`** (`backend/models/Message.js` / D1 `messages` table)
- `conversation`, `sender`, `text`
- `replyTo`: optional reference to another message
- `readBy` / `deliveredTo`: arrays of user IDs, used to compute the
  sent/delivered/seen ticks (see below)

**`TypingStatus`** (`backend/models/TypingStatus.js` / D1 `typing_status`
table) — ephemeral, just `(conversation, user, typingUntil)`.

## Message status ticks (sent / delivered / seen)

There's no push mechanism to tell a sender "the recipient just got your
message" the instant it happens. Instead, status is derived from what's
already being polled:

- **Sent** — the message exists on the server (optimistic UI shows a
  clock icon before that, then a single check).
- **Delivered** — the recipient's client has polled
  `GET /conversations/:id/messages` at least once since the message was
  sent (their `deliveredTo` gets the message's ID added at poll time).
- **Seen** — the recipient actually opened that thread (same endpoint also
  marks `readBy`).

For groups, "seen" means *every* other participant has read it — the
backend returns `deliveredCount` / `readCount` / `totalRecipients` per
message and the frontend (`StatusTicks` component in `MessagesPage.jsx`)
compares them.

## API endpoints

All under `/api/conversations` (Express) and mirrored 1:1 in `worker.js`:

| Method & path | Purpose |
|---|---|
| `GET /` | List conversations (DMs + groups) with unread counts |
| `POST /dm` | Get-or-create a DM with a user |
| `POST /group` | Create a group |
| `PUT /:id` | Rename a group (admin only) |
| `PUT /:id/participants` | Add members |
| `PUT /:id/participants/:userId/promote` | Toggle admin (admin only) |
| `DELETE /:id/participants/me` | Leave a group |
| `DELETE /:id/participants/:userId` | Remove a member (admin only) |
| `POST /:id/typing` | Typing indicator ping |
| `GET /:id/messages` | Paginated thread (`?before=<id>&limit=50`), marks delivered/read |
| `POST /:id/messages` | Send a message (optional `replyTo`) |

Plus `GET /api/auth/colleagues` — a lightweight "everyone in the company"
directory used by the new-chat / group-member pickers (unlike
`/api/auth/users`, this one isn't HR-only).

## Frontend

Everything lives in one file, `frontend/src/components/MessagesPage.jsx`,
shared by both the HR and Employee dashboards (same pattern as
`UpdateProfilePage.jsx` already used) — wired into
`HRSidebar.jsx`/`EmployeeSidebar.jsx` as a "Messages" nav item with an
unread-count badge.

Key pieces inside it:
- Conversation list + thread view, two-pane layout
- "New Chat" modal (DM or Group, with a colleague picker)
- Group Info panel (rename, promote/remove members, leave group) — admin
  actions gated by `activeConversation.viewerIsAdmin` from the API
- Contact Info panel (DM only) — click the other person's name/avatar in
  the thread header, shows their photo, online status, email, department,
  role (pulled from the `/auth/colleagues` list)
- Color-coded avatars — a small hash function (`avatarColor()`) maps each
  user/group ID to one of 8 colors consistently, so people are easy to
  tell apart at a glance
- Framer Motion touches: messages spring in when they arrive, the send
  button has hover/tap micro-interactions, status ticks animate between
  states, the online dot has a "ping" pulse, typing indicator and reply
  preview slide in/out, unread badges pop and the conversation list
  smoothly reorders (`layout` prop) when a new message bumps a chat to the
  top

## Explicitly not included

These were discussed and deliberately left out (either deferred or
removed after being built):

- **Attachments** (images/files) — deferred, needs a file-storage decision
  (Cloudflare R2 vs base64-in-DB) that wasn't made yet.
- **Message edit / delete** — was built, then removed per request. No
  trace left in the API or UI.
- **Emoji reactions** — considered for the "wow factor" pass, not built
  (went with animations/polish instead).
- **Socket.IO / WebSockets / Durable Objects** — intentionally not used;
  see "Why polling" above.

## Running it locally / deploying

- Local dev: MongoDB via the `hr-mongo` Docker container, `node index.js`
  in `backend/`, `npm run dev` in `frontend/`. No extra setup beyond what
  the rest of the app already needs.
- **Before deploying to Cloudflare**, the D1 database needs the new tables.
  Two migration files under `backend/migrations/` need to be applied once
  against the *production* database (not just local):
  ```
  npx wrangler d1 execute hr-management-db --remote --file=backend/migrations/0001_create_messages_tables.sql
  npx wrangler d1 execute hr-management-db --remote --file=backend/migrations/0002_chat_upgrade.sql
  ```
  These haven't been run against the real Cloudflare database yet — only
  verified locally via `wrangler dev --local`. Run them before the first
  deploy that includes chat.
- `backend/scripts/seedMockData.js` seeds realistic demo data (the TDC
  company roster, sample conversations) for local testing — safe to
  re-run, it skips anything that already exists.
