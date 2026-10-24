-- BookLeaf Publishing - Complete Database Seeding Migration
-- Run this in the Supabase SQL Editor to populate authors, books, and tickets.

-- 1. Drop foreign key constraint on profiles.id to allow seeding demo authors alongside auth users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Seed BookLeaf Ops Admin
INSERT INTO public.profiles (id, full_name, email, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'BookLeaf Operations Lead', 'admin@bookleaf.in', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 3. Seed 10 BookLeaf Authors
INSERT INTO public.profiles (id, full_name, email, phone, city, role) VALUES ('00000000-0000-0000-0000-000000000002', 'Priya Sharma', 'priya.sharma@email.com', '+91-98765-43210', 'Mumbai', 'author') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, full_name, email, phone, city, role) VALUES ('00000000-0000-0000-0000-000000000003', 'Rohit Kapoor', 'rohit.kapoor@email.com', '+91-87654-32109', 'Delhi', 'author') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, full_name, email, phone, city, role) VALUES ('00000000-0000-0000-0000-000000000004', 'Ananya Reddy', 'ananya.reddy@email.com', '+91-76543-21098', 'Hyderabad', 'author') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, full_name, email, phone, city, role) VALUES ('00000000-0000-0000-0000-000000000005', 'Vikram Joshi', 'vikram.joshi@email.com', '+91-65432-10987', 'Pune', 'author') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, full_name, email, phone, city, role) VALUES ('00000000-0000-0000-0000-000000000006', 'Meera Nair', 'meera.nair@email.com', '+91-54321-09876', 'Kochi', 'author') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, full_name, email, phone, city, role) VALUES ('00000000-0000-0000-0000-000000000007', 'Arjun Malhotra', 'arjun.malhotra@email.com', '+91-43210-98765', 'Chandigarh', 'author') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, full_name, email, phone, city, role) VALUES ('00000000-0000-0000-0000-000000000008', 'Sneha Kulkarni', 'sneha.kulkarni@email.com', '+91-32109-87654', 'Bangalore', 'author') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, full_name, email, phone, city, role) VALUES ('00000000-0000-0000-0000-000000000009', 'Farhan Sheikh', 'farhan.sheikh@email.com', '+91-21098-76543', 'Lucknow', 'author') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, full_name, email, phone, city, role) VALUES ('00000000-0000-0000-0000-000000000010', 'Kavita Deshmukh', 'kavita.deshmukh@email.com', '+91-10987-65432', 'Nagpur', 'author') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, full_name, email, phone, city, role) VALUES ('00000000-0000-0000-0000-000000000011', 'Diya Chatterjee', 'diya.chatterjee@email.com', '+91-09876-54321', 'Kolkata', 'author') ON CONFLICT (id) DO NOTHING;

