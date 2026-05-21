# CU Hostel Finder — Supabase Setup Guide

> **Version 2.0** — Updated to include all new features: hostel owner portal, amenities, rejection workflow, real-time chat, and map coordinates.

---

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Click **New Project**, choose a name, password, and region
3. Once created, go to **Settings → API** and copy your:
   - **Project URL** (e.g. `https://xxxx.supabase.co`)
   - **anon/public key**

---

## 2. Connect to Your App

The Supabase credentials are already configured in:

```
src/integrations/supabase/client.ts
```

If you need to update them, replace the values there directly.

---

## 3. Database Setup

Run all SQL below **in order** in your Supabase **SQL Editor** (`Dashboard → SQL Editor → New Query`).

---

### Step 1 — Enums & Core Tables

```sql
-- Role enum (includes hostel_owner)
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'hostel_owner');

-- Profiles table (auto-populated on sign-up)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Hostels table (includes all new columns)
CREATE TABLE public.hostels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  address TEXT NOT NULL,
  manager_name TEXT NOT NULL,
  manager_email TEXT NOT NULL,
  manager_phone TEXT NOT NULL,
  google_maps_link TEXT,
  images TEXT[] DEFAULT '{}',
  total_rooms INT NOT NULL DEFAULT 0,
  available_rooms INT NOT NULL DEFAULT 0,
  starting_price INT NOT NULL,
  owner_id UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'approved',
  -- New feature columns:
  rejection_reason TEXT,              -- Admin rejection feedback
  amenities TEXT[] DEFAULT '{}',      -- e.g. ['wifi','water','kitchen']
  latitude NUMERIC,                   -- For Google Maps pin
  longitude NUMERIC,                  -- For Google Maps pin
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Room types table
CREATE TABLE public.room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id UUID NOT NULL REFERENCES public.hostels ON DELETE CASCADE,
  type TEXT NOT NULL,
  price_per_student INT NOT NULL,
  available_rooms INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id UUID NOT NULL REFERENCES public.hostels ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chat messages table (admin ↔ hostel owner, per hostel)
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('admin', 'owner')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ    -- Null = unread; timestamp = read receipt
);
```

---

### Step 2 — Functions & Triggers

```sql
-- Check if a user has a given role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Auto-create profile on new user sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

-- Attach triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_hostels_updated_at
  BEFORE UPDATE ON public.hostels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

---

### Step 3 — Enable RLS & Policies

```sql
-- Enable Row Level Security
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostels        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_types     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages  ENABLE ROW LEVEL SECURITY;

-- ── Profiles ──────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ── User roles ────────────────────────────────────────────────────────────
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- ── Hostels ───────────────────────────────────────────────────────────────
-- Public can see approved; admins and owners see all their own listings
CREATE POLICY "View approved hostels or own hostels"
  ON public.hostels FOR SELECT
  USING (
    status = 'approved'
    OR has_role(auth.uid(), 'admin')
    OR owner_id = auth.uid()
  );
CREATE POLICY "Admins can insert hostels"
  ON public.hostels FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update hostels"
  ON public.hostels FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete hostels"
  ON public.hostels FOR DELETE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can insert hostels"
  ON public.hostels FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'hostel_owner') AND owner_id = auth.uid());
CREATE POLICY "Owners can update their hostels"
  ON public.hostels FOR UPDATE
  USING (has_role(auth.uid(), 'hostel_owner') AND owner_id = auth.uid());
CREATE POLICY "Owners can delete their hostels"
  ON public.hostels FOR DELETE
  USING (has_role(auth.uid(), 'hostel_owner') AND owner_id = auth.uid());

-- ── Room types ────────────────────────────────────────────────────────────
CREATE POLICY "Anyone can view room types"
  ON public.room_types FOR SELECT USING (true);
CREATE POLICY "Admins can insert room types"
  ON public.room_types FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update room types"
  ON public.room_types FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete room types"
  ON public.room_types FOR DELETE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can insert room types for their hostels"
  ON public.room_types FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'hostel_owner')
    AND EXISTS (
      SELECT 1 FROM public.hostels
      WHERE hostels.id = room_types.hostel_id AND hostels.owner_id = auth.uid()
    )
  );
