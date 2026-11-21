import {
  UserProfile,
  Farm,
  Pond,
  WaterQualityReading,
  AssessmentInput,
  AssessmentResult,
  FeedRecord,
  ExpenseRecord,
  Reminder,
  LearningArticle,
  SupportTicket,
  WeatherData,
  AuditLogItem,
  PlatformMetrics,
  UserRole,
  LanguageCode,
} from '../types';

import {
  INITIAL_USER,
  INITIAL_ADMIN_USER,
  INITIAL_EVALUATOR_USER,
  INITIAL_FARMS,
  INITIAL_PONDS,
  INITIAL_WATER_READINGS,
  INITIAL_FEEDS,
  INITIAL_EXPENSES,
  INITIAL_REMINDERS,
  INITIAL_ARTICLES,
  INITIAL_WEATHER,
  INITIAL_SUPPORT_TICKETS,
  INITIAL_AUDIT_LOGS,
  INITIAL_PLATFORM_METRICS,
} from '../mock/mockData';

import { evaluatePondConditions } from '../business-logic/pondAssessmentEngine';
import { getSupabase } from './supabaseClient';

export interface ServiceResponse<T> {
  data: T | null;
  error: Error | null;
}

interface StoreData {
  currentUser: UserProfile;
  farms: Farm[];
  ponds: Pond[];
  waterReadings: WaterQualityReading[];
  assessments: AssessmentResult[];
  feedRecords: FeedRecord[];
  expenseRecords: ExpenseRecord[];
  reminders: Reminder[];
  articles: LearningArticle[];
  weather: WeatherData;
  supportTickets: SupportTicket[];
  auditLogs: AuditLogItem[];
  metrics: PlatformMetrics;
}

const STORAGE_KEY = 'aquasustain_session_store_v1';

class DataService {
  private data: StoreData;
  private listeners: Set<() => void> = new Set();
  private authListenerSetUp = false;

  constructor() {
    this.data = this.loadInitialData();
  }

