import React from 'react';
import { useApp } from '../../context/AppContext';
import { ScoreGauge } from '../common/ScoreGauge';
import {
  Activity,
  Droplets,
  Scale,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Clock,
  CheckCircle2,
  Calendar,
  CloudSun,
  ShieldCheck,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const FarmerDashboard: React.FC = () => {
  const {
    currentUser,
    farms,
    ponds,
    selectedPondId,
    activePond,
    activeFarm,
    waterReadings,
    assessments,
    feedRecords,
    expenseRecords,
    reminders,
    weather,
    language,
    setActiveTab,
    t,
  } = useApp();

  // Metrics calculation
  const totalPonds = ponds.length;
  const optimalPonds = ponds.filter((p) => p.status === 'Optimal').length;

  const currentPondReadings = waterReadings
    .filter((r) => r.pondId === selectedPondId)
    .slice(0, 7)
    .reverse();

  const latestReading = waterReadings[0];
  const latestAssessment = assessments[0];

  const todayStr = new Date().toISOString().split('T')[0];
  const todayFeedKg = feedRecords
    .filter((f) => f.date === todayStr || f.date.startsWith(todayStr))
    .reduce((sum, item) => sum + item.quantityKg, 0);

  const monthExpenses = expenseRecords.reduce((sum, item) => sum + item.amount, 0);

  const pendingReminders = reminders.filter((r) => r.status === 'Pending').slice(0, 3);

  // Chart data formatted for diurnal readings
  const chartData = (currentPondReadings.length > 0 ? currentPondReadings : waterReadings.slice(0, 5).reverse()).map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    do: r.dissolvedOxygenMgL,
    ph: r.ph,
    temp: r.temperatureC,
  }));

  return (
    <div className="space-y-6">
      {/* Zero Ponds Prompt Banner */}
      {ponds.length === 0 && (
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div>
            <h4 className="text-sm font-extrabold text-teal-900 font-heading">
              🐟 No aqua ponds registered yet
            </h4>
            <p className="text-xs text-teal-700 mt-1">
              Add your aquaculture pond to enable health assessments, water quality stability tracking, and feeding records.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('farms')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-sm transition whitespace-nowrap self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Register Pond</span>
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-ocean-800 via-ocean-700 to-ocean-600 rounded-2xl p-6 text-white shadow-card relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-ocean-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-ocean-100 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-mint" />
              <span>{activeFarm?.name || (farms.length > 0 ? farms[0].name : 'Aqua Farm')}</span>
              <span>•</span>
              <span>{currentUser.village || 'Bhimavaram'}, {currentUser.district || 'West Godavari'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
              {t('welcomeGreeting')}, {currentUser.name}
            </h1>
            <p className="text-sm text-ocean-100 mt-1 max-w-xl">
              {t('dashboardBannerSubtitle')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('assessment')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-ocean-800 font-bold text-xs hover:bg-slate-50 transition shadow-sm"
            >
              <Activity className="w-4 h-4 text-ocean-600" />
              <span>{t('actionAssessPond')}</span>
            </button>
            <button
              onClick={() => setActiveTab('water-quality')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ocean-900/60 hover:bg-ocean-900/80 text-white font-bold text-xs border border-white/20 transition"
            >
              <Droplets className="w-4 h-4 text-mint" />
              <span>{t('actionAddReading')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Registered Ponds */}
        <div className="aqua-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t('totalPondsLabel')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-ocean-600 flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-ocean-800 font-heading">
              {totalPonds} <span className="text-sm font-semibold text-slate-400">{t('pondsUnit')}</span>
            </div>
            <div className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{optimalPonds} {t('inOptimalRange')}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Dissolved Oxygen */}
        <div className="aqua-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t('avgDoLabel')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-ocean-800 font-heading">
              {latestReading ? latestReading.dissolvedOxygenMgL : '--'}{' '}
              <span className="text-sm font-semibold text-slate-400">{latestReading ? 'mg/L' : ''}</span>
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              {latestReading ? `${activePond?.name || 'Active Pond'} • ${t('testedAt')} ${new Date(latestReading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : t('noReadingsNotice')}
            </div>
          </div>
        </div>

        {/* Card 3: Today's Feed */}
        <div className="aqua-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t('feedTodayLabel')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-ocean-800 font-heading">
              {todayFeedKg} <span className="text-sm font-semibold text-slate-400">kg</span>
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              {todayFeedKg > 0 ? t('checkTraysConsumed') : 'No feed logged today'}
            </div>
          </div>
        </div>

        {/* Card 4: Monthly Expenses */}
        <div className="aqua-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t('monthExpensesLabel')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-ocean-800 font-heading">
              ₹{monthExpenses.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              {monthExpenses > 0 ? t('feedPowerRatio') : 'Total logged expenses'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Assessment & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Water Quality Chart & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Water Quality Stability Index Chart */}
          <div className="aqua-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-ocean-900 font-heading">
                  {t('waterTrendsTitle')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('waterTrendsSubtitle')} • {activePond?.name}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('water-quality')}
                className="text-xs font-semibold text-ocean-600 hover:text-ocean-800 flex items-center gap-1"
              >
                <span>{t('actionViewAll')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} domain={[2, 10]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    name="Dissolved Oxygen (mg/L)"
                    dataKey="do"
                    stroke="#168C83"
                    strokeWidth={2.5}
                    dot={{ fill: '#168C83', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    name="pH Value"
                    dataKey="ph"
                    stroke="#D99A38"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ fill: '#D99A38', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-ocean-600 rounded"></span>
                <span className="text-slate-600 font-medium">{t('doSafeRange')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-amber-500 border-dashed border-t rounded"></span>
                <span className="text-slate-600 font-medium">{t('phSafeRange')}</span>
              </div>
            </div>
          </div>

          {/* Quick Management Actions Grid */}
          <div className="aqua-card p-5">
            <h3 className="text-base font-bold text-ocean-900 font-heading mb-3">
              {t('quickActionsTitle')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => setActiveTab('assessment')}
                className="p-3 rounded-xl border border-slate-200 hover:border-ocean-600 hover:bg-ocean-50/50 transition text-left flex flex-col justify-between group"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-ocean-900 block leading-tight">
                    {t('actionAssessPond')}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {t('quickActionDiagnostic')}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('water-quality')}
                className="p-3 rounded-xl border border-slate-200 hover:border-ocean-600 hover:bg-ocean-50/50 transition text-left flex flex-col justify-between group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-ocean-900 block leading-tight">
                    {t('actionAddReading')}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {t('quickActionWaterParams')}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('feed')}
                className="p-3 rounded-xl border border-slate-200 hover:border-ocean-600 hover:bg-ocean-50/50 transition text-left flex flex-col justify-between group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-ocean-900 block leading-tight">
                    {t('actionRecordFeed')}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {t('quickActionFeedSlot')}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('expenses')}
                className="p-3 rounded-xl border border-slate-200 hover:border-ocean-600 hover:bg-ocean-50/50 transition text-left flex flex-col justify-between group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-ocean-900 block leading-tight">
                    {t('actionAddExpense')}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {t('quickActionCostTracking')}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Assessment Card, Reminders & Weather Alert */}
        <div className="space-y-6">
          {/* Latest Assessment Card with ScoreGauge */}
          <div className="aqua-card p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-ocean-900 font-heading">
                {t('latestAssessmentTitle')}
              </h3>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                {latestAssessment?.pondName.split(' ')[0] || 'Pond A-1'}
              </span>
            </div>

            {latestAssessment ? (
              <>
                <ScoreGauge
                  score={latestAssessment.overallScore}
                  status={latestAssessment.status}
                  size={140}
                  label={t('scoreSubtitle')}
                />

                <div className="mt-3 pt-3 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    {t('factorsLimitingScore')}
                  </span>
                  <div className="space-y-1">
                    {latestAssessment.limitingFactors.slice(0, 2).map((factor, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-700">
                        <span className="text-ocean-600 font-bold">•</span>
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setActiveTab('assessment')}
                    className="mt-3 w-full py-2 rounded-xl bg-ocean-50 hover:bg-ocean-100 text-ocean-800 font-bold text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <span>{t('actionViewRecs')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-slate-400 space-y-3">
                <Activity className="w-10 h-10 opacity-30 mx-auto text-ocean-700" />
                <p className="text-xs font-semibold px-4">{t('noAssessmentsNotice')}</p>
                <button
                  onClick={() => setActiveTab('assessment')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-ocean-700 hover:bg-ocean-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>{t('actionAssessPond')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Upcoming Reminders */}
          <div className="aqua-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-ocean-900 font-heading">
                {t('upcomingRemindersTitle')}
              </h3>
              <button
                onClick={() => setActiveTab('reminders')}
                className="text-xs font-semibold text-ocean-600 hover:text-ocean-800"
              >
                {t('actionViewAll')}
              </button>
            </div>

            <div className="space-y-2.5">
              {pendingReminders.map((rem) => (
                <div
                  key={rem.id}
                  className="p-2.5 rounded-xl border border-slate-200/80 hover:border-slate-300 transition flex items-start gap-2.5 bg-slate-50/50"
                >
                  <Calendar className="w-4 h-4 text-ocean-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-ocean-900 block truncate">
                      {rem.title}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {t('duePrefix')} {rem.dueDate} {t('atPrefix')} {rem.dueTime} • {rem.category}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      rem.priority === 'High'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {rem.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Coastal Weather Advisory Alert */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-1">
              <CloudSun className="w-4 h-4 text-amber-700" />
              <span>{t('weatherAlertTitle')}</span>
            </div>
            <p className="text-xs text-amber-950 font-medium leading-relaxed">
              {weather.advisories[0]?.message[language] || weather.advisories[0]?.message.en || 'Inspect aerators ahead of expected rainfall on Nov 22-23.'}
            </p>
            <div className="mt-2 text-[10px] text-amber-800 font-semibold flex items-center justify-between">
              <span>{weather.location}</span>
              <button
                onClick={() => setActiveTab('weather')}
                className="underline hover:text-amber-900"
              >
                {t('viewDetails')} &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
