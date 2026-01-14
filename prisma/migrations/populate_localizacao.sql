-- Populate localizacao from lat/lng where localizacao is null
UPDATE "Tree" 
SET "localizacao" = ST_SetSRID(ST_MakePoint(lng, lat), 4326) 
WHERE "localizacao" IS NULL AND "lat" IS NOT NULL AND "lng" IS NOT NULL;
