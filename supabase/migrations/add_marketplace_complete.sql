-- Migration: Complete Marketplace Integration Tables
-- This migration adds tables for orders, webhooks, questions, and metrics caching

-- ============================================
-- MARKETPLACE ORDERS
-- ============================================

-- Main orders table (orders from external marketplaces like Mercado Livre)
CREATE TABLE IF NOT EXISTS public.marketplace_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID REFERENCES public.marketplace_configs(id) ON DELETE SET NULL,
    external_order_id TEXT NOT NULL,
    external_order_status TEXT NOT NULL,
    internal_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    buyer_id TEXT,
    buyer_nickname TEXT,
    buyer_email TEXT,
    buyer_phone TEXT,
    shipping_id TEXT,
    shipping_status TEXT,
    shipping_tracking_number TEXT,
    shipping_carrier TEXT,
    total_amount NUMERIC(12,2) NOT NULL,
    fee_amount NUMERIC(12,2),
    shipping_cost NUMERIC(12,2),
    currency TEXT DEFAULT 'BRL',
    payment_status TEXT,
    payment_method TEXT,
    order_date TIMESTAMPTZ NOT NULL,
    date_closed TIMESTAMPTZ,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(config_id, external_order_id)
);

-- Order items table
CREATE TABLE IF NOT EXISTS public.marketplace_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_order_id UUID REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
    mapping_id UUID REFERENCES public.marketplace_product_mappings(id) ON DELETE SET NULL,
    external_item_id TEXT NOT NULL,
    title TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    sku TEXT,
    variation_id TEXT,
    variation_attributes JSONB,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for orders
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_config ON public.marketplace_orders(config_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_status ON public.marketplace_orders(external_order_status);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_date ON public.marketplace_orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_buyer ON public.marketplace_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_shipping ON public.marketplace_orders(shipping_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_order_items_order ON public.marketplace_order_items(marketplace_order_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_order_items_mapping ON public.marketplace_order_items(mapping_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_marketplace_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_marketplace_orders_updated_at ON public.marketplace_orders;
CREATE TRIGGER trigger_marketplace_orders_updated_at
    BEFORE UPDATE ON public.marketplace_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_marketplace_orders_updated_at();

-- ============================================
-- MARKETPLACE WEBHOOKS
-- ============================================

-- Webhook logs table (stores all webhook notifications received)
CREATE TABLE IF NOT EXISTS public.marketplace_webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID REFERENCES public.marketplace_configs(id) ON DELETE SET NULL,
    topic TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id TEXT,
    user_id TEXT,
    application_id TEXT,
    attempts INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, processed, failed, skipped
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    raw_payload JSONB NOT NULL,
    received_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for webhooks
CREATE INDEX IF NOT EXISTS idx_marketplace_webhooks_topic ON public.marketplace_webhook_logs(topic);
CREATE INDEX IF NOT EXISTS idx_marketplace_webhooks_status ON public.marketplace_webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_webhooks_received ON public.marketplace_webhook_logs(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_webhooks_resource ON public.marketplace_webhook_logs(resource_id);

-- ============================================
-- MARKETPLACE QUESTIONS
-- ============================================

-- Questions from buyers on marketplace listings
CREATE TABLE IF NOT EXISTS public.marketplace_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID REFERENCES public.marketplace_configs(id) ON DELETE CASCADE,
    external_question_id TEXT NOT NULL,
    external_product_id TEXT NOT NULL,
    mapping_id UUID REFERENCES public.marketplace_product_mappings(id) ON DELETE SET NULL,
    buyer_id TEXT NOT NULL,
    buyer_nickname TEXT,
    question_text TEXT NOT NULL,
    answer_text TEXT,
    status TEXT DEFAULT 'unanswered', -- unanswered, answered, deleted, banned
    asked_at TIMESTAMPTZ NOT NULL,
    answered_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(config_id, external_question_id)
);

-- Indexes for questions
CREATE INDEX IF NOT EXISTS idx_marketplace_questions_config ON public.marketplace_questions(config_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_questions_status ON public.marketplace_questions(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_questions_product ON public.marketplace_questions(external_product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_questions_asked ON public.marketplace_questions(asked_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_questions_unanswered ON public.marketplace_questions(config_id, status)
    WHERE status = 'unanswered';

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_marketplace_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_marketplace_questions_updated_at ON public.marketplace_questions;
CREATE TRIGGER trigger_marketplace_questions_updated_at
    BEFORE UPDATE ON public.marketplace_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_marketplace_questions_updated_at();

-- ============================================
-- MARKETPLACE MESSAGES
-- ============================================

-- Messages between seller and buyer (post-purchase)
CREATE TABLE IF NOT EXISTS public.marketplace_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID REFERENCES public.marketplace_configs(id) ON DELETE CASCADE,
    marketplace_order_id UUID REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
    external_message_id TEXT NOT NULL,
    external_pack_id TEXT, -- ML pack ID
    sender_role TEXT NOT NULL, -- seller, buyer
    message_text TEXT NOT NULL,
    attachments JSONB,
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ NOT NULL,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(config_id, external_message_id)
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_order ON public.marketplace_messages(marketplace_order_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_config ON public.marketplace_messages(config_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_unread ON public.marketplace_messages(config_id, is_read)
    WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_sent ON public.marketplace_messages(sent_at DESC);

-- ============================================
-- MARKETPLACE METRICS CACHE
-- ============================================

-- Cache for marketplace metrics (to avoid excessive API calls)
CREATE TABLE IF NOT EXISTS public.marketplace_metrics_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID REFERENCES public.marketplace_configs(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL, -- sales, visits, conversion, reputation, product_visits
    period TEXT NOT NULL, -- day, week, month, year, custom
    start_date DATE,
    end_date DATE,
    product_id TEXT, -- optional, for product-specific metrics
    data JSONB NOT NULL,
    cached_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    UNIQUE(config_id, metric_type, period, start_date, end_date, product_id)
);

-- Indexes for metrics cache
CREATE INDEX IF NOT EXISTS idx_marketplace_metrics_config ON public.marketplace_metrics_cache(config_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_metrics_type ON public.marketplace_metrics_cache(metric_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_metrics_expires ON public.marketplace_metrics_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_marketplace_metrics_product ON public.marketplace_metrics_cache(product_id)
    WHERE product_id IS NOT NULL;

-- ============================================
-- MARKETPLACE SHIPMENTS (detailed tracking)
-- ============================================

-- Shipment events (tracking history)
CREATE TABLE IF NOT EXISTS public.marketplace_shipment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_order_id UUID REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
    shipment_id TEXT NOT NULL,
    event_type TEXT NOT NULL, -- shipped, in_transit, out_for_delivery, delivered, returned, etc.
    event_date TIMESTAMPTZ NOT NULL,
    description TEXT,
    location TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for shipment events
CREATE INDEX IF NOT EXISTS idx_marketplace_shipment_events_order ON public.marketplace_shipment_events(marketplace_order_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_shipment_events_shipment ON public.marketplace_shipment_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_shipment_events_date ON public.marketplace_shipment_events(event_date DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_metrics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_shipment_events ENABLE ROW LEVEL SECURITY;

-- Admin policies (role = 'admin')
CREATE POLICY "Admins can manage marketplace orders" ON public.marketplace_orders
    FOR ALL USING (
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
    );

CREATE POLICY "Admins can manage marketplace order items" ON public.marketplace_order_items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
    );

CREATE POLICY "Admins can manage webhook logs" ON public.marketplace_webhook_logs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
    );

CREATE POLICY "Admins can manage marketplace questions" ON public.marketplace_questions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
    );

CREATE POLICY "Admins can manage marketplace messages" ON public.marketplace_messages
    FOR ALL USING (
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
    );

CREATE POLICY "Admins can view metrics cache" ON public.marketplace_metrics_cache
    FOR ALL USING (
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
    );

CREATE POLICY "Admins can view shipment events" ON public.marketplace_shipment_events
    FOR ALL USING (
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
    );

-- Service role bypass policies
CREATE POLICY "Service role can access marketplace orders" ON public.marketplace_orders
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access marketplace order items" ON public.marketplace_order_items
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access webhook logs" ON public.marketplace_webhook_logs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access marketplace questions" ON public.marketplace_questions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access marketplace messages" ON public.marketplace_messages
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access metrics cache" ON public.marketplace_metrics_cache
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access shipment events" ON public.marketplace_shipment_events
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to clean expired metrics cache
CREATE OR REPLACE FUNCTION clean_expired_marketplace_metrics()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.marketplace_metrics_cache
    WHERE expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get unanswered questions count by config
CREATE OR REPLACE FUNCTION get_unanswered_questions_count(p_config_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.marketplace_questions
        WHERE config_id = p_config_id AND status = 'unanswered'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get unread messages count by config
CREATE OR REPLACE FUNCTION get_unread_messages_count(p_config_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.marketplace_messages
        WHERE config_id = p_config_id AND is_read = false AND sender_role = 'buyer'
    );
END;
$$ LANGUAGE plpgsql;
