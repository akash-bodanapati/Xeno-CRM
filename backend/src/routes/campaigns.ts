import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../services/supabase';
import { sendMessage } from '../services/channel';
import { syncCampaignStats } from '../utils/stats';
import type { Customer, CampaignChannel } from '../types/index';

const router = Router();

// ─── Validation ───────────────────────────────────────────────────────────────

const CreateCampaignSchema = z.object({
  name: z.string().min(1),
  segment_id: z.string().uuid(),
  channel: z.enum(['whatsapp', 'sms', 'email', 'rcs']),
  message_template: z.string().min(1),
  ai_generated: z.boolean().optional().default(false),
});

// ─── GET /campaigns ───────────────────────────────────────────────────────────

router.get('/', async (_req, res, next) => {
  try {
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*, campaign_stats(*), segments(name)')
      .order('created_at', { ascending: false });

    if (campaignsError) throw campaignsError;

    const campaignIds = (campaigns ?? []).map((campaign) => campaign.id);
    const { data: orderAttributions, error: attributionsError } = campaignIds.length > 0
      ? await supabase.from('orders').select('attributed_campaign_id').in('attributed_campaign_id', campaignIds)
      : { data: [], error: null };

    if (attributionsError) throw attributionsError;

    const attributedOrdersByCampaign = new Map<string, number>();
    for (const order of orderAttributions ?? []) {
      if (order.attributed_campaign_id) {
        const current = attributedOrdersByCampaign.get(order.attributed_campaign_id) ?? 0;
        attributedOrdersByCampaign.set(order.attributed_campaign_id, current + 1);
      }
    }

    const enrichedCampaigns = (campaigns ?? []).map((campaign) => {
      const attributedOrders = attributedOrdersByCampaign.get(campaign.id) ?? 0;
      return {
        ...campaign,
        attributed_orders: attributedOrders,
      };
    });

    res.json({ success: true, data: enrichedCampaigns });
  } catch (err) {
    next(err);
  }
});

// ─── GET /campaigns/:id/stats ────────────────────────────────────────────────
// Returns the live campaign_stats row for a campaign, computed from the
// communications table so it is always consistent with the source of truth.

