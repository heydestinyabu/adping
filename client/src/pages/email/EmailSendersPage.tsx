import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Globe,
  Mail,
  Plus,
  CheckCircle2,
  AlertCircle,
  Copy,
  Trash2,
  ShieldCheck,
  Server,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

export default function EmailSendersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("senders");

  // Sender modal
  const [isAddSenderOpen, setIsAddSenderOpen] = useState(false);
  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [replyTo, setReplyTo] = useState("");

  // Domain modal
  const [isAddDomainOpen, setIsAddDomainOpen] = useState(false);
  const [domainName, setDomainName] = useState("");

  // DNS records modal
  const [dnsModalDomain, setDnsModalDomain] = useState<any | null>(null);

  // Fetch senders
  const { data: senders = [], isLoading: isLoadingSenders } = useQuery<any[]>({
    queryKey: ["/api/email/senders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/email/senders");
      return res.json();
    },
  });

  // Fetch domains
  const { data: domains = [], isLoading: isLoadingDomains } = useQuery<any[]>({
    queryKey: ["/api/email/domains"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/email/domains");
      return res.json();
    },
  });

  // Fetch active provider
  const { data: activeProvider } = useQuery({
    queryKey: ["/api/email/providers/active"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/email/providers/active");
      return res.json();
    },
  });

  // Add sender mutation
  const addSenderMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/email/senders", {
        fromName,
        fromEmail,
        replyTo: replyTo || undefined,
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/senders"] });
      toast({ title: "Sender identity created successfully" });
      setIsAddSenderOpen(false);
      setFromName("");
      setFromEmail("");
      setReplyTo("");
    },
    onError: (err: any) => {
      toast({ title: "Failed to add sender", description: err.message, variant: "destructive" });
    },
  });

  // Delete sender mutation
  const deleteSenderMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/email/senders/${id}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/senders"] });
      toast({ title: "Sender deleted" });
    },
  });

  // Add domain mutation
  const addDomainMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/email/domains", { domain: domainName });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/domains"] });
      toast({ title: "Domain registered successfully" });
      setIsAddDomainOpen(false);
      setDomainName("");
      setDnsModalDomain(data);
    },
    onError: (err: any) => {
      toast({ title: "Failed to register domain", description: err.message, variant: "destructive" });
    },
  });

  // Verify domain DNS mutation
  const verifyDomainMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/email/domains/${id}/verify`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/domains"] });
      toast({
        title: res.isVerified ? "Domain verified successfully!" : "Verification pending",
        description: res.isVerified ? "Your domain is ready for high-deliverability sending." : "DNS records may take up to 24 hours to propagate.",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50/50 dark:bg-background flex flex-col">
      <Header
        title="Senders & Domains"
        subtitle="Manage sender identities, domain DKIM authentication, and email deliverability."
      />

      <main className="p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-6 flex-1">
        {/* Delivery Engine Health Banner */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Active Email Engine: {activeProvider?.provider || "Default Platform Engine (Resend/SMTP)"}
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                  Online
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                High-deliverability enterprise routing with SPF, DKIM, and TLS 1.3 encryption.
              </div>
            </div>
          </div>
        </div>

        {/* Tabs: Senders vs Domains */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white dark:bg-card border p-1 rounded-lg">
            <TabsTrigger value="senders" className="gap-2 text-xs">
              <Mail className="h-4 w-4" />
              Sender Identities ({senders.length})
            </TabsTrigger>
            <TabsTrigger value="domains" className="gap-2 text-xs">
              <Globe className="h-4 w-4" />
              Sending Domains ({domains.length})
            </TabsTrigger>
          </TabsList>

          {/* Senders Tab */}
          <TabsContent value="senders" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Sender identities determine the From Name and From Email recipients see when opening your messages.
              </p>
              <Button
                onClick={() => setIsAddSenderOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs h-9 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Add Sender Identity
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoadingSenders ? (
                <div className="col-span-3 py-12 text-center text-muted-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                  Loading senders...
                </div>
              ) : senders.length === 0 ? (
                <Card className="col-span-3 p-8 text-center border-dashed">
                  <div className="max-w-sm mx-auto space-y-2">
                    <Mail className="h-8 w-8 mx-auto text-muted-foreground" />
                    <h4 className="font-semibold text-sm">No custom senders configured</h4>
                    <p className="text-xs text-muted-foreground">
                      Campaigns will default to your verified platform address. Add custom sender identities for distinct brand personas.
                    </p>
                    <Button
                      onClick={() => setIsAddSenderOpen(true)}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs mt-2"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add First Sender
                    </Button>
                  </div>
                </Card>
              ) : (
                senders.map((s) => (
                  <Card key={s.id} className="border shadow-sm hover:shadow transition-shadow">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base font-bold">{s.fromName}</CardTitle>
                          <CardDescription className="text-xs font-mono mt-0.5">{s.fromEmail}</CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSenderMutation.mutate(s.id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 space-y-2 text-xs">
                      {s.replyTo && (
                        <div className="text-muted-foreground">
                          <strong>Reply-To:</strong> {s.replyTo}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-emerald-600 font-medium pt-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Ready for sending
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Domains Tab */}
          <TabsContent value="domains" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Authenticate your domain with DKIM & SPF records to maximize inbox delivery and prevent spam filtering.
              </p>
              <Button
                onClick={() => setIsAddDomainOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs h-9 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Connect Domain
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isLoadingDomains ? (
                <div className="col-span-2 py-12 text-center text-muted-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                  Loading domains...
                </div>
              ) : domains.length === 0 ? (
                <Card className="col-span-2 p-8 text-center border-dashed">
                  <div className="max-w-sm mx-auto space-y-2">
                    <Globe className="h-8 w-8 mx-auto text-muted-foreground" />
                    <h4 className="font-semibold text-sm">No custom sending domains registered</h4>
                    <p className="text-xs text-muted-foreground">
                      Connect your corporate domain (e.g. <code>yourbrand.com</code>) to send fully authenticated emails under your brand name.
                    </p>
                    <Button
                      onClick={() => setIsAddDomainOpen(true)}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs mt-2"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Connect Custom Domain
                    </Button>
                  </div>
                </Card>
              ) : (
                domains.map((dom) => (
                  <Card key={dom.id} className="border shadow-sm">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <Globe className="h-4 w-4 text-emerald-600" />
                          {dom.domain}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Added {new Date(dom.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      {dom.isVerified ? (
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-300 gap-1">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Pending DNS
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent className="p-4 pt-2 flex justify-between items-center text-xs">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDnsModalDomain(dom)}
                        className="text-xs h-8 gap-1.5"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View DNS Records
                      </Button>
                      {!dom.isVerified && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => verifyDomainMutation.mutate(dom.id)}
                          disabled={verifyDomainMutation.isPending}
                          className="text-xs h-8 gap-1.5"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${verifyDomainMutation.isPending ? "animate-spin" : ""}`} />
                          Verify DNS
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Sender Dialog */}
      <Dialog open={isAddSenderOpen} onOpenChange={setIsAddSenderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Sender Identity</DialogTitle>
            <DialogDescription>
              Create a personalized sender profile for your marketing and notification emails.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="sFromName" className="text-xs">From Name</Label>
              <Input
                id="sFromName"
                placeholder="e.g. Sarah from ADping"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sFromEmail" className="text-xs">From Email Address</Label>
              <Input
                id="sFromEmail"
                type="email"
                placeholder="e.g. sarah@yourcompany.com"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sReplyTo" className="text-xs">Reply-To Address (Optional)</Label>
              <Input
                id="sReplyTo"
                type="email"
                placeholder="e.g. support@yourcompany.com"
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSenderOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => addSenderMutation.mutate()}
              disabled={!fromName || !fromEmail || addSenderMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Save Sender
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Domain Dialog */}
      <Dialog open={isAddDomainOpen} onOpenChange={setIsAddDomainOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Sending Domain</DialogTitle>
            <DialogDescription>
              Enter the domain name you want to authenticate for high-volume email delivery.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="domainName" className="text-xs">Domain Name</Label>
              <Input
                id="domainName"
                placeholder="e.g. mail.yourbrand.com or yourbrand.com"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                You will be provided with DKIM and SPF TXT records to add to your DNS registrar (Cloudflare, GoDaddy, Namecheap, Route53, etc.).
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDomainOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => addDomainMutation.mutate()}
              disabled={!domainName || addDomainMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Generate DNS Records
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DNS Records Modal */}
      <Dialog open={!!dnsModalDomain} onOpenChange={(open) => !open && setDnsModalDomain(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              DNS Authentication Records for {dnsModalDomain?.domain}
            </DialogTitle>
            <DialogDescription>
              Add these DNS records in your domain provider to verify ownership and ensure maximum inbox delivery.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* DKIM */}
            <div className="border rounded-lg p-3 space-y-2 bg-card">
              <div className="flex justify-between items-center font-semibold">
                <span>DKIM Record (Type: TXT)</span>
                <Badge variant="outline" className="text-[10px]">Required</Badge>
              </div>
              <div className="space-y-1 font-mono text-[11px] bg-slate-50 dark:bg-muted p-2 rounded">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Host:</span>
                  <span>adping._domainkey.{dnsModalDomain?.domain}</span>
                </div>
                <div className="flex justify-between pt-1 border-t">
                  <span className="text-muted-foreground">Value:</span>
                  <span className="truncate max-w-xs">{dnsModalDomain?.dkimValue || "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3..."}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(dnsModalDomain?.dkimValue || "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3...")}
                className="h-7 text-xs gap-1"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy DKIM Value
              </Button>
            </div>

            {/* SPF */}
            <div className="border rounded-lg p-3 space-y-2 bg-card">
              <div className="flex justify-between items-center font-semibold">
                <span>SPF Record (Type: TXT)</span>
                <Badge variant="outline" className="text-[10px]">Required</Badge>
              </div>
              <div className="space-y-1 font-mono text-[11px] bg-slate-50 dark:bg-muted p-2 rounded">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Host:</span>
                  <span>@</span>
                </div>
                <div className="flex justify-between pt-1 border-t">
                  <span className="text-muted-foreground">Value:</span>
                  <span>v=spf1 include:spf.adping.com ~all</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard("v=spf1 include:spf.adping.com ~all")}
                className="h-7 text-xs gap-1"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy SPF Value
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDnsModalDomain(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
