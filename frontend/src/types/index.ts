export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string;
  tags: string[];
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  amount: number;
  items: { items: string[] };
  status: string;
  ordered_at: string;
  attributed_campaign_id?: string;
  campaigns?: { name: string };
}

export interface Segment {
  id: string;
  name: string;
  description: string;
  filter_rules: FilterRules;
  customer_count: number;
  created_by_ai: boolean;
  created_at: string;
}

export interface FilterRules {
  min_spent?: number;
  max_spent?: number;
  city?: string;
  churned_days?: number;
  min_orders?: number;
  tags?: string[];
}

export interface Campaign {
  id: string;
  name: string;
  segment_id: string;
  channel: 'whatsapp' | 'sms' | 'email' | 'rcs';
  message_template: string;
  status: 'draft' | 'running' | 'completed';
  ai_generated: boolean;
  created_at: string;
  sent_at: string;
  segment?: Segment;
  stats?: CampaignStats;
  delivery_rate?: number;
  open_rate?: number;
  click_rate?: number;
  conversion_rate?: number;
  attributed_orders?: number;
}

export interface CampaignStats {
  campaign_id: string;
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  total_opened: number;
  total_read: number;
  total_clicked: number;
  conversions: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  attributed_orders?: number;
  last_updated: string;
}

export interface Communication {
  id: string;
  campaign_id: string;
  customer_id: string;
  channel: string;
  message: string;
  status: string;
  sent_at: string;
  delivered_at: string;
  opened_at: string;
  clicked_at: string;
  customer?: Customer;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  action?: AIAction;
}

export interface AIAction {
  type: 'create_segment' | 'draft_message' | 'show_insight';
  payload: any;
}
