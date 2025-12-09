import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface AffiliateMedia {
  id: string;
  affiliate_id: string;
  organization_id?: string;
  brand: string;
  url: string;
  storage_path: string;
  type: 'raw' | 'finished' | 'photo';
  tags: string[];
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  notes?: string;
  reviewer_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export function useAffiliateMedia(affiliateId?: string) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  // Fetch affiliate's own media
  const { data: media, isLoading, error } = useQuery({
    queryKey: ['affiliate-media', affiliateId],
    queryFn: async () => {
      let query = supabase
        .from('affiliate_media')
        .select('*')
        .order('created_at', { ascending: false });

      if (affiliateId) {
        query = query.eq('affiliate_id', affiliateId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AffiliateMedia[];
    },
    enabled: true,
  });

  // Upload file to storage
  const uploadFile = async (
    file: File,
    affiliateId: string,
    type: 'raw' | 'finished' | 'photo'
  ): Promise<{ url: string; path: string }> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${affiliateId}/${type}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('affiliate-media')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('affiliate-media')
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl, path: filePath };
  };

  // Create media record
  const createMedia = useMutation({
    mutationFn: async (data: {
      affiliateId: string;
      brand: string;
      file: File;
      type: 'raw' | 'finished' | 'photo';
      tags: string[];
      notes?: string;
    }) => {
      setUploading(true);
      try {
        // Upload file first
        const { url, path } = await uploadFile(data.file, data.affiliateId, data.type);

        // Create database record
        const { data: record, error } = await supabase
          .from('affiliate_media')
          .insert({
            affiliate_id: data.affiliateId,
            brand: data.brand,
            url,
            storage_path: path,
            type: data.type,
            tags: data.tags,
            notes: data.notes,
            status: 'pending',
          })
          .select()
          .single();

        if (error) throw error;
        return record;
      } finally {
        setUploading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-media'] });
      toast.success('Content uploaded successfully!');
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error('Failed to upload content');
    },
  });

  // Update media status (for review)
  const updateStatus = useMutation({
    mutationFn: async (data: {
      id: string;
      status: 'approved' | 'rejected' | 'revision_requested';
      reviewerNotes?: string;
    }) => {
      const { data: record, error } = await supabase
        .from('affiliate_media')
        .update({
          status: data.status,
          reviewer_notes: data.reviewerNotes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return record;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-media'] });
      toast.success('Status updated');
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error('Failed to update status');
    },
  });

  return {
    media,
    isLoading,
    error,
    uploading,
    createMedia,
    updateStatus,
  };
}
