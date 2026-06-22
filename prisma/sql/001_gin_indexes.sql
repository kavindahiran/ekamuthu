-- Run this AFTER your first `prisma migrate dev` creates the tables.
-- Prisma cannot express GIN indexes in schema.prisma — they must be added manually.
--
-- Apply with: npx prisma db execute --file prisma/sql/001_gin_indexes.sql

-- Allows efficient: WHERE "dietaryTags" @> ARRAY['HALAL']::"DietaryTag"[]
CREATE INDEX IF NOT EXISTS idx_listing_dietary_tags
  ON "DinnerListing" USING GIN ("dietaryTags");

-- Allows efficient matching of guest preferences to listing dietary tags
CREATE INDEX IF NOT EXISTS idx_user_dietary_prefs
  ON "User" USING GIN ("dietaryPreferences");
