-- Support ticket system

CREATE TABLE public.support_tickets (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role      text NOT NULL DEFAULT 'student',   -- 'student' | 'instructor'
  subject        text NOT NULL,
  category       text NOT NULL DEFAULT 'general',   -- 'general' | 'payment' | 'course' | 'technical' | 'other'
  status         text NOT NULL DEFAULT 'open',      -- 'open' | 'in_progress' | 'resolved' | 'closed'
  priority       text NOT NULL DEFAULT 'normal',    -- 'low' | 'normal' | 'high' | 'urgent'
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.support_replies (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role text NOT NULL DEFAULT 'user',  -- 'user' | 'admin'
  message     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_replies  ENABLE ROW LEVEL SECURITY;

-- Tickets: owner can read/insert; admin can read/update all
CREATE POLICY "Users read own tickets"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all tickets"
  ON public.support_tickets FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'admin')
  );

CREATE POLICY "Admins update tickets"
  ON public.support_tickets FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'admin')
  );

-- Replies: owner can read/insert for their ticket; admin can read/insert all
CREATE POLICY "Users read own ticket replies"
  ON public.support_replies FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  );

CREATE POLICY "Users create replies on own tickets"
  ON public.support_replies FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  );

CREATE POLICY "Admins read all replies"
  ON public.support_replies FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'admin')
  );

CREATE POLICY "Admins create replies"
  ON public.support_replies FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'admin')
  );

GRANT SELECT, INSERT ON public.support_tickets TO authenticated;
GRANT UPDATE (status, priority, updated_at) ON public.support_tickets TO authenticated;
GRANT SELECT, INSERT ON public.support_replies  TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
GRANT ALL ON public.support_replies  TO service_role;

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
