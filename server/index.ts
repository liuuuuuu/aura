import express from 'express';
import { config } from '../config/aura.config';
import { logger } from '../src/shared/utils/logger';
import { getDatabase } from './modules/storage/Database';
import { aiGateway } from './modules/ai-gateway/AIGateway';
import { OpenAIProvider } from './modules/ai-gateway/providers/OpenAIProvider';
import { OllamaProvider } from './modules/ai-gateway/providers/OllamaProvider';
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
  res.json({
    status: 'ok',
    providers: aiGateway.getHealthStatus(),
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
  const openaiProvider = new OpenAIProvider();
  const ollamaProvider = new OllamaProvider();

  aiGateway.registerProvider(openaiProvider);
  aiGateway.registerProvider(ollamaProvider);

  logger.info('AI providers initialized');
}

async function startServer() {
  try {
    getDatabase();
    logger.info('Database initialized');

    await initializeProviders();

    app.listen(config.server.port, () => {
      logger.info(`Server running on port ${config.server.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error as Error);
    process.exit(1);
  }
}

startServer();

export default app;
