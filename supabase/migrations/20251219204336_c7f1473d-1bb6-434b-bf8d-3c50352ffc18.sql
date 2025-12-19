-- Import all detailed Mercedes and Freightliner Sprinter variants
-- These have individual panel SQFT for "with roof" vs "without roof" calculations

-- First, delete the generic Sprinter entry that's causing incorrect quotes
DELETE FROM vehicle_dimensions WHERE LOWER(model) = 'sprinter' AND make ILIKE '%Mercedes%';

-- Insert Mercedes Sprinter 2019-2020 variants (new body style)
INSERT INTO vehicle_dimensions (make, model, year_start, year_end, side_sqft, back_sqft, hood_sqft, roof_sqft, total_sqft, corrected_sqft)
VALUES 
  ('Mercedes', 'Sprinter 1500 - 144WB - High Roof', 2019, 2024, 156.2, 55.3, 27.2, 96.1, 490.9, 490.9),
  ('Mercedes', 'Sprinter 1500 - 144WB - Standard Roof', 2019, 2024, 136.7, 48.5, 27.2, 91.1, 440.3, 440.3),
  ('Mercedes', 'Sprinter 2500 - 144WB - High Roof', 2019, 2024, 156.2, 55.3, 27.2, 96.1, 490.9, 490.9),
  ('Mercedes', 'Sprinter 2500 - 144WB - Standard Roof', 2019, 2024, 136.7, 48.5, 27.2, 91.1, 440.3, 440.3),
  ('Mercedes', 'Sprinter 2500 - 170WB - High Roof', 2019, 2024, 183.7, 55.3, 27.2, 114.2, 564.1, 564.1),
  ('Mercedes', 'Sprinter 2500 - 170WB Extended - High Roof', 2019, 2024, 195.1, 55.3, 27.2, 125.2, 597.9, 597.9),
  ('Mercedes', 'Sprinter 3500 - 144WB - High Roof', 2019, 2024, 156.2, 55.3, 27.2, 96.1, 490.9, 490.9),
  ('Mercedes', 'Sprinter 3500 - 144WB - Standard Roof', 2019, 2024, 136.7, 48.5, 27.2, 91.1, 440.3, 440.3),
  ('Mercedes', 'Sprinter 3500 - 170WB - High Roof', 2019, 2024, 183.7, 55.3, 27.2, 114.2, 564.1, 564.1),
  ('Mercedes', 'Sprinter 3500 - 170WB Extended - High Roof', 2019, 2024, 195.1, 55.3, 27.2, 125.2, 597.9, 597.9),
  ('Mercedes', 'Sprinter 3500XD - 144WB - High Roof', 2019, 2024, 156.2, 55.3, 27.2, 96.1, 490.9, 490.9),
  ('Mercedes', 'Sprinter 3500XD - 144WB - Standard Roof', 2019, 2024, 136.7, 48.5, 27.2, 91.1, 440.3, 440.3),
  ('Mercedes', 'Sprinter 3500XD - 170WB - High Roof', 2019, 2024, 183.7, 55.3, 27.2, 114.2, 564.1, 564.1),
  ('Mercedes', 'Sprinter 3500XD - 170WB Extended - High Roof', 2019, 2024, 195.1, 55.3, 27.2, 125.2, 597.9, 597.9),
  ('Mercedes', 'Sprinter 4500 - 144WB - High Roof', 2019, 2024, 156.2, 55.3, 27.2, 96.1, 490.9, 490.9),
  ('Mercedes', 'Sprinter 4500 - 144WB - Standard Roof', 2019, 2024, 136.7, 48.5, 27.2, 91.1, 440.3, 440.3),
  ('Mercedes', 'Sprinter 4500 - 170WB - High Roof', 2019, 2024, 183.7, 55.3, 27.2, 114.2, 564.1, 564.1),
  ('Mercedes', 'Sprinter 4500 - 170WB Extended - High Roof', 2019, 2024, 195.1, 55.3, 27.2, 125.2, 597.9, 597.9)
ON CONFLICT DO NOTHING;

-- Insert Mercedes Sprinter 2008-2019 variants (older body style - Panel Van variants)
INSERT INTO vehicle_dimensions (make, model, year_start, year_end, side_sqft, back_sqft, hood_sqft, roof_sqft, total_sqft, corrected_sqft)
VALUES 
  ('Mercedes', 'Sprinter - 144WB - High Roof', 2008, 2019, 160.2, 53.0, 22.2, 81.0, 476.5, 476.5),
  ('Mercedes', 'Sprinter - 144WB - Standard Roof', 2008, 2019, 144.0, 46.1, 22.2, 81.0, 437.3, 437.3),
  ('Mercedes', 'Sprinter - 170WB Extended - High Roof', 2008, 2019, 200.1, 53.0, 22.2, 109.3, 584.6, 584.6),
  ('Mercedes', 'Sprinter - 170WB Extended - Mega Roof', 2008, 2019, 218.3, 57.1, 22.2, 109.3, 625.0, 625.0),
  ('Mercedes', 'Sprinter - 170WB Extended - Standard Roof', 2008, 2019, 179.9, 46.1, 22.2, 109.3, 537.2, 537.2),
  ('Mercedes', 'Sprinter - 170WB - High Roof', 2008, 2019, 190.3, 53.0, 22.2, 100.6, 556.4, 556.4),
  ('Mercedes', 'Sprinter - 170WB - Mega Roof', 2008, 2019, 205.5, 57.6, 22.2, 100.6, 591.4, 591.4),
  ('Mercedes', 'Sprinter - 170WB - Standard Roof', 2008, 2019, 169.3, 46.1, 22.2, 100.6, 507.6, 507.6)
