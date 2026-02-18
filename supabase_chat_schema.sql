-- Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_booking ON public.chat_messages(booking_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread ON public.chat_messages(booking_id, read) WHERE read = FALSE;

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages for their bookings"
  ON public.chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = chat_messages.booking_id
      AND (bookings.customer_id = auth.uid() OR bookings.artisan_id IN (
        SELECT id FROM public.artisans WHERE profile_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can send messages for their bookings"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = chat_messages.booking_id
      AND (bookings.customer_id = auth.uid() OR bookings.artisan_id IN (
        SELECT id FROM public.artisans WHERE profile_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can update their own messages"
  ON public.chat_messages
  FOR UPDATE
  USING (sender_id = auth.uid());

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_booking_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.chat_messages
  SET read = TRUE, updated_at = NOW()
  WHERE booking_id = p_booking_id
    AND sender_id != p_user_id
    AND read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID, UUID) TO authenticated;
