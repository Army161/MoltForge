import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { useAuth } from "../App";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const [mode, setMode] = useState("signin"); // "signin" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const from = location.state?.from?.pathname || "/dashboard";

  const handleGoogleAuth = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = mode === "register" ? "/auth/register" : "/auth/login";
      const body = mode === "register" ? { email, password, name } : { email, password };
      const res = await axios.post(`${API}${endpoint}`, body, { withCredentials: true });
      setUser(res.data.user);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-sm bg-forge-cyan/10 border border-forge-cyan/30 flex items-center justify-center mb-3">
            <Zap size={18} className="text-forge-cyan" />
          </div>
          <h1 className="font-secondary text-xl font-bold text-white">MoltForge</h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            {mode === "signin" ? "Sign in to your account" : "Create a new account"}
          </p>
        </div>

        {/* Card */}
        <div className="forge-card rounded-md p-6 shadow-card">
          {/* Mode Tabs */}
          <div className="flex gap-1 mb-6 bg-white/5 rounded-sm p-0.5">
            <button
              data-testid="auth-signin-tab"
              onClick={() => { setMode("signin"); setError(""); }}
              className={`flex-1 py-1.5 text-xs font-secondary font-medium rounded-sm transition-all ${
                mode === "signin" ? "bg-forge-cyan text-black" : "text-[#A1A1AA] hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              data-testid="auth-register-tab"
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 py-1.5 text-xs font-secondary font-medium rounded-sm transition-all ${
                mode === "register" ? "bg-forge-cyan text-black" : "text-[#A1A1AA] hover:text-white"
              }`}
            >
              Register
            </button>
          </div>

          {/* Google OAuth */}
          <button
            data-testid="auth-google-btn"
            onClick={handleGoogleAuth}
            className="w-full flex items-center justify-center gap-3 border border-white/10 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-sm text-sm font-medium transition-all mb-4"
          >
            <svg width="16" height="16" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs text-[#52525B] font-secondary">or</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {mode === "register" && (
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B]" />
                <input
                  data-testid="auth-name-input"
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-black/50 border border-white/10 focus:border-forge-cyan/50 focus:ring-1 focus:ring-forge-cyan/30 rounded-sm pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-[#52525B] outline-none transition-all font-primary"
                />
              </div>
            )}
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B]" />
              <input
                data-testid="auth-email-input"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-black/50 border border-white/10 focus:border-forge-cyan/50 focus:ring-1 focus:ring-forge-cyan/30 rounded-sm pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-[#52525B] outline-none transition-all font-primary"
              />
            </div>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B]" />
              <input
                data-testid="auth-password-input"
                type={showPass ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-black/50 border border-white/10 focus:border-forge-cyan/50 focus:ring-1 focus:ring-forge-cyan/30 rounded-sm pl-9 pr-9 py-2.5 text-sm text-white placeholder:text-[#52525B] outline-none transition-all font-primary"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52525B] hover:text-white transition-colors"
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {error && (
              <div data-testid="auth-error" className="text-xs text-forge-error bg-forge-error/10 border border-forge-error/20 rounded-sm px-3 py-2">
                {error}
              </div>
            )}

            <button
              data-testid="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-forge-cyan text-black font-semibold py-2.5 rounded-sm hover:bg-forge-cyan-hover transition-all shadow-glow-cyan active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {mode === "signin" ? "Sign In" : "Create Account"}
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#52525B] mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