ON CONFLICT DO NOTHING;

-- Insert Dodge Sprinter variants (2004-2007 and 2008-2019)
INSERT INTO vehicle_dimensions (make, model, year_start, year_end, side_sqft, back_sqft, hood_sqft, roof_sqft, total_sqft, corrected_sqft)
VALUES 
  ('Dodge', 'Sprinter - 118WB - High Roof', 2004, 2007, 127.3, 48.4, 15.8, 61.4, 380.2, 380.2),
  ('Dodge', 'Sprinter - 118WB - Standard Roof', 2004, 2007, 110.9, 40.9, 15.8, 61.4, 339.9, 339.9),
  ('Dodge', 'Sprinter - 140WB - High Roof', 2004, 2007, 140.6, 46.1, 15.8, 75.6, 418.7, 418.7),
  ('Dodge', 'Sprinter - 140WB - Standard Roof', 2004, 2007, 127.4, 40.9, 15.8, 75.6, 387.1, 387.1),
  ('Dodge', 'Sprinter - 158WB - High Roof', 2004, 2007, 166.1, 46.1, 15.8, 94.0, 487.9, 487.9),
  ('Dodge', 'Sprinter - 158WB - Standard Roof', 2004, 2007, 149.2, 40.9, 15.8, 94.0, 449.2, 449.2),
  ('Dodge', 'Sprinter - 144WB - High Roof', 2008, 2019, 160.2, 53.0, 22.2, 81.0, 476.5, 476.5),
  ('Dodge', 'Sprinter - 144WB - Standard Roof', 2008, 2019, 144.0, 46.1, 22.2, 81.0, 437.3, 437.3),
  ('Dodge', 'Sprinter - 170WB Extended - High Roof', 2008, 2019, 200.1, 53.0, 22.2, 109.3, 584.6, 584.6),
  ('Dodge', 'Sprinter - 170WB Extended - Mega Roof', 2008, 2019, 218.3, 57.1, 22.2, 109.3, 625.0, 625.0),
  ('Dodge', 'Sprinter - 170WB Extended - Standard Roof', 2008, 2019, 179.9, 46.1, 22.2, 109.3, 537.2, 537.2),
  ('Dodge', 'Sprinter - 170WB - High Roof', 2008, 2019, 190.3, 53.0, 22.2, 100.6, 556.4, 556.4),
  ('Dodge', 'Sprinter - 170WB - Mega Roof', 2008, 2019, 205.5, 57.6, 22.2, 100.6, 591.4, 591.4),
  ('Dodge', 'Sprinter - 170WB - Standard Roof', 2008, 2019, 169.3, 46.1, 22.2, 100.6, 507.6, 507.6)
ON CONFLICT DO NOTHING;

