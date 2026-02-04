import { useState, useEffect, useCallback } from "react";

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

// Get Supabase URL and key from environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qxllysilzonrlyoaomce.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function useVehicleDimensions() {
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all unique makes on mount via edge function
  useEffect(() => {
    async function fetchMakes() {
      setLoading(true);
      try {
        // Use current year to get makes (most vehicles will cover current year)
        const currentYear = new Date().getFullYear();
        const response = await fetch(
          `${supabaseUrl}/functions/v1/vehicle-list?type=makes&year=${currentYear}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch makes');
        }

        const data = await response.json();
        setMakes(data.makes || []);
      } catch (error) {
        console.error("Error fetching makes:", error);
        setMakes([]);
      } finally {
        setLoading(false);
      }
    }
    fetchMakes();
  }, []);

  // Fetch models for a given make via edge function
  const fetchModels = useCallback(async (make: string) => {
    if (!make) {
      setModels([]);
      return;
    }

    setLoading(true);
    try {
      const currentYear = new Date().getFullYear();
      const response = await fetch(
        `${supabaseUrl}/functions/v1/vehicle-list?type=models&year=${currentYear}&make=${encodeURIComponent(make)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      const data = await response.json();
      setModels(data.models || []);
    } catch (error) {
      console.error("Error fetching models:", error);
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch years for a given make/model via edge function
  const fetchYears = useCallback(async (make: string, model: string) => {
    if (!make || !model) {
      setYears([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/vehicle-list?type=years&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch years');
      }

      const data = await response.json();
      setYears(data.years || []);
    } catch (error) {
      console.error("Error fetching years:", error);
      setYears([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Look up SQFT options for a specific vehicle via edge function
  const getSQFTOptions = useCallback(async (
    make: string,
    model: string,
    year: number
  ): Promise<VehicleSQFTOptions | null> => {
    if (!make || !model || !year) return null;

    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/vehicle-sqft`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
          },
          body: JSON.stringify({ year, make, model }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch SQFT');
      }

      const data = await response.json();

      if (!data.sqft || data.needs_review) {
        console.log("Vehicle not found in database:", { make, model, year });
        return null;
      }

      // Calculate SQFT options from panel data
      const panels = data.panels || { sides: 0, back: 0, hood: 0, roof: 0 };
      const sideSqft = panels.sides || 0;
      const backSqft = panels.back || 0;
      const hoodSqft = panels.hood || 0;
      const roofSqft = panels.roof || 0;

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
    } catch (error) {
      console.error("Error fetching SQFT:", error);
      return null;
    }
  }, []);

  // Get the corrected SQFT for quoting via edge function
  const getCorrectedSQFT = useCallback(async (
    make: string,
    model: string,
    year: number
  ): Promise<number | null> => {
    if (!make || !model || !year) return null;

    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/vehicle-sqft`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
          },
          body: JSON.stringify({ year, make, model }),
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data.sqft || null;
    } catch (error) {
      console.error("Error fetching corrected SQFT:", error);
      return null;
    }
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
