# AquaSustain – Complete Integrated Aquaculture Management Platform

AquaSustain is an integrated Smart Aquaculture & Pond Management platform built for shrimp and freshwater fish farmers, extension officers, administrators, and evaluators. It features a normalized Supabase PostgreSQL backend, shared TypeScript domain logic, a high-performance React + Vite web dashboard, and an Expo React Native Android application.

---

## 🌟 Architecture Overview

```
                      ┌──────────────────────────────────────┐
                      │          Supabase Backend            │
                      │  - PostgreSQL with RLS               │
                      │  - GoTrue Auth (JWT Sessions)        │
                      │  - Realtime Subscriptions            │
                      └──────────────────┬───────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │                                               │
                 ▼                                               ▼
     ┌───────────────────────┐                       ┌───────────────────────┐
     │  React + Vite Web App │                       │  Expo Android App     │
     │  - Farmer Portal      │                       │  - Field Telemetry    │
     │  - Admin Dashboard    │                       │  - Offline Cache      │
     │  - Evaluator Portal   │                       │  - Async-Storage Auth │
     └───────────┬───────────┘                       └───────────┬───────────┘
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         │
                                         ▼
                             ┌───────────────────────┐
                             │  @aquasustain/shared  │
                             │  - Diagnostics Engine │
                             │  - Unified DataService│
                             │  - Translations (3)   │
                             │  - Database Types     │
                             └───────────────────────┘
```

---

## 🚀 Key Functional Modules

1. **Authentication & Role-Based Access Control**:
   - Supabase email/password authentication with automated profile creation (`public.handle_new_user`).
   - Role separation: `farmer`, `admin`, `evaluator` with row-level security (RLS) policies.
   - Cross-platform session persistence (localStorage on web, `@react-native-async-storage/async-storage` on Android).

2. **Farm & Pond Telemetry Management**:
   - Register and manage aquaculture estates with Coastal Aquaculture Authority (CAA) registration tracking.
   - Comprehensive pond parameters: species (*L. vannamei*, *P. monodon*, Carps, Tilapia, Seabass), stocking density, biomass estimations, DOC, and aeration capacities.

3. **Water Quality Telemetry**:
   - Log dissolved oxygen (DO), pH, temperature, transparency, salinity, alkalinity, ammonia, and nitrite.
   - Realtime multi-tier threshold alerts: `Normal`, `Alert`, and `Critical` hypoxia/toxin classifications.

4. **Biophysical Pond Assessment Engine**:
   - Shared deterministic diagnostic engine (`shared/src/business-logic/pondAssessmentEngine.ts`).
   - Multi-parameter health scoring (0-100), limiting factor detection, prioritized actionable remediation, and chemical dosing guidance.

5. **Feeding & Farm Financial Ledger**:
   - Feed slot tracking (Morning, Noon, Afternoon, Night) with check-tray consumption scoring and FCR optimization.
   - Comprehensive farm expenditure records across feed, energy, probiotics, seed, and labor.

6. **Farmer Support & Extension Services**:
   - Bi-directional support tickets connecting rural farmers directly with Fisheries Extension Officers.

7. **Knowledge Hub & Weather Intelligence**:
   - Multi-lingual articles (English, Telugu, Hindi) verified by aquaculture scientists.
   - Real-time weather intelligence and advisories powered by Open-Meteo.

---

## 🛠️ Project Structure

```
aquasustain-csp-main/
├── supabase/
│   ├── migrations/
│   │   ├── 20261120000001_initial_schema.sql         # 13 Normalized Tables & Indexes
│   │   ├── 20261120000002_rls_policies.sql           # Complete Role & Ownership RLS
│   │   └── 20261120000003_auth_profiles_trigger.sql  # Auth user profile provisioning
│   └── seed.sql                                      # Staging/development seed records
├── shared/
│   ├── src/
│   │   ├── business-logic/                           # Deterministic Pond Assessment Engine
│   │   ├── services/
│   │   │   ├── supabaseClient.ts                     # Cross-platform Supabase Client
│   │   │   └── dataService.ts                        # Unified asynchronous persistence
│   │   ├── translations/                             # English, Telugu, Hindi locales
│   │   ├── types/                                    # TypeScript schemas & Database types
│   │   └── mock/                                     # Offline baseline fallback data
│   └── package.json
├── web/
│   ├── src/                                          # React 18 + Vite Web Application
│   ├── .env.example                                  # Web environment template
│   └── package.json
└── mobile/
    ├── src/                                          # React Native + Expo Android App
    ├── .env.example                                  # Mobile environment template
    ├── app.json                                      # Expo application configuration
    └── package.json
```

---

## ⚙️ Setup & Local Development

### 1. Backend Configuration
1. Create a Supabase project at [supabase.com](https://supabase.com).
2. In the Supabase SQL Editor, run:
   - `supabase/migrations/20261120000001_initial_schema.sql`
   - `supabase/migrations/20261120000002_rls_policies.sql`
   - `supabase/migrations/20261120000003_auth_profiles_trigger.sql`
3. Copy your project URL and `anon` key into:
   - `web/.env.local`
   - `mobile/.env`

### 2. Running Web Dashboard
```bash
cd web
npm install
npm run dev
```

### 3. Running Mobile Application
```bash
cd mobile
npm install
npx expo start --android
```

---

## 🧪 Verification & Build Commands

- **Shared Package Typecheck**: `cd shared && npx tsc --noEmit`
- **Android Mobile Typecheck**: `cd mobile && npx tsc --noEmit`
- **Web Production Bundle**: `cd web && npm run build`
