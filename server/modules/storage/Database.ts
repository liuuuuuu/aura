import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import * as path from 'path';
import * as fs from 'fs';
import { config } from '../../config/aura.config';
import { logger } from '../../src/shared/utils/logger';

let db: SqlJsDatabase | null = null;
let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null;

export async function initializeDatabase(): Promise<SqlJsDatabase> {
  if (db) {
    return db;
  }

  SQL = await initSqlJs();

  const dbPath = path.resolve(config.database.path);
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
    logger.info(`Database loaded from: ${dbPath}`);
  } else {
    db = new SQL.Database();
    logger.info(`New database created at: ${dbPath}`);
  }

  initializeSchema(db);
  saveDatabase();

  return db;
}

export function getDatabase(): SqlJsDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

function initializeSchema(database: SqlJsDatabase): void {
  database.run(`
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      embedding BLOB,
      importance_score REAL NOT NULL DEFAULT 0.5,
      emotional_weight REAL NOT NULL DEFAULT 0.5,
      access_count INTEGER NOT NULL DEFAULT 0,
      last_accessed_at INTEGER,
      decay_rate REAL NOT NULL DEFAULT 0.01,
      current_strength REAL NOT NULL DEFAULT 1.0,
      is_pinned INTEGER NOT NULL DEFAULT 0,
      emotional_context TEXT,
      user_mood TEXT,
      related_memory_ids TEXT,
      source TEXT NOT NULL DEFAULT 'conversation',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'aura')),
      content TEXT NOT NULL,
      emotional_valence REAL,
      token_count INTEGER,
      created_at INTEGER NOT NULL
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS personality_state (
      id INTEGER PRIMARY KEY DEFAULT 1,
      state TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS relationship_events (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      state_before TEXT NOT NULL,
      state_after TEXT NOT NULL,
      context TEXT,
      created_at INTEGER NOT NULL
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS memory_decay_runs (
      id TEXT PRIMARY KEY,
      run_at INTEGER NOT NULL,
      memories_processed INTEGER,
      memories_archived INTEGER,
      summary TEXT
    )
  `);

  database.run(`CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_memories_strength ON memories(current_strength)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(session_id)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_relationship_events_type ON relationship_events(event_type)`);

  logger.debug('Database schema initialized');
}

export function saveDatabase(): void {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    const dbPath = path.resolve(config.database.path);
    fs.writeFileSync(dbPath, buffer);
    logger.debug('Database saved to disk');
  }
}

export function closeDatabase(): void {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
    logger.info('Database closed');
  }
}
