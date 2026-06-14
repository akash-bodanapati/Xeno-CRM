import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth';
import { simulateDelivery } from '../services/simulator';
import type { SendRequest } from '../types/index';

const router = Router();

router.post('/', authMiddleware, (req, res) => {
  const { sends } = req.body as { sends?: Partial<SendRequest>[] };

  if (!sends || !Array.isArray(sends) || sends.length === 0) {
    res.status(400).json({
      error: 'Body must contain a non-empty "sends" array.',
    });
    return;
  }

  // Validate each item in bulk has required fields
  for (const item of sends) {
    if (!item.communicationId || !item.channel || !item.message || !item.callbackUrl) {
      res.status(400).json({
        error: 'Each item in "sends" must contain communicationId, channel, message, and callbackUrl.',
      });
      return;
    }
  }

  const results = sends.map((send) => {
    const externalId = uuidv4();
    
    console.log(`[BULK-SEND] Received communicationId=${send.communicationId} channel=${send.channel}`);
    
    // Simulate delivery in background
    void simulateDelivery(send as SendRequest, externalId);
    
    return {
      communicationId: send.communicationId!,
      externalId,
    };
  });

  res.json({
    accepted: sends.length,
    results,
  });
});

export default router;
