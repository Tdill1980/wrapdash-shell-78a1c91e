import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface TradeDNAProfile {
  tone?: {
    primary?: string;
    energy_level?: string;
    formality?: string;
  };
  persona?: string;
  brand_values?: string[];
  vocabulary?: {
    signature_phrases?: string[];
    common_words?: string[];
    words_to_avoid?: string[];
  };
  sentence_style?: {
    length?: string;
    cadence?: string;
    complexity?: string;
    examples?: string[];
  };
  sales_style?: {
    approach?: string;
    pressure?: string;
    confidence?: string;
    cta_style?: string;
    closing_flavor?: string;
  };
  customer_profile?: {
    demographics?: string;
    pain_points?: string[];
    desires?: string[];
    emotional_triggers?: string[];
  };
  communication_rules?: {
    email?: { greeting?: string; sign_off?: string; max_length?: number };
    dm?: { response_time_promise?: string; emoji_usage?: string; casual_level?: string };
    quote?: { opening?: string; closing?: string };
    approveflow?: { proof_intro?: string; revision_response?: string };
  };
  do_not_do?: string[];
  brand_voice_summary?: string;
}

export interface TradeDNAData {
  id?: string;
  organization_id?: string;
  business_name?: string;
  website_url?: string;
  instagram_handle?: string;
  facebook_page?: string;
  youtube_channel?: string;
  tiktok_handle?: string;
  tagline?: string;
  business_category?: string;
  scraped_content?: Record<string, any>;
  tradedna_profile?: TradeDNAProfile;
  created_at?: string;
  updated_at?: string;
  last_analyzed_at?: string;
  version?: number;
}

export const useTradeDNA = () => {
  const { toast } = useToast();
  const { organizationId, organizationSettings } = useOrganization();
  const [tradeDNA, setTradeDNA] = useState<TradeDNAData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (organizationId) {
      fetchTradeDNA();
    }
  }, [organizationId]);

  const fetchTradeDNA = async () => {
    if (!organizationId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('organization_tradedna')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setTradeDNA({
          ...data,
          scraped_content: data.scraped_content as Record<string, any>,
          tradedna_profile: data.tradedna_profile as TradeDNAProfile
        });
      }
    } catch (error: any) {
      console.error('Error fetching TradeDNA:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTradeDNA = async (data: Partial<TradeDNAData>) => {
    if (!organizationId) {
      toast({ variant: 'destructive', title: 'No organization', description: 'Please select an organization first' });
      return null;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...data,
        organization_id: organizationId,
        updated_at: new Date().toISOString(),
        // Cast nested objects to JSON-compatible format
        scraped_content: data.scraped_content as any,
        tradedna_profile: data.tradedna_profile as any
      };

      if (tradeDNA?.id) {
        const { data: updated, error } = await supabase
          .from('organization_tradedna')
          .update(payload)
          .eq('id', tradeDNA.id)
          .select()
          .single();

        if (error) throw error;
        
        setTradeDNA({
          ...updated,
          scraped_content: updated.scraped_content as Record<string, any>,
          tradedna_profile: updated.tradedna_profile as TradeDNAProfile
        });
        toast({ title: 'TradeDNA saved', description: 'Your brand voice profile has been updated' });
        return updated;
      } else {
        const { data: created, error } = await supabase
          .from('organization_tradedna')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        
        setTradeDNA({
          ...created,
          scraped_content: created.scraped_content as Record<string, any>,
          tradedna_profile: created.tradedna_profile as TradeDNAProfile
        });
        toast({ title: 'TradeDNA created', description: 'Your brand voice profile has been saved' });
        return created;
      }
    } catch (error: any) {
      console.error('Error saving TradeDNA:', error);
      toast({ variant: 'destructive', title: 'Save failed', description: error.message });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const analyzeBrandVoice = async (content: { 
    website_text?: string; 
    instagram_captions?: string; 
    sample_emails?: string;
    additional_content?: string;
  }) => {
    if (!organizationId) {
      toast({ variant: 'destructive', title: 'No organization', description: 'Please select an organization first' });
      return null;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-brand-voice', {
        body: {
          organization_id: organizationId,
          business_name: tradeDNA?.business_name || organizationSettings.name,
          content
        }
      });

      if (error) throw error;

      if (data?.tradedna_profile) {
        const updated = await saveTradeDNA({
          scraped_content: content,
          tradedna_profile: data.tradedna_profile,
          last_analyzed_at: new Date().toISOString(),
          version: (tradeDNA?.version || 0) + 1
        });
        
        toast({ title: 'Analysis complete', description: 'Your TradeDNA profile has been generated' });
        return updated;
      }

      return data;
    } catch (error: any) {
      console.error('Error analyzing brand voice:', error);
      toast({ variant: 'destructive', title: 'Analysis failed', description: error.message });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportTradeDNA = () => {
    if (!tradeDNA?.tradedna_profile) {
      toast({ variant: 'destructive', title: 'No profile', description: 'No TradeDNA profile to export' });
      return;
    }

    const exportData = {
      business_name: tradeDNA.business_name,
      exported_at: new Date().toISOString(),
      version: tradeDNA.version,
      tradedna_profile: tradeDNA.tradedna_profile
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tradedna-${tradeDNA.business_name?.toLowerCase().replace(/\s+/g, '-') || 'profile'}-v${tradeDNA.version || 1}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: 'Exported', description: 'TradeDNA profile downloaded' });
  };

  return {
    tradeDNA,
    isLoading,
    isSaving,
    isAnalyzing,
    fetchTradeDNA,
    saveTradeDNA,
    analyzeBrandVoice,
    exportTradeDNA
  };
};
