-- Create vehicle_data table for discover functionality
-- This table contains vehicle specifications for the dropdowns

CREATE TABLE IF NOT EXISTS vehicle_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER,
  make TEXT,
  model TEXT,
  trim TEXT,
  body_type TEXT,
  body_style TEXT,
  car_classification TEXT,
  drivetrain TEXT,
  drive_type TEXT,
  transmission TEXT,
  engine_configuration TEXT,
  cylinders INTEGER,
  displacement_l DECIMAL(4,2),
  power_hp INTEGER,
  torque_lbft INTEGER,
  weight_lbs INTEGER,
  image_url TEXT,
  country_of_origin TEXT,
  seating INTEGER,
  doors INTEGER,
  fuel_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add some sample data for testing
INSERT INTO vehicle_data (year, make, model, trim, body_type, transmission) VALUES
  (2024, 'Toyota', 'Camry', 'LE', 'Sedan', 'Automatic'),
  (2024, 'Toyota', 'Camry', 'XLE', 'Sedan', 'Automatic'),
  (2024, 'Toyota', 'Camry', 'XSE', 'Sedan', 'Automatic'),
  (2024, 'Honda', 'Civic', 'LX', 'Sedan', 'Manual'),
  (2024, 'Honda', 'Civic', 'EX', 'Sedan', 'Automatic'),
  (2024, 'Honda', 'Civic', 'Type R', 'Sedan', 'Manual'),
  (2024, 'Ford', 'F-150', 'XL', 'Truck', 'Automatic'),
  (2024, 'Ford', 'F-150', 'Lariat', 'Truck', 'Automatic'),
  (2024, 'Ford', 'F-150', 'Platinum', 'Truck', 'Automatic'),
  (2023, 'Toyota', 'Camry', 'LE', 'Sedan', 'Automatic'),
  (2023, 'Honda', 'Civic', 'LX', 'Sedan', 'Manual'),
  (2023, 'Ford', 'F-150', 'XL', 'Truck', 'Automatic'),
  (2022, 'Toyota', 'Camry', 'LE', 'Sedan', 'Automatic'),
  (2022, 'Honda', 'Civic', 'LX', 'Sedan', 'Manual'),
  (2022, 'Ford', 'F-150', 'XL', 'Truck', 'Automatic')
ON CONFLICT DO NOTHING;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicle_data_year ON vehicle_data (year DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_data_make ON vehicle_data (make) WHERE make IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicle_data_model ON vehicle_data (model) WHERE model IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicle_data_trim ON vehicle_data (trim) WHERE trim IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicle_data_year_make ON vehicle_data (year DESC, make);
CREATE INDEX IF NOT EXISTS idx_vehicle_data_make_model ON vehicle_data (make, model);

-- Enable RLS
ALTER TABLE vehicle_data ENABLE ROW LEVEL SECURITY;

-- Public read policy for vehicle data
CREATE POLICY "public_read_vehicle_data" ON vehicle_data
FOR SELECT USING (true);
