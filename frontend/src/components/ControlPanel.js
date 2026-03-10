import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Terminal, Radio, Settings, CheckCircle, AlertTriangle,
  Clock, Send, RotateCcw, Rocket, Loader, Bot, User
} from "lucide-react";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function StatusBadge({ status }) {
  if (!status) return null;
  const cfg = {
    active: { cls: "bg-forge-success/10 text-forge-success border-forge-success/20", dot: "bg-forge-success" },
    pending: { cls: "bg-forge-amber/10 text-forge-amber border-forge-amber/20", dot: "bg-forge-amber pulse-glow" },
    failed: { cls: "bg-forge-error/10 text-forge-error border-forge-error/20", dot: "bg-forge-error" },
  }[status] || { cls: "bg-[#52525B]/10 text-[#A1A1AA] border-[#52525B]/20", dot: "bg-[#52525B]" };
  return (
    <span data-testid="agent-status-badge" className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-secondary border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-forge-cyan/10 border border-forge-cyan/25 flex items-center justify-center shrink-0 mt-0.5">
          <Bot size={13} className="text-forge-cyan" />
        </div>
      )}
      <div className={`max-w-[80%] rounded-md px-3.5 py-2.5 text-sm leading-relaxed ${isUser ? "chat-user" : "chat-assistant"}`}>
        <p className="text-white whitespace-pre-wrap break-words">{msg.content}</p>
        <p className="text-[#52525B] text-xs mt-1 font-mono">
          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString("en", { hour12: false }) : ""}
        </p>
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-white/10 border border-white/15 flex items-center justify-center shrink-0 mt-0.5">
          <User size={13} className="text-[#A1A1AA]" />
        </div>
      )}
    </motion.div>
  );
}

