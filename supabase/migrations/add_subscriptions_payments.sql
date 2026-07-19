-- ============================================
-- SUBSCRIPTIONS & PAYMENTS
-- Business subscription plans and their payment history.
-- ============================================

-- Subscription plans available to businesses (seeded reference data)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'MAD',
  billing_interval TEXT NOT NULL DEFAULT 'month' CHECK (billing_interval IN ('month', 'year')),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A business's active/past subscription to a plan
CREATE TABLE IF NOT EXISTS business_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_info_id UUID REFERENCES business_info(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'expired')),
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_subscriptions_business ON business_subscriptions(business_info_id);
CREATE INDEX IF NOT EXISTS idx_business_subscriptions_status ON business_subscriptions(status);

-- Individual payment records tied to a subscription
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subscription_id UUID REFERENCES business_subscriptions(id) ON DELETE CASCADE,
  business_info_id UUID REFERENCES business_info(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'MAD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_business ON subscription_payments(business_info_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(status);

-- Row Level Security
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Subscription plans viewable by everyone" ON subscription_plans;
CREATE POLICY "Subscription plans viewable by everyone"
  ON subscription_plans FOR SELECT USING (true);

-- Seed default plans
INSERT INTO subscription_plans (name, slug, description, price, currency, billing_interval, display_order) VALUES
  ('Free', 'free', 'Basic listing with limited features', 0, 'MAD', 'month', 1),
  ('Pro', 'pro', 'Full booking suite, team management, and priority listing', 199, 'MAD', 'month', 2),
  ('Business', 'business', 'Everything in Pro plus advanced analytics and support', 499, 'MAD', 'month', 3)
ON CONFLICT (slug) DO NOTHING;
