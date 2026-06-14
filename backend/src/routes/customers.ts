import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../services/supabase';
import type { ApiResponse, Customer } from '../types/index';

const router = Router();

// ─── Validation Schemas ───────────────────────────────────────────────────────

const CreateCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
});

const UpdateCustomerSchema = CreateCustomerSchema.partial();

// ─── GET /customers ───────────────────────────────────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const {
      city,
      tag,
      search,
      limit = '20',
      offset,
      page,
      min_spent,
      max_spent,
      churned,
    } = req.query;

    const pageLimit = Number(limit);
    const pageOffset = offset
      ? Number(offset)
      : page
        ? (Number(page) - 1) * pageLimit
        : 0;

    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(pageOffset, pageOffset + pageLimit - 1);

    if (city) {
      query = query.eq('city', city as string);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    if (tag) {
      query = query.contains('tags', JSON.stringify([tag]));
    }

    if (min_spent !== undefined && min_spent !== '') {
      query = query.gte('total_spent', Number(min_spent));
    }

    if (max_spent !== undefined && max_spent !== '') {
      query = query.lte('total_spent', Number(max_spent));
    }

    if (churned === 'true' || churned === '1') {
      const cutoff = new Date(Date.now() - 90 * 86400000).toISOString();
      query = query.lt('last_order_date', cutoff);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const response: ApiResponse<{ customers: Customer[]; total: number }> = {
      success: true,
      data: { customers: data as Customer[], total: count ?? data?.length ?? 0 },
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// ─── GET /customers/:id ───────────────────────────────────────────────────────

router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select(
        '*, orders(*, campaigns(name)), segment_members(segments(id, name, description, filter_rules, customer_count, created_by_ai, created_at)), communications(*, campaigns(name))'
      )
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    const { segment_members, ...customer } = data as Record<string, unknown> & {
      segment_members?: { segments: unknown }[];
      communications?: unknown[];
      orders?: unknown[];
    };

    const segments = (segment_members ?? [])
      .map((row) => row.segments)
      .filter(Boolean);

    res.json({
      success: true,
      data: {
        ...customer,
        orders: customer.orders ?? [],
        segments,
        communications: customer.communications ?? [],
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /customers ──────────────────────────────────────────────────────────

router.post('/', async (req, res, next) => {
  try {
    const parsed = CreateCustomerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.message });
      return;
    }

    const { data, error } = await supabase
      .from('customers')
      .insert(parsed.data)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /customers/:id ─────────────────────────────────────────────────────

router.patch('/:id', async (req, res, next) => {
  try {
    const parsed = UpdateCustomerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.message });
      return;
    }

    const { data, error } = await supabase
      .from('customers')
      .update(parsed.data)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /customers/:id ────────────────────────────────────────────────────

router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true, message: 'Customer deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;

