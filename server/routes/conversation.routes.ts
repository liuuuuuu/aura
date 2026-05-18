import { Router } from 'express';
import { conversationEngine } from '../modules/conversation-engine/ConversationEngine';
import { personalityEngine } from '../modules/personality-engine/PersonalityEngine';
import { logger } from '../../src/shared/utils/logger';

const router = Router();

interface SendMessageRequest {
  message: string;
  sessionId?: string;
  stream?: boolean;
}

router.post('/', async (req, res) => {
  try {
    const { message, sessionId = 'default', stream = false } = req.body as SendMessageRequest;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const context = {
      sessionId,
      messages: [],
      memories: [],
    };

    const response = await conversationEngine.handleMessage(context, message, {
      stream: false,
    });

    res.json({
      content: response.content,
      provider: response.provider,
      tokensUsed: response.tokensUsed,
      latencyMs: response.latencyMs,
      personality: {
        mood: personalityEngine.getMood(),
        relationshipStage: personalityEngine.getRelationshipStage(),
      },
    });
  } catch (error) {
    logger.error('Conversation error', error as Error);
    res.status(500).json({
      error: 'Failed to process conversation',
      message: (error as Error).message,
    });
  }
});

router.post('/stream', async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body as SendMessageRequest;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const context = {
      sessionId,
      messages: [],
      memories: [],
    };

    for await (const chunk of conversationEngine.streamMessage(context, message)) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      if (chunk.done) {
        break;
      }
    }

    res.end();
  } catch (error) {
    logger.error('Stream error', error as Error);
    res.status(500).json({
      error: 'Failed to stream conversation',
      message: (error as Error).message,
    });
  }
});

router.get('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const messages = await conversationEngine.getConversationHistory(sessionId, 50);

    res.json({
      messages,
      personality: {
        mood: personalityEngine.getMood(),
        relationshipStage: personalityEngine.getRelationshipStage(),
        state: personalityEngine.getState(),
      },
    });
  } catch (error) {
    logger.error('History error', error as Error);
    res.status(500).json({
      error: 'Failed to get conversation history',
      message: (error as Error).message,
    });
  }
});

export default router;
