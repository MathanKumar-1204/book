-- BookLeaf Publishing - Enhanced Auth Trigger
-- Ensures bulletproof user registration and graceful error resilience

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT := 'author';
    user_name TEXT;
    user_phone TEXT;
BEGIN
    -- Extract role from metadata if specified (defaults to 'author')
    IF (new.raw_user_meta_data->>'role') = 'admin' THEN
        user_role := 'admin';
    END IF;

    user_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(COALESCE(new.email, 'Author'), '@', 1));
    user_phone := new.raw_user_meta_data->>'phone';

    -- Upsert profile record
    INSERT INTO public.profiles (id, full_name, email, phone, role)
    VALUES (new.id, user_name, COALESCE(new.email, ''), user_phone, user_role)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        updated_at = timezone('utc'::text, now());

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Prevent Supabase 500 failure during auth signup
    RAISE WARNING 'handle_new_user warning: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
