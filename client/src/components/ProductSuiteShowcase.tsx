import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Mail,
  MessageSquare,
  Workflow,
  Users,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
  Send,
  BarChart3,
  ArrowRight,
  Server,
  Gift,
  Bot,
  Layers,
  Globe,
  Sliders,
  Database,
  Lock,
} from "lucide-react";

export const ProductSuiteShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"whatsapp" | "email" | "automation" | "crm">("whatsapp");

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.location.hash === "#email-suite") {
        setActiveTab("email");
      }
      const onHash = () => {
        if (window.location.hash === "#email-suite") {
          setActiveTab("email");
        }
      };
      window.addEventListener("hashchange", onHash);
      return () => window.removeEventListener("hashchange", onHash);
    }
  }, []);

  const tabs = [
    {
      id: "whatsapp",
      label: "WhatsApp Campaigns",
      icon: MessageSquare,
      color: "emerald",
      badge: "High Open Rates",
    },
    {
      id: "email",
      label: "Email Studio",
      icon: Mail,
      color: "blue",
      badge: "99.4% Deliverability",
    },
    {
      id: "automation",
      label: "Smart Automations",
      icon: Workflow,
      color: "purple",
      badge: "Cross-Channel",
    },
    {
      id: "crm",
      label: "Audience & Lists",
      icon: Users,
      color: "orange",
      badge: "Unlimited Contacts",
    },
  ] as const;

  return (
    <section id="email-suite" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white relative overflow-hidden scroll-mt-16">
      <div id="features-suite" className="absolute top-0 left-0 -z-10" />
      {/* Background ambient glowing orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-emerald-500/10 via-blue-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
            <Gift className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Free Forever • All Features Unlocked</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-5">
            The Complete Omnichannel Suite —{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
              Zero Cost, Zero Limits
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
            Everything you need to broadcast, automate, and grow your audience across WhatsApp and Email. 
            No credit card, no artificial paywalls, and no subscription fees.
          </p>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex justify-center mb-10 overflow-x-auto no-scrollbar pb-2">
          <div className="bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/80 flex items-center gap-1 sm:gap-2 shadow-xl backdrop-blur-md">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span className={`hidden md:inline-block text-[10px] px-1.5 py-0.5 rounded-md ${
                    isActive ? "bg-emerald-700/80 text-emerald-100" : "bg-slate-700/80 text-slate-400"
                  }`}>
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Feature Card & UI Mockup Showcase */}
        <div className="bg-slate-800/60 rounded-3xl border border-slate-700/70 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          {activeTab === "whatsapp" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Capabilities */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-500/20">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Official WhatsApp Cloud API & Web Sync</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                  High-Impact WhatsApp Broadcasts with Instant Deliverability
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Reach customers on the world's most opened messaging app. Launch bulk broadcasts, personalized one-to-one chats, and auto-responding AI bots with verified templates.
                </p>
                <div className="space-y-3 pt-2">
                  {[
                    "Send rich media: images, PDFs, videos, and quick-reply buttons",
                    "Dynamic variable tags (e.g. {{firstName}}, {{orderId}}, {{link}})",
                    "Real-time read receipts, delivery confirmations, and clicks",
                    "Unlimited messaging with zero platform markup fees",
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 flex items-center gap-3">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold px-5 py-3 rounded-xl transition-all shadow-md shadow-emerald-600/20"
                  >
                    <span>Launch WhatsApp Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <span className="text-xs text-slate-400">100% Free Forever</span>
                </div>
              </div>

              {/* Right Column: Sleek Product Mockup Card */}
              <div className="lg:col-span-6">
                <div className="bg-slate-900 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-mono text-slate-300 font-semibold">WhatsApp Campaign Live</span>
                    </div>
                    <span className="text-[11px] bg-emerald-500/20 text-emerald-400 font-medium px-2 py-0.5 rounded-full border border-emerald-500/30">
                      98.7% Open Rate
                    </span>
                  </div>

                  <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/50 space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Broadcast: VIP Members Flash Deal</span>
                      <span className="text-emerald-400">Sent: 12,450</span>
                    </div>
                    <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: "98%" }} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Delivered: 12,410</span>
                      <span>Read: 11,890</span>
                      <span>Replies: 3,420</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/40 rounded-xl space-y-1.5">
                    <p className="text-xs font-semibold text-emerald-300">Message Preview:</p>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      &ldquo;Hi <span className="text-emerald-400 font-mono">{"{{firstName}}"}</span>! Your exclusive weekend perks are now active. Enjoy free access on all features with code <span className="font-semibold text-white">FREEEVERYTHING</span>.&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "email" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Capabilities */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full border border-blue-500/20">
                  <Mail className="w-3.5 h-3.5" />
                  <span>High-Deliverability Email Studio</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                  Design, Broadcast & Land Directly in Primary Inboxes
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Send transactional notices, weekly newsletters, and promotional announcements with our modern visual builder and multi-SMTP engine.
                </p>
                <div className="space-y-3 pt-2">
                  {[
                    "Connect Brevo, SendGrid, Amazon SES, Resend, or your custom SMTP",
                    "6 universal business presets: Onboarding, Sales, Newsletters, Alerts",
                    "Automated SPF, DKIM, and DMARC verification guidance",
                    "Granular real-time tracking for opens, clicks, and unsubscribes",
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 flex items-center gap-3">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold px-5 py-3 rounded-xl transition-all shadow-md shadow-blue-600/20"
                  >
                    <span>Start Email Campaigns Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <span className="text-xs text-slate-400">Zero sender fees</span>
                </div>
              </div>

              {/* Right Column: Deliverability & Analytics Mockup */}
              <div className="lg:col-span-6">
                <div className="bg-slate-900 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-mono text-slate-300 font-semibold">SMTP Deliverability Engine</span>
                    </div>
                    <span className="text-[11px] bg-blue-500/20 text-blue-400 font-medium px-2 py-0.5 rounded-full border border-blue-500/30">
                      SPF & DKIM Validated
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 text-center">
                      <p className="text-[11px] text-slate-400">Delivery Rate</p>
                      <p className="text-lg font-bold text-white mt-0.5">99.4%</p>
                    </div>
                    <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 text-center">
                      <p className="text-[11px] text-slate-400">Avg Open Rate</p>
                      <p className="text-lg font-bold text-emerald-400 mt-0.5">42.8%</p>
                    </div>
                    <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 text-center">
                      <p className="text-[11px] text-slate-400">Click Rate</p>
                      <p className="text-lg font-bold text-blue-400 mt-0.5">18.2%</p>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/40 text-xs text-slate-300 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Supported SMTP Providers:</span>
                      <span className="text-emerald-400 font-medium">All Unlocked</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      {["Brevo", "SendGrid", "Amazon SES", "Resend", "Custom SMTP", "Mailgun"].map((p) => (
                        <span key={p} className="bg-slate-700/70 px-2 py-1 rounded-md text-slate-200">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "automation" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Capabilities */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-400 text-xs font-semibold px-3 py-1 rounded-full border border-purple-500/20">
                  <Workflow className="w-3.5 h-3.5" />
                  <span>Visual Workflow Orchestration</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                  Connect WhatsApp & Email in Automated Sequences
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Trigger smart drip campaigns based on customer behaviors, form submissions, sign-ups, or custom webhooks with zero coding required.
                </p>
                <div className="space-y-3 pt-2">
                  {[
                    "Multi-channel logic: Send Email, wait 24 hours, then follow up on WhatsApp",
                    "Smart condition branches (opened email, clicked link, replied)",
                    "Abandoned checkout and re-engagement trigger sequences",
                    "Unlimited active workflows and unlimited journey runs",
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 flex items-center gap-3">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-semibold px-5 py-3 rounded-xl transition-all shadow-md shadow-purple-600/20"
                  >
                    <span>Build Automated Flows Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <span className="text-xs text-slate-400">100% Free Forever</span>
                </div>
              </div>

              {/* Right Column: Workflow Diagram Mockup */}
              <div className="lg:col-span-6">
                <div className="bg-slate-900 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-mono text-slate-300 font-semibold">Active Workflow Journey</span>
                    <span className="text-[11px] bg-purple-500/20 text-purple-400 font-medium px-2 py-0.5 rounded-full border border-purple-500/30">
                      Running 24/7
                    </span>
                  </div>

                  {/* Flow Steps */}
                  <div className="space-y-2">
                    <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700/60 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                        1
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Trigger: New Contact Subscribed</p>
                        <p className="text-[11px] text-slate-400">Instant registration webhook or form capture</p>
                      </div>
                    </div>

                    <div className="flex justify-center my-0.5">
                      <div className="w-0.5 h-4 bg-purple-500/40" />
                    </div>

                    <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700/60 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                        2
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Action: Send Welcome Email</p>
                        <p className="text-[11px] text-slate-400">Template: Welcome & Getting Started Checklist</p>
                      </div>
                    </div>

                    <div className="flex justify-center my-0.5">
                      <div className="w-0.5 h-4 bg-purple-500/40" />
                    </div>

                    <div className="bg-slate-800/90 p-3 rounded-xl border border-purple-500/40 bg-purple-950/20 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                        3
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">If No Email Click After 24 Hours:</p>
                        <p className="text-[11px] text-emerald-400 font-medium">→ Automatically Send WhatsApp VIP Reminder</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "crm" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Capabilities */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-400 text-xs font-semibold px-3 py-1 rounded-full border border-orange-500/20">
                  <Users className="w-3.5 h-3.5" />
                  <span>Audience CRM & Dynamic Segmentation</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                  Organize, Tag, and Segment Unlimited Contacts
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Import CSV files with thousands of contacts in seconds. Organize subscribers by tags, engagement history, and custom attributes with zero contact limits.
                </p>
                <div className="space-y-3 pt-2">
                  {[
                    "Unlimited contacts and subscriber lists — no tier upgrades required",
                    "Bulk CSV / Excel contact import with automatic phone normalization",
                    "Custom attributes: company, country, purchase value, tags",
                    "Real-time unsubscribe and opt-out compliance management",
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 flex items-center gap-3">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white text-xs sm:text-sm font-semibold px-5 py-3 rounded-xl transition-all shadow-md shadow-orange-600/20"
                  >
                    <span>Import Contacts Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <span className="text-xs text-slate-400">100% Free Forever</span>
                </div>
              </div>

              {/* Right Column: Audience List Mockup */}
              <div className="lg:col-span-6">
                <div className="bg-slate-900 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-mono text-slate-300 font-semibold">Contact Management</span>
                    <span className="text-[11px] bg-orange-500/20 text-orange-400 font-medium px-2 py-0.5 rounded-full border border-orange-500/30">
                      Unlimited Storage
                    </span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { name: "Sarah Jenkins", email: "sarah@acmecorp.com", phone: "+1 (555) 234-5678", tag: "VIP Customer" },
                      { name: "Michael Chen", email: "m.chen@startup.io", phone: "+44 7911 123456", tag: "Active Subscriber" },
                      { name: "Elena Rostova", email: "elena@designhub.co", phone: "+49 151 23456789", tag: "Newsletter" },
                    ].map((contact, i) => (
                      <div key={i} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-white">{contact.name}</p>
                          <p className="text-[11px] text-slate-400">{contact.email} • {contact.phone}</p>
                        </div>
                        <span className="text-[10px] bg-slate-700 text-emerald-300 px-2 py-0.5 rounded-md font-medium">
                          {contact.tag}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 text-center text-xs text-slate-400">
                    Total Contacts: <strong className="text-white font-semibold">Unlimited</strong> • Zero contact fees
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 100% Free Forever Bottom Guarantee Banner */}
        <div className="mt-14 bg-gradient-to-r from-emerald-600/20 via-blue-600/20 to-purple-600/20 border border-emerald-500/30 rounded-2xl p-6 text-center max-w-4xl mx-auto backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                <Gift className="w-5 h-5 text-emerald-400" />
                Our Free Forever Promise
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Every business deserves access to enterprise-grade omnichannel tools. Enjoy unlimited broadcasts, contacts, and templates with 0 subscription fees.
              </p>
            </div>
            <Link
              href="/contact"
              className="shrink-0 bg-white text-slate-900 hover:bg-slate-100 text-xs sm:text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-md"
            >
              Get Started 100% Free →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductSuiteShowcase;
