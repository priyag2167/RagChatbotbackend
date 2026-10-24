import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { answerProductQuestion } from '../services/chat.service';
import { searchHsn, getDatasetStats } from '../services/hsn-search.service';
import { groqApiKey } from '../config/env';

const chatSchema = z.object({
  message: z.string().trim().min(2).max(300)
});

export async function postChat(req: Request, res: Response, next: NextFunction): Promise<void> {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Enter a product name or HSN code between 2 and 300 characters.'
    });
    return;
  }
  try {
    const result = await answerProductQuestion(parsed.data.message);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export function getSearch(req: Request, res: Response): void {
  const parsed = z.string().trim().min(2).max(120).safeParse(String(req.query.q ?? ''));
  if (!parsed.success) {
    res.status(400).json({ error: 'Search must be between 2 and 120 characters.' });
    return;
  }
  res.json({
    query: parsed.data,
    results: searchHsn(parsed.data, 8),
    ...getDatasetStats()
  });
}

export function getHealth(_req: Request, res: Response): void {
  res.json({
    status: 'ok',
    ...getDatasetStats(),
    mode: groqApiKey ? 'retrieval-plus-generation' : 'free-local-retrieval'
  });
}

export function getApiRoot(_req: Request, res: Response): void {
  res.json({
    name: 'RAGChatbot HSN & GST Tariff API',
    version: 'v1',
    status: 'online',
    description: 'Dataset-grounded HSN/SAC code classification and GST rate search API',
    endpoints: {
      root: '/api/v1',
      health: '/api/v1/health',
      search: '/api/v1/search?q={query}',
      chat: '/api/v1/chat'
    },
    ...getDatasetStats()
  });
}

