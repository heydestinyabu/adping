import React, { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Users,
  UserCheck,
  User,
  Palette,
  Send,
  Smartphone,
  Monitor,
  Eye,
  Sparkles,
  Layers,
  FileText,
  AlertCircle,
  Clock,
  RefreshCw,
  Search,
  Plus,
  Edit2,
  X,
  Code,
  SlidersHorizontal,
  Link2,
} from "lucide-react";
import {
  SYSTEM_TEMPLATES,
  EmailTemplateDefinition,
  extractTemplateFields,
  applyTemplateFields,
  TemplateCustomFields,
} from "@/components/email/SystemTemplates";

export default function CreateEmailCampaignWizard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);

  // ── Pre-selected template from query parameter ──
  const initialTemplateMatch = useMemo(() => {
    try {
      const p = new URLSearchParams(window.location.search).get("template");
      if (p) {
        const found = SYSTEM_TEMPLATES.find((t) => t.name.toLowerCase() === p.toLowerCase());
        if (found) return found;
      }
    } catch {}
    return SYSTEM_TEMPLATES[0];
  }, []);

  const initialTemplateIndex = useMemo(() => {
    return SYSTEM_TEMPLATES.findIndex((t) => t.name === initialTemplateMatch.name);
  }, [initialTemplateMatch]);

  // ── Step 1: Form & Sender State ──
  const [campaignName, setCampaignName] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search).get("template");
      return p ? `${p} Broadcast` : "";
    } catch {
      return "";
    }
  });
  const [subject, setSubject] = useState(() => initialTemplateMatch?.subject || "");
  const [previewText, setPreviewText] = useState(() => initialTemplateMatch?.previewText || "");
  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [selectedSenderId, setSelectedSenderId] = useState<string>("default");

  // ── Step 2: Audience State ──
  // Options: 'all' | 'specific' | 'group' | 'manual'
  const [audienceType, setAudienceType] = useState<"all" | "specific" | "group" | "manual">("all");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [contactSearchQuery, setContactSearchQuery] = useState("");
  const [manualEmailsText, setManualEmailsText] = useState("");

  // ── Step 3: Content State ──
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number>(() =>
    initialTemplateIndex >= 0 ? initialTemplateIndex : 0
  );
  const [htmlContent, setHtmlContent] = useState<string>(() => initialTemplateMatch.htmlContent);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [editorTab, setEditorTab] = useState<"visual" | "code">("visual");
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>(() =>
    initialTemplateMatch?.category ? initialTemplateMatch.category : "all"
  );
  const [templateFields, setTemplateFields] = useState<TemplateCustomFields>(() =>
    extractTemplateFields(initialTemplateMatch.htmlContent, initialTemplateMatch.defaultFields)
  );

  // ── Step 4: Test & Scheduling State ──
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [sendOption, setSendOption] = useState<"now" | "later">("now");
  const [scheduledDateTime, setScheduledDateTime] = useState("");

  // Fetch verified senders
  const { data: senders = [] } = useQuery<any[]>({
    queryKey: ["/api/email/senders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/email/senders");
      return res.json();
    },
  });

  // Fetch contact groups
  const { data: rawGroupData } = useQuery<any>({
    queryKey: ["/api/groups"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/groups");
      return res.json();
    },
  });

  const contactGroups: any[] = useMemo(() => {
    if (Array.isArray(rawGroupData)) return rawGroupData;
    if (rawGroupData?.groups && Array.isArray(rawGroupData.groups)) return rawGroupData.groups;
    return [];
  }, [rawGroupData]);

  // Query CRM contacts directly from standard contacts endpoint (always available on server)
  const { data: crmContactsResponse } = useQuery<{ data?: any[]; pagination?: any }>({
    queryKey: ["/api/contacts", "wizard-audience"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/contacts?limit=250");
        return res.json();
      } catch (e) {
        return { data: [] };
      }
    },
  });

  const crmContactsList = useMemo(() => {
    return Array.isArray(crmContactsResponse?.data) ? crmContactsResponse.data : [];
  }, [crmContactsResponse]);

  // Search contacts and users with email for "certain user" selection
  const { data: contactsSearchResult, isLoading: isSearchingContacts } = useQuery<{ contacts: any[]; total: number }>({
    queryKey: ["/api/email/contacts-search", contactSearchQuery],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/email/contacts-search?query=${encodeURIComponent(contactSearchQuery)}&limit=60`);
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch {
          return { contacts: [], total: 0 };
        }
      } catch {
        return { contacts: [], total: 0 };
      }
    },
  });

  // Combined available contacts list (merges search results with CRM contacts)
  const availableContacts = useMemo(() => {
    if (contactsSearchResult?.contacts && Array.isArray(contactsSearchResult.contacts) && contactsSearchResult.contacts.length > 0) {
      return contactsSearchResult.contacts;
    }

    const q = contactSearchQuery.toLowerCase().trim();
    return crmContactsList
      .filter((c: any) => {
        if (!q) return true;
        return (
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q))
        );
      })
      .map((c: any) => ({
        id: `contact_${c.id}`,
        name: c.name || "Unnamed Contact",
        email: c.email || "",
        phone: c.phone || "",
        type: "contact" as const,
        groups: Array.isArray(c.groups) ? c.groups : [],
      }));
  }, [contactsSearchResult, crmContactsList, contactSearchQuery]);

  // Parse manual emails
  const parsedManualEmails = useMemo(() => {
    if (!manualEmailsText.trim()) return [];
    return Array.from(
      new Set(
        manualEmailsText
          .split(/[\n,;]+/)
          .map((e) => e.trim().toLowerCase())
          .filter((e) => e.includes("@") && e.length > 3)
      )
    );
  }, [manualEmailsText]);

  const queryClient = useQueryClient();
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [inlineEmailInput, setInlineEmailInput] = useState("");
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  // Inline email update for contacts without email
  const handleSaveInlineEmail = async (contactId: string) => {
    if (!inlineEmailInput.trim() || !inlineEmailInput.includes("@")) {
      toast({ title: "Please enter a valid email address", variant: "destructive" });
      return;
    }
    setIsSavingEmail(true);
    const cleanId = contactId.replace(/^contact_/, "");
    const trimmedEmail = inlineEmailInput.trim().toLowerCase();

    try {
      let saved = false;

      // 1. Try standard CRM update endpoint
      try {
        const crmRes = await apiRequest("PUT", `/api/contacts/${cleanId}`, { email: trimmedEmail });
        if (crmRes.ok) saved = true;
      } catch (e) {
        // non-blocking fallback
      }

      // 2. Try email campaign update endpoint
      if (!saved) {
        try {
          const res = await apiRequest("POST", "/api/email/update-contact-email", {
            contactId: cleanId,
            email: trimmedEmail,
          });
          if (res.ok) saved = true;
        } catch (e) {
          // non-blocking fallback
        }
      }

      // Invalidate both caches so UI updates everywhere
      await queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/email/contacts-search"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/email/audience-estimate"] });

      if (!selectedContactIds.includes(contactId)) {
        setSelectedContactIds((prev) => [...prev, contactId]);
      }

      toast({ title: "Email saved!", description: "Contact email updated and selected." });
      setEditingContactId(null);
      setInlineEmailInput("");
    } catch (err: any) {
      toast({ title: "Failed to update email", description: err.message, variant: "destructive" });
    } finally {
      setIsSavingEmail(false);
    }
  };

  // Query actual live audience estimate from backend
  const { data: audienceEstimate, isLoading: isEstimating } = useQuery<{
    total: number;
    samples: Array<{ name: string; email: string }>;
    stats?: {
      totalContactsInDb: number;
      contactsWithEmailCount: number;
    };
  }>({
    queryKey: [
      "/api/email/audience-estimate",
      audienceType,
      selectedGroupId,
      selectedContactIds.join(","),
      parsedManualEmails.join(","),
    ],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        params.set("audienceType", audienceType);
        if (audienceType === "group" && selectedGroupId) params.set("groupId", selectedGroupId);
        if (audienceType === "specific" && selectedContactIds.length > 0) params.set("contactIds", selectedContactIds.join(","));
        if (audienceType === "manual" && parsedManualEmails.length > 0) params.set("manualEmails", parsedManualEmails.join(","));

        const res = await apiRequest("GET", `/api/email/audience-estimate?${params.toString()}`);
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch {
          return null;
        }
      } catch {
        return null;
      }
    },
  });

  const totalContactsInDb =
    audienceEstimate?.stats?.totalContactsInDb ??
    (crmContactsResponse?.pagination?.total || crmContactsList.length);

  const contactsWithEmailCount =
    audienceEstimate?.stats?.contactsWithEmailCount ??
    crmContactsList.filter((c: any) => c.email && c.email.trim() && c.email.includes("@")).length;

  const computedClientTotal = useMemo(() => {
    if (audienceType === "all") {
      return contactsWithEmailCount;
    }
    if (audienceType === "specific") {
      return availableContacts.filter((c) => selectedContactIds.includes(c.id) && c.email && c.email.includes("@")).length;
    }
    if (audienceType === "manual") {
      return parsedManualEmails.length;
    }
    if (audienceType === "group" && selectedGroupId) {
      return crmContactsList.filter((c: any) => {
        const hasGroup = Array.isArray(c.groups) && c.groups.includes(selectedGroupId);
        return hasGroup && c.email && c.email.includes("@");
      }).length;
    }
    return 0;
  }, [audienceType, contactsWithEmailCount, availableContacts, selectedContactIds, parsedManualEmails, selectedGroupId, crmContactsList]);

  const estimatedTotal =
    typeof audienceEstimate?.total === "number" && !isNaN(audienceEstimate.total)
      ? audienceEstimate.total
      : computedClientTotal;

  const sampleRecipients = audienceEstimate?.samples || [];

  const [testEmailStatus, setTestEmailStatus] = useState<{
    success?: boolean;
    error?: string;
    message?: string;
  } | null>(null);

  // Fetch active provider to display engine info
  const { data: activeEmailProvider } = useQuery<{
    providerType?: string;
    defaultFromEmail?: string;
    label?: string;
  } | null>({
    queryKey: ["/api/email/providers/active"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/email/providers/active");
        return res.json();
      } catch {
        return null;
      }
    },
  });

  // Send test email
  const handleSendTestEmail = async () => {
    if (!testEmailAddress || !testEmailAddress.includes("@")) {
      toast({ title: "Please enter a valid test email address", variant: "destructive" });
      return;
    }
    setIsSendingTest(true);
    setTestEmailStatus(null);
    try {
      const res = await apiRequest("POST", "/api/email/campaigns/test", {
        recipientEmail: testEmailAddress.trim(),
        subject: subject || "Test Email Preview",
        htmlContent,
        fromName: fromName || "ADping",
        fromEmail: fromEmail,
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        // Returned HTML (e.g. server needs restart)
        throw new Error(
          "Your backend server needs a restart to load the latest email delivery routes. Please restart 'npm run dev' in your terminal."
        );
      }

      if (!res.ok || data.error) {
        throw new Error(data.detail || data.error || "Failed to deliver test email");
      }

      setTestEmailStatus({ success: true, message: `Delivered test email to ${testEmailAddress.trim()}` });
      toast({ title: "Test email sent!", description: `Check inbox for ${testEmailAddress}` });
    } catch (err: any) {
      setTestEmailStatus({ success: false, error: err.message });
      toast({ title: "Test email failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Create Campaign Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      // Build audience parameters based on selected mode
      let audienceParams: Record<string, any> = {};
      if (audienceType === "specific") {
        audienceParams = { contactIds: selectedContactIds };
      } else if (audienceType === "manual") {
        audienceParams = { manualEmails: parsedManualEmails };
      } else if (audienceType === "group") {
        audienceParams = { groupId: selectedGroupId };
      }

      const payload = {
        name: campaignName,
        subject,
        previewText,
        htmlContent,
        emailSenderId: selectedSenderId !== "default" ? selectedSenderId : undefined,
        fromNameOverride: fromName || undefined,
        fromEmailOverride: fromEmail || undefined,
        replyTo: replyTo || undefined,
        audienceType,
        audienceParams,
        scheduledAt: sendOption === "later" && scheduledDateTime ? new Date(scheduledDateTime).toISOString() : undefined,
      };

      const res = await apiRequest("POST", "/api/email/campaigns", payload);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || err.error || "Failed to create campaign");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: sendOption === "later" ? "Campaign scheduled!" : "Campaign launched!",
        description: `Delivering to ${estimatedTotal} recipient${estimatedTotal === 1 ? "" : "s"}.`,
      });
      setLocation("/email-campaigns");
    },
    onError: (err: any) => {
      toast({ title: "Failed to launch campaign", description: err.message, variant: "destructive" });
    },
  });

  const handleNext = () => {
    if (currentStep === 1) {
      if (!campaignName.trim()) {
        toast({ title: "Campaign name is required", variant: "destructive" });
        return;
      }
      if (!subject.trim()) {
        toast({ title: "Subject line is required", variant: "destructive" });
        return;
      }
    }
    if (currentStep === 2) {
      if (audienceType === "specific" && selectedContactIds.length === 0) {
        toast({ title: "Please select at least one contact", variant: "destructive" });
        return;
      }
      if (audienceType === "manual" && parsedManualEmails.length === 0) {
        toast({ title: "Please enter at least one valid email address", variant: "destructive" });
        return;
      }
      if (audienceType === "group" && !selectedGroupId) {
        toast({ title: "Please select a contact group", variant: "destructive" });
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleSenderChange = (senderId: string) => {
    setSelectedSenderId(senderId);
    if (senderId !== "default") {
      const s = senders.find((item) => item.id === senderId);
      if (s) {
        setFromName(s.fromName || "");
        setFromEmail(s.fromEmail || "");
        setReplyTo(s.replyTo || "");
      }
    }
  };

  const handleSelectTemplate = (tmpl: EmailTemplateDefinition, idx: number) => {
    setSelectedTemplateIndex(idx);
    setHtmlContent(tmpl.htmlContent);
    setTemplateFields(extractTemplateFields(tmpl.htmlContent, tmpl.defaultFields));
    if (!subject) setSubject(tmpl.subject);
    if (!previewText) setPreviewText(tmpl.previewText);
    toast({ title: `Applied "${tmpl.name}" template` });
  };

  const handleFieldChange = (key: keyof TemplateCustomFields, value: string) => {
    setTemplateFields((prev) => ({ ...prev, [key]: value }));
    setHtmlContent((currentHtml) => applyTemplateFields(currentHtml, { [key]: value }));
  };

  const handleEditorTabChange = (tab: "visual" | "code") => {
    if (tab === "visual") {
      setTemplateFields((prev) => extractTemplateFields(htmlContent, prev));
    }
    setEditorTab(tab);
  };

  const availableCategories = useMemo(() => {
    const cats = Array.from(new Set(SYSTEM_TEMPLATES.map((t) => t.category)));
    return ["all", ...cats];
  }, []);

  const filteredTemplates = useMemo(() => {
    if (templateCategoryFilter === "all") return SYSTEM_TEMPLATES;
    return SYSTEM_TEMPLATES.filter((t) => t.category === templateCategoryFilter);
  }, [templateCategoryFilter]);

  const toggleContactSelection = (id: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Preview replacement for live iframe view
  const previewHtml = useMemo(() => {
    let replaced = htmlContent;
    replaced = replaced.replace(/\{\{\s*firstName\s*\}\}/g, "Alex");
    replaced = replaced.replace(/\{\{\s*name\s*\}\}/g, "Alex Johnson");
    replaced = replaced.replace(/\{\{\s*email\s*\}\}/g, "alex@example.com");
    replaced = replaced.replace(/\{\{\s*orderId\s*\}\}/g, "ADP-8492");
    replaced = replaced.replace(/\{\{\s*(?:unsubscribe_url|unsubscribeUrl)\s*\}\}/g, "#unsubscribe");
    return replaced;
  }, [htmlContent]);

  const steps = [
    { id: 1, title: "Setup", desc: "Name & Sender", icon: Mail },
    { id: 2, title: "Audience", desc: "Recipients & Targets", icon: Users },
    { id: 3, title: "Design", desc: "Professional Templates", icon: Palette },
    { id: 4, title: "Review & Send", desc: "Verify & Launch", icon: Send },
  ];

  return (
    <div className="flex-1 min-h-screen bg-slate-50/50 dark:bg-background flex flex-col">
      <Header
        title="Create Email Campaign"
        subtitle="Design and launch a high-converting email broadcast in 4 simple steps."
      />

      <main className="p-4 sm:p-6 max-w-6xl mx-auto w-full flex-1 space-y-6">
        {/* Wizard Steps Header */}
        <div className="bg-white dark:bg-card border border-border/80 rounded-2xl p-4 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {steps.map((step) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <div
                  key={step.id}
                  onClick={() => isCompleted && setCurrentStep(step.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                    isCompleted ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-muted/40" : ""
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-xs transition-colors ${
                      isCompleted
                        ? "bg-emerald-600 text-white"
                        : isCurrent
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-2 border-emerald-600"
                        : "bg-slate-100 text-slate-500 dark:bg-muted"
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : step.id}
                  </div>
                  <div className="hidden sm:block">
                    <div className={`text-xs font-bold ${isCurrent ? "text-emerald-700 dark:text-emerald-400" : "text-slate-800 dark:text-slate-200"}`}>
                      {step.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            STEP 1: Campaign Setup & Sender Identity
        ════════════════════════════════════════════════════════════════ */}
        {currentStep === 1 && (
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-emerald-600" />
                Step 1: Campaign Setup & Sender Identity
              </CardTitle>
              <CardDescription>
                Configure subject line and sender identity for inbox display.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="campaignName" className="font-semibold text-xs uppercase tracking-wider">
                  Campaign Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="campaignName"
                  placeholder="e.g. September Product Launch / Flash Sale"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">Internal name only — not visible to recipients.</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="subject" className="font-semibold text-xs uppercase tracking-wider">
                    Email Subject Line <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setSubject((s) => s + " {{firstName}}")}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-muted px-2 py-0.5 rounded text-emerald-600 font-mono"
                    >
                      + firstName
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubject((s) => s + " ⚡")}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-muted px-1.5 py-0.5 rounded"
                    >
                      ⚡
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubject((s) => s + " 🎉")}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-muted px-1.5 py-0.5 rounded"
                    >
                      🎉
                    </button>
                  </div>
                </div>
                <Input
                  id="subject"
                  placeholder="e.g. ⚡ Special Announcement for {{firstName}}"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="previewText" className="font-semibold text-xs uppercase tracking-wider">
                  Preheader / Preview Text (Optional)
                </Label>
                <Input
                  id="previewText"
                  placeholder="e.g. Open this email to see our exclusive offer inside..."
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">The snippet displayed next to your subject in the customer's inbox.</p>
              </div>

              {/* Sender Identity Card */}
              <div className="border border-border/80 rounded-xl p-4 space-y-4 bg-slate-50/50 dark:bg-muted/20">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold text-xs uppercase tracking-wider">Sender Identity</Label>
                  <span className="text-xs text-emerald-600 font-medium">Verified Delivery</span>
                </div>

                {senders.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="senderSelect" className="text-xs">Select Configured Sender Profile</Label>
                    <Select value={selectedSenderId} onValueChange={handleSenderChange}>
                      <SelectTrigger id="senderSelect">
                        <SelectValue placeholder="Choose a sender identity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default Platform Sender</SelectItem>
                        {senders.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.fromName} &lt;{s.fromEmail}&gt;
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromName" className="text-xs">From Name</Label>
                    <Input
                      id="fromName"
                      placeholder="e.g. Alex from ADping"
                      value={fromName}
                      onChange={(e) => setFromName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fromEmail" className="text-xs">From Email Address</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      placeholder="e.g. updates@yourbrand.com"
                      value={fromEmail}
                      onChange={(e) => setFromEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="replyTo" className="text-xs">Reply-To Address (Optional)</Label>
                  <Input
                    id="replyTo"
                    type="email"
                    placeholder="e.g. support@yourbrand.com"
                    value={replyTo}
                    onChange={(e) => setReplyTo(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">Where customer replies will be routed.</p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between border-t p-4">
              <Button variant="outline" onClick={() => setLocation("/email-campaigns")}>
                Cancel
              </Button>
              <Button onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                Continue to Audience
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 2: Choose Audience & Recipients
        ════════════════════════════════════════════════════════════════ */}
        {currentStep === 2 && (
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" />
                Step 2: Choose Audience & Target Recipients
              </CardTitle>
              <CardDescription>
                Send to all contacts, pick specific contacts, select a group, or paste direct emails.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <RadioGroup value={audienceType} onValueChange={(val: any) => setAudienceType(val)} className="space-y-3">
                
                {/* Option 1: All Contacts */}
                <div
                  className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                    audienceType === "all" ? "border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-sm" : "hover:bg-slate-50 dark:hover:bg-muted/40"
                  }`}
                  onClick={() => setAudienceType("all")}
                >
                  <RadioGroupItem value="all" id="aud-all" className="mt-1" />
                  <div className="space-y-1 flex-1">
                    <Label htmlFor="aud-all" className="font-semibold text-sm cursor-pointer">
                      All Contacts with Email Address
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically broadcasts to all your CRM contacts who have an email address.
                    </p>
                    {contactsWithEmailCount === 0 && totalContactsInDb > 0 && (
                      <div className="mt-2.5 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-2">
                        <div className="font-semibold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                          Found {totalContactsInDb} WhatsApp contacts, but none have an email address attached yet.
                        </div>
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                          WhatsApp contacts only include phone numbers by default. You can add email addresses directly to any contact with 1 click, or paste direct emails.
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            type="button"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAudienceType("specific");
                            }}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <UserCheck className="h-3.5 w-3.5 mr-1" />
                            Open Contacts List & Add Emails
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAudienceType("manual");
                            }}
                            className="h-7 text-xs border-amber-300 text-amber-900 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                          >
                            Paste Direct Emails
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Option 2: Send to Specific Contacts */}
                <div
                  className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                    audienceType === "specific" ? "border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-sm" : "hover:bg-slate-50 dark:hover:bg-muted/40"
                  }`}
                  onClick={() => setAudienceType("specific")}
                >
                  <RadioGroupItem value="specific" id="aud-specific" className="mt-1" />
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="aud-specific" className="font-semibold text-sm cursor-pointer flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-emerald-600" />
                        Specific Contacts
                      </Label>
                      {selectedContactIds.length > 0 && (
                        <Badge className="bg-emerald-600 text-white text-[11px]">
                          {selectedContactIds.length} Selected
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Search and choose specific contact(s) to receive this email broadcast. Add an email address to any contact on the fly.
                    </p>

                    {audienceType === "specific" && (
                      <div className="pt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                          <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                          <Input
                            placeholder="Search by name, phone, or email..."
                            value={contactSearchQuery}
                            onChange={(e) => setContactSearchQuery(e.target.value)}
                            className="pl-9 h-9 text-xs"
                          />
                        </div>

                        {/* Contacts List Box */}
                        <div className="border rounded-xl max-h-72 overflow-y-auto bg-white dark:bg-card p-2 space-y-1 divide-y divide-border/40">
                          {isSearchingContacts ? (
                            <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Searching contacts...
                            </div>
                          ) : availableContacts.length === 0 ? (
                            <div className="p-4 text-center text-xs text-muted-foreground">
                              No contacts found matching "{contactSearchQuery}".
                            </div>
                          ) : (
                            availableContacts.map((c) => {
                              const isSelected = selectedContactIds.includes(c.id);
                              const isEditingThis = editingContactId === c.id;

                              return (
                                <div
                                  key={c.id}
                                  onClick={() => {
                                    if (!isEditingThis) {
                                      if (!c.email) {
                                        setEditingContactId(c.id);
                                        setInlineEmailInput("");
                                      } else {
                                        toggleContactSelection(c.id);
                                      }
                                    }
                                  }}
                                  className={`p-2.5 rounded-lg cursor-pointer transition-colors ${
                                    isSelected
                                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200"
                                      : "hover:bg-slate-50 dark:hover:bg-muted/40"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        disabled={!c.email && !isEditingThis}
                                        onChange={() => {
                                          if (c.email) {
                                            toggleContactSelection(c.id);
                                          } else {
                                            setEditingContactId(c.id);
                                            setInlineEmailInput("");
                                          }
                                        }}
                                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer disabled:opacity-40"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                                            {c.name}
                                          </span>
                                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-slate-500">
                                            Contact
                                          </Badge>
                                        </div>

                                        {/* Email / Phone info or Inline Editor */}
                                        {!isEditingThis ? (
                                          <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5 flex-wrap">
                                            {c.email ? (
                                              <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                                {c.email}
                                                {c.type === "contact" && (
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setEditingContactId(c.id);
                                                      setInlineEmailInput(c.email || "");
                                                    }}
                                                    className="text-muted-foreground hover:text-emerald-600 p-0.5 ml-1"
                                                    title="Edit email"
                                                  >
                                                    <Edit2 className="h-3 w-3" />
                                                  </button>
                                                )}
                                              </span>
                                            ) : (
                                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                                (No email address on file)
                                              </span>
                                            )}
                                            {c.phone && <span className="text-[10px] opacity-75">• {c.phone}</span>}
                                          </div>
                                        ) : (
                                          <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            <Input
                                              type="email"
                                              placeholder="Enter email e.g. name@domain.com"
                                              value={inlineEmailInput}
                                              onChange={(e) => setInlineEmailInput(e.target.value)}
                                              onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                  e.preventDefault();
                                                  handleSaveInlineEmail(c.id);
                                                }
                                              }}
                                              autoFocus
                                              className="h-8 text-xs max-w-xs"
                                            />
                                            <Button
                                              size="sm"
                                              type="button"
                                              disabled={isSavingEmail}
                                              onClick={() => handleSaveInlineEmail(c.id)}
                                              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3"
                                            >
                                              {isSavingEmail ? (
                                                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                                              ) : (
                                                <Check className="h-3 w-3 mr-1" />
                                              )}
                                              Save
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              type="button"
                                              disabled={isSavingEmail}
                                              onClick={() => {
                                                setEditingContactId(null);
                                                setInlineEmailInput("");
                                              }}
                                              className="h-8 text-xs px-2 text-muted-foreground"
                                            >
                                              Cancel
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Right Action: Add Email Button or Group Badge */}
                                    {!isEditingThis && !c.email && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingContactId(c.id);
                                          setInlineEmailInput("");
                                        }}
                                        className="h-7 text-[11px] border-dashed border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 shrink-0 ml-2"
                                      >
                                        + Add Email
                                      </Button>
                                    )}

                                    {!isEditingThis && c.email && c.groups && c.groups.length > 0 && (
                                      <Badge variant="secondary" className="text-[10px] font-normal shrink-0 ml-2">
                                        {c.groups[0]}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Option 3: Direct Email Addresses / Paste Emails */}
                <div
                  className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                    audienceType === "manual" ? "border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-sm" : "hover:bg-slate-50 dark:hover:bg-muted/40"
                  }`}
                  onClick={() => setAudienceType("manual")}
                >
                  <RadioGroupItem value="manual" id="aud-manual" className="mt-1" />
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="aud-manual" className="font-semibold text-sm cursor-pointer">
                        Direct Email Addresses (Paste or Type)
                      </Label>
                      {parsedManualEmails.length > 0 && (
                        <Badge className="bg-emerald-600 text-white text-[11px]">
                          {parsedManualEmails.length} Email{parsedManualEmails.length === 1 ? "" : "s"} Ready
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Paste a list of emails (comma, space, or newline separated) or type a single client email.
                    </p>

                    {audienceType === "manual" && (
                      <div className="pt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
                        <Textarea
                          placeholder="e.g. client@example.com, john@acme.org, sarah@startup.io&#10;Or paste one email per line..."
                          rows={4}
                          value={manualEmailsText}
                          onChange={(e) => setManualEmailsText(e.target.value)}
                          className="text-xs font-mono"
                        />
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Separate with commas or newlines.</span>
                          <span><strong>{parsedManualEmails.length}</strong> valid addresses detected</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Option 4: Contact Group / Segment */}
                <div
                  className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                    audienceType === "group" ? "border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-sm" : "hover:bg-slate-50 dark:hover:bg-muted/40"
                  }`}
                  onClick={() => setAudienceType("group")}
                >
                  <RadioGroupItem value="group" id="aud-group" className="mt-1" />
                  <div className="space-y-1 flex-1">
                    <Label htmlFor="aud-group" className="font-semibold text-sm cursor-pointer">
                      Target Specific Contact Group / Tag
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Only send to contacts associated with a specific customer segment.
                    </p>

                    {audienceType === "group" && (
                      <div className="pt-3" onClick={(e) => e.stopPropagation()}>
                        {contactGroups.length === 0 ? (
                          <div className="text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-900">
                            No contact groups created yet. You can create groups under Contacts Management or select specific contacts above.
                          </div>
                        ) : (
                          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                            <SelectTrigger className="w-full sm:w-72">
                              <SelectValue placeholder="Choose contact group..." />
                            </SelectTrigger>
                            <SelectContent>
                              {contactGroups.map((grp) => (
                                <SelectItem key={grp.id || grp.name} value={grp.id || grp.name}>
                                  {grp.name} {grp.contact_count !== undefined ? `(${grp.contact_count})` : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </RadioGroup>

              {/* Real-Time Audience Calculation Card */}
              <div className="bg-slate-50 dark:bg-muted/40 border rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        Validated Reachable Audience
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isEstimating ? "Calculating recipients..." : "Recipients with confirmed email delivery format"}
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-emerald-600">
                    {estimatedTotal.toLocaleString()}{" "}
                    <span className="text-xs font-normal text-muted-foreground">recipient{estimatedTotal === 1 ? "" : "s"}</span>
                  </div>
                </div>

                {/* Sample Recipients Chips */}
                {sampleRecipients.length > 0 && (
                  <div className="pt-2 border-t border-border/60 flex items-center gap-2 flex-wrap text-xs">
                    <span className="text-muted-foreground font-medium">Recipients Sample:</span>
                    {sampleRecipients.map((s, idx) => (
                      <Badge key={idx} variant="secondary" className="text-[11px] font-normal">
                        {s.name ? `${s.name} (${s.email})` : s.email}
                      </Badge>
                    ))}
                    {estimatedTotal > sampleRecipients.length && (
                      <span className="text-muted-foreground text-[11px]">
                        +{estimatedTotal - sampleRecipients.length} more
                      </span>
                    )}
                  </div>
                )}

                {estimatedTotal === 0 && !isEstimating && (
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                      <span>
                        {totalContactsInDb > 0
                          ? `0 reachable email recipients. Your ${totalContactsInDb} WhatsApp contacts need an email address attached.`
                          : `0 reachable recipients found. You can paste direct emails or add emails to contacts.`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setAudienceType("specific")}
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <UserCheck className="h-3.5 w-3.5 mr-1" />
                        Add Emails to Contacts
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setAudienceType("manual")}
                        className="h-7 text-xs border-amber-300 text-amber-900 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                      >
                        Paste Email List
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex justify-between border-t p-4">
              <Button variant="outline" onClick={() => setCurrentStep(1)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                Continue to Content Design
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 3: Professional Templates & Content Design
        ════════════════════════════════════════════════════════════════ */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Visual Template Gallery Picker */}
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="p-4 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-600" />
                      Brevo-Grade Responsive Email Templates
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Pick any responsive template to instantly apply to your campaign.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-emerald-700 border-emerald-300 w-fit">
                    {SYSTEM_TEMPLATES.length} Ready-to-Send Templates
                  </Badge>
                </div>

                {/* Category Filter Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-2">
                  {availableCategories.map((cat) => {
                    const isAll = cat === "all";
                    const count = isAll ? SYSTEM_TEMPLATES.length : SYSTEM_TEMPLATES.filter((t) => t.category === cat).length;
                    const isSelected = templateCategoryFilter === cat;
                    const catLabels: Record<string, string> = {
                      all: "All Templates",
                      "Welcome & Onboarding": "🎉 Welcome & Onboarding",
                      "Promotions & Sales": "🏷️ Promotions & Sales",
                      "Newsletters": "📰 Newsletters",
                      "Product Updates": "🚀 Product Updates",
                      "Events & Webinars": "🎙️ Events & Webinars",
                      "Transactional & Security": "🛡️ Transactional & Security",
                    };
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setTemplateCategoryFilter(cat)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-emerald-600 text-white shadow-sm font-semibold ring-1 ring-emerald-700"
                            : "bg-slate-100 hover:bg-slate-200 dark:bg-muted text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <span>{catLabels[cat] || cat}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                            isSelected
                              ? "bg-emerald-700/90 text-white font-bold"
                              : "bg-slate-200 dark:bg-muted/80 text-muted-foreground font-semibold"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {filteredTemplates.map((tmpl) => {
                    const globalIdx = SYSTEM_TEMPLATES.findIndex((t) => t.name === tmpl.name);
                    const isSelected = selectedTemplateIndex === globalIdx;
                    return (
                      <div
                        key={tmpl.name}
                        onClick={() => handleSelectTemplate(tmpl, globalIdx)}
                        className={`border rounded-xl p-3 cursor-pointer transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/30 ring-2 ring-emerald-600/20 shadow-sm"
                            : "hover:border-slate-300 dark:hover:border-muted hover:shadow-sm bg-white dark:bg-card"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className="w-3.5 h-3.5 rounded-full inline-block"
                              style={{ backgroundColor: tmpl.thumbnailColor }}
                            />
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 truncate max-w-[90px]">
                              {tmpl.category}
                            </Badge>
                          </div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white leading-snug">
                            {tmpl.name}
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">
                            {tmpl.description}
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                          {isSelected ? (
                            <>
                              <Check className="h-3 w-3" /> Active Template
                            </>
                          ) : (
                            "Apply Template"
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Editor & Side-by-side Preview Canvas */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Visual Form / Code Editor */}
              <div className="lg:col-span-6 space-y-4">
                <Card className="border-border/80 shadow-sm">
                  <CardHeader className="p-4 pb-3 border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-emerald-600" />
                          Customize Email Content
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {editorTab === "visual"
                            ? "Edit texts, headlines, CTA button, and links visually."
                            : "Edit raw HTML & CSS code directly."}
                        </CardDescription>
                      </div>

                      {/* Mode Switcher Tabs */}
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-muted p-1 rounded-lg border">
                        <button
                          type="button"
                          onClick={() => handleEditorTabChange("visual")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            editorTab === "visual"
                              ? "bg-white dark:bg-card text-emerald-700 dark:text-emerald-400 shadow-sm font-semibold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                          Visual Form
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditorTabChange("code")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            editorTab === "code"
                              ? "bg-white dark:bg-card text-emerald-700 dark:text-emerald-400 shadow-sm font-semibold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Code className="h-3.5 w-3.5" />
                          HTML Code
                        </button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-4">
                    {editorTab === "visual" ? (
                      <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">
                        {/* Active Template Status Bar */}
                        <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 rounded-lg p-2.5 text-xs flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: SYSTEM_TEMPLATES[selectedTemplateIndex]?.thumbnailColor || "#2563EB" }}
                            />
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {SYSTEM_TEMPLATES[selectedTemplateIndex]?.name || "Template"}
                            </span>
                          </div>
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium shrink-0 ml-2">
                            ⚡ Real-time live sync
                          </span>
                        </div>

                        {/* Field 1: Top Badge */}
                        <div className="space-y-1.5">
                          <Label htmlFor="field-badge" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Top Badge / Header Tag
                          </Label>
                          <Input
                            id="field-badge"
                            value={templateFields.badge || ""}
                            onChange={(e) => handleFieldChange("badge", e.target.value)}
                            placeholder="e.g. 💳 VIRTUAL DOLLAR CARD"
                            className="h-9 text-xs"
                          />
                          <p className="text-[10px] text-muted-foreground">The small colored pill tag at the top of the email.</p>
                        </div>

                        {/* Field 2: Headline */}
                        <div className="space-y-1.5">
                          <Label htmlFor="field-headline" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Main Headline (H1)
                          </Label>
                          <Input
                            id="field-headline"
                            value={templateFields.headline || ""}
                            onChange={(e) => handleFieldChange("headline", e.target.value)}
                            placeholder="e.g. Welcome to {{companyName}} — Let's Get Started"
                            className="h-9 text-xs font-semibold"
                          />
                        </div>

                        {/* Field 3: Greeting */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="field-greeting" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              Greeting / Salutation
                            </Label>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-muted-foreground">Insert:</span>
                              <button
                                type="button"
                                onClick={() => handleFieldChange("greeting", (templateFields.greeting || "") + " {{firstName}}")}
                                className="text-[10px] font-mono bg-slate-100 hover:bg-slate-200 dark:bg-muted px-1.5 py-0.5 rounded text-emerald-600 font-medium"
                              >
                                + {"{{firstName}}"}
                              </button>
                            </div>
                          </div>
                          <Input
                            id="field-greeting"
                            value={templateFields.greeting || ""}
                            onChange={(e) => handleFieldChange("greeting", e.target.value)}
                            placeholder="e.g. Hi {{firstName}},"
                            className="h-9 text-xs"
                          />
                        </div>

                        {/* Field 4: Main Email Body */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="field-body" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              Email Body Message
                            </Label>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-muted-foreground">Insert:</span>
                              <button
                                type="button"
                                onClick={() => handleFieldChange("bodyText", (templateFields.bodyText || "") + " {{firstName}}")}
                                className="text-[10px] font-mono bg-slate-100 hover:bg-slate-200 dark:bg-muted px-1.5 py-0.5 rounded text-emerald-600 font-medium"
                              >
                                + firstName
                              </button>
                              <button
                                type="button"
                                onClick={() => handleFieldChange("bodyText", (templateFields.bodyText || "") + " {{name}}")}
                                className="text-[10px] font-mono bg-slate-100 hover:bg-slate-200 dark:bg-muted px-1.5 py-0.5 rounded text-emerald-600 font-medium"
                              >
                                + name
                              </button>
                              <button
                                type="button"
                                onClick={() => handleFieldChange("bodyText", (templateFields.bodyText || "") + " {{email}}")}
                                className="text-[10px] font-mono bg-slate-100 hover:bg-slate-200 dark:bg-muted px-1.5 py-0.5 rounded text-emerald-600 font-medium"
                              >
                                + email
                              </button>
                            </div>
                          </div>
                          <Textarea
                            id="field-body"
                            rows={6}
                            value={templateFields.bodyText || ""}
                            onChange={(e) => handleFieldChange("bodyText", e.target.value)}
                            placeholder="Write your email announcement or newsletter message here..."
                            className="text-xs leading-relaxed"
                          />
                          <p className="text-[10px] text-muted-foreground">Supports personalization tokens like {"{{firstName}}"} and multiline paragraphs.</p>
                        </div>

                        {/* Field 5: Feature / Callout Box */}
                        <div className="p-3.5 border rounded-xl bg-slate-50/70 dark:bg-muted/30 space-y-3">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                            Feature Highlight / Perks Box
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="field-callout-title" className="text-[11px] text-muted-foreground font-medium">
                              Callout Title
                            </Label>
                            <Input
                              id="field-callout-title"
                              value={templateFields.calloutTitle || ""}
                              onChange={(e) => handleFieldChange("calloutTitle", e.target.value)}
                              placeholder="e.g. ✨ Why You'll Love This:"
                              className="h-8 text-xs bg-white dark:bg-background"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="field-callout-text" className="text-[11px] text-muted-foreground font-medium">
                              Callout Details / List Items
                            </Label>
                            <Textarea
                              id="field-callout-text"
                              rows={3}
                              value={templateFields.calloutText || ""}
                              onChange={(e) => handleFieldChange("calloutText", e.target.value)}
                              placeholder="List key benefits, instructions, or features..."
                              className="text-xs leading-relaxed bg-white dark:bg-background"
                            />
                          </div>
                        </div>

                        {/* Field 6: Primary Call to Action Button */}
                        <div className="p-3.5 border rounded-xl bg-slate-50/70 dark:bg-muted/30 space-y-3">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                            <Link2 className="h-3.5 w-3.5 text-blue-600" />
                            Primary Call-to-Action Button (CTA)
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="field-btn-text" className="text-[11px] text-muted-foreground font-medium">
                                Button Label Text
                              </Label>
                              <Input
                                id="field-btn-text"
                                value={templateFields.buttonText || ""}
                                onChange={(e) => handleFieldChange("buttonText", e.target.value)}
                                placeholder="e.g. Get Started Now →"
                                className="h-8 text-xs bg-white dark:bg-background font-medium"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="field-btn-url" className="text-[11px] text-muted-foreground font-medium">
                                Destination URL
                              </Label>
                              <Input
                                id="field-btn-url"
                                value={templateFields.buttonUrl || ""}
                                onChange={(e) => handleFieldChange("buttonUrl", e.target.value)}
                                placeholder="e.g. https://example.com/get-started"
                                className="h-8 text-xs bg-white dark:bg-background"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Field 7: Footer Notice */}
                        <div className="space-y-1.5">
                          <Label htmlFor="field-footer" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Footer Brand & Compliance Notice
                          </Label>
                          <Input
                            id="field-footer"
                            value={templateFields.footerText || ""}
                            onChange={(e) => handleFieldChange("footerText", e.target.value)}
                            placeholder="e.g. Sent with ❤️ by {{companyName}} • 123 Business Way"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Quick Variable Insertion:</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setHtmlContent((h) => h + "{{firstName}}")}
                              className="bg-slate-100 hover:bg-slate-200 dark:bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono text-emerald-600"
                            >
                              firstName
                            </button>
                            <button
                              type="button"
                              onClick={() => setHtmlContent((h) => h + "{{name}}")}
                              className="bg-slate-100 hover:bg-slate-200 dark:bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono text-emerald-600"
                            >
                              name
                            </button>
                            <button
                              type="button"
                              onClick={() => setHtmlContent((h) => h + "{{email}}")}
                              className="bg-slate-100 hover:bg-slate-200 dark:bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono text-emerald-600"
                            >
                              email
                            </button>
                            <button
                              type="button"
                              onClick={() => setHtmlContent((h) => h + "{{unsubscribe_url}}")}
                              className="bg-slate-100 hover:bg-slate-200 dark:bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono text-emerald-600"
                            >
                              unsub
                            </button>
                          </div>
                        </div>

                        <Textarea
                          id="htmlCode"
                          rows={22}
                          value={htmlContent}
                          onChange={(e) => setHtmlContent(e.target.value)}
                          className="font-mono text-xs leading-relaxed"
                        />

                        <div className="bg-slate-50 dark:bg-muted/40 p-3 rounded-lg border text-xs text-muted-foreground flex items-center justify-between">
                          <span>Supported Variables:</span>
                          <span className="font-mono text-slate-800 dark:text-slate-200 text-[11px]">
                            {"{{firstName}}"}, {"{{name}}"}, {"{{email}}"}, {"{{unsubscribe_url}}"}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="flex justify-between border-t p-4">
                    <Button variant="outline" onClick={() => setCurrentStep(2)} className="gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Back to Audience
                    </Button>
                    <Button onClick={() => setCurrentStep(4)} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                      Review & Schedule
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              {/* Right Column: Live Interactive Preview */}
              <div className="lg:col-span-6">
                <Card className="border-border/80 shadow-sm sticky top-24">
                  <CardHeader className="p-3 border-b bg-slate-50 dark:bg-muted/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <Eye className="h-4 w-4 text-emerald-600" />
                        Live Responsive Inbox Preview
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant={previewDevice === "desktop" ? "secondary" : "ghost"}
                          size="sm"
                          className="h-7 px-2.5 text-xs"
                          onClick={() => setPreviewDevice("desktop")}
                        >
                          <Monitor className="h-3.5 w-3.5 mr-1" />
                          Desktop
                        </Button>
                        <Button
                          variant={previewDevice === "mobile" ? "secondary" : "ghost"}
                          size="sm"
                          className="h-7 px-2.5 text-xs"
                          onClick={() => setPreviewDevice("mobile")}
                        >
                          <Smartphone className="h-3.5 w-3.5 mr-1" />
                          Mobile
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    {/* Mock Inbox Header */}
                    <div className="bg-slate-100 dark:bg-muted p-2.5 rounded-t-lg border-b text-xs space-y-1">
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">From: </span>
                        <span className="text-muted-foreground">{fromName || "ADping"} &lt;{fromEmail || "noreply@adping.com"}&gt;</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Subject: </span>
                        <span className="text-slate-900 dark:text-white font-medium">{subject || "No subject"}</span>
                      </div>
                      {previewText && (
                        <div className="text-[11px] text-muted-foreground italic truncate">
                          {previewText}
                        </div>
                      )}
                    </div>

                    {/* HTML Render Canvas */}
                    <div
                      className={`border border-t-0 rounded-b-lg overflow-y-auto bg-white transition-all mx-auto ${
                        previewDevice === "mobile" ? "max-w-[340px] h-[580px]" : "w-full h-[580px]"
                      }`}
                    >
                      <iframe
                        title="Email Preview"
                        srcDoc={previewHtml}
                        className="w-full h-full border-0 pointer-events-none"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 4: Review & Send / Schedule
        ════════════════════════════════════════════════════════════════ */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Step 4: Campaign Review & Delivery Schedule
                </CardTitle>
                <CardDescription>
                  Review campaign parameters, verify inbox delivery with a test email, and confirm launch.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Ready Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border bg-card space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 dark:text-white">
                      <Check className="h-4 w-4 text-emerald-600" />
                      Sender & Subject Line
                    </div>
                    <div className="text-xs text-muted-foreground pl-6 space-y-1">
                      <div><strong>Subject:</strong> {subject}</div>
                      <div><strong>Sender:</strong> {fromName || "ADping"} ({fromEmail || "Platform default"})</div>
                      {replyTo && <div><strong>Reply-To:</strong> {replyTo}</div>}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border bg-card space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 dark:text-white">
                      <Check className="h-4 w-4 text-emerald-600" />
                      Target Audience
                    </div>
                    <div className="text-xs text-muted-foreground pl-6 space-y-1">
                      <div>
                        <strong>Mode:</strong>{" "}
                        {audienceType === "all"
                          ? "All Contacts with Email"
                          : audienceType === "specific"
                          ? `Specific Contacts (${selectedContactIds.length} contacts)`
                          : audienceType === "manual"
                          ? `Direct Email List (${parsedManualEmails.length} addresses)`
                          : "Group Segment"}
                      </div>
                      <div><strong>Total Recipients:</strong> {estimatedTotal.toLocaleString()} email addresses</div>
                    </div>
                  </div>
                </div>

                {/* Send Test Email Section */}
                <div className="border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 font-semibold text-sm text-emerald-800 dark:text-emerald-300">
                      <Send className="h-4 w-4 text-emerald-600" />
                      Send a Live Inbox Test Email
                    </div>
                    {activeEmailProvider ? (
                      <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700 bg-emerald-100/50 font-normal">
                        Engine: {activeEmailProvider.label || activeEmailProvider.providerType?.toUpperCase() || "Active Provider"}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 bg-amber-100/50 font-normal">
                        Engine: Default SMTP (.env)
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Send a test copy directly to your inbox to review formatting, images, and links before broadcasting to customers.
                  </p>
                  <div className="flex gap-2 max-w-md">
                    <Input
                      type="email"
                      placeholder="your-email@domain.com"
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                      className="bg-white dark:bg-card h-9 text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSendTestEmail}
                      disabled={isSendingTest}
                      className="gap-1.5 h-9 shrink-0 bg-white dark:bg-card hover:bg-emerald-50"
                    >
                      {isSendingTest ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      Send Test
                    </Button>
                  </div>

                  {/* Test Email Status Result */}
                  {testEmailStatus && (
                    <div className={`p-3 rounded-lg border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
                      testEmailStatus.success
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                        : "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300"
                    }`}>
                      <div className="flex items-center gap-2">
                        {testEmailStatus.success ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                        )}
                        <span className="font-medium">
                          {testEmailStatus.success ? testEmailStatus.message : testEmailStatus.error}
                        </span>
                      </div>
                      {!testEmailStatus.success && (
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => setLocation("/email-senders")}
                          className="h-7 text-xs border-amber-300 text-amber-900 hover:bg-amber-100 shrink-0"
                        >
                          Configure Email Provider / SMTP
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Scheduling Options */}
                <div className="border rounded-xl p-4 space-y-4">
                  <h4 className="font-semibold text-sm">Delivery Timing</h4>
                  <RadioGroup value={sendOption} onValueChange={(val: any) => setSendOption(val)} className="space-y-3">
                    <div
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${
                        sendOption === "now" ? "border-emerald-600 bg-emerald-50/20" : ""
                      }`}
                    >
                      <RadioGroupItem value="now" id="timing-now" />
                      <Label htmlFor="timing-now" className="cursor-pointer text-sm font-medium">
                        Send Immediately
                      </Label>
                    </div>

                    <div
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer ${
                        sendOption === "later" ? "border-emerald-600 bg-emerald-50/20" : ""
                      }`}
                    >
                      <RadioGroupItem value="later" id="timing-later" className="mt-1" />
                      <div className="space-y-2 flex-1">
                        <Label htmlFor="timing-later" className="cursor-pointer text-sm font-medium">
                          Schedule for Later
                        </Label>
                        {sendOption === "later" && (
                          <div className="pt-1 max-w-xs">
                            <Input
                              type="datetime-local"
                              value={scheduledDateTime}
                              onChange={(e) => setScheduledDateTime(e.target.value)}
                              className="text-xs h-9"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between border-t p-4">
                <Button variant="outline" onClick={() => setCurrentStep(3)} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Design
                </Button>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || estimatedTotal === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold shadow-md"
                >
                  {createMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Queueing Campaign...
                    </>
                  ) : sendOption === "later" ? (
                    <>
                      <Clock className="h-4 w-4" />
                      Schedule Campaign ({estimatedTotal})
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Launch Campaign Now ({estimatedTotal})
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
