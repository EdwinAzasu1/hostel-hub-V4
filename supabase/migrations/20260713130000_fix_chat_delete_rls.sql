-- Fix: ensure chat_messages DELETE policies exist so clearing chat actually
-- removes rows from the database and messages don't restore on page refresh.

-- Admin DELETE policy
DROP POLICY IF EXISTS "Admins can delete chat messages" ON public.chat_messages;
CREATE POLICY "Admins can delete chat messages"
  ON public.chat_messages
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Owner DELETE policy
DROP POLICY IF EXISTS "Owners can delete chat messages for their hostels" ON public.chat_messages;
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
