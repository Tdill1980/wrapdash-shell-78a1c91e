import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VehicleDimensions {
  id: string;
  make: string;
  model: string;
  year_start: number;
  year_end: number;
  side_width: number | null;
  side_height: number | null;
  side_sqft: number | null;
  back_width: number | null;
  back_height: number | null;
  back_sqft: number | null;
  hood_width: number | null;
  hood_length: number | null;
  hood_sqft: number | null;
  roof_width: number | null;
  roof_length: number | null;
  roof_sqft: number | null;
  total_sqft: number | null;
  corrected_sqft: number;
}

export interface VehicleSQFTOptions {
  withRoof: number;
  withoutRoof: number;
  roofOnly: number;
  panels: {
    sides: number;
    back: number;
    hood: number;
    roof: number;
  };
}

export function useVehicleDimensions() {
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all unique makes on mount
  useEffect(() => {
    async function fetchMakes() {
      setLoading(true);
      const { data, error } = await supabase
        .from("vehicle_dimensions")
        .select("make")
        .order("make", { ascending: true });

      if (error) {
        console.error("Error fetching makes:", error);
        setLoading(false);
        return;
      }

      const uniqueMakes = [...new Set(data?.map((d) => d.make) || [])];
      setMakes(uniqueMakes);
      setLoading(false);
    }
    fetchMakes();
  }, []);

  // Fetch models for a given make
  const fetchModels = useCallback(async (make: string) => {
    if (!make) {
      setModels([]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("vehicle_dimensions")
      .select("model")
      .eq("make", make)
      .order("model", { ascending: true });

    if (error) {
      console.error("Error fetching models:", error);
      setLoading(false);
      return;
    }

    const uniqueModels = [...new Set(data?.map((d) => d.model) || [])];
    setModels(uniqueModels);
    setLoading(false);
  }, []);

  // Fetch years for a given make/model, expanding year ranges
  const fetchYears = useCallback(async (make: string, model: string) => {
    if (!make || !model) {
      setYears([]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("vehicle_dimensions")
      .select("year_start, year_end")
      .eq("make", make)
      .eq("model", model);

    if (error) {
      console.error("Error fetching years:", error);
      setLoading(false);
      return;
    }

    // Expand year ranges into individual years
    const yearSet = new Set<number>();
    data?.forEach((row) => {
      for (let y = row.year_start; y <= row.year_end; y++) {
        yearSet.add(y);
      }
    });

    const sortedYears = Array.from(yearSet).sort((a, b) => b - a); // Descending
    setYears(sortedYears);
    setLoading(false);
  }, []);

  // Look up SQFT options for a specific vehicle
  const getSQFTOptions = useCallback(async (
    make: string,
    model: string,
    year: number
  ): Promise<VehicleSQFTOptions | null> => {
    if (!make || !model || !year) return null;

    const { data, error } = await supabase
      .from("vehicle_dimensions")
      .select("*")
      .eq("make", make)
      .eq("model", model)
      .lte("year_start", year)
      .gte("year_end", year)
      .maybeSingle();

    if (error || !data) {
      console.log("Vehicle not found in database:", { make, model, year });
      return null;
    }

    const dims = data as VehicleDimensions;
    
    // Calculate SQFT options from panel data
    const sideSqft = dims.side_sqft || 0;
    const backSqft = dims.back_sqft || 0;
    const hoodSqft = dims.hood_sqft || 0;
    const roofSqft = dims.roof_sqft || 0;

    const withoutRoof = sideSqft + backSqft + hoodSqft;
    const withRoof = withoutRoof + roofSqft;

    return {
      withRoof: Math.round(withRoof * 10) / 10,
      withoutRoof: Math.round(withoutRoof * 10) / 10,
      roofOnly: Math.round(roofSqft * 10) / 10,
      panels: {
        sides: Math.round(sideSqft * 10) / 10,
        back: Math.round(backSqft * 10) / 10,
        hood: Math.round(hoodSqft * 10) / 10,
        roof: Math.round(roofSqft * 10) / 10,
      },
    };
  }, []);

  // Get the corrected SQFT for quoting
  const getCorrectedSQFT = useCallback(async (
    make: string,
    model: string,
    year: number
  ): Promise<number | null> => {
    if (!make || !model || !year) return null;

    const { data, error } = await supabase
      .from("vehicle_dimensions")
      .select("corrected_sqft")
      .eq("make", make)
      .eq("model", model)
      .lte("year_start", year)
      .gte("year_end", year)
      .maybeSingle();

    if (error || !data) return null;
    return data.corrected_sqft;
  }, []);

  return {
    makes,
    models,
    years,
    loading,
    fetchModels,
    fetchYears,
    getSQFTOptions,
    getCorrectedSQFT,
  };
}
