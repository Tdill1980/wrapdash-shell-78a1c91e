import { useState, useEffect, useCallback } from "react";

interface RenderJob {
  angle: string;
  status: "pending" | "generating" | "complete" | "error";
  imageUrl?: string;
  error?: string;
}

export const useRenderPolling = () => {
  const [jobs, setJobs] = useState<Map<string, RenderJob>>(new Map());
  const [isPolling, setIsPolling] = useState(false);

  const addJob = useCallback((angle: string) => {
    setJobs(prev => {
      const newJobs = new Map(prev);
      newJobs.set(angle, { angle, status: "pending" });
      return newJobs;
    });
  }, []);

  const updateJob = useCallback((angle: string, updates: Partial<RenderJob>) => {
    setJobs(prev => {
      const newJobs = new Map(prev);
      const existing = newJobs.get(angle);
      if (existing) {
        newJobs.set(angle, { ...existing, ...updates });
      }
      return newJobs;
    });
  }, []);

  const clearJobs = useCallback(() => {
    setJobs(new Map());
    setIsPolling(false);
  }, []);

  const startJob = useCallback(async (
    angle: string,
    renderParams: {
      vehicleMake: string;
      vehicleModel: string;
      vehicleYear?: number;
      vehicleType: string;
      colorHex: string;
      colorName?: string;
      finishType: string;
      hasMetallicFlakes: boolean;
      customDesignUrl?: string;
    }
  ) => {
    updateJob(angle, { status: "generating" });

    try {
      const lovableFunctionsUrl = import.meta.env.VITE_LOVABLE_FUNCTIONS_URL || 'https://wzwqhfbmymrengjqikjl.supabase.co/functions/v1';
      const lovableAnonKey = import.meta.env.VITE_LOVABLE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6d3FoZmJteW1yZW5nanFpa2psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNDM3OTgsImV4cCI6MjA3ODgxOTc5OH0.-LtBxqJ7gNmImakDRGQyr1e7FXrJCQQXF5zE5Fre_1I';

      const response = await fetch(
        `${lovableFunctionsUrl}/generate-color-render`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${lovableAnonKey}`,
          },
          body: JSON.stringify({ ...renderParams, angle }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate render");
      }

      const data = await response.json();
      updateJob(angle, { status: "complete", imageUrl: data.imageUrl });
      return data.imageUrl;
    } catch (error) {
      console.error(`Error generating ${angle} render:`, error);
      updateJob(angle, {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }, [updateJob]);

  const getJobStatus = useCallback((angle: string) => {
    return jobs.get(angle);
  }, [jobs]);

  const getAllJobs = useCallback(() => {
    return Array.from(jobs.values());
  }, [jobs]);

  return {
    jobs: getAllJobs(),
    addJob,
    updateJob,
    startJob,
    getJobStatus,
    clearJobs,
    isPolling,
  };
};
