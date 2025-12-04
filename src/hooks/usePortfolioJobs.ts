import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PortfolioMedia {
  id: string;
  job_id: string;
  storage_path: string;
  file_type: string;
  media_type: 'before' | 'after' | 'process';
  display_order: number;
  caption: string | null;
  created_at: string;
}

export interface PortfolioJob {
  id: string;
  user_id: string | null;
  organization_id: string | null;
  shopflow_order_id: string | null;
  order_number: string | null;
  title: string;
  customer_name: string | null;
  vehicle_year: number | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  finish: string | null;
  job_price: number;
  tags: string[] | null;
  upload_token: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  portfolio_media?: PortfolioMedia[];
}

export const usePortfolioJobs = () => {
  const [jobs, setJobs] = useState<PortfolioJob[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('portfolio_jobs')
        .select('*, portfolio_media (*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs((data as PortfolioJob[]) || []);
    } catch (error: any) {
      console.error('Error fetching portfolio jobs:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createJob = async (jobData: Partial<PortfolioJob> & { title: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('portfolio_jobs')
        .insert([{
          title: jobData.title,
          vehicle_year: jobData.vehicle_year || null,
          vehicle_make: jobData.vehicle_make || null,
          vehicle_model: jobData.vehicle_model || null,
          finish: jobData.finish || null,
          job_price: jobData.job_price || 0,
          tags: jobData.tags || [],
          user_id: user?.id || null
        }]);

      if (error) throw error;
      
      toast({ title: "Job added successfully" });
      await fetchJobs();
    } catch (error: any) {
      console.error('Error creating job:', error);
      toast({
        title: "Error creating job",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateJob = async (jobId: string, updates: Partial<PortfolioJob>) => {
    try {
      const { error } = await supabase
        .from('portfolio_jobs')
        .update(updates)
        .eq('id', jobId);

      if (error) throw error;
      
      toast({ title: "Job updated" });
      await fetchJobs();
    } catch (error: any) {
      console.error('Error updating job:', error);
      toast({
        title: "Error updating job",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('portfolio_jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;
      
      toast({ title: "Job deleted" });
      await fetchJobs();
    } catch (error: any) {
      console.error('Error deleting job:', error);
      toast({
        title: "Error deleting job",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getJobByToken = async (token: string): Promise<PortfolioJob | null> => {
    try {
      const { data, error } = await supabase
        .from('portfolio_jobs')
        .select('*, portfolio_media (*)')
        .eq('upload_token', token)
        .single();

      if (error) throw error;
      return data as PortfolioJob;
    } catch (error: any) {
      console.error('Error fetching job by token:', error);
      return null;
    }
  };

  const uploadMedia = async (jobId: string, file: File, mediaType: 'before' | 'after' | 'process') => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${jobId}/${mediaType}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('portfolio-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('portfolio-media')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('portfolio_media')
        .insert([{
          job_id: jobId,
          storage_path: publicUrl,
          file_type: file.type.startsWith('video') ? 'video' : 'image',
          media_type: mediaType
        }]);

      if (dbError) throw dbError;

      toast({ title: `${mediaType} photo uploaded` });
      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading media:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchJobs();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('portfolio_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolio_jobs' }, () => {
        fetchJobs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    jobs,
    loading,
    refresh: fetchJobs,
    createJob,
    updateJob,
    deleteJob,
    getJobByToken,
    uploadMedia
  };
};
