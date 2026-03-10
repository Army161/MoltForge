import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Server, Activity, CheckCircle, AlertTriangle, Clock, ArrowRight, RefreshCw } from "lucide-react";
import axios from "axios";
import { useAuth } from "../App";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_COLORS = {
  active:  { dot: "bg-forge-success", badge: "bg-forge-success/10 text-forge-success border-forge-success/20" },
  pending: { dot: "bg-forge-amber pulse-glow", badge: "bg-forge-amber/10 text-forge-amber border-forge-amber/20" },
  failed:  { dot: "bg-forge-error", badge: "bg-forge-error/10 text-forge-error border-forge-error/20" },
};

export default function Dashboard() {
  const { user, API: authAPI } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const load = async () => {
    try {
      const [wsRes] = await Promise.all([
        axios.get(`${API}/workspaces`, { withCredentials: true }),
      ]);
      setWorkspaces(wsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const activeCount = workspaces.filter((w) => w.status === "active").length;
  const pendingCount = workspaces.filter((w) => ["pending", "provisioning", "bootstrapping"].includes(w.status)).length;
  const failedCount = workspaces.filter((w) => w.status === "failed").length;

  const handleOpen = (ws) => {
    if (ws.status === "active") navigate(`/workspace/${ws.workspace_id}/panel`);
    else navigate(`/workspace/${ws.workspace_id}/install`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="font-secondary text-2xl font-bold text-white"
          >
            Workspace Dashboard
          </motion.h1>
          <p className="text-sm text-[#A1A1AA] mt-1">Welcome back, {user?.name?.split(" ")[0]}</p>
        </div>
        <motion.button
          data-testid="create-workspace-btn"
          initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/workspace/new")}
          className="flex items-center gap-2 bg-forge-cyan text-black font-semibold px-4 py-2 rounded-sm text-sm hover:bg-forge-cyan-hover transition-all shadow-glow-cyan active:scale-95"
        >
          <Plus size={15} /> New Workspace
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Workspaces", value: workspaces.length, icon: Server, color: "text-forge-cyan" },
          { label: "Active", value: activeCount, icon: CheckCircle, color: "text-forge-success" },
          { label: "Provisioning", value: pendingCount, icon: Clock, color: "text-forge-amber" },
          { label: "Failed", value: failedCount, icon: AlertTriangle, color: "text-forge-error" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="forge-card rounded-md p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#52525B] font-secondary">{s.label}</span>
              <s.icon size={14} className={s.color} />
            </div>
            <span className="text-2xl font-secondary font-bold text-white">{s.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Workspace List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-secondary text-sm font-semibold text-[#A1A1AA] uppercase tracking-widest">Your Workspaces</h2>
          <button
            data-testid="refresh-workspaces-btn"
            onClick={load}
            className="text-[#52525B] hover:text-white transition-colors"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="forge-card rounded-md h-20 animate-pulse" />
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="forge-card rounded-md p-12 text-center"
          >
            <Server size={32} className="text-[#3F3F46] mx-auto mb-4" />
            <h3 className="font-secondary font-semibold text-white mb-2">No workspaces yet</h3>
            <p className="text-sm text-[#52525B] mb-6">Create your first workspace to deploy an AI agent.</p>
            <button
              data-testid="first-workspace-btn"
              onClick={() => navigate("/workspace/new")}
              className="flex items-center gap-2 bg-forge-cyan text-black font-semibold px-5 py-2.5 rounded-sm text-sm hover:bg-forge-cyan-hover transition-all shadow-glow-cyan mx-auto active:scale-95"
            >
              <Plus size={14} /> Create Workspace
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {workspaces.map((ws, i) => {
              const statusStyle = STATUS_COLORS[ws.status] || STATUS_COLORS.pending;
              return (
                <motion.div
                  key={ws.workspace_id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="forge-card rounded-md p-4 flex items-center gap-4 group hover:border-white/15 transition-all cursor-pointer"
                  onClick={() => handleOpen(ws)}
                  data-testid={`workspace-card-${ws.workspace_id}`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusStyle.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-secondary font-semibold text-white text-sm">{ws.name}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusStyle.badge}`}>
                        {ws.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#52525B] mt-0.5 truncate">{ws.description || ws.agent_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#52525B] hidden md:block">
                      {ws.created_at ? new Date(ws.created_at).toLocaleDateString() : "—"}
                    </span>
                    <Activity size={14} className="text-[#3F3F46] group-hover:text-forge-cyan transition-colors" />
                    <ArrowRight size={14} className="text-[#3F3F46] group-hover:text-white transition-colors" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
