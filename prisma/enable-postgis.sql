-- Enable PostGIS Extension for TreeInspector
-- Execute this in Neon SQL Editor: https://console.neon.tech

-- Step 1: Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Step 2: Verify installation
SELECT PostGIS_Version();

-- Step 3: (Optional) Verify geometry column in Tree table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Tree' AND column_name = 'localizacao';

-- Expected output: data_type should show 'USER-DEFINED' (PostGIS geometry type)
