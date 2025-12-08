-- Create vehicle_dimensions table for accurate wrap SQFT calculations
CREATE TABLE public.vehicle_dimensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Vehicle identity
  make text NOT NULL,
  model text NOT NULL,
  year_start int NOT NULL,
  year_end int NOT NULL,
  
  -- Side panel dimensions
  side_width float,
  side_height float,
  side_sqft float,
  
  -- Back panel dimensions
  back_width float,
  back_height float,
  back_sqft float,
  
  -- Hood dimensions
  hood_width float,
  hood_length float,
  hood_sqft float,
  
  -- Roof dimensions
  roof_width float,
  roof_length float,
  roof_sqft float,
  
  -- Totals
  total_sqft float,
  corrected_sqft float NOT NULL,
  
  inserted_at timestamptz DEFAULT now()
);

-- Create indexes for fast lookup
CREATE INDEX idx_vehicle_make_model ON public.vehicle_dimensions(make, model);
CREATE INDEX idx_vehicle_year_range ON public.vehicle_dimensions(year_start, year_end);
CREATE INDEX idx_vehicle_corrected ON public.vehicle_dimensions(corrected_sqft);

-- Enable RLS
ALTER TABLE public.vehicle_dimensions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read vehicle dimensions (public reference data)
CREATE POLICY "Anyone can view vehicle dimensions"
ON public.vehicle_dimensions
FOR SELECT
USING (true);

-- Only admins can modify vehicle data
CREATE POLICY "Admins can manage vehicle dimensions"
ON public.vehicle_dimensions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));