export default function ControlPanel() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [logs, setLogs] = useState([]);
  const [restarting, setRestarting] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [wsRes, histRes] = await Promise.all([
          axios.get(`${API}/workspaces/${workspaceId}`, { withCredentials: true }),
          axios.get(`${API}/workspaces/${workspaceId}/chat/history`, { withCredentials: true }),
        ]);
        setWorkspace(wsRes.data);
        setMessages(histRes.data);
      } catch (e) { console.error(e); }
    };
    load();
  }, [workspaceId]);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const jobsRes = await axios.get(`${API}/workspaces/${workspaceId}/jobs`, { withCredentials: true });
        if (jobsRes.data.length > 0) {
          const logsRes = await axios.get(`${API}/jobs/${jobsRes.data[0].job_id}/logs`, { withCredentials: true });
          setLogs(logsRes.data);
        }
      } catch (e) { console.error(e); }
    };
    loadLogs();
  }, [workspaceId]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const userMsg = { role: "user", content: input.trim(), timestamp: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);
    try {
      const res = await axios.post(`${API}/workspaces/${workspaceId}/chat`, {
        message: userMsg.content, workspace_id: workspaceId
      }, { withCredentials: true });
      setMessages((m) => [...m, { role: "assistant", content: res.data.content, timestamp: new Date().toISOString() }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: `Error: ${e.response?.data?.detail || "Failed to get response"}`, timestamp: new Date().toISOString() }]);
    } finally {
      setSending(false);
    }
  };

  const handleRestart = async () => {
    setRestarting(true);
    try {
      await axios.post(`${API}/workspaces/${workspaceId}/restart`, {}, { withCredentials: true });
      navigate(`/workspace/${workspaceId}/install`);
    } catch (e) { console.error(e); }
    finally { setRestarting(false); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-secondary text-xl font-bold text-white flex items-center gap-3">
            {workspace?.name || "Agent Control Panel"}
            <StatusBadge status={workspace?.status} />
          </h1>
          <p className="text-sm text-[#52525B] mt-0.5 font-mono">{workspaceId}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            data-testid="restart-workspace-btn"
            onClick={handleRestart}
            disabled={restarting}
            className="flex items-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-[#A1A1AA] hover:text-white px-3 py-2 rounded-sm text-xs font-medium transition-all"
          >
            {restarting ? <Loader size={13} className="animate-spin" /> : <RotateCcw size={13} />}
            Restart
          </button>
          <button
            data-testid="deploy-toggle-btn"
            onClick={() => navigate(`/workspace/${workspaceId}/deploy`)}
            className="flex items-center gap-2 border border-forge-cyan/25 bg-forge-cyan/5 hover:bg-forge-cyan/10 text-forge-cyan px-3 py-2 rounded-sm text-xs font-medium transition-all"
          >
            <Rocket size={13} /> Deploy
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="bg-black/40 border border-white/8 rounded-sm p-1 gap-1 h-auto">
          {[
            { value: "chat", icon: MessageSquare, label: "Chat" },
            { value: "logs", icon: Terminal, label: "Logs" },
            { value: "channels", icon: Radio, label: "Channels" },
            { value: "settings", icon: Settings, label: "Settings" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              data-testid={`tab-${tab.value}`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-secondary rounded-sm data-[state=active]:bg-forge-cyan data-[state=active]:text-black data-[state=inactive]:text-[#A1A1AA] data-[state=inactive]:hover:text-white transition-all"
            >
              <tab.icon size={12} />{tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="mt-4">
          <div className="forge-card rounded-md flex flex-col" style={{ height: "60vh" }}>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-forge-cyan/10 border border-forge-cyan/25 flex items-center justify-center">
                    <Bot size={20} className="text-forge-cyan" />
                  </div>
                  <div>
                    <p className="font-secondary text-sm font-semibold text-white">{workspace?.agent_name || "Agent"} is ready</p>
                    <p className="text-xs text-[#52525B] mt-1">Start a conversation with your AI agent</p>
                  </div>
                </div>
              )}
              {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
              {sending && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-forge-cyan/10 border border-forge-cyan/25 flex items-center justify-center shrink-0">
                    <Bot size={13} className="text-forge-cyan" />
                  </div>
                  <div className="chat-assistant rounded-md px-3.5 py-2.5 flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-forge-cyan/50 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="border-t border-white/8 p-3 flex gap-2">
              <input
                data-testid="chat-input"
                type="text"
                placeholder="Message your agent..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                disabled={workspace?.status !== "active"}
                className="flex-1 bg-black/50 border border-white/10 focus:border-forge-cyan/40 focus:ring-1 focus:ring-forge-cyan/20 rounded-sm px-3 py-2 text-sm text-white placeholder:text-[#52525B] outline-none transition-all font-primary disabled:opacity-40"
              />
              <button
                data-testid="chat-send-btn"
                onClick={sendMessage}
                disabled={sending || !input.trim() || workspace?.status !== "active"}
                className="bg-forge-cyan text-black p-2 rounded-sm hover:bg-forge-cyan-hover transition-all shadow-glow-cyan active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="mt-4">
          <div className="terminal rounded-md p-4 overflow-y-auto space-y-1" style={{ height: "60vh" }}>
            {logs.length === 0 && <p className="text-[#3F3F46] text-xs">No logs available. Run an install job to see logs.</p>}
            {logs.map((log, i) => (
              <div key={i} className="flex gap-3 text-xs leading-relaxed">
                <span className="text-[#3F3F46] shrink-0 font-mono">{new Date(log.timestamp).toLocaleTimeString("en", { hour12: false })}</span>
                <span className={`font-mono font-medium shrink-0 w-7 ${log.level === "SUCCESS" ? "text-forge-success" : log.level === "ERROR" ? "text-forge-error" : "text-forge-cyan"}`}>{log.level?.slice(0,4)}</span>
                <span className={log.level === "SUCCESS" ? "text-forge-success" : log.level === "ERROR" ? "text-forge-error" : "text-[#A1A1AA]"}>{log.message}</span>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels" className="mt-4">
          <div className="forge-card rounded-md p-6 flex flex-col items-center gap-4 text-center">
            <Radio size={28} className="text-[#3F3F46]" />
            <div>
              <p className="font-secondary font-semibold text-white">Channel Integrations</p>
              <p className="text-sm text-[#52525B] mt-1">Connect Telegram, WhatsApp, and more</p>
            </div>
            <button
              data-testid="go-to-channels-btn"
              onClick={() => navigate(`/workspace/${workspaceId}/channels`)}
              className="flex items-center gap-2 bg-forge-cyan text-black font-semibold px-5 py-2 rounded-sm text-sm hover:bg-forge-cyan-hover transition-all shadow-glow-cyan"
            >
              <Radio size={14} /> Manage Channels
            </button>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4">
          <div className="forge-card rounded-md p-6 flex flex-col items-center gap-4 text-center">
            <Settings size={28} className="text-[#3F3F46]" />
            <div>
              <p className="font-secondary font-semibold text-white">Workspace Settings</p>
              <p className="text-sm text-[#52525B] mt-1">Configure LLM provider, models, and BYOK</p>
            </div>
            <button
              data-testid="go-to-settings-btn"
              onClick={() => navigate(`/settings`)}
              className="flex items-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-white px-5 py-2 rounded-sm text-sm transition-all"
            >
              <Settings size={14} /> Open Settings
            </button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