CREATE POLICY "Owners can update room types for their hostels"
  ON public.room_types FOR UPDATE
  USING (
    has_role(auth.uid(), 'hostel_owner')
    AND EXISTS (
      SELECT 1 FROM public.hostels
      WHERE hostels.id = room_types.hostel_id AND hostels.owner_id = auth.uid()
    )
  );
CREATE POLICY "Owners can delete room types for their hostels"
  ON public.room_types FOR DELETE
  USING (
    has_role(auth.uid(), 'hostel_owner')
    AND EXISTS (
      SELECT 1 FROM public.hostels
      WHERE hostels.id = room_types.hostel_id AND hostels.owner_id = auth.uid()
    )
  );

-- ── Reviews ───────────────────────────────────────────────────────────────
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Anyone can submit reviews"
  ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can delete reviews"
  ON public.reviews FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- ── Chat messages ─────────────────────────────────────────────────────────
-- SELECT
CREATE POLICY "Admins can read all chat messages"
  ON public.chat_messages FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can read chat messages for their hostels"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.hostels
      WHERE hostels.id = chat_messages.hostel_id
        AND hostels.owner_id = auth.uid()
    )
  );

-- INSERT
CREATE POLICY "Admins can insert chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can insert chat messages for their hostels"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hostels
      WHERE hostels.id = chat_messages.hostel_id
        AND hostels.owner_id = auth.uid()
    )
    AND sender_id = auth.uid()
  );

-- UPDATE (read receipts)
CREATE POLICY "Admins can update chat messages"
  ON public.chat_messages FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can update chat messages for their hostels"
  ON public.chat_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.hostels
      WHERE hostels.id = chat_messages.hostel_id
        AND hostels.owner_id = auth.uid()
    )
  );

-- DELETE (clear conversation)
CREATE POLICY "Admins can delete chat messages"
  ON public.chat_messages FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can delete chat messages for their hostels"
  ON public.chat_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.hostels
      WHERE hostels.id = chat_messages.hostel_id
        AND hostels.owner_id = auth.uid()
    )
  );

