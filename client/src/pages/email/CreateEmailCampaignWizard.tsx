import React, { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  X,
} from "lucide-react";
import { SYSTEM_TEMPLATES, EmailTemplateDefinition } from "@/components/email/SystemTemplates";

export default function CreateEmailCampaignWizard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);

  // ── Step 1: Form & Sender State ──
  const [campaignName, setCampaignName] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
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
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number>(0);
  const [htmlContent, setHtmlContent] = useState<string>(SYSTEM_TEMPLATES[0].htmlContent);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [editorTab, setEditorTab] = useState<"visual" | "code">("visual");

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

  // Search contacts and users with email for "certain user" selection
  const { data: contactsSearchResult, isLoading: isSearchingContacts } = useQuery<{ contacts: any[]; total: number }>({
    queryKey: ["/api/email/contacts-search", contactSearchQuery],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/email/contacts-search?query=${encodeURIComponent(contactSearchQuery)}&limit=60`);
      return res.json();
    },
  });

  const availableContacts = contactsSearchResult?.contacts || [];

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

  // Query actual live audience estimate from backend
  const { data: audienceEstimate, isLoading: isEstimating } = useQuery<{ total: number; samples: Array<{ name: string; email: string }> }>({
    queryKey: [
      "/api/email/audience-estimate",
      audienceType,
      selectedGroupId,
      selectedContactIds.join(","),
      parsedManualEmails.join(","),
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("audienceType", audienceType);
      if (audienceType === "group" && selectedGroupId) params.set("groupId", selectedGroupId);
      if (audienceType === "specific" && selectedContactIds.length > 0) params.set("contactIds", selectedContactIds.join(","));
      if (audienceType === "manual" && parsedManualEmails.length > 0) params.set("manualEmails", parsedManualEmails.join(","));

      const res = await apiRequest("GET", `/api/email/audience-estimate?${params.toString()}`);
      return res.json();
    },
  });

  const estimatedTotal = audienceEstimate?.total ?? (audienceType === "manual" ? parsedManualEmails.length : 0);
  const sampleRecipients = audienceEstimate?.samples || [];

  // Send test email
  const handleSendTestEmail = async () => {
    if (!testEmailAddress || !testEmailAddress.includes("@")) {
      toast({ title: "Please enter a valid test email address", variant: "destructive" });
      return;
    }
    setIsSendingTest(true);
    try {
      const res = await apiRequest("POST", "/api/email/campaigns/test", {
        recipientEmail: testEmailAddress,
        subject: subject || "Test Email Preview",
        htmlContent,
        fromName: fromName || "ADping",
        fromEmail: fromEmail,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || err.error || "Failed to send test email");
      }
      toast({ title: "Test email sent!", description: `Check inbox for ${testEmailAddress}` });
    } catch (err: any) {
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
        toast({ title: "Please select at least one contact/user", variant: "destructive" });
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
    if (!subject) setSubject(tmpl.subject);
    if (!previewText) setPreviewText(tmpl.previewText);
    toast({ title: `Applied "${tmpl.name}" template` });
  };

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
                Send to all contacts, pick a certain user/contact, select a group, or paste direct emails.
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
                      All Platform Users & Contacts with Email Address
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically broadcasts to every registered platform user and CRM contact in your database with an email address.
                    </p>
                  </div>
                </div>

                {/* Option 2: Send to a Certain User / Specific Contacts */}
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
                        Send to a Certain User / Specific Contacts
                      </Label>
                      {selectedContactIds.length > 0 && (
                        <Badge className="bg-emerald-600 text-white text-[11px]">
                          {selectedContactIds.length} Selected
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Search and choose individual user(s) or contact(s) to receive this email broadcast.
                    </p>

                    {audienceType === "specific" && (
                      <div className="pt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                          <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                          <Input
                            placeholder="Search by name, email, or role..."
                            value={contactSearchQuery}
                            onChange={(e) => setContactSearchQuery(e.target.value)}
                            className="pl-9 h-9 text-xs"
                          />
                        </div>

                        {/* Contacts List Box */}
                        <div className="border rounded-xl max-h-60 overflow-y-auto bg-white dark:bg-card p-2 space-y-1 divide-y divide-border/40">
                          {isSearchingContacts ? (
                            <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Searching users & contacts...
                            </div>
                          ) : availableContacts.length === 0 ? (
                            <div className="p-4 text-center text-xs text-muted-foreground">
                              No users or contacts found matching "{contactSearchQuery}".
                            </div>
                          ) : (
                            availableContacts.map((c) => {
                              const isSelected = selectedContactIds.includes(c.id);
                              return (
                                <div
                                  key={c.id}
                                  onClick={() => toggleContactSelection(c.id)}
                                  className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                                    isSelected ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200" : "hover:bg-slate-50 dark:hover:bg-muted/40"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleContactSelection(c.id)}
                                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                                    />
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-xs text-slate-900 dark:text-white">{c.name}</span>
                                        {c.type === "user" ? (
                                          <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 text-[10px] px-1.5 py-0 font-medium">
                                            User ({c.role || "member"})
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-slate-500">
                                            Contact
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                                        <span>{c.email || "(no email on file)"}</span>
                                        {c.phone && <span className="text-[10px] opacity-75">• {c.phone}</span>}
                                      </div>
                                    </div>
                                  </div>
                                  {c.groups && c.groups.length > 0 && (
                                    <Badge variant="secondary" className="text-[10px] font-normal">
                                      {c.groups[0]}
                                    </Badge>
                                  )}
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
                            No contact groups created yet. You can create groups under Contacts Management or select specific users/contacts above.
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
                  <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>
                      0 recipients found. You can select "Direct Email Addresses" above to paste any email address directly.
                    </span>
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
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-600" />
                      Brevo-Grade Responsive Email Templates
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Pick any responsive template to instantly apply to your campaign.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-emerald-700 border-emerald-300">
                    {SYSTEM_TEMPLATES.length} Ready-to-Send Templates
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {SYSTEM_TEMPLATES.map((tmpl, idx) => {
                    const isSelected = selectedTemplateIndex === idx;
                    return (
                      <div
                        key={tmpl.name}
                        onClick={() => handleSelectTemplate(tmpl, idx)}
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
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
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
              {/* Left Column: Code / HTML Editor */}
              <div className="lg:col-span-6 space-y-4">
                <Card className="border-border/80 shadow-sm">
                  <CardHeader className="p-4 pb-2 border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-emerald-600" />
                        Email Body & HTML Content
                      </CardTitle>
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-muted-foreground mr-1">Insert Token:</span>
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
                          onClick={() => setHtmlContent((h) => h + "{{unsubscribe_url}}")}
                          className="bg-slate-100 hover:bg-slate-200 dark:bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono text-emerald-600"
                        >
                          unsub
                        </button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3">
                    <Textarea
                      id="htmlCode"
                      rows={18}
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
                        previewDevice === "mobile" ? "max-w-[340px] h-[460px]" : "w-full h-[460px]"
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
                          ? `Specific Contacts (${selectedContactIds.length} users)`
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
                  <div className="flex items-center gap-2 font-semibold text-sm text-emerald-800 dark:text-emerald-300">
                    <Send className="h-4 w-4 text-emerald-600" />
                    Send a Live Inbox Test Email
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
                      className="gap-1.5 h-9 shrink-0"
                    >
                      {isSendingTest ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      Send Test
                    </Button>
                  </div>
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
