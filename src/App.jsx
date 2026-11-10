import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation, Outlet } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ProfileProvider, useProfile } from '@/lib/profileContext';
// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
// App pages
import Onboarding from '@/pages/Onboarding';
import Home from '@/pages/Home';
import Tasks from '@/pages/Tasks';
import Focus from '@/pages/Focus';
import Exams from '@/pages/Exams';
import More from '@/pages/More';
import Habits from '@/pages/Habits';
import Stats from '@/pages/Stats';
import Notes from '@/pages/Notes';
import Profile from '@/pages/Profile';
import AppLayout from '@/components/AppLayout';

function FullScreenSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
    </div>
  );
}

function OnboardingGate() {
  const { profile, loading } = useProfile();
  const location = useLocation();
  if (loading || !profile) return <FullScreenSpinner />;
  if (!profile.onboarding_complete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  return <Outlet />;
}

function ProtectedLayout() {
  return (
    <ProfileProvider>
      <OnboardingGate />
    </ProfileProvider>
  );
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, authError, navigateToLogin, checkUserAuth } = useAuth();

  if (isLoadingAuth) {
    return <FullScreenSpinner />;
  }

  if (authError) {
    if (authError.type === 'configuration_error') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <p className="max-w-md text-center text-sm text-muted-foreground">{authError.message}</p>
        </div>
      );
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    } else if (authError.type === 'service_error') {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background p-6">
          <p className="max-w-md text-center text-sm text-muted-foreground">{authError.message}</p>
          <button className="text-sm font-medium text-primary hover:underline" onClick={() => void checkUserAuth()}>
            Try again
          </button>
        </div>
      );
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<ProtectedLayout />}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/focus" element={<Focus />} />
            <Route path="/exams" element={<Exams />} />
            <Route path="/more" element={<More />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
