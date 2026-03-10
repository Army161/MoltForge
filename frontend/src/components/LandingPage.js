import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Server, Cpu, Activity, Shield, Terminal, Zap, Settings, Users,
  CreditCard, ArrowRight, Check, ChevronRight
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" } }),
};

const FEATURES = [
  { icon: Zap, title: "One-Click Deploy", desc: "Launch a fully-managed agent workspace in seconds. No infra knowledge required.", accent: "cyan" },
  { icon: Shield, title: "Tenant Isolation", desc: "Cryptographically isolated runtimes. Each workspace gets its own secrets vault.", accent: "amber" },
  { icon: Terminal, title: "Live Log Streaming", desc: "Full install logs streamed in real-time. Every phase, every health check.", accent: "cyan" },
  { icon: Cpu, title: "Pluggable LLM", desc: "OpenAI, Claude, Gemini — switch providers via env vars. BYOK or platform-managed.", accent: "amber" },
  { icon: Activity, title: "Persistent Deploy", desc: "Keep agents online 24/7 with the deploy toggle. Built-in restart policies.", accent: "cyan" },
  { icon: Server, title: "Channel Integrations", desc: "Connect Telegram and WhatsApp in one click. More channels coming soon.", accent: "amber" },
];

const PRICING = [
  { id: "starter", name: "Starter", price: "$9.99", period: "/mo", features: ["1 workspace", "100k tokens/mo", "Community support", "All core channels"] },
  { id: "pro", name: "Pro", price: "$29.99", period: "/mo", features: ["5 workspaces", "1M tokens/mo", "Priority support", "Custom LLM providers", "Admin observability"], highlight: true },
  { id: "enterprise", name: "Enterprise", price: "$99.99", period: "/mo", features: ["Unlimited workspaces", "10M tokens/mo", "SLA support", "Custom LLM providers", "Dedicated infrastructure"] },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050505] text-[#FAFAFA] overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-sm bg-forge-cyan/10 border border-forge-cyan/30 flex items-center justify-center">
              <Zap size={14} className="text-forge-cyan" />
            </div>
            <span className="font-secondary font-bold text-sm tracking-tight text-white">MoltForge</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-[#A1A1AA]">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#docs" className="hover:text-white transition-colors">Docs</a>
          </div>
          <div className="flex items-center gap-3">
            <button
              data-testid="nav-login-btn"
              onClick={() => navigate("/login")}
              className="text-sm text-[#A1A1AA] hover:text-white transition-colors px-3 py-1.5"
            >
              Sign In
            </button>
            <button
              data-testid="nav-get-started-btn"
              onClick={() => navigate("/login")}
              className="text-sm bg-forge-cyan text-black font-semibold px-4 py-1.5 rounded-sm hover:bg-forge-cyan-hover transition-all shadow-glow-cyan active:scale-95"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1750969185331-e03829f72c7d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1800)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            mixBlendMode: "luminosity",
          }}
        />
        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={0}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-forge-cyan/20 bg-forge-cyan/5 text-forge-cyan text-xs font-secondary mb-8"
          >
            <span className="w-1.5 h-1.5 bg-forge-cyan rounded-full pulse-glow" />
            Production-Ready Agent Infrastructure
          </motion.div>

          <motion.h1
            variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="font-secondary text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.05]"
          >
            Deploy AI Agents.<br />
            <span className="text-forge-cyan text-glow-cyan">Instantly.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp} initial="hidden" animate="visible" custom={2}
            className="text-lg text-[#A1A1AA] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            One click. Isolated runtime. Platform-managed LLM credentials.
            Full install logs. Control panel ready in under 60 seconds.
          </motion.p>

          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              data-testid="hero-launch-btn"
              onClick={() => navigate("/login")}
              className="group flex items-center gap-2 bg-forge-cyan text-black font-semibold px-7 py-3 rounded-sm hover:bg-forge-cyan-hover transition-all shadow-glow-cyan active:scale-95 text-base"
            >
              Launch Your Agent
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              data-testid="hero-docs-btn"
              className="flex items-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-white px-7 py-3 rounded-sm transition-all text-base"
            >
              <Terminal size={16} />
              View Docs
            </button>
          </motion.div>

          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={4}
            className="mt-12 flex items-center justify-center gap-8 text-sm text-[#52525B]"
          >
            {["SOC 2 Ready", "Tenant-Isolated", "128-bit tokens", "BYOK Support"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <Check size={12} className="text-forge-success" />{t}
              </span>
            ))}
          </motion.div>
        </div>

        <div className="beam-h max-w-3xl mx-auto mt-16 opacity-30" />
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <p className="text-xs font-secondary text-forge-cyan uppercase tracking-widest mb-3">Platform Capabilities</p>
            <h2 className="font-secondary text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Everything for managed agent deployment
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                className="forge-card rounded-md p-6 group hover:-translate-y-1 transition-transform duration-200"
              >
                <div className={`w-10 h-10 rounded-sm flex items-center justify-center mb-4 ${
                  f.accent === "cyan" ? "bg-forge-cyan/10 border border-forge-cyan/20" : "bg-forge-amber/10 border border-forge-amber/20"
                }`}>
                  <f.icon size={18} className={f.accent === "cyan" ? "text-forge-cyan" : "text-forge-amber"} />
                </div>
                <h3 className="font-secondary font-semibold text-white mb-2 text-base">{f.title}</h3>
                <p className="text-sm text-[#A1A1AA] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Install Flow Preview */}
      <section className="py-16 px-6 border-y border-white/5">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-10"
          >
            <p className="text-xs font-secondary text-forge-amber uppercase tracking-widest mb-3">Install State Machine</p>
            <h2 className="font-secondary text-2xl font-bold text-white">From click to healthy in seconds</h2>
          </motion.div>
          <div className="flex items-center justify-center gap-0 flex-wrap">
            {["QUEUED", "PROVISIONING", "BOOTSTRAPPING", "HEALTHY"].map((s, i) => (
              <React.Fragment key={s}>
                <motion.div
                  variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                  className={`px-4 py-2 rounded-sm border text-xs font-secondary font-medium ${
                    s === "HEALTHY"
                      ? "bg-forge-success/10 border-forge-success/30 text-forge-success"
                      : "bg-white/3 border-white/10 text-[#A1A1AA]"
                  }`}
                >
                  {s}
                </motion.div>
                {i < 3 && <ChevronRight size={14} className="text-[#3F3F46] mx-1" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <p className="text-xs font-secondary text-forge-cyan uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="font-secondary text-3xl sm:text-4xl font-bold text-white tracking-tight">Simple, transparent pricing</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRICING.map((plan, i) => (
              <motion.div
                key={plan.id}
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                className={`forge-card rounded-md p-6 flex flex-col ${plan.highlight ? "border-forge-cyan/30 shadow-glow-cyan" : ""}`}
              >
                {plan.highlight && (
                  <div className="text-xs font-secondary text-forge-cyan bg-forge-cyan/10 border border-forge-cyan/20 px-2 py-0.5 rounded-full self-start mb-4">
                    Most Popular
                  </div>
                )}
                <h3 className="font-secondary font-bold text-white text-lg mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-secondary font-bold text-white">{plan.price}</span>
                  <span className="text-[#52525B] text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[#A1A1AA]">
                      <Check size={14} className="text-forge-success shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <button
                  data-testid={`pricing-${plan.id}-btn`}
                  onClick={() => navigate("/login")}
                  className={`w-full py-2.5 rounded-sm text-sm font-semibold transition-all active:scale-95 ${
                    plan.highlight
                      ? "bg-forge-cyan text-black hover:bg-forge-cyan-hover shadow-glow-cyan"
                      : "border border-white/10 bg-white/5 hover:bg-white/10 text-white"
                  }`}
                >
                  Get Started
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-forge-cyan" />
            <span className="font-secondary text-sm font-bold text-white">MoltForge</span>
          </div>
          <p className="text-xs text-[#52525B]">
            Production-ready managed agent infrastructure. Build, deploy, scale.
          </p>
          <p className="text-xs text-[#52525B]">&copy; {new Date().getFullYear()} MoltForge</p>
        </div>
      </footer>
    </div>
  );
}
