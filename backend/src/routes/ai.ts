import { Router } from 'express';
import { z } from 'zod';
import { generateText } from '../services/groq';
import { supabase } from '../services/supabase';

const router = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function safeJsonParse<T>(text: string): T {
  // Strip markdown fences that Gemini occasionally adds
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean) as T;
}

/**
 * FlatFilterInput represents the AI's flat JSON schema.
 *
 * Key fix: added `cities?: string[]` to support multi-city OR queries.
 * When `cities` is present (or `city` contains comma/and/or), logic becomes OR.
 */
interface FlatFilterInput {
  churned_days?: number | string;
  last_order_date?: unknown;
  min_spent?: number | string;
  max_spent?: number | string;
  min_orders?: number | string;
  city?: string;
  cities?: string[];
  tags?: string[];
}

/**
 * Converts the flat AI filter schema into structured filter_rules that the
 * segment engine understands, including correct OR logic for multi-city queries.
 */
function transformFilterRules(flat: FlatFilterInput): {
  logic: 'AND' | 'OR';
  rules: { field: string; operator: string; value: string | number | string[] }[];
} {
  const rules: { field: string; operator: string; value: string | number | string[] }[] = [];
  let logic: 'AND' | 'OR' = 'AND';

  if (flat.churned_days) {
    const days = Number(flat.churned_days);
    const value = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    rules.push({ field: 'last_order_date', operator: 'days_ago_gt', value });
  } else if (flat.last_order_date) {
    if (typeof flat.last_order_date === 'object' && flat.last_order_date !== null) {
      const obj = flat.last_order_date as Record<string, unknown>;
      const valStr = String(obj.value || '');
      const match = valStr.match(/\d+/);
      if (match) {
        const days = Number(match[0]);
        const value = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        rules.push({ field: 'last_order_date', operator: 'days_ago_gt', value });
      }
    } else if (typeof flat.last_order_date === 'string') {
      const valStr = flat.last_order_date.trim();
      const match = valStr.match(/^\d+$/) || valStr.match(/(\d+)\s+days/);
      if (match) {
        const days = Number(match[1] || match[0]);
        const value = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        rules.push({ field: 'last_order_date', operator: 'days_ago_gt', value });
      } else {
        const date = new Date(valStr);
        if (!isNaN(date.getTime())) {
          rules.push({ field: 'last_order_date', operator: 'days_ago_gt', value: date.toISOString() });
        }
      }
    }
  }

  if (flat.min_spent)  rules.push({ field: 'total_spent',  operator: 'gte', value: Number(flat.min_spent) });
  if (flat.max_spent)  rules.push({ field: 'total_spent',  operator: 'lte', value: Number(flat.max_spent) });
  if (flat.min_orders) rules.push({ field: 'total_orders', operator: 'gte', value: Number(flat.min_orders) });

  // ── Multi-city fix ─────────────────────────────────────────────────────────
  // Priority 1: AI emits `cities: ["Pune", "Bangalore"]` → OR logic, 'in' operator
  // Priority 2: AI emits `city: "Pune, Bangalore"` → parse and apply same logic
  // Priority 3: Single city → AND logic, 'eq' operator (unchanged)
  const cityList: string[] = [];

  if (flat.cities && Array.isArray(flat.cities) && flat.cities.length > 0) {
    cityList.push(...flat.cities.map(c => c.trim()).filter(Boolean));
  } else if (flat.city) {
    // Split on commas OR on " and "/" or " (with surrounding whitespace) so that
    // city names like "Bangalore" (which contain "and" as a substring) are NOT split.
    const raw = flat.city;
    const parts = raw
      .split(/,\s*|\s+and\s+|\s+or\s+/i)
      .map(s => s.trim())
      .filter(Boolean);
    cityList.push(...parts);
  }

  if (cityList.length > 1) {
    // Multiple cities → use 'in' operator + OR logic for the city rule
    rules.push({ field: 'city', operator: 'in', value: cityList });
    // Only force OR logic if city is the ONLY dimension (pure city query)
    // If combined with spend/inactivity, keep AND so city+spend intersects correctly
    const hasOtherRules = rules.some(r => r.field !== 'city');
    if (!hasOtherRules) {
      logic = 'OR';
    }
  } else if (cityList.length === 1) {
    rules.push({ field: 'city', operator: 'eq', value: cityList[0] });
  }
  // ──────────────────────────────────────────────────────────────────────────

  if (flat.tags && Array.isArray(flat.tags))
    rules.push({ field: 'tags', operator: 'in', value: flat.tags as string[] });

  return { logic, rules };
}

