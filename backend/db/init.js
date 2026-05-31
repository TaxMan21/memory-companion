import db from './database.js';

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      subscription_status TEXT DEFAULT 'trial',
      subscription_id TEXT,
      stripe_customer_id TEXT,
      demo_used INTEGER DEFAULT 0,
      login_attempts INTEGER DEFAULT 0,
      locked_until TEXT,
      tos_accepted_at TEXT,
      privacy_accepted_at TEXT,
      data_deletion_requested_at TEXT,
      marketing_consent INTEGER DEFAULT 0,
      payment_method TEXT DEFAULT 'paypal',
      crypto_wallet TEXT,
      paypal_order_id TEXT
    );

    CREATE TABLE IF NOT EXISTS payment_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      paypal_order_id TEXT,
      paypal_capture_id TEXT,
      crypto_tx_signature TEXT,
      amount INTEGER,
      currency TEXT DEFAULT 'usd',
      status TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS consent_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      consent_type TEXT NOT NULL,
      granted INTEGER NOT NULL,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      mood TEXT,
      tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      nickname TEXT,
      date_of_birth TEXT,
      avatar_url TEXT,
      timezone TEXT DEFAULT 'UTC',
      language TEXT DEFAULT 'en',
      onboarding_complete INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS personality_preferences (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      style TEXT DEFAULT 'friendly',
      response_length TEXT DEFAULT 'medium',
      humor_level INTEGER DEFAULT 5,
      communication_style TEXT DEFAULT 'conversational',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS memory_permissions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      long_term_memory INTEGER DEFAULT 1,
      categories TEXT DEFAULT '["personal","goals","relationships","projects","preferences","dates"]',
      can_remember TEXT DEFAULT 'everything',
      cannot_remember TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user','assistant','system')),
      content TEXT NOT NULL,
      message_type TEXT DEFAULT 'text' CHECK(message_type IN ('text','voice','image','document')),
      file_url TEXT,
      conversation_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'personal',
      status TEXT DEFAULT 'active' CHECK(status IN ('active','paused','completed','archived')),
      progress INTEGER DEFAULT 0 CHECK(progress >= 0 AND progress <= 100),
      target_date TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id TEXT PRIMARY KEY,
      goal_id TEXT NOT NULL,
      title TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT,
      content TEXT NOT NULL,
      mood TEXT,
      mood_score INTEGER CHECK(mood_score >= 1 AND mood_score <= 10),
      tags TEXT DEFAULT '[]',
      is_voice INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS relationships (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      relation_type TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      important_date TEXT,
      date_label TEXT,
      notes TEXT,
      avatar_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS interactions (
      id TEXT PRIMARY KEY,
      relationship_id TEXT NOT NULL,
      interaction_type TEXT,
      notes TEXT,
      occurred_at TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (relationship_id) REFERENCES relationships(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS knowledge_base (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      file_type TEXT DEFAULT 'note' CHECK(file_type IN ('note','document','pdf','image','research')),
      file_url TEXT,
      tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high','urgent')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','in_progress','completed','cancelled')),
      due_date TEXT,
      is_recurring INTEGER DEFAULT 0,
      recurring_interval TEXT,
      category TEXT DEFAULT 'general',
      reminder_at TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS timeline_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      event_date TEXT NOT NULL,
      importance INTEGER DEFAULT 5 CHECK(importance >= 1 AND importance <= 10),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS daily_briefings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      briefing_date TEXT NOT NULL,
      content TEXT NOT NULL,
      generated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_companion_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      ai_name TEXT DEFAULT 'AI Companion',
      ai_avatar TEXT DEFAULT 'default',
      personality_traits TEXT DEFAULT '["helpful","empathetic"]',
      voice TEXT DEFAULT 'default',
      backstory TEXT,
      custom_instructions TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS integrations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      service_name TEXT NOT NULL,
      service_type TEXT NOT NULL,
      enabled INTEGER DEFAULT 0,
      config TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pinned_memories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      memory_id TEXT NOT NULL,
      pinned_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quick_notes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      color TEXT DEFAULT 'yellow',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
    CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_user_id ON chat_messages(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_conversation ON chat_messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
    CREATE INDEX IF NOT EXISTS idx_journal_user_id ON journal_entries(user_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
    CREATE INDEX IF NOT EXISTS idx_timeline_user_id ON timeline_events(user_id);
    CREATE INDEX IF NOT EXISTS idx_knowledge_user_id ON knowledge_base(user_id);
    CREATE INDEX IF NOT EXISTS idx_relationships_user_id ON relationships(user_id);
    CREATE INDEX IF NOT EXISTS idx_briefings_user_date ON daily_briefings(user_id, briefing_date);
  `);
}
