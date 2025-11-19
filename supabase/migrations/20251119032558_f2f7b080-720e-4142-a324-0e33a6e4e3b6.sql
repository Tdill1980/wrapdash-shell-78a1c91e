-- Create affiliate_founders table
CREATE TABLE public.affiliate_founders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  company_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  commission_rate NUMERIC DEFAULT 10.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create affiliate_commissions table
CREATE TABLE public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID REFERENCES public.affiliate_founders(id) ON DELETE CASCADE NOT NULL,
  order_number TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  commission_amount NUMERIC NOT NULL,
  order_total NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create affiliate_card_views table
CREATE TABLE public.affiliate_card_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID REFERENCES public.affiliate_founders(id) ON DELETE CASCADE NOT NULL,
  viewer_ip TEXT,
  viewer_country TEXT,
  referrer_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create affiliate_referrals table
CREATE TABLE public.affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID REFERENCES public.affiliate_founders(id) ON DELETE CASCADE NOT NULL,
  referred_email TEXT NOT NULL,
  converted BOOLEAN DEFAULT false,
  conversion_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create affiliate_login_tokens table
CREATE TABLE public.affiliate_login_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID REFERENCES public.affiliate_founders(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create affiliate_signup_tokens table
CREATE TABLE public.affiliate_signup_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ref_code TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create affiliate_settings table
CREATE TABLE public.affiliate_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_affiliate_founders_code ON public.affiliate_founders(affiliate_code);
CREATE INDEX idx_affiliate_founders_email ON public.affiliate_founders(email);
CREATE INDEX idx_affiliate_commissions_founder ON public.affiliate_commissions(founder_id);
CREATE INDEX idx_affiliate_card_views_founder ON public.affiliate_card_views(founder_id);
CREATE INDEX idx_affiliate_referrals_founder ON public.affiliate_referrals(founder_id);
CREATE INDEX idx_affiliate_login_tokens_token ON public.affiliate_login_tokens(token);
CREATE INDEX idx_affiliate_signup_tokens_token ON public.affiliate_signup_tokens(token);

-- Enable RLS on all tables
ALTER TABLE public.affiliate_founders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_card_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_login_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_signup_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for affiliate_founders
CREATE POLICY "Anyone can view active founders"
  ON public.affiliate_founders
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Founders can update their own profile"
  ON public.affiliate_founders
  FOR UPDATE
  USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can insert founders"
  ON public.affiliate_founders
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any founder"
  ON public.affiliate_founders
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for affiliate_commissions
CREATE POLICY "Founders can view their own commissions"
  ON public.affiliate_commissions
  FOR SELECT
  USING (founder_id IN (SELECT id FROM public.affiliate_founders WHERE auth.uid()::text = id::text));

CREATE POLICY "Admins can view all commissions"
  ON public.affiliate_commissions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert commissions"
  ON public.affiliate_commissions
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update commissions"
  ON public.affiliate_commissions
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for affiliate_card_views
CREATE POLICY "Anyone can insert card views"
  ON public.affiliate_card_views
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Founders can view their own card views"
  ON public.affiliate_card_views
  FOR SELECT
  USING (founder_id IN (SELECT id FROM public.affiliate_founders WHERE auth.uid()::text = id::text));

CREATE POLICY "Admins can view all card views"
  ON public.affiliate_card_views
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for affiliate_referrals
CREATE POLICY "Anyone can insert referrals"
  ON public.affiliate_referrals
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Founders can view their own referrals"
  ON public.affiliate_referrals
  FOR SELECT
  USING (founder_id IN (SELECT id FROM public.affiliate_founders WHERE auth.uid()::text = id::text));

CREATE POLICY "Admins can view all referrals"
  ON public.affiliate_referrals
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can update referrals"
  ON public.affiliate_referrals
  FOR UPDATE
  USING (true);

-- RLS Policies for affiliate_login_tokens
CREATE POLICY "Anyone can view valid tokens"
  ON public.affiliate_login_tokens
  FOR SELECT
  USING (used = false AND expires_at > now());

CREATE POLICY "System can insert login tokens"
  ON public.affiliate_login_tokens
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update login tokens"
  ON public.affiliate_login_tokens
  FOR UPDATE
  USING (true);

-- RLS Policies for affiliate_signup_tokens
CREATE POLICY "Anyone can view valid signup tokens"
  ON public.affiliate_signup_tokens
  FOR SELECT
  USING (used = false AND expires_at > now());

CREATE POLICY "System can insert signup tokens"
  ON public.affiliate_signup_tokens
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update signup tokens"
  ON public.affiliate_signup_tokens
  FOR UPDATE
  USING (true);

-- RLS Policies for affiliate_settings
CREATE POLICY "Anyone can view settings"
  ON public.affiliate_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage settings"
  ON public.affiliate_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));