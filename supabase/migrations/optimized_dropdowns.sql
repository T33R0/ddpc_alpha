-- Optimized Dropdown Functions
-- Replace inefficient pagination with single optimized queries

-- Function to get all distinct years
CREATE OR REPLACE FUNCTION get_vehicle_years()
RETURNS TABLE(year_value TEXT)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT year::TEXT as year_value
  FROM vehicle_data
  WHERE year IS NOT NULL
    AND year >= 1900
    AND year <= EXTRACT(YEAR FROM NOW()) + 1
  ORDER BY year_value DESC;
$$;

-- Function to get all distinct makes
CREATE OR REPLACE FUNCTION get_vehicle_makes(year_filter TEXT DEFAULT NULL)
RETURNS TABLE(make_value TEXT)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT make as make_value
  FROM vehicle_data
  WHERE make IS NOT NULL
    AND LENGTH(TRIM(make)) > 0
    AND (year_filter IS NULL OR year::TEXT = year_filter)
  ORDER BY make_value;
$$;

-- Function to get all distinct models for a make
CREATE OR REPLACE FUNCTION get_vehicle_models(make_filter TEXT, year_filter TEXT DEFAULT NULL)
RETURNS TABLE(model_value TEXT)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT model as model_value
  FROM vehicle_data
  WHERE model IS NOT NULL
    AND LENGTH(TRIM(model)) > 0
    AND make = make_filter
    AND (year_filter IS NULL OR year::TEXT = year_filter)
  ORDER BY model_value;
$$;

-- Function to get all distinct trims for make/model
CREATE OR REPLACE FUNCTION get_vehicle_trims(make_filter TEXT, model_filter TEXT, year_filter TEXT DEFAULT NULL)
RETURNS TABLE(trim_value TEXT)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT trim as trim_value
  FROM vehicle_data
  WHERE trim IS NOT NULL
    AND LENGTH(TRIM(trim)) > 0
    AND make = make_filter
    AND model = model_filter
    AND (year_filter IS NULL OR year::TEXT = year_filter)
  ORDER BY trim_value;
$$;

-- Add performance indexes for dropdown queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicle_data_year_make_model
ON vehicle_data (year DESC, make, model);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicle_data_make_model_trim
ON vehicle_data (make, model, trim);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicle_data_year_only
ON vehicle_data (year DESC)
WHERE year IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicle_data_make_only
ON vehicle_data (make)
WHERE make IS NOT NULL AND LENGTH(TRIM(make)) > 0;

-- Add comments for documentation
COMMENT ON FUNCTION get_vehicle_years() IS
'Replaces inefficient pagination with single optimized query for years';

COMMENT ON FUNCTION get_vehicle_makes(TEXT) IS
'Replaces inefficient pagination with single optimized query for makes, optionally filtered by year';

COMMENT ON FUNCTION get_vehicle_models(TEXT, TEXT) IS
'Replaces inefficient pagination with single optimized query for models, filtered by make and optionally year';

COMMENT ON FUNCTION get_vehicle_trims(TEXT, TEXT, TEXT) IS
'Replaces inefficient pagination with single optimized query for trims, filtered by make/model and optionally year';
