import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../Database';
import type { Memory, MemoryCategory, MemorySource, EmotionalSnapshot } from '../../../shared-types/memory.types';
import type { IRepository } from './IRepository';
import { logger } from '../../../src/shared/utils/logger';

export class MemoryRepository implements IRepository<Memory, string> {
  async findById(id: string): Promise<Memory | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM memories WHERE id = ?').get(id) as MemoryRow | undefined;

    if (!row) return null;

    const memory = this.rowToMemory(row);
    this.updateAccessStats(id);
    return memory;
  }

  async findMany(query: Partial<Memory>): Promise<Memory[]> {
    const db = getDatabase();
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (query.category) {
      conditions.push('category = ?');
      params.push(query.category);
    }

    if (query.source) {
      conditions.push('source = ?');
      params.push(query.source);
    }

    if (query.isPinned !== undefined) {
      conditions.push('is_pinned = ?');
      params.push(query.isPinned ? 1 : 0);
    }

    if (query.currentStrength !== undefined) {
      conditions.push('current_strength >= ?');
      params.push(query.currentStrength);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = db.prepare(`SELECT * FROM memories ${whereClause} ORDER BY current_strength DESC`).all(...params) as MemoryRow[];

    return rows.map(row => this.rowToMemory(row));
  }

  async create(entity: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Promise<Memory> {
    const db = getDatabase();
    const id = uuidv4();
    const now = Date.now();

    db.prepare(`
      INSERT INTO memories (
        id, category, content, embedding, importance_score, emotional_weight,
        access_count, last_accessed_at, decay_rate, current_strength, is_pinned,
        emotional_context, user_mood, related_memory_ids, source, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      entity.category,
      entity.content,
      entity.embedding ? Buffer.from(new Float32Array(entity.embedding).buffer) : null,
      entity.importanceScore,
      entity.emotionalWeight,
      entity.accessCount,
      entity.lastAccessedAt ? entity.lastAccessedAt.getTime() : null,
      entity.decayRate,
      entity.currentStrength,
      entity.isPinned ? 1 : 0,
      JSON.stringify(entity.emotionalContext),
      entity.userMood,
      JSON.stringify(entity.relatedMemoryIds),
      entity.source,
      now,
      now
    );

    logger.debug(`Memory created: ${id}`);
    return this.findById(id) as Promise<Memory>;
  }

  async update(id: string, updates: Partial<Memory>): Promise<Memory> {
    const db = getDatabase();
    const fields: string[] = [];
    const params: unknown[] = [];

    if (updates.category !== undefined) {
      fields.push('category = ?');
      params.push(updates.category);
    }
    if (updates.content !== undefined) {
      fields.push('content = ?');
      params.push(updates.content);
    }
    if (updates.importanceScore !== undefined) {
      fields.push('importance_score = ?');
      params.push(updates.importanceScore);
    }
    if (updates.emotionalWeight !== undefined) {
      fields.push('emotional_weight = ?');
      params.push(updates.emotionalWeight);
    }
    if (updates.currentStrength !== undefined) {
      fields.push('current_strength = ?');
      params.push(updates.currentStrength);
    }
    if (updates.isPinned !== undefined) {
      fields.push('is_pinned = ?');
      params.push(updates.isPinned ? 1 : 0);
    }

    fields.push('updated_at = ?');
    params.push(Date.now());
    params.push(id);

    db.prepare(`UPDATE memories SET ${fields.join(', ')} WHERE id = ?`).run(...params);

    return this.findById(id) as Promise<Memory>;
  }

  async delete(id: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM memories WHERE id = ?').run(id);
    logger.debug(`Memory deleted: ${id}`);
  }

  async findByCategory(category: MemoryCategory): Promise<Memory[]> {
    return this.findMany({ category });
  }

  async findStrongestMemories(minStrength: number = 0.1, limit: number = 10): Promise<Memory[]> {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT * FROM memories 
      WHERE current_strength >= ? AND is_pinned = 0
      ORDER BY current_strength DESC 
      LIMIT ?
    `).all(minStrength, limit) as MemoryRow[];

    return rows.map(row => this.rowToMemory(row));
  }

  private updateAccessStats(id: string): void {
    const db = getDatabase();
    db.prepare(`
      UPDATE memories 
      SET access_count = access_count + 1, 
          last_accessed_at = ?,
          current_strength = MIN(1.0, current_strength + 0.1)
      WHERE id = ?
    `).run(Date.now(), id);
  }

  private rowToMemory(row: MemoryRow): Memory {
    return {
      id: row.id,
      category: row.category as MemoryCategory,
      content: row.content,
      embedding: row.embedding ? Array.from(new Float32Array(row.embedding)) : null,
      importanceScore: row.importance_score,
      emotionalWeight: row.emotional_weight,
      accessCount: row.access_count,
      lastAccessedAt: row.last_accessed_at ? new Date(row.last_accessed_at) : null,
      decayRate: row.decay_rate,
      currentStrength: row.current_strength,
      isPinned: Boolean(row.is_pinned),
      emotionalContext: JSON.parse(row.emotional_context || '{}') as EmotionalSnapshot,
      userMood: row.user_mood,
      relatedMemoryIds: JSON.parse(row.related_memory_ids || '[]') as string[],
      source: row.source as MemorySource,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

interface MemoryRow {
  id: string;
  category: string;
  content: string;
  embedding: Buffer | null;
  importance_score: number;
  emotional_weight: number;
  access_count: number;
  last_accessed_at: number | null;
  decay_rate: number;
  current_strength: number;
  is_pinned: number;
  emotional_context: string;
  user_mood: string | null;
  related_memory_ids: string;
  source: string;
  created_at: number;
  updated_at: number;
}

export const memoryRepository = new MemoryRepository();
