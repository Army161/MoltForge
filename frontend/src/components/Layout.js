import React, { useState } from "react";
import { useNavigate, useLocation, NavLink, useParams } from "react-router-dom";
import {
  LayoutDashboard, Terminal, Radio, Rocket, CreditCard,
  Settings, Shield, LogOut, Zap, ChevronDown, ChevronRight, X, Menu
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../App";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: CreditCard, label: "Billing", path: "/billing" },
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: Shield, label: "Admin", path: "/admin" },
];

const WS_NAV = (id) => [
  { icon: Terminal, label: "Control Panel", path: `/workspace/${id}/panel` },
  { icon: Radio, label: "Channels", path: `/workspace/${id}/channels` },
  { icon: Rocket, label: "Deploy", path: `/workspace/${id}/deploy` },
];

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      data-testid={`nav-${label.toLowerCase().replace(/ /g, "-")}`}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-all ${
          isActive
            ? "bg-forge-cyan/8 border-l-2 border-forge-cyan text-forge-cyan"
            : "text-[#A1A1AA] hover:text-white hover:bg-white/5 border-l-2 border-transparent"
        }`
      }
    >
      <Icon size={15} />
      <span className="font-primary">{label}</span>
    </NavLink>
  );
}

export default function Layout({ children }) {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { workspaceId } = useParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [wsExpanded, setWsExpanded] = useState(true);

  // Detect active workspace from URL
  const wsMatch = location.pathname.match(/\/workspace\/([^/]+)/);
  const activeWsId = workspaceId || wsMatch?.[1];

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch {}
    setUser(null);
    navigate("/");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-sm bg-forge-cyan/10 border border-forge-cyan/30 flex items-center justify-center">
            <Zap size={13} className="text-forge-cyan" />
          </div>
          <span className="font-secondary font-bold text-sm text-white">MoltForge</span>
        </div>
        <button onClick={() => setMobileOpen(false)} className="md:hidden text-[#52525B]">
          <X size={16} />
        </button>
      </div>

      {/* Main Nav */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV.slice(0, 1).map((n) => (
          <NavItem key={n.path} to={n.path} icon={n.icon} label={n.label} />
        ))}

        {/* Workspace section */}
        {activeWsId && (
          <div className="mt-4">
            <button
              onClick={() => setWsExpanded(!wsExpanded)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-secondary text-[#52525B] uppercase tracking-widest hover:text-white transition-colors"
            >
              <span>Workspace</span>
              {wsExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
            {wsExpanded && (
              <div className="mt-1 space-y-0.5">
                {WS_NAV(activeWsId).map((n) => (
                  <NavItem key={n.path} to={n.path} icon={n.icon} label={n.label} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-white/5 space-y-0.5">
          {NAV.slice(1).map((n) => (
            <NavItem key={n.path} to={n.path} icon={n.icon} label={n.label} />
          ))}
        </div>
      </div>

      {/* User Footer */}
      <div className="border-t border-white/5 p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-sm hover:bg-white/5 transition-colors">
          <div className="w-7 h-7 rounded-full bg-forge-cyan/20 border border-forge-cyan/30 flex items-center justify-center shrink-0 overflow-hidden">
            {user?.picture ? (
              <img src={user.picture} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-secondary text-forge-cyan">{user?.name?.[0]?.toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-[#52525B] truncate">{user?.email}</p>
          </div>
          <button
            data-testid="logout-btn"
            onClick={handleLogout}
            title="Sign out"
            className="text-[#52525B] hover:text-forge-error transition-colors shrink-0"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 border-r border-white/5 bg-[#0A0A0A] flex-col fixed left-0 top-0 bottom-0 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-56 bg-[#0A0A0A] border-r border-white/5 h-full z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#0A0A0A]">
          <button onClick={() => setMobileOpen(true)} data-testid="mobile-menu-btn" className="text-[#A1A1AA]">
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <Zap size={13} className="text-forge-cyan" />
            <span className="font-secondary font-bold text-sm text-white">MoltForge</span>
          </div>
        </div>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
