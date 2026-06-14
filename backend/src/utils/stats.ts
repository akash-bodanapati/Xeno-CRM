import { supabase } from '../services/supabase';

/**
 * Recomputes all stats for a given campaign directly from the source tables
 * (communications and orders) and saves the aggregated counts to the
 * campaign_stats table. This guarantees that all metrics are consistent
 * and prevents impossible states.
 */
export async function syncCampaignStats(campaignId: string): Promise<void> {
  try {
    // 1. Fetch all communications for this campaign
    const { data: comms, error: commsError } = await supabase
      .from('communications')
      .select('status')
      .eq('campaign_id', campaignId);

    if (commsError) {
      console.error(`[syncCampaignStats] Error fetching communications for ${campaignId}:`, commsError);
      return;
    }

    // 2. Fetch all unique customer conversions (orders attributed to this campaign)
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('customer_id')
      .eq('attributed_campaign_id', campaignId);

    if (ordersError) {
      console.error(`[syncCampaignStats] Error fetching orders for ${campaignId}:`, ordersError);
      return;
    }

    const uniqueCustomers = new Set(orders?.map((o) => o.customer_id) ?? []);
    const conversionsCount = uniqueCustomers.size;

    const counts = {
      total_sent: 0,
      total_delivered: 0,
      total_failed: 0,
      total_opened: 0,
      total_read: 0,
      total_clicked: 0,
    };

    const STATUS_RANK: Record<string, number> = {
      pending: 0,
      sent: 1,
      delivered: 2,
      opened: 3,
      read: 4,
      clicked: 5,
      failed: 0,
    };

    for (const comm of comms ?? []) {
      const rank = STATUS_RANK[comm.status as string] ?? 0;
      if (comm.status === 'failed') {
        counts.total_failed++;
      } else if (rank >= 1) {
        counts.total_sent++;
        if (rank >= 2) counts.total_delivered++;
        if (rank >= 3) counts.total_opened++;
        if (rank >= 4) counts.total_read++;
        if (rank >= 5) counts.total_clicked++;
      }
    }

    // 3. Upsert into campaign_stats table
    const { error: upsertError } = await supabase
      .from('campaign_stats')
      .upsert({
        campaign_id: campaignId,
        total_sent: counts.total_sent,
        total_delivered: counts.total_delivered,
        total_failed: counts.total_failed,
        total_opened: counts.total_opened,
        total_read: counts.total_read,
        total_clicked: counts.total_clicked,
        conversions: conversionsCount,
        last_updated: new Date().toISOString(),
      });

    if (upsertError) {
      console.error(`[syncCampaignStats] Error upserting stats for ${campaignId}:`, upsertError);
    }
  } catch (err) {
    console.error(`[syncCampaignStats] Unexpected exception for ${campaignId}:`, err);
  }
}
