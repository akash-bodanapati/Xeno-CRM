import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth';
import { simulateDelivery } from '../services/simulator';
import type { SendRequest } from '../types/index';

const router = Router();

router.post('/', authMiddleware, (req, res) => {
  const { communicationId, channel, message, callbackUrl } = req.body as Partial<SendRequest>;

  if (!communicationId || !channel || !message || !callbackUrl) {
    res.status(400).json({
      error: 'Missing required fields. communicationId, channel, message, and callbackUrl are required.',
    });
    return;
  }

  const externalId = uuidv4();

  console.log(`[SEND] Received communicationId=${communicationId} channel=${channel}`);

  // Respond immediately
  res.json({
    success: true,
    external_id: externalId,
  });

  // Trigger delivery simulation in background (do not await)
  void simulateDelivery(req.body as SendRequest, externalId);
});

export default router;
