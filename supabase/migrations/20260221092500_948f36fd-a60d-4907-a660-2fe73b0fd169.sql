
-- Step 1: Add hostel_owner to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hostel_owner';
