import { Router } from 'express';
import { supabase } from '../services/supabase';

const router = Router();

// ─── GET /analytics/overview ──────────────────────────────────────────────────

router.get('/overview', async (_req, res, next) => {
  try {
    const [
      { count: totalCustomers },
      { count: totalCampaigns },
      { count: activeCampaigns },
      { data: stats },
      { data: recentCampaigns },
      { count: totalAttributedOrders },
    ] = await Promise.all([
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('campaigns').select('*', { count: 'exact', head: true }),
      supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'running'),
      supabase.from('campaign_stats').select('*'),
      supabase
        .from('campaigns')
        .select('*, campaign_stats(*)')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .not('attributed_campaign_id', 'is', null),
    ]);

    // Aggregate totals across all campaigns
    const totals = (stats ?? []).reduce(
      (acc, s) => ({
        total_sent: acc.total_sent + (s.total_sent ?? 0),
        total_delivered: acc.total_delivered + (s.total_delivered ?? 0),
        total_failed: acc.total_failed + (s.total_failed ?? 0),
        total_opened: acc.total_opened + (s.total_opened ?? 0),
        total_clicked: acc.total_clicked + (s.total_clicked ?? 0),
        total_conversions: acc.total_conversions + (s.conversions ?? 0),
      }),
      {
        total_sent: 0,
        total_delivered: 0,
        total_failed: 0,
        total_opened: 0,
        total_clicked: 0,
        total_conversions: 0,
      }
    );

    res.json({
      success: true,
      data: {
        total_customers: totalCustomers ?? 0,
        total_campaigns: totalCampaigns ?? 0,
        active_campaigns: activeCampaigns ?? 0,
        ...totals,
        total_attributed_orders: totalAttributedOrders ?? 0,
        delivery_rate:
          totals.total_sent > 0
            ? Math.round((totals.total_delivered / totals.total_sent) * 100)
            : 0,
        open_rate:
          totals.total_delivered > 0
            ? Math.round((totals.total_opened / totals.total_delivered) * 100)
            : 0,
        conversion_rate:
          totals.total_sent > 0
            ? Math.round((totals.total_conversions / totals.total_sent) * 100)
            : 0,
        recent_campaigns: recentCampaigns ?? [],
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /analytics/campaigns ───────────────────────────────────────────────

router.get('/campaigns', async (_req, res, next) => {
  try {
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('id, name, channel, status, created_at, sent_at, segment_id, ai_generated, message_template')
      .order('created_at', { ascending: false });

    if (campaignsError) throw campaignsError;

    const campaignIds = (campaigns ?? []).map((campaign) => campaign.id);
    const [
      { data: stats, error: statsError },
      { data: orderAttributions, error: attributionsError },
    ] = await Promise.all([
      campaignIds.length > 0
        ? supabase.from('campaign_stats').select('*').in('campaign_id', campaignIds)
        : Promise.resolve({ data: [], error: null }),
      campaignIds.length > 0
        ? supabase.from('orders').select('attributed_campaign_id').in('attributed_campaign_id', campaignIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (statsError) throw statsError;
    if (attributionsError) throw attributionsError;

    const statsByCampaign = new Map((stats ?? []).map((row) => [row.campaign_id, row]));

    const attributedOrdersByCampaign = new Map<string, number>();
    for (const order of orderAttributions ?? []) {
      if (order.attributed_campaign_id) {
        const current = attributedOrdersByCampaign.get(order.attributed_campaign_id) ?? 0;
        attributedOrdersByCampaign.set(order.attributed_campaign_id, current + 1);
      }
    }

    const enrichedCampaigns = (campaigns ?? []).map((campaign) => {
      const campaignStats = statsByCampaign.get(campaign.id);
      const deliveryRate = campaignStats && campaignStats.total_sent > 0
        ? Math.round((campaignStats.total_delivered / campaignStats.total_sent) * 100)
        : 0;
      const openRate = campaignStats && campaignStats.total_delivered > 0
        ? Math.round((campaignStats.total_opened / campaignStats.total_delivered) * 100)
        : 0;
      const clickRate = campaignStats && campaignStats.total_opened > 0
        ? Math.round((campaignStats.total_clicked / campaignStats.total_opened) * 100)
        : 0;
      const conversionRate = campaignStats && campaignStats.total_sent > 0
        ? Math.round(((campaignStats.conversions ?? 0) / campaignStats.total_sent) * 100)
        : 0;
      const attributedOrders = attributedOrdersByCampaign.get(campaign.id) ?? 0;

      return {
        ...campaign,
        stats: campaignStats ?? null,
        delivery_rate: deliveryRate,
        open_rate: openRate,
        click_rate: clickRate,
        conversion_rate: conversionRate,
        attributed_orders: attributedOrders,
      };
    });

    res.json({ success: true, data: enrichedCampaigns });
  } catch (err) {
    next(err);
  }
});

// ─── GET /analytics/campaigns/:id ────────────────────────────────────────────

router.get('/campaigns/:id', async (req, res, next) => {
  try {
    const [
      { data: stats, error: statsError },
      { data: channelBreakdown, error: chanError },
      { count: attributedOrders, error: ordersError },
    ] = await Promise.all([
      supabase
        .from('campaign_stats')
        .select('*')
        .eq('campaign_id', req.params.id)
        .single(),
      supabase
        .from('communications')
        .select('channel, status')
        .eq('campaign_id', req.params.id),
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('attributed_campaign_id', req.params.id),
    ]);

    if (statsError) throw statsError;
    if (chanError) throw chanError;
    if (ordersError) throw ordersError;

    // Group by channel
    const byChannel: Record<string, Record<string, number>> = {};
    for (const row of channelBreakdown ?? []) {
      if (!byChannel[row.channel]) byChannel[row.channel] = {};
      byChannel[row.channel][row.status] =
        (byChannel[row.channel][row.status] ?? 0) + 1;
    }

    res.json({
      success: true,
      data: {
        stats,
        channel_breakdown: byChannel,
        delivery_rate:
          stats && stats.total_sent > 0
            ? Math.round((stats.total_delivered / stats.total_sent) * 100)
            : 0,
        open_rate:
          stats && stats.total_delivered > 0
            ? Math.round((stats.total_opened / stats.total_delivered) * 100)
            : 0,
        click_rate:
          stats && stats.total_opened > 0
            ? Math.round((stats.total_clicked / stats.total_opened) * 100)
            : 0,
        conversion_rate:
          stats && stats.total_sent > 0
            ? Math.round(((stats.conversions ?? 0) / stats.total_sent) * 100)
            : 0,
        attributed_orders: attributedOrders ?? 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /analytics/customers/segments ───────────────────────────────────────

router.get('/customers/segments', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('segments')
      .select('id, name, customer_count, created_at')
      .order('customer_count', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// ─── GET /analytics/customers/top-spenders ───────────────────────────────────

router.get('/customers/top-spenders', async (req, res, next) => {
  try {
    const limit = Number(req.query.limit ?? 10);

    const { data, error } = await supabase
      .from('customers')
      .select('id, name, city, total_spent, total_orders, tags')
      .order('total_spent', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;

