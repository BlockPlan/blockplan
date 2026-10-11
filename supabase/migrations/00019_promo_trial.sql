-- Promotional/campaign trial grants.
--
-- When trial_active_until is in the future, getUserPlan treats a 'free'
-- subscription_plan as 'pro' for the duration. This lets us hand out time-
-- limited Pro access for marketing campaigns (e.g. re-engagement emails)
-- without touching Stripe. Existing Pro/Max subscribers are unaffected.
--
-- A null or past value is a no-op: the user keeps their subscription_plan
-- as stored. There is no cleanup job required — the check happens at read
-- time, so expired trials silently revert.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS trial_active_until TIMESTAMPTZ;

COMMENT ON COLUMN public.user_profiles.trial_active_until IS
  'If set and in the future, free users are treated as Pro. Used for campaign promo trials. Does not affect Stripe billing or existing paid subscriptions.';
