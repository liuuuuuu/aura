import { v4 as uuidv4 } from 'uuid';
import { memoryRepository } from '../storage/repositories/MemoryRepository';
import { memoryScorer } from './MemoryScorer';
import { logger } from '../../../src/shared/utils/logger';
import type { Memory } from '../../../shared-types/memory.types';

export interface DecayWorkerConfig {
  runIntervalMs: number;
  archiveThreshold: number;
  minStrengthForUpdate: number;
}

const DEFAULT_CONFIG: DecayWorkerConfig = {
  runIntervalMs: 1000 * 60 * 60,
  archiveThreshold: 0.05,
  minStrengthForUpdate: 0.1,
};

export class MemoryDecayWorker {
  private config: DecayWorkerConfig;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(config?: Partial<DecayWorkerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  start(): void {
    if (this.intervalId) {
      logger.warn('MemoryDecayWorker is already running');
      return;
    }

    logger.info('Starting MemoryDecayWorker', { config: this.config });

    this.runDecayCycle();
    this.intervalId = setInterval(() => {
      this.runDecayCycle();
    }, this.config.runIntervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('MemoryDecayWorker stopped');
    }
  }

  async runDecayCycle(): Promise<{
    processedCount: number;
    archivedCount: number;
    updatedCount: number;
  }> {
    if (this.isRunning) {
      logger.warn('Decay cycle already in progress, skipping');
      return { processedCount: 0, archivedCount: 0, updatedCount: 0 };
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      const allMemories = await memoryRepository.findMany({});
      const nonPinnedMemories = allMemories.filter(m => !m.isPinned);

      let processedCount = 0;
      let archivedCount = 0;
      let updatedCount = 0;

      const currentTime = new Date();

      for (const memory of nonPinnedMemories) {
        processedCount++;

        const newStrength = memoryScorer.calculateCurrentStrength(memory, currentTime);

        if (memoryScorer.shouldArchiveMemory(memory, this.config.archiveThreshold)) {
          await this.archiveMemory(memory);
          archivedCount++;
        } else if (Math.abs(newStrength - memory.currentStrength) > 0.01) {
          await memoryRepository.update(memory.id, {
            currentStrength: newStrength,
          });
          updatedCount++;
        }
      }

      const duration = Date.now() - startTime;

      logger.info('Decay cycle completed', {
        processedCount,
        archivedCount,
        updatedCount,
        durationMs: duration,
      });

      return { processedCount, archivedCount, updatedCount };
    } catch (error) {
      logger.error('Decay cycle failed', error as Error);
      return { processedCount: 0, archivedCount: 0, updatedCount: 0 };
    } finally {
      this.isRunning = false;
    }
  }

  private async archiveMemory(memory: Memory): Promise<void> {
    logger.debug(`Archiving memory: ${memory.id}`, {
      category: memory.category,
      strength: memory.currentStrength,
    });

    await memoryRepository.delete(memory.id);
  }

  getStatus(): {
    isRunning: boolean;
    config: DecayWorkerConfig;
    lastRun?: Date;
  } {
    return {
      isRunning: this.isRunning,
      config: this.config,
    };
  }
}

export const memoryDecayWorker = new MemoryDecayWorker();
