-- BookLeaf Publishing - Sample Books Seed Helper
-- Allows seeding sample books for any registered author in Supabase

-- Function to seed sample books for the currently logged-in user
CREATE OR REPLACE FUNCTION public.seed_sample_books_for_current_author()
RETURNS void AS $$
DECLARE
    curr_user_id UUID := auth.uid();
BEGIN
    IF curr_user_id IS NULL THEN
        RAISE EXCEPTION 'User is not authenticated. Please log in before calling this function.';
    END IF;

    INSERT INTO public.books (
        id, author_id, title, isbn, genre, publication_date, status,
        mrp, author_royalty_per_copy, total_copies_sold, total_royalty_earned,
        royalty_paid, royalty_pending, last_royalty_payout_date, print_partner, available_on
    ) VALUES 
    (
        'BK-' || substr(md5(curr_user_id::text || '-1'), 1, 8),
        curr_user_id,
        'Whispers of the Ganges',
        '978-93-5482-01-1',
        'Literary Fiction',
        '2023-06-20',
        'Published & Live',
        399.00,
        35.00,
        342,
        11970.00,
        8400.00,
        3570.00,
        '2025-10-15',
        'In-House',
        '["Amazon India", "Flipkart", "BookLeaf Store"]'::jsonb
    ),
    (
        'BK-' || substr(md5(curr_user_id::text || '-2'), 1, 8),
        curr_user_id,
        'The Saffron Diaries',
        '978-93-5482-02-8',
        'Non-Fiction / Memoir',
        '2024-01-10',
        'Published & Live',
        450.00,
        42.00,
        189,
        7938.00,
        7938.00,
        0.00,
        '2025-12-01',
        'In-House',
        '["Amazon India", "BookLeaf Store"]'::jsonb
    ),
    (
        'BK-' || substr(md5(curr_user_id::text || '-3'), 1, 8),
        curr_user_id,
        'Echoes of Monsoon Rain',
        '978-93-5482-03-5',
        'Contemporary Poetry',
        CURRENT_DATE,
        'In Production',
        299.00,
        28.00,
        0,
        0.00,
        0.00,
        0.00,
        NULL,
        'In-House',
        '["Amazon India", "Flipkart"]'::jsonb
    )
    ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.seed_sample_books_for_current_author() TO authenticated;
