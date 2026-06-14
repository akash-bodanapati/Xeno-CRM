-- ============================================================
--  Xeno-CRM  •  Database Schema
--  Run this in the Supabase SQL editor (or via psql)
-- ============================================================

-- Enable the pgcrypto extension for gen_random_uuid()
create extension if not exists pgcrypto;

-- ─── customers ───────────────────────────────────────────────────────────────

create table if not exists customers (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  email           text,
  phone           text,
  city            text,
  total_orders    int default 0,
  total_spent     numeric default 0,
  last_order_date timestamptz,
  tags            jsonb default '[]',
  created_at      timestamptz default now()
);

create index if not exists idx_customers_city          on customers(city);
create index if not exists idx_customers_total_spent   on customers(total_spent desc);
create index if not exists idx_customers_last_order    on customers(last_order_date desc);
create index if not exists idx_customers_tags          on customers using gin(tags);

-- ─── orders ──────────────────────────────────────────────────────────────────

create table if not exists orders (
  id                     uuid primary key default gen_random_uuid(),
  customer_id            uuid references customers(id) on delete cascade,
  amount                 numeric not null,
  items                  jsonb,
  status                 text default 'completed',
  ordered_at             timestamptz default now(),
  attributed_campaign_id uuid references campaigns(id)
);

create index if not exists idx_orders_customer_id  on orders(customer_id);
create index if not exists idx_orders_ordered_at   on orders(ordered_at desc);

-- ─── segments ────────────────────────────────────────────────────────────────

create table if not exists segments (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  filter_rules    jsonb not null default '{}',
  customer_count  int default 0,
  created_by_ai   boolean default false,
  created_at      timestamptz default now()
);

-- ─── segment_members ─────────────────────────────────────────────────────────

create table if not exists segment_members (
  segment_id  uuid references segments(id) on delete cascade,
  customer_id uuid references customers(id) on delete cascade,
  primary key (segment_id, customer_id)
);

create index if not exists idx_segment_members_customer on segment_members(customer_id);

-- ─── campaigns ───────────────────────────────────────────────────────────────

create table if not exists campaigns (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  segment_id       uuid references segments(id) on delete set null,
  channel          text not null,  -- 'whatsapp' | 'sms' | 'email' | 'rcs'
  message_template text not null,
  status           text default 'draft',  -- draft | running | completed
  ai_generated     boolean default false,
  created_at       timestamptz default now(),
  sent_at          timestamptz,

  constraint campaigns_channel_check
    check (channel in ('whatsapp', 'sms', 'email', 'rcs')),
  constraint campaigns_status_check
    check (status in ('draft', 'running', 'completed'))
);

create index if not exists idx_campaigns_status     on campaigns(status);
create index if not exists idx_campaigns_segment_id on campaigns(segment_id);

-- ─── communications ──────────────────────────────────────────────────────────

create table if not exists communications (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid references campaigns(id) on delete cascade,
  customer_id  uuid references customers(id) on delete cascade,
  channel      text not null,
  message      text not null,
  status       text default 'pending',  -- pending | sent | delivered | failed | opened | read | clicked
  external_id  text,
  sent_at      timestamptz,
  delivered_at timestamptz,
  opened_at    timestamptz,
  clicked_at   timestamptz,
  created_at   timestamptz default now(),

  constraint communications_status_check
    check (status in ('pending','sent','delivered','failed','opened','read','clicked'))
);

create index if not exists idx_comms_campaign_id   on communications(campaign_id);
create index if not exists idx_comms_customer_id   on communications(customer_id);
create index if not exists idx_comms_external_id   on communications(external_id);
create index if not exists idx_comms_status        on communications(status);

-- ─── campaign_stats ──────────────────────────────────────────────────────────

create table if not exists campaign_stats (
  campaign_id     uuid primary key references campaigns(id) on delete cascade,
  total_sent      int default 0,
  total_delivered int default 0,
  total_failed    int default 0,
  total_opened    int default 0,
  total_read      int default 0,
  total_clicked   int default 0,
  conversions     int default 0,
  last_updated    timestamptz default now()
);

-- ─── RPC: increment_campaign_stat ─────────────────────────────────────────────
-- Used by the callback handler to safely increment a single stat counter.

create or replace function increment_campaign_stat(
  p_campaign_id uuid,
  p_field       text
)
returns void
language plpgsql
security definer
as $$
begin
  if p_field = 'total_sent' then
    update campaign_stats set total_sent = total_sent + 1, last_updated = now()
    where campaign_id = p_campaign_id;
  elsif p_field = 'total_delivered' then
    update campaign_stats set total_delivered = total_delivered + 1, last_updated = now()
    where campaign_id = p_campaign_id;
  elsif p_field = 'total_failed' then
    update campaign_stats set total_failed = total_failed + 1, last_updated = now()
    where campaign_id = p_campaign_id;
  elsif p_field = 'total_opened' then
    update campaign_stats set total_opened = total_opened + 1, last_updated = now()
    where campaign_id = p_campaign_id;
  elsif p_field = 'total_read' then
    update campaign_stats set total_read = total_read + 1, last_updated = now()
    where campaign_id = p_campaign_id;
  elsif p_field = 'total_clicked' then
    update campaign_stats set total_clicked = total_clicked + 1, last_updated = now()
    where campaign_id = p_campaign_id;
  elsif p_field = 'conversions' then
    update campaign_stats set conversions = conversions + 1, last_updated = now()
    where campaign_id = p_campaign_id;
  end if;
end;
$$;

-- ─── MIGRATIONS / ALTERATIONS ────────────────────────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS attributed_campaign_id UUID REFERENCES campaigns(id);
ALTER TABLE campaign_stats ADD COLUMN IF NOT EXISTS conversions INTEGER DEFAULT 0;
ALTER TABLE communications ADD COLUMN IF NOT EXISTS created_at timestamptz default now();