  /**
   * Must be called once after initSupabase() so the app reacts to login,
   * logout, token-refresh and session-restore events automatically.
   */
  public setupAuthListener() {
    if (this.authListenerSetUp) return;
    const supabase = getSupabase();
    if (!supabase) return;
    this.authListenerSetUp = true;

    supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await this.fetchCurrentUserProfile();
        this.notify();
      } else if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
        this.data.currentUser = { ...INITIAL_USER, id: 'demo-unauthenticated', name: 'Guest' };
        this.clearMockDataForAuthenticatedUser();
        this.persist();
      }
    });

    // Also check for an existing session on startup (restore persisted login)
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (session?.user) {
        this.fetchCurrentUserProfile().then(() => this.notify());
      }
    });
  }

  private loadInitialData(): StoreData {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          // If the saved user is a known mock/demo user, discard and start fresh
          const savedId = parsed?.currentUser?.id || '';
          const isMockId = savedId === 'usr-farmer-01' || savedId === 'farmer-1' || savedId.startsWith('demo-') || savedId === '';
          if (isMockId) {
            window.localStorage.removeItem(STORAGE_KEY);
            return this.getFreshSeedData();
          }
          // If the saved user is a real auth user, return cleaned data (no mock farms/ponds)
          return parsed;
        }
      } catch (e) {
        console.warn('Failed to parse storage data, falling back to seed', e);
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    return this.getFreshSeedData();
  }

  private getFreshSeedData(): StoreData {
    return {
      currentUser: { ...INITIAL_USER },
      farms: [...INITIAL_FARMS],
      ponds: [...INITIAL_PONDS],
      waterReadings: [...INITIAL_WATER_READINGS],
      assessments: [
        evaluatePondConditions(
          {
            pondId: 'pond-01',
            waterTemperatureC: 27.8,
            ph: 7.9,
            dissolvedOxygenMgL: 5.6,
            transparencyCm: 34,
            ammoniaPpm: 0.08,
            feedIntakeCondition: 'Normal',
            stockBehaviour: 'Active and Schooling',
            mortalityObservations: 'None',
            waterColor: 'Light Green (Diatom)',
            aerationHoursPerDay: 14,
            wasteSludgeStatus: 'Clean / Skimmed',
          },
          'Pond A-1 (High-Yield Vannamei)'
        ),
      ],
      feedRecords: [...INITIAL_FEEDS],
      expenseRecords: [...INITIAL_EXPENSES],
      reminders: [...INITIAL_REMINDERS],
      articles: [...INITIAL_ARTICLES],
      weather: this.generateCurrentWeather(),
      supportTickets: [...INITIAL_SUPPORT_TICKETS],
      auditLogs: [...INITIAL_AUDIT_LOGS],
      metrics: { ...INITIAL_PLATFORM_METRICS },
    };
  }

  private generateCurrentWeather() {
    const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const baseWeather = { ...INITIAL_WEATHER };
    const now = new Date();
    const forecast = [];
    for (let i = 1; i <= 5; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const isoDate = d.toISOString().split('T')[0];
      const src = INITIAL_WEATHER.forecast[i - 1];
      forecast.push({
        ...(src || {}),
        date: isoDate,
        dayLabel: i === 1 ? 'Tomorrow' : DAY_LABELS[d.getDay()],
        condition: src?.condition || 'Partly Cloudy',
        minTempC: src?.minTempC ?? 24,
        maxTempC: src?.maxTempC ?? 32,
        rainProbabilityPercent: src?.rainProbabilityPercent ?? 20,
        windSpeedKmh: src?.windSpeedKmh ?? 15,
      });
    }
    return { ...baseWeather, asOf: now.toISOString(), forecast };
  }

  private persist() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch (e) {
        console.error('Failed to save to localStorage', e);
      }
    }
    this.notify();
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('Listener callback error', err);
      }
    });
  }

  // ===========================================================================
  // AUTHENTICATION & USER MANAGEMENT
  // ===========================================================================

  public async signUp(email: string, password: string, metadata: { name: string; phone?: string; role?: UserRole }) {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: metadata.name,
            phone: metadata.phone || '',
            role: metadata.role || 'farmer',
            preferred_language: 'en',
          },
        },
      });
      if (error) throw error;

      // If Supabase returned a session directly (email confirmation disabled),
      // the user is already logged in — load their profile.
      if (data.session) {
        await this.fetchCurrentUserProfile();
        this.notify();
        return data;
      }

      // If no session, email confirmation may be required.
      // Try to auto-sign-in immediately (works when "Confirm email" is OFF
      // in Supabase dashboard, or for existing confirmed users).
      try {
        const signInResult = await supabase.auth.signInWithPassword({ email, password });
        if (!signInResult.error && signInResult.data.session) {
          await this.fetchCurrentUserProfile();
          this.notify();
          return signInResult.data;
        }
      } catch (_ignored) {
        // Auto-sign-in failed — email confirmation is likely required.
      }

      return data;
    }
    return { user: { id: `user-${Date.now()}`, email }, session: null };
  }

  public async signIn(email: string, password: string) {
    const supabase = getSupabase();
    if (supabase) {
      // Clear any stale localStorage data before logging in so old mock data doesn't persist
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // Provide a user-friendly message for unconfirmed emails
        if (error.message?.toLowerCase().includes('email not confirmed')) {
          throw new Error('Your email is not yet confirmed. Please check your inbox (and spam folder) for a confirmation link, or try registering again.');
        }
        throw error;
      }
      // Reset to clean state before fetching real data
      this.data.farms = [];
      this.data.ponds = [];
      this.data.waterReadings = [];
      this.data.assessments = [];
      this.data.feedRecords = [];
      this.data.expenseRecords = [];
      this.data.reminders = [];
      this.data.supportTickets = [];
      await this.fetchCurrentUserProfile();
      this.notify();
      return data;
    }
    throw new Error('Unable to connect to authentication service. Please check your internet connection and try again.');
  }

  public async signOut() {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('SignOut error', e);
      }
    }
    this.data.currentUser = { ...INITIAL_USER, id: 'demo-unauthenticated', name: 'Guest' };
    this.clearMockDataForAuthenticatedUser();
    this.persist();
  }

  public async resetPassword(email: string) {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return data;
    }
    return { message: 'Password reset link sent (demo)' };
  }

  public async fetchCurrentUserProfile(): Promise<UserProfile | null> {
    const supabase = getSupabase();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data) {
        let userName = data.name;
        const metaName = user.user_metadata?.name;
        if (metaName && metaName.toLowerCase() !== 'unknown' && !metaName.includes('@')) {
          userName = metaName;
        } else if (!userName || userName.toLowerCase() === 'unknown' || userName.trim() === '' || userName.includes('@')) {
          const emailPrefix = user.email ? user.email.split('@')[0] : 'Farmer';
          userName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
        }

        this.data.currentUser = {
          id: data.id,
          name: userName,
          phone: data.phone || user.user_metadata?.phone || '',
          email: data.email || user.email || '',
          role: (data.role || 'farmer') as UserRole,
          preferredLanguage: (data.preferred_language || 'en') as LanguageCode,
          farmCount: data.farm_count || 0,
          pondCount: data.pond_count || 0,
          state: data.state || 'Andhra Pradesh',
          district: data.district || 'West Godavari',
          village: data.village || 'Bhimavaram',
          avatarUrl: data.avatar_url,
          createdAt: data.created_at,
        };
        this.clearMockDataForAuthenticatedUser();
        this.persist();
        return this.data.currentUser;
      } else if (!data) {
        // Fallback: If trigger hasn't finished or profile is missing, construct from user metadata & upsert
        let name = user.user_metadata?.name;
        if (!name || name.toLowerCase() === 'unknown') {
          name = user.email?.split('@')[0] || 'Farmer';
        }
        const phone = user.user_metadata?.phone || '';
        const role = (user.user_metadata?.role as UserRole) || 'farmer';
        const lang = (user.user_metadata?.preferred_language as LanguageCode) || 'en';

        this.data.currentUser = {
          id: user.id,
          name,
          phone,
          email: user.email || '',
          role,
          preferredLanguage: lang,
          farmCount: 0,
          pondCount: 0,
          state: 'Andhra Pradesh',
          district: 'West Godavari',
          village: 'Bhimavaram',
          createdAt: user.created_at || new Date().toISOString(),
        };
        this.clearMockDataForAuthenticatedUser();

        // Attempt upserting to public.profiles
        try {
          await supabase.from('profiles').upsert({
            id: user.id,
            name,
            phone,
            email: user.email,
            role,
            preferred_language: lang,
            state: 'Andhra Pradesh',
            district: 'West Godavari',
            village: 'Bhimavaram',
          });
        } catch (e) {
          console.warn('Profile upsert fallback warning', e);
        }

        this.persist();
        return this.data.currentUser;
      }
    }
    return this.getCurrentUser();
  }

  public clearMockDataForAuthenticatedUser() {
    this.data.farms = [];
    this.data.ponds = [];
    this.data.waterReadings = [];
    this.data.assessments = [];
    this.data.feedRecords = [];
    this.data.expenseRecords = [];
    this.data.reminders = [];
    this.data.supportTickets = [];
    this.notify();
  }

  /**
   * Seeds demo/stock data for the currently authenticated user.
   * Creates a farm + 4 ponds + water quality readings + feed records + expenses.
   * Idempotent — skips if the user already has farms.
   */
  public async seedDemoDataForUser(): Promise<void> {
    // Only seed if authenticated and has no farms yet
    if (!this.isAuthenticated()) return;
    const existingFarms = this.getFarms();

    // Also check Supabase for existing farms
    const supabase = getSupabase();
    if (supabase && existingFarms.length === 0) {
      const { data: dbFarms } = await supabase
        .from('farms')
        .select('id')
        .limit(1);
      if (dbFarms && dbFarms.length > 0) {
        await this.fetchFarms();
        await this.fetchPonds();
        return;
      }
    }

    if (existingFarms.length > 0) return;

    // Create a demo farm
    const farm = await this.addFarm({
      name: 'Sri Lakshmi Aqua Farm',
      state: 'Andhra Pradesh',
      district: 'West Godavari',
      mandal: 'Bhimavaram',
      village: 'Undi',
      totalAreaAcres: 12.5,
      waterSource: 'Canal',
      soilType: 'Clay Loam',
      caaRegistrationNumber: 'CAA/2026/AP/WG/5512',
      establishedYear: 2022,
      status: 'Active',
    });

    // Create 4 demo ponds
    const demoPonds = [
      {
        farmId: farm.id,
        name: 'Pond A-1 (High-Yield Vannamei)',
        code: 'SLA-P1',
        waterAreaAcres: 2.0,
        averageDepthMeters: 1.5,
        species: 'L. vannamei (Whiteleg Shrimp)' as SpeciesType,
        stockingDate: '2026-10-15',
        daysOfCulture: 37,
        stockingDensityPerSqm: 45,
        totalStockCount: 350000,
        estimatedSurvivalRatePercent: 92,
        currentEstimatedBiomassKg: 480,
        currentMeanBodyWeightGrams: 4.2,
        targetHarvestWeightGrams: 28,
        targetHarvestDate: '2027-01-15',
        cultureStage: 'Grow-out (Early)' as CultureStage,
        aeratorHpTotal: 14,
        status: 'Optimal' as const,
      },
      {
        farmId: farm.id,
        name: 'Pond B-2 (Tiger Prawn)',
        code: 'SLA-P2',
        waterAreaAcres: 1.8,
        averageDepthMeters: 1.3,
        species: 'P. monodon (Black Tiger)' as SpeciesType,
        stockingDate: '2026-09-20',
        daysOfCulture: 62,
        stockingDensityPerSqm: 20,
        totalStockCount: 140000,
        estimatedSurvivalRatePercent: 85,
        currentEstimatedBiomassKg: 720,
        currentMeanBodyWeightGrams: 8.5,
        targetHarvestWeightGrams: 35,
        targetHarvestDate: '2027-02-10',
        cultureStage: 'Grow-out (Mid)' as CultureStage,
        aeratorHpTotal: 10,
        status: 'Attention' as const,
      },
      {
        farmId: farm.id,
        name: 'Pond C-3 (Nursery)',
        code: 'SLA-P3',
        waterAreaAcres: 0.5,
        averageDepthMeters: 0.9,
        species: 'L. vannamei (Whiteleg Shrimp)' as SpeciesType,
        stockingDate: '2026-11-10',
        daysOfCulture: 11,
        stockingDensityPerSqm: 150,
        totalStockCount: 300000,
        estimatedSurvivalRatePercent: 95,
        currentEstimatedBiomassKg: 15,
        currentMeanBodyWeightGrams: 0.3,
        targetHarvestWeightGrams: 1.5,
        targetHarvestDate: '2026-12-15',
        cultureStage: 'Nursery' as CultureStage,
        aeratorHpTotal: 4,
        status: 'Optimal' as const,
      },
      {
        farmId: farm.id,
        name: 'Pond D-4 (Carp Mixed)',
        code: 'SLA-P4',
        waterAreaAcres: 3.0,
        averageDepthMeters: 1.8,
        species: 'Catla & Rohu (Carp)' as SpeciesType,
        stockingDate: '2026-08-01',
        daysOfCulture: 112,
        stockingDensityPerSqm: 8,
        totalStockCount: 95000,
        estimatedSurvivalRatePercent: 88,
        currentEstimatedBiomassKg: 2100,
        currentMeanBodyWeightGrams: 180,
        targetHarvestWeightGrams: 500,
        targetHarvestDate: '2027-03-01',
        cultureStage: 'Grow-out (Mid)' as CultureStage,
        aeratorHpTotal: 8,
        status: 'Optimal' as const,
      },
    ];

    for (const pond of demoPonds) {
      await this.addPond(pond);
    }

    // Add sample water quality readings
    const ponds = this.getPonds();
    if (ponds.length > 0) {
      const sampleReadings = [
        { pondId: ponds[0].id, temperatureC: 27.8, ph: 7.9, dissolvedOxygenMgL: 5.6, salinityPpt: 18, transparencyCm: 34, ammoniaPpm: 0.08, alkalinityPpm: 140, recordedAt: new Date().toISOString() },
        { pondId: ponds[0].id, temperatureC: 28.1, ph: 8.0, dissolvedOxygenMgL: 5.4, salinityPpt: 17, transparencyCm: 32, ammoniaPpm: 0.10, alkalinityPpm: 135, recordedAt: new Date(Date.now() - 86400000).toISOString() },
        { pondId: ponds[1].id, temperatureC: 29.2, ph: 7.5, dissolvedOxygenMgL: 4.2, salinityPpt: 22, transparencyCm: 25, ammoniaPpm: 0.25, alkalinityPpm: 110, recordedAt: new Date().toISOString() },
        { pondId: ponds[2].id, temperatureC: 26.5, ph: 8.1, dissolvedOxygenMgL: 6.8, salinityPpt: 15, transparencyCm: 40, ammoniaPpm: 0.02, alkalinityPpm: 160, recordedAt: new Date().toISOString() },
        { pondId: ponds[3].id, temperatureC: 25.0, ph: 7.6, dissolvedOxygenMgL: 5.0, salinityPpt: 0, transparencyCm: 28, ammoniaPpm: 0.12, alkalinityPpm: 120, recordedAt: new Date().toISOString() },
      ];
      for (const reading of sampleReadings) {
        await this.addWaterReading(reading);
      }
    }

    // Add sample feed records
    if (ponds.length > 0) {
      const feedData = [
        { pondId: ponds[0].id, feedType: 'Commercial Pellet (CP 38%)', quantityKg: 45, feedingTime: 'Morning & Evening', date: new Date().toISOString().split('T')[0], notes: 'Normal intake, no leftover' },
        { pondId: ponds[1].id, feedType: 'Commercial Pellet (CP 35%)', quantityKg: 35, feedingTime: 'Morning & Evening', date: new Date().toISOString().split('T')[0], notes: 'Slight reduction due to cloudy weather' },
        { pondId: ponds[3].id, feedType: 'Rice Bran + Oil Cake Mix', quantityKg: 25, feedingTime: 'Morning', date: new Date().toISOString().split('T')[0], notes: 'Supplementary feeding' },
      ];
      for (const feed of feedData) {
        await this.addFeedRecord(feed);
      }
    }

    // Add sample expenses
    const expenseData = [
      { category: 'Feed', amount: 45000, date: new Date().toISOString().split('T')[0], description: 'Commercial Pellet 500kg bag - Avanti Feeds', vendor: 'Avanti Feeds Ltd' },
      { category: 'Labor', amount: 18000, date: new Date().toISOString().split('T')[0], description: 'Monthly wages - 3 workers', vendor: '' },
      { category: 'Electricity', amount: 12000, date: new Date().toISOString().split('T')[0], description: 'Aerator power consumption (Oct)', vendor: 'APSPDCL' },
      { category: 'Chemicals', amount: 5500, date: new Date().toISOString().split('T')[0], description: 'Probiotics + Dolomite lime', vendor: 'Local Agri Store' },
    ];
    for (const exp of expenseData) {
      await this.addExpense(exp);
    }

    this.persist();
    this.notify();
  }

  public isAuthenticated(): boolean {
    if (!this.data.currentUser || !this.data.currentUser.id) return false;
    const id = this.data.currentUser.id;
    // Known mock/demo user IDs — these are not real authenticated users
    const mockIds = ['usr-farmer-01', 'farmer-1', 'admin-01', 'evaluator-01'];
    if (id.startsWith('demo-') || mockIds.includes(id)) return false;
    return true;
  }

  // Session & Demo Data Reset
  public resetToDemoData() {
    this.data = this.getFreshSeedData();
    this.persist();
  }

  // User & Roles
  public getCurrentUser(): UserProfile {
    return { ...this.data.currentUser };
  }

  public async setLanguage(lang: LanguageCode) {
    this.data.currentUser = { ...this.data.currentUser, preferredLanguage: lang };
    const supabase = getSupabase();
    if (supabase && this.data.currentUser.id) {
      try {
        await supabase
          .from('profiles')
          .update({ preferred_language: lang })
          .eq('id', this.data.currentUser.id);
      } catch (err) {
        console.warn('Failed to update language on backend', err);
      }
    }
    this.persist();
  }

  public switchRole(role: UserRole) {
    if (role === 'admin') {
      this.data.currentUser = { ...INITIAL_ADMIN_USER, preferredLanguage: this.data.currentUser.preferredLanguage };
    } else if (role === 'evaluator') {
      this.data.currentUser = { ...INITIAL_EVALUATOR_USER, preferredLanguage: this.data.currentUser.preferredLanguage };
    } else {
      this.data.currentUser = { ...INITIAL_USER, preferredLanguage: this.data.currentUser.preferredLanguage };
    }
    this.persist();
  }

  public async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    this.data.currentUser = { ...this.data.currentUser, ...updates };
    const supabase = getSupabase();
    if (supabase && this.data.currentUser.id) {
      try {
        await supabase
          .from('profiles')
          .update({
            name: updates.name,
            phone: updates.phone,
            preferred_language: updates.preferredLanguage,
            state: updates.state,
            district: updates.district,
            village: updates.village,
            avatar_url: updates.avatarUrl,
          })
          .eq('id', this.data.currentUser.id);
      } catch (err) {
        console.warn('Failed to persist profile update to Supabase', err);
      }
    }
    this.persist();
    return this.data.currentUser;
  }

  // ===========================================================================
  // FARMS
  // ===========================================================================

  public async fetchFarms(): Promise<Farm[]> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        this.data.farms = data.map((f: any) => ({
          id: f.id,
          farmerId: f.farmer_id,
          name: f.name,
          state: f.state,
          district: f.district,
          mandal: f.mandal,
          village: f.village,
          totalAreaAcres: Number(f.total_area_acres),
          waterSource: f.water_source,
          soilType: f.soil_type,
          registrationNumber: f.registration_number,
          caaRegistrationNumber: f.caa_registration_number,
          establishedYear: f.established_year,
          status: f.status,
        }));
        this.data.currentUser.farmCount = this.data.farms.length;
        this.notify();
        return this.data.farms;
      }
    }
    return this.getFarms();
  }

  public getFarms(): Farm[] {
    return [...this.data.farms];
  }

  public getFarmById(id: string): Farm | undefined {
    return this.data.farms.find((f) => f.id === id);
  }

  public async addFarm(farmData: Omit<Farm, 'id' | 'farmerId'>): Promise<Farm> {
    const supabase = getSupabase();
    let newFarm: Farm;

    if (supabase) {
      let farmerId = this.data.currentUser.id;
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.id) {
          farmerId = authData.user.id;
          this.data.currentUser.id = farmerId;
        }
      } catch (e) {
        // fallback to current user id
      }

      const { data, error } = await supabase
        .from('farms')
        .insert({
          farmer_id: farmerId,
          name: farmData.name,
          state: farmData.state,
          district: farmData.district,
          mandal: farmData.mandal,
          village: farmData.village,
          total_area_acres: farmData.totalAreaAcres,
          water_source: farmData.waterSource,
          soil_type: farmData.soilType,
          registration_number: farmData.registrationNumber,
          caa_registration_number: farmData.caaRegistrationNumber,
          established_year: farmData.establishedYear,
          status: farmData.status,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase addFarm error:', error);
      } else if (data) {
        newFarm = {
          id: data.id,
          farmerId: data.farmer_id,
          name: data.name,
          state: data.state,
          district: data.district,
          mandal: data.mandal,
          village: data.village,
          totalAreaAcres: Number(data.total_area_acres),
          waterSource: data.water_source,
          soilType: data.soil_type,
          registrationNumber: data.registration_number,
          caaRegistrationNumber: data.caa_registration_number,
          establishedYear: data.established_year,
          status: data.status,
        };
        this.data.farms.unshift(newFarm);
        this.data.currentUser.farmCount = this.data.farms.length;
        this.logAction('Registered Farm', 'Farm', newFarm.id, `Created ${newFarm.name}`);
        this.persist();
        return newFarm;
      }
    }

    newFarm = {
      ...farmData,
      id: `farm-${Date.now()}`,
      farmerId: this.data.currentUser.id,
    };
    this.data.farms.unshift(newFarm);
    this.data.currentUser.farmCount = this.data.farms.length;
    this.logAction('Registered Farm', 'Farm', newFarm.id, `Created ${newFarm.name}`);
    this.persist();
    return newFarm;
  }

  public async updateFarm(id: string, updates: Partial<Farm>): Promise<Farm | undefined> {
    const supabase = getSupabase();
    if (supabase) {
      await supabase
        .from('farms')
        .update({
          name: updates.name,
          state: updates.state,
          district: updates.district,
          mandal: updates.mandal,
          village: updates.village,
          total_area_acres: updates.totalAreaAcres,
          water_source: updates.waterSource,
          soil_type: updates.soilType,
          status: updates.status,
        })
        .eq('id', id);
    }

    const idx = this.data.farms.findIndex((f) => f.id === id);
    if (idx === -1) return undefined;
    this.data.farms[idx] = { ...this.data.farms[idx], ...updates };
    this.persist();
    return this.data.farms[idx];
  }

  public async deleteFarm(id: string): Promise<boolean> {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('farms').delete().eq('id', id);
    }

    const initialLen = this.data.farms.length;
    this.data.farms = this.data.farms.filter((f) => f.id !== id);
    this.data.ponds = this.data.ponds.filter((p) => p.farmId !== id);
    this.data.currentUser.farmCount = this.data.farms.length;
    this.data.currentUser.pondCount = this.data.ponds.length;
    this.persist();
    return this.data.farms.length < initialLen;
  }

  // ===========================================================================
  // PONDS
  // ===========================================================================

  public async fetchPonds(farmId?: string): Promise<Pond[]> {
    const supabase = getSupabase();
    if (supabase) {
      let query = supabase.from('ponds').select('*').order('created_at', { ascending: false });
      if (farmId) query = query.eq('farm_id', farmId);

      const { data, error } = await query;
      if (!error && data) {
        const fetchedPonds: Pond[] = data.map((p: any) => ({
          id: p.id,
          farmId: p.farm_id,
          name: p.name,
          code: p.code,
          waterAreaAcres: Number(p.water_area_acres),
          averageDepthMeters: Number(p.average_depth_meters),
          species: p.species,
          stockingDate: p.stocking_date,
          daysOfCulture: p.days_of_culture,
          stockingDensityPerSqm: Number(p.stocking_density_per_sqm),
          totalStockCount: p.total_stock_count,
          estimatedSurvivalRatePercent: Number(p.estimated_survival_rate_percent),
          currentEstimatedBiomassKg: Number(p.current_estimated_biomass_kg),
          currentMeanBodyWeightGrams: Number(p.current_mean_body_weight_grams),
          targetHarvestWeightGrams: Number(p.target_harvest_weight_grams),
          targetHarvestDate: p.target_harvest_date,
          cultureStage: p.culture_stage,
          aeratorHpTotal: Number(p.aerator_hp_total),
          status: p.status,
          lastWaterQualityTest: p.last_water_quality_test,
          lastFeedingRecorded: p.last_feeding_recorded,
        }));

        if (farmId) {
          this.data.ponds = [
            ...this.data.ponds.filter((p) => p.farmId !== farmId),
            ...fetchedPonds,
          ];
        } else {
          this.data.ponds = fetchedPonds;
        }
        this.data.currentUser.pondCount = this.data.ponds.length;
        this.notify();
        return this.getPonds(farmId);
      }
    }
    return this.getPonds(farmId);
  }

  public getPonds(farmId?: string): Pond[] {
    if (farmId) {
      return this.data.ponds.filter((p) => p.farmId === farmId);
    }
    return [...this.data.ponds];
  }

  public getPondById(id: string): Pond | undefined {
    return this.data.ponds.find((p) => p.id === id);
  }

  /**
   * Ensures at least one farm exists for the current user.
   * If no farms are present, auto-creates a default farm in Supabase (or locally).
   * Returns the first farm's ID.
   */
  public async ensureDefaultFarm(): Promise<string> {
    if (this.data.farms.length > 0) return this.data.farms[0].id;

    const defaultFarm = await this.addFarm({
      name: 'My Aqua Farm',
      state: 'Andhra Pradesh',
      district: 'West Godavari',
      mandal: 'Bhimavaram',
      village: 'Bhimavaram',
      totalAreaAcres: 5,
      waterSource: 'Canal',
      soilType: 'Clay Loam',
      caaRegistrationNumber: '',
      establishedYear: new Date().getFullYear(),
      status: 'Active',
    });
    return defaultFarm.id;
  }

  public async addPond(pondData: Omit<Pond, 'id'>): Promise<Pond> {
    const supabase = getSupabase();
    let newPond: Pond;

    // If no farmId provided or no farms exist, auto-create a default farm
    let farmId = pondData.farmId;
    if (!farmId || !this.data.farms.some((f) => f.id === farmId)) {
      farmId = await this.ensureDefaultFarm();
    }

    if (supabase) {
      const { data, error } = await supabase
        .from('ponds')
        .insert({
          farm_id: farmId,
          name: pondData.name,
          code: pondData.code,
          water_area_acres: pondData.waterAreaAcres,
          average_depth_meters: pondData.averageDepthMeters,
          species: pondData.species,
          stocking_date: pondData.stockingDate,
          days_of_culture: pondData.daysOfCulture,
          stocking_density_per_sqm: pondData.stockingDensityPerSqm,
          total_stock_count: pondData.totalStockCount,
          estimated_survival_rate_percent: pondData.estimatedSurvivalRatePercent,
          current_estimated_biomass_kg: pondData.currentEstimatedBiomassKg,
          current_mean_body_weight_grams: pondData.currentMeanBodyWeightGrams,
          target_harvest_weight_grams: pondData.targetHarvestWeightGrams,
          target_harvest_date: pondData.targetHarvestDate || null,
          culture_stage: pondData.cultureStage,
          aerator_hp_total: pondData.aeratorHpTotal,
          status: pondData.status,
        })
        .select()
        .single();

      if (!error && data) {
        newPond = {
          id: data.id,
          farmId: data.farm_id,
          name: data.name,
          code: data.code,
          waterAreaAcres: Number(data.water_area_acres),
          averageDepthMeters: Number(data.average_depth_meters),
          species: data.species,
          stockingDate: data.stocking_date,
          daysOfCulture: data.days_of_culture,
          stockingDensityPerSqm: Number(data.stocking_density_per_sqm),
          totalStockCount: data.total_stock_count,
          estimatedSurvivalRatePercent: Number(data.estimated_survival_rate_percent),
          currentEstimatedBiomassKg: Number(data.current_estimated_biomass_kg),
          currentMeanBodyWeightGrams: Number(data.current_mean_body_weight_grams),
          targetHarvestWeightGrams: Number(data.target_harvest_weight_grams),
          targetHarvestDate: data.target_harvest_date,
          cultureStage: data.culture_stage,
          aeratorHpTotal: Number(data.aerator_hp_total),
          status: data.status,
          lastWaterQualityTest: data.last_water_quality_test,
          lastFeedingRecorded: data.last_feeding_recorded,
        };
        this.data.ponds.unshift(newPond);
        this.data.currentUser.pondCount = this.data.ponds.length;
        this.logAction('Registered Pond', 'Pond', newPond.id, `Registered ${newPond.name}`);
        this.persist();
        return newPond;
      }
    }

    newPond = {
      ...pondData,
      farmId,
      id: `pond-${Date.now()}`,
    };
    this.data.ponds.unshift(newPond);
    this.data.currentUser.pondCount = this.data.ponds.length;
    this.logAction('Registered Pond', 'Pond', newPond.id, `Registered ${newPond.name}`);
    this.persist();
    return newPond;
  }

  public async updatePond(id: string, updates: Partial<Pond>): Promise<Pond | undefined> {
    const supabase = getSupabase();
    if (supabase) {
      await supabase
        .from('ponds')
        .update({
          name: updates.name,
          code: updates.code,
          status: updates.status,
          current_estimated_biomass_kg: updates.currentEstimatedBiomassKg,
          current_mean_body_weight_grams: updates.currentMeanBodyWeightGrams,
        })
        .eq('id', id);
    }

    const idx = this.data.ponds.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    this.data.ponds[idx] = { ...this.data.ponds[idx], ...updates };
    this.persist();
    return this.data.ponds[idx];
  }

  public async deletePond(id: string): Promise<boolean> {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('ponds').delete().eq('id', id);
    }

    const initialLen = this.data.ponds.length;
    this.data.ponds = this.data.ponds.filter((p) => p.id !== id);
    this.data.currentUser.pondCount = this.data.ponds.length;
    this.persist();
    return this.data.ponds.length < initialLen;
  }

  // ===========================================================================
  // WATER QUALITY READINGS
  // ===========================================================================

  public async fetchWaterReadings(pondId?: string): Promise<WaterQualityReading[]> {
    const supabase = getSupabase();
    if (supabase) {
      let query = supabase.from('water_quality_readings').select('*').order('timestamp', { ascending: false });
      if (pondId) query = query.eq('pond_id', pondId);

      const { data, error } = await query;
      if (!error && data) {
        const readings: WaterQualityReading[] = data.map((r: any) => {
          const pond = this.getPondById(r.pond_id);
          return {
            id: r.id,
            pondId: r.pond_id,
            pondName: pond ? pond.name : 'Pond',
            timestamp: r.timestamp,
            recordedBy: r.recorded_by,
            temperatureC: Number(r.temperature_c),
            ph: Number(r.ph),
            dissolvedOxygenMgL: Number(r.dissolved_oxygen_mg_l),
            transparencyCm: Number(r.transparency_cm),
            salinityPpt: Number(r.salinity_ppt),
            alkalinityPpm: Number(r.alkalinity_ppm),
            ammoniaPpm: Number(r.ammonia_ppm),
            nitritePpm: Number(r.nitrite_ppm),
            hardnessPpm: r.hardness_ppm ? Number(r.hardness_ppm) : undefined,
            notes: r.notes,
            status: r.status,
            alertsTriggered: r.alerts_triggered || undefined,
          };
        });

        if (pondId) {
          this.data.waterReadings = [
            ...this.data.waterReadings.filter((w) => w.pondId !== pondId),
            ...readings,
          ];
        } else {
          this.data.waterReadings = readings;
        }
        this.notify();
        return this.getWaterReadings(pondId);
      }
    }
    return this.getWaterReadings(pondId);
  }

  public getWaterReadings(pondId?: string): WaterQualityReading[] {
    if (pondId) {
      return this.data.waterReadings.filter((r) => r.pondId === pondId);
    }
    return [...this.data.waterReadings];
  }

  public async addWaterReading(
    readingData: Omit<WaterQualityReading, 'id' | 'timestamp' | 'status' | 'recordedBy'>
  ): Promise<WaterQualityReading> {
    let status: WaterQualityReading['status'] = 'Normal';
    const alerts: string[] = [];
    if (readingData.dissolvedOxygenMgL < 3.5 || readingData.ammoniaPpm > 1.0) {
      status = 'Critical';
      if (readingData.dissolvedOxygenMgL < 3.5) alerts.push('Low DO (<3.5 mg/L)');
      if (readingData.ammoniaPpm > 1.0) alerts.push('High Ammonia (>1.0 ppm)');
    } else if (
      readingData.dissolvedOxygenMgL < 4.5 ||
      readingData.ph < 7.5 ||
      readingData.ph > 8.8 ||
      readingData.ammoniaPpm > 0.4
    ) {
      status = 'Alert';
      if (readingData.dissolvedOxygenMgL < 4.5) alerts.push('Suboptimal DO');
      if (readingData.ph > 8.8) alerts.push('High afternoon pH');
      if (readingData.ammoniaPpm > 0.4) alerts.push('Elevated Ammonia');
    }

    const timestamp = new Date().toISOString();
    const recordedBy = this.data.currentUser.name;

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('water_quality_readings')
          .insert({
            pond_id: readingData.pondId,
            timestamp,
            recorded_by: recordedBy,
            temperature_c: readingData.temperatureC,
            ph: readingData.ph,
            dissolved_oxygen_mg_l: readingData.dissolvedOxygenMgL,
            transparency_cm: readingData.transparencyCm,
            salinity_ppt: readingData.salinityPpt,
            alkalinity_ppm: readingData.alkalinityPpm,
            ammonia_ppm: readingData.ammoniaPpm,
            nitrite_ppm: readingData.nitritePpm,
            hardness_ppm: readingData.hardnessPpm || null,
            notes: readingData.notes || null,
            status,
            alerts_triggered: alerts.length > 0 ? alerts : null,
          })
          .select()
          .single();

        if (!error && data) {
          const pond = this.getPondById(readingData.pondId);
          const newReading: WaterQualityReading = {
            id: data.id,
            pondId: data.pond_id,
            pondName: pond ? pond.name : readingData.pondName,
            timestamp: data.timestamp,
            recordedBy: data.recorded_by,
            temperatureC: Number(data.temperature_c),
            ph: Number(data.ph),
            dissolvedOxygenMgL: Number(data.dissolved_oxygen_mg_l),
            transparencyCm: Number(data.transparency_cm),
            salinityPpt: Number(data.salinity_ppt),
            alkalinityPpm: Number(data.alkalinity_ppm),
            ammoniaPpm: Number(data.ammonia_ppm),
            nitritePpm: Number(data.nitrite_ppm),
            hardnessPpm: data.hardness_ppm ? Number(data.hardness_ppm) : undefined,
            notes: data.notes,
            status: data.status,
            alertsTriggered: data.alerts_triggered || undefined,
          };
          this.data.waterReadings.unshift(newReading);
          this.updatePondStatusFromReading(readingData.pondId, status, timestamp);
          this.logAction(
            'Logged Water Reading',
            'WaterQuality',
            newReading.id,
            `DO: ${newReading.dissolvedOxygenMgL}, pH: ${newReading.ph}`
          );
          this.persist();
          return newReading;
        }
      } catch (err) {
        console.warn('Backend water reading insert failed, using memory state', err);
      }
    }

    const newReading: WaterQualityReading = {
      ...readingData,
      id: `wq-${Date.now()}`,
      timestamp,
      recordedBy,
      status,
      alertsTriggered: alerts.length > 0 ? alerts : undefined,
    };

    this.data.waterReadings.unshift(newReading);
    this.updatePondStatusFromReading(readingData.pondId, status, timestamp);
    this.logAction(
      'Logged Water Reading',
      'WaterQuality',
      newReading.id,
      `DO: ${newReading.dissolvedOxygenMgL}, pH: ${newReading.ph}`
    );
    this.persist();
    return newReading;
  }

  private updatePondStatusFromReading(pondId: string, status: WaterQualityReading['status'], timestamp: string) {
    const pondIdx = this.data.ponds.findIndex((p) => p.id === pondId);
    if (pondIdx !== -1) {
      this.data.ponds[pondIdx].lastWaterQualityTest = timestamp;
      if (status === 'Critical') this.data.ponds[pondIdx].status = 'Critical';
      else if (status === 'Alert' && this.data.ponds[pondIdx].status !== 'Critical') {
        this.data.ponds[pondIdx].status = 'Attention';
      }
    }
  }

  // ===========================================================================
  // POND ASSESSMENTS (Diagnostic Engine)
  // ===========================================================================

  public async fetchAssessments(pondId?: string): Promise<AssessmentResult[]> {
    const supabase = getSupabase();
    if (supabase) {
      let query = supabase.from('pond_assessments').select('*').order('timestamp', { ascending: false });
      if (pondId) query = query.eq('pond_id', pondId);

      const { data, error } = await query;
      if (!error && data) {
        const results: AssessmentResult[] = data.map((a: any) => {
          const pond = this.getPondById(a.pond_id);
          return {
            id: a.id,
            pondId: a.pond_id,
            pondName: pond ? pond.name : 'Pond',
            timestamp: a.timestamp,
            ruleVersion: a.rule_version,
            overallScore: a.overall_score,
            status: a.status,
            parameterEvaluations: a.parameter_evaluations,
            limitingFactors: a.limiting_factors || [],
            recommendations: a.recommendations || [],
            suggestedFollowUps: a.suggested_follow_ups || [],
            missingParameters: a.missing_parameters || [],
            disclaimer: a.disclaimer,
          };
        });

        if (pondId) {
          this.data.assessments = [
            ...this.data.assessments.filter((ass) => ass.pondId !== pondId),
            ...results,
          ];
        } else {
          this.data.assessments = results;
        }
        this.notify();
        return this.getAssessments(pondId);
      }
    }
    return this.getAssessments(pondId);
  }

  public getAssessments(pondId?: string): AssessmentResult[] {
    if (pondId) {
      return this.data.assessments.filter((a) => a.pondId === pondId);
    }
    return [...this.data.assessments];
  }

  public async runAssessment(input: AssessmentInput): Promise<AssessmentResult> {
    const pond = this.getPondById(input.pondId);
    const pondName = pond ? pond.name : 'Selected Pond';
    const result = evaluatePondConditions(input, pondName);

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('pond_assessments')
          .insert({
            pond_id: input.pondId,
            timestamp: result.timestamp,
            rule_version: result.ruleVersion,
            overall_score: result.overallScore,
            status: result.status,
            parameter_evaluations: result.parameterEvaluations,
            limiting_factors: result.limitingFactors,
            recommendations: result.recommendations,
            suggested_follow_ups: result.suggestedFollowUps,
            missing_parameters: result.missingParameters,
            disclaimer: result.disclaimer,
          })
          .select()
          .single();

        if (!error && data) {
          result.id = data.id;
        }
      } catch (err) {
        console.warn('Backend assessment store failed, cached in session', err);
      }
    }

    this.data.assessments.unshift(result);

    if (pond) {
      if (result.status === 'Critical') pond.status = 'Critical';
      else if (result.status === 'Moderate') pond.status = 'Attention';
      else pond.status = 'Optimal';
    }

    this.logAction(
      'Completed Pond Assessment',
      'Pond',
      input.pondId,
      `Score: ${result.overallScore}/100, Status: ${result.status}`
    );
    this.persist();
    return result;
  }

  // ===========================================================================
  // FEED MANAGEMENT
  // ===========================================================================

  public async fetchFeedRecords(pondId?: string): Promise<FeedRecord[]> {
    const supabase = getSupabase();
    if (supabase) {
      let query = supabase.from('feed_records').select('*').order('date', { ascending: false });
      if (pondId) query = query.eq('pond_id', pondId);

      const { data, error } = await query;
      if (!error && data) {
        const records: FeedRecord[] = data.map((f: any) => {
          const pond = this.getPondById(f.pond_id);
          return {
            id: f.id,
            pondId: f.pond_id,
            pondName: pond ? pond.name : 'Pond',
            date: f.date,
            feedSlot: f.feed_slot,
            feedBrand: f.feed_brand,
            feedType: f.feed_type,
            quantityKg: Number(f.quantity_kg),
            unitPricePerKg: Number(f.unit_price_per_kg),
            totalCost: Number(f.total_cost),
            checkTrayObservation: f.check_tray_observation,
            notes: f.notes,
          };
        });

        if (pondId) {
          this.data.feedRecords = [
            ...this.data.feedRecords.filter((fr) => fr.pondId !== pondId),
            ...records,
          ];
        } else {
          this.data.feedRecords = records;
        }
        this.notify();
        return this.getFeedRecords(pondId);
      }
    }
    return this.getFeedRecords(pondId);
  }

  public getFeedRecords(pondId?: string): FeedRecord[] {
    if (pondId) {
      return this.data.feedRecords.filter((f) => f.pondId === pondId);
    }
    return [...this.data.feedRecords];
  }

  public async addFeedRecord(feedData: Omit<FeedRecord, 'id' | 'totalCost'>): Promise<FeedRecord> {
    const totalCost = Math.round(feedData.quantityKg * feedData.unitPricePerKg);

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('feed_records')
          .insert({
            pond_id: feedData.pondId,
            date: feedData.date,
            feed_slot: feedData.feedSlot,
            feed_brand: feedData.feedBrand,
            feed_type: feedData.feedType,
            quantity_kg: feedData.quantityKg,
            unit_price_per_kg: feedData.unitPricePerKg,
            total_cost: totalCost,
            check_tray_observation: feedData.checkTrayObservation,
            notes: feedData.notes || null,
          })
          .select()
          .single();

        if (!error && data) {
          const pond = this.getPondById(feedData.pondId);
          const newRecord: FeedRecord = {
            id: data.id,
            pondId: data.pond_id,
            pondName: pond ? pond.name : feedData.pondName,
            date: data.date,
            feedSlot: data.feed_slot,
            feedBrand: data.feed_brand,
            feedType: data.feed_type,
            quantityKg: Number(data.quantity_kg),
            unitPricePerKg: Number(data.unit_price_per_kg),
            totalCost: Number(data.total_cost),
            checkTrayObservation: data.check_tray_observation,
            notes: data.notes,
          };
          this.data.feedRecords.unshift(newRecord);
          this.updatePondFeedingTimestamp(feedData.pondId);
          this.logAction('Recorded Feed', 'Feed', newRecord.id, `${feedData.quantityKg}kg ${feedData.feedBrand}`);
          this.persist();
          return newRecord;
        }
      } catch (err) {
        console.warn('Feed insertion fallback to local', err);
      }
    }

    const newRecord: FeedRecord = {
      ...feedData,
      id: `feed-${Date.now()}`,
      totalCost,
    };
    this.data.feedRecords.unshift(newRecord);
    this.updatePondFeedingTimestamp(feedData.pondId);
    this.logAction('Recorded Feed', 'Feed', newRecord.id, `${feedData.quantityKg}kg ${feedData.feedBrand}`);
    this.persist();
    return newRecord;
  }

  private updatePondFeedingTimestamp(pondId: string) {
    const pondIdx = this.data.ponds.findIndex((p) => p.id === pondId);
    if (pondIdx !== -1) {
      this.data.ponds[pondIdx].lastFeedingRecorded = new Date().toISOString();
    }
  }

  // ===========================================================================
  // EXPENSES
  // ===========================================================================

  public async fetchExpenses(farmId?: string): Promise<ExpenseRecord[]> {
    const supabase = getSupabase();
    if (supabase) {
      let query = supabase.from('expense_records').select('*').order('date', { ascending: false });
      if (farmId) query = query.eq('farm_id', farmId);

      const { data, error } = await query;
      if (!error && data) {
        const records: ExpenseRecord[] = data.map((e: any) => {
          const farm = this.getFarmById(e.farm_id);
          const pond = e.pond_id ? this.getPondById(e.pond_id) : undefined;
          return {
            id: e.id,
            farmId: e.farm_id,
            farmName: farm ? farm.name : 'Farm',
            pondId: e.pond_id || undefined,
            pondName: pond ? pond.name : undefined,
            date: e.date,
            category: e.category,
            amount: Number(e.amount),
            description: e.description,
            vendorName: e.vendor_name,
            paymentMode: e.payment_mode,
            invoiceNumber: e.invoice_number || undefined,
          };
        });

        if (farmId) {
          this.data.expenseRecords = [
            ...this.data.expenseRecords.filter((ex) => ex.farmId !== farmId),
            ...records,
          ];
        } else {
          this.data.expenseRecords = records;
        }
        this.notify();
        return this.getExpenses(farmId);
      }
    }
    return this.getExpenses(farmId);
  }

  public getExpenses(farmId?: string): ExpenseRecord[] {
    if (farmId) {
      return this.data.expenseRecords.filter((e) => e.farmId === farmId);
    }
    return [...this.data.expenseRecords];
  }

  public async addExpense(expenseData: Omit<ExpenseRecord, 'id'>): Promise<ExpenseRecord> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('expense_records')
          .insert({
            farm_id: expenseData.farmId,
            pond_id: expenseData.pondId || null,
            date: expenseData.date,
            category: expenseData.category,
            amount: expenseData.amount,
            description: expenseData.description,
            vendor_name: expenseData.vendorName,
            payment_mode: expenseData.paymentMode,
            invoice_number: expenseData.invoiceNumber || null,
          })
          .select()
          .single();

        if (!error && data) {
          const farm = this.getFarmById(data.farm_id);
          const pond = data.pond_id ? this.getPondById(data.pond_id) : undefined;
          const newExpense: ExpenseRecord = {
            id: data.id,
            farmId: data.farm_id,
            farmName: farm ? farm.name : expenseData.farmName,
            pondId: data.pond_id || undefined,
            pondName: pond ? pond.name : undefined,
            date: data.date,
            category: data.category,
            amount: Number(data.amount),
            description: data.description,
            vendorName: data.vendor_name,
            paymentMode: data.payment_mode,
            invoiceNumber: data.invoice_number || undefined,
          };
          this.data.expenseRecords.unshift(newExpense);
          this.persist();
          return newExpense;
        }
      } catch (err) {
        console.warn('Expense save fallback', err);
      }
    }

    const newExpense: ExpenseRecord = {
      ...expenseData,
      id: `exp-${Date.now()}`,
    };
    this.data.expenseRecords.unshift(newExpense);
    this.persist();
    return newExpense;
  }

  public async deleteExpense(id: string): Promise<boolean> {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('expense_records').delete().eq('id', id);
    }

    const initialLen = this.data.expenseRecords.length;
    this.data.expenseRecords = this.data.expenseRecords.filter((e) => e.id !== id);
    this.persist();
    return this.data.expenseRecords.length < initialLen;
  }

  // ===========================================================================
  // REMINDERS
  // ===========================================================================

  public async fetchReminders(): Promise<Reminder[]> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .order('due_date', { ascending: true });

      if (!error && data) {
        this.data.reminders = data.map((r: any) => {
          const pond = r.pond_id ? this.getPondById(r.pond_id) : undefined;
          return {
            id: r.id,
            farmerId: r.farmer_id,
            title: r.title,
            description: r.description,
            category: r.category,
            dueDate: r.due_date,
            dueTime: r.due_time,
            pondId: r.pond_id || undefined,
            pondName: pond ? pond.name : undefined,
            priority: r.priority,
            status: r.status,
            createdAt: r.created_at,
          };
        });
        this.notify();
        return this.data.reminders;
      }
    }
    return this.getReminders();
  }

  public getReminders(): Reminder[] {
    return [...this.data.reminders];
  }

  public async addReminder(
    reminderData: Omit<Reminder, 'id' | 'farmerId' | 'createdAt' | 'status'>
  ): Promise<Reminder> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('reminders')
          .insert({
            farmer_id: this.data.currentUser.id,
            pond_id: reminderData.pondId || null,
            title: reminderData.title,
            description: reminderData.description,
            category: reminderData.category,
            due_date: reminderData.dueDate,
            due_time: reminderData.dueTime,
            priority: reminderData.priority,
            status: 'Pending',
          })
          .select()
          .single();

        if (!error && data) {
          const pond = data.pond_id ? this.getPondById(data.pond_id) : undefined;
          const newReminder: Reminder = {
            id: data.id,
            farmerId: data.farmer_id,
            title: data.title,
            description: data.description,
            category: data.category,
            dueDate: data.due_date,
            dueTime: data.due_time,
            pondId: data.pond_id || undefined,
            pondName: pond ? pond.name : undefined,
            priority: data.priority,
            status: data.status,
            createdAt: data.created_at,
          };
          this.data.reminders.unshift(newReminder);
          this.persist();
          return newReminder;
        }
      } catch (err) {
        console.warn('Reminder insert fallback', err);
      }
    }

    const newReminder: Reminder = {
      ...reminderData,
      id: `rem-${Date.now()}`,
      farmerId: this.data.currentUser.id,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    this.data.reminders.unshift(newReminder);
    this.persist();
    return newReminder;
  }

  public async toggleReminderStatus(id: string): Promise<Reminder | undefined> {
    const rem = this.data.reminders.find((r) => r.id === id);
    if (rem) {
      const nextStatus = rem.status === 'Pending' ? 'Completed' : 'Pending';
      rem.status = nextStatus;

      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('reminders').update({ status: nextStatus }).eq('id', id);
      }

      this.persist();
    }
    return rem;
  }

  public async deleteReminder(id: string): Promise<boolean> {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('reminders').delete().eq('id', id);
    }

    const initialLen = this.data.reminders.length;
    this.data.reminders = this.data.reminders.filter((r) => r.id !== id);
    this.persist();
    return this.data.reminders.length < initialLen;
  }

  // ===========================================================================
  // LEARNING ARTICLES
  // ===========================================================================

  public async fetchArticles(category?: string): Promise<LearningArticle[]> {
    const supabase = getSupabase();
    if (supabase) {
      let query = supabase.from('learning_articles').select('*').order('published_date', { ascending: false });
      if (category && category !== 'all') query = query.eq('category', category);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        this.data.articles = data.map((a: any) => ({
          id: a.id,
          slug: a.slug,
          category: a.category,
          readingTimeMinutes: a.reading_time_minutes,
          publishedDate: a.published_date,
          author: a.author,
          authorRole: a.author_role,
          verifiedByExpert: a.verified_by_expert,
          expertName: a.expert_name || undefined,
          title: a.title,
          summary: a.summary,
          contentMarkdown: a.content_markdown,
          tags: a.tags || [],
          bannerGradient: a.banner_gradient || 'from-teal-600 to-cyan-700',
        }));
        this.notify();
        return this.getArticles(category);
      }
    }
    return this.getArticles(category);
  }

  public getArticles(category?: string): LearningArticle[] {
    if (category && category !== 'all') {
      return this.data.articles.filter((a) => a.category === category);
    }
    return [...this.data.articles];
  }

  public getArticleBySlug(slug: string): LearningArticle | undefined {
    return this.data.articles.find((a) => a.slug === slug);
  }

  public async addArticle(article: Omit<LearningArticle, 'id' | 'publishedDate'>): Promise<LearningArticle> {
    const publishedDate = new Date().toISOString().split('T')[0];
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('learning_articles')
        .insert({
          slug: article.slug,
          category: article.category,
          reading_time_minutes: article.readingTimeMinutes,
          published_date: publishedDate,
          author: article.author,
          author_role: article.authorRole,
          verified_by_expert: article.verifiedByExpert,
          expert_name: article.expertName || null,
          title: article.title,
          summary: article.summary,
          content_markdown: article.contentMarkdown,
          tags: article.tags,
          banner_gradient: article.bannerGradient,
        })
        .select()
        .single();

      if (!error && data) {
        const newArt: LearningArticle = {
          ...article,
          id: data.id,
          publishedDate: data.published_date,
        };
        this.data.articles.unshift(newArt);
        this.persist();
        return newArt;
      }
    }

    const newArticle: LearningArticle = {
      ...article,
      id: `art-${Date.now()}`,
      publishedDate,
    };
    this.data.articles.unshift(newArticle);
    this.persist();
    return newArticle;
  }

  // ===========================================================================
  // WEATHER & SUPPORT TICKETS & PLATFORM METRICS
  // ===========================================================================

  public async fetchLiveWeather(latitude: number = 16.5449, longitude: number = 81.5212): Promise<WeatherData> {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,precipitation&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`
      );
      if (response.ok) {
        const json = await response.json();
        const current = json.current;
        const daily = json.daily;

        let conditionCode: WeatherData['current']['conditionCode'] = 'sunny';
        let condition = 'Clear Skies';
        if (current.precipitation > 2.0) {
          conditionCode = 'rainy';
          condition = 'Moderate to Heavy Coastal Rain';
        } else if (current.precipitation > 0.1) {
          conditionCode = 'rainy';
          condition = 'Light Coastal Drizzle';
        } else if (current.relative_humidity_2m > 85) {
          conditionCode = 'humid';
          condition = 'High Humidity / Muggy';
        } else if (current.relative_humidity_2m > 65) {
          conditionCode = 'cloudy';
          condition = 'Partly Cloudy';
        }

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const forecast = (daily.time || []).slice(0, 5).map((d: string, idx: number) => {
          const dateObj = new Date(d);
          const dayLabel = idx === 0 ? 'Today' : days[dateObj.getDay()];
          const maxT = daily.temperature_2m_max[idx] || 32;
          const minT = daily.temperature_2m_min[idx] || 24;
          const precip = daily.precipitation_sum[idx] || 0;
          return {
            date: d,
            dayLabel,
            condition: precip > 1.0 ? 'Showers' : 'Partly Sunny',
            minTempC: Math.round(minT),
            maxTempC: Math.round(maxT),
            rainProbabilityPercent: Math.min(100, Math.round(precip * 15)),
            windSpeedKmh: Math.round(current.wind_speed_10m),
          };
        });

        this.data.weather = {
          location: 'Bhimavaram Aqua Zone',
          state: 'Andhra Pradesh',
          district: 'West Godavari',
          asOf: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          current: {
            tempC: Math.round(current.temperature_2m),
            feelsLikeC: Math.round(current.temperature_2m + (current.relative_humidity_2m > 70 ? 2 : 0)),
            condition,
            conditionCode,
            humidityPercent: Math.round(current.relative_humidity_2m),
            windSpeedKmh: Math.round(current.wind_speed_10m),
            windDirection: `${Math.round(current.wind_direction_10m)}°`,
            rainfall24hMm: current.precipitation || 0,
            barometricPressureHpa: Math.round(current.surface_pressure),
            uvIndex: 7,
          },
          forecast,
          advisories: INITIAL_WEATHER.advisories,
        };
        this.notify();
      }
    } catch (err) {
      console.warn('Open-Meteo live weather query failed, retaining cached advisory', err);
    }
    return this.data.weather;
  }

  public getWeather(): WeatherData {
    // Dynamically reflect the user's real location in weather data
    const user = this.data.currentUser;
    const location = user.village
      ? `${user.village} Agro-Climatic Zone`
      : this.data.weather.location;
    return { ...this.data.weather, location, district: user.district || this.data.weather.district, state: user.state || this.data.weather.state };
  }

  public async fetchSupportTickets(): Promise<SupportTicket[]> {
    const supabase = getSupabase();
    if (supabase) {
      const userId = this.data.currentUser.id;
      let query = supabase
        .from('support_tickets')
        .select('*, support_responses(*)')
        .order('created_at', { ascending: false });

      // If logged-in as a real user (not demo), filter by their own tickets
      if (userId && !userId.startsWith('demo-') && !userId.startsWith('farmer-')) {
        query = query.eq('farmer_id', userId);
      }

      const { data, error } = await query;

      if (!error && data) {
        this.data.supportTickets = data.map((t: any) => {
          const farm = t.farm_id ? this.getFarmById(t.farm_id) : undefined;
          return {
            id: t.id,
            farmerId: t.farmer_id,
            farmerName: this.data.currentUser.name,
            farmerPhone: this.data.currentUser.phone,
            farmName: farm ? farm.name : 'Aqua Farm',
            subject: t.subject,
            category: t.category,
            priority: t.priority,
            status: t.status,
            description: t.description,
            createdAt: t.created_at,
            updatedAt: t.updated_at,
            responses: (t.support_responses || []).map((resp: any) => ({
              id: resp.id,
              senderName: resp.sender_name,
              senderRole: resp.sender_role,
              message: resp.message,
              timestamp: resp.created_at,
            })),
          };
        });
        this.notify();
        return this.data.supportTickets;
      }
    }
    return this.getSupportTickets();
  }

  public getSupportTickets(): SupportTicket[] {
    return [...this.data.supportTickets];
  }

  public async createSupportTicket(
    ticketData: Omit<
      SupportTicket,
      'id' | 'farmerId' | 'farmerName' | 'farmerPhone' | 'createdAt' | 'updatedAt' | 'responses' | 'status'
    >
  ): Promise<SupportTicket> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('support_tickets')
          .insert({
            farmer_id: this.data.currentUser.id,
            subject: ticketData.subject,
            category: ticketData.category,
            priority: ticketData.priority,
            status: 'Open',
            description: ticketData.description,
          })
          .select()
          .single();

        if (!error && data) {
          // Add initial response entry
          await supabase.from('support_responses').insert({
            ticket_id: data.id,
            sender_id: this.data.currentUser.id,
            sender_name: this.data.currentUser.name,
            sender_role: 'Farmer',
            message: ticketData.description,
          });

          const newTicket: SupportTicket = {
            ...ticketData,
            id: data.id,
            farmerId: this.data.currentUser.id,
            farmerName: this.data.currentUser.name,
            farmerPhone: this.data.currentUser.phone,
            status: 'Open',
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            responses: [
              {
                id: `resp-${Date.now()}`,
                senderName: this.data.currentUser.name,
                senderRole: 'Farmer',
                message: ticketData.description,
                timestamp: data.created_at,
              },
            ],
          };
          this.data.supportTickets.unshift(newTicket);
          this.persist();
          return newTicket;
        }
      } catch (err) {
        console.warn('Backend ticket insertion failed', err);
      }
    }

    const newTicket: SupportTicket = {
      ...ticketData,
      id: `tkt-${Date.now()}`,
      farmerId: this.data.currentUser.id,
      farmerName: this.data.currentUser.name,
      farmerPhone: this.data.currentUser.phone,
      status: 'Open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responses: [
        {
          id: `resp-${Date.now()}`,
          senderName: this.data.currentUser.name,
          senderRole: 'Farmer',
          message: ticketData.description,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    this.data.supportTickets.unshift(newTicket);
    this.persist();
    return newTicket;
  }

  public async addTicketResponse(
    ticketId: string,
    message: string,
    senderRole: 'Farmer' | 'Extension Officer' | 'AquaSustain Support'
  ) {
    const senderName =
      senderRole === 'Farmer' ? this.data.currentUser.name : 'Dr. K. Srinivas Rao (Extension Officer)';

    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('support_responses').insert({
        ticket_id: ticketId,
        sender_id: senderRole === 'Farmer' ? this.data.currentUser.id : null,
        sender_name: senderName,
        sender_role: senderRole,
        message,
      });

      if (senderRole !== 'Farmer') {
        await supabase.from('support_tickets').update({ status: 'In Progress' }).eq('id', ticketId);
      }
    }

    const ticket = this.data.supportTickets.find((t) => t.id === ticketId);
    if (ticket) {
      ticket.responses.push({
        id: `resp-${Date.now()}`,
        senderName,
        senderRole,
        message,
        timestamp: new Date().toISOString(),
      });
      ticket.updatedAt = new Date().toISOString();
      if (senderRole !== 'Farmer') {
        ticket.status = 'In Progress';
      }
      this.persist();
    }
  }

  // Admin & Audit
  public getAuditLogs(): AuditLogItem[] {
    return [...this.data.auditLogs];
  }

  public getPlatformMetrics(): PlatformMetrics {
    return {
      ...this.data.metrics,
      totalRegisteredFarms: this.data.farms.length + 640,
      totalActivePonds: this.data.ponds.length + 1836,
      openSupportTickets: this.data.supportTickets.filter((t) => t.status !== 'Closed').length,
    };
  }

  private async logAction(
    action: string,
    entityType: AuditLogItem['entityType'],
    entityId: string,
    details: string
  ) {
    const logItem: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: this.data.currentUser.name,
      actorRole: this.data.currentUser.role,
      action,
      entityType,
      entityId,
      details,
      ipAddress: '157.48.92.14 (Active Client)',
    };
    this.data.auditLogs.unshift(logItem);

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('audit_logs').insert({
          actor_id: this.data.currentUser.id,
          actor_name: this.data.currentUser.name,
          actor_role: this.data.currentUser.role,
          action,
          entity_type: entityType,
          entity_id: entityId,
          details,
          ip_address: logItem.ipAddress,
        });
      } catch (err) {
        // Silent catch for audit logging
      }
    }
  }
}

export const dataService = new DataService();
