-- ==============================================================================
-- AquaSustain Row Level Security (RLS) Policies - Migration 002
-- Strict Role-Based and Ownership-Based Access Control
-- ==============================================================================

-- Enable RLS across all application tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ponds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_quality_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pond_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper security functions
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_evaluator()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'evaluator'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 1. PROFILES POLICIES
-- -----------------------------------------------------------------------------
-- Users can view their own profile; Admins & Evaluators can view all profiles
CREATE POLICY "Profiles select policy" ON public.profiles
    FOR SELECT
    USING (
        auth.uid() = id
        OR public.is_admin()
        OR public.is_evaluator()
    );

-- Users can insert their own profile on signup
CREATE POLICY "Profiles insert policy" ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can update their own profile; Admins can update any
CREATE POLICY "Profiles update policy" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id OR public.is_admin());

-- -----------------------------------------------------------------------------
-- 2. FARMS POLICIES
-- -----------------------------------------------------------------------------
-- Farmers can see their own farms; Admins and Evaluators can view all farms
CREATE POLICY "Farms select policy" ON public.farms
    FOR SELECT
    USING (
        farmer_id = auth.uid()
        OR public.is_admin()
        OR public.is_evaluator()
    );

CREATE POLICY "Farms insert policy" ON public.farms
    FOR INSERT
    WITH CHECK (
        farmer_id = auth.uid()
        OR public.is_admin()
    );

CREATE POLICY "Farms update policy" ON public.farms
    FOR UPDATE
    USING (
        farmer_id = auth.uid()
        OR public.is_admin()
    );

CREATE POLICY "Farms delete policy" ON public.farms
    FOR DELETE
    USING (
        farmer_id = auth.uid()
        OR public.is_admin()
    );

-- -----------------------------------------------------------------------------
-- 3. PONDS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Ponds select policy" ON public.ponds
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.farms
            WHERE farms.id = ponds.farm_id
            AND (farms.farmer_id = auth.uid() OR public.is_admin() OR public.is_evaluator())
        )
    );

CREATE POLICY "Ponds insert policy" ON public.ponds
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.farms
            WHERE farms.id = ponds.farm_id
            AND (farms.farmer_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Ponds update policy" ON public.ponds
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.farms
            WHERE farms.id = ponds.farm_id
            AND (farms.farmer_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Ponds delete policy" ON public.ponds
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.farms
            WHERE farms.id = ponds.farm_id
            AND (farms.farmer_id = auth.uid() OR public.is_admin())
        )
    );

-- -----------------------------------------------------------------------------
-- 4. WATER QUALITY READINGS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Water readings select policy" ON public.water_quality_readings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.ponds
            JOIN public.farms ON farms.id = ponds.farm_id
            WHERE ponds.id = water_quality_readings.pond_id
            AND (farms.farmer_id = auth.uid() OR public.is_admin() OR public.is_evaluator())
        )
    );

CREATE POLICY "Water readings insert policy" ON public.water_quality_readings
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ponds
            JOIN public.farms ON farms.id = ponds.farm_id
            WHERE ponds.id = water_quality_readings.pond_id
            AND (farms.farmer_id = auth.uid() OR public.is_admin())
        )
    );

-- -----------------------------------------------------------------------------
-- 5. POND ASSESSMENTS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Pond assessments select policy" ON public.pond_assessments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.ponds
            JOIN public.farms ON farms.id = ponds.farm_id
            WHERE ponds.id = pond_assessments.pond_id
            AND (farms.farmer_id = auth.uid() OR public.is_admin() OR public.is_evaluator())
        )
    );

CREATE POLICY "Pond assessments insert policy" ON public.pond_assessments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ponds
            JOIN public.farms ON farms.id = ponds.farm_id
            WHERE ponds.id = pond_assessments.pond_id
            AND (farms.farmer_id = auth.uid() OR public.is_admin())
        )
    );