/**
 * Runs the filter_rules against the customers table and returns the real count.
 * This is the single source of truth for matched counts — never trust AI estimates.
 */
async function executeFilterCount(fr: FlatFilterInput): Promise<number> {
  // For multi-city or complex OR queries we must fetch all customers and filter in JS
  const cityList: string[] = [];
  if (fr.cities && Array.isArray(fr.cities)) {
    cityList.push(...fr.cities.map(c => c.trim()).filter(Boolean));
  } else if (fr.city) {
    const parts = fr.city.split(/,\s*|\s+and\s+|\s+or\s+/i).map(s => s.trim()).filter(Boolean);
    cityList.push(...parts);
  }

  const needsInMemory = cityList.length > 1;

  if (!needsInMemory) {
    // Use Supabase-level filtering for simple single-dimension queries
    let query = supabase.from('customers').select('*', { count: 'exact', head: true });
    if (fr.city && cityList.length === 1) query = query.eq('city', cityList[0]);
    if (fr.min_spent)    query = query.gte('total_spent', Number(fr.min_spent));
    if (fr.max_spent)    query = query.lte('total_spent', Number(fr.max_spent));
    if (fr.min_orders)   query = query.gte('total_orders', Number(fr.min_orders));
    if (fr.churned_days) {
      const cutoff = new Date(Date.now() - Number(fr.churned_days) * 86400000).toISOString();
      query = query.lt('last_order_date', cutoff);
    }
    if (fr.tags && fr.tags.length > 0) {
      query = query.contains('tags', JSON.stringify(fr.tags));
    }
    const { count } = await query;
    return count ?? 0;
  }

  // In-memory filter for multi-city OR + combined AND conditions
  const { data: allCustomers } = await supabase.from('customers').select('*');
  if (!allCustomers) return 0;

  const transformed = transformFilterRules(fr);
  const { applySegmentFilter } = await import('../utils/segmentFilter');
  const matched = applySegmentFilter(allCustomers as any, transformed as any);
  return matched.length;
}

// ─── POST /api/ai/suggest-segment ────────────────────────────────────────────
// Natural-language → structured filter_rules JSON

