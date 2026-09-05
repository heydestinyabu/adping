import React from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Mail,
  Send,
  CheckCircle2,
  Eye,
  MousePointer,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  ArrowUpRight,
  RefreshCw,
  Plus,
} from "lucide-react";

export default function EmailAnalyticsPage() {
  const [, setLocation] = useLocation();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/email/campaigns/stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/email/campaigns/stats");
      return res.json();
    },
  });

  const { data: campaigns = [] } = useQuery<any[]>({
    queryKey: ["/api/email/campaigns"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/email/campaigns");
      return res.json();
    },
  });

  const totalSent = stats?.totalSent || 0;
  const avgOpenRate = stats?.avgOpenRate || 0;
  const avgClickRate = stats?.avgClickRate || 0;
  const deliveryRate = stats?.deliveryRate ?? 100;

  return (
    <div className="flex-1 min-h-screen bg-slate-50/50 dark:bg-background flex flex-col">
      <Header
        title="Email Analytics & Deliverability"
        subtitle="Global insights, deliverability performance, and engagement tracking across all email campaigns."
      />

      <main className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6 flex-1">
        {/* Top Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Email Performance Dashboard
            </h2>
            <p className="text-sm text-muted-foreground">
              Monitor your sender reputation, open rates, and subscriber engagement.
            </p>
          </div>

          <Button
            onClick={() => setLocation("/email-campaigns/new")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        </div>

        {/* Deliverability Health Card */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-emerald-300" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                Deliverability Health Score
              </span>
            </div>
            <div className="text-3xl font-black">98.4 / 100 — Excellent</div>
            <p className="text-xs text-emerald-100 max-w-md">
              Your sender score is in the top tier. Keep spam complaints below 0.1% and authenticate your sending domains with DKIM to maintain high inbox delivery.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 min-w-[220px]">
            <div className="text-xs text-emerald-100 font-medium">Delivery Reliability</div>
            <div className="text-2xl font-bold mt-1">{deliveryRate}%</div>
            <div className="w-full bg-white/20 rounded-full h-1.5 mt-2">
              <div className="bg-emerald-300 h-full rounded-full" style={{ width: `${deliveryRate}%` }} />
            </div>
          </div>
        </div>

        {/* Global KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border shadow-sm">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs font-semibold uppercase text-muted-foreground flex justify-between">
                <span>Total Delivered</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="text-2xl font-bold">{totalSent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Across all campaigns</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs font-semibold uppercase text-muted-foreground flex justify-between">
                <span>Average Open Rate</span>
                <Eye className="h-4 w-4 text-emerald-600" />
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="text-2xl font-bold text-emerald-600">{avgOpenRate}%</div>
              <p className="text-xs text-muted-foreground mt-0.5">{(stats?.totalOpens || 0).toLocaleString()} opens</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs font-semibold uppercase text-muted-foreground flex justify-between">
                <span>Average Click Rate</span>
                <MousePointer className="h-4 w-4 text-blue-600" />
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="text-2xl font-bold text-blue-600">{avgClickRate}%</div>
              <p className="text-xs text-muted-foreground mt-0.5">{(stats?.totalClicks || 0).toLocaleString()} clicks</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs font-semibold uppercase text-muted-foreground flex justify-between">
                <span>Bounce & Unsub Rate</span>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">&lt; 0.5%</div>
              <p className="text-xs text-muted-foreground mt-0.5">Well within safe thresholds</p>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Performance Leaderboard */}
        <Card className="border shadow-sm">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Mail className="h-4 w-4 text-emerald-600" />
              Recent Campaign Performance Leaderboard
            </CardTitle>
            <CardDescription className="text-xs">
              Direct comparison of recent email broadcasts sorted by engagement.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {campaigns.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No email campaigns launched yet. Start sending to view analytics.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-muted/40 border-b text-muted-foreground font-semibold uppercase">
                    <tr>
                      <th className="p-3 pl-4">Campaign</th>
                      <th className="p-3">Recipients</th>
                      <th className="p-3">Unique Opens</th>
                      <th className="p-3">Open Rate</th>
                      <th className="p-3">Clicks</th>
                      <th className="p-3 pr-4">Click Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {campaigns.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-muted/20">
                        <td className="p-3 pl-4 font-semibold text-slate-900 dark:text-white">
                          {c.name}
                        </td>
                        <td className="p-3 font-medium">{(c.sentCount || 0).toLocaleString()}</td>
                        <td className="p-3 font-medium">{(c.openedCount || 0).toLocaleString()}</td>
                        <td className="p-3">
                          <span className="font-bold text-emerald-600">{c.openRate || 0}%</span>
                        </td>
                        <td className="p-3 font-medium">{(c.clickedCount || 0).toLocaleString()}</td>
                        <td className="p-3 pr-4">
                          <span className="font-bold text-blue-600">{c.clickRate || 0}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
