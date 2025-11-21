-- Add panel geometry field to vehicle_models for wrap application intelligence
ALTER TABLE vehicle_models
ADD COLUMN IF NOT EXISTS panel_geometry jsonb DEFAULT '{"panels": []}'::jsonb;

COMMENT ON COLUMN vehicle_models.panel_geometry IS 'Panel shapes and dimensions for accurate wrap application: [{"name": "side_1", "width_in": 186, "height_in": 54, "orientation": "horizontal"}, ...]';