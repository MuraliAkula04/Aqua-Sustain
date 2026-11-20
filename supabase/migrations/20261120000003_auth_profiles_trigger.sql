-- ==============================================================================
-- AquaSustain Auth Hooks & User Profile Synchronization - Migration 003
-- Automatically provisions public.profiles on new auth.users signup
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        name,
        email,
        phone,
        role,
        preferred_language,
        state,
        district,
        village
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'farmer'),
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en'),
        COALESCE(NEW.raw_user_meta_data->>'state', 'Andhra Pradesh'),
        COALESCE(NEW.raw_user_meta_data->>'district', 'West Godavari'),
        COALESCE(NEW.raw_user_meta_data->>'village', 'Bhimavaram')
    )
    ON CONFLICT (id) DO UPDATE
    SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role,
        preferred_language = EXCLUDED.preferred_language,
        updated_at = TIMEZONE('utc', NOW());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger firing on every auth.users creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
