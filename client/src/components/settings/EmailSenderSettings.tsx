import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Globe, CheckCircle2, AlertTriangle, RefreshCcw, Plus, Trash2, ShieldCheck, Mail, Edit3, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function EmailSenderSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedSenderId, setSelectedSenderId] = useState<string | "new">("new");
  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [sendingDomain, setSendingDomain] = useState("");
  const [newDomainName, setNewDomainName] = useState("");
  const [copiedRecord, setCopiedRecord] = useState<string | null>(null);

  // ─── Queries ──────────────────────────────────────────

  const { data: senders, isLoading } = useQuery({
    queryKey: ["/api/email/senders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/email/senders");
      return res.json();
    }
  });

  const { data: domains, isLoading: domainsLoading } = useQuery({
    queryKey: ["/api/email/domains"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/email/domains");
      if (!res.ok) return [];
      return res.json();
    }
  });

  // ─── Sender Mutations ─────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const isUpdate = !!data.id;
      const url = isUpdate ? `/api/email/senders/${data.id}` : "/api/email/senders";
      const method = isUpdate ? "PUT" : "POST";
      const res = await apiRequest(method, url, data);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || body.error || "Failed to save sender identity");
      }
      return res.json();
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/senders"] });
      toast({ title: "Sender identity saved successfully" });
      if (saved?.id) setSelectedSenderId(saved.id);
    },
    onError: (err: any) => {
      toast({ title: "Cannot save sender identity", description: err.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/email/senders/${id}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/senders"] });
      toast({ title: "Sender identity removed" });
      setSelectedSenderId("new");
      setFromName(""); setFromEmail(""); setReplyTo(""); setSendingDomain("");
    },
  });

  // ─── Domain Mutations ─────────────────────────────────

  const createDomainMutation = useMutation({
    mutationFn: async (domainName: string) => {
      const res = await apiRequest("POST", "/api/email/domains", { name: domainName });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || await res.text());
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/domains"] });
      setNewDomainName("");
      toast({ title: `Domain "${data.name}" added successfully`, description: "Add the required DNS records below to authenticate." });
    },
    onError: (err: any) => {
      toast({ title: "Failed to add domain", description: err.message, variant: "destructive" });
    }
  });

  const verifyDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      const res = await apiRequest("POST", `/api/email/domains/${domainId}/verify`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || await res.text());
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/domains"] });
      if (data.status === "verified") {
        toast({ title: "✅ Domain verified successfully!" });
      } else {
        toast({ title: "DNS verification pending", description: "Make sure all SPF & DKIM records are published on your DNS provider." });
      }
    },
    onError: (err: any) => {
      toast({ title: "Verification check failed", description: err.message, variant: "destructive" });
    }
  });

  const deleteDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      const res = await apiRequest("DELETE", `/api/email/domains/${domainId}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/domains"] });
      toast({ title: "Domain removed" });
    },
  });

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRecord(key);
    setTimeout(() => setCopiedRecord(null), 2000);
  };

  if (isLoading || domainsLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-6 h-6 text-emerald-600" /></div>;

  const currentSender = senders?.find((s: any) => s.id === selectedSenderId) || null;
  const verifiedDomains = domains?.filter((d: any) => d.status === "verified") || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Verified</Badge>;
      case "failed":
        return <Badge variant="destructive"><AlertTriangle className="w-3.5 h-3.5 mr-1" /> Verification Failed</Badge>;
      default:
        return <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-amber-200"><AlertTriangle className="w-3.5 h-3.5 mr-1" /> Pending DNS</Badge>;
    }
  };

  return (
    <div className="space-y-6">

      {/* ═══ Card 1: Sender Identities ═══ */}
      <Card className="shadow-sm border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Mail className="w-5 h-5 text-emerald-600" /> Sender Identities
              </CardTitle>
              <CardDescription>Configure how your brand name and reply email appear to campaign recipients.</CardDescription>
            </div>

            {senders && senders.length > 0 && (
              <select 
                className="h-9 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={selectedSenderId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedSenderId(id);
                  const s = senders.find((x: any) => x.id === id);
                  if (s) {
                    setFromName(s.fromName || "");
                    setFromEmail(s.fromEmail || "");
                    setReplyTo(s.replyTo || "");
                    setSendingDomain(s.sendingDomain || "");
                  } else {
                    setFromName(""); setFromEmail(""); setReplyTo(""); setSendingDomain("");
                  }
                }}
              >
                {senders.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.fromName} ({s.fromEmail})</option>
                ))}
                <option value="new">+ Add New Identity</option>
              </select>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">From Name <span className="text-destructive">*</span></Label>
              <Input 
                value={fromName || currentSender?.fromName || ""} 
                onChange={(e) => setFromName(e.target.value)} 
                placeholder="e.g. Elite Brand" 
              />
              <p className="text-xs text-muted-foreground">The display name customers see in their email inbox.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Email Address / Reply Target <span className="text-destructive">*</span></Label>
              <Input 
                value={fromEmail || currentSender?.fromEmail || ""} 
                onChange={(e) => setFromEmail(e.target.value)} 
                placeholder="e.g. info@elitebrand.com" 
              />
              <p className="text-xs text-muted-foreground">Replies sent by recipients will arrive in this email inbox.</p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium">Sending Domain</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={sendingDomain || currentSender?.sendingDomain || ""}
                onChange={(e) => setSendingDomain(e.target.value)}
              >
                <option value="">Default High-Deliverability Delivery Network</option>
                {verifiedDomains.map((d: any) => (
                  <option key={d.id} value={d.name}>{d.name} (Custom Domain - Verified)</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Select your verified custom domain, or use our high-deliverability network.
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t p-4 bg-muted/20">
          {currentSender ? (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => {
                if (confirm(`Remove sender identity "${currentSender.fromName}"?`)) {
                  deleteMutation.mutate(currentSender.id);
                }
              }}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-1.5" /> Remove Identity
            </Button>
          ) : <div />}

          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            onClick={() => saveMutation.mutate({ 
              id: currentSender?.id,
              fromName: fromName || currentSender?.fromName, 
              fromEmail: fromEmail || currentSender?.fromEmail, 
              replyTo: fromEmail || currentSender?.fromEmail, 
              sendingDomain: sendingDomain || currentSender?.sendingDomain, 
              isDefault: true 
            })} 
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Save Identity
          </Button>
        </CardFooter>
      </Card>


      {/* ═══ Card 2: Custom Domains Management ═══ */}
      <Card className="shadow-sm border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-600" /> Custom Sending Domains
              </CardTitle>
              <CardDescription>
                Add your domain name to sign emails directly with your custom domain identity.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newDomainName}
              onChange={(e) => setNewDomainName(e.target.value)}
              placeholder="e.g. laikiedu.com"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newDomainName.trim()) {
                  createDomainMutation.mutate(newDomainName.trim());
                }
              }}
            />
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => createDomainMutation.mutate(newDomainName.trim())}
              disabled={!newDomainName.trim() || createDomainMutation.isPending}
            >
              {createDomainMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Domain
            </Button>
          </div>

          {domains && domains.length > 0 ? (
            <div className="space-y-3 pt-2">
              {domains.map((domain: any) => (
                <div key={domain.id} className="border rounded-lg p-4 space-y-3 bg-background shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-base">{domain.name}</span>
                      {getStatusBadge(domain.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => verifyDomainMutation.mutate(domain.id)}
                        disabled={verifyDomainMutation.isPending}
                      >
                        <RefreshCcw className="w-3.5 h-3.5 mr-1" /> Re-Verify DNS
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm(`Remove domain "${domain.name}"?`)) {
                            deleteDomainMutation.mutate(domain.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* DNS Records Details */}
                  {domain.records && domain.records.length > 0 && (
                    <div className="bg-muted/40 rounded-lg p-3 space-y-2 border border-border/50 text-sm">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">DNS Records Required</p>
                        <span className="text-xs text-muted-foreground">Add these TXT/CNAME records to your domain provider</span>
                      </div>

                      <div className="space-y-2 pt-1">
                        {domain.records.map((record: any, idx: number) => {
                          const recordKey = `${domain.id}-${idx}`;
                          return (
                            <div key={idx} className="bg-background rounded-md p-2.5 border border-border flex flex-col gap-1.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="font-mono text-xs font-semibold uppercase">{record.type}</Badge>
                                  <code className="text-xs font-medium text-foreground">{record.name}</code>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                                  onClick={() => copyToClipboard(record.value, recordKey)}
                                >
                                  {copiedRecord === recordKey ? (
                                    <span className="text-emerald-600 flex items-center"><Check className="w-3 h-3 mr-1" /> Copied</span>
                                  ) : (
                                    <span className="flex items-center"><Copy className="w-3 h-3 mr-1" /> Copy Value</span>
                                  )}
                                </Button>
                              </div>
                              <code className="text-xs font-mono break-all text-muted-foreground bg-muted/30 p-1.5 rounded border border-border/40">
                                {record.value}
                              </code>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg bg-muted/10">
              <Globe className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-600" />
              <p className="font-medium">No custom domains added yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">Enter your domain above to configure DNS authentication.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
