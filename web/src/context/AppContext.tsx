import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  UserRole,
  LanguageCode,
  Farm,
  Pond,
  WaterQualityReading,
  AssessmentResult,
  FeedRecord,
  ExpenseRecord,
  Reminder,
  LearningArticle,
  WeatherData,
  SupportTicket,
  PlatformMetrics,
  AuditLogItem,
} from '@aquasustain/shared';
import { dataService } from '@aquasustain/shared';
import { getTranslation } from '@aquasustain/shared';

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

interface AppContextType {
  currentUser: UserProfile;
  isAuthenticated: boolean;
  role: UserRole;
  language: LanguageCode;
  t: (key: string) => string;
  setLanguage: (lang: LanguageCode) => void;
  switchRole: (role: UserRole) => void;
  resetDemoData: () => void;
  login: (email: string, password: string) => Promise<{ error?: any; user?: any }>;
  register: (email: string, password: string, metadata: { name: string; phone?: string; role?: UserRole }) => Promise<{ error?: any; user?: any }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: any }>;
  farms: Farm[];
  ponds: Pond[];
  selectedFarmId: string;
  selectedPondId: string;
  setSelectedFarmId: (id: string) => void;
  setSelectedPondId: (id: string) => void;
  activePond: Pond | undefined;
  activeFarm: Farm | undefined;
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
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedArticle: LearningArticle | null;
  setSelectedArticle: (art: LearningArticle | null) => void;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(dataService.getCurrentUser());
  const [language, setLanguageState] = useState<LanguageCode>(currentUser.preferredLanguage);
  const [farms, setFarms] = useState<Farm[]>(dataService.getFarms());
  const [ponds, setPonds] = useState<Pond[]>(dataService.getPonds());
  const [selectedFarmId, setSelectedFarmId] = useState<string>(farms[0]?.id || '');
  const [selectedPondId, setSelectedPondId] = useState<string>(ponds[0]?.id || '');
  const [waterReadings, setWaterReadings] = useState<WaterQualityReading[]>(dataService.getWaterReadings());
  const [assessments, setAssessments] = useState<AssessmentResult[]>(dataService.getAssessments());
  const [feedRecords, setFeedRecords] = useState<FeedRecord[]>(dataService.getFeedRecords());
  const [expenseRecords, setExpenseRecords] = useState<ExpenseRecord[]>(dataService.getExpenses());
  const [reminders, setReminders] = useState<Reminder[]>(dataService.getReminders());
  const [articles, setArticles] = useState<LearningArticle[]>(dataService.getArticles());
  const [weather, setWeather] = useState<WeatherData>(dataService.getWeather());
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(dataService.getSupportTickets());
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(dataService.getAuditLogs());
  const [metrics, setMetrics] = useState<PlatformMetrics>(dataService.getPlatformMetrics());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedArticle, setSelectedArticle] = useState<LearningArticle | null>(null);

  // Sync with service data changes
  const refreshFromService = () => {
    const user = dataService.getCurrentUser();
    const allFarms = dataService.getFarms();
    const allPonds = dataService.getPonds();

    setCurrentUser(user);
    setLanguageState(user.preferredLanguage);
    setFarms(allFarms);
    setPonds(allPonds);
    setWaterReadings(dataService.getWaterReadings());
    setAssessments(dataService.getAssessments());
    setFeedRecords(dataService.getFeedRecords());
    setExpenseRecords(dataService.getExpenses());
    setReminders(dataService.getReminders());
    setArticles(dataService.getArticles());
    setWeather(dataService.getWeather());
    setSupportTickets(dataService.getSupportTickets());
    setAuditLogs(dataService.getAuditLogs());
    setMetrics(dataService.getPlatformMetrics());

    // Keep active selection valid
    if (allFarms.length > 0 && !allFarms.some((f) => f.id === selectedFarmId)) {
      setSelectedFarmId(allFarms[0].id);
    }
    if (allPonds.length > 0 && !allPonds.some((p) => p.id === selectedPondId)) {
      setSelectedPondId(allPonds[0].id);
    }
  };

  const refreshData = async () => {
    try {
      const userProfile = await dataService.fetchCurrentUserProfile();
      if (userProfile) {
        setCurrentUser({ ...userProfile });
        setLanguageState(userProfile.preferredLanguage);
      }
      await Promise.all([
        dataService.fetchFarms(),
        dataService.fetchPonds(),
        dataService.fetchWaterReadings(),
        dataService.fetchAssessments(),
        dataService.fetchFeedRecords(),
        dataService.fetchExpenses(),
        dataService.fetchReminders(),
        dataService.fetchArticles(),
        dataService.fetchSupportTickets(),
      ]);
    } catch (e) {
      console.warn('Backend sync warning, fallback active', e);
    }
    refreshFromService();
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = dataService.subscribe(refreshFromService);
    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const data = await dataService.signIn(email, pass);
      await refreshData();
      return { user: data.user };
    } catch (err: any) {
      return { error: err };
    }
  };

  const register = async (email: string, pass: string, meta: { name: string; phone?: string; role?: UserRole }) => {
    try {
      const data = await dataService.signUp(email, pass, meta);
      return { user: data.user };
    } catch (err: any) {
      return { error: err };
    }
  };

  const logout = async () => {
    try {
      await dataService.signOut();
      refreshFromService();
      showToast('Logged out successfully', 'info');
    } catch (err: any) {
      showToast(err.message || 'Logout failed', 'error');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await dataService.resetPassword(email);
      return {};
    } catch (err: any) {
      return { error: err };
    }
  };

  const setLanguage = (lang: LanguageCode) => {
    dataService.setLanguage(lang);
    setLanguageState(lang);
    showToast(`Language updated to ${lang === 'en' ? 'English' : lang === 'te' ? 'తెలుగు' : 'हिंदी'}`, 'info');
  };

  const switchRole = (newRole: UserRole) => {
    dataService.switchRole(newRole);
    if (newRole === 'farmer') setActiveTab('dashboard');
    else if (newRole === 'admin') setActiveTab('admin-overview');
    else if (newRole === 'evaluator') setActiveTab('eval-overview');
    showToast(`Switched role to ${newRole.toUpperCase()}`, 'info');
  };

  const resetDemoData = () => {
    dataService.resetToDemoData();
    showToast('Demo data restored to initial baseline', 'success');
  };

  const showToast = (message: string, type: ToastMessage['type'] = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const t = (key: string): string => {
    return getTranslation(language, key);
  };

  const activePond = ponds.find((p) => p.id === selectedPondId) || ponds[0];
  const activeFarm = farms.find((f) => f.id === selectedFarmId) || farms[0];
  const isAuthenticated = dataService.isAuthenticated();

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        role: currentUser.role,
        language,
        t,
        setLanguage,
        switchRole,
        resetDemoData,
        login,
        register,
        logout,
        resetPassword,
        farms,
        ponds,
        selectedFarmId,
        selectedPondId,
        setSelectedFarmId,
        setSelectedPondId,
        activePond,
        activeFarm,
        waterReadings,
        assessments,
        feedRecords,
        expenseRecords,
        reminders,
        articles,
        weather,
        supportTickets,
        auditLogs,
        metrics,
        toasts,
        showToast,
        removeToast,
        activeTab,
        setActiveTab,
        selectedArticle,
        setSelectedArticle,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
