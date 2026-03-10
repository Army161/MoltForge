import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Radio, Plus, Trash2, CheckCircle, AlertTriangle, Send, MessageCircle } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CHANNEL_TYPES = [
  { id: "telegram", label: "Telegram", icon: Send, color: "text-[#26A5E4]", bg: "bg-[#26A5E4]/10 border-[#26A5E4]/20", fields: ["token"] },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "text-[#25D366]", bg: "bg-[#25D366]/10 border-[#25D366]/20", fields: ["phone_number", "webhook_url"] },
];

export default function Channels() {
  const { workspaceId } = useParams();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(null); // "telegram" | "whatsapp" | null
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadChannels = async () => {
    try {
      const res = await axios.get(`${API}/workspaces/${workspaceId}/channels`, { withCredentials: true });
      setChannels(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadChannels(); }, [workspaceId]);

  const handleAdd = async (type) => {
    setSaving(true);
    setError("");
    try {
      const body = { channel_type: type, ...form };
      await axios.post(`${API}/workspaces/${workspaceId}/channels`, body, { withCredentials: true });
      setAdding(null);
      setForm({});
      await loadChannels();
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to connect channel");
    } finally { setSaving(false); }
  };

  const handleRemove = async (channelId) => {
    try {
      await axios.delete(`${API}/workspaces/${workspaceId}/channels/${channelId}`, { withCredentials: true });
      setChannels((c) => c.filter((ch) => ch.channel_id !== channelId));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-secondary text-xl font-bold text-white flex items-center gap-2">
          <Radio size={18} className="text-forge-cyan" /> Channel Integrations
        </h1>
        <p className="text-sm text-[#52525B] mt-1">Connect messaging platforms to your agent</p>
      </div>

      {/* Available Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CHANNEL_TYPES.map((ct) => {
          const connected = channels.find((c) => c.channel_type === ct.id);
          return (
            <motion.div
              key={ct.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`forge-card rounded-md p-5 ${connected ? "border-forge-success/20" : ""}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-sm flex items-center justify-center border ${ct.bg}`}>
                    <ct.icon size={16} className={ct.color} />
                  </div>
                  <div>
                    <p className="font-secondary font-semibold text-white text-sm">{ct.label}</p>
                    <p className="text-xs text-[#52525B]">
                      {connected ? <span className="text-forge-success flex items-center gap-1"><CheckCircle size={11} /> Connected</span> : "Not connected"}
                    </p>
                  </div>
                </div>
                {connected ? (
                  <button
                    data-testid={`disconnect-${ct.id}-btn`}
                    onClick={() => handleRemove(connected.channel_id)}
                    className="text-[#52525B] hover:text-forge-error transition-colors p-1.5"
                    title="Disconnect"
                  >
                    <Trash2 size={14} />
                  </button>
                ) : (
                  <button
                    data-testid={`connect-${ct.id}-btn`}
                    onClick={() => { setAdding(ct.id); setForm({}); setError(""); }}
                    className="text-xs flex items-center gap-1.5 border border-forge-cyan/25 bg-forge-cyan/5 hover:bg-forge-cyan/10 text-forge-cyan px-3 py-1.5 rounded-sm transition-all"
                  >
                    <Plus size={11} /> Connect
                  </button>
                )}
              </div>

              {/* Connect form */}
              {adding === ct.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 pt-3 border-t border-white/8 space-y-3"
                >
                  {ct.id === "telegram" && (
                    <div>
                      <label className="text-xs font-secondary text-[#A1A1AA] mb-1.5 block">Bot Token</label>
                      <input
                        data-testid="telegram-token-input"
                        type="password"
                        placeholder="123456:ABC-DEF..."
                        value={form.token || ""}
                        onChange={(e) => setForm((f) => ({ ...f, token: e.target.value }))}
                        className="w-full bg-black/50 border border-white/10 focus:border-forge-cyan/50 rounded-sm px-3 py-2 text-xs text-white placeholder:text-[#52525B] outline-none transition-all font-mono"
                      />
                    </div>
                  )}
                  {ct.id === "whatsapp" && (
                    <>
                      <div>
                        <label className="text-xs font-secondary text-[#A1A1AA] mb-1.5 block">Phone Number</label>
                        <input
                          data-testid="whatsapp-phone-input"
                          type="text"
                          placeholder="+1234567890"
                          value={form.phone_number || ""}
                          onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
                          className="w-full bg-black/50 border border-white/10 focus:border-forge-cyan/50 rounded-sm px-3 py-2 text-xs text-white placeholder:text-[#52525B] outline-none transition-all font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-secondary text-[#A1A1AA] mb-1.5 block">Webhook URL</label>
                        <input
                          data-testid="whatsapp-webhook-input"
                          type="url"
                          placeholder="https://your-domain.com/webhook"
                          value={form.webhook_url || ""}
                          onChange={(e) => setForm((f) => ({ ...f, webhook_url: e.target.value }))}
                          className="w-full bg-black/50 border border-white/10 focus:border-forge-cyan/50 rounded-sm px-3 py-2 text-xs text-white placeholder:text-[#52525B] outline-none transition-all font-mono"
                        />
                      </div>
                    </>
                  )}
                  {error && (
                    <p className="text-xs text-forge-error">{error}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAdding(null)}
                      className="flex-1 text-xs border border-white/10 bg-white/5 hover:bg-white/10 text-[#A1A1AA] py-2 rounded-sm transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      data-testid={`save-${ct.id}-btn`}
                      onClick={() => handleAdd(ct.id)}
                      disabled={saving}
                      className="flex-1 text-xs bg-forge-cyan text-black font-semibold py-2 rounded-sm hover:bg-forge-cyan-hover transition-all disabled:opacity-50"
                    >
                      {saving ? "Connecting..." : "Connect"}
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Connected Channels List */}
      {channels.length > 0 && (
        <div>
          <h2 className="font-secondary text-xs text-[#52525B] uppercase tracking-widest mb-3">Connected Channels</h2>
          <div className="space-y-2">
            {channels.map((ch) => {
              const ct = CHANNEL_TYPES.find((t) => t.id === ch.channel_type);
              return (
                <div key={ch.channel_id} className="forge-card rounded-sm p-3 flex items-center gap-3">
                  {ct && <ct.icon size={14} className={ct.color} />}
                  <div className="flex-1">
                    <p className="text-xs font-secondary font-medium text-white">{ct?.label || ch.channel_type}</p>
                    <p className="text-xs text-[#52525B] font-mono">{ch.channel_id}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-forge-success">
                    <CheckCircle size={11} /> Active
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
