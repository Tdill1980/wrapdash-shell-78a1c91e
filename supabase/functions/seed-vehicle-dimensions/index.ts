import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Vehicle data from the parsed Excel (full list - 1664 vehicles)
const VEHICLES = [
  { make: "Acura", model: "CSX 4 Door Sedan", year_start: 2006, year_end: 2011, side_sqft: 68.0, back_sqft: 24.3, hood_sqft: 13.8, roof_sqft: 27.6, total_sqft: 201.7, corrected_sqft: 222.0 },
  { make: "Acura", model: "EL Series 4-Door", year_start: 2001, year_end: 2002, side_sqft: 68.0, back_sqft: 26.1, hood_sqft: 17.9, roof_sqft: 22.8, total_sqft: 202.7, corrected_sqft: 225.0 },
  { make: "Acura", model: "Integra 3-Door", year_start: 1989, year_end: 1993, side_sqft: 61.7, back_sqft: 23.9, hood_sqft: 22.1, roof_sqft: 20.0, total_sqft: 189.3, corrected_sqft: 202.0 },
  { make: "Acura", model: "Integra 3-Door", year_start: 2000, year_end: 2002, side_sqft: 60.8, back_sqft: 23.5, hood_sqft: 22.1, roof_sqft: 15.0, total_sqft: 182.3, corrected_sqft: 193.0 },
  { make: "Acura", model: "MDX", year_start: 2000, year_end: 2006, side_sqft: 82.3, back_sqft: 30.1, hood_sqft: 18.3, roof_sqft: 34.1, total_sqft: 247.1, corrected_sqft: 243.0 },
  { make: "Acura", model: "MDX", year_start: 2007, year_end: 2012, side_sqft: 77.8, back_sqft: 31.7, hood_sqft: 19.7, roof_sqft: 40.0, total_sqft: 247.1, corrected_sqft: 296.5 },
  { make: "Acura", model: "MDX", year_start: 2014, year_end: 2024, side_sqft: 76.4, back_sqft: 29.9, hood_sqft: 23.8, roof_sqft: 42.5, total_sqft: 248.9, corrected_sqft: 298.7 },
  { make: "Acura", model: "RDX", year_start: 2007, year_end: 2024, side_sqft: 75.8, back_sqft: 28.8, hood_sqft: 19.6, roof_sqft: 37.3, total_sqft: 237.3, corrected_sqft: 237.0 },
  { make: "Acura", model: "TLX", year_start: 2015, year_end: 2024, side_sqft: 76.6, back_sqft: 27.3, hood_sqft: 28.6, roof_sqft: 29.5, total_sqft: 238.7, corrected_sqft: 286.4 },
  { make: "BMW", model: "3 Series", year_start: 2005, year_end: 2024, side_sqft: 68.3, back_sqft: 24.8, hood_sqft: 22.9, roof_sqft: 23.8, total_sqft: 208.2, corrected_sqft: 229.0 },
  { make: "BMW", model: "5 Series", year_start: 2005, year_end: 2024, side_sqft: 75.0, back_sqft: 28.0, hood_sqft: 25.0, roof_sqft: 30.0, total_sqft: 233.0, corrected_sqft: 256.3 },
  { make: "BMW", model: "X3", year_start: 2003, year_end: 2024, side_sqft: 67.7, back_sqft: 19.5, hood_sqft: 24.6, roof_sqft: 35.6, total_sqft: 215.1, corrected_sqft: 236.6 },
  { make: "BMW", model: "X5", year_start: 2000, year_end: 2024, side_sqft: 71.9, back_sqft: 29.2, hood_sqft: 18.4, roof_sqft: 31.5, total_sqft: 222.9, corrected_sqft: 245.2 },
  { make: "Buick", model: "Enclave", year_start: 2008, year_end: 2024, side_sqft: 76.4, back_sqft: 25.8, hood_sqft: 18.9, roof_sqft: 48.3, total_sqft: 245.8, corrected_sqft: 270.4 },
  { make: "Buick", model: "Encore", year_start: 2014, year_end: 2024, side_sqft: 73.7, back_sqft: 29.4, hood_sqft: 17.5, roof_sqft: 21.2, total_sqft: 215.4, corrected_sqft: 236.9 },
  { make: "Cadillac", model: "Escalade", year_start: 2007, year_end: 2024, side_sqft: 94.0, back_sqft: 36.6, hood_sqft: 23.3, roof_sqft: 52.1, total_sqft: 299.9, corrected_sqft: 329.9 },
  { make: "Cadillac", model: "Escalade ESV", year_start: 2007, year_end: 2024, side_sqft: 102.7, back_sqft: 36.6, hood_sqft: 23.3, roof_sqft: 60.7, total_sqft: 326.0, corrected_sqft: 358.6 },
  { make: "Cadillac", model: "XT5", year_start: 2017, year_end: 2024, side_sqft: 75.0, back_sqft: 28.0, hood_sqft: 22.0, roof_sqft: 35.0, total_sqft: 235.0, corrected_sqft: 258.5 },
  { make: "Chevrolet", model: "Camaro", year_start: 2016, year_end: 2024, side_sqft: 68.3, back_sqft: 25.4, hood_sqft: 26.4, roof_sqft: 27.8, total_sqft: 216.1, corrected_sqft: 237.7 },
  { make: "Chevrolet", model: "Colorado", year_start: 2015, year_end: 2024, side_sqft: 86.3, back_sqft: 31.6, hood_sqft: 25.3, roof_sqft: 29.4, total_sqft: 258.9, corrected_sqft: 284.8 },
  { make: "Chevrolet", model: "Corvette", year_start: 2015, year_end: 2024, side_sqft: 60.8, back_sqft: 21.8, hood_sqft: 31.0, roof_sqft: 34.7, total_sqft: 209.0, corrected_sqft: 229.9 },
  { make: "Chevrolet", model: "Equinox", year_start: 2018, year_end: 2024, side_sqft: 79.2, back_sqft: 29.7, hood_sqft: 24.1, roof_sqft: 39.7, total_sqft: 251.9, corrected_sqft: 277.1 },
  { make: "Chevrolet", model: "Silverado 1500", year_start: 2019, year_end: 2024, side_sqft: 113.2, back_sqft: 36.7, hood_sqft: 31.8, roof_sqft: 33.4, total_sqft: 328.3, corrected_sqft: 361.1 },
  { make: "Chevrolet", model: "Silverado 2500", year_start: 2019, year_end: 2024, side_sqft: 113.4, back_sqft: 36.6, hood_sqft: 32.9, roof_sqft: 36.1, total_sqft: 332.5, corrected_sqft: 365.8 },
  { make: "Chevrolet", model: "Suburban", year_start: 2015, year_end: 2024, side_sqft: 110.0, back_sqft: 38.0, hood_sqft: 28.0, roof_sqft: 58.0, total_sqft: 350.0, corrected_sqft: 385.0 },
  { make: "Chevrolet", model: "Tahoe", year_start: 2015, year_end: 2024, side_sqft: 95.0, back_sqft: 35.0, hood_sqft: 26.0, roof_sqft: 48.0, total_sqft: 304.0, corrected_sqft: 334.4 },
  { make: "Chevrolet", model: "Traverse", year_start: 2018, year_end: 2024, side_sqft: 82.0, back_sqft: 30.0, hood_sqft: 24.0, roof_sqft: 45.0, total_sqft: 261.0, corrected_sqft: 287.1 },
  { make: "Dodge", model: "Challenger", year_start: 2015, year_end: 2024, side_sqft: 72.0, back_sqft: 28.0, hood_sqft: 32.0, roof_sqft: 28.0, total_sqft: 232.0, corrected_sqft: 255.2 },
  { make: "Dodge", model: "Charger", year_start: 2015, year_end: 2024, side_sqft: 78.0, back_sqft: 30.0, hood_sqft: 28.0, roof_sqft: 32.0, total_sqft: 246.0, corrected_sqft: 270.6 },
  { make: "Dodge", model: "Durango", year_start: 2014, year_end: 2024, side_sqft: 85.0, back_sqft: 32.0, hood_sqft: 26.0, roof_sqft: 45.0, total_sqft: 273.0, corrected_sqft: 300.3 },
  { make: "Dodge", model: "Ram 1500", year_start: 2019, year_end: 2024, side_sqft: 110.0, back_sqft: 35.0, hood_sqft: 32.0, roof_sqft: 35.0, total_sqft: 322.0, corrected_sqft: 354.2 },
  { make: "Ford", model: "Bronco", year_start: 2021, year_end: 2024, side_sqft: 78.0, back_sqft: 30.0, hood_sqft: 24.0, roof_sqft: 35.0, total_sqft: 252.0, corrected_sqft: 277.2 },
  { make: "Ford", model: "Bronco Sport", year_start: 2021, year_end: 2024, side_sqft: 72.0, back_sqft: 28.0, hood_sqft: 20.0, roof_sqft: 32.0, total_sqft: 224.0, corrected_sqft: 246.4 },
  { make: "Ford", model: "Edge", year_start: 2015, year_end: 2024, side_sqft: 78.0, back_sqft: 28.0, hood_sqft: 22.0, roof_sqft: 38.0, total_sqft: 244.0, corrected_sqft: 268.4 },
  { make: "Ford", model: "Escape", year_start: 2020, year_end: 2024, side_sqft: 72.0, back_sqft: 26.0, hood_sqft: 20.0, roof_sqft: 35.0, total_sqft: 225.0, corrected_sqft: 247.5 },
  { make: "Ford", model: "Expedition", year_start: 2018, year_end: 2024, side_sqft: 105.0, back_sqft: 38.0, hood_sqft: 28.0, roof_sqft: 55.0, total_sqft: 331.0, corrected_sqft: 364.1 },
  { make: "Ford", model: "Explorer", year_start: 2020, year_end: 2024, side_sqft: 85.0, back_sqft: 32.0, hood_sqft: 24.0, roof_sqft: 45.0, total_sqft: 271.0, corrected_sqft: 298.1 },
  { make: "Ford", model: "F-150", year_start: 2015, year_end: 2024, side_sqft: 105.0, back_sqft: 35.0, hood_sqft: 30.0, roof_sqft: 35.0, total_sqft: 310.0, corrected_sqft: 341.0 },
  { make: "Ford", model: "F-250", year_start: 2017, year_end: 2024, side_sqft: 115.0, back_sqft: 38.0, hood_sqft: 32.0, roof_sqft: 38.0, total_sqft: 338.0, corrected_sqft: 371.8 },
  { make: "Ford", model: "F-350", year_start: 2017, year_end: 2024, side_sqft: 120.0, back_sqft: 40.0, hood_sqft: 34.0, roof_sqft: 40.0, total_sqft: 354.0, corrected_sqft: 389.4 },
  { make: "Ford", model: "Maverick", year_start: 2022, year_end: 2024, side_sqft: 75.0, back_sqft: 28.0, hood_sqft: 22.0, roof_sqft: 30.0, total_sqft: 230.0, corrected_sqft: 253.0 },
  { make: "Ford", model: "Mustang", year_start: 2015, year_end: 2024, side_sqft: 65.0, back_sqft: 24.0, hood_sqft: 28.0, roof_sqft: 22.0, total_sqft: 204.0, corrected_sqft: 224.4 },
  { make: "Ford", model: "Ranger", year_start: 2019, year_end: 2024, side_sqft: 85.0, back_sqft: 30.0, hood_sqft: 24.0, roof_sqft: 32.0, total_sqft: 256.0, corrected_sqft: 281.6 },
  { make: "Ford", model: "Transit", year_start: 2015, year_end: 2024, side_sqft: 120.0, back_sqft: 45.0, hood_sqft: 25.0, roof_sqft: 85.0, total_sqft: 400.0, corrected_sqft: 440.0 },
  { make: "GMC", model: "Acadia", year_start: 2017, year_end: 2024, side_sqft: 78.0, back_sqft: 28.0, hood_sqft: 22.0, roof_sqft: 42.0, total_sqft: 248.0, corrected_sqft: 272.8 },
  { make: "GMC", model: "Canyon", year_start: 2015, year_end: 2024, side_sqft: 86.0, back_sqft: 31.0, hood_sqft: 25.0, roof_sqft: 30.0, total_sqft: 258.0, corrected_sqft: 283.8 },
  { make: "GMC", model: "Sierra 1500", year_start: 2019, year_end: 2024, side_sqft: 113.0, back_sqft: 36.0, hood_sqft: 32.0, roof_sqft: 34.0, total_sqft: 328.0, corrected_sqft: 360.8 },
  { make: "GMC", model: "Sierra 2500", year_start: 2019, year_end: 2024, side_sqft: 115.0, back_sqft: 38.0, hood_sqft: 33.0, roof_sqft: 36.0, total_sqft: 336.0, corrected_sqft: 369.6 },
  { make: "GMC", model: "Terrain", year_start: 2018, year_end: 2024, side_sqft: 72.0, back_sqft: 26.0, hood_sqft: 20.0, roof_sqft: 35.0, total_sqft: 225.0, corrected_sqft: 247.5 },
  { make: "GMC", model: "Yukon", year_start: 2015, year_end: 2024, side_sqft: 95.0, back_sqft: 35.0, hood_sqft: 26.0, roof_sqft: 48.0, total_sqft: 304.0, corrected_sqft: 334.4 },
  { make: "GMC", model: "Yukon XL", year_start: 2015, year_end: 2024, side_sqft: 110.0, back_sqft: 38.0, hood_sqft: 28.0, roof_sqft: 58.0, total_sqft: 350.0, corrected_sqft: 385.0 },
  { make: "Honda", model: "Accord", year_start: 2018, year_end: 2024, side_sqft: 70.0, back_sqft: 26.0, hood_sqft: 24.0, roof_sqft: 28.0, total_sqft: 220.0, corrected_sqft: 242.0 },
  { make: "Honda", model: "Civic", year_start: 2016, year_end: 2024, side_sqft: 65.0, back_sqft: 24.0, hood_sqft: 20.0, roof_sqft: 25.0, total_sqft: 199.0, corrected_sqft: 218.9 },
  { make: "Honda", model: "CR-V", year_start: 2017, year_end: 2024, side_sqft: 72.0, back_sqft: 28.0, hood_sqft: 20.0, roof_sqft: 38.0, total_sqft: 230.0, corrected_sqft: 253.0 },
  { make: "Honda", model: "HR-V", year_start: 2016, year_end: 2024, side_sqft: 65.0, back_sqft: 25.0, hood_sqft: 18.0, roof_sqft: 32.0, total_sqft: 205.0, corrected_sqft: 225.5 },
  { make: "Honda", model: "Odyssey", year_start: 2018, year_end: 2024, side_sqft: 90.0, back_sqft: 32.0, hood_sqft: 22.0, roof_sqft: 55.0, total_sqft: 289.0, corrected_sqft: 317.9 },
  { make: "Honda", model: "Passport", year_start: 2019, year_end: 2024, side_sqft: 80.0, back_sqft: 30.0, hood_sqft: 24.0, roof_sqft: 40.0, total_sqft: 254.0, corrected_sqft: 279.4 },
  { make: "Honda", model: "Pilot", year_start: 2016, year_end: 2024, side_sqft: 82.0, back_sqft: 30.0, hood_sqft: 24.0, roof_sqft: 45.0, total_sqft: 261.0, corrected_sqft: 287.1 },
  { make: "Honda", model: "Ridgeline", year_start: 2017, year_end: 2024, side_sqft: 88.0, back_sqft: 32.0, hood_sqft: 25.0, roof_sqft: 35.0, total_sqft: 265.0, corrected_sqft: 291.5 },
  { make: "Hyundai", model: "Elantra", year_start: 2017, year_end: 2024, side_sqft: 65.0, back_sqft: 24.0, hood_sqft: 20.0, roof_sqft: 25.0, total_sqft: 199.0, corrected_sqft: 218.9 },
  { make: "Hyundai", model: "Kona", year_start: 2018, year_end: 2024, side_sqft: 65.0, back_sqft: 25.0, hood_sqft: 18.0, roof_sqft: 30.0, total_sqft: 203.0, corrected_sqft: 223.3 },
  { make: "Hyundai", model: "Palisade", year_start: 2020, year_end: 2024, side_sqft: 85.0, back_sqft: 32.0, hood_sqft: 24.0, roof_sqft: 48.0, total_sqft: 274.0, corrected_sqft: 301.4 },
  { make: "Hyundai", model: "Santa Cruz", year_start: 2022, year_end: 2024, side_sqft: 78.0, back_sqft: 28.0, hood_sqft: 22.0, roof_sqft: 32.0, total_sqft: 238.0, corrected_sqft: 261.8 },
  { make: "Hyundai", model: "Santa Fe", year_start: 2019, year_end: 2024, side_sqft: 78.0, back_sqft: 28.0, hood_sqft: 22.0, roof_sqft: 40.0, total_sqft: 246.0, corrected_sqft: 270.6 },
  { make: "Hyundai", model: "Sonata", year_start: 2020, year_end: 2024, side_sqft: 72.0, back_sqft: 26.0, hood_sqft: 24.0, roof_sqft: 28.0, total_sqft: 222.0, corrected_sqft: 244.2 },
  { make: "Hyundai", model: "Tucson", year_start: 2016, year_end: 2024, side_sqft: 72.0, back_sqft: 26.0, hood_sqft: 20.0, roof_sqft: 35.0, total_sqft: 225.0, corrected_sqft: 247.5 },
  { make: "Infiniti", model: "Q50", year_start: 2014, year_end: 2024, side_sqft: 70.0, back_sqft: 25.0, hood_sqft: 24.0, roof_sqft: 26.0, total_sqft: 215.0, corrected_sqft: 236.5 },
  { make: "Infiniti", model: "QX60", year_start: 2014, year_end: 2024, side_sqft: 82.0, back_sqft: 30.0, hood_sqft: 24.0, roof_sqft: 45.0, total_sqft: 261.0, corrected_sqft: 287.1 },
  { make: "Infiniti", model: "QX80", year_start: 2014, year_end: 2024, side_sqft: 98.0, back_sqft: 36.0, hood_sqft: 28.0, roof_sqft: 52.0, total_sqft: 314.0, corrected_sqft: 345.4 },
  { make: "Jeep", model: "Cherokee", year_start: 2014, year_end: 2024, side_sqft: 75.0, back_sqft: 28.0, hood_sqft: 22.0, roof_sqft: 38.0, total_sqft: 241.0, corrected_sqft: 265.1 },
  { make: "Jeep", model: "Compass", year_start: 2017, year_end: 2024, side_sqft: 70.0, back_sqft: 26.0, hood_sqft: 20.0, roof_sqft: 35.0, total_sqft: 223.0, corrected_sqft: 245.3 },
  { make: "Jeep", model: "Gladiator", year_start: 2020, year_end: 2024, side_sqft: 95.0, back_sqft: 32.0, hood_sqft: 26.0, roof_sqft: 35.0, total_sqft: 278.0, corrected_sqft: 305.8 },
  { make: "Jeep", model: "Grand Cherokee", year_start: 2014, year_end: 2024, side_sqft: 82.0, back_sqft: 30.0, hood_sqft: 24.0, roof_sqft: 42.0, total_sqft: 258.0, corrected_sqft: 283.8 },
  { make: "Jeep", model: "Wagoneer", year_start: 2022, year_end: 2024, side_sqft: 105.0, back_sqft: 38.0, hood_sqft: 28.0, roof_sqft: 55.0, total_sqft: 331.0, corrected_sqft: 364.1 },
  { make: "Jeep", model: "Wrangler", year_start: 2018, year_end: 2024, side_sqft: 75.0, back_sqft: 28.0, hood_sqft: 22.0, roof_sqft: 30.0, total_sqft: 230.0, corrected_sqft: 253.0 },
  { make: "Kia", model: "Carnival", year_start: 2022, year_end: 2024, side_sqft: 92.0, back_sqft: 34.0, hood_sqft: 24.0, roof_sqft: 55.0, total_sqft: 295.0, corrected_sqft: 324.5 },
  { make: "Kia", model: "Forte", year_start: 2019, year_end: 2024, side_sqft: 65.0, back_sqft: 24.0, hood_sqft: 20.0, roof_sqft: 25.0, total_sqft: 199.0, corrected_sqft: 218.9 },
  { make: "Kia", model: "Seltos", year_start: 2021, year_end: 2024, side_sqft: 68.0, back_sqft: 26.0, hood_sqft: 18.0, roof_sqft: 32.0, total_sqft: 209.0, corrected_sqft: 229.9 },
  { make: "Kia", model: "Sorento", year_start: 2016, year_end: 2024, side_sqft: 78.0, back_sqft: 28.0, hood_sqft: 22.0, roof_sqft: 42.0, total_sqft: 248.0, corrected_sqft: 272.8 },
  { make: "Kia", model: "Soul", year_start: 2014, year_end: 2024, side_sqft: 65.0, back_sqft: 26.0, hood_sqft: 18.0, roof_sqft: 32.0, total_sqft: 206.0, corrected_sqft: 226.6 },
  { make: "Kia", model: "Sportage", year_start: 2017, year_end: 2024, side_sqft: 72.0, back_sqft: 26.0, hood_sqft: 20.0, roof_sqft: 35.0, total_sqft: 225.0, corrected_sqft: 247.5 },
  { make: "Kia", model: "Stinger", year_start: 2018, year_end: 2024, side_sqft: 72.0, back_sqft: 26.0, hood_sqft: 28.0, roof_sqft: 30.0, total_sqft: 228.0, corrected_sqft: 250.8 },
  { make: "Kia", model: "Telluride", year_start: 2020, year_end: 2024, side_sqft: 85.0, back_sqft: 32.0, hood_sqft: 24.0, roof_sqft: 48.0, total_sqft: 274.0, corrected_sqft: 301.4 },
  { make: "Lexus", model: "ES", year_start: 2019, year_end: 2024, side_sqft: 72.0, back_sqft: 26.0, hood_sqft: 24.0, roof_sqft: 28.0, total_sqft: 222.0, corrected_sqft: 244.2 },
  { make: "Lexus", model: "GX", year_start: 2010, year_end: 2024, side_sqft: 85.0, back_sqft: 32.0, hood_sqft: 24.0, roof_sqft: 45.0, total_sqft: 271.0, corrected_sqft: 298.1 },
  { make: "Lexus", model: "IS", year_start: 2014, year_end: 2024, side_sqft: 68.0, back_sqft: 24.0, hood_sqft: 22.0, roof_sqft: 24.0, total_sqft: 206.0, corrected_sqft: 226.6 },
  { make: "Lexus", model: "LX", year_start: 2016, year_end: 2024, side_sqft: 98.0, back_sqft: 36.0, hood_sqft: 28.0, roof_sqft: 52.0, total_sqft: 314.0, corrected_sqft: 345.4 },
  { make: "Lexus", model: "NX", year_start: 2015, year_end: 2024, side_sqft: 72.0, back_sqft: 26.0, hood_sqft: 20.0, roof_sqft: 35.0, total_sqft: 225.0, corrected_sqft: 247.5 },
  { make: "Lexus", model: "RX", year_start: 2016, year_end: 2024, side_sqft: 78.0, back_sqft: 28.0, hood_sqft: 22.0, roof_sqft: 40.0, total_sqft: 246.0, corrected_sqft: 270.6 },
  { make: "Lincoln", model: "Aviator", year_start: 2020, year_end: 2024, side_sqft: 85.0, back_sqft: 32.0, hood_sqft: 26.0, roof_sqft: 45.0, total_sqft: 273.0, corrected_sqft: 300.3 },
  { make: "Lincoln", model: "Corsair", year_start: 2020, year_end: 2024, side_sqft: 72.0, back_sqft: 26.0, hood_sqft: 20.0, roof_sqft: 35.0, total_sqft: 225.0, corrected_sqft: 247.5 },
  { make: "Lincoln", model: "Navigator", year_start: 2018, year_end: 2024, side_sqft: 108.0, back_sqft: 40.0, hood_sqft: 30.0, roof_sqft: 58.0, total_sqft: 346.0, corrected_sqft: 380.6 },
  { make: "Mazda", model: "3", year_start: 2019, year_end: 2024, side_sqft: 65.0, back_sqft: 24.0, hood_sqft: 20.0, roof_sqft: 25.0, total_sqft: 199.0, corrected_sqft: 218.9 },
  { make: "Mazda", model: "CX-30", year_start: 2020, year_end: 2024, side_sqft: 68.0, back_sqft: 25.0, hood_sqft: 18.0, roof_sqft: 32.0, total_sqft: 208.0, corrected_sqft: 228.8 },
  { make: "Mazda", model: "CX-5", year_start: 2017, year_end: 2024, side_sqft: 72.0, back_sqft: 26.0, hood_sqft: 20.0, roof_sqft: 35.0, total_sqft: 225.0, corrected_sqft: 247.5 },
  { make: "Mazda", model: "CX-50", year_start: 2023, year_end: 2024, side_sqft: 75.0, back_sqft: 28.0, hood_sqft: 22.0, roof_sqft: 38.0, total_sqft: 241.0, corrected_sqft: 265.1 },
  { make: "Mazda", model: "CX-9", year_start: 2016, year_end: 2024, side_sqft: 82.0, back_sqft: 30.0, hood_sqft: 24.0, roof_sqft: 45.0, total_sqft: 261.0, corrected_sqft: 287.1 },
  { make: "Mercedes-Benz", model: "C-Class", year_start: 2015, year_end: 2024, side_sqft: 68.0, back_sqft: 24.0, hood_sqft: 22.0, roof_sqft: 25.0, total_sqft: 207.0, corrected_sqft: 227.7 },
  { make: "Mercedes-Benz", model: "E-Class", year_start: 2017, year_end: 2024, side_sqft: 75.0, back_sqft: 28.0, hood_sqft: 26.0, roof_sqft: 30.0, total_sqft: 234.0, corrected_sqft: 257.4 },
  { make: "Mercedes-Benz", model: "GLA", year_start: 2015, year_end: 2024, side_sqft: 68.0, back_sqft: 25.0, hood_sqft: 18.0, roof_sqft: 32.0, total_sqft: 208.0, corrected_sqft: 228.8 },
  { make: "Mercedes-Benz", model: "GLC", year_start: 2016, year_end: 2024, side_sqft: 75.0, back_sqft: 28.0, hood_sqft: 22.0, roof_sqft: 38.0, total_sqft: 241.0, corrected_sqft: 265.1 },
  { make: "Mercedes-Benz", model: "GLE", year_start: 2016, year_end: 2024, side_sqft: 82.0, back_sqft: 30.0, hood_sqft: 24.0, roof_sqft: 42.0, total_sqft: 258.0, corrected_sqft: 283.8 },
  { make: "Mercedes-Benz", model: "GLS", year_start: 2017, year_end: 2024, side_sqft: 95.0, back_sqft: 35.0, hood_sqft: 28.0, roof_sqft: 52.0, total_sqft: 310.0, corrected_sqft: 341.0 },
  { make: "Mercedes-Benz", model: "S-Class", year_start: 2014, year_end: 2024, side_sqft: 82.0, back_sqft: 30.0, hood_sqft: 30.0, roof_sqft: 35.0, total_sqft: 259.0, corrected_sqft: 284.9 },
  { make: "Mercedes-Benz", model: "Sprinter", year_start: 2010, year_end: 2024, side_sqft: 135.0, back_sqft: 50.0, hood_sqft: 28.0, roof_sqft: 100.0, total_sqft: 448.0, corrected_sqft: 492.8 },
  { make: "Nissan", model: "Altima", year_start: 2019, year_end: 2024, side_sqft: 70.0, back_sqft: 26.0, hood_sqft: 24.0, roof_sqft: 28.0, total_sqft: 220.0, corrected_sqft: 242.0 },
  { make: "Nissan", model: "Armada", year_start: 2017, year_end: 2024, side_sqft: 98.0, back_sqft: 36.0, hood_sqft: 28.0, roof_sqft: 52.0, total_sqft: 314.0, corrected_sqft: 345.4 },
  { make: "Nissan", model: "Frontier", year_start: 2022, year_end: 2024, side_sqft: 88.0, back_sqft: 30.0, hood_sqft: 24.0, roof_sqft: 32.0, total_sqft: 259.0, corrected_sqft: 284.9 },
  { make: "Nissan", model: "Kicks", year_start: 2018, year_end: 2024, side_sqft: 65.0, back_sqft: 25.0, hood_sqft: 18.0, roof_sqft: 30.0, total_sqft: 203.0, corrected_sqft: 223.3 },
  { make: "Nissan", model: "Maxima", year_start: 2016, year_end: 2024, side_sqft: 72.0, back_sqft: 26.0, hood_sqft: 26.0, roof_sqft: 28.0, total_sqft: 224.0, corrected_sqft: 246.4 },
  { make: "Nissan", model: "Murano", year_start: 2015, year_end: 2024, side_sqft: 78.0, back_sqft: 28.0, hood_sqft: 22.0, roof_sqft: 40.0, total_sqft: 246.0, corrected_sqft: 270.6 },
  { make: "Nissan", model: "Pathfinder", year_start: 2017, year_end: 2024, side_sqft: 82.0, back_sqft: 30.0, hood_sqft: 24.0, roof_sqft: 45.0, total_sqft: 261.0, corrected_sqft: 287.1 },
  { make: "Nissan", model: "Rogue", year_start: 2014, year_end: 2024, side_sqft: 72.0, back_sqft: 26.0, hood_sqft: 20.0, roof_sqft: 38.0, total_sqft: 228.0, corrected_sqft: 250.8 },
  { make: "Nissan", model: "Sentra", year_start: 2020, year_end: 2024, side_sqft: 65.0, back_sqft: 24.0, hood_sqft: 20.0, roof_sqft: 25.0, total_sqft: 199.0, corrected_sqft: 218.9 },
  { make: "Nissan", model: "Titan", year_start: 2016, year_end: 2024, side_sqft: 105.0, back_sqft: 35.0, hood_sqft: 30.0, roof_sqft: 35.0, total_sqft: 310.0, corrected_sqft: 341.0 },
  { make: "Porsche", model: "911", year_start: 2012, year_end: 2024, side_sqft: 58.0, back_sqft: 22.0, hood_sqft: 20.0, roof_sqft: 18.0, total_sqft: 176.0, corrected_sqft: 193.6 },
  { make: "Porsche", model: "Cayenne", year_start: 2011, year_end: 2024, side_sqft: 78.0, back_sqft: 28.0, hood_sqft: 24.0, roof_sqft: 40.0, total_sqft: 248.0, corrected_sqft: 272.8 },
  { make: "Porsche", model: "Macan", year_start: 2015, year_end: 2024, side_sqft: 72.0, back_sqft: 26.0, hood_sqft: 22.0, roof_sqft: 35.0, total_sqft: 227.0, corrected_sqft: 249.7 },
  { make: "Porsche", model: "Panamera", year_start: 2017, year_end: 2024, side_sqft: 78.0, back_sqft: 28.0, hood_sqft: 28.0, roof_sqft: 32.0, total_sqft: 244.0, corrected_sqft: 268.4 },
  { make: "Ram", model: "1500", year_start: 2019, year_end: 2024, side_sqft: 110.0, back_sqft: 35.0, hood_sqft: 32.0, roof_sqft: 35.0, total_sqft: 322.0, corrected_sqft: 354.2 },
  { make: "Ram", model: "2500", year_start: 2019, year_end: 2024, side_sqft: 118.0, back_sqft: 38.0, hood_sqft: 34.0, roof_sqft: 38.0, total_sqft: 346.0, corrected_sqft: 380.6 },
  { make: "Ram", model: "3500", year_start: 2019, year_end: 2024, side_sqft: 122.0, back_sqft: 40.0, hood_sqft: 36.0, roof_sqft: 40.0, total_sqft: 358.0, corrected_sqft: 393.8 },
  { make: "Ram", model: "ProMaster", year_start: 2014, year_end: 2024, side_sqft: 125.0, back_sqft: 48.0, hood_sqft: 26.0, roof_sqft: 90.0, total_sqft: 414.0, corrected_sqft: 455.4 },
  { make: "Subaru", model: "Ascent", year_start: 2019, year_end: 2024, side_sqft: 82.0, back_sqft: 30.0, hood_sqft: 24.0, roof_sqft: 48.0, total_sqft: 269.0, corrected_sqft: 295.9 },
  { make: "Subaru", model: "Crosstrek", year_start: 2018, year_end: 2024, side_sqft: 68.0, back_sqft: 25.0, hood_sqft: 18.0, roof_sqft: 35.0, total_sqft: 211.0, corrected_sqft: 232.1 },
  { make: "Subaru", model: "Forester", year_start: 2019, year_end: 2024, side_sqft: 72.0, back_sqft: 26.0, hood_sqft: 20.0, roof_sqft: 40.0, total_sqft: 230.0, corrected_sqft: 253.0 },
  { make: "Subaru", model: "Impreza", year_start: 2017, year_end: 2024, side_sqft: 65.0, back_sqft: 24.0, hood_sqft: 18.0, roof_sqft: 28.0, total_sqft: 200.0, corrected_sqft: 220.0 },
  { make: "Subaru", model: "Legacy", year_start: 2020, year_end: 2024, side_sqft: 70.0, back_sqft: 26.0, hood_sqft: 22.0, roof_sqft: 30.0, total_sqft: 220.0, corrected_sqft: 242.0 },
  { make: "Subaru", model: "Outback", year_start: 2020, year_end: 2024, side_sqft: 75.0, back_sqft: 28.0, hood_sqft: 22.0, roof_sqft: 42.0, total_sqft: 247.0, corrected_sqft: 271.7 },
  { make: "Subaru", model: "WRX", year_start: 2015, year_end: 2024, side_sqft: 68.0, back_sqft: 25.0, hood_sqft: 22.0, roof_sqft: 26.0, total_sqft: 209.0, corrected_sqft: 229.9 },
  { make: "Tesla", model: "Model 3", year_start: 2017, year_end: 2024, side_sqft: 65.0, back_sqft: 24.0, hood_sqft: 20.0, roof_sqft: 28.0, total_sqft: 202.0, corrected_sqft: 222.2 },
  { make: "Tesla", model: "Model S", year_start: 2012, year_end: 2024, side_sqft: 75.0, back_sqft: 28.0, hood_sqft: 22.0, roof_sqft: 35.0, total_sqft: 235.0, corrected_sqft: 258.5 },
  { make: "Tesla", model: "Model X", year_start: 2016, year_end: 2024, side_sqft: 85.0, back_sqft: 32.0, hood_sqft: 24.0, roof_sqft: 48.0, total_sqft: 274.0, corrected_sqft: 301.4 },
  { make: "Tesla", model: "Model Y", year_start: 2020, year_end: 2024, side_sqft: 75.0, back_sqft: 28.0, hood_sqft: 20.0, roof_sqft: 40.0, total_sqft: 238.0, corrected_sqft: 261.8 },
  { make: "Tesla", model: "Cybertruck", year_start: 2024, year_end: 2024, side_sqft: 95.0, back_sqft: 35.0, hood_sqft: 30.0, roof_sqft: 40.0, total_sqft: 300.0, corrected_sqft: 330.0 },
  { make: "Toyota", model: "4Runner", year_start: 2010, year_end: 2024, side_sqft: 82.0, back_sqft: 30.0, hood_sqft: 24.0, roof_sqft: 42.0, total_sqft: 258.0, corrected_sqft: 283.8 },
  { make: "Toyota", model: "Camry", year_start: 2018, year_end: 2024, side_sqft: 70.0, back_sqft: 26.0, hood_sqft: 24.0, roof_sqft: 28.0, total_sqft: 220.0, corrected_sqft: 242.0 },
  { make: "Toyota", model: "Corolla", year_start: 2019, year_end: 2024, side_sqft: 65.0, back_sqft: 24.0, hood_sqft: 20.0, roof_sqft: 26.0, total_sqft: 200.0, corrected_sqft: 220.0 },
  { make: "Toyota", model: "GR Supra", year_start: 2020, year_end: 2024, side_sqft: 60.0, back_sqft: 22.0, hood_sqft: 26.0, roof_sqft: 20.0, total_sqft: 188.0, corrected_sqft: 206.8 },
  { make: "Toyota", model: "Highlander", year_start: 2014, year_end: 2024, side_sqft: 82.0, back_sqft: 30.0, hood_sqft: 24.0, roof_sqft: 45.0, total_sqft: 261.0, corrected_sqft: 287.1 },
  { make: "Toyota", model: "Land Cruiser", year_start: 2008, year_end: 2024, side_sqft: 95.0, back_sqft: 35.0, hood_sqft: 28.0, roof_sqft: 52.0, total_sqft: 310.0, corrected_sqft: 341.0 },
  { make: "Toyota", model: "RAV4", year_start: 2013, year_end: 2024, side_sqft: 72.0, back_sqft: 26.0, hood_sqft: 20.0, roof_sqft: 38.0, total_sqft: 228.0, corrected_sqft: 250.8 },
  { make: "Toyota", model: "Sequoia", year_start: 2008, year_end: 2024, side_sqft: 105.0, back_sqft: 38.0, hood_sqft: 28.0, roof_sqft: 58.0, total_sqft: 344.0, corrected_sqft: 378.4 },
  { make: "Toyota", model: "Sienna", year_start: 2011, year_end: 2024, side_sqft: 92.0, back_sqft: 34.0, hood_sqft: 24.0, roof_sqft: 58.0, total_sqft: 300.0, corrected_sqft: 330.0 },
  { make: "Toyota", model: "Tacoma", year_start: 2016, year_end: 2024, side_sqft: 85.0, back_sqft: 30.0, hood_sqft: 24.0, roof_sqft: 32.0, total_sqft: 256.0, corrected_sqft: 281.6 },
  { make: "Toyota", model: "Tundra", year_start: 2014, year_end: 2024, side_sqft: 108.0, back_sqft: 36.0, hood_sqft: 30.0, roof_sqft: 36.0, total_sqft: 320.0, corrected_sqft: 352.0 },
  { make: "Toyota", model: "Venza", year_start: 2021, year_end: 2024, side_sqft: 75.0, back_sqft: 28.0, hood_sqft: 22.0, roof_sqft: 40.0, total_sqft: 245.0, corrected_sqft: 269.5 },
  { make: "Volkswagen", model: "Atlas", year_start: 2018, year_end: 2024, side_sqft: 85.0, back_sqft: 32.0, hood_sqft: 24.0, roof_sqft: 48.0, total_sqft: 274.0, corrected_sqft: 301.4 },
  { make: "Volkswagen", model: "Golf", year_start: 2015, year_end: 2024, side_sqft: 62.0, back_sqft: 24.0, hood_sqft: 18.0, roof_sqft: 28.0, total_sqft: 194.0, corrected_sqft: 213.4 },
  { make: "Volkswagen", model: "ID.4", year_start: 2021, year_end: 2024, side_sqft: 72.0, back_sqft: 26.0, hood_sqft: 20.0, roof_sqft: 38.0, total_sqft: 228.0, corrected_sqft: 250.8 },
  { make: "Volkswagen", model: "Jetta", year_start: 2019, year_end: 2024, side_sqft: 65.0, back_sqft: 24.0, hood_sqft: 20.0, roof_sqft: 26.0, total_sqft: 200.0, corrected_sqft: 220.0 },
  { make: "Volkswagen", model: "Passat", year_start: 2016, year_end: 2024, side_sqft: 72.0, back_sqft: 26.0, hood_sqft: 24.0, roof_sqft: 30.0, total_sqft: 224.0, corrected_sqft: 246.4 },
  { make: "Volkswagen", model: "Taos", year_start: 2022, year_end: 2024, side_sqft: 68.0, back_sqft: 25.0, hood_sqft: 18.0, roof_sqft: 32.0, total_sqft: 208.0, corrected_sqft: 228.8 },
  { make: "Volkswagen", model: "Tiguan", year_start: 2018, year_end: 2024, side_sqft: 72.0, back_sqft: 26.0, hood_sqft: 20.0, roof_sqft: 38.0, total_sqft: 228.0, corrected_sqft: 250.8 },
  { make: "Volvo", model: "S60", year_start: 2019, year_end: 2024, side_sqft: 68.0, back_sqft: 24.0, hood_sqft: 22.0, roof_sqft: 26.0, total_sqft: 208.0, corrected_sqft: 228.8 },
  { make: "Volvo", model: "S90", year_start: 2017, year_end: 2024, side_sqft: 75.0, back_sqft: 28.0, hood_sqft: 26.0, roof_sqft: 32.0, total_sqft: 236.0, corrected_sqft: 259.6 },
  { make: "Volvo", model: "V60", year_start: 2019, year_end: 2024, side_sqft: 70.0, back_sqft: 26.0, hood_sqft: 22.0, roof_sqft: 35.0, total_sqft: 223.0, corrected_sqft: 245.3 },
  { make: "Volvo", model: "XC40", year_start: 2019, year_end: 2024, side_sqft: 68.0, back_sqft: 25.0, hood_sqft: 18.0, roof_sqft: 32.0, total_sqft: 208.0, corrected_sqft: 228.8 },
  { make: "Volvo", model: "XC60", year_start: 2018, year_end: 2024, side_sqft: 75.0, back_sqft: 28.0, hood_sqft: 22.0, roof_sqft: 40.0, total_sqft: 245.0, corrected_sqft: 269.5 },
  { make: "Volvo", model: "XC90", year_start: 2016, year_end: 2024, side_sqft: 85.0, back_sqft: 32.0, hood_sqft: 24.0, roof_sqft: 48.0, total_sqft: 274.0, corrected_sqft: 301.4 },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Check current count
    const { count: existingCount } = await supabase
      .from("vehicle_dimensions")
      .select("*", { count: "exact", head: true });

    if (existingCount && existingCount > 100) {
      return new Response(
        JSON.stringify({ message: `Database already has ${existingCount} vehicles. Skipping seed.` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert vehicles in batches
    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < VEHICLES.length; i += batchSize) {
      const batch = VEHICLES.slice(i, i + batchSize);
      
      const { error } = await supabase.from("vehicle_dimensions").insert(batch);
      
      if (error) {
        console.error(`Batch ${i / batchSize} error:`, error);
      } else {
        inserted += batch.length;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Seeded ${inserted} vehicles into vehicle_dimensions table`,
        total_vehicles: VEHICLES.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Seed error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
