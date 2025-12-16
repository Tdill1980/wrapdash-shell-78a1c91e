import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface InspoFile {
  id: string;
  file_url: string;
  thumbnail_url: string | null;
  file_type: string;
  original_filename: string | null;
  tags: string[];
  created_at: string;
  duration_seconds: number | null;
  content_category: string | null;
}

export function useInspoLibrary() {
  const queryClient = useQueryClient();

  // Fetch all uploaded inspo content from content_files
  const { data: library, isLoading } = useQuery({
    queryKey: ["inspo-library"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_files")
        .select("id, file_url, thumbnail_url, file_type, original_filename, tags, created_at, duration_seconds, content_category")
        .in("file_type", ["image", "video"])
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as InspoFile[];
    },
  });

  // Upload file to storage and create record, then auto-analyze for style extraction
  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get organization ID
      let organizationId: string | null = null;
      if (user) {
        const { data: orgMember } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", user.id)
          .single();
        organizationId = orgMember?.organization_id || null;
      }

      // Determine file type
      const isVideo = file.type.startsWith("video/");
      const fileType = isVideo ? "video" : "image";
      
      // Upload to storage
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const storagePath = `inspo/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from("media-library")
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("media-library")
        .getPublicUrl(storagePath);

      // Insert record into content_files with proper tags for template recognition
      const { data, error } = await supabase
        .from("content_files")
        .insert({
          organization_id: organizationId,
          file_url: urlData.publicUrl,
          file_type: fileType,
          original_filename: file.name,
          source: "inspo_upload",
          content_category: "inspo_reference",
          tags: ["inspo", "reference", "template", fileType],
        })
        .select()
        .single();

      if (error) throw error;

      // AUTO-ANALYZE: If it's an image, automatically trigger style extraction
      // This updates the organization_style_profiles table with extracted style
      if (fileType === "image" && organizationId) {
        console.log("[useInspoLibrary] Auto-analyzing uploaded template for style extraction");
        
        // Fire and forget - don't block upload completion
        supabase.functions.invoke("analyze-inspo-image", {
          body: { 
            imageUrl: urlData.publicUrl, 
            organizationId, 
            contentFileId: data.id 
          },
        }).then(({ data: analysisData, error: analysisError }) => {
          if (analysisError) {
            console.error("[useInspoLibrary] Auto-analysis failed:", analysisError);
          } else {
            console.log("[useInspoLibrary] Style extracted:", analysisData?.analysis?.styleName);
            toast.success("Style extracted from your template!", {
              description: `${analysisData?.analysis?.styleName || "Template style"} will be used for video rendering`,
            });
          }
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspo-library"] });
      toast.success("File uploaded! Extracting style...");
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    },
  });

  // Delete file
  const deleteFile = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("content_files")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspo-library"] });
      toast.success("File deleted");
    },
  });

  return {
    library: library || [],
    isLoading,
    uploadFile: uploadFile.mutateAsync,
    isUploading: uploadFile.isPending,
    deleteFile: deleteFile.mutate,
  };
}
