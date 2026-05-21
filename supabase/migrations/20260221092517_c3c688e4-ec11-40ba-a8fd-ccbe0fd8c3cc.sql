
-- Add owner_id and status columns to hostels
ALTER TABLE public.hostels 
ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved';

-- Update hostels SELECT policy
DROP POLICY IF EXISTS "Anyone can view hostels" ON public.hostels;
CREATE POLICY "Anyone can view approved hostels"
ON public.hostels FOR SELECT
USING (
  status = 'approved' 
  OR public.has_role(auth.uid(), 'admin') 
  OR (auth.uid() IS NOT NULL AND owner_id = auth.uid())
);

-- Hostels INSERT policies
DROP POLICY IF EXISTS "Admins can insert hostels" ON public.hostels;
CREATE POLICY "Admins can insert hostels"
ON public.hostels FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can insert their own hostels"
ON public.hostels FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'hostel_owner') 
  AND owner_id = auth.uid()
);

-- Hostels UPDATE policies
DROP POLICY IF EXISTS "Admins can update hostels" ON public.hostels;
CREATE POLICY "Admins can update hostels"
ON public.hostels FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can update their own hostels"
ON public.hostels FOR UPDATE
USING (
  public.has_role(auth.uid(), 'hostel_owner') 
  AND owner_id = auth.uid()
);

-- Hostels DELETE policies
DROP POLICY IF EXISTS "Admins can delete hostels" ON public.hostels;
CREATE POLICY "Admins can delete hostels"
ON public.hostels FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can delete their own hostels"
ON public.hostels FOR DELETE
USING (
  public.has_role(auth.uid(), 'hostel_owner') 
  AND owner_id = auth.uid()
);

-- Room types policies for owners
DROP POLICY IF EXISTS "Admins can insert room types" ON public.room_types;
CREATE POLICY "Admins can insert room types"
ON public.room_types FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can insert room types for their hostels"
ON public.room_types FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'hostel_owner')
  AND EXISTS (SELECT 1 FROM public.hostels WHERE id = hostel_id AND owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can update room types" ON public.room_types;
CREATE POLICY "Admins can update room types"
ON public.room_types FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can update room types for their hostels"
ON public.room_types FOR UPDATE
USING (
  public.has_role(auth.uid(), 'hostel_owner')
  AND EXISTS (SELECT 1 FROM public.hostels WHERE id = hostel_id AND owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can delete room types" ON public.room_types;
CREATE POLICY "Admins can delete room types"
ON public.room_types FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can delete room types for their hostels"
ON public.room_types FOR DELETE
USING (
  public.has_role(auth.uid(), 'hostel_owner')
  AND EXISTS (SELECT 1 FROM public.hostels WHERE id = hostel_id AND owner_id = auth.uid())
);

-- User roles: let users see their own roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

-- Storage policies for owners
CREATE POLICY "Owners can upload hostel images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'hostel-images' 
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hostel_owner'))
);

CREATE POLICY "Owners can update hostel images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'hostel-images' 
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hostel_owner'))
);

CREATE POLICY "Owners can delete hostel images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'hostel-images' 
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hostel_owner'))
);
