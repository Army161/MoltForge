import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Check, Loader, ExternalLink, Clock, AlertTriangle } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PLAN_COLORS = {
  starter: "border-white/10",
  pro: "border-forge-cyan/30 shadow-glow-cyan",
  enterprise: "border-forge-amber/20",
};

export default function BillingPage() {
  const [plans, setPlans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [plansRes, txRes] = await Promise.all([
          axios.get(`${API}/billing/plans`, { withCredentials: true }),
          axios.get(`${API}/billing/transactions`, { withCredentials: true }),
        ]);
        setPlans(plansRes.data);
        setTransactions(txRes.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();

    // Check if returning from Stripe
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (sessionId) {
      pollPaymentStatus(sessionId);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 6;
    if (attempts >= maxAttempts) {
      setStatusMsg("Payment status check timed out. Check your email for confirmation.");
      setStatusType("warn");
      return;
    }
    try {
      const res = await axios.get(`${API}/billing/status/${sessionId}`, { withCredentials: true });
      if (res.data.payment_status === "paid") {
        setStatusMsg("Payment successful! Your plan has been activated.");
        setStatusType("success");
        // Reload transactions
        const txRes = await axios.get(`${API}/billing/transactions`, { withCredentials: true });
        setTransactions(txRes.data);
        return;
      } else if (res.data.status === "expired") {
        setStatusMsg("Payment session expired. Please try again.");
        setStatusType("error");
        return;
      }
      setStatusMsg("Processing payment...");
      setStatusType("loading");
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2000);
    } catch (e) {
      setStatusMsg("Error checking payment status.");
      setStatusType("error");
    }
  };

  const handleCheckout = async (planId) => {
    setCheckingOut(planId);
    try {
      const res = await axios.post(`${API}/billing/checkout`, {
        plan_id: planId,
        origin_url: window.location.origin,
      }, { withCredentials: true });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (e) {
      const msg = e.response?.data?.detail || "Failed to create checkout session";
      setStatusMsg(msg);
      setStatusType("error");
    } finally {
      setCheckingOut(null);
    }
  };

  const statusBanner = statusMsg && (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-sm border text-sm ${
      statusType === "success" ? "bg-forge-success/10 border-forge-success/25 text-forge-success" :
      statusType === "error" ? "bg-forge-error/10 border-forge-error/25 text-forge-error" :
      statusType === "warn" ? "bg-forge-amber/10 border-forge-amber/25 text-forge-amber" :
      "bg-forge-cyan/10 border-forge-cyan/25 text-forge-cyan"
    }`}>
      {statusType === "loading" && <Loader size={14} className="animate-spin" />}
      {statusType === "success" && <Check size={14} />}
      {statusType === "error" && <AlertTriangle size={14} />}
      {statusMsg}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="font-secondary text-xl font-bold text-white flex items-center gap-2">
          <CreditCard size={18} className="text-forge-cyan" /> Billing & Usage
        </h1>
        <p className="text-sm text-[#52525B] mt-1">Manage your subscription and payment history</p>
      </div>

      {statusBanner}

      {/* Stripe Notice */}
      <div className="forge-card rounded-sm p-3 border-forge-amber/15 flex items-start gap-3">
        <AlertTriangle size={13} className="text-forge-amber shrink-0 mt-0.5" />
        <p className="text-xs text-[#A1A1AA]">
          Stripe is configured. Using test keys — no real charges will occur. Set <span className="font-mono text-forge-cyan">STRIPE_API_KEY=sk_live_...</span> in your environment to enable live payments.
        </p>
      </div>

      {/* Plans */}
      <div>
        <h2 className="font-secondary text-xs text-[#52525B] uppercase tracking-widest mb-4">Subscription Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loading ? (
            [1, 2, 3].map((i) => <div key={i} className="forge-card rounded-md h-64 animate-pulse" />)
          ) : (
            plans.map((plan) => (
              <motion.div
                key={plan.plan_id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`forge-card rounded-md p-5 flex flex-col ${PLAN_COLORS[plan.plan_id] || "border-white/10"}`}
              >
                {plan.plan_id === "pro" && (
                  <div className="text-xs font-secondary text-forge-cyan bg-forge-cyan/10 border border-forge-cyan/20 px-2 py-0.5 rounded-full self-start mb-3">
                    Popular
                  </div>
                )}
                <h3 className="font-secondary font-bold text-white text-base mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-secondary font-bold text-white">${plan.amount}</span>
                  <span className="text-[#52525B] text-xs">/mo</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                      <Check size={11} className="text-forge-success shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <button
                  data-testid={`checkout-${plan.plan_id}-btn`}
                  onClick={() => handleCheckout(plan.plan_id)}
                  disabled={checkingOut === plan.plan_id}
                  className={`w-full py-2.5 rounded-sm text-sm font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 ${
                    plan.plan_id === "pro"
                      ? "bg-forge-cyan text-black hover:bg-forge-cyan-hover shadow-glow-cyan"
                      : "border border-white/10 bg-white/5 hover:bg-white/10 text-white"
                  } disabled:opacity-50`}
                >
                  {checkingOut === plan.plan_id ? (
                    <Loader size={14} className="animate-spin" />
                  ) : (
                    <><CreditCard size={13} /> Subscribe</>
                  )}
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h2 className="font-secondary text-xs text-[#52525B] uppercase tracking-widest mb-4">Payment History</h2>
        <div className="forge-card rounded-md overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-8 text-center">
              <CreditCard size={24} className="text-[#3F3F46] mx-auto mb-3" />
              <p className="text-sm text-[#52525B]">No transactions yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-white/8">
                <tr className="text-xs font-secondary text-[#52525B] uppercase tracking-widest">
                  {["Date", "Plan", "Amount", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <tr key={tx.tx_id} className={`border-b border-white/5 ${i % 2 ? "bg-white/[0.01]" : ""}`}>
                    <td className="px-4 py-3 text-xs text-[#A1A1AA] font-mono">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-white font-secondary capitalize">{tx.plan_id}</td>
                    <td className="px-4 py-3 text-xs text-white font-mono">${tx.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                        tx.payment_status === "paid" ? "bg-forge-success/10 text-forge-success border-forge-success/20" :
                        tx.payment_status === "initiated" ? "bg-forge-amber/10 text-forge-amber border-forge-amber/20" :
                        "bg-white/5 text-[#A1A1AA] border-white/10"
                      }`}>
                        {tx.payment_status === "paid" ? <Check size={10} /> : <Clock size={10} />}
                        {tx.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
