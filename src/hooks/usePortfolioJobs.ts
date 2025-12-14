import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

export interface PortfolioJob {
  id: string;
  organization_id: string | null;
  user_id: string | null;
  shopflow_order_id: string | null;
  order_number: string | null;
  title: string;
  customer_name: string | null;
  vehicle_year: number | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  tags: string[] | null;
  status: string;
  created_at: string | null;
  // Liability fields
  vin_number: string | null;
  vin_photo_path: string | null;
  customer_acknowledged_at: string | null;
  customer_signature_path: string | null;
  liability_pdf_path: string | null;
  // Showcase fields
  is_public: boolean;
  is_featured: boolean;
}

export interface PortfolioMedia {
  id: string;
  job_id: string;
  storage_path: string;
  file_type: string | null;
  media_type: string | null;
  caption: string | null;
  display_order: number | null;
  created_at: string | null;
  // Liability fields
  condition_notes: string | null;
  location_on_vehicle: string | null;
  photo_timestamp: string | null;
}

export function usePortfolioJobs() {
  const { organizationId } = useOrganization();
  const [jobs, setJobs] = useState<PortfolioJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("portfolio_jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (organizationId) {
        query = query.eq("organization_id", organizationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setJobs((data || []) as PortfolioJob[]);
    } catch (err) {
      console.error("Error fetching portfolio jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [organizationId]);

  const createJob = async (jobData: Partial<PortfolioJob>) => {
    try {
      const insertData = {
        title: jobData.title || "Untitled Job",
        customer_name: jobData.customer_name,
        vehicle_year: jobData.vehicle_year,
        vehicle_make: jobData.vehicle_make,
        vehicle_model: jobData.vehicle_model,
        tags: jobData.tags,
        status: "pending",
      };
      const { data, error } = await supabase
        .from("portfolio_jobs")
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      setJobs((prev) => [data as PortfolioJob, ...prev]);
      toast.success("Portfolio job created");
      return data;
    } catch (err) {
      toast.error("Failed to create job");
      return null;
    }
  };

  const deleteJob = async (id: string) => {
    try {
      const { error } = await supabase.from("portfolio_jobs").delete().eq("id", id);
      if (error) throw error;
      setJobs((prev) => prev.filter((job) => job.id !== id));
      toast.success("Job deleted");
    } catch (err) {
      toast.error("Failed to delete job");
    }
  };

  return { jobs, loading, fetchJobs, createJob, deleteJob };
}

export function usePortfolioMedia(jobId: string | null) {
  const [media, setMedia] = useState<PortfolioMedia[]>([]);
  const [loading, setLoading] = useState(false);

  console.log("[usePortfolioMedia] Hook initialized with jobId:", jobId);

  const fetchMedia = async () => {
    if (!jobId) {
      console.log("[usePortfolioMedia] fetchMedia skipped - no jobId");
      return;
    }
    
    console.log("[usePortfolioMedia] fetchMedia starting for jobId:", jobId);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("portfolio_media")
        .select("*")
        .eq("job_id", jobId)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("[usePortfolioMedia] fetchMedia error:", error);
        throw error;
      }
      console.log("[usePortfolioMedia] fetchMedia success, count:", data?.length);
      setMedia(data || []);
    } catch (err) {
      console.error("Error fetching media:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [jobId]);

  const uploadMedia = async (
    file: File,
    mediaType: "before" | "after" | "process"
  ) => {
    console.log("[usePortfolioMedia] uploadMedia called:", { jobId, fileName: file.name, mediaType });
    
    if (!jobId) {
      console.error("[usePortfolioMedia] uploadMedia failed - no jobId");
      return null;
    }

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${jobId}/${mediaType}_${Date.now()}.${fileExt}`;
      
      console.log("[usePortfolioMedia] Uploading to storage:", fileName);

      const { error: uploadError } = await supabase.storage
        .from("portfolio-media")
        .upload(fileName, file);

      if (uploadError) {
        console.error("[usePortfolioMedia] Storage upload error:", uploadError);
        throw uploadError;
      }
      
      console.log("[usePortfolioMedia] Storage upload success, inserting DB record");

      const { data: insertData, error: insertError } = await supabase
        .from("portfolio_media")
        .insert({
          job_id: jobId,
          storage_path: fileName,
          file_type: file.type.startsWith("video") ? "video" : "image",
          media_type: mediaType,
          display_order: media.length,
        })
        .select()
        .single();

      if (insertError) {
        console.error("[usePortfolioMedia] DB insert error:", insertError);
        throw insertError;
      }

      console.log("[usePortfolioMedia] Upload complete:", insertData);
      setMedia((prev) => [...prev, insertData]);
      toast.success("Media uploaded");
      return insertData;
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload media");
      return null;
    }
  };

  const deleteMedia = async (mediaId: string, storagePath: string) => {
    try {
      await supabase.storage.from("portfolio-media").remove([storagePath]);
      
      const { error } = await supabase
        .from("portfolio_media")
        .delete()
        .eq("id", mediaId);

      if (error) throw error;

      setMedia((prev) => prev.filter((m) => m.id !== mediaId));
      toast.success("Media deleted");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete media");
    }
  };

  const getPublicUrl = (storagePath: string) => {
    const { data } = supabase.storage
      .from("portfolio-media")
      .getPublicUrl(storagePath);
    return data.publicUrl;
  };

  return {
    media,
    loading,
    fetchMedia,
    uploadMedia,
    deleteMedia,
    getPublicUrl,
  };
}
