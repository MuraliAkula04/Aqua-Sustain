-- ==============================================================================
-- AquaSustain Database Permissions Fix - Migration 004
-- Grants all required table and sequence permissions to authenticated and anon
-- ==============================================================================

-- 1. Grant Schema Usage
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 2. Grant Table Permissions for All Application Tables
GRANT ALL ON TABLE public.profiles TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.farms TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.ponds TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.water_quality_readings TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.pond_assessments TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.feed_records TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.expense_records TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.reminders TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.learning_articles TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.support_tickets TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.support_responses TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.audit_logs TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.notifications TO postgres, anon, authenticated, service_role;

-- 3. Grant Sequence / Serial Permissions
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 4. Set Default Privileges so future tables automatically have permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
