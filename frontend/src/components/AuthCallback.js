import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../App";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false); // Prevents double-fire in StrictMode

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash;
    const match = hash.match(/session_id=([^&]+)/);

    if (!match) {
      navigate("/login", { replace: true });
      return;
    }

    const session_id = match[1];

    (async () => {
      try {
        const res = await axios.post(
          `${API}/auth/session`,
          { session_id },
          { withCredentials: true }
        );
        setUser(res.data.user);
        // Clear the fragment from URL then navigate
        window.history.replaceState(null, "", window.location.pathname);
        navigate("/dashboard", { replace: true, state: { user: res.data.user } });
      } catch (err) {
        console.error("Auth callback error:", err);
        navigate("/login", { replace: true });
      }
    })();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-forge-cyan border-t-transparent rounded-full animate-spin" />
        <p className="text-[#A1A1AA] font-secondary text-sm">Completing sign-in...</p>
      </div>
    </div>
  );
}
