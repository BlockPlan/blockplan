-- Add subscription_plan column to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS subscription_plan TEXT NOT NULL DEFAULT 'free';

-- Add check constraint for valid values
ALTER TABLE user_profiles
ADD CONSTRAINT valid_subscription_plan CHECK (subscription_plan IN ('free', 'pro', 'max'));