-- Performance indexes
CREATE INDEX IF NOT EXISTS chat_messages_hostel_id_idx ON public.chat_messages(hostel_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON public.chat_messages(created_at DESC);
```

---

### Step 4 — Storage Bucket

```sql
-- Create the public image bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('hostel-images', 'hostel-images', true);

-- Storage policies
CREATE POLICY "Public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'hostel-images');

CREATE POLICY "Admin upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'hostel-images' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'hostel-images' AND has_role(auth.uid(), 'hostel_owner'));

CREATE POLICY "Admin delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'hostel-images' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner delete own images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'hostel-images' AND has_role(auth.uid(), 'hostel_owner'));
```

---

### Step 5 — Enable Realtime

The app uses Supabase Realtime for **live chat** and **hostel listing updates**. Enable it for the required tables:

1. Go to **Database → Replication** in your Supabase dashboard
2. Enable Realtime for:
   - `public.hostels`
   - `public.chat_messages`

Or run this SQL:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.hostels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
```

---

## 4. Create Your First Admin

### Step 1 — Create User
1. Go to **Authentication → Users → Add user** (enable **Auto Confirm User**)
2. Enter email and password
3. Copy the new user's **UUID**

### Step 2 — Assign Admin Role
Run this in the SQL Editor (replace the UUID):

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('PASTE-USER-UUID-HERE', 'admin');
```

### Step 3 — Verify
Login at `/admin` in the app — you should land on the Admin Dashboard.

---

## 5. Create a Hostel Owner Account

### Step 1 — Create User
Same as above: **Authentication → Users → Add user**

### Step 2 — Assign Owner Role

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('PASTE-OWNER-UUID-HERE', 'hostel_owner');
```

### Step 3 — Verify
The owner can now log in at `/owner` and add/manage their hostels.

---

## 6. Schema Reference

### `hostels` table (full column list)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `name` | text | Hostel name |
| `description` | text | About the hostel |
| `location` | text | Area / campus proximity |
| `address` | text | Full street address |
| `manager_name` | text | |
| `manager_email` | text | |
| `manager_phone` | text | Used for WhatsApp button |
| `google_maps_link` | text | Optional external link |
| `images` | text[] | Array of public image URLs |
| `total_rooms` | int | |
| `available_rooms` | int | |
| `starting_price` | int | Cedis per year |
| `owner_id` | uuid | FK → profiles (nullable for admin-added) |
| `status` | text | `'pending'` / `'approved'` / `'rejected'` |
| `rejection_reason` | text | ⭐ Admin feedback when rejected |
| `amenities` | text[] | ⭐ e.g. `['wifi','water','kitchen','security']` |
| `latitude` | numeric | ⭐ For Google Maps pin |
| `longitude` | numeric | ⭐ For Google Maps pin |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | Auto-updated via trigger |

> ⭐ = new columns added in the feature update

### `chat_messages` table (new)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `hostel_id` | uuid | FK → hostels (cascade delete) |
| `sender_id` | uuid | auth.uid() of the sender |
| `sender_role` | text | `'admin'` or `'owner'` |
| `message` | text | Message body |
| `created_at` | timestamptz | |
| `read_at` | timestamptz | Null = unread; set when recipient opens chat |

### Supported Amenity Keys

```
wifi · power · water · kitchen · security · parking · laundry · ac · furnished · cctv
```

---

## 7. Upgrading an Existing Database

If your database already has the original schema (without the new columns), run **only** this migration — it is safe to run on an existing project:

```sql
-- File: supabase/migrations/20260521120000_new_features.sql

-- Add new columns to hostels (IF NOT EXISTS is safe to re-run)
ALTER TABLE public.hostels
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('admin', 'owner')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all chat messages"
  ON public.chat_messages FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert chat messages"
  ON public.chat_messages FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update chat messages"
  ON public.chat_messages FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete chat messages"
  ON public.chat_messages FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can read their hostel chat messages"
  ON public.chat_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.hostels
    WHERE hostels.id = chat_messages.hostel_id AND hostels.owner_id = auth.uid()
  ));
CREATE POLICY "Owners can insert chat messages for their hostels"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hostels
      WHERE hostels.id = chat_messages.hostel_id AND hostels.owner_id = auth.uid()
    )
    AND sender_id = auth.uid()
  );
CREATE POLICY "Owners can update chat messages for their hostels"
  ON public.chat_messages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.hostels
    WHERE hostels.id = chat_messages.hostel_id AND hostels.owner_id = auth.uid()
  ));
CREATE POLICY "Owners can delete chat messages for their hostels"
  ON public.chat_messages FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.hostels
    WHERE hostels.id = chat_messages.hostel_id AND hostels.owner_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS chat_messages_hostel_id_idx ON public.chat_messages(hostel_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON public.chat_messages(created_at DESC);

-- Enable Realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
```

---

## 8. Troubleshooting

| Problem | Solution |
|---|---|
| "Row violates row-level security policy" | Check the user's role in `user_roles`. Run `SELECT * FROM public.user_roles WHERE user_id = 'YOUR_ID';` |
| Hostels not displaying | Ensure the hostel `status = 'approved'`. Check the RLS policy for SELECT. |
| Images not uploading | Verify the `hostel-images` bucket exists and is public. Check storage policies. |
| Can't login to admin/owner portal | Check the user has the correct role (`admin` or `hostel_owner`) in `user_roles`. |
| Chat not updating in real time | Confirm `public.chat_messages` is added to the Realtime publication (Step 5 above). |
| Map pin not showing correctly | Enter valid **latitude/longitude** in the hostel form. Get them by right-clicking a location on Google Maps. |

---

*Last updated: 2026-05-21 — v2.0 (added amenities, chat, rejection workflow, owner portal, map coordinates)*
