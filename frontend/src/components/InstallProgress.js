import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertTriangle, Clock, Loader, ArrowRight, RefreshCw, Terminal, Zap } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PHASES = ["queued", "provisioning", "bootstrapping", "healthy"];
const PHASE_LABELS = { queued: "Queued", provisioning: "Provisioning", bootstrapping: "Bootstrapping", healthy: "Healthy", failed: "Failed" };

const LOG_COLORS = { INFO: "text-[#A1A1AA]", SUCCESS: "text-forge-success", ERROR: "text-forge-error", WARN: "text-forge-amber" };

function StatusBadge({ status }) {
  const map = {
    queued: { cls: "bg-[#52525B]/10 text-[#A1A1AA] border-[#52525B]/20", icon: Clock },
    provisioning: { cls: "bg-forge-amber/10 text-forge-amber border-forge-amber/20", icon: Loader },
    bootstrapping: { cls: "bg-forge-cyan/10 text-forge-cyan border-forge-cyan/20", icon: Loader },
    healthy: { cls: "bg-forge-success/10 text-forge-success border-forge-success/20", icon: CheckCircle },
    failed: { cls: "bg-forge-error/10 text-forge-error border-forge-error/20", icon: AlertTriangle },
  };
  const cfg = map[status] || map.queued;
  return (
    <span data-testid="install-status-badge" className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-secondary border ${cfg.cls}`}>
      <cfg.icon size={11} className={["provisioning", "bootstrapping"].includes(status) ? "animate-spin" : ""} />
      {PHASE_LABELS[status] || status}
    </span>
  );
}

export default function InstallProgress() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [logs, setLogs] = useState([]);
  const [retrying, setRetrying] = useState(false);
  const logsEndRef = useRef(null);
  const pollRef = useRef(null);
  const [done, setDone] = useState(false);

  const scrollLogs = () => logsEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const fetchJobAndLogs = async () => {
    try {
      const [wsRes, jobsRes] = await Promise.all([
        axios.get(`${API}/workspaces/${workspaceId}`, { withCredentials: true }),
        axios.get(`${API}/workspaces/${workspaceId}/jobs`, { withCredentials: true }),
      ]);
      setWorkspace(wsRes.data);
      const latestJob = jobsRes.data[0];
      if (!latestJob) return;
      setJob(latestJob);

      const logsRes = await axios.get(`${API}/jobs/${latestJob.job_id}/logs`, { withCredentials: true });
      setLogs(logsRes.data);

      if (latestJob.status === "healthy" || latestJob.status === "failed") {
        clearInterval(pollRef.current);
        setDone(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchJobAndLogs();
    pollRef.current = setInterval(fetchJobAndLogs, 2000);
    return () => clearInterval(pollRef.current);
  }, [workspaceId]);

  useEffect(() => { scrollLogs(); }, [logs]);

  const handleRetry = async () => {
    if (!job) return;
    setRetrying(true);
    try {
      await axios.post(`${API}/jobs/${job.job_id}/retry`, {}, { withCredentials: true });
      setDone(false);
      setLogs([]);
      pollRef.current = setInterval(fetchJobAndLogs, 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setRetrying(false);
    }
  };

  const phaseIndex = PHASES.indexOf(job?.status);
  const progress = job?.status === "failed" ? 0 :
    job?.status === "healthy" ? 100 :
    phaseIndex >= 0 ? Math.round((phaseIndex / (PHASES.length - 1)) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-15 pointer-events-none" />

      {/* Top bar */}
      <header className="relative border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-xl px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-sm bg-forge-cyan/10 border border-forge-cyan/30 flex items-center justify-center">
            <Zap size={13} className="text-forge-cyan" />
          </div>
          <div>
            <p className="text-sm font-secondary font-bold text-white">{workspace?.name || "Loading..."}</p>
            <p className="text-xs text-[#52525B]">Install Progress</p>
          </div>
        </div>
        {job && <StatusBadge status={job.status} />}
      </header>

      <div className="relative flex-1 max-w-4xl mx-auto w-full px-6 py-8 space-y-6">
        {/* Phase Stepper */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="forge-card rounded-md p-5">
          <div className="flex items-center justify-between mb-4">
            {PHASES.map((phase, i) => {
              const isDone = phaseIndex > i || job?.status === "healthy";
              const isActive = phaseIndex === i && job?.status !== "healthy" && job?.status !== "failed";
              return (
                <React.Fragment key={phase}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      isDone ? "bg-forge-success border-forge-success" :
                      isActive ? "border-forge-cyan bg-forge-cyan/10" :
                      "border-white/15 bg-transparent"
                    }`}>
                      {isDone ? (
                        <CheckCircle size={14} className="text-white" />
                      ) : isActive ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-forge-cyan animate-pulse" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-white/20" />
                      )}
                    </div>
                    <span className={`text-xs font-secondary capitalize hidden sm:block ${isDone ? "text-forge-success" : isActive ? "text-forge-cyan" : "text-[#52525B]"}`}>
                      {PHASE_LABELS[phase]}
                    </span>
                  </div>
                  {i < PHASES.length - 1 && (
                    <div className={`flex-1 h-px mx-2 transition-all ${isDone ? "bg-forge-success/50" : isActive ? "bg-forge-cyan/30" : "bg-white/10"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${job?.status === "failed" ? "bg-forge-error" : "bg-forge-cyan"}`}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-[#52525B]">
              {job?.status === "healthy" ? "Agent started successfully" : job?.status === "failed" ? "Install failed" : "Installing..."}
            </span>
            <span className="text-xs text-[#52525B] font-mono">{progress}%</span>
          </div>
        </motion.div>

        {/* Terminal Log Viewer */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-secondary text-[#52525B] uppercase tracking-widest">
              <Terminal size={12} /> Install Logs
            </div>
            <span className="text-xs text-[#52525B] font-mono">{logs.length} entries</span>
          </div>
          <div
            data-testid="install-log-terminal"
            className="terminal rounded-md p-4 h-72 overflow-y-auto space-y-0.5"
          >
            <AnimatePresence>
              {logs.length === 0 && (
                <p className="text-[#3F3F46] text-xs">Waiting for logs...</p>
              )}
              {logs.map((log, i) => (
                <motion.div
                  key={log.log_id || i}
                  initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                  className="flex gap-3 text-xs leading-relaxed"
                >
                  <span className="text-[#3F3F46] shrink-0 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString("en", { hour12: false })}
                  </span>
                  <span className={`font-mono font-medium shrink-0 w-7 ${
                    log.level === "SUCCESS" ? "text-forge-success" :
                    log.level === "ERROR" ? "text-forge-error" :
                    log.level === "WARN" ? "text-forge-amber" : "text-forge-cyan"
                  }`}>{log.level.slice(0,4)}</span>
                  <span className={`${LOG_COLORS[log.level] || "text-[#A1A1AA]"}`}>{log.message}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={logsEndRef} />
          </div>
        </motion.div>

        {/* Actions */}
        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`forge-card rounded-md p-5 ${job?.status === "healthy" ? "border-forge-success/25" : "border-forge-error/25"}`}
            >
              {job?.status === "healthy" ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-forge-success/10 border border-forge-success/25 flex items-center justify-center">
                      <CheckCircle size={18} className="text-forge-success" />
                    </div>
                    <div>
                      <p className="font-secondary font-semibold text-white text-sm">Agent started successfully</p>
                      <p className="text-xs text-[#A1A1AA] mt-0.5">Your workspace is healthy and ready to use.</p>
                    </div>
                  </div>
                  <button
                    data-testid="open-control-panel-btn"
                    onClick={() => navigate(`/workspace/${workspaceId}/panel`)}
                    className="flex items-center gap-2 bg-forge-cyan text-black font-semibold px-5 py-2.5 rounded-sm text-sm hover:bg-forge-cyan-hover transition-all shadow-glow-cyan active:scale-95 whitespace-nowrap"
                  >
                    Open Control Panel <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-forge-error/10 border border-forge-error/25 flex items-center justify-center">
                      <AlertTriangle size={18} className="text-forge-error" />
                    </div>
                    <div>
                      <p className="font-secondary font-semibold text-white text-sm">Install failed</p>
                      <p className="text-xs text-[#A1A1AA] mt-0.5">{job?.error || "An error occurred during provisioning."}</p>
                    </div>
                  </div>
                  <button
                    data-testid="retry-install-btn"
                    onClick={handleRetry}
                    disabled={retrying}
                    className="flex items-center gap-2 border border-forge-error/30 bg-forge-error/10 text-forge-error hover:bg-forge-error/20 font-semibold px-5 py-2.5 rounded-sm text-sm transition-all active:scale-95 whitespace-nowrap"
                  >
                    {retrying ? <div className="w-3.5 h-3.5 border-2 border-forge-error border-t-transparent rounded-full animate-spin" /> : <RefreshCw size={14} />}
                    Retry Install
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
