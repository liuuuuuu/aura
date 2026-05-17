import { Router } from 'express';
import { memoryRepository } from '../modules/storage/repositories/MemoryRepository';
import { logger } from '../../src/shared/utils/logger';
import type { MemoryCategory } from '../../shared-types/memory.types';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { category, minStrength, limit } = req.query;

    const query: Record<string, unknown> = {};
    if (category) query.category = category as MemoryCategory;
    if (minStrength) query.currentStrength = parseFloat(minStrength as string);

    const memories = await memoryRepository.findMany(query);
    const limitedMemories = limit 
      ? memories.slice(0, parseInt(limit as string))
      : memories;

    res.json({ memories: limitedMemories });
  } catch (error) {
    logger.error('Get memories error', error as Error);
    res.status(500).json({
      error: 'Failed to get memories',
      message: (error as Error).message,
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const memory = await memoryRepository.findById(id);

    if (!memory) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }

    res.json({ memory });
  } catch (error) {
    logger.error('Get memory error', error as Error);
    res.status(500).json({
      error: 'Failed to get memory',
      message: (error as Error).message,
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { category, content, importanceScore, emotionalWeight, emotionalContext } = req.body;

    if (!category || !content) {
      res.status(400).json({ error: 'Category and content are required' });
      return;
    }

    const memory = await memoryRepository.create({
      category,
      content,
      embedding: null,
      importanceScore: importanceScore || 0.5,
      emotionalWeight: emotionalWeight || 0.5,
      accessCount: 0,
      lastAccessedAt: null,
      decayRate: getDecayRateForCategory(category),
      currentStrength: 1.0,
      isPinned: false,
      emotionalContext: emotionalContext || { mood: 0, energy: 0.5, trust: 0.5, affection: 0.5 },
      userMood: null,
      relatedMemoryIds: [],
      source: 'conversation',
    });

    res.status(201).json({ memory });
  } catch (error) {
    logger.error('Create memory error', error as Error);
    res.status(500).json({
      error: 'Failed to create memory',
      message: (error as Error).message,
    });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const memory = await memoryRepository.update(id, updates);

    if (!memory) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }

    res.json({ memory });
  } catch (error) {
    logger.error('Update memory error', error as Error);
    res.status(500).json({
      error: 'Failed to update memory',
      message: (error as Error).message,
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await memoryRepository.delete(id);
    res.status(204).send();
  } catch (error) {
    logger.error('Delete memory error', error as Error);
    res.status(500).json({
      error: 'Failed to delete memory',
      message: (error as Error).message,
    });
  }
});

function getDecayRateForCategory(category: MemoryCategory): number {
  const decayRates: Record<MemoryCategory, number> = {
    profile: 0.001,
    emotional: 0.005,
    episodic: 0.02,
    relationship: 0.003,
    preference: 0.01,
  };
  return decayRates[category] || 0.01;
}

export default router;
