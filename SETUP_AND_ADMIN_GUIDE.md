# CU Hostel Finder — Complete Setup & Admin Guide

> **v2.0** — Updated with hostel owner portal, amenities, rejection workflow, real-time chat, map coordinates, WhatsApp contact, and hostel comparison.

## Table of Contents
1. [Application Overview](#application-overview)
2. [Technology Stack](#technology-stack)
3. [Application Architecture](#application-architecture)
4. [Database Setup](#database-setup)
5. [Admin Role Creation](#admin-role-creation)
6. [Hostel Owner Account Setup](#hostel-owner-account-setup)
7. [Development Setup](#development-setup)
8. [Features Guide](#features-guide)
9. [Troubleshooting](#troubleshooting)

---

## Application Overview

CU Hostel Finder is a web-based platform for students of Central University Ghana to discover verified, off-campus hostels. The application provides:

- **Public Interface**: Browse, search, filter and compare hostels by location, price, amenities, and room type
- **Admin Dashboard**: Review submissions, approve/reject with feedback, manage all listings, chat with owners
- **Owner Portal**: Hostel owners submit and manage their own listings; resubmit after rejection; chat with admin
- **Authentication**: Secure role-based login (admin, hostel_owner) using Supabase Auth

### Key Features
- 🔍 Search & filter by name, location, price range, room type
- 🏷️ Amenities tags (WiFi, Power, Water, Kitchen, Security, Parking, Laundry, AC, Furnished, CCTV)
- 🗺️ Map view — real Google Maps embed per hostel
- ⚖️ Hostel comparison tool (up to 3 at a time)
- 💬 WhatsApp contact button — opens direct chat with hostel owner
- 📨 Admin ↔ Owner real-time in-platform chat (per hostel)
- ✅ Approval workflow with rejection reasons and resubmit
- ⭐ Student reviews and ratings
- 📸 Multi-image upload with lightbox gallery
- 📱 Responsive design for mobile and desktop

---

## Technology Stack

### Frontend
- **React 18.3.1** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling framework
- **Shadcn/ui** - UI component library
- **Lucide React** - Icon library
- **React Router DOM** - Client-side routing
- **React Query** - Data fetching and caching

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication
  - Row Level Security (RLS)
  - Storage for images
  - Real-time subscriptions

---

## Application Architecture

### Pages
1. **Index (`/`)** - Main landing page with hostel listings
2. **Admin Dashboard (`/admin`)** - Admin panel for managing hostels
3. **Admin Login (`/admin/login`)** - Authentication page for admins
4. **404 Page** - Not found page

### Key Components

#### Public Components
- `HostelCard` — Hostel preview card with compare toggle and amenity badges
- `HostelFilters` — Search, location, price, room-type filters
- `HostelDetailsModal` — Full hostel info, image gallery, Google Maps embed, WhatsApp button
- `HostelMapView` — Google Maps iframe grid of all hostel locations
- `HostelComparison` — Side-by-side comparison bar and dialog
- `AmenitiesBadges` — Displays amenity icons
- `Header` — Navigation header

#### Admin Components
- `AddHostelModal` — Create new hostels (with amenities + coordinates)
- `EditHostelModal` — Update existing hostels
- `RejectionReasonDialog` — Admin enters reason when rejecting a listing
- `ChatPanel` — Real-time messaging drawer with clear-chat support

#### Owner Components
- Owner Dashboard — View listings, rejection reasons, resubmit, chat with admin

### Database Schema

#### Tables

**1. hostels** (updated)
```
id               uuid        PK
name             text
description      text
location         text
address          text
manager_name     text
manager_email    text
manager_phone    text        (used for WhatsApp contact)
google_maps_link text        nullable
images           text[]      public image URLs
total_rooms      int
available_rooms  int
starting_price   int         Cedis per year
owner_id         uuid        FK → profiles (null for admin-added)
status           text        'pending' | 'approved' | 'rejected'
rejection_reason text        ⭐ Admin feedback on rejection
amenities        text[]      ⭐ ['wifi','water','kitchen',...]
latitude         numeric     ⭐ For Google Maps pin
longitude        numeric     ⭐ For Google Maps pin
created_at       timestamptz
updated_at       timestamptz auto-updated
```

**2. room_types**
```
id               uuid   PK
hostel_id        uuid   FK → hostels (cascade)
type             text   'Single (1-in-1)' | 'Double (2-in-1)' | 'Quad (4-in-1)'
price_per_student int
available_rooms  int
created_at       timestamptz
```

**3. profiles**
```
id        uuid  PK → auth.users
email     text
full_name text
created_at / updated_at
```

**4. user_roles**
```
id        uuid  PK
user_id   uuid  FK → auth.users
role      app_role  'admin' | 'hostel_owner' | 'user'
created_at
```

**5. reviews**
```
id            uuid  PK
hostel_id     uuid  FK → hostels (cascade)
student_name  text
student_email text
rating        int   1–5
comment       text
created_at    timestamptz
```

**6. chat_messages** ⭐ (new)
```
id          uuid  PK
hostel_id   uuid  FK → hostels (cascade delete)
sender_id   uuid  auth.uid()
sender_role text  'admin' | 'owner'
message     text
created_at  timestamptz
read_at     timestamptz  null = unread, timestamp = read receipt
```

#### Storage Buckets
- **hostel-images** — Public bucket for hostel images

---

## Database Setup

> **Full SQL is also in** `superbase_setup_guide.md` — use that as the canonical reference for a fresh install.

### Step 1: Create Database Tables

Execute the following SQL in your Supabase SQL Editor:

```sql
-- Role enum (must include hostel_owner)
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'hostel_owner');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Hostels table (includes ALL new columns)
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
  rejection_reason TEXT,          -- Admin feedback on rejection
  amenities TEXT[] DEFAULT '{}',  -- Amenity keys array
  latitude NUMERIC,               -- For Google Maps pin
  longitude NUMERIC,              -- For Google Maps pin
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id UUID NOT NULL REFERENCES public.hostels ON DELETE CASCADE,
  type TEXT NOT NULL,
  price_per_student INT NOT NULL,
  available_rooms INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id UUID NOT NULL REFERENCES public.hostels ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NEW: Chat messages (admin ↔ owner per hostel)
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('admin', 'owner')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ  -- null = unread
);

CREATE INDEX IF NOT EXISTS chat_messages_hostel_id_idx ON public.chat_messages(hostel_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON public.chat_messages(created_at DESC);
```

### Step 2: Create Database Functions

```sql
-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  new.updated_at = NOW();
  RETURN new;
END;
$$;
```

### Step 3: Create Triggers

```sql
-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update hostels updated_at
CREATE TRIGGER update_hostels_updated_at
  BEFORE UPDATE ON public.hostels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

### Step 4: Enable Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostels        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_types     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages  ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Hostels (students see approved; admin/owner see all relevant)
CREATE POLICY "View approved or own hostels"
  ON public.hostels FOR SELECT
  USING (status = 'approved' OR has_role(auth.uid(), 'admin') OR owner_id = auth.uid());
CREATE POLICY "Admins can insert hostels"
  ON public.hostels FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update hostels"
  ON public.hostels FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete hostels"
  ON public.hostels FOR DELETE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can insert their hostels"
  ON public.hostels FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'hostel_owner') AND owner_id = auth.uid());
CREATE POLICY "Owners can update their hostels"
  ON public.hostels FOR UPDATE
  USING (has_role(auth.uid(), 'hostel_owner') AND owner_id = auth.uid());
CREATE POLICY "Owners can delete their hostels"
  ON public.hostels FOR DELETE
  USING (has_role(auth.uid(), 'hostel_owner') AND owner_id = auth.uid());

-- Room types
CREATE POLICY "Anyone can view room types"
  ON public.room_types FOR SELECT USING (true);
CREATE POLICY "Admins can manage room types"
  ON public.room_types FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can manage their room types"
  ON public.room_types FOR ALL
  USING (
    has_role(auth.uid(), 'hostel_owner')
    AND EXISTS (
      SELECT 1 FROM public.hostels
      WHERE hostels.id = room_types.hostel_id AND hostels.owner_id = auth.uid()
    )
  );

-- Reviews
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Anyone can submit reviews"
  ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can delete reviews"
  ON public.reviews FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Chat messages (full CRUD for admin; scoped CRUD for owners)
CREATE POLICY "Admins can read all chat messages"
  ON public.chat_messages FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can read their hostel chat"
  ON public.chat_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.hostels WHERE hostels.id = chat_messages.hostel_id AND hostels.owner_id = auth.uid()));
CREATE POLICY "Admins can insert chat messages"
  ON public.chat_messages FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can insert chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.hostels WHERE hostels.id = chat_messages.hostel_id AND hostels.owner_id = auth.uid()) AND sender_id = auth.uid());
CREATE POLICY "Admins can update chat messages"
  ON public.chat_messages FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can update their chat messages"
  ON public.chat_messages FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.hostels WHERE hostels.id = chat_messages.hostel_id AND hostels.owner_id = auth.uid()));
CREATE POLICY "Admins can delete chat messages"
  ON public.chat_messages FOR DELETE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can delete their chat messages"
  ON public.chat_messages FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.hostels WHERE hostels.id = chat_messages.hostel_id AND hostels.owner_id = auth.uid()));
```

### Step 5: Create Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket named `hostel-images`
3. Make it **public**
4. Add the following storage policies:

```sql
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

### Step 6: Enable Realtime

The app requires Supabase Realtime for live chat and listing updates:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.hostels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
```

Or enable it from **Database → Replication** in your Supabase dashboard.

---

## Admin Role Creation

### Step 1 — Create the Admin User
1. Go to **Authentication → Users → Add user**
2. Enter email and password; enable **Auto Confirm User**
3. Click **Create user** and copy the **User UID**

### Step 2 — Assign Admin Role
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('PASTE-USER-UUID-HERE', 'admin');
```

### Step 3 — Verify
- Navigate to `/admin` in the app
- Login with the admin credentials → you should see the **Admin Dashboard**

### Security Best Practices

1. **Strong Passwords**: 12+ characters, mixed case, numbers, symbols
2. **Email Verification**: Enable in Supabase Auth settings for production
3. **2FA**: Enable two-factor authentication in Supabase Auth
4. **Limit Admin Accounts**: Only create admin accounts for trusted personnel
5. **Regular Review**: Periodically audit and remove inactive admin accounts

---

## Hostel Owner Account Setup

Hostel owners have their own portal at `/owner`. They can:
- Add and manage their hostel listings
- See rejection reasons and resubmit
- Chat with admin directly per hostel

### Step 1 — Create Owner User
1. Go to **Authentication → Users → Add user**
2. Enter the owner's email and password; enable **Auto Confirm User**
3. Copy the **User UID**

### Step 2 — Assign Owner Role
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('PASTE-OWNER-UUID-HERE', 'hostel_owner');
```

### Step 3 — Verify
- Navigate to `/owner` in the app
- Login → you should see the **Owner Dashboard**
- Owner can now add hostels (submitted as `pending` until admin approves)

---

## Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account
- Git

### Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd student-hostel-booking
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Supabase**

Create a `.env` file in the root directory (if not exists):

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://coruxfhqovudriizlemc.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Note**: The project already has these configured in `src/integrations/supabase/client.ts`

4. **Run database migrations**

All migrations are in `supabase/migrations/` directory. Execute them in order in your Supabase SQL Editor, or follow the [Database Setup](#database-setup) section above.

5. **Start development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in terminal)

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

---

## Features Guide

### For Students (Public)

#### Browse & Filter Hostels
- The home page shows all **approved** hostels in a card grid
- Use the left sidebar to filter by **location, price range, room type**
- Use the search bar on any filter to search by name or location
- Click **Reset** to clear all filters

#### Compare Hostels
1. Click **Compare** on up to **3** hostel cards
2. A sticky bar appears at the bottom — click **Compare Now**
3. A full side-by-side table opens showing price, rooms, amenities, and rating
4. Click **View Details** inside the comparison to open any hostel

#### Map View
1. Click the **Map** icon (toggle in the top-right of the listings section)
2. Each hostel shows a live Google Maps embed centred on its location
3. Hostels with lat/lng set show an exact pin; others show an address search
4. Click **Expand** on any card to see a larger map
5. Click the ↗ icon to open the location in Google Maps

#### View Hostel Details
1. Click **View Details** on any hostel card
2. The modal shows:
   - Image gallery with lightbox (click any image; navigate with arrows or keyboard)
   - Description, address, amenities badges
   - Real Google Maps embed (precise pin or address fallback)
   - Room types, prices, and availability
   - Student reviews and ratings
   - Contact: Call, Email, or **Chat on WhatsApp** buttons

#### WhatsApp Contact
- Clicking **Chat on WhatsApp** opens a direct WhatsApp conversation with the hostel manager
- The manager's phone number is pre-formatted (Ghanaian `0XX` numbers auto-convert to `233XX`)
- A helpful pre-written opening message is included

---

### For Hostel Owners

#### Access Owner Dashboard
1. Navigate to `/owner`
2. Login with your owner credentials
3. You'll see your **Owner Dashboard**

#### Add a Hostel Listing
1. Click **Add Hostel**
2. Fill in the form sections:
   - **Basic Info**: Name, location, address, description, Google Maps link
   - **Coordinates**: Latitude & Longitude (for map pin — right-click on Google Maps to copy)
   - **Amenities**: Select all that apply (WiFi, Power, Water, Kitchen, etc.)
   - **Manager Details**: Name, phone, email
   - **Room Types & Pricing**: Add as many room types as needed
   - **Images**: Upload multiple images
3. Click **Add Hostel** — it is submitted as **Pending** for admin review

#### Rejection & Resubmit
- If a listing is **rejected**, a red banner shows the admin's reason
- Fix the issues, then click **Resubmit** on the banner to send it back for review
- Edit the listing first with the **Edit** (pencil) button if needed

#### Chat with Admin
- Click the **Chat** (speech bubble) icon next to any hostel listing
- A real-time chat drawer opens for that specific hostel
- Messages appear live on both sides
- Either party can **clear the conversation** using the trash icon in the chat header

---

### For Administrators

#### Access Admin Dashboard
1. Navigate to `/admin`
2. Login with your admin email and password
3. You'll see the **Admin Dashboard**

#### Dashboard Overview
Stats shown:
- **Total Hostels** — all listings
- **Pending Review** — submissions awaiting action
- **Total Rooms** — across all listings
- **Available Rooms** — currently available

#### Approve / Reject a Hostel
- **✓ (check)** icon → immediately approves and makes visible to students
- **✗ (cross)** icon → opens the **Rejection Reason dialog**
  - Type a specific reason for rejection
  - Owner sees this reason on their dashboard and can fix and resubmit

#### Chat with Hostel Owner
- Click the **Chat** (speech bubble) icon on any hostel row
- A per-hostel real-time chat drawer opens
- Unread message count badge shown on the button
- Click the **trash icon** in chat header to clear the conversation

#### Add / Edit / Delete Hostels
- **Add**: Click **Add Hostel** (top right of the table)
- **Edit**: Click the pencil icon → toggle to Edit mode in the modal
- **Delete**: Click the trash icon → confirm in the dialog

#### Logout
Click **Logout** in the top-right corner of the dashboard

---

## Troubleshooting

| Problem | Solution |
|---|---|
| "Row violates row-level security policy" | Check the user's role in `user_roles`. Run: `SELECT * FROM public.user_roles WHERE user_id = 'YOUR_ID';` |
| Hostels not displaying | Ensure `status = 'approved'`. Check RLS SELECT policy on `hostels`. |
| Images not uploading | Verify `hostel-images` bucket is public. Check storage INSERT policy includes `hostel_owner`. |
| Can't login to admin panel | Verify user has `admin` role in `user_roles`. Clear browser cache. |
| Can't login to owner portal | Verify user has `hostel_owner` role in `user_roles`. |
| Chat not updating live | Confirm `chat_messages` is in the Realtime publication (Step 6 of DB setup). |
| Chat clear button not working | Ensure DELETE RLS policies for `chat_messages` are applied (see Step 4). |
| Map pin incorrect | Enter valid latitude/longitude in the hostel form. Right-click on Google Maps to copy coordinates. |
| WhatsApp button not working | Ensure the manager's phone is a valid Ghanaian number (0XX XXX XXXX or +233...). |
| Hostels show as pending forever | Admin must log in and approve listings from the Admin Dashboard. |

### Debug Mode

To enable detailed logging:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Check for error messages
4. Look for network tab to see API calls

### Getting Help

If you encounter issues:

1. Check the console logs for detailed error messages
2. Review Supabase logs in your project dashboard
3. Verify your database schema matches this documentation
4. Check that all migrations have been run successfully
5. Ensure environment variables are correctly configured

---

## Additional Resources

### Supabase Dashboard Links
- **Project URL**: https://coruxfhqovudriizlemc.supabase.co
- **Dashboard**: https://supabase.com/dashboard/project/coruxfhqovudriizlemc
- **SQL Editor**: https://supabase.com/dashboard/project/coruxfhqovudriizlemc/sql/new
- **Authentication**: https://supabase.com/dashboard/project/coruxfhqovudriizlemc/auth/users
- **Storage**: https://supabase.com/dashboard/project/coruxfhqovudriizlemc/storage/buckets

### Documentation
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)

---

## Maintenance and Updates

### Regular Maintenance Tasks

1. **Monitor Storage Usage**: Check hostel-images bucket size regularly
2. **Review Admin Accounts**: Audit admin users quarterly
3. **Database Backups**: Supabase automatically backs up, but verify in dashboard
4. **Update Dependencies**: Run `npm update` monthly to get security patches
5. **Monitor Logs**: Check Supabase logs for unusual activity

### Implemented Features (v2.0)

- ✅ Hostel owner portal with submission workflow
- ✅ Admin approval/rejection with reason feedback
- ✅ Resubmit after rejection
- ✅ Amenities tags (10 options)
- ✅ WhatsApp direct chat button
- ✅ Hostel comparison tool (up to 3)
- ✅ Google Maps embed per hostel (detail view)
- ✅ Map view for all listings
- ✅ Admin ↔ Owner real-time per-hostel chat
- ✅ Clear chat (both parties)
- ✅ Student reviews and ratings

### Future Enhancements

- Room availability calendar
- Email notifications (approval, rejection, new messages)
- Student booking / reservation system with payments
- Multi-language support (English / Twi)
- Mobile app (React Native)

---

**Last Updated**: 2026-05-21
**Version**: 2.0.0
**Project**: CU Hostel Finder — Central University Ghana Final Year Project
