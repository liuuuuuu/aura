import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../Database';
import type { Message, Conversation } from '../../../shared-types/conversation.types';
import type { IRepository } from './IRepository';
import { logger } from '../../../src/shared/utils/logger';

export class ConversationRepository implements IRepository<Conversation, string> {
  async findById(id: string): Promise<Conversation | null> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM conversations WHERE id = ? ORDER BY created_at ASC').all(id) as MessageRow[];

    if (rows.length === 0) return null;

    const sessionId = rows[0]?.session_id;
    if (!sessionId) return null;

    return {
      id,
      sessionId,
      messages: rows.map(row => this.rowToMessage(row)),
      createdAt: new Date(rows[0]?.created_at || 0),
      updatedAt: new Date(rows[rows.length - 1]?.created_at || 0),
    };
  }

  async findMany(query: Partial<Conversation>): Promise<Conversation[]> {
    const db = getDatabase();
    const conversations: Map<string, Message[]> = new Map();

    let sql = 'SELECT * FROM conversations';
    const params: unknown[] = [];

    if (query.sessionId) {
      sql += ' WHERE session_id = ?';
      params.push(query.sessionId);
    }

    sql += ' ORDER BY created_at ASC';

    const rows = db.prepare(sql).all(...params) as MessageRow[];

    for (const row of rows) {
      if (!conversations.has(row.id)) {
        conversations.set(row.id, []);
      }
      conversations.get(row.id)?.push(this.rowToMessage(row));
    }

    const result: Conversation[] = [];
    for (const [id, messages] of conversations) {
      if (messages.length > 0) {
        result.push({
          id,
          sessionId: messages[0]?.timestamp ? '' : '',
          messages,
          createdAt: messages[0]?.timestamp || new Date(),
          updatedAt: messages[messages.length - 1]?.timestamp || new Date(),
        });
        result[result.length - 1].sessionId = rows.find(r => r.id === id)?.session_id || '';
      }
    }

    return result;
  }

  async create(entity: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Conversation> {
    const db = getDatabase();
    const id = uuidv4();
    const now = Date.now();

    for (const message of entity.messages) {
      db.prepare(`
        INSERT INTO conversations (
          id, session_id, role, content, emotional_valence, token_count, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        entity.sessionId,
        message.role,
        message.content,
        message.emotionalValence || null,
        message.tokenCount || null,
        now
      );
    }

    logger.debug(`Conversation created: ${id}`);
    return this.findById(id) as Promise<Conversation>;
  }

  async update(id: string, updates: Partial<Conversation>): Promise<Conversation> {
    throw new Error('Conversation updates should add messages, not modify existing ones');
  }

  async delete(id: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM conversations WHERE id = ?').run(id);
    logger.debug(`Conversation deleted: ${id}`);
  }

  async addMessage(conversationId: string, message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> {
    const db = getDatabase();
    const id = uuidv4();
    const now = Date.now();

    db.prepare(`
      INSERT INTO conversations (
        id, session_id, role, content, emotional_valence, token_count, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      conversationId,
      message.role,
      message.content,
      message.emotionalValence || null,
      message.tokenCount || null,
      now
    );

    return {
      id,
      role: message.role,
      content: message.content,
      timestamp: new Date(now),
      emotionalValence: message.emotionalValence,
      tokenCount: message.tokenCount,
    };
  }

  async getConversationMessages(sessionId: string, limit: number = 50): Promise<Message[]> {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT * FROM conversations 
      WHERE session_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(sessionId, limit) as MessageRow[];

    return rows.reverse().map(row => this.rowToMessage(row));
  }

  private rowToMessage(row: MessageRow): Message {
    return {
      id: row.id,
      role: row.role as 'user' | 'aura',
      content: row.content,
      timestamp: new Date(row.created_at),
      emotionalValence: row.emotional_valence || undefined,
      tokenCount: row.token_count || undefined,
    };
  }
}

interface MessageRow {
  id: string;
  session_id: string;
  role: string;
  content: string;
  emotional_valence: number | null;
  token_count: number | null;
  created_at: number;
}

export const conversationRepository = new ConversationRepository();
