import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../services/supabase';
import { syncCampaignStats } from '../utils/stats';

const router = Router();

const CreateOrderSchema = z.object({
  customer_id: z.string().uuid(),
  amount: z.number().positive(),
  items: z.array(z.string()).nonempty(),
  order_date: z.string().datetime().optional(),
});

// ─── POST /orders ────────────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const parsed = CreateOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.message });
      return;
    }

    const { customer_id, amount, items, order_date } = parsed.data;

    // Check if customer exists
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customer_id)
      .single();

    if (customerError || !customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    const newOrder = {
      customer_id,
      amount,
      items: { items },
      status: 'completed',
      ordered_at: order_date ?? new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('orders')
      .insert(newOrder)
      .select()
      .single();

    if (error) throw error;
    // Update customer aggregates
const { data: existingCustomer } = await supabase
  .from('customers')
  .select('total_spent,total_orders')
  .eq('id', customer_id)
  .single();

if (existingCustomer) {
  await supabase
    .from('customers')
    .update({
      total_spent:
        Number(existingCustomer.total_spent || 0) + amount,
      total_orders:
        Number(existingCustomer.total_orders || 0) + 1,
      last_order_date: newOrder.ordered_at,
    })
    .eq('id', customer_id);
}
    // Campaign conversions attribution tracking
    try {
      const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
      const { data: comm, error: commError } = await supabase
        .from('communications')
        .select('campaign_id')
        .eq('customer_id', customer_id)
        .in('status', ['delivered', 'opened', 'clicked'])
        .gt('created_at', seventyTwoHoursAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!commError && comm && comm.campaign_id) {
        // Update the order's attributed_campaign_id
        await supabase
          .from('orders')
          .update({ attributed_campaign_id: comm.campaign_id })
          .eq('id', data.id);

        // Check if this customer has already been converted for this campaign
        const { data: existingOrder, error: existingError } = await supabase
          .from('orders')
          .select('id')
          .eq('customer_id', customer_id)
          .eq('attributed_campaign_id', comm.campaign_id)
          .neq('id', data.id)
          .limit(1)
          .maybeSingle();

        if (!existingError && !existingOrder) {
          // Recompute stats and conversions to be 100% accurate
          await syncCampaignStats(comm.campaign_id);
        }
      }
    } catch (attrErr) {
      console.error('[orders] Failed to attribute conversions:', attrErr);
    }

    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
