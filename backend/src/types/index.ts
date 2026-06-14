// ─── Customer & Order ────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  tags: string[];
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  amount: number;
  items?: Record<string, unknown>;
  status: string;
  ordered_at: string;
}

// ─── Segment ─────────────────────────────────────────────────────────────────

export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'not_contains'
  | 'in'
  | 'not_in'
  | 'days_ago_gt'
  | 'days_ago_lt';

export interface FilterRule {
  field: keyof Customer;
  operator: FilterOperator;
  value: string | number | string[];
}

export interface FilterRules {
  logic?: 'AND' | 'OR';
  rules: FilterRule[];
}

export interface Segment {
  id: string;
  name: string;
  description?: string;
  filter_rules: FilterRules;
  customer_count: number;
  created_by_ai: boolean;
  created_at: string;
}

// ─── Campaign ─────────────────────────────────────────────────────────────────

export type CampaignChannel = 'whatsapp' | 'sms' | 'email' | 'rcs';
export type CampaignStatus = 'draft' | 'running' | 'completed';

export interface Campaign {
  id: string;
  name: string;
  segment_id: string;
  channel: CampaignChannel;
  message_template: string;
  status: CampaignStatus;
  ai_generated: boolean;
  created_at: string;
  sent_at?: string;
}

// ─── Communication ────────────────────────────────────────────────────────────

export type CommStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'opened'
  | 'read'
  | 'clicked';

export interface Communication {
  id: string;
  campaign_id: string;
  customer_id: string;
  channel: CampaignChannel;
  message: string;
  status: CommStatus;
  external_id?: string;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
}

// ─── Campaign Stats ───────────────────────────────────────────────────────────

export interface CampaignStats {
  campaign_id: string;
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  total_opened: number;
  total_read: number;
  total_clicked: number;
  conversions: number;
  last_updated: string;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ─── Channel Service ──────────────────────────────────────────────────────────

export interface ChannelSendPayload {
  to: string;
  channel: CampaignChannel;
  message: string;
  metadata?: {
    campaign_id: string;
    customer_id: string;
    communication_id: string;
  };
}

export interface ChannelCallbackPayload {
  external_id: string;
  status: CommStatus;
  timestamp: string;
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export interface AiSegmentRequest {
  prompt: string;
}

export interface AiCampaignRequest {
  segment_id: string;
  channel: CampaignChannel;
  objective?: string;
}

