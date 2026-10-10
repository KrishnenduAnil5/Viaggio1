import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/authContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { VisaRemindersPage } from './pages/VisaRemindersPage';
import { PassportRemindersPage } from './pages/PassportRemindersPage';
import { VisaJourneyPage } from './pages/VisaJourneyPage';
import { MyDocumentsPage } from './pages/MyDocumentsPage';
import { AdminPage } from './pages/AdminPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { SupabaseStatusModal } from './components/common/SupabaseStatusBadge';
import { TelegramAssistantModal } from './components/common/TelegramAssistantModal';

const AppContent: React.FC = () => {
  const { user, isAdmin, loading } = useAuth();
  
  // Simple client routing synchronized with window.location.pathname
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname === '/' ? '/dashboard' : window.location.pathname;
  });

  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/dashboard');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F1E9] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#111111]/20 border-t-[#111111] rounded-full animate-spin mx-auto" />
          <p className="font-display text-sm font-semibold text-[#111111]">Loading Viaggio...</p>
        </div>
      </div>
    );
  }

  // If not logged in, render the single shared LoginPage
  if (!user) {
    return (
      <>
        <LoginPage onNavigate={navigate} />
        <SupabaseStatusModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
        />
      </>
    );
  }

  // If user is logged in but navigates to /login
  if (currentPath === '/login') {
    if (isAdmin) {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  }

  // Render appropriate view based on route
  const renderPage = () => {
    switch (currentPath) {
      case '/admin':
        if (!isAdmin) {
          return <ForbiddenPage onNavigate={navigate} />;
        }
        return <AdminPage onNavigate={navigate} />;

      case '/visa-reminders':
        return <VisaRemindersPage />;

      case '/passport-reminders':
        return <PassportRemindersPage />;

      case '/visa-journey':
        return <VisaJourneyPage />;

      case '/my-documents':
        return <MyDocumentsPage />;

      case '/dashboard':
      default:
        return (
          <DashboardPage 
            onNavigate={navigate} 
            onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F1E9] text-[#111111]">
      <Navbar 
        currentPath={currentPath} 
        onNavigate={navigate}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
      />

      <main className="flex-1 pb-16">
        {renderPage()}
      </main>

      <Footer />

      <SupabaseStatusModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      <TelegramAssistantModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
