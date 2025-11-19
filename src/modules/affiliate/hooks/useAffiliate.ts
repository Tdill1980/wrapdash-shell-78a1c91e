import { useState, useEffect } from 'react';
import { affiliateApi, AffiliateFounder } from '../services/affiliateApi';
import { useToast } from '@/hooks/use-toast';

export const useAffiliate = (token?: string) => {
  const [founder, setFounder] = useState<AffiliateFounder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const verifyToken = async (token: string) => {
    try {
      setLoading(true);
      const result = await affiliateApi.verifyLogin(token);
      if (result.success && result.founder) {
        setFounder(result.founder);
        // Store founder data in session
        sessionStorage.setItem('affiliate_founder', JSON.stringify(result.founder));
      } else {
        setError('Invalid or expired token');
        toast({
          title: 'Authentication Failed',
          description: 'Your login link has expired or is invalid.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Token verification error:', err);
      setError('Failed to verify token');
      toast({
        title: 'Error',
        description: 'Failed to verify your login token.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const requestLogin = async (email: string) => {
    try {
      await affiliateApi.requestMagicLink(email);
      toast({
        title: 'Check Your Email',
        description: 'If an account exists, a login link has been sent.',
      });
    } catch (err) {
      console.error('Request login error:', err);
      toast({
        title: 'Error',
        description: 'Failed to send login link.',
        variant: 'destructive',
      });
    }
  };

  const updateProfile = async (updates: Partial<{
    fullName: string;
    bio: string;
    companyName: string;
    phone: string;
    avatarUrl: string;
    socialLinks: Record<string, string>;
  }>) => {
    if (!founder) return;

    try {
      const updated = await affiliateApi.updateFounder(founder.id, updates);
      setFounder({ ...founder, ...updated });
      sessionStorage.setItem('affiliate_founder', JSON.stringify({ ...founder, ...updated }));
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (err) {
      console.error('Update profile error:', err);
      toast({
        title: 'Error',
        description: 'Failed to update profile.',
        variant: 'destructive',
      });
    }
  };

  const logout = () => {
    setFounder(null);
    sessionStorage.removeItem('affiliate_founder');
  };

  return {
    founder,
    loading,
    error,
    requestLogin,
    updateProfile,
    logout,
  };
};