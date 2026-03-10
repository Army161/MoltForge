import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, ArrowRight, ArrowLeft, Check, Server, Bot } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STEPS = ["Workspace Info", "Agent Config", "Launch"];

export default function WorkspaceSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: "", description: "", agent_name: "MoltAgent" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  const launch = async () => {
    setCreating(true);
    setError("");
    try {
      const res = await axios.post(`${API}/workspaces`, {
        name: form.name,
        description: form.description,
        agent_name: form.agent_name || "MoltAgent",
      }, { withCredentials: true });
      navigate(`/workspace/${res.data.workspace_id}/install`);
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to create workspace");
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
          <Zap size={14} className="text-forge-cyan" />
          <span className="font-secondary text-sm font-bold text-white">MoltForge</span>
        </button>

        {/* Step Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 ${i <= step ? "text-white" : "text-[#52525B]"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-secondary border ${
                  i < step ? "bg-forge-cyan border-forge-cyan text-black" :
                  i === step ? "border-forge-cyan text-forge-cyan" :
                  "border-white/10 text-[#52525B]"
                }`}>
                  {i < step ? <Check size={10} /> : i + 1}
                </div>
                <span className="text-xs hidden sm:block">{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px ${i < step ? "bg-forge-cyan/50" : "bg-white/10"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="forge-card rounded-md p-6 shadow-card">
          {step === 0 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div>
                <h2 className="font-secondary text-lg font-bold text-white mb-1">Workspace Details</h2>
                <p className="text-sm text-[#A1A1AA]">Name your workspace. This is your isolated agent environment.</p>
              </div>
              <div>
                <label className="text-xs font-secondary text-[#A1A1AA] mb-1.5 block">Workspace Name *</label>
                <input
                  data-testid="ws-name-input"
                  type="text"
                  placeholder="e.g. Production Agent, Dev Bot"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className="w-full bg-black/50 border border-white/10 focus:border-forge-cyan/50 focus:ring-1 focus:ring-forge-cyan/30 rounded-sm px-3 py-2.5 text-sm text-white placeholder:text-[#52525B] outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-secondary text-[#A1A1AA] mb-1.5 block">Description</label>
                <textarea
                  data-testid="ws-description-input"
                  placeholder="Brief description of what this agent does..."
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={3}
                  className="w-full bg-black/50 border border-white/10 focus:border-forge-cyan/50 focus:ring-1 focus:ring-forge-cyan/30 rounded-sm px-3 py-2.5 text-sm text-white placeholder:text-[#52525B] outline-none transition-all resize-none"
                />
              </div>
              <button
                data-testid="ws-step1-next"
                onClick={next}
                disabled={!form.name.trim()}
                className="w-full flex items-center justify-center gap-2 bg-forge-cyan text-black font-semibold py-2.5 rounded-sm text-sm hover:bg-forge-cyan-hover transition-all shadow-glow-cyan active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue <ArrowRight size={14} />
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div>
                <h2 className="font-secondary text-lg font-bold text-white mb-1">Agent Configuration</h2>
                <p className="text-sm text-[#A1A1AA]">Configure your AI agent identity and behavior.</p>
              </div>
              <div>
                <label className="text-xs font-secondary text-[#A1A1AA] mb-1.5 block">Agent Name</label>
                <input
                  data-testid="ws-agent-name-input"
                  type="text"
                  placeholder="MoltAgent"
                  value={form.agent_name}
                  onChange={(e) => update("agent_name", e.target.value)}
                  className="w-full bg-black/50 border border-white/10 focus:border-forge-cyan/50 focus:ring-1 focus:ring-forge-cyan/30 rounded-sm px-3 py-2.5 text-sm text-white placeholder:text-[#52525B] outline-none transition-all"
                />
              </div>
              <div className="forge-card rounded-sm p-3 border-forge-cyan/15">
                <div className="flex items-start gap-3">
                  <Bot size={15} className="text-forge-cyan shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-secondary text-forge-cyan mb-1">Platform-Managed Credentials</p>
                    <p className="text-xs text-[#52525B]">MoltForge will provision a secure LLM credential lease for your agent. You can switch to BYOK in Settings after deployment.</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button data-testid="ws-step2-back" onClick={back} className="flex items-center gap-2 border border-white/10 bg-white/5 text-white px-4 py-2.5 rounded-sm text-sm hover:bg-white/10 transition-all">
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  data-testid="ws-step2-next"
                  onClick={next}
                  className="flex-1 flex items-center justify-center gap-2 bg-forge-cyan text-black font-semibold py-2.5 rounded-sm text-sm hover:bg-forge-cyan-hover transition-all shadow-glow-cyan active:scale-95"
                >
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div>
                <h2 className="font-secondary text-lg font-bold text-white mb-1">Confirm & Launch</h2>
                <p className="text-sm text-[#A1A1AA]">Review your configuration and launch the install job.</p>
              </div>

              {/* Summary */}
              <div className="space-y-2">
                {[
                  { label: "Workspace Name", value: form.name },
                  { label: "Agent Name", value: form.agent_name || "MoltAgent" },
                  { label: "Description", value: form.description || "—" },
                  { label: "LLM Provider", value: "Platform-Managed (OpenAI gpt-5.2)" },
                  { label: "Credentials", value: "Auto-provisioned (256-bit lease)" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start justify-between gap-4 py-2 border-b border-white/5">
                    <span className="text-xs text-[#52525B]">{item.label}</span>
                    <span className="text-xs text-white text-right font-mono truncate max-w-[180px]">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-3 p-3 bg-forge-cyan/5 border border-forge-cyan/15 rounded-sm">
                <Server size={14} className="text-forge-cyan shrink-0 mt-0.5" />
                <p className="text-xs text-[#A1A1AA]">
                  Clicking "Launch" will create an isolated runtime, provision LLM credentials, install agent dependencies, and run health checks automatically.
                </p>
              </div>

              {error && (
                <div data-testid="ws-error" className="text-xs text-forge-error bg-forge-error/10 border border-forge-error/20 rounded-sm px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button data-testid="ws-step3-back" onClick={back} className="flex items-center gap-2 border border-white/10 bg-white/5 text-white px-4 py-2.5 rounded-sm text-sm hover:bg-white/10 transition-all">
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  data-testid="launch-workspace-btn"
                  onClick={launch}
                  disabled={creating}
                  className="flex-1 flex items-center justify-center gap-2 bg-forge-cyan text-black font-semibold py-2.5 rounded-sm text-sm hover:bg-forge-cyan-hover transition-all shadow-glow-cyan active:scale-95 disabled:opacity-50"
                >
                  {creating ? (
                    <><div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" /> Launching...</>
                  ) : (
                    <><Zap size={14} /> Launch Agent</>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
