-- Chat feature: conversations (DMs + groups) and messages.
-- Run against your Cloudflare D1 database before deploying the version of
-- worker.js that includes the /conversations endpoints.
--
-- Local testing (uses .wrangler's local D1 simulation):
--   npx wrangler d1 execute hr-management-db --local --file=backend/migrations/0001_create_messages_tables.sql
--
-- Production (applies to the real, remote D1 database):
--   npx wrangler d1 execute hr-management-db --remote --file=backend/migrations/0001_create_messages_tables.sql

CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('dm', 'group')),
    name TEXT DEFAULT '',
    createdBy TEXT NOT NULL,
    lastMessageAt TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (createdBy) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY (conversation_id, user_id),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    text TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, createdAt);

CREATE TABLE IF NOT EXISTS message_reads (
    message_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY (message_id, user_id),
    FOREIGN KEY (message_id) REFERENCES messages(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