router.post('/suggest-segment', async (req, res, next) => {
  try {
    const Schema = z.object({ description: z.string().min(5) });
    const parsed = Schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.message });
      return;
    }

    const systemPrompt = `You are a CRM data analyst for an Indian coffee chain. Today is ${today()}.
Parse the user's segment description into structured filter rules.
Respond ONLY with valid JSON, no markdown, no backticks, no explanation.
Format: { "name": string, "description": string, "filter_rules": { "min_spent"?: number, "max_spent"?: number, "city"?: string, "cities"?: string[], "churned_days"?: number, "min_orders"?: number, "tags"?: string[] } }

CRITICAL MULTI-CITY RULE:
- If the user mentions multiple cities (e.g. "Pune and Bangalore", "Mumbai or Delhi"), use "cities": ["Pune", "Bangalore"] (array), NOT "city".
- If the user mentions a single city, use "city": "CityName" (string).
- NEVER combine multiple cities into one "city" string.

IMPORTANT: You MUST always populate the rules array with at least one valid rule. Never return an empty rules array. If the request involves inactive or churned customers, always use days_ago_gt with the number of days. If you cannot determine specific filter criteria, ask the user to clarify rather than returning empty rules.`;

    const raw = await generateText(parsed.data.description, systemPrompt);

    let aiResult: {
      name: string;
      description: string;
      filter_rules: FlatFilterInput;
    };

    try {
      aiResult = safeJsonParse(raw);
    } catch {
      throw new Error(`Gemini returned invalid JSON: ${raw}`);
    }

    const transformed = transformFilterRules(aiResult.filter_rules);
    if (!transformed.rules || transformed.rules.length === 0) {
      res.status(400).json({ error: "Could not generate valid segment rules. Please describe your audience more specifically, e.g. 'customers who spent over ₹1000' or 'customers inactive for 90 days'." });
      return;
    }

    // Execute actual DB query — never trust AI estimates
    const realCount = await executeFilterCount(aiResult.filter_rules);

    res.json({
      success: true,
      data: {
        ...aiResult,
        filter_rules: transformed,
        created_by_ai: true,
        estimated_count: realCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/ai/draft-message ───────────────────────────────────────────────
// Generates personalised campaign copy for a given segment and channel.

router.post('/draft-message', async (req, res, next) => {
  try {
    const Schema = z.object({
      segment_id: z.string().uuid(),
      channel: z.enum(['whatsapp', 'sms', 'email', 'rcs']),
      goal: z.string().optional().default('Re-engage customers and drive a visit'),
    });

    const parsed = Schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.message });
      return;
    }

    const { segment_id, channel, goal } = parsed.data;

    const { data: segment, error: segError } = await supabase
      .from('segments')
      .select('*')
      .eq('id', segment_id)
      .single();

    if (segError || !segment) {
      res.status(404).json({ success: false, error: 'Segment not found' });
      return;
    }

    const systemPrompt = `You are a marketing copywriter for an Indian coffee chain called "Brew & Bean". Today is ${today()}.
Use {{name}} as a placeholder for the customer's name.
WhatsApp/SMS: keep the message under 160 characters. Email: can be longer and richer.
Respond ONLY with valid JSON, no markdown, no backticks, no explanation.
Format: { "message": string, "subject"?: string, "tone": string, "personalization_notes": string }`;

    const userPrompt = `Write a ${channel} message for segment '${segment.name as string}': ${(segment.description as string) ?? 'No description'}. Goal: ${goal}`;

    const raw = await generateText(userPrompt, systemPrompt);

    let aiResult: {
      message: string;
      subject?: string;
      tone: string;
      personalization_notes: string;
    };

    try {
      aiResult = safeJsonParse(raw);
    } catch {
      throw new Error(`Gemini returned invalid JSON: ${raw}`);
    }

    res.json({
      success: true,
      data: {
        name: `AI — ${segment.name as string} ${channel} campaign`,
        segment_id,
        channel,
        message_template: aiResult.message,
        subject: aiResult.subject,
        tone: aiResult.tone,
        personalization_notes: aiResult.personalization_notes,
        ai_generated: true,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/ai/interpret-stats ────────────────────────────────────────────
// Generates natural-language insights from a campaign's performance stats.

router.post('/interpret-stats', async (req, res, next) => {
  try {
    const Schema = z.object({ campaign_id: z.string().uuid() });
    const parsed = Schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.message });
      return;
    }

    const { data: stats, error } = await supabase
      .from('campaign_stats')
      .select('*, campaigns(name, channel, message_template, sent_at)')
      .eq('campaign_id', parsed.data.campaign_id)
      .single();

    if (error || !stats) {
      res.status(404).json({ success: false, error: 'Campaign stats not found' });
      return;
    }

    const systemPrompt = `You are a marketing analytics expert for an Indian coffee chain. Today is ${today()}.
Respond ONLY with valid JSON, no markdown, no backticks, no explanation.
Format: { "summary": string, "highlights": string[], "recommendations": string[] }`;

    const userPrompt = JSON.stringify(stats, null, 2);

    const raw = await generateText(userPrompt, systemPrompt);

    let result: { summary: string; highlights: string[]; recommendations: string[] };
    try {
      result = safeJsonParse(raw);
    } catch {
      throw new Error(`Gemini returned invalid JSON: ${raw}`);
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────
// Conversational AI assistant with optional action blocks.

router.post('/chat', async (req, res, next) => {
  try {
    const MessageSchema = z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    });

    const Schema = z.object({
      messages: z.array(MessageSchema).min(1),
    });

    const parsed = Schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.message });
      return;
    }

    // Fetch live context
    const [{ count: customersCount }, { data: segments }, { data: campaigns }] =
      await Promise.all([
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('segments').select('id, name, customer_count').limit(10),
        supabase
          .from('campaigns')
          .select('id, name, status, channel, created_at, sent_at, campaign_stats(*)')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

    const segmentSummary = (segments ?? [])
      .map((s: Record<string, unknown>) => `${s.name as string} (${s.customer_count as number} customers)`)
      .join(', ');

    const campaignSummary = (campaigns ?? [])
      .map((c: any) => {
        const statsArrayOrObj = c.campaign_stats;
        const stats = Array.isArray(statsArrayOrObj) ? statsArrayOrObj[0] : statsArrayOrObj;
        
        let statsStr = '';
        if (stats) {
          const sent = stats.total_sent ?? 0;
          const delivered = stats.total_delivered ?? 0;
          const opened = stats.total_opened ?? 0;
          const clicked = stats.total_clicked ?? 0;
          const conversions = stats.conversions ?? 0;
          const deliveredPct = sent > 0 ? Math.round((delivered / sent) * 100) : 0;
          const openedPct = sent > 0 ? Math.round((opened / sent) * 100) : 0;
          const clickedPct = sent > 0 ? Math.round((clicked / sent) * 100) : 0;
          const conversionPct = sent > 0 ? Math.round((conversions / sent) * 100) : 0;

          statsStr = ` | Stats: Sent=${sent}, Delivered=${delivered} (${deliveredPct}%), Opened=${opened} (${openedPct}%), Clicked=${clicked} (${clickedPct}%), Conversions=${conversions} (${conversionPct}%), Attributed Orders=${conversions}`;
        }
        return `${c.name} [ID: ${c.id}, Channel: ${c.channel}, Status: ${c.status}${statsStr}]`;
      })
      .join('\n');

    const systemPrompt = `You are Tara, an intelligent marketing assistant for an Indian coffee chain using XenoCRM. Today is ${today()}.
You have ${customersCount ?? 0} customers in the database.
Current segments: ${segmentSummary || 'none yet'}.
Recent campaigns: ${campaignSummary || 'none yet'}.

When the user asks to find/filter customers or create a segment, respond conversationally AND include an action block at the very end.
When the user asks to draft a message or campaign, include a draft_message action block.
When the user asks for insights or analytics, include a show_insight action block.

<<<ACTION>>>
{ "type": "create_segment" | "draft_message" | "show_insight", "payload": {...} }
<<<END_ACTION>>>

For create_segment payload: { "name": string, "description": string, "filter_rules": {...} }
Where filter_rules must use ONLY these flat keys:
  - churned_days: number (days of inactivity)
  - min_spent: number
  - max_spent: number  
  - city: string (ONLY for a SINGLE city)
  - cities: string[] (USE THIS for MULTIPLE cities — e.g. ["Pune", "Bangalore"])
  - min_orders: number
  - tags: string[]

CRITICAL: When the user mentions multiple cities separated by "and", "or", or commas:
  - ALWAYS use "cities": ["City1", "City2"] NOT "city": "City1 and City2"
  - Example: "Pune and Bangalore" → cities: ["Pune", "Bangalore"]
  - Example: "Mumbai or Delhi" → cities: ["Mumbai", "Delhi"]

NEVER use last_order_date directly. NEVER send nested objects. For inactive customers always use churned_days.
Do NOT invent or guess customer counts — the system will calculate the real count from the database.

For draft_message payload: { "message": string, "subject"?: string, "tone": string, "channel": string }
For show_insight payload: { "summary": string, "highlights": string[], "recommendations": string[] }

CRITICAL CAMPAIGN ANALYSIS RULE:
When the user asks to analyze the performance of a campaign (e.g. "Analyze my last campaign performance" or "Can you provide the performance in numbers?"), you MUST:
1. Identify the campaign from the "Recent campaigns" list. If they ask about "my last campaign", select the most recent one.
2. In your text response, provide the exact real metrics from the database (Sent, Delivered, Opened, Clicked, Conversions, Attributed Orders) and analyze them.
3. You MUST include a "show_insight" action block at the end where:
   - "summary" is formatted EXACTLY as follows, substituting with real database numbers:
     "Campaign: [Campaign Name]\n\nSent: [SentCount]\nDelivered: [DeliveredCount] ([DeliveredPct]%)\nOpened: [OpenedCount] ([OpenedPct]%)\nClicked: [ClickedCount] ([ClickedPct]%)\nConversions: [ConversionsCount] ([ConversionsPct]%)\nAttributed Orders: [ConversionsCount]"
   - "highlights" contains actual insights based on the numbers (e.g. "Strong delivery performance", "Good open rate", "[Conversions] inactive customers successfully reactivated").
   - "recommendations" contains actionable next steps based on the performance (e.g. "Send a follow-up campaign to non-clickers", "Test personalized offers", "Expand the audience segment").
4. NEVER use generic category labels (e.g. "open rates", "click-through rates") or dummy values. Always compute percentages using (Value / Sent) * 100.

If no action is needed, respond conversationally only. Be sharp, data-driven, and concise.
Always respond in first person as Tara. After finding customers, offer to save the segment or draft a campaign.`;

    // Build conversation string from history
    const conversation = parsed.data.messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');

    const fullPrompt = `${systemPrompt}\n\nCONVERSATION:\n${conversation}\n\nASSISTANT:`;

    const rawResponse = await generateText('', fullPrompt);

    // Extract optional action block
    const actionMatch = rawResponse.match(
      /<<<ACTION>>>([\s\S]*?)<<<END_ACTION>>>/
    );

    let action: { type: string; payload: Record<string, unknown> } | undefined;
    let messageText = rawResponse;

    if (actionMatch) {
      // Remove the action block from the visible message
      messageText = rawResponse
        .replace(/<<<ACTION>>>[\s\S]*?<<<END_ACTION>>>/, '')
        .trim();

      try {
        action = safeJsonParse(actionMatch[1].trim());
      } catch {
        console.warn('[ai/chat] Could not parse action block:', actionMatch[1]);
      }
    }

    // Transform filter rules and execute REAL DB count (never trust AI estimates)
    if (action?.type === 'create_segment' && action.payload?.filter_rules) {
      const flatRules = action.payload.filter_rules as FlatFilterInput;
      const transformed = transformFilterRules(flatRules);
      action.payload.filter_rules = transformed;

      // Execute real DB count
      try {
        const realCount = await executeFilterCount(flatRules);
        action.payload.real_count = realCount;
        action.payload.estimated_count = realCount; // replace any AI estimate
      } catch (countErr) {
        console.warn('[ai/chat] Could not execute count query:', countErr);
      }
    }

    res.json({
      success: true,
      data: {
        message: messageText,
        ...(action ? { action } : {}),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── Legacy endpoints (kept for backward compat, redirect to new names) ──────

router.post('/segment', async (req, res) => {
  res.status(301).json({
    success: false,
    error: 'Endpoint moved. Use POST /api/ai/suggest-segment',
  });
});

router.post('/campaign', async (req, res) => {
  res.status(301).json({
    success: false,
    error: 'Endpoint moved. Use POST /api/ai/draft-message',
  });
});

router.post('/insights', async (req, res) => {
  res.status(301).json({
    success: false,
    error: 'Endpoint moved. Use POST /api/ai/interpret-stats',
  });
});

export default router;
