import { Router } from 'express';
import { memoryEngine } from '../modules/memory-engine/MemoryEngine';
import { logger } from '../../src/shared/utils/logger';
import type { MemoryCategory } from '../../shared-types/memory.types';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { category, limit } = req.query;

    let memories;
    if (category) {
      memories = await memoryEngine.getMemoriesByCategory(category as MemoryCategory);
    } else {
      memories = await memoryEngine.getRecentMemories(limit ? parseInt(limit as string) : 50);
    }

    res.json({ 
      memories,
      count: memories.length 
    });
  } catch (error) {
    logger.error('Get memories error', error as Error);
    res.status(500).json({
      error: 'Failed to get memories',
      message: (error as Error).message,
    });
  }
});

router.get('/pinned', async (req, res) => {
  try {
    const memories = await memoryEngine.getPinnedMemories();
    res.json({ 
      memories,
      count: memories.length 
    });
  } catch (error) {
    logger.error('Get pinned memories error', error as Error);
    res.status(500).json({
      error: 'Failed to get pinned memories',
      message: (error as Error).message,
    });
  }
});

router.get('/context', async (req, res) => {
  try {
    const { query, categories } = req.query;

    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Query parameter is required' });
      return;
    }

    const categoryList = categories 
      ? (categories as string).split(',') as MemoryCategory[]
      : undefined;

    const results = await memoryEngine.retrieveContext(query, categoryList);

    res.json({ 
      results,
      count: results.length 
    });
  } catch (error) {
    logger.error('Get memory context error', error as Error);
    res.status(500).json({
      error: 'Failed to get memory context',
      message: (error as Error).message,
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const memory = await memoryEngine.getMemoryById(id);

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
    const { content, category, emotionalState } = req.body;

    if (!content || !category) {
      res.status(400).json({ error: 'Content and category are required' });
      return;
    }

    const defaultEmotionalState = {
      mood: 0,
      energy: 0.5,
      trust: 0.5,
      affection: 0.5,
    };

    const memory = await memoryEngine.createMemory(
      content,
      category,
      emotionalState || defaultEmotionalState
    );

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

    const memory = await memoryEngine.updateMemory(id, updates);

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

router.post('/:id/pin', async (req, res) => {
  try {
    const { id } = req.params;
    const memory = await memoryEngine.pinMemory(id);

    if (!memory) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }

    res.json({ memory });
  } catch (error) {
    logger.error('Pin memory error', error as Error);
    res.status(500).json({
      error: 'Failed to pin memory',
      message: (error as Error).message,
    });
  }
});

router.post('/:id/unpin', async (req, res) => {
  try {
    const { id } = req.params;
    const memory = await memoryEngine.unpinMemory(id);

    if (!memory) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }

    res.json({ memory });
  } catch (error) {
    logger.error('Unpin memory error', error as Error);
    res.status(500).json({
      error: 'Failed to unpin memory',
      message: (error as Error).message,
    });
  }
});

router.post('/:id/boost', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const memory = await memoryEngine.boostMemory(id, amount);

    if (!memory) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }

    res.json({ memory });
  } catch (error) {
    logger.error('Boost memory error', error as Error);
    res.status(500).json({
      error: 'Failed to boost memory',
      message: (error as Error).message,
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await memoryEngine.deleteMemory(id);
    res.status(204).send();
  } catch (error) {
    logger.error('Delete memory error', error as Error);
    res.status(500).json({
      error: 'Failed to delete memory',
      message: (error as Error).message,
    });
  }
});

router.post('/run-decay', async (req, res) => {
  try {
    const result = await memoryEngine.runDecayCycle();
    res.json({ result });
  } catch (error) {
    logger.error('Run decay cycle error', error as Error);
    res.status(500).json({
      error: 'Failed to run decay cycle',
      message: (error as Error).message,
    });
  }
});

export default router;
