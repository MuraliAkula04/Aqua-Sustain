const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rikyawlqxfrhkyrjvaus.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_IvA7QccxNmezbMhe79x4kQ_TDnm9ava';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const email = 'akulaypnsmurali04@gmail.com';
const password = 'admin@123';

async function seed() {
  console.log(`Checking / Signing up user: ${email}...`);

  // Attempt login first
  let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    console.log('SignIn failed, attempting signUp...', authError.message);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: 'Murali Akula',
          phone: '+91 98480 12345',
          role: 'farmer',
          preferred_language: 'en',
        },
      },
    });

    if (signUpError) {
      console.error('SignUp failed:', signUpError.message);
    } else {
      console.log('SignUp succeeded:', signUpData.user?.id);
    }

    // Try signing in again
    const reLogin = await supabase.auth.signInWithPassword({ email, password });
    authData = reLogin.data;
    authError = reLogin.error;
  }

  if (authError || !authData?.user) {
    console.log('Could not establish session (maybe email confirmation is on or credentials mismatch):', authError?.message);
    return;
  }

  const userId = authData.user.id;
  console.log('User signed in successfully! User ID:', userId);

  // 1. Upsert profile
  console.log('Updating profile...');
  const { error: profErr } = await supabase.from('profiles').upsert({
    id: userId,
    name: 'Murali Akula',
    email,
    phone: '+91 98480 12345',
    role: 'farmer',
    preferred_language: 'en',
    farm_count: 1,
    pond_count: 4,
    state: 'Andhra Pradesh',
    district: 'West Godavari',
    village: 'Undi',
  });
  if (profErr) console.log('Profile upsert note:', profErr.message);

  // 2. Insert Farm
  console.log('Inserting Farm...');
  let farmId = '';
  const { data: existingFarms } = await supabase.from('farms').select('*').eq('farmer_id', userId);
  if (existingFarms && existingFarms.length > 0) {
    console.log('Farm already exists:', existingFarms[0].name);
    farmId = existingFarms[0].id;
  } else {
    const { data: farm, error: farmErr } = await supabase
      .from('farms')
      .insert({
        farmer_id: userId,
        name: 'Sri Lakshmi Aqua Farm',
        state: 'Andhra Pradesh',
        district: 'West Godavari',
        mandal: 'Bhimavaram',
        village: 'Undi',
        total_area_acres: 12.5,
        water_source: 'Canal',
        soil_type: 'Clay Loam',
        caa_registration_number: 'CAA/2026/AP/WG/5512',
        established_year: 2022,
        status: 'Active',
      })
      .select()
      .single();

    if (farmErr) {
      console.error('Failed to insert farm:', farmErr.message);
      return;
    }
    farmId = farm.id;
    console.log('Created Farm ID:', farmId);
  }

  // 3. Insert 4 Ponds
  console.log('Checking / Inserting 4 Ponds...');
  const { data: existingPonds } = await supabase.from('ponds').select('*').eq('farm_id', farmId);
  if (existingPonds && existingPonds.length >= 4) {
    console.log('Ponds already exist for this farm. Count:', existingPonds.length);
  } else {
    const pondsToInsert = [
      {
        farm_id: farmId,
        name: 'Pond A-1 (High-Yield Vannamei)',
        code: 'SLA-P1',
        water_area_acres: 2.0,
        average_depth_meters: 1.5,
        species: 'L. vannamei (Whiteleg Shrimp)',
        stocking_date: '2026-10-15',
        days_of_culture: 37,
        stocking_density_per_sqm: 45,
        total_stock_count: 350000,
        estimated_survival_rate_percent: 92,
        current_estimated_biomass_kg: 480,
        current_mean_body_weight_grams: 4.2,
        target_harvest_weight_grams: 28,
        target_harvest_date: '2027-01-15',
        culture_stage: 'Grow-out (Early)',
        aerator_hp_total: 14,
        status: 'Optimal',
      },
      {
        farm_id: farmId,
        name: 'Pond B-2 (Tiger Prawn)',
        code: 'SLA-P2',
        water_area_acres: 1.8,
        average_depth_meters: 1.3,
        species: 'P. monodon (Black Tiger)',
        stocking_date: '2026-09-20',
        days_of_culture: 62,
        stocking_density_per_sqm: 20,
        total_stock_count: 140000,
        estimated_survival_rate_percent: 85,
        current_estimated_biomass_kg: 720,
        current_mean_body_weight_grams: 8.5,
        target_harvest_weight_grams: 35,
        target_harvest_date: '2027-02-10',
        culture_stage: 'Grow-out (Mid)',
        aerator_hp_total: 10,
        status: 'Attention',
      },
      {
        farm_id: farmId,
        name: 'Pond C-3 (Nursery)',
        code: 'SLA-P3',
        water_area_acres: 0.5,
        average_depth_meters: 0.9,
        species: 'L. vannamei (Whiteleg Shrimp)',
        stocking_date: '2026-11-10',
        days_of_culture: 11,
        stocking_density_per_sqm: 150,
        total_stock_count: 300000,
        estimated_survival_rate_percent: 95,
        current_estimated_biomass_kg: 15,
        current_mean_body_weight_grams: 0.3,
        target_harvest_weight_grams: 1.5,
        target_harvest_date: '2026-12-15',
        culture_stage: 'Nursery',
        aerator_hp_total: 4,
        status: 'Optimal',
      },
      {
        farm_id: farmId,
        name: 'Pond D-4 (Carp Mixed)',
        code: 'SLA-P4',
        water_area_acres: 3.0,
        average_depth_meters: 1.8,
        species: 'Catla & Rohu (Carp)',
        stocking_date: '2026-08-01',
        days_of_culture: 112,
        stocking_density_per_sqm: 8,
        total_stock_count: 95000,
        estimated_survival_rate_percent: 88,
        current_estimated_biomass_kg: 2100,
        current_mean_body_weight_grams: 180,
        target_harvest_weight_grams: 500,
        target_harvest_date: '2027-03-01',
        culture_stage: 'Grow-out (Mid)',
        aerator_hp_total: 8,
        status: 'Optimal',
      },
    ];

    const { data: newPonds, error: pondsErr } = await supabase.from('ponds').insert(pondsToInsert).select();
    if (pondsErr) {
      console.error('Error inserting ponds:', pondsErr.message);
    } else {
      console.log('Inserted ponds count:', newPonds?.length);
    }
  }

  // 4. Sample Water Readings
  const { data: allPonds } = await supabase.from('ponds').select('*').eq('farm_id', farmId);
  if (allPonds && allPonds.length > 0) {
    console.log('Inserting water readings...');
    const readings = [
      { pond_id: allPonds[0].id, temperature_c: 27.8, ph: 7.9, dissolved_oxygen_mg_l: 5.6, salinity_ppt: 18, transparency_cm: 34, ammonia_ppm: 0.08, alkalinity_ppm: 140 },
      { pond_id: allPonds[1].id, temperature_c: 29.2, ph: 7.5, dissolved_oxygen_mg_l: 4.2, salinity_ppt: 22, transparency_cm: 25, ammonia_ppm: 0.25, alkalinity_ppm: 110 },
      { pond_id: allPonds[2].id, temperature_c: 26.5, ph: 8.1, dissolved_oxygen_mg_l: 6.8, salinity_ppt: 15, transparency_cm: 40, ammonia_ppm: 0.02, alkalinity_ppm: 160 },
      { pond_id: allPonds[3].id, temperature_c: 25.0, ph: 7.6, dissolved_oxygen_mg_l: 5.0, salinity_ppt: 0, transparency_cm: 28, ammonia_ppm: 0.12, alkalinity_ppm: 120 },
    ];
    await supabase.from('water_quality_readings').insert(readings);
  }

  console.log('All demo data seeded successfully!');
}

seed();
