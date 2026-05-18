import express from 'express';
import { config } from '../config/aura.config';
import { logger } from '../src/shared/utils/logger';
import { initializeDatabase, closeDatabase } from './modules/storage/Database';
import { aiGateway } from './modules/ai-gateway/AIGateway';
import { OpenAIProvider } from './modules/ai-gateway/providers/OpenAIProvider';
import { OllamaProvider } from './modules/ai-gateway/providers/OllamaProvider';
import { ClaudeProvider } from './modules/ai-gateway/providers/ClaudeProvider';
import { DeepSeekProvider } from './modules/ai-gateway/providers/DeepSeekProvider';
import { HealthChecker } from './modules/ai-gateway/HealthChecker';
import { personalityEngine } from './modules/personality-engine/PersonalityEngine';
import { systemPromptAssembler } from './modules/prompt-engine/assemblers/SystemPromptAssembler';
import { tokenBudgetManager } from './modules/prompt-engine/budget/TokenBudgetManager';
import { conversationEngine } from './modules/conversation-engine/ConversationEngine';
import conversationRoutes from './routes/conversation.routes';
import memoryRoutes from './routes/memory.routes';
import stateRoutes from './routes/state.routes';

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.use('/api/conversation', conversationRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/state', stateRoutes);

app.get('/health', (req, res) => {
  const healthChecker = new HealthChecker(aiGateway);
  res.json({
    status: 'ok',
    providers: aiGateway.getHealthStatus(),
    health: healthChecker.getStatus(),
    personality: {
      state: personalityEngine.getState(),
      mood: personalityEngine.getMood(),
      relationshipStage: personalityEngine.getRelationshipStage(),
    },
    tokenBudget: tokenBudgetManager.getBudgetStatus(),
  });
});

app.get('/api/personality', (req, res) => {
  res.json({
    state: personalityEngine.getState(),
    mood: personalityEngine.getMood(),
    relationshipStage: personalityEngine.getRelationshipStage(),
    modifiers: personalityEngine.getResponseModifiers(),
    history: personalityEngine.getStateHistory(10),
  });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

async function initializeProviders() {
  aiGateway.registerProvider(new OpenAIProvider());
  aiGateway.registerProvider(new OllamaProvider());
  aiGateway.registerProvider(new ClaudeProvider());
  aiGateway.registerProvider(new DeepSeekProvider());

  aiGateway.setPrimaryProvider('openai');
  aiGateway.setFallbackOrder(['claude', 'deepseek', 'ollama']);

  logger.info('AI providers initialized', {
    providers: aiGateway.getHealthStatus().map(h => h.name),
  });
}

async function startServer() {
  try {
    await initializeDatabase();
    logger.info('Database initialized');

    await initializeProviders();

    const healthChecker = new HealthChecker(aiGateway);
    healthChecker.start();

    app.listen(config.server.port, () => {
      logger.info(`Server running on port ${config.server.port}`);
      logger.info(`Health check available at http://localhost:${config.server.port}/health`);
      logger.info(`Personality state at http://localhost:${config.server.port}/api/personality`);
    });
  } catch (error) {
    logger.error('Failed to start server', error as Error);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  logger.info('Shutting down...');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down...');
  closeDatabase();
  process.exit(0);
});

startServer();

export default app;