-- 4. Seed 18 Books from Catalog
INSERT INTO public.books (id, author_id, title, isbn, genre, publication_date, status, mrp, author_royalty_per_copy, total_copies_sold, total_royalty_earned, royalty_paid, royalty_pending, last_royalty_payout_date, print_partner, available_on)
VALUES ('BK001', '00000000-0000-0000-0000-000000000002', 'Whispers of the Ganges', '978-93-5XXXX-01-1', 'Literary Fiction', '2023-06-20', 'Published & Live', 399, 35, 342, 11970, 8400, 3570, '2025-10-15', 'In-House', '["Amazon India", "Flipkart", "BookLeaf Store"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, total_copies_sold = EXCLUDED.total_copies_sold, royalty_pending = EXCLUDED.royalty_pending;
INSERT INTO public.books (id, author_id, title, isbn, genre, publication_date, status, mrp, author_royalty_per_copy, total_copies_sold, total_royalty_earned, royalty_paid, royalty_pending, last_royalty_payout_date, print_partner, available_on)
VALUES ('BK002', '00000000-0000-0000-0000-000000000002', 'The Saffron Diaries', '978-93-5XXXX-02-8', 'Non-Fiction / Memoir', '2024-01-10', 'Published & Live', 450, 42, 189, 7938, 7938, 0, '2025-12-01', 'In-House', '["Amazon India", "BookLeaf Store"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, total_copies_sold = EXCLUDED.total_copies_sold, royalty_pending = EXCLUDED.royalty_pending;
INSERT INTO public.books (id, author_id, title, isbn, genre, publication_date, status, mrp, author_royalty_per_copy, total_copies_sold, total_royalty_earned, royalty_paid, royalty_pending, last_royalty_payout_date, print_partner, available_on)
VALUES ('BK003', '00000000-0000-0000-0000-000000000003', 'Code & Karma', '978-93-5XXXX-03-5', 'Self-Help / Technology', '2023-02-14', 'Published & Live', 350, 30, 876, 26280, 21000, 5280, '2025-09-01', 'Repro India', '["Amazon India", "Flipkart", "Amazon US", "BookLeaf Store"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, total_copies_sold = EXCLUDED.total_copies_sold, royalty_pending = EXCLUDED.royalty_pending;
INSERT INTO public.books (id, author_id, title, isbn, genre, publication_date, status, mrp, author_royalty_per_copy, total_copies_sold, total_royalty_earned, royalty_paid, royalty_pending, last_royalty_payout_date, print_partner, available_on)
VALUES ('BK004', '00000000-0000-0000-0000-000000000003', 'Startup Sutra', '978-93-5XXXX-04-2', 'Business / Entrepreneurship', '2024-05-22', 'Published & Live', 499, 48, 1203, 57744, 50000, 7744, '2025-11-15', 'In-House', '["Amazon India", "Flipkart", "Amazon US", "Amazon UK", "BookLeaf Store"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, total_copies_sold = EXCLUDED.total_copies_sold, royalty_pending = EXCLUDED.royalty_pending;
INSERT INTO public.books (id, author_id, title, isbn, genre, publication_date, status, mrp, author_royalty_per_copy, total_copies_sold, total_royalty_earned, royalty_paid, royalty_pending, last_royalty_payout_date, print_partner, available_on)
VALUES ('BK005', '00000000-0000-0000-0000-000000000004', 'Between Two Temples', '978-93-5XXXX-05-9', 'Historical Fiction', '2024-07-05', 'Published & Live', 425, 38, 67, 2546, 0, 2546, NULL, 'Epitome Books', '["Amazon India", "BookLeaf Store"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, total_copies_sold = EXCLUDED.total_copies_sold, royalty_pending = EXCLUDED.royalty_pending;
INSERT INTO public.books (id, author_id, title, isbn, genre, publication_date, status, mrp, author_royalty_per_copy, total_copies_sold, total_royalty_earned, royalty_paid, royalty_pending, last_royalty_payout_date, print_partner, available_on)
VALUES ('BK006', '00000000-0000-0000-0000-000000000005', 'Debugging Life', '978-93-5XXXX-06-6', 'Self-Help', '2023-11-30', 'Published & Live', 299, 25, 534, 13350, 10000, 3350, '2025-08-20', 'In-House', '["Amazon India", "Flipkart", "BookLeaf Store"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, total_copies_sold = EXCLUDED.total_copies_sold, royalty_pending = EXCLUDED.royalty_pending;
INSERT INTO public.books (id, author_id, title, isbn, genre, publication_date, status, mrp, author_royalty_per_copy, total_copies_sold, total_royalty_earned, royalty_paid, royalty_pending, last_royalty_payout_date, print_partner, available_on)
VALUES ('BK007', '00000000-0000-0000-0000-000000000005', 'The Last Monsoon', '978-93-5XXXX-07-3', 'Poetry', '2024-08-15', 'Published & Live', 199, 15, 123, 1845, 1845, 0, '2025-12-01', 'In-House', '["Amazon India", "BookLeaf Store"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, total_copies_sold = EXCLUDED.total_copies_sold, royalty_pending = EXCLUDED.royalty_pending;
INSERT INTO public.books (id, author_id, title, isbn, genre, publication_date, status, mrp, author_royalty_per_copy, total_copies_sold, total_royalty_earned, royalty_paid, royalty_pending, last_royalty_payout_date, print_partner, available_on)
VALUES ('BK008', '00000000-0000-0000-0000-000000000006', 'Cardamom & Chaos', '978-93-5XXXX-08-0', 'Contemporary Fiction', '2023-04-18', 'Published & Live', 375, 32, 445, 14240, 14240, 0, '2025-12-01', 'Repro India', '["Amazon India", "Flipkart", "BookLeaf Store"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, total_copies_sold = EXCLUDED.total_copies_sold, royalty_pending = EXCLUDED.royalty_pending;
INSERT INTO public.books (id, author_id, title, isbn, genre, publication_date, status, mrp, author_royalty_per_copy, total_copies_sold, total_royalty_earned, royalty_paid, royalty_pending, last_royalty_payout_date, print_partner, available_on)
VALUES ('BK009', '00000000-0000-0000-0000-000000000006', 'Letters from Lakshadweep', '978-93-5XXXX-09-7', 'Travel / Non-Fiction', '2024-03-01', 'Published & Live', 550, 55, 201, 11055, 8000, 3055, '2025-10-15', 'In-House', '["Amazon India", "Amazon US", "BookLeaf Store"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, total_copies_sold = EXCLUDED.total_copies_sold, royalty_pending = EXCLUDED.royalty_pending;
INSERT INTO public.books (id, author_id, title, isbn, genre, publication_date, status, mrp, author_royalty_per_copy, total_copies_sold, total_royalty_earned, royalty_paid, royalty_pending, last_royalty_payout_date, print_partner, available_on)
VALUES ('BK010', '00000000-0000-0000-0000-000000000007', 'Turban Tales', '978-93-5XXXX-10-3', 'Humor / Essays', '2024-09-10', 'Published & Live', 325, 28, 88, 2464, 0, 2464, NULL, 'In-House', '["Amazon India", "BookLeaf Store"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, total_copies_sold = EXCLUDED.total_copies_sold, royalty_pending = EXCLUDED.royalty_pending;
INSERT INTO public.books (id, author_id, title, isbn, genre, publication_date, status, mrp, author_royalty_per_copy, total_copies_sold, total_royalty_earned, royalty_paid, royalty_pending, last_royalty_payout_date, print_partner, available_on)
VALUES ('BK011', '00000000-0000-0000-0000-000000000008', 'The Algorithm of Love', '978-93-5XXXX-11-0', 'Romance', '2022-12-25', 'Published & Live', 299, 25, 1567, 39175, 35000, 4175, '2025-11-15', 'Repro India', '["Amazon India", "Flipkart", "Amazon US", "BookLeaf Store"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, total_copies_sold = EXCLUDED.total_copies_sold, royalty_pending = EXCLUDED.royalty_pending;
INSERT INTO public.books (id, author_id, title, isbn, genre, publication_date, status, mrp, author_royalty_per_copy, total_copies_sold, total_royalty_earned, royalty_paid, royalty_pending, last_royalty_payout_date, print_partner, available_on)
VALUES ('BK012', '00000000-0000-0000-0000-000000000008', 'Ctrl+Alt+Delete My Ex', '978-93-5XXXX-12-7', 'Romance / Humor', '2024-02-14', 'Published & Live', 350, 30, 723, 21690, 18000, 3690, '2025-10-15', 'In-House', '["Amazon India", "Flipkart", "BookLeaf Store"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, total_copies_sold = EXCLUDED.total_copies_sold, royalty_pending = EXCLUDED.royalty_pending;
INSERT INTO public.books (id, author_id, title, isbn, genre, publication_date, status, mrp, author_royalty_per_copy, total_copies_sold, total_royalty_earned, royalty_paid, royalty_pending, last_royalty_payout_date, print_partner, available_on)
VALUES ('BK013', '00000000-0000-0000-0000-000000000008', 'Midnight in Mysore', '978-93-5XXXX-13-4', 'Thriller', NULL, 'In Production - Cover Design', None, None, 0, 0, 0, 0, NULL, 'None', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, total_copies_sold = EXCLUDED.total_copies_sold, royalty_pending = EXCLUDED.royalty_pending;
INSERT INTO public.books (id, author_id, title, isbn, genre, publication_date, status, mrp, author_royalty_per_copy, total_copies_sold, total_royalty_earned, royalty_paid, royalty_pending, last_royalty_payout_date, print_partner, available_on)
VALUES ('BK014', '00000000-0000-0000-0000-000000000009', 'Ghazal of the Forgotten', '978-93-5XXXX-14-1', 'Poetry / Urdu Literature', '2024-01-26', 'Published & Live', 250, 20, 156, 3120, 3120, 0, '2025-12-01', 'Epitome Books', '["Amazon India", "BookLeaf Store"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, total_copies_sold = EXCLUDED.total_copies_sold, royalty_pending = EXCLUDED.royalty_pending;
INSERT INTO public.books (id, author_id, title, isbn, genre, publication_date, status, mrp, author_royalty_per_copy, total_copies_sold, total_royalty_earned, royalty_paid, royalty_pending, last_royalty_payout_date, print_partner, available_on)
VALUES ('BK015', '00000000-0000-0000-0000-000000000010', 'Raising Roots', '978-93-5XXXX-15-8', 'Parenting / Non-Fiction', NULL, 'In Production - Typesetting', None, None, 0, 0, 0, 0, NULL, 'None', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, total_copies_sold = EXCLUDED.total_copies_sold, royalty_pending = EXCLUDED.royalty_pending;
INSERT INTO public.books (id, author_id, title, isbn, genre, publication_date, status, mrp, author_royalty_per_copy, total_copies_sold, total_royalty_earned, royalty_paid, royalty_pending, last_royalty_payout_date, print_partner, available_on)
VALUES ('BK016', '00000000-0000-0000-0000-000000000010', 'The Nagpur Notebooks', '978-93-5XXXX-16-5', 'Essays / Memoir', '2024-11-05', 'Published & Live', 299, 25, 34, 850, 0, 850, NULL, 'In-House', '["Amazon India", "BookLeaf Store"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, total_copies_sold = EXCLUDED.total_copies_sold, royalty_pending = EXCLUDED.royalty_pending;
INSERT INTO public.books (id, author_id, title, isbn, genre, publication_date, status, mrp, author_royalty_per_copy, total_copies_sold, total_royalty_earned, royalty_paid, royalty_pending, last_royalty_payout_date, print_partner, available_on)
VALUES ('BK017', '00000000-0000-0000-0000-000000000011', 'Durga’s Daughters', '978-93-5XXXX-17-2', 'Literary Fiction', '2023-10-15', 'Published & Live', 475, 45, 612, 27540, 25000, 2540, '2025-11-15', 'Repro India', '["Amazon India", "Flipkart", "Amazon US", "BookLeaf Store"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, total_copies_sold = EXCLUDED.total_copies_sold, royalty_pending = EXCLUDED.royalty_pending;
INSERT INTO public.books (id, author_id, title, isbn, genre, publication_date, status, mrp, author_royalty_per_copy, total_copies_sold, total_royalty_earned, royalty_paid, royalty_pending, last_royalty_payout_date, print_partner, available_on)
VALUES ('BK018', '00000000-0000-0000-0000-000000000011', 'Howrah Nights', '978-93-5XXXX-18-9', 'Crime / Thriller', '2025-01-20', 'Published & Live', 399, 35, 45, 1575, 0, 1575, NULL, 'In-House', '["Amazon India", "BookLeaf Store"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, total_copies_sold = EXCLUDED.total_copies_sold, royalty_pending = EXCLUDED.royalty_pending;

-- 5. Attach Sample Books to All Existing Registered Users

DO $$
DECLARE
    u RECORD;
BEGIN
    FOR u IN SELECT id, full_name FROM public.profiles WHERE role = 'author' AND id NOT IN (SELECT id FROM public.profiles WHERE id::text LIKE '00000000-0000-0000-0000-%')
    LOOP
        INSERT INTO public.books (id, author_id, title, isbn, genre, publication_date, status, mrp, author_royalty_per_copy, total_copies_sold, total_royalty_earned, royalty_paid, royalty_pending, last_royalty_payout_date, print_partner, available_on)
        VALUES 
        ('BK-' || substr(md5(u.id::text || '-1'), 1, 6), u.id, 'Whispers of the Ganges', '978-93-5482-01-1', 'Literary Fiction', '2023-06-20', 'Published & Live', 399.00, 35.00, 342, 11970.00, 8400.00, 3570.00, '2025-10-15', 'In-House', '["Amazon India", "Flipkart", "BookLeaf Store"]'::jsonb),
        ('BK-' || substr(md5(u.id::text || '-2'), 1, 6), u.id, 'The Saffron Diaries', '978-93-5482-02-8', 'Non-Fiction / Memoir', '2024-01-10', 'Published & Live', 450.00, 42.00, 189, 7938.00, 7938.00, 0.00, '2025-12-01', 'In-House', '["Amazon India", "BookLeaf Store"]'::jsonb),
        ('BK-' || substr(md5(u.id::text || '-3'), 1, 6), u.id, 'Echoes of Monsoon Rain', '978-93-5482-03-5', 'Contemporary Poetry', CURRENT_DATE, 'In Production', 299.00, 28.00, 0, 0.00, 0.00, 0.00, NULL, 'In-House', '["Amazon India", "Flipkart"]'::jsonb)
        ON CONFLICT (id) DO NOTHING;
    END LOOP;
END $$;


-- 6. Seed Sample Tickets Across Categories for Admin Dashboard & Triage

INSERT INTO public.tickets (id, ticket_number, author_id, book_id, subject, description, category, priority, status, ai_category, ai_priority, ai_confidence, ai_status, ai_reason, assigned_admin_id, created_at)
VALUES
(
    '00000000-0000-0000-0001-000000000001',
    'TICK-1001',
    '00000000-0000-0000-0000-000000000002',
    'BK001',
    'Delayed Royalty Payout for Q3',
    'I published my book 4 months ago and have not received the Q3 royalty payout. Sales show 342 copies.',
    'Royalty & Payments',
    'High',
    'Open',
    'Royalty & Payments',
    'High',
    0.98,
    'completed',
    'Financial inquiry regarding overdue quarterly royalty payout with verified sales.',
    '00000000-0000-0000-0000-000000000001',
    NOW() - INTERVAL '2 days'
),
(
    '00000000-0000-0000-0001-000000000002',
    'TICK-1002',
    '00000000-0000-0000-0000-000000000008',
    'BK011',
    'Damaged binding on author copies',
    'The author copies of The Algorithm of Love arrived yesterday with broken glue bindings and misaligned covers.',
    'Printing & Quality',
    'High',
    'In Progress',
    'Printing & Quality',
    'High',
    0.96,
    'completed',
    'Physical manufacturing defect reported on author copies requiring reprint verification.',
    '00000000-0000-0000-0000-000000000001',
    NOW() - INTERVAL '1 day'
),
(
    '00000000-0000-0000-0001-000000000003',
    'TICK-1003',
    '00000000-0000-0000-0000-000000000003',
    'BK003',
    'Amazon showing Currently Unavailable',
    'My book Code & Karma is showing Currently Unavailable on Amazon India for the past 48 hours.',
    'Distribution & Availability',
    'Medium',
    'In Progress',
    'Distribution & Availability',
    'Medium',
    0.94,
    'completed',
    'Retail inventory feed synchronization issue on Amazon channel.',
    '00000000-0000-0000-0000-000000000001',
    NOW() - INTERVAL '18 hours'
),
(
    '00000000-0000-0000-0001-000000000004',
    'TICK-1004',
    '00000000-0000-0000-0000-000000000005',
    'BK006',
    'Incorrect ISBN printed on barcode',
    'The barcode on the back cover of Debugging Life has an ISBN differing by two digits from the copyright page.',
    'ISBN & Metadata Issues',
    'Critical',
    'Open',
    'ISBN & Metadata Issues',
    'Critical',
    0.99,
    'completed',
    'High priority metadata discrepancy: retail barcode conflicts with registered imprint ISBN.',
    NULL,
    NOW() - INTERVAL '6 hours'
),
(
    '00000000-0000-0000-0001-000000000005',
    'TICK-1005',
    '00000000-0000-0000-0000-000000000006',
    'BK008',
    'Typesetting milestone status inquiry',
    'Could you please share when the typesetting stage for Letters from Lakshadweep will conclude?',
    'Book Status & Production Updates',
    'Low',
    'Resolved',
    'Book Status & Production Updates',
    'Low',
    0.91,
    'completed',
    'Routine production stage timeline inquiry.',
    '00000000-0000-0000-0000-000000000001',
    NOW() - INTERVAL '3 days'
)
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Public Messages & Internal Notes
INSERT INTO public.ticket_messages (id, ticket_id, sender_id, sender_role, message, visibility, created_at)
VALUES
(
    '00000000-0000-0000-0002-000000000001',
    '00000000-0000-0000-0001-000000000002',
    '00000000-0000-0000-0000-000000000008',
    'author',
    'Here is the photo of the damaged spine on copy #1.',
    'public',
    NOW() - INTERVAL '20 hours'
),
(
    '00000000-0000-0000-0002-000000000002',
    '00000000-0000-0000-0001-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'admin',
    'INTERNAL NOTE: Contacting Repro India print facility to report adhesive temperature defect on batch 4.',
    'internal',
    NOW() - INTERVAL '15 hours'
),
(
    '00000000-0000-0000-0002-000000000003',
    '00000000-0000-0000-0001-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'admin',
    'Dear Sneha, thank you for sharing the photo. We sincerely apologize for this printing defect. BookLeaf offers 100% free reprints for verified defects. We have queued a reprint batch scheduled to arrive within 5-7 business days.',
    'public',
    NOW() - INTERVAL '14 hours'
)
ON CONFLICT (id) DO NOTHING;
