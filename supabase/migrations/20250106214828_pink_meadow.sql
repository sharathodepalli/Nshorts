/*
  # Fix Profile Settings and RLS Policies

  1. Security
    - Drop and recreate RLS policies for profiles table
    - Add trigger for automatic profile creation
  
  2. Schema Updates
    - Ensure all required columns exist
    - Set default values for notification settings
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create comprehensive policies
CREATE POLICY "Profiles are viewable by owner"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create or replace profile handling function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    email_notifications,
    push_notifications,
    privacy_public_profile,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    true,
    true,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    updated_at = EXCLUDED.updated_at;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update existing profiles with default values
UPDATE profiles 
SET 
  email_notifications = COALESCE(email_notifications, true),
  push_notifications = COALESCE(push_notifications, true),
  privacy_public_profile = COALESCE(privacy_public_profile, true),
  updated_at = COALESCE(updated_at, now())
WHERE 
  email_notifications IS NULL 
  OR push_notifications IS NULL 
  OR privacy_public_profile IS NULL
  OR updated_at IS NULL;