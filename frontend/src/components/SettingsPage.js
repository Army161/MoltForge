import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Settings, Save, Check, Loader, Key, Cpu, AlertTriangle, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PROVIDERS = {
  openai: { label: "OpenAI", models: ["gpt-5.2", "gpt-5.1", "gpt-4o", "gpt-4.1", "gpt-4.1-mini"] },
  anthropic: { label: "Anthropic", models: ["claude-sonnet-4-5-20250929", "claude-haiku-4-5-20251001", "claude-4-sonnet-20250514"] },
  gemini: { label: "Google Gemini", models: ["gemini-3-flash-preview", "gemini-2.5-pro", "gemini-2.5-flash"] },
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWs, setSelectedWs] = useState(null);
  const [settings, setSettings] = useState({ provider: "openai", model: "gpt-5.2", use_platform_key: true, api_key: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const wsRes = await axios.get(`${API}/workspaces`, { withCredentials: true });
        setWorkspaces(wsRes.data);
        if (wsRes.data.length > 0) {
          setSelectedWs(wsRes.data[0].workspace_id);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedWs) return;
    const loadSettings = async () => {
      try {
        const res = await axios.get(`${API}/workspaces/${selectedWs}/settings`, { withCredentials: true });
        setSettings({ ...res.data, api_key: "" }); // Never prefill key
      } catch (e) { console.error(e); }
    };
    loadSettings();
  }, [selectedWs]);

  const handleSave = async () => {
    if (!selectedWs) return;
    setSaving(true);
    setError("");
    try {
      await axios.put(`${API}/workspaces/${selectedWs}/settings`, {
        provider: settings.provider,
        model: settings.model,
        use_platform_key: settings.use_platform_key,
        api_key: settings.api_key || null,
      }, { withCredentials: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to save settings");
    } finally { setSaving(false); }
  };

  const models = PROVIDERS[settings.provider]?.models || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-secondary text-xl font-bold text-white flex items-center gap-2">
          <Settings size={18} className="text-forge-cyan" /> Settings
        </h1>
        <p className="text-sm text-[#52525B] mt-1">Configure LLM provider and workspace settings</p>
      </div>

      {/* Workspace Selector */}
      {workspaces.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="forge-card rounded-md p-4">
          <Label className="text-xs font-secondary text-[#A1A1AA] mb-2 block">Configure Workspace</Label>
          <Select value={selectedWs || ""} onValueChange={setSelectedWs}>
            <SelectTrigger data-testid="workspace-select" className="bg-black/50 border-white/10 text-white">
              <SelectValue placeholder="Select workspace" />
            </SelectTrigger>
            <SelectContent className="bg-[#0A0A0A] border-white/10">
              {workspaces.map((ws) => (
                <SelectItem key={ws.workspace_id} value={ws.workspace_id} className="text-white hover:bg-white/10">
                  {ws.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>
      )}

      {workspaces.length === 0 && !loading && (
        <div className="forge-card rounded-md p-8 text-center">
          <p className="text-sm text-[#52525B]">No workspaces found. <button onClick={() => navigate("/workspace/new")} className="text-forge-cyan hover:underline">Create one first.</button></p>
        </div>
      )}

      {selectedWs && (
        <>
          {/* LLM Provider */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="forge-card rounded-md p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Cpu size={14} className="text-forge-cyan" />
              <h2 className="font-secondary font-semibold text-white text-sm">LLM Provider</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-secondary text-[#A1A1AA] mb-1.5 block">Provider</Label>
                <Select
                  value={settings.provider}
                  onValueChange={(v) => setSettings((s) => ({ ...s, provider: v, model: PROVIDERS[v].models[0] }))}
                >
                  <SelectTrigger data-testid="provider-select" className="bg-black/50 border-white/10 text-white h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-white/10">
                    {Object.entries(PROVIDERS).map(([key, p]) => (
                      <SelectItem key={key} value={key} className="text-white hover:bg-white/10">{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-secondary text-[#A1A1AA] mb-1.5 block">Model</Label>
                <Select
                  value={settings.model}
                  onValueChange={(v) => setSettings((s) => ({ ...s, model: v }))}
                >
                  <SelectTrigger data-testid="model-select" className="bg-black/50 border-white/10 text-white h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-white/10">
                    {models.map((m) => (
                      <SelectItem key={m} value={m} className="text-white hover:bg-white/10 font-mono text-xs">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          {/* Credential Mode */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="forge-card rounded-md p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Key size={14} className="text-forge-amber" />
              <h2 className="font-secondary font-semibold text-white text-sm">API Credentials</h2>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Platform-Managed Key</p>
                <p className="text-xs text-[#52525B]">Use MoltForge's provisioned LLM credential lease</p>
              </div>
              <Switch
                data-testid="platform-key-toggle"
                checked={settings.use_platform_key}
                onCheckedChange={(v) => setSettings((s) => ({ ...s, use_platform_key: v }))}
                className="data-[state=checked]:bg-forge-cyan"
              />
            </div>

            {!settings.use_platform_key && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2">
                <div className="flex items-start gap-2 p-3 bg-forge-amber/5 border border-forge-amber/15 rounded-sm">
                  <AlertTriangle size={12} className="text-forge-amber shrink-0 mt-0.5" />
                  <p className="text-xs text-[#A1A1AA]">BYOK mode: Your API key is encrypted at rest and never logged or exposed in the UI.</p>
                </div>
                <Label className="text-xs font-secondary text-[#A1A1AA] mb-1 block">Your API Key</Label>
                <div className="relative">
                  <input
                    data-testid="byok-key-input"
                    type={showKey ? "text" : "password"}
                    placeholder={settings.has_byok ? "Key configured (leave blank to keep)" : `${PROVIDERS[settings.provider]?.label} API key`}
                    value={settings.api_key}
                    onChange={(e) => setSettings((s) => ({ ...s, api_key: e.target.value }))}
                    className="w-full bg-black/50 border border-white/10 focus:border-forge-amber/50 rounded-sm px-3 pr-9 py-2.5 text-sm text-white placeholder:text-[#52525B] outline-none transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52525B] hover:text-white transition-colors"
                  >
                    {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>

          {error && (
            <p className="text-xs text-forge-error">{error}</p>
          )}

          <button
            data-testid="save-settings-btn"
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-forge-cyan text-black font-semibold py-2.5 rounded-sm text-sm hover:bg-forge-cyan-hover transition-all shadow-glow-cyan active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
            {saved ? "Saved!" : "Save Settings"}
          </button>
        </>
      )}
    </div>
  );
}
