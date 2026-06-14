import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../services/supabase';
import { applySegmentFilter } from '../utils/segmentFilter';
import type { Customer, FilterRules } from '../types/index';

const router = Router();

// ─── Validation ───────────────────────────────────────────────────────────────

const FilterRuleSchema = z.object({
  field: z.string(),
  operator: z.enum([
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
    'contains', 'not_contains', 'in', 'not_in',
    'days_ago_gt', 'days_ago_lt',
  ]),
  value: z.union([z.string(), z.number(), z.array(z.string())]),
});

const FilterRulesSchema = z.object({
  logic: z.enum(['AND', 'OR']).optional().default('AND'),
  rules: z.array(FilterRuleSchema),
});

const CreateSegmentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  filter_rules: FilterRulesSchema,
  created_by_ai: z.boolean().optional().default(false),
});

// ─── GET /segments ────────────────────────────────────────────────────────────

router.get('/', async (_req, res, next) => {
  try {
    const { data: segments, error } = await supabase
      .from('segments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const { data: allCustomers, error: custError } = await supabase
      .from('customers')
      .select('*');

    if (custError) throw custError;

    const populated = (segments ?? []).map((seg: any) => {
      const matched = applySegmentFilter(
        (allCustomers ?? []) as Customer[],
        seg.filter_rules as FilterRules
      );
      return {
        ...seg,
        customer_count: matched.length
      };
    });

    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
});

// ─── GET /segments/:id ────────────────────────────────────────────────────────

router.get('/:id', async (req, res, next) => {
  try {
    const { data: segment, error } = await supabase
      .from('segments')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!segment) {
      res.status(404).json({ success: false, error: 'Segment not found' });
      return;
    }

    const { data: allCustomers, error: custError } = await supabase
      .from('customers')
      .select('*');

    if (custError) throw custError;

    const matched = applySegmentFilter(
      (allCustomers ?? []) as Customer[],
      segment.filter_rules as FilterRules
    );

    res.json({
      success: true,
      data: {
        ...segment,
        customer_count: matched.length
      }
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /segments/:id/customers ─────────────────────────────────────────────

router.get('/:id/customers', async (req, res, next) => {
  try {
    // Fetch segment members via the join table
    const { data, error } = await supabase
      .from('segment_members')
      .select('customers(*)')
      .eq('segment_id', req.params.id);

    if (error) throw error;

    const customers = (data ?? []).map(
      (row: Record<string, unknown>) => row.customers
    );

    res.json({ success: true, data: customers });
  } catch (err) {
    next(err);
  }
});

// ─── GET /segments/:id/members ───────────────────────────────────────────────

router.get('/:id/members', async (req, res, next) => {
  try {
    const { data: segment, error } = await supabase
      .from('segments')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!segment) {
      res.status(404).json({ success: false, error: 'Segment not found' });
      return;
    }

    const { data: allCustomers, error: custError } = await supabase
      .from('customers')
      .select('*');

    if (custError) throw custError;

    const matched = applySegmentFilter(
      (allCustomers ?? []) as Customer[],
      segment.filter_rules as FilterRules
    );

    res.json({
      success: true,
      data: {
        ...segment,
        customers: matched,
        customer_count: matched.length
      }
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /segments ───────────────────────────────────────────────────────────

router.post('/', async (req, res, next) => {
  try {
    const parsed = CreateSegmentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.message });
      return;
    }

    const { name, description, filter_rules, created_by_ai } = parsed.data;

    if (!filter_rules.rules || filter_rules.rules.length === 0) {
      res.status(400).json({ success: false, error: "Segment has no valid filter rules" });
      return;
    }

    // Fetch all customers and apply the filter in memory
    const { data: allCustomers, error: custError } = await supabase
      .from('customers')
      .select('*');

    if (custError) throw custError;

    const matched = applySegmentFilter(
      (allCustomers ?? []) as Customer[],
      filter_rules as FilterRules
    );

    // Insert the segment
    const { data: segment, error: segError } = await supabase
      .from('segments')
      .insert({
        name,
        description,
        filter_rules,
        customer_count: matched.length,
        created_by_ai,
      })
      .select()
      .single();

    if (segError) throw segError;

    // Insert segment members
    if (matched.length > 0) {
      const memberRows = matched.map((c) => ({
        segment_id: segment.id,
        customer_id: c.id,
      }));

      const { error: memberError } = await supabase
        .from('segment_members')
        .insert(memberRows);

      if (memberError) throw memberError;
    }

    res.status(201).json({ success: true, data: segment });
  } catch (err) {
    next(err);
  }
});

// ─── POST/PUT /segments/:id/refresh ───────────────────────────────────────────
// Re-evaluates the filter rules and updates segment membership.

const refreshSegmentHandler = async (req: any, res: any, next: any) => {
  try {
    const { data: segment, error: segError } = await supabase
      .from('segments')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (segError) throw segError;
    if (!segment) {
      res.status(404).json({ success: false, error: 'Segment not found' });
      return;
    }

    const { data: allCustomers, error: custError } = await supabase
      .from('customers')
      .select('*');

    if (custError) throw custError;

    const matched = applySegmentFilter(
      (allCustomers ?? []) as Customer[],
      segment.filter_rules as FilterRules
    );

    // Remove old members and insert new ones
    const { error: deleteError } = await supabase
      .from('segment_members')
      .delete()
      .eq('segment_id', segment.id);
    if (deleteError) throw deleteError;

    if (matched.length > 0) {
      const { error: insertError } = await supabase
        .from('segment_members')
        .insert(
          matched.map((c) => ({ segment_id: segment.id, customer_id: c.id }))
        );
      if (insertError) throw insertError;
    }

    // Update count
    const { data: updated, error: updateError } = await supabase
      .from('segments')
      .update({ customer_count: matched.length })
      .eq('id', segment.id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({ success: true, data: updated, matched_count: matched.length });
  } catch (err) {
    next(err);
  }
};

router.post('/:id/refresh', refreshSegmentHandler);
router.put('/:id/refresh', refreshSegmentHandler);

// ─── DELETE /segments/:id ─────────────────────────────────────────────────────

router.delete('/:id', async (req, res, next) => {
  try {
    const segmentId = req.params.id;

    // Check if the segment is associated with any campaigns to preserve historical attribution
    const { data: campaign, error: checkError } = await supabase
      .from('campaigns')
      .select('id, name')
      .eq('segment_id', segmentId)
      .limit(1)
      .maybeSingle();

    if (checkError) throw checkError;

    if (campaign) {
      res.status(400).json({
        success: false,
        error: `Cannot delete segment because it is associated with campaign "${campaign.name}". Delete the campaign first to preserve historical reporting.`,
      });
      return;
    }

    const { error } = await supabase
      .from('segments')
      .delete()
      .eq('id', segmentId);

    if (error) throw error;

    res.json({ success: true, message: 'Segment deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;

