import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { AuthView } from './components/common/AuthView';

// Farmer Views
import { FarmerDashboard } from './components/farmer/FarmerDashboard';
import { FarmerPondAssessment } from './components/farmer/FarmerPondAssessment';
import { FarmerFarmsPonds } from './components/farmer/FarmerFarmsPonds';
import { FarmerWaterQuality } from './components/farmer/FarmerWaterQuality';
import { FarmerFeed } from './components/farmer/FarmerFeed';
import { FarmerExpenses } from './components/farmer/FarmerExpenses';
import { FarmerLearning } from './components/farmer/FarmerLearning';
import { FarmerWeather } from './components/farmer/FarmerWeather';
import { FarmerReminders } from './components/farmer/FarmerReminders';
import { FarmerSupport } from './components/farmer/FarmerSupport';
import { FarmerProfile } from './components/farmer/FarmerProfile';

// Admin View
import { AdminDashboard } from './components/admin/AdminDashboard';

export const App: React.FC = () => {
  const { role, activeTab, isAuthenticated } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // If user is not authenticated, show modern Auth Gateway screen
  if (!isAuthenticated) {
    return (
      <>
        <AuthView />
        <ToastContainer />
      </>
    );
  }

  // Render role & tab specific view
  const renderActiveView = () => {
    if (role === 'admin') {
      return <AdminDashboard />;
    }

    // Farmer role views
    switch (activeTab) {
      case 'farms':
        return <FarmerFarmsPonds />;
      case 'assessment':
        return <FarmerPondAssessment />;
      case 'water-quality':
        return <FarmerWaterQuality />;
      case 'feed':
        return <FarmerFeed />;
      case 'expenses':
        return <FarmerExpenses />;
      case 'learning':
        return <FarmerLearning />;
      case 'weather':
        return <FarmerWeather />;
      case 'reminders':
        return <FarmerReminders />;
      case 'support':
        return <FarmerSupport />;
      case 'profile':
        return <FarmerProfile />;
      case 'dashboard':
      default:
        return <FarmerDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col">
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex-1 w-full flex">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">
            {renderActiveView()}
          </div>
        </main>
      </div>

      <ToastContainer />
    </div>
  );
};
