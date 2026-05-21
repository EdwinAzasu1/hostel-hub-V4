-- ============================================================
-- Migration: New Features
-- 1. Rejection reason, amenities, lat/lng on hostels
-- 2. Chat messages table with RLS
-- ============================================================

-- Add new columns to hostels
ALTER TABLE public.hostels
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS amenities text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric;

-- ============================================================
-- Chat Messages Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hostel_id uuid NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('admin', 'owner')),
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  read_at timestamp with time zone
);

-- Enable RLS on chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Admins can read and write all chat messages
CREATE POLICY "Admins can read all chat messages"
  ON public.chat_messages
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert chat messages"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update chat messages"
  ON public.chat_messages
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Hostel owners can read/write chat messages for their own hostels
CREATE POLICY "Owners can read their hostel chat messages"
  ON public.chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.hostels
      WHERE hostels.id = chat_messages.hostel_id
        AND hostels.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can insert chat messages for their hostels"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hostels
      WHERE hostels.id = chat_messages.hostel_id
        AND hostels.owner_id = auth.uid()
    )
    AND sender_id = auth.uid()
  );

CREATE POLICY "Owners can update (mark read) their chat messages"
  ON public.chat_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.hostels
      WHERE hostels.id = chat_messages.hostel_id
        AND hostels.owner_id = auth.uid()
    )
  );

-- DELETE: both admin and owner can clear a conversation
CREATE POLICY "Admins can delete chat messages"
  ON public.chat_messages
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can delete chat messages for their hostels"
  ON public.chat_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.hostels
      WHERE hostels.id = chat_messages.hostel_id
        AND hostels.owner_id = auth.uid()
    )
  );

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS chat_messages_hostel_id_idx ON public.chat_messages(hostel_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON public.chat_messages(created_at DESC);
