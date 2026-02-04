import { supabase, lovableFunctions } from "@/integrations/supabase/client";

export interface AffiliateFounder {
  id: string;
  affiliateCode: string;
  fullName: string;
  email: string;
  commissionRate: number;
  avatarUrl?: string;
  bio?: string;
  companyName?: string;
  phone?: string;
  socialLinks?: Record<string, string>;
  isActive?: boolean;
}

export interface AffiliateStats {
  totalReferrals: number;
  totalEarnings: number;
  conversionRate: number;
  cardViews: number;
}

export interface AffiliateCommission {
  id: string;
  customerEmail: string;
  orderNumber: string;
  orderTotal: number;
  commissionAmount: number;
  status: string;
  createdAt: string;
  productName?: string;
}

export const affiliateApi = {
  // Track business card view
  async trackCardView(affiliateCode: string, visitorData: {
    visitorIp?: string;
    visitorCountry?: string;
    referrerUrl?: string;
  }) {
    const { data, error } = await lovableFunctions.functions.invoke('track-affiliate-card-view', {
      body: {
        affiliateCode,
        ...visitorData,
      },
    });

    if (error) throw error;
    return data;
  },

  // Track user signup/referral
  async trackSignup(refCode: string, email: string, orderData?: {
    orderNumber: string;
    orderTotal: number;
    productType: string;
  }) {
    const { data, error } = await lovableFunctions.functions.invoke('track-affiliate-signup', {
      body: {
        refCode,
        email,
        ...orderData,
      },
    });

    if (error) throw error;
    return data;
  },

  // Verify login token and get founder data
  async verifyLogin(token: string): Promise<{ success: boolean; founder?: AffiliateFounder }> {
    const { data, error } = await lovableFunctions.functions.invoke('affiliate-verify-login', {
      body: { token },
    });

    if (error) throw error;
    return data;
  },

  // Request magic link
  async requestMagicLink(email: string) {
    const { data, error } = await lovableFunctions.functions.invoke('affiliate-magic-link', {
      body: { email },
    });

    if (error) throw error;
    return data;
  },

  // Admin: Send access link to founder
  async sendAccessLink(founderEmail: string) {
    const { data: { session } } = await supabase.auth.getSession();
    
    const { data, error } = await lovableFunctions.functions.invoke('send-affiliate-access-link', {
      body: { founderEmail },
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
      },
    });

    if (error) throw error;
    return data;
  },

  // Get founder by affiliate code (public)
  async getFounderByCode(affiliateCode: string): Promise<AffiliateFounder> {
    const { data, error } = await supabase
      .from('affiliate_founders')
      .select('*')
      .eq('affiliate_code', affiliateCode)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    
    // Transform snake_case to camelCase
    return {
      id: data.id,
      affiliateCode: data.affiliate_code,
      fullName: data.full_name,
      email: data.email,
      commissionRate: data.commission_rate,
      avatarUrl: data.avatar_url,
      bio: data.bio,
      companyName: data.company_name,
      phone: data.phone,
      socialLinks: (data.social_links || {}) as Record<string, string>,
      isActive: data.is_active,
    };
  },

  // Get founder stats with product breakdowns
  async getFounderStats(founderId: string): Promise<AffiliateStats & {
    wrapcommandEarned: number;
    designproEarned: number;
    closerEarned: number;
    ieEarned: number;
    wpwEarned: number;
    wrapcommandReferrals: number;
    designproReferrals: number;
    closerReferrals: number;
    ieReferrals: number;
    wpwReferrals: number;
  }> {
    const [referrals, commissions, views] = await Promise.all([
      supabase
        .from('affiliate_referrals')
        .select('*', { count: 'exact' })
        .eq('founder_id', founderId),
      supabase
        .from('affiliate_commissions')
        .select('*')
        .eq('founder_id', founderId),
      supabase
        .from('affiliate_card_views')
        .select('*', { count: 'exact' })
        .eq('founder_id', founderId),
    ]);

    const totalReferrals = referrals.count || 0;
    const totalEarnings = commissions.data?.reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;
    const cardViews = views.count || 0;
    
    // Calculate per-product stats
    const productEarnings = (productName: string) => 
      commissions.data?.filter(c => c.product_name === productName)
        .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;
    
    const productReferrals = (productName: string) => 
      commissions.data?.filter(c => c.product_name === productName).length || 0;
    const conversionRate = cardViews > 0 ? (totalReferrals / cardViews) * 100 : 0;

    return {
      totalReferrals,
      totalEarnings,
      cardViews,
      conversionRate,
      wrapcommandEarned: productEarnings('WrapCommand AI'),
      designproEarned: productEarnings('DesignProAI'),
      closerEarned: productEarnings('The Closer by DesignProAI'),
      ieEarned: productEarnings('Ink & Edge Magazine'),
      wpwEarned: productEarnings('WePrintWraps.com'),
      wrapcommandReferrals: productReferrals('WrapCommand AI'),
      designproReferrals: productReferrals('DesignProAI'),
      closerReferrals: productReferrals('The Closer by DesignProAI'),
      ieReferrals: productReferrals('Ink & Edge Magazine'),
      wpwReferrals: productReferrals('WePrintWraps.com'),
    };
  },

  // Get founder commissions
  async getFounderCommissions(founderId: string): Promise<AffiliateCommission[]> {
    const { data, error } = await supabase
      .from('affiliate_commissions')
      .select('*')
      .eq('founder_id', founderId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(c => ({
      id: c.id,
      customerEmail: c.customer_email,
      orderNumber: c.order_number,
      orderTotal: Number(c.order_total),
      commissionAmount: Number(c.commission_amount),
      status: c.status || 'pending',
      createdAt: c.created_at || '',
    }));
  },

  // Update founder profile
  async updateFounder(founderId: string, updates: Partial<{
    fullName: string;
    bio: string;
    companyName: string;
    phone: string;
    avatarUrl: string;
    socialLinks: Record<string, string>;
  }>) {
    const { data, error } = await supabase
      .from('affiliate_founders')
      .update({
        full_name: updates.fullName,
        bio: updates.bio,
        company_name: updates.companyName,
        phone: updates.phone,
        avatar_url: updates.avatarUrl,
        social_links: updates.socialLinks,
      })
      .eq('id', founderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Admin: Get all founders
  async getAllFounders(): Promise<AffiliateFounder[]> {
    const { data, error } = await supabase
      .from('affiliate_founders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(f => ({
      id: f.id,
      affiliateCode: f.affiliate_code,
      fullName: f.full_name,
      email: f.email,
      commissionRate: f.commission_rate,
      avatarUrl: f.avatar_url,
      bio: f.bio,
      companyName: f.company_name,
      phone: f.phone,
      socialLinks: (f.social_links || {}) as Record<string, string>,
      isActive: f.is_active,
    }));
  },

  // Admin: Create founder
  async createFounder(founderData: {
    email: string;
    fullName: string;
    affiliateCode: string;
    commissionRate?: number;
  }) {
    const { data, error } = await supabase
      .from('affiliate_founders')
      .insert({
        email: founderData.email,
        full_name: founderData.fullName,
        affiliate_code: founderData.affiliateCode,
        commission_rate: founderData.commissionRate || 10,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Admin: Update founder commission rate
  async updateCommissionRate(founderId: string, commissionRate: number) {
    const { data, error } = await supabase
      .from('affiliate_founders')
      .update({ commission_rate: commissionRate })
      .eq('id', founderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get founder by email
  async getFounderByEmail(email: string): Promise<AffiliateFounder | null> {
    const { data, error } = await supabase
      .from('affiliate_founders')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    
    return {
      id: data.id,
      affiliateCode: data.affiliate_code,
      fullName: data.full_name,
      email: data.email,
      commissionRate: data.commission_rate,
      avatarUrl: data.avatar_url,
      bio: data.bio,
      companyName: data.company_name,
      phone: data.phone,
      socialLinks: (data.social_links || {}) as Record<string, string>,
      isActive: data.is_active,
    };
  },

  // Get founder by ID
  async getFounderById(id: string): Promise<AffiliateFounder> {
    const { data, error } = await supabase
      .from('affiliate_founders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return {
      id: data.id,
      affiliateCode: data.affiliate_code,
      fullName: data.full_name,
      email: data.email,
      commissionRate: data.commission_rate,
      avatarUrl: data.avatar_url,
      bio: data.bio,
      companyName: data.company_name,
      phone: data.phone,
      socialLinks: (data.social_links || {}) as Record<string, string>,
      isActive: data.is_active,
    };
  },

  // Admin: Toggle founder active status
  async toggleFounderStatus(founderId: string, currentStatus: boolean) {
    const { data, error } = await supabase
      .from('affiliate_founders')
      .update({ is_active: !currentStatus })
      .eq('id', founderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Admin: Get all commissions across all founders
  async getAllCommissions() {
    const { data, error } = await supabase
      .from('affiliate_commissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};