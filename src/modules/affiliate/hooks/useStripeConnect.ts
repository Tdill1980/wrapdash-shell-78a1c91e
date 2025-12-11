import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StripeStatus {
  connected: boolean;
  onboardingComplete: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
}

interface StripeBalance {
  available: number;
  pending: number;
  total: number;
}

export const useStripeConnect = (founderId: string | undefined) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<StripeStatus | null>(null);
  const [balance, setBalance] = useState<StripeBalance | null>(null);

  const createAccount = useCallback(async () => {
    if (!founderId) return null;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('affiliate-stripe-connect', {
        body: { action: 'create_account', founderId }
      });
      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error creating Stripe account:', err);
      toast.error('Failed to create Stripe account');
      return null;
    } finally {
      setLoading(false);
    }
  }, [founderId]);

  const getOnboardingLink = useCallback(async (returnUrl?: string) => {
    if (!founderId) return null;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('affiliate-stripe-connect', {
        body: { action: 'get_onboarding_link', founderId, returnUrl }
      });
      if (error) throw error;
      return data?.url;
    } catch (err: any) {
      console.error('Error getting onboarding link:', err);
      toast.error('Failed to get Stripe onboarding link');
      return null;
    } finally {
      setLoading(false);
    }
  }, [founderId]);

  const checkStatus = useCallback(async () => {
    if (!founderId) return null;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('affiliate-stripe-connect', {
        body: { action: 'check_status', founderId }
      });
      if (error) throw error;
      setStatus(data);
      return data;
    } catch (err: any) {
      console.error('Error checking Stripe status:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [founderId]);

  const getBalance = useCallback(async () => {
    if (!founderId) return null;
    try {
      const { data, error } = await supabase.functions.invoke('affiliate-stripe-connect', {
        body: { action: 'get_balance', founderId }
      });
      if (error) throw error;
      setBalance(data);
      return data;
    } catch (err: any) {
      console.error('Error getting balance:', err);
      return null;
    }
  }, [founderId]);

  const startOnboarding = useCallback(async () => {
    if (!founderId) return;
    setLoading(true);
    try {
      // First create account if needed
      await createAccount();
      // Then get onboarding link
      const url = await getOnboardingLink();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error('Error starting onboarding:', err);
      toast.error('Failed to start Stripe onboarding');
    } finally {
      setLoading(false);
    }
  }, [founderId, createAccount, getOnboardingLink]);

  return {
    loading,
    status,
    balance,
    createAccount,
    getOnboardingLink,
    checkStatus,
    getBalance,
    startOnboarding,
  };
};
