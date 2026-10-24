-- BookLeaf Publishing - Database Schema and RLS Policies Migration
-- Covers profiles, books, tickets, ticket_messages, and ai_processing_logs

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    city TEXT,
    role TEXT NOT NULL DEFAULT 'author' CHECK (role IN ('author', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index on role & email
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 2. BOOKS TABLE
CREATE TABLE IF NOT EXISTS public.books (
    id TEXT PRIMARY KEY,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    isbn TEXT,
    genre TEXT,
    publication_date DATE,
    status TEXT NOT NULL DEFAULT 'In Production',
    mrp NUMERIC(10, 2),
    author_royalty_per_copy NUMERIC(10, 2),
    total_copies_sold INTEGER NOT NULL DEFAULT 0,
    total_royalty_earned NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    royalty_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    royalty_pending NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    last_royalty_payout_date DATE,
    print_partner TEXT,
    available_on JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_books_author_id ON public.books(author_id);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON public.books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_status ON public.books(status);

-- 3. TICKETS TABLE
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number TEXT UNIQUE NOT NULL,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    book_id TEXT REFERENCES public.books(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'Royalty & Payments',
        'ISBN & Metadata Issues',
        'Printing & Quality',
        'Distribution & Availability',
        'Book Status & Production Updates',
        'General Inquiry'
    )),
    ai_category TEXT,
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN (
        'Critical',
        'High',
        'Medium',
        'Low'
    )),
    ai_priority TEXT,
    ai_reason TEXT,
    ai_confidence NUMERIC(4, 3),
    ai_status TEXT NOT NULL DEFAULT 'pending' CHECK (ai_status IN (
        'pending',
        'processing',
        'completed',
        'failed',
        'fallback'
    )),
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN (
        'Open',
        'In Progress',
        'Resolved',
        'Closed'
    )),
    assigned_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    admin_override BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tickets_author_id ON public.tickets(author_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON public.tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_admin ON public.tickets(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at DESC);

-- 4. TICKET MESSAGES TABLE (Public replies & Internal Notes)
CREATE TABLE IF NOT EXISTS public.ticket_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('author', 'admin')),
    message TEXT NOT NULL,
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'internal')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON public.ticket_messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_visibility ON public.ticket_messages(visibility);

-- 5. AI PROCESSING LOGS TABLE (Audit trail for LLM & Pinecone actions)
CREATE TABLE IF NOT EXISTS public.ai_processing_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
    operation_type TEXT NOT NULL,
    model TEXT NOT NULL,
    processing_status TEXT NOT NULL CHECK (processing_status IN ('success', 'failed', 'fallback')),
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    retrieved_chunks JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_ticket_id ON public.ai_processing_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON public.ai_processing_logs(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_processing_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile except role" ON public.profiles;
CREATE POLICY "Users can update own profile except role"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
    ON public.profiles FOR ALL
    USING (public.is_admin());

-- BOOKS POLICIES
DROP POLICY IF EXISTS "Authors can view own books" ON public.books;
CREATE POLICY "Authors can view own books"
    ON public.books FOR SELECT
    USING (auth.uid() = author_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all books" ON public.books;
CREATE POLICY "Admins can manage all books"
    ON public.books FOR ALL
    USING (public.is_admin());

-- TICKETS POLICIES
DROP POLICY IF EXISTS "Authors can view own tickets" ON public.tickets;
CREATE POLICY "Authors can view own tickets"
    ON public.tickets FOR SELECT
    USING (auth.uid() = author_id OR public.is_admin());

DROP POLICY IF EXISTS "Authors can create own tickets" ON public.tickets;
CREATE POLICY "Authors can create own tickets"
    ON public.tickets FOR INSERT
    WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Admins can update all tickets" ON public.tickets;
CREATE POLICY "Admins can update all tickets"
    ON public.tickets FOR UPDATE
    USING (public.is_admin());

-- TICKET MESSAGES POLICIES
-- Authors can view only public messages on their tickets
DROP POLICY IF EXISTS "Authors can view public messages on their tickets" ON public.ticket_messages;
CREATE POLICY "Authors can view public messages on their tickets"
    ON public.ticket_messages FOR SELECT
    USING (
        (visibility = 'public' AND EXISTS (
            SELECT 1 FROM public.tickets
            WHERE tickets.id = ticket_messages.ticket_id AND tickets.author_id = auth.uid()
        ))
        OR public.is_admin()
    );

-- Authors can send public messages on their own tickets
DROP POLICY IF EXISTS "Authors can insert public messages on own tickets" ON public.ticket_messages;
CREATE POLICY "Authors can insert public messages on own tickets"
    ON public.ticket_messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() AND
        visibility = 'public' AND
        sender_role = 'author' AND
        EXISTS (
            SELECT 1 FROM public.tickets
            WHERE tickets.id = ticket_messages.ticket_id AND tickets.author_id = auth.uid()
        )
    );

-- Admins can insert any messages (public or internal)
DROP POLICY IF EXISTS "Admins can insert messages" ON public.ticket_messages;
CREATE POLICY "Admins can insert messages"
    ON public.ticket_messages FOR INSERT
    WITH CHECK (public.is_admin());

-- AI PROCESSING LOGS POLICIES
DROP POLICY IF EXISTS "Only admins can view AI logs" ON public.ai_processing_logs;
CREATE POLICY "Only admins can view AI logs"
    ON public.ai_processing_logs FOR SELECT
    USING (public.is_admin());

-- ============================================================================
-- SUPABASE REALTIME CONFIGURATION
-- ============================================================================
-- Enable publications for realtime on tickets and messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'tickets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'ticket_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;
  END IF;
END $$;
