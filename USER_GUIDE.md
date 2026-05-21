# User Guide - Central University Hostel Management System

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Public Hostel Listing](#public-hostel-listing)
4. [Admin Access](#admin-access)
5. [Admin Dashboard](#admin-dashboard)
6. [Managing Hostels](#managing-hostels)
7. [Troubleshooting](#troubleshooting)

## Introduction

Welcome to the Central University Hostel Management System! This platform helps students find and compare hostel accommodations near Central University, and provides administrators with tools to manage hostel listings.

### Who is this for?

- **Students**: Browse and compare available hostels
- **Administrators**: Manage hostel listings and information

## Getting Started

### Accessing the Platform

The platform has two main sections:

1. **Public Site**: https://your-app-url.com
   - View all available hostels
   - Filter and search hostels
   - See detailed information about each hostel

2. **Admin Portal**: https://your-app-url.com/admin
   - Requires admin login
   - Manage hostel listings
   - View dashboard statistics

## Public Hostel Listing

### Viewing Hostels

1. Navigate to the homepage
2. Browse the list of available hostels
3. Each hostel card shows:
   - Hostel name
   - Location
   - Starting price
   - Available rooms
   - Manager contact information
   - Hostel images

### Using Filters

You can filter hostels by:

- **Location**: Select specific areas (e.g., Agape, Okokroko)
- **Price Range**: Set minimum and maximum price
- **Available Rooms**: Choose minimum number of rooms needed

**To apply filters:**
1. Click the "Filters" button
2. Select your criteria
3. Click "Apply Filters"
4. Click "Clear Filters" to reset

### Viewing Hostel Details

To see complete information about a hostel:

1. Click "View Details" on any hostel card
2. A detailed modal will show:
   - Full description
   - Complete address and location
   - Google Maps link
   - Manager contact details
   - All available room types and prices
   - Photo gallery

### Room Types & Pricing

Each hostel offers different room configurations:

- **1-in-a-room**: Private room, highest price
- **2-in-a-room**: Shared with one person
- **3-in-a-room**: Shared with two people  
- **4-in-a-room**: Shared with three people, typically lowest price

Prices shown are **per student** for the academic year or semester.

## Admin Access

### First-Time Setup

**IMPORTANT**: Before you can access the admin dashboard, an admin user must be created. Contact your system administrator or follow these steps:

1. Create a Supabase account (if you haven't)
2. Access the Supabase dashboard for this project
3. Create a user in Authentication → Users
4. Add admin role to the user in the database

**For detailed setup instructions, see the [DEVELOPMENT.md](DEVELOPMENT.md) file.**

### Logging In

1. Navigate to `/admin` or click "Admin Portal" link
2. Enter your admin email and password
3. Click "Sign In"

**Security Notes:**
- Only users with admin role can access the dashboard
- Sessions are secure and automatically expire
- Always log out when finished

### Login Troubleshooting

**"Invalid login credentials" error:**
- Verify your email and password are correct
- Ensure your account has been created in Supabase
- Contact your administrator if problems persist

**"Unauthorized: Admin access required" error:**
- Your account exists but doesn't have admin privileges
- Contact your system administrator to grant admin role

## Admin Dashboard

### Dashboard Overview

After logging in, you'll see the admin dashboard with:

1. **Statistics Cards**:
   - Total number of hostels
   - Total rooms across all hostels
   - Currently available rooms
   - Overall occupancy rate

2. **Quick Actions**:
   - Add New Hostel button
   - Logout button

3. **Hostels List**:
   - All hostels with key information
   - Action buttons for each hostel

### Navigation

- **Header**: Shows you're in Admin Dashboard
- **Back to Hostels**: Returns to public listing
- **Logout**: Signs you out and returns to login page

## Managing Hostels

### Adding a New Hostel

1. Click the "+ Add Hostel" button
2. Fill in the hostel information form:

   **Basic Information:**
   - Hostel Name (required)
   - Description (required)
   - Location (required) - e.g., "Agape"
   - Full Address (required)
   - Google Maps Link (optional but recommended)

   **Manager Information:**
   - Manager Name (required)
   - Manager Email (required)
   - Manager Phone (required)

   **Images:**
   - Image URLs (optional)
   - Add multiple images by clicking "+ Add Image URL"
   - Remove images with the "×" button

   **Room Types:**
   - At least one room type is required
   - For each room type, specify:
     - Type (1-in-a-room, 2-in-a-room, etc.)
     - Price per student
     - Number of available rooms
   - Add more room types with "+ Add Room Type"
   - Remove room types with "Remove" button

3. Click "Add Hostel" to save
4. Success message will appear
5. New hostel appears in the list immediately

**Tips:**
- Provide accurate manager contact information
- Include high-quality images when possible
- Double-check prices before saving
- Ensure room type information is accurate

### Editing a Hostel

1. Find the hostel you want to edit
2. Click the "Edit" button (pencil icon)
3. Update any information in the form
4. Modify room types:
   - Edit existing room types
   - Add new room types
   - Remove room types
5. Click "Update Hostel" to save changes
6. Changes are reflected immediately

**Notes:**
- All fields can be updated
- Total and available rooms are calculated automatically
- Starting price is updated based on lowest room price

### Deleting a Hostel

1. Find the hostel you want to remove
2. Click the "Delete" button (trash icon)
3. A confirmation dialog appears
4. Click "Delete" to confirm or "Cancel" to abort
5. Hostel is permanently removed from the system

**Warning:**
- Deletion is permanent and cannot be undone
- All associated room types are also deleted
- Double-check before confirming deletion

### Viewing Hostel Details (Admin)

1. Click the "View" button (eye icon) on any hostel
2. See all hostel information in a modal
3. Includes all room types and pricing
4. Close modal to return to dashboard

## Best Practices

### For Administrators

**Data Quality:**
- Keep hostel information up-to-date
- Verify manager contact details regularly
- Update available rooms as they change
- Use descriptive hostel names

**Pricing:**
- Confirm prices with hostel managers
- Specify if prices are per semester or year
- Update prices at the start of each academic year

**Images:**
- Use clear, recent photos
- Show different areas (rooms, common areas, exterior)
- Ensure images load quickly
- Use HTTPS URLs for images

**Security:**
- Never share your admin credentials
- Always log out after managing hostels
- Use a strong, unique password
- Report any suspicious activity

## Troubleshooting

### Common Issues

**"Failed to fetch hostels" error:**
- Check your internet connection
- Refresh the page
- Contact technical support if persists

**Images not loading:**
- Verify image URLs are correct and accessible
- Check if images are using HTTPS
- Try a different image URL

**Changes not saving:**
- Ensure all required fields are filled
- Check for validation errors (red text)
- Verify internet connection
- Try again or contact support

**Can't log in:**
- Verify your email and password
- Check if your account has admin privileges
- Clear browser cache and cookies
- Contact your system administrator

**Page not loading:**
- Check internet connection
- Try refreshing the page
- Clear browser cache
- Try a different browser
- Check if you're using a supported browser

### Browser Compatibility

This application works best with:
- ✅ Google Chrome (latest version)
- ✅ Mozilla Firefox (latest version)
- ✅ Microsoft Edge (latest version)
- ✅ Safari (latest version)

**Not supported:**
- ❌ Internet Explorer

### Getting Help

If you encounter issues not covered in this guide:

1. Check the browser console for error messages
2. Take a screenshot of the issue
3. Note what you were trying to do when the error occurred
4. Contact your system administrator with:
   - Description of the issue
   - Screenshot (if applicable)
   - Browser and device information
   - Steps to reproduce the issue

## Tips for Students

### Finding the Right Hostel

1. **Use Filters Effectively:**
   - Start with location preferences
   - Set a realistic price range
   - Consider minimum room requirements

2. **Compare Options:**
   - View details of multiple hostels
   - Compare room types and prices
   - Check location on Google Maps

3. **Contact Managers:**
   - Call or email for more information
   - Ask about availability
   - Inquire about amenities
   - Schedule a visit before committing

4. **Consider Factors:**
   - Distance to campus
   - Safety of the area
   - Available amenities
   - Room configuration preferences
   - Total cost per semester/year

### Before Booking

- Visit the hostel in person
- Meet the hostel manager
- Read any rental agreements carefully
- Confirm the exact price and what's included
- Ask about payment terms
- Inquire about rules and regulations

## Privacy & Data

### Information Displayed

**Public Information:**
- Hostel names and locations
- Room availability and pricing
- Manager contact information
- Hostel images and descriptions

**Private Information:**
- Admin login credentials
- Personal admin account details

### Data Security

- All admin sessions are encrypted
- Passwords are never stored in plain text
- Login sessions expire for security
- Database is secure and regularly backed up

## Feedback

We value your feedback to improve this system. If you have suggestions, please contact your system administrator.

---

# Supabase Setup & User Roles Guide

This section provides detailed instructions for setting up Supabase, with special focus on user role management and admin creation.

## Supabase Project Setup

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click **"New Project"**
4. Fill in the project details:
   - **Name**: `student-hostel-booking`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Select the closest region to your users
5. Click **"Create new project"** and wait for initialization

### Step 2: Get Your API Keys

1. Go to **Settings** → **API** in your Supabase dashboard
2. Note down these values:
   - **Project URL**: `https://your-project-ref.supabase.co`
   - **anon public key**: Used for client-side requests
   - **service_role key**: Used for admin operations (keep this secret!)

---

## Database Schema Setup

### Create the Required Tables

Run the following SQL commands in the **SQL Editor**:

#### 1. Create User Profiles Table

```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

#### 2. Create App Role Enum and User Roles Table

```sql
-- Create enum for application roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- CRITICAL: Roles must be in separate table for security
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
```

#### 3. Create Hostels Table

```sql
CREATE TABLE public.hostels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    address TEXT NOT NULL,
    google_maps_link TEXT,
    manager_name TEXT NOT NULL,
    manager_phone TEXT NOT NULL,
    manager_email TEXT NOT NULL,
    images TEXT[] DEFAULT '{}'::TEXT[],
    total_rooms INTEGER NOT NULL DEFAULT 0,
    available_rooms INTEGER NOT NULL DEFAULT 0,
    starting_price INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hostels ENABLE ROW LEVEL SECURITY;
```

#### 4. Create Room Types Table

```sql
CREATE TABLE public.room_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hostel_id UUID REFERENCES public.hostels(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    price_per_student INTEGER NOT NULL,
    available_rooms INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
```

---

## User Roles System

### Understanding the Role System

**CRITICAL SECURITY NOTE**: Roles are stored in a separate `user_roles` table, NOT in the profiles or users table. This prevents privilege escalation attacks.

The system uses two roles:
- **admin**: Full access to manage hostels, room types, and other admin users
- **user**: Basic access (view hostels only)

### Create the Role-Checking Function

This function is used by RLS policies to check user permissions without causing recursive issues:

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
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
```

### Why SECURITY DEFINER is Important

- The `SECURITY DEFINER` attribute allows the function to run with the privileges of its creator
- This bypasses RLS policies on the `user_roles` table, preventing infinite recursion
- The `SET search_path = public` prevents schema hijacking attacks

---

## Creating Admin Users

### Method 1: Using Supabase Dashboard (Recommended for First Admin)

#### Step 1: Create the User Account

1. Go to **Authentication** → **Users** in Supabase dashboard
2. Click **"Add user"** → **"Create new user"**
3. Enter:
   - **Email**: admin@example.com
   - **Password**: A strong password
4. Click **"Create user"**
5. **Copy the User ID** (UUID) shown in the user list

#### Step 2: Assign Admin Role via SQL

1. Go to **SQL Editor**
2. Run this SQL (replace the UUID with your user's ID):

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR-USER-UUID-HERE', 'admin');
```

### Method 2: Complete SQL Method

```sql
-- First, verify the user exists
SELECT id, email FROM auth.users WHERE email = 'admin@example.com';

-- Then assign the admin role (replace with actual UUID)
INSERT INTO public.user_roles (user_id, role)
VALUES ('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'admin');
```

### Method 3: Auto-Profile Trigger

Set up a trigger to automatically create profiles when users sign up:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

### Verifying Admin Role Assignment

```sql
SELECT 
    ur.user_id,
    p.email,
    p.full_name,
    ur.role,
    ur.created_at
FROM public.user_roles ur
JOIN public.profiles p ON ur.user_id = p.id
WHERE ur.role = 'admin';
```

---

## Row Level Security (RLS) Policies

### Profiles Table Policies

```sql
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);
```

### User Roles Table Policies

```sql
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
USING (has_role(auth.uid(), 'admin'));
```

### Hostels Table Policies

```sql
CREATE POLICY "Anyone can view hostels"
ON public.hostels FOR SELECT
USING (true);

CREATE POLICY "Admins can insert hostels"
ON public.hostels FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update hostels"
ON public.hostels FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete hostels"
ON public.hostels FOR DELETE
USING (has_role(auth.uid(), 'admin'));
```

### Room Types Table Policies

```sql
CREATE POLICY "Anyone can view room types"
ON public.room_types FOR SELECT
USING (true);

CREATE POLICY "Admins can insert room types"
ON public.room_types FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update room types"
ON public.room_types FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete room types"
ON public.room_types FOR DELETE
USING (has_role(auth.uid(), 'admin'));
```

---

## Storage Setup

### Create the Hostel Images Bucket

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('hostel-images', 'hostel-images', true);
```

### Storage Policies

```sql
CREATE POLICY "Anyone can view hostel images"
ON storage.objects FOR SELECT
USING (bucket_id = 'hostel-images');

CREATE POLICY "Admins can upload hostel images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'hostel-images' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update hostel images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'hostel-images' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete hostel images"
ON storage.objects FOR DELETE
USING (bucket_id = 'hostel-images' AND has_role(auth.uid(), 'admin'));
```

---

## Quick Reference

### Add Admin Role
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('user-uuid', 'admin');
```

### Remove Admin Role
```sql
DELETE FROM public.user_roles 
WHERE user_id = 'user-uuid' AND role = 'admin';
```

### List All Admins
```sql
SELECT p.email, ur.created_at
FROM public.user_roles ur
JOIN public.profiles p ON ur.user_id = p.id
WHERE ur.role = 'admin';
```

---

## Security Best Practices

1. **Never store roles in the profiles table** - Always use a separate `user_roles` table
2. **Use SECURITY DEFINER functions** - For role checking to prevent RLS recursion
3. **Keep service_role key secret** - Never expose it in client-side code
4. **Regular audits** - Periodically review admin users and their access
5. **Strong passwords** - Enforce strong password policies for admin accounts

---

**Version**: 1.0  
**Last Updated**: December 2024  
**For Technical Support**: Contact your system administrator
