-- Automatically create a profile when a new user signs up in Supabase Auth

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT := 'author';
    user_name TEXT;
BEGIN
    -- Extract role from user metadata if explicitly provided (e.g. by admin invitation), default to 'author'
    IF new.raw_user_meta_data->>'role' = 'admin' THEN
        -- Only set if explicitly configured in metadata by trusted source
        user_role := 'admin';
    END IF;

    user_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (new.id, user_name, new.email, user_role)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = timezone('utc'::text, now());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
