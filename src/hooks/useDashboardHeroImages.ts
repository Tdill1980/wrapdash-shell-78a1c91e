import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DashboardHeroImage {
  id: string;
  image_url: string;
  title?: string;
  subtitle?: string;
  time_of_day?: 'morning' | 'afternoon' | 'night' | 'all';
  display_order: number;
  is_active: boolean;
  background_position_desktop?: string;
  background_position_mobile?: string;
  created_at: string;
  updated_at: string;
}

export const useDashboardHeroImages = () => {
  const [images, setImages] = useState<DashboardHeroImage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('dashboard_hero_images')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setImages((data || []) as DashboardHeroImage[]);
    } catch (error) {
      console.error('Error fetching hero images:', error);
      toast({
        title: 'Error',
        description: 'Failed to load hero images',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const uploadImage = async (file: File, metadata: Partial<DashboardHeroImage>) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('dashboard-hero')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('dashboard-hero')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('dashboard_hero_images')
        .insert({
          image_url: publicUrl,
          title: metadata.title,
          subtitle: metadata.subtitle,
          time_of_day: metadata.time_of_day || 'all',
          display_order: metadata.display_order || 0,
          is_active: true,
        });

      if (insertError) throw insertError;

      toast({
        title: 'Success',
        description: 'Hero image uploaded successfully',
      });

      await fetchImages();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
    }
  };

  const deleteImage = async (id: string, imageUrl: string) => {
    try {
      const { error } = await supabase
        .from('dashboard_hero_images')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Extract filename from URL and delete from storage
      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('dashboard-hero')
          .remove([fileName]);
      }

      toast({
        title: 'Success',
        description: 'Hero image deleted successfully',
      });

      await fetchImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete image',
        variant: 'destructive',
      });
    }
  };

  const updateImage = async (id: string, updates: Partial<DashboardHeroImage>) => {
    try {
      const { error } = await supabase
        .from('dashboard_hero_images')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Hero image updated successfully',
      });

      await fetchImages();
    } catch (error) {
      console.error('Error updating image:', error);
      toast({
        title: 'Error',
        description: 'Failed to update image',
        variant: 'destructive',
      });
    }
  };

  return { images, loading, uploadImage, deleteImage, updateImage, refetch: fetchImages };
};
