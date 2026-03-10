import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import LandingPage from "./components/LandingPage";
import AuthPage from "./components/AuthPage";
import AuthCallback from "./components/AuthCallback";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import WorkspaceSetup from "./components/WorkspaceSetup";
import InstallProgress from "./components/InstallProgress";
import ControlPanel from "./components/ControlPanel";
import Channels from "./components/Channels";
import DeployPage from "./components/DeployPage";
import BillingPage from "./components/BillingPage";
import SettingsPage from "./components/SettingsPage";
import AdminPage from "./components/AdminPage";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ── Auth Context ──────────────────────────────────────────────────────────────
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    // AuthCallback will exchange the session_id and establish the session first.
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    if (window.location.hash?.includes("session_id=")) {
      setLoading(false);
      return;
    }
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, checkAuth, API }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// ── Protected Route ───────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-forge-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-forge-cyan border-t-transparent rounded-full animate-spin" />
          <p className="text-forge-text-secondary font-secondary text-sm">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// ── App Router ────────────────────────────────────────────────────────────────
function AppRouter() {
  const location = useLocation();

  // CRITICAL: Detect session_id in URL fragment SYNCHRONOUSLY during render (not useEffect)
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/workspace/new"
        element={
          <ProtectedRoute>
            <WorkspaceSetup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workspace/:workspaceId/install"
        element={
          <ProtectedRoute>
            <InstallProgress />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workspace/:workspaceId/panel"
        element={
          <ProtectedRoute>
            <Layout><ControlPanel /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/workspace/:workspaceId/channels"
        element={
          <ProtectedRoute>
            <Layout><Channels /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/workspace/:workspaceId/deploy"
        element={
          <ProtectedRoute>
            <Layout><DeployPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <ProtectedRoute>
            <Layout><BillingPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout><SettingsPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Layout><AdminPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
