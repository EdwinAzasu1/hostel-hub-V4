-- Create public bucket for hostel images (idempotent)
insert into storage.buckets (id, name, public)
values ('hostel-images', 'hostel-images', true)
on conflict (id) do nothing;

-- Create policies only if they don't already exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Public can view hostel images') THEN
    CREATE POLICY "Public can view hostel images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'hostel-images');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can upload hostel images') THEN
    CREATE POLICY "Admins can upload hostel images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'hostel-images' AND has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can update hostel images') THEN
    CREATE POLICY "Admins can update hostel images"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'hostel-images' AND has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can delete hostel images') THEN
    CREATE POLICY "Admins can delete hostel images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'hostel-images' AND has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;