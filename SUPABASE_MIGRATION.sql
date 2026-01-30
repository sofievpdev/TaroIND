-- Migration for adding support for free "Quick Decisions"
-- Execute this SQL query in Supabase SQL Editor

-- Add new column quick_decisions_used
ALTER TABLE users
ADD COLUMN IF NOT EXISTS quick_decisions_used INTEGER DEFAULT 0;

-- Set value to 0 for existing users
UPDATE users
SET quick_decisions_used = 0
WHERE quick_decisions_used IS NULL;

-- Check: view table structure
-- SELECT * FROM users LIMIT 5;
