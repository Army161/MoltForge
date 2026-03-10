import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Users, Server, Activity, RefreshCw, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_BADGE = {
  healthy: "bg-forge-success/10 text-forge-success border-forge-success/20",
  queued: "bg-[#52525B]/10 text-[#A1A1AA] border-[#52525B]/20",
  provisioning: "bg-forge-amber/10 text-forge-amber border-forge-amber/20",
  bootstrapping: "bg-forge-cyan/10 text-forge-cyan border-forge-cyan/20",
  failed: "bg-forge-error/10 text-forge-error border-forge-error/20",
  active: "bg-forge-success/10 text-forge-success border-forge-success/20",
};

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const load = async () => {
    setLoading(true);
    try {
      const [statsRes, jobsRes, usersRes, auditRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { withCredentials: true }),
        axios.get(`${API}/admin/jobs`, { withCredentials: true }),
        axios.get(`${API}/admin/users`, { withCredentials: true }),
        axios.get(`${API}/admin/audit`, { withCredentials: true }),
      ]);
      setStats(statsRes.data);
      setJobs(jobsRes.data);
      setUsers(usersRes.data);
      setAudit(auditRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-secondary text-xl font-bold text-white flex items-center gap-2">
            <Shield size={18} className="text-forge-cyan" /> Admin Observability
          </h1>
          <p className="text-sm text-[#52525B] mt-1">System-wide logs, jobs, and user management</p>
        </div>
        <button
          data-testid="admin-refresh-btn"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-[#A1A1AA] hover:text-white px-3 py-2 rounded-sm text-xs transition-all"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Users", value: stats.total_users, icon: Users, color: "text-forge-cyan" },
            { label: "Workspaces", value: stats.total_workspaces, icon: Server, color: "text-forge-amber" },
            { label: "Active", value: stats.active_workspaces, icon: CheckCircle, color: "text-forge-success" },
            { label: "Total Jobs", value: stats.total_jobs, icon: Activity, color: "text-forge-cyan" },
            { label: "Healthy", value: stats.healthy_jobs, icon: CheckCircle, color: "text-forge-success" },
            { label: "Failed", value: stats.failed_jobs, icon: AlertTriangle, color: "text-forge-error" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="forge-card rounded-md p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#52525B]">{s.label}</span>
                <s.icon size={12} className={s.color} />
              </div>
              <span className="text-xl font-secondary font-bold text-white">{s.value}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-black/40 border border-white/8 rounded-sm p-1 gap-1 h-auto">
          {[
            { value: "overview", icon: Activity, label: "Jobs" },
            { value: "users", icon: Users, label: "Users" },
            { value: "audit", icon: Shield, label: "Audit Logs" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              data-testid={`admin-tab-${tab.value}`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-secondary rounded-sm data-[state=active]:bg-forge-cyan data-[state=active]:text-black data-[state=inactive]:text-[#A1A1AA] transition-all"
            >
              <tab.icon size={12} />{tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Jobs Tab */}
        <TabsContent value="overview" className="mt-4">
          <div className="forge-card rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/8">
                  <tr className="text-xs font-secondary text-[#52525B] uppercase tracking-widest">
                    {["Job ID", "Workspace", "Status", "Created", "Updated"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jobs.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-sm text-[#52525B]">No jobs found</td></tr>
                  )}
                  {jobs.map((job, i) => (
                    <tr key={job.job_id} className={`border-b border-white/5 text-xs ${i % 2 ? "bg-white/[0.01]" : ""}`}>
                      <td className="px-4 py-3 font-mono text-[#52525B] truncate max-w-[120px]">{job.job_id}</td>
                      <td className="px-4 py-3 font-mono text-[#A1A1AA] truncate max-w-[120px]">{job.workspace_id}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${STATUS_BADGE[job.status] || "bg-white/5 text-[#A1A1AA] border-white/10"}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#52525B] whitespace-nowrap">{new Date(job.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3 text-[#52525B] whitespace-nowrap">{new Date(job.updated_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-4">
          <div className="forge-card rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-white/8">
                <tr className="text-xs font-secondary text-[#52525B] uppercase tracking-widest">
                  {["Name", "Email", "Provider", "Created"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-8 text-sm text-[#52525B]">No users found</td></tr>
                )}
                {users.map((u, i) => (
                  <tr key={u.user_id} className={`border-b border-white/5 text-xs ${i % 2 ? "bg-white/[0.01]" : ""}`}>
                    <td className="px-4 py-3 text-white flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-forge-cyan/15 border border-forge-cyan/25 flex items-center justify-center overflow-hidden">
                        {u.picture ? <img src={u.picture} alt="" className="w-full h-full object-cover" /> : <span className="text-xs text-forge-cyan">{u.name?.[0]}</span>}
                      </div>
                      {u.name}
                    </td>
                    <td className="px-4 py-3 text-[#A1A1AA] font-mono">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-sm bg-white/5 border border-white/10 text-[#A1A1AA] capitalize">{u.auth_provider}</span>
                    </td>
                    <td className="px-4 py-3 text-[#52525B]">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="mt-4">
          <div className="forge-card rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/8">
                  <tr className="text-xs font-secondary text-[#52525B] uppercase tracking-widest">
                    {["Time", "User", "Action", "Resource"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {audit.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-8 text-sm text-[#52525B]">No audit logs</td></tr>
                  )}
                  {audit.slice(0, 100).map((log, i) => (
                    <tr key={log.audit_id} className={`border-b border-white/5 text-xs ${i % 2 ? "bg-white/[0.01]" : ""}`}>
                      <td className="px-4 py-3 text-[#52525B] font-mono whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-3 text-[#A1A1AA] font-mono truncate max-w-[120px]">{log.user_id}</td>
                      <td className="px-4 py-3">
                        <span className="text-forge-cyan font-mono">{log.action}</span>
                      </td>
                      <td className="px-4 py-3 text-[#52525B] font-mono truncate max-w-[120px]">{log.resource}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
