import client from './client';

export const chat = (messages: unknown, context?: unknown) =>
  client.post('/api/ai/chat', { messages, context });

export const interpretStats = (stats: unknown) =>
  client.post('/api/ai/interpret-stats', stats);
