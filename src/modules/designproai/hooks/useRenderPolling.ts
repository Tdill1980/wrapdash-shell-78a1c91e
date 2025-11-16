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
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-color-render`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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
