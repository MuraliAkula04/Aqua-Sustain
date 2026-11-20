import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AppProvider } from './context/AppContext';
import { initSupabase } from '@aquasustain/shared';
import './index.css';

// Initialize Supabase backend connection with environment variables or safe defaults
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rikyawlqxfrhkyrjvaus.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_IvA7QccxNmezbMhe79x4kQ_TDnm9ava';

initSupabase({
  supabaseUrl,
  supabaseAnonKey,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