-- Insert Freightliner Sprinter variants
INSERT INTO vehicle_dimensions (make, model, year_start, year_end, side_sqft, back_sqft, hood_sqft, roof_sqft, total_sqft, corrected_sqft)
VALUES 
  ('Freightliner', 'Sprinter 2500 - 144WB - High Roof', 2019, 2024, 156.2, 55.3, 27.2, 96.1, 490.9, 490.9),
  ('Freightliner', 'Sprinter 2500 - 144WB - Standard Roof', 2019, 2024, 136.7, 48.5, 27.2, 91.1, 440.3, 440.3),
  ('Freightliner', 'Sprinter 2500 - 170WB - High Roof', 2019, 2024, 183.7, 55.3, 27.2, 114.2, 564.1, 564.1),
  ('Freightliner', 'Sprinter 2500 - 170WB Extended - High Roof', 2019, 2024, 195.1, 55.3, 27.2, 125.2, 597.9, 597.9),
  ('Freightliner', 'Sprinter 3500 - 144WB - High Roof', 2019, 2024, 156.2, 55.3, 27.2, 96.1, 490.9, 490.9),
  ('Freightliner', 'Sprinter 3500 - 144WB - Standard Roof', 2019, 2024, 136.7, 48.5, 27.2, 91.1, 440.3, 440.3),
  ('Freightliner', 'Sprinter 3500 - 170WB - High Roof', 2019, 2024, 183.7, 55.3, 27.2, 114.2, 564.1, 564.1),
  ('Freightliner', 'Sprinter 3500 - 170WB Extended - High Roof', 2019, 2024, 195.1, 55.3, 27.2, 125.2, 597.9, 597.9),
  ('Freightliner', 'Sprinter 3500XD - 144WB - High Roof', 2019, 2024, 156.2, 55.3, 27.2, 96.1, 490.9, 490.9),
  ('Freightliner', 'Sprinter 3500XD - 170WB - High Roof', 2019, 2024, 183.7, 55.3, 27.2, 114.2, 564.1, 564.1),
  ('Freightliner', 'Sprinter 3500XD - 170WB Extended - High Roof', 2019, 2024, 195.1, 55.3, 27.2, 125.2, 597.9, 597.9),
  ('Freightliner', 'Sprinter 4500 - 144WB - High Roof', 2019, 2024, 156.2, 55.3, 27.2, 96.1, 490.9, 490.9),
  ('Freightliner', 'Sprinter 4500 - 170WB - High Roof', 2019, 2024, 183.7, 55.3, 27.2, 114.2, 564.1, 564.1),
  ('Freightliner', 'Sprinter 4500 - 170WB Extended - High Roof', 2019, 2024, 195.1, 55.3, 27.2, 125.2, 597.9, 597.9),
  ('Freightliner', 'Sprinter - 144WB - High Roof', 2008, 2019, 160.2, 53.0, 22.2, 81.0, 476.5, 476.5),
  ('Freightliner', 'Sprinter - 144WB - Standard Roof', 2008, 2019, 144.0, 46.1, 22.2, 81.0, 437.3, 437.3),
  ('Freightliner', 'Sprinter - 170WB Extended - High Roof', 2008, 2019, 200.1, 53.0, 22.2, 109.3, 584.6, 584.6),
  ('Freightliner', 'Sprinter - 170WB - High Roof', 2008, 2019, 190.3, 53.0, 22.2, 100.6, 556.4, 556.4),
  ('Freightliner', 'Sprinter - 170WB - Standard Roof', 2008, 2019, 169.3, 46.1, 22.2, 100.6, 507.6, 507.6)
ON CONFLICT DO NOTHING;

-- Insert Ford Transit variants for completeness
INSERT INTO vehicle_dimensions (make, model, year_start, year_end, side_sqft, back_sqft, hood_sqft, roof_sqft, total_sqft, corrected_sqft)
VALUES 
  ('Ford', 'Transit 150 - 130WB - Low Roof', 2015, 2024, 120.0, 40.0, 22.0, 70.0, 372.0, 372.0),
  ('Ford', 'Transit 150 - 130WB - Medium Roof', 2015, 2024, 135.0, 45.0, 22.0, 75.0, 407.0, 407.0),
  ('Ford', 'Transit 250 - 130WB - Low Roof', 2015, 2024, 120.0, 40.0, 22.0, 70.0, 372.0, 372.0),
  ('Ford', 'Transit 250 - 130WB - Medium Roof', 2015, 2024, 135.0, 45.0, 22.0, 75.0, 407.0, 407.0),
  ('Ford', 'Transit 250 - 148WB - High Roof', 2015, 2024, 155.0, 50.0, 22.0, 90.0, 477.0, 477.0),
  ('Ford', 'Transit 350 - 148WB - High Roof', 2015, 2024, 155.0, 50.0, 22.0, 90.0, 477.0, 477.0),
  ('Ford', 'Transit 350 - 148WB Extended - High Roof', 2015, 2024, 175.0, 50.0, 22.0, 100.0, 522.0, 522.0)
ON CONFLICT DO NOTHING;

-- Insert RAM ProMaster variants
INSERT INTO vehicle_dimensions (make, model, year_start, year_end, side_sqft, back_sqft, hood_sqft, roof_sqft, total_sqft, corrected_sqft)
VALUES 
  ('RAM', 'ProMaster 1500 - 118WB - Low Roof', 2014, 2024, 125.0, 42.0, 20.0, 65.0, 377.0, 377.0),
  ('RAM', 'ProMaster 1500 - 136WB - High Roof', 2014, 2024, 155.0, 50.0, 20.0, 85.0, 465.0, 465.0),
  ('RAM', 'ProMaster 2500 - 136WB - High Roof', 2014, 2024, 155.0, 50.0, 20.0, 85.0, 465.0, 465.0),
  ('RAM', 'ProMaster 2500 - 159WB - High Roof', 2014, 2024, 175.0, 50.0, 20.0, 100.0, 520.0, 520.0),
  ('RAM', 'ProMaster 3500 - 159WB - High Roof', 2014, 2024, 175.0, 50.0, 20.0, 100.0, 520.0, 520.0),
  ('RAM', 'ProMaster 3500 - 159WB Extended - High Roof', 2014, 2024, 195.0, 50.0, 20.0, 110.0, 565.0, 565.0)
ON CONFLICT DO NOTHING;