-- -----------------------------------------------------------------------------
-- 6. FEED RECORDS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Feed records select policy" ON public.feed_records
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.ponds
            JOIN public.farms ON farms.id = ponds.farm_id
            WHERE ponds.id = feed_records.pond_id
            AND (farms.farmer_id = auth.uid() OR public.is_admin() OR public.is_evaluator())
        )
    );

CREATE POLICY "Feed records insert policy" ON public.feed_records
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ponds
            JOIN public.farms ON farms.id = ponds.farm_id
            WHERE ponds.id = feed_records.pond_id
            AND (farms.farmer_id = auth.uid() OR public.is_admin())
        )
    );

-- -----------------------------------------------------------------------------
-- 7. EXPENSE RECORDS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Expense records select policy" ON public.expense_records
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.farms
            WHERE farms.id = expense_records.farm_id
            AND (farms.farmer_id = auth.uid() OR public.is_admin() OR public.is_evaluator())
        )
    );

CREATE POLICY "Expense records insert policy" ON public.expense_records
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.farms
            WHERE farms.id = expense_records.farm_id
            AND (farms.farmer_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Expense records delete policy" ON public.expense_records
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.farms
            WHERE farms.id = expense_records.farm_id
            AND (farms.farmer_id = auth.uid() OR public.is_admin())
        )
    );

-- -----------------------------------------------------------------------------
-- 8. REMINDERS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Reminders select policy" ON public.reminders
    FOR SELECT
    USING (farmer_id = auth.uid() OR public.is_admin());

CREATE POLICY "Reminders insert policy" ON public.reminders
    FOR INSERT
    WITH CHECK (farmer_id = auth.uid() OR public.is_admin());

CREATE POLICY "Reminders update policy" ON public.reminders
    FOR UPDATE
    USING (farmer_id = auth.uid() OR public.is_admin());

CREATE POLICY "Reminders delete policy" ON public.reminders
    FOR DELETE
    USING (farmer_id = auth.uid() OR public.is_admin());

-- -----------------------------------------------------------------------------
-- 9. LEARNING ARTICLES POLICIES
-- -----------------------------------------------------------------------------
-- Anyone authenticated can read published articles
CREATE POLICY "Learning articles select policy" ON public.learning_articles
    FOR SELECT
    TO authenticated
    USING (true);

-- Only Admins can create or update articles
CREATE POLICY "Learning articles insert policy" ON public.learning_articles
    FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Learning articles update policy" ON public.learning_articles
    FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Learning articles delete policy" ON public.learning_articles
    FOR DELETE
    USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 10. SUPPORT TICKETS & RESPONSES POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Support tickets select policy" ON public.support_tickets
    FOR SELECT
    USING (farmer_id = auth.uid() OR public.is_admin() OR public.is_evaluator());

CREATE POLICY "Support tickets insert policy" ON public.support_tickets
    FOR INSERT
    WITH CHECK (farmer_id = auth.uid() OR public.is_admin());

CREATE POLICY "Support tickets update policy" ON public.support_tickets
    FOR UPDATE
    USING (farmer_id = auth.uid() OR public.is_admin());

CREATE POLICY "Support responses select policy" ON public.support_responses
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.support_tickets
            WHERE support_tickets.id = support_responses.ticket_id
            AND (support_tickets.farmer_id = auth.uid() OR public.is_admin() OR public.is_evaluator())
        )
    );

CREATE POLICY "Support responses insert policy" ON public.support_responses
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.support_tickets
            WHERE support_tickets.id = support_responses.ticket_id
            AND (support_tickets.farmer_id = auth.uid() OR public.is_admin())
        )
    );

-- -----------------------------------------------------------------------------
-- 11. AUDIT LOGS POLICIES
-- -----------------------------------------------------------------------------
-- Admins and Evaluators can view audit logs; All authenticated users can write logs
CREATE POLICY "Audit logs select policy" ON public.audit_logs
    FOR SELECT
    USING (public.is_admin() OR public.is_evaluator());

CREATE POLICY "Audit logs insert policy" ON public.audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 12. NOTIFICATIONS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Notifications select policy" ON public.notifications
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Notifications update policy" ON public.notifications
    FOR UPDATE
    USING (user_id = auth.uid());
