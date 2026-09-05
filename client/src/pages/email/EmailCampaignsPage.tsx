import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Mail,
  Plus,
  Search,
  MoreVertical,
  Trash2,
  BarChart3,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  MousePointer,
  Sparkles,
  Layers,
  Globe,
  FileText,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

export default function EmailCampaignsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCampaignForAnalytics, setSelectedCampaignForAnalytics] = useState<string | null>(null);

  // Fetch campaigns
  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery<any[]>({
    queryKey: ["/api/email/campaigns"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/email/campaigns");
      return res.json();
    },
  });

  // Fetch deliverability overview stats
  const { data: stats } = useQuery({
    queryKey: ["/api/email/campaigns/stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/email/campaigns/stats");
      return res.json();
    },
  });

  // Fetch single campaign analytics when modal is open
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ["/api/email/campaigns", selectedCampaignForAnalytics, "analytics"],
    queryFn: async () => {
      if (!selectedCampaignForAnalytics) return null;
      const res = await apiRequest("GET", `/api/email/campaigns/${selectedCampaignForAnalytics}/analytics`);
      return res.json();
    },
    enabled: !!selectedCampaignForAnalytics,
  });

  // Delete campaign mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/email/campaigns/${id}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/email/campaigns/stats"] });
      toast({ title: "Campaign deleted successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to delete", description: err.message, variant: "destructive" });
    },
  });

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.subject || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">Completed</Badge>;
      case "sending":
        return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 animate-pulse">Sending...</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30">Scheduled</Badge>;
      case "failed":
        return <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30">Failed</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50/50 dark:bg-background flex flex-col">
      <Header
        title="Email Campaigns"
        subtitle="Create, schedule, and track beautiful email marketing campaigns."
      />

      <main className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6 flex-1">
        {/* Top Navigation & KPI Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="h-5 w-5 text-emerald-600" />
              Email Marketing Suite
            </h2>
            <p className="text-sm text-muted-foreground">
              Professional email delivery with custom senders, responsive templates, and live analytics.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/email-templates")}
              className="gap-1.5"
            >
              <FileText className="h-4 w-4" />
              Templates
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/email-senders")}
              className="gap-1.5"
            >
              <Globe className="h-4 w-4" />
              Senders & Domains
            </Button>
            <Button
              onClick={() => setLocation("/email-campaigns/new")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Create Campaign
            </Button>
          </div>
        </div>

        {/* Brevo-Style Deliverability KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Total Sent</span>
                <Send className="h-4 w-4 text-emerald-600" />
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {(stats?.totalSent || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Across {stats?.totalCampaigns || 0} campaigns</p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Delivery Rate</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats?.deliveryRate ?? 100}%
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Inbox delivery health</p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Average Open Rate</span>
                <Eye className="h-4 w-4 text-emerald-600" />
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats?.avgOpenRate || 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{(stats?.totalOpens || 0).toLocaleString()} total opens</p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Average Click Rate</span>
                <MousePointer className="h-4 w-4 text-emerald-600" />
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats?.avgClickRate || 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{(stats?.totalClicks || 0).toLocaleString()} link clicks</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Search Bar */}
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns by name or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {["all", "completed", "sending", "scheduled", "draft"].map((st) => (
                <Button
                  key={st}
                  variant={statusFilter === st ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(st)}
                  className={`h-8 capitalize text-xs ${
                    statusFilter === st ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                  }`}
                >
                  {st}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Campaigns List Table */}
        <Card className="border-border/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-muted/40 border-b border-border/80 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Campaign & Subject</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Recipients</th>
                  <th className="py-3 px-4">Open Rate</th>
                  <th className="py-3 px-4">Click Rate</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoadingCampaigns ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                      Loading email campaigns...
                    </td>
                  </tr>
                ) : filteredCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="max-w-sm mx-auto space-y-3">
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                          <Mail className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                          No email campaigns found
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Get started by launching your first targeted email campaign with our clean step-by-step wizard.
                        </p>
                        <Button
                          onClick={() => setLocation("/email-campaigns/new")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm text-xs mt-2"
                        >
                          <Plus className="h-4 w-4" />
                          Create First Email Campaign
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCampaigns.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white text-sm">
                          {c.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-xs">
                          {c.subject || "No subject specified"}
                        </div>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(c.status)}</td>
                      <td className="py-3 px-4 font-medium">
                        {(c.sentCount || c.recipientCount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 dark:bg-muted rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${Math.min(c.openRate || 0, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold">{c.openRate || 0}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 dark:bg-muted rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-500 h-full rounded-full"
                              style={{ width: `${Math.min(c.clickRate || 0, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold">{c.clickRate || 0}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {c.completedAt
                          ? new Date(c.completedAt).toLocaleDateString()
                          : new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onClick={() => setSelectedCampaignForAnalytics(c.id)}
                              className="gap-2 cursor-pointer"
                            >
                              <BarChart3 className="h-4 w-4 text-emerald-600" />
                              View Analytics
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => deleteMutation.mutate(c.id)}
                              className="gap-2 text-red-600 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Campaign
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      {/* Campaign Analytics Modal */}
      <Dialog
        open={!!selectedCampaignForAnalytics}
        onOpenChange={(open) => !open && setSelectedCampaignForAnalytics(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              Campaign Performance Analytics
            </DialogTitle>
            <DialogDescription>
              Real-time delivery, engagement, and click-through statistics.
            </DialogDescription>
          </DialogHeader>

          {isLoadingAnalytics ? (
            <div className="py-12 text-center text-muted-foreground">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
              Loading campaign metrics...
            </div>
          ) : analyticsData ? (
            <div className="space-y-6 py-2">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 dark:bg-muted/40 p-3 rounded-lg border">
                  <div className="text-xs text-muted-foreground uppercase font-semibold">Total Sent</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {analyticsData.metrics?.sent || 0}
                  </div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 uppercase font-semibold">Open Rate</div>
                  <div className="text-2xl font-bold text-emerald-600 mt-1">
                    {Math.round((analyticsData.openRate || 0) * 100)}%
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-xs text-blue-700 dark:text-blue-400 uppercase font-semibold">Click Rate</div>
                  <div className="text-2xl font-bold text-blue-600 mt-1">
                    {Math.round((analyticsData.clickRate || 0) * 100)}%
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3 bg-card">
                <h4 className="font-semibold text-sm">Engagement Funnel</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Delivered</span>
                    <span className="font-medium">{analyticsData.metrics?.delivered || analyticsData.metrics?.sent || 0}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Unique Opens</span>
                    <span className="font-medium">{analyticsData.metrics?.opened || 0}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Link Clicks</span>
                    <span className="font-medium">{analyticsData.metrics?.clicked || 0}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b text-red-600">
                    <span>Bounced / Failed</span>
                    <span className="font-medium">{analyticsData.metrics?.failed || 0}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Unsubscribes</span>
                    <span className="font-medium">{analyticsData.metrics?.unsubscribed || 0}</span>
                  </div>
                </div>
              </div>

              {analyticsData.failures && analyticsData.failures.length > 0 && (
                <div className="border border-red-200 dark:border-red-900 rounded-lg p-3 bg-red-50/50 dark:bg-red-950/20">
                  <h4 className="font-semibold text-xs text-red-700 dark:text-red-400 mb-2">
                    Delivery Failures ({analyticsData.failures.length})
                  </h4>
                  <div className="max-h-32 overflow-y-auto space-y-1 text-xs">
                    {analyticsData.failures.map((f: any, i: number) => (
                      <div key={i} className="flex justify-between text-muted-foreground">
                        <span>{f.email}</span>
                        <span className="text-red-600">{f.errorMessage || "Rejected"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedCampaignForAnalytics(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
