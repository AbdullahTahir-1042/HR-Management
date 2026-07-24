-- Chat upgrade: presence, typing indicators, message status, edit/delete,
-- reply, group admins. Run this AFTER 0001_create_messages_tables.sql.
--
-- Local testing:
--   npx wrangler d1 execute hr-management-db --local --file=backend/migrations/0002_chat_upgrade.sql
--
-- Production:
--   npx wrangler d1 execute hr-management-db --remote --file=backend/migrations/0002_chat_upgrade.sql
--
-- NOTE: the base `users` table isn't created by any migration in this repo
-- (see CHAT_FEATURE_PLANNING.md) — it was set up directly against the
-- remote D1 database. The ALTER TABLE below assumes that table already
-- has the columns from the original app (name, email, password, role, ...).

ALTER TABLE users ADD COLUMN lastSeenAt TEXT;

ALTER TABLE conversations ADD COLUMN admins TEXT DEFAULT '[]'; -- JSON array of user ids

ALTER TABLE messages ADD COLUMN replyTo TEXT;
ALTER TABLE messages ADD COLUMN editedAt TEXT;
ALTER TABLE messages ADD COLUMN deletedForEveryone INTEGER DEFAULT 0;
ALTER TABLE messages ADD COLUMN deletedAt TEXT;

CREATE TABLE IF NOT EXISTS message_deleted_for (
    message_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY (message_id, user_id),
    FOREIGN KEY (message_id) REFERENCES messages(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS message_delivered (
    message_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY (message_id, user_id),
    FOREIGN KEY (message_id) REFERENCES messages(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS typing_status (
    conversation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    typingUntil TEXT NOT NULL,
    PRIMARY KEY (conversation_id, user_id),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
