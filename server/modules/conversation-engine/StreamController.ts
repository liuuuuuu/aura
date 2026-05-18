import { logger } from '../../../src/shared/utils/logger';
import type { ResponseModifiers } from '../personality-engine/PersonalityEngine';

export interface PacingConfig {
  shortPause: [number, number];
  mediumPause: [number, number];
  longPause: [number, number];
  punctuationMultiplier: number;
  emotionalMultiplier: number;
}

const DEFAULT_PACING_CONFIG: PacingConfig = {
  shortPause: [80, 150],
  mediumPause: [200, 400],
  longPause: [500, 900],
  punctuationMultiplier: 1.5,
  emotionalMultiplier: 1.3,
};

export interface StreamChunk {
  delta: string;
  done: boolean;
  tokenCount?: number;
}

export class StreamController {
  private pacingConfig: PacingConfig;
  private buffer: string;
  private bufferSize: number;
  private lastFlushTime: number;
  private isFlushing: boolean;

  constructor(config?: Partial<PacingConfig>) {
    this.pacingConfig = { ...DEFAULT_PACING_CONFIG, ...config };
    this.buffer = '';
    this.bufferSize = 20;
    this.lastFlushTime = Date.now();
    this.isFlushing = false;
  }

  async *processStream(
    stream: AsyncGenerator<StreamChunk>,
    modifiers?: ResponseModifiers
  ): AsyncGenerator<StreamChunk> {
    this.buffer = '';
    this.lastFlushTime = Date.now();

    for await (const chunk of stream) {
      if (chunk.done) {
        if (this.buffer.length > 0) {
          yield { delta: this.buffer, done: false };
          this.buffer = '';
        }
        yield chunk;
        continue;
      }

      this.buffer += chunk.delta;

      if (this.shouldFlushBuffer()) {
        const delay = this.calculateDelay(modifiers);
        
        if (delay > 0) {
          await this.sleep(delay);
        }

        yield { delta: this.buffer, done: false };
        this.buffer = '';
        this.lastFlushTime = Date.now();
      }
    }

    if (this.buffer.length > 0) {
      yield { delta: this.buffer, done: false };
      this.buffer = '';
    }
  }

  private shouldFlushBuffer(): boolean {
    if (this.buffer.length >= this.bufferSize) {
      return true;
    }

    const sentenceEnders = ['.', '!', '?', '...', '\n'];
    if (sentenceEnders.some(ender => this.buffer.endsWith(ender))) {
      return true;
    }

    if (this.buffer.includes(' ,') || this.buffer.includes(' :') || this.buffer.includes(' ;')) {
      return true;
    }

    const timeSinceLastFlush = Date.now() - this.lastFlushTime;
    if (timeSinceLastFlush > 500 && this.buffer.length > 5) {
      return true;
    }

    return false;
  }

  calculateDelay(modifiers?: ResponseModifiers): number {
    let baseDelay = this.getBaseDelay();

    if (modifiers?.pacingFactor) {
      baseDelay = Math.round(baseDelay * modifiers.pacingFactor);
    }

    if (this.buffer.endsWith('?')) {
      baseDelay = Math.round(baseDelay * this.pacingConfig.punctuationMultiplier);
    }

    if (this.buffer.endsWith('!')) {
      baseDelay = Math.round(baseDelay * this.pacingConfig.punctuationMultiplier * 0.8);
    }

    if (this.buffer.includes('...')) {
      baseDelay = Math.round(baseDelay * 1.5);
    }

    const emotionalWords = ['really', 'truly', 'actually', 'honestly', 'simply', 'just'];
    const hasEmotion = emotionalWords.some(word => 
      this.buffer.toLowerCase().includes(word)
    );
    if (hasEmotion) {
      baseDelay = Math.round(baseDelay * this.pacingConfig.emotionalMultiplier);
    }

    return baseDelay;
  }

  private getBaseDelay(): number {
    const [min, max] = this.pacingConfig.mediumPause;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  setBufferSize(size: number): void {
    this.bufferSize = Math.max(1, Math.min(size, 100));
  }

  setPacingConfig(config: Partial<PacingConfig>): void {
    this.pacingConfig = { ...this.pacingConfig, ...config };
    logger.debug('Pacing config updated', { pacingConfig: this.pacingConfig });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStatus(): {
    bufferSize: number;
    lastFlushTime: number;
    timeSinceLastFlush: number;
  } {
    return {
      bufferSize: this.buffer.length,
      lastFlushTime: this.lastFlushTime,
      timeSinceLastFlush: Date.now() - this.lastFlushTime,
    };
  }
}
