import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../services/supabase';
import { validateSecret } from '../middleware/validateSecret';
import { syncCampaignStats } from '../utils/stats';
import type { CommStatus } from '../types/index';

const router = Router();

const STATUS_RANK: Record<string, number> = {
  pending: 0,
  sent: 1,
  delivered: 2,
  opened: 3,
  read: 4,
  clicked: 5,
  failed: 0,
};

// All callback routes are protected by the shared secret
router.use(validateSecret);

// ─── Validation ───────────────────────────────────────────────────────────────

const CallbackSchema = z.object({
  external_id: z.string(),
  status: z.enum(['sent', 'delivered', 'failed', 'opened', 'read', 'clicked']),
  timestamp: z.string().optional(),
});

// ─── POST /callbacks/delivery ─────────────────────────────────────────────────
// The Channel microservice POSTs delivery receipts here.

router.post('/delivery', async (req, res, next) => {
  try {
    const parsed = CallbackSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.message });
      return;
    }

    const { external_id, status, timestamp } = parsed.data;
    const ts = timestamp ?? new Date().toISOString();

    // Find the communication record by external_id
    const { data: comm, error: fetchError } = await supabase
      .from('communications')
      .select('*')
      .eq('external_id', external_id)
      .single();

    if (fetchError || !comm) {
      res.status(404).json({ success: false, error: 'Communication not found' });
      return;
    }

    // Idempotency check: If the incoming status is the same as the current status, skip
    if (comm.status === status) {
      res.status(200).json({ ok: true, skipped: true });
      return;
    }

    // Out-of-order check
    if (status !== 'failed') {
      const incomingRank = STATUS_RANK[status] ?? 0;
      const currentRank = STATUS_RANK[comm.status as string] ?? 0;

      if (incomingRank < currentRank) {
        res.status(200).json({ ok: true, skipped: true });
        return;
      }
    }

    // Build timestamp update based on status
    const timestampField: Record<CommStatus, string | null> = {
      pending: null,
      sent: 'sent_at',
      delivered: 'delivered_at',
      failed: null,
      opened: 'opened_at',
      read: 'opened_at',
      clicked: 'clicked_at',
    };

    const updatePayload: Record<string, string> = { status };
    const tsField = timestampField[status as CommStatus];
    if (tsField) {
      updatePayload[tsField] = ts;
    }

    await supabase
      .from('communications')
      .update(updatePayload)
      .eq('id', comm.id);

    // Sync stats from raw tables to campaign_stats table
    await syncCampaignStats(comm.campaign_id);

    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (err) {
    next(err);
  }
});

// ─── POST /callbacks/bulk ─────────────────────────────────────────────────────
// Accepts an array of delivery receipts in one request.

router.post('/bulk', async (req, res, next) => {
  try {
    const BulkSchema = z.object({ events: z.array(CallbackSchema) });
    const parsed = BulkSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.message });
      return;
    }

    const campaignIdsToSync = new Set<string>();

    const results = await Promise.allSettled(
      parsed.data.events.map(async (event) => {
        const { data: comm } = await supabase
          .from('communications')
          .select('id, campaign_id, status')
          .eq('external_id', event.external_id)
          .single();

        if (!comm) return;

        // Idempotency check
        if (comm.status === event.status) return;

        // Out-of-order check
        if (event.status !== 'failed') {
          const incomingRank = STATUS_RANK[event.status] ?? 0;
          const currentRank = STATUS_RANK[comm.status as string] ?? 0;

          if (incomingRank < currentRank) return;
        }

        await supabase
          .from('communications')
          .update({ status: event.status })
          .eq('id', comm.id);

        campaignIdsToSync.add(comm.campaign_id);
      })
    );

    // Sync all affected campaigns
    for (const cid of campaignIdsToSync) {
      await syncCampaignStats(cid);
    }

    const failed = results.filter((r) => r.status === 'rejected').length;

    res.json({
      success: true,
      processed: results.length,
      failed,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

