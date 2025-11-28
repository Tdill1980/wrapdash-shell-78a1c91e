-- Add positioning columns to dashboard_hero_images table
ALTER TABLE dashboard_hero_images
ADD COLUMN background_position_desktop TEXT DEFAULT 'center',
ADD COLUMN background_position_mobile TEXT DEFAULT 'center';