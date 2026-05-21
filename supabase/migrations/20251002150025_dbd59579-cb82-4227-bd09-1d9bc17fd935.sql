-- Create hostels table
CREATE TABLE public.hostels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  location text NOT NULL,
  address text NOT NULL,
  google_maps_link text,
  manager_name text NOT NULL,
  manager_phone text NOT NULL,
  manager_email text NOT NULL,
  images text[] DEFAULT '{}',
  total_rooms integer NOT NULL DEFAULT 0,
  starting_price integer NOT NULL,
  available_rooms integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create room_types table
CREATE TABLE public.room_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hostel_id uuid NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('Single (1-in-1)', 'Double (2-in-1)', 'Quad (4-in-1)')),
  price_per_student integer NOT NULL,
  available_rooms integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hostels (public read, admin write)
CREATE POLICY "Anyone can view hostels"
  ON public.hostels
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert hostels"
  ON public.hostels
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update hostels"
  ON public.hostels
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete hostels"
  ON public.hostels
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for room_types (public read, admin write)
CREATE POLICY "Anyone can view room types"
  ON public.room_types
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert room types"
  ON public.room_types
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update room types"
  ON public.room_types
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete room types"
  ON public.room_types
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates on hostels
CREATE TRIGGER update_hostels_updated_at
  BEFORE UPDATE ON public.hostels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data from mock hostels
INSERT INTO public.hostels (name, description, location, address, google_maps_link, manager_name, manager_phone, manager_email, images, total_rooms, starting_price, available_rooms)
VALUES 
  ('Unity Hostel', 'Modern student accommodation with excellent facilities and 24/7 security. Located in the heart of East Legon.', 'East Legon', 'East Legon, Accra, Ghana', 'https://maps.google.com/?q=East+Legon+Accra', 'Kwame Asante', '+233 24 123 4567', 'kwame@unityhostel.com', '{}', 20, 600, 20),
  ('Excellence Lodge', 'Premium student housing with modern amenities, study rooms, and recreational facilities.', 'McCarthy Hill', 'McCarthy Hill, Accra, Ghana', 'https://maps.google.com/?q=McCarthy+Hill+Accra', 'Akosua Mensah', '+233 26 987 6543', 'akosua@excellencelodge.com', '{}', 20, 500, 20),
  ('Campus View Residence', 'Affordable student accommodation with beautiful campus views and easy access to university facilities.', 'Dansoman', 'Dansoman, Accra, Ghana', 'https://maps.google.com/?q=Dansoman+Accra', 'Samuel Osei', '+233 20 456 7890', 'samuel@campusview.com', '{}', 23, 400, 23),
  ('Golden Gate Hostel', 'Quality student housing with modern facilities, high-speed internet, and 24/7 power supply.', 'Adenta', 'Adenta Municipality, Accra, Ghana', 'https://maps.google.com/?q=Adenta+Accra', 'Grace Adjei', '+233 23 789 0123', 'grace@goldengatehostel.com', '{}', 20, 650, 20);

-- Insert room types for Unity Hostel
INSERT INTO public.room_types (hostel_id, type, price_per_student, available_rooms)
SELECT id, 'Single (1-in-1)', 800, 12 FROM public.hostels WHERE name = 'Unity Hostel'
UNION ALL
SELECT id, 'Double (2-in-1)', 600, 8 FROM public.hostels WHERE name = 'Unity Hostel';

-- Insert room types for Excellence Lodge
INSERT INTO public.room_types (hostel_id, type, price_per_student, available_rooms)
SELECT id, 'Single (1-in-1)', 1000, 6 FROM public.hostels WHERE name = 'Excellence Lodge'
UNION ALL
SELECT id, 'Double (2-in-1)', 750, 10 FROM public.hostels WHERE name = 'Excellence Lodge'
UNION ALL
SELECT id, 'Quad (4-in-1)', 500, 4 FROM public.hostels WHERE name = 'Excellence Lodge';

-- Insert room types for Campus View Residence
INSERT INTO public.room_types (hostel_id, type, price_per_student, available_rooms)
SELECT id, 'Double (2-in-1)', 550, 15 FROM public.hostels WHERE name = 'Campus View Residence'
UNION ALL
SELECT id, 'Quad (4-in-1)', 400, 8 FROM public.hostels WHERE name = 'Campus View Residence';

-- Insert room types for Golden Gate Hostel
INSERT INTO public.room_types (hostel_id, type, price_per_student, available_rooms)
SELECT id, 'Single (1-in-1)', 900, 8 FROM public.hostels WHERE name = 'Golden Gate Hostel'
UNION ALL
SELECT id, 'Double (2-in-1)', 650, 12 FROM public.hostels WHERE name = 'Golden Gate Hostel';