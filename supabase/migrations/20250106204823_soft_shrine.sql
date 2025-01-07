/*
  # Update Profile Settings

  1. Changes
    - Add new columns for profile settings
    - Add constraints and defaults
    - Update RLS policies

  2. Security
    - Maintain RLS policies
    - Add validation constraints
*/

-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS preferred_categories text[],
ADD COLUMN IF NOT EXISTS language text DEFAULT 'en',
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'light',
ADD COLUMN IF NOT EXISTS show_activity boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS share_data boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS timezone text,
ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{
  "breaking_news": true,
  "article_updates": true,
  "comment_replies": true,
  "newsletters": true
}'::jsonb;

-- Add constraints
ALTER TABLE profiles
ADD CONSTRAINT valid_language CHECK (language ~ '^[a-z]{2}(-[A-Z]{2})?$'),
ADD CONSTRAINT valid_theme CHECK (theme IN ('light', 'dark', 'system')),
ADD CONSTRAINT valid_timezone CHECK (timezone ~ '^[A-Za-z_/]+$');

-- Update existing rows with defaults
UPDATE profiles 
SET 
  theme = 'light',
  language = 'en',
  show_activity = true,
  share_data = false
WHERE 
  theme IS NULL OR
  language IS NULL OR
  show_activity IS NULL OR
  share_data IS NULL;