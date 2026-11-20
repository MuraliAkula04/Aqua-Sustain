-- ==============================================================================
-- AquaSustain Database Schema - Migration 001
-- Tables, Primary/Foreign Keys, Constraints, Indexes & Auditing
-- ==============================================================================

-- Enable UUID extension if not already available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. PROFILES (Extends Supabase auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    role TEXT NOT NULL CHECK (role IN ('farmer', 'admin', 'evaluator')) DEFAULT 'farmer',
    preferred_language TEXT NOT NULL CHECK (preferred_language IN ('en', 'te', 'hi')) DEFAULT 'en',
    state TEXT DEFAULT 'Andhra Pradesh',
    district TEXT DEFAULT 'West Godavari',
    village TEXT DEFAULT 'Bhimavaram',
    avatar_url TEXT,
    farm_count INTEGER DEFAULT 0,
    pond_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Index for role-based lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- -----------------------------------------------------------------------------
-- 2. FARMS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'Andhra Pradesh',
    district TEXT NOT NULL DEFAULT 'West Godavari',
    mandal TEXT NOT NULL,
    village TEXT NOT NULL,
    total_area_acres NUMERIC(8, 2) NOT NULL DEFAULT 1.0,
    water_source TEXT NOT NULL CHECK (water_source IN ('Borewell', 'Canal', 'Creek', 'River', 'Reservoir')),
    soil_type TEXT NOT NULL CHECK (soil_type IN ('Clay Loam', 'Sandy Clay', 'Alluvial', 'Saline Soil')),
    registration_number TEXT,
    caa_registration_number TEXT,
    established_year INTEGER NOT NULL DEFAULT 2020,
    status TEXT NOT NULL CHECK (status IN ('Active', 'Under Preparation', 'Fallow')) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_farms_farmer_id ON public.farms(farmer_id);

-- -----------------------------------------------------------------------------
-- 3. PONDS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ponds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    water_area_acres NUMERIC(6, 2) NOT NULL DEFAULT 1.0,
    average_depth_meters NUMERIC(4, 2) NOT NULL DEFAULT 1.5,
    species TEXT NOT NULL CHECK (species IN (
        'L. vannamei (Whiteleg Shrimp)',
        'P. monodon (Black Tiger)',
        'Catla & Rohu (Carp)',
        'Tilapia',
        'Seabass'
    )),
    stocking_date DATE NOT NULL DEFAULT CURRENT_DATE,
    days_of_culture INTEGER NOT NULL DEFAULT 1,
    stocking_density_per_sqm NUMERIC(6, 2) NOT NULL DEFAULT 40.0,
    total_stock_count INTEGER NOT NULL DEFAULT 50000,
    estimated_survival_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 85.0,
    current_estimated_biomass_kg NUMERIC(10, 2) NOT NULL DEFAULT 500.0,
    current_mean_body_weight_grams NUMERIC(6, 2) NOT NULL DEFAULT 10.0,
    target_harvest_weight_grams NUMERIC(6, 2) NOT NULL DEFAULT 25.0,
    target_harvest_date DATE,
    culture_stage TEXT NOT NULL CHECK (culture_stage IN (
        'Nursery',
        'Grow-out (Early)',
        'Grow-out (Mid)',
        'Pre-harvest',
        'Harvesting'
    )) DEFAULT 'Grow-out (Early)',
    aerator_hp_total NUMERIC(5, 2) NOT NULL DEFAULT 4.0,
    status TEXT NOT NULL CHECK (status IN ('Optimal', 'Attention', 'Critical', 'Fallow')) DEFAULT 'Optimal',
    last_water_quality_test TIMESTAMPTZ,
    last_feeding_recorded TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ponds_farm_id ON public.ponds(farm_id);
CREATE INDEX IF NOT EXISTS idx_ponds_status ON public.ponds(status);

-- -----------------------------------------------------------------------------
-- 4. WATER QUALITY READINGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.water_quality_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pond_id UUID NOT NULL REFERENCES public.ponds(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    recorded_by TEXT NOT NULL,
    temperature_c NUMERIC(4, 2) NOT NULL,
    ph NUMERIC(4, 2) NOT NULL,
    dissolved_oxygen_mg_l NUMERIC(5, 2) NOT NULL,
    transparency_cm NUMERIC(5, 2) NOT NULL,
    salinity_ppt NUMERIC(5, 2) NOT NULL DEFAULT 15.0,
    alkalinity_ppm NUMERIC(6, 2) NOT NULL DEFAULT 120.0,
    ammonia_ppm NUMERIC(5, 3) NOT NULL DEFAULT 0.05,
    nitrite_ppm NUMERIC(5, 3) NOT NULL DEFAULT 0.02,
    hardness_ppm NUMERIC(6, 2),
    notes TEXT,
    status TEXT NOT NULL CHECK (status IN ('Normal', 'Alert', 'Critical')) DEFAULT 'Normal',
    alerts_triggered TEXT[],
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_water_readings_pond_id ON public.water_quality_readings(pond_id);
CREATE INDEX IF NOT EXISTS idx_water_readings_timestamp ON public.water_quality_readings(timestamp DESC);

-- -----------------------------------------------------------------------------
-- 5. POND ASSESSMENTS (Diagnostic Engine Results)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pond_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pond_id UUID NOT NULL REFERENCES public.ponds(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    rule_version TEXT NOT NULL,
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    status TEXT NOT NULL CHECK (status IN ('Optimal', 'Good', 'Moderate', 'Critical')),
    parameter_evaluations JSONB NOT NULL,
    limiting_factors TEXT[] DEFAULT '{}',
    recommendations JSONB NOT NULL DEFAULT '[]',
    suggested_follow_ups TEXT[] DEFAULT '{}',
    missing_parameters TEXT[] DEFAULT '{}',
    disclaimer TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pond_assessments_pond_id ON public.pond_assessments(pond_id);
CREATE INDEX IF NOT EXISTS idx_pond_assessments_timestamp ON public.pond_assessments(timestamp DESC);

-- -----------------------------------------------------------------------------
-- 6. FEED RECORDS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feed_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pond_id UUID NOT NULL REFERENCES public.ponds(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    feed_slot TEXT NOT NULL CHECK (feed_slot IN (
        'Morning (06:00)',
        'Noon (11:00)',
        'Afternoon (15:00)',
        'Night (20:00)'
    )),
    feed_brand TEXT NOT NULL,
    feed_type TEXT NOT NULL CHECK (feed_type IN (
        'Starter (0.8mm-1.2mm)',
        'Grower (1.4mm-1.8mm)',
        'Finisher (2.0mm-2.4mm)',
        'Mash / Organic'
    )),
    quantity_kg NUMERIC(7, 2) NOT NULL,
    unit_price_per_kg NUMERIC(7, 2) NOT NULL,
    total_cost NUMERIC(10, 2) NOT NULL,
    check_tray_observation TEXT NOT NULL CHECK (check_tray_observation IN (
        '100% Consumed (Increase slightly)',
        'Clean (Nominal)',
        '10-20% Leftover (Reduce 10%)',
        'Heavy Leftover (Halt feeding)'
    )),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feed_records_pond_id ON public.feed_records(pond_id);
CREATE INDEX IF NOT EXISTS idx_feed_records_date ON public.feed_records(date DESC);

-- -----------------------------------------------------------------------------
-- 7. EXPENSE RECORDS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expense_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    pond_id UUID REFERENCES public.ponds(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL CHECK (category IN (
        'Feed',
        'Electricity & Diesel',
        'Seed / Post-Larvae',
        'Probiotics & Minerals',
        'Labour Wages',
        'Pond Maintenance & Soil Prep',
        'Lab Testing & Diagnostics',
        'Equipment & Aeration Spares',
        'Harvest & Logistics',
        'Government / Licensing Fees'
    )),
    amount NUMERIC(12, 2) NOT NULL,
    description TEXT NOT NULL,
    vendor_name TEXT NOT NULL,
    payment_mode TEXT NOT NULL CHECK (payment_mode IN (
        'Cash',
        'UPI',
        'NEFT / Bank Transfer',
        'Trader Credit'
    )),
    invoice_number TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_expense_records_farm_id ON public.expense_records(farm_id);
CREATE INDEX IF NOT EXISTS idx_expense_records_date ON public.expense_records(date DESC);

-- -----------------------------------------------------------------------------
-- 8. REMINDERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pond_id UUID REFERENCES public.ponds(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'Water Quality Testing',
        'Feeding Schedule',
        'Probiotic Application',
        'Aerator Maintenance',
        'Biomass Sampling',
        'Harvest Inspection',
        'Govt Scheme / Subsidy'
    )),
    due_date DATE NOT NULL,
    due_time TIME NOT NULL DEFAULT '08:00:00',
    priority TEXT NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')) DEFAULT 'Medium',
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Completed')) DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reminders_farmer_id ON public.reminders(farmer_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON public.reminders(due_date);

-- -----------------------------------------------------------------------------
-- 9. LEARNING ARTICLES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learning_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK (category IN (
        'water_management',
        'feed_management',
        'disease_awareness',
        'sustainable_aquaculture',
        'pond_maintenance',
        'waste_management'
    )),
    reading_time_minutes INTEGER NOT NULL DEFAULT 5,
    published_date DATE NOT NULL DEFAULT CURRENT_DATE,
    author TEXT NOT NULL,
    author_role TEXT NOT NULL,
    verified_by_expert BOOLEAN NOT NULL DEFAULT true,
    expert_name TEXT,
    title JSONB NOT NULL,
    summary JSONB NOT NULL,
    content_markdown JSONB NOT NULL,
    tags TEXT[] DEFAULT '{}',
    banner_gradient TEXT DEFAULT 'from-teal-600 to-cyan-700',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_learning_articles_slug ON public.learning_articles(slug);
CREATE INDEX IF NOT EXISTS idx_learning_articles_category ON public.learning_articles(category);

-- -----------------------------------------------------------------------------
-- 10. SUPPORT TICKETS & RESPONSES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'Water Quality Issue',
        'Feed & FCR Advice',
        'Disease & Abnormal Mortality',
        'Platform / Technical Issue',
        'Extension Officer Request'
    )),
    priority TEXT NOT NULL CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')) DEFAULT 'Medium',
    status TEXT NOT NULL CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')) DEFAULT 'Open',
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_farmer_id ON public.support_tickets(farmer_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);

CREATE TABLE IF NOT EXISTS public.support_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('Farmer', 'Extension Officer', 'AquaSustain Support', 'System')),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_support_responses_ticket_id ON public.support_responses(ticket_id);

-- -----------------------------------------------------------------------------
-- 11. AUDIT LOGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- -----------------------------------------------------------------------------
-- 12. NOTIFICATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('alert', 'info', 'warning', 'success')) DEFAULT 'info',
    read BOOLEAN NOT NULL DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- -----------------------------------------------------------------------------
-- Trigger for automatic updated_at updates
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_farms_updated_at ON public.farms;
CREATE TRIGGER set_farms_updated_at
    BEFORE UPDATE ON public.farms
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_ponds_updated_at ON public.ponds;
CREATE TRIGGER set_ponds_updated_at
    BEFORE UPDATE ON public.ponds
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER set_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