router.get('/:id/stats', async (req, res, next) => {
  try {
    const campaignId = req.params.id;

    // Sync stats from raw tables to campaign_stats table
    await syncCampaignStats(campaignId);

    // Fetch the stored campaign_stats row
    const { data: statsRow, error: statsError } = await supabase
      .from('campaign_stats')
      .select('*')
      .eq('campaign_id', campaignId)
      .single();

    if (statsError || !statsRow) {
      res.status(404).json({ success: false, error: 'Stats not found' });
      return;
    }

    res.json({
      success: true,
      data: statsRow,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /campaigns/:id ───────────────────────────────────────────────────────

router.get('/:id', async (req, res, next) => {
  try {
    const [
      { data: campaign, error: campError },
      { count: attributedOrders, error: ordersError },
    ] = await Promise.all([
      supabase
        .from('campaigns')
        .select('*, campaign_stats(*), segments(*)')
        .eq('id', req.params.id)
        .single(),
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('attributed_campaign_id', req.params.id),
    ]);

    if (campError) throw campError;
    if (ordersError) throw ordersError;
    if (!campaign) {
      res.status(404).json({ success: false, error: 'Campaign not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        ...campaign,
        attributed_orders: attributedOrders ?? 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /campaigns ──────────────────────────────────────────────────────────

router.post('/', async (req, res, next) => {
  try {
    const parsed = CreateCampaignSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.message });
      return;
    }

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert({ ...parsed.data, status: 'draft' })
      .select()
      .single();

    if (error) throw error;

    // Initialise campaign_stats row
    await supabase.from('campaign_stats').insert({ campaign_id: campaign.id });

    res.status(201).json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
});

// ─── POST /campaigns/:id/launch ────────────────────────────────────────────────
// Alias for /send - launches the campaign to all segment members.

router.post('/:id/launch', async (req, res, next) => {
  return handleCampaignSend(req, res, next);
});

// ─── POST /campaigns/:id/send ─────────────────────────────────────────────────
// Dispatches the campaign to all segment members.

router.post('/:id/send', async (req, res, next) => {
  return handleCampaignSend(req, res, next);
});

/**
 * Shared handler for both /launch and /send endpoints
 */
async function handleCampaignSend(req: any, res: any, next: any) {
  try {
    const campaignId = req.params.id;

    // Fetch campaign
    const { data: campaign, error: campError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campError) throw campError;
    if (!campaign) {
      res.status(404).json({ success: false, error: 'Campaign not found' });
      return;
    }
    if (campaign.status !== 'draft') {
      res.status(400).json({ success: false, error: 'Campaign is not in draft status' });
      return;
    }

    // Fetch segment members
    const { data: members, error: memberError } = await supabase
      .from('segment_members')
      .select('customers(*)')
      .eq('segment_id', campaign.segment_id);

    if (memberError) throw memberError;

    const customers = (members ?? []).map(
      (row: Record<string, unknown>) => row.customers as Customer
    );

    if (customers.length === 0) {
      res.status(400).json({ success: false, error: 'Segment has no customers' });
      return;
    }

    // Update campaign status to running
    await supabase
      .from('campaigns')
      .update({ status: 'running', sent_at: new Date().toISOString() })
      .eq('id', campaignId);

    // Send messages asynchronously — respond immediately
    res.json({
      success: true,
      message: `Campaign dispatching to ${customers.length} customers`,
    });

    // Dispatch in background
    void dispatchCampaign(campaign, customers);
  } catch (err) {
    next(err);
  }
}

/**
 * Dispatch messages to all customers, creating communication records and
 * updating campaign_stats when done.
 */
async function dispatchCampaign(
  campaign: Record<string, unknown>,
  customers: Customer[]
): Promise<void> {
  const campaignId = campaign.id as string;
  const channel = campaign.channel as CampaignChannel;
  const template = campaign.message_template as string;

  let totalSent = 0;
  let totalFailed = 0;

  for (const customer of customers) {
    // Personalise message
    const message = template
      .replace(/\{\{name\}\}/gi, customer.name)
      .replace(/\{\{city\}\}/gi, customer.city ?? '')
      .replace(/\{\{total_spent\}\}/gi, String(customer.total_spent));

    // Create pending communication record
    const { data: comm } = await supabase
      .from('communications')
      .insert({
        campaign_id: campaignId,
        customer_id: customer.id,
        channel,
        message,
        status: 'pending',
      })
      .select()
      .single();

    try {
      const contactInfo = customer.phone ?? customer.email ?? `customer_${customer.id}@stub.com`;

      const externalId = await sendMessage({
        to: contactInfo,
        channel,
        message,
        metadata: {
          campaign_id: campaignId,
          customer_id: customer.id,
          communication_id: comm?.id ?? '',
        },
      });

      await supabase
        .from('communications')
        .update({ status: 'sent', external_id: externalId, sent_at: new Date().toISOString() })
        .eq('id', comm?.id ?? '');

      totalSent++;
    } catch (err) {
      console.error(`[campaigns] Failed to send to customer ${customer.id}:`, err);
      await supabase
        .from('communications')
        .update({ status: 'failed' })
        .eq('id', comm?.id ?? '');
      totalFailed++;
    }
  }

  // Finalise campaign status and sync campaign stats
  await supabase
    .from('campaigns')
    .update({ status: 'completed' })
    .eq('id', campaignId);

  await syncCampaignStats(campaignId);

  console.log(`[campaigns] Campaign ${campaignId} completed. Sent: ${totalSent}, Failed: ${totalFailed}`);
}

// ─── GET /campaigns/:id/communications ───────────────────────────────────────

router.get('/:id/communications', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('communications')
      .select('*, customers(name, email, phone)')
      .eq('campaign_id', req.params.id)
      .order('sent_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /campaigns/:id ────────────────────────────────────────────────────

router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true, message: 'Campaign deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;

