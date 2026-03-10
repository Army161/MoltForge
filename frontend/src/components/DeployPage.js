import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Rocket, Clock, Activity, RefreshCw, ToggleLeft, ToggleRight, CheckCircle } from "lucide-react";
import axios from "axios";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DeployPage() {
  const { workspaceId } = useParams();
  const [deploy, setDeploy] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [schedule, setSchedule] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [wsRes, deployRes] = await Promise.all([
          axios.get(`${API}/workspaces/${workspaceId}`, { withCredentials: true }),
          axios.get(`${API}/workspaces/${workspaceId}/deploy`, { withCredentials: true }),
        ]);
        setWorkspace(wsRes.data);
        setDeploy(deployRes.data);
        setSchedule(deployRes.data.schedule || "");
      } catch (e) { console.error(e); }
    };
    load();
  }, [workspaceId]);

  const handleToggle = async (enabled) => {
    setSaving(true);
    try {
      const res = await axios.put(`${API}/workspaces/${workspaceId}/deploy`, {
        enabled, schedule: schedule || null
      }, { withCredentials: true });
      setDeploy(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleSaveSchedule = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`${API}/workspaces/${workspaceId}/deploy`, {
        enabled: deploy?.enabled || false,
        schedule: schedule || null
      }, { withCredentials: true });
      setDeploy(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const isActive = workspace?.status === "active";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-secondary text-xl font-bold text-white flex items-center gap-2">
          <Rocket size={18} className="text-forge-cyan" /> Deploy & Persistence
        </h1>
        <p className="text-sm text-[#52525B] mt-1">Control 24/7 agent uptime and restart policies</p>
      </div>

      {/* Deploy Toggle Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className={`forge-card rounded-md p-6 ${deploy?.enabled ? "border-forge-success/20 shadow-[0_0_20px_-8px_rgba(16,185,129,0.2)]" : ""}`}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="font-secondary font-semibold text-white flex items-center gap-2">
              {deploy?.enabled ? <ToggleRight size={16} className="text-forge-success" /> : <ToggleLeft size={16} className="text-[#52525B]" />}
              24/7 Persistent Deployment
            </h2>
            <p className="text-sm text-[#A1A1AA]">
              {deploy?.enabled
                ? "Agent is running continuously with auto-restart on failure."
                : "Agent will shut down when idle. Enable to keep it running 24/7."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saving && <div className="w-3.5 h-3.5 border-2 border-forge-cyan border-t-transparent rounded-full animate-spin" />}
            {saved && <CheckCircle size={14} className="text-forge-success" />}
            <Switch
              data-testid="deploy-toggle"
              checked={deploy?.enabled || false}
              onCheckedChange={handleToggle}
              disabled={saving || !isActive}
              className="data-[state=checked]:bg-forge-success"
            />
          </div>
        </div>

        {!isActive && (
          <p className="mt-3 text-xs text-forge-amber bg-forge-amber/5 border border-forge-amber/15 rounded-sm px-3 py-2">
            Workspace must be active to enable persistent deployment.
          </p>
        )}

        {/* Status */}
        <div className="mt-4 pt-4 border-t border-white/8 grid grid-cols-3 gap-4">
          {[
            { label: "Status", value: deploy?.enabled ? "Running" : "Stopped", color: deploy?.enabled ? "text-forge-success" : "text-[#52525B]" },
            { label: "Runtime", value: isActive ? "Active" : "Inactive", color: isActive ? "text-forge-cyan" : "text-[#52525B]" },
            { label: "Restart Policy", value: deploy?.enabled ? "Always" : "Never", color: "text-[#A1A1AA]" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-xs text-[#52525B] mb-1">{s.label}</p>
              <p className={`text-sm font-secondary font-medium ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Schedule Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="forge-card rounded-md p-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <Clock size={15} className="text-forge-amber" />
          <h2 className="font-secondary font-semibold text-white">Task Scheduler (Cron)</h2>
        </div>
        <p className="text-sm text-[#52525B] mb-4">Schedule recurring automations using cron syntax.</p>

        <div className="space-y-2">
          <Label className="text-xs font-secondary text-[#A1A1AA]">Cron Expression</Label>
          <div className="flex gap-2">
            <input
              data-testid="cron-input"
              type="text"
              placeholder="0 9 * * 1-5 (weekdays at 9 AM)"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="flex-1 bg-black/50 border border-white/10 focus:border-forge-cyan/50 rounded-sm px-3 py-2 text-sm text-white placeholder:text-[#52525B] outline-none transition-all font-mono"
            />
            <button
              data-testid="save-schedule-btn"
              onClick={handleSaveSchedule}
              disabled={saving}
              className="flex items-center gap-2 bg-forge-cyan text-black font-semibold px-4 py-2 rounded-sm text-sm hover:bg-forge-cyan-hover transition-all shadow-glow-cyan disabled:opacity-50"
            >
              {saving ? <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : "Save"}
            </button>
          </div>
          {schedule && (
            <p className="text-xs text-[#52525B]">
              Schedule: <span className="text-forge-cyan font-mono">{schedule}</span>
            </p>
          )}
        </div>

        {/* Quick presets */}
        <div className="mt-4">
          <p className="text-xs text-[#52525B] mb-2">Quick Presets</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Every hour", value: "0 * * * *" },
              { label: "Daily 9AM", value: "0 9 * * *" },
              { label: "Weekdays", value: "0 9 * * 1-5" },
              { label: "Every 30 min", value: "*/30 * * * *" },
            ].map((p) => (
              <button
                key={p.label}
                data-testid={`preset-${p.label.toLowerCase().replace(/ /g, "-")}`}
                onClick={() => setSchedule(p.value)}
                className="text-xs border border-white/10 bg-white/5 hover:bg-white/10 text-[#A1A1AA] hover:text-white px-2.5 py-1 rounded-sm transition-all font-mono"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Uptime Monitor */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="forge-card rounded-md p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Activity size={15} className="text-forge-cyan" />
          <h2 className="font-secondary font-semibold text-white">Runtime Health</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Uptime", value: isActive ? "Running" : "—" },
            { label: "Started", value: workspace?.healthy_at ? new Date(workspace.healthy_at).toLocaleDateString() : "—" },
            { label: "Restarts", value: "0" },
            { label: "Health", value: isActive ? "Pass" : "—" },
          ].map((s) => (
            <div key={s.label} className="bg-white/3 border border-white/8 rounded-sm p-3">
              <p className="text-xs text-[#52525B] mb-1">{s.label}</p>
              <p className="text-sm font-secondary font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
