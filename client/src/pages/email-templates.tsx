import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import Header from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Loader2, Plus, Edit, Trash2, Copy, Eye, Search, 
  Sparkles, Mail, Smartphone, Monitor, CheckCircle2, Send, 
  ArrowLeft, Check, Code, ShieldCheck, Zap, SlidersHorizontal, 
  FileCode, Layers, ArrowRight
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { TemplateBuilder } from "@/components/email/TemplateBuilder";
import { SYSTEM_TEMPLATES, EmailTemplateDefinition } from "@/components/email/SystemTemplates";

export default function EmailTemplatesPage() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const [activeTemplate, setActiveTemplate] = useState<any | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch only this user's custom templates from the database
  const { data: dbTemplates = [], isLoading } = useQuery({
    queryKey: ["/api/email/templates"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/email/templates");
        if (!res.ok) return [];
        return res.json();
      } catch (err) {
        return [];
      }
    },
    enabled: !!isAuthenticated,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const isExisting = data.id && !String(data.id).startsWith("sys-") && !String(data.id).startsWith("preset-");
      const url = isExisting ? `/api/email/templates/${data.id}` : "/api/email/templates";
      const method = isExisting ? "PUT" : "POST";
      const res = await apiRequest(method, url, data);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/templates"] });
      toast({ 
        title: "Template saved! ✨", 
        description: "Your custom email template is saved and ready for campaigns." 
      });
      setIsBuilderOpen(false);
      setActiveTemplate(null);
    },
    onError: (err: any) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/email/templates/${id}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/templates"] });
      toast({ title: "Template deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  });

  // Filter user's templates by search query
  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return dbTemplates;
    const q = searchQuery.toLowerCase();
    return dbTemplates.filter((t: any) => 
      t.name?.toLowerCase().includes(q) ||
      t.subject?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q)
    );
  }, [dbTemplates, searchQuery]);

  const handleCopyHtml = (tmpl: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!tmpl?.htmlContent) return;
    navigator.clipboard.writeText(tmpl.htmlContent);
    setCopiedId(tmpl.id || tmpl.name);
    toast({
      title: "HTML Copied! 📋",
      description: `Responsive HTML for "${tmpl.name}" copied to clipboard.`,
    });
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleCreateBlank = () => {
    setShowCreateModal(false);
    setActiveTemplate({
      name: "New Email Template",
      subject: "Important announcement from {{companyName}}",
      previewText: "Preview snippet for inbox",
      category: "Welcome & Onboarding",
      htmlContent: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 36px 32px; color: #0f172a;">
  <div style="margin-bottom: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px;">
    <h2 style="color: #2563eb; margin: 0; font-size: 22px; font-weight: 800;">{{companyName}}</h2>
  </div>
  <div style="margin-bottom: 24px;">
    <h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;"><!-- EDITABLE:headline -->Hello {{firstName}}<!-- /EDITABLE:headline --></h1>
    <p style="font-size: 15px; color: #475569; margin: 0;"><!-- EDITABLE:greeting -->Welcome to our community,<!-- /EDITABLE:greeting --></p>
  </div>
  <p style="font-size: 15px; line-height: 1.6; color: #334155;"><!-- EDITABLE:bodyText -->Write your email content here. You can customize this in the visual form builder or edit the HTML directly.<!-- /EDITABLE:bodyText --></p>
  <div style="margin: 28px 0; text-align: center;">
    <a href="<!-- EDITABLE:buttonUrl -->https://example.com<!-- /EDITABLE:buttonUrl -->" style="background: #2563eb; color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;"><!-- EDITABLE:buttonText -->Get Started →<!-- /EDITABLE:buttonText --></a>
  </div>
  <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 12px; color: #94a3b8; text-align: center;">
    <!-- EDITABLE:footerText -->Sent with ❤️ by {{companyName}} • All rights reserved<!-- /EDITABLE:footerText -->
  </div>
</div>`
    });
    setIsBuilderOpen(true);
  };

  const handleStartFromPreset = (preset: EmailTemplateDefinition) => {
    setShowCreateModal(false);
    setActiveTemplate({
      name: preset.name,
      subject: preset.subject,
      previewText: preset.previewText,
      category: preset.category,
      htmlContent: preset.htmlContent,
      defaultFields: preset.defaultFields,
      isSystem: false,
    });
    setIsBuilderOpen(true);
  };

  const handleEditCustom = (tmpl: any) => {
    setActiveTemplate(tmpl);
    setIsBuilderOpen(true);
  };

  return (
    <div className="flex-1 dots-bg min-h-screen flex flex-col">
      <Header
        title={isBuilderOpen ? (activeTemplate?.id ? "Edit Email Template" : "New Email Template") : "Email Templates"}
        subtitle={isBuilderOpen ? "Customize your email layout, content, and branding." : "Create and manage your campaign email templates."}
        action={!isBuilderOpen ? {
          label: "New Template",
          onClick: () => setShowCreateModal(true),
        } : undefined}
      />

      <main className="p-4 sm:p-6 my-2 flex-1 max-w-7xl w-full mx-auto">
        {isBuilderOpen ? (
          /* Template Builder Screen */
          <div className="h-[calc(100vh-140px)] min-h-[650px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsBuilderOpen(false);
                  setActiveTemplate(null);
                }}
                className="text-slate-600 hover:text-slate-900 gap-1.5 text-xs font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to My Templates</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyHtml(activeTemplate)}
                  className="text-xs h-8 gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy HTML</span>
                </Button>
              </div>
            </div>

            <div className="h-[calc(100%-49px)]">
              <TemplateBuilder 
                initialData={activeTemplate} 
                onSave={async (data) => {
                  await saveMutation.mutateAsync({
                    ...(activeTemplate?.id && !String(activeTemplate.id).startsWith("sys-") ? { id: activeTemplate.id } : {}),
                    ...data,
                  });
                }}
                onCancel={() => {
                  setIsBuilderOpen(false);
                  setActiveTemplate(null);
                }}
              />
            </div>
          </div>
        ) : (
          /* User's Templates List */
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">
                  My Templates ({dbTemplates.length})
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-9 font-semibold shrink-0 shadow-sm gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Template</span>
                </Button>
              </div>
            </div>

            {/* Template Grid or Empty State */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                <p className="text-sm text-slate-500 font-medium">Loading templates...</p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              /* Clean Empty State */
              <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {searchQuery ? "No templates match your search" : "No Custom Templates Yet"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
                  {searchQuery 
                    ? "Try searching for a different name or keyword." 
                    : "Create your first email template from scratch or start from one of our 6 curated business presets."}
                </p>
                <div className="flex items-center justify-center gap-3">
                  {searchQuery ? (
                    <Button variant="outline" size="sm" onClick={() => setSearchQuery("")} className="text-xs">
                      Clear Search
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      <span>Create Template</span>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              /* User's Templates Cards */
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((tmpl: any) => (
                  <Card
                    key={tmpl.id}
                    className="flex flex-col overflow-hidden hover:shadow-md transition-shadow border-slate-200 rounded-xl bg-white"
                  >
                    <CardHeader className="p-4 pb-3 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-sm font-bold truncate text-slate-900">
                            {tmpl.name}
                          </CardTitle>
                          <CardDescription className="text-xs truncate text-slate-500 mt-0.5">
                            {tmpl.subject}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0 font-medium">
                          {tmpl.category || "Custom"}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 flex-1 flex flex-col justify-center bg-slate-50/30">
                      <div 
                        className="relative h-44 rounded-lg border border-slate-200 bg-white overflow-hidden group/thumb cursor-pointer shadow-xs"
                        onClick={() => setPreviewTemplate(tmpl)}
                      >
                        <iframe
                          srcDoc={tmpl.htmlContent
                            ?.replace(/\{\{firstName\}\}/g, "Alex")
                            ?.replace(/\{\{name\}\}/g, "Alex Morgan")
                            ?.replace(/\{\{email\}\}/g, "alex@example.com")
                            ?.replace(/\{\{unsubscribe_url\}\}/g, "#")
                          }
                          title={tmpl.name}
                          className="w-full h-full pointer-events-none scale-[0.68] origin-top-left"
                          style={{ width: "147%", height: "147%" }}
                          sandbox="allow-same-origin"
                        />
                        <div className="absolute inset-0 bg-slate-900/0 group-hover/thumb:bg-slate-900/30 transition-all flex items-center justify-center">
                          <span className="opacity-0 group-hover/thumb:opacity-100 transition-opacity bg-white text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5 text-emerald-600" /> Click to Preview
                          </span>
                        </div>
                      </div>

                      {tmpl.previewText && (
                        <p className="text-[11px] text-slate-400 mt-2 truncate italic">
                          &ldquo;{tmpl.previewText}&rdquo;
                        </p>
                      )}
                    </CardContent>

                    <CardFooter className="py-2.5 px-4 flex items-center justify-between border-t border-slate-100 bg-white text-xs">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewTemplate(tmpl)}
                          className="text-slate-600 hover:text-slate-900 text-xs h-8 px-2"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Preview
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleCopyHtml(tmpl, e)}
                          className="text-slate-600 hover:text-slate-900 text-xs h-8 px-2"
                        >
                          {copiedId === (tmpl.id || tmpl.name) ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-400 mr-1" />
                          )}
                          <span>{copiedId === (tmpl.id || tmpl.name) ? "Copied" : "HTML"}</span>
                        </Button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => setLocation(`/email-campaigns/new?template=${encodeURIComponent(tmpl.name)}`)}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-8 px-2.5 gap-1 font-medium shadow-xs"
                        >
                          <Send className="w-3 h-3" /> Campaign
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCustom(tmpl)}
                          className="text-xs h-8 px-2"
                        >
                          <Edit className="w-3 h-3 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(tmpl.id)}
                          className="text-xs h-8 px-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal: Create Template Starting Point */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-2xl p-6 rounded-2xl">
            <DialogHeader className="mb-3">
              <DialogTitle className="text-lg font-bold text-slate-900">
                Choose a Starting Template
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Select a blank canvas or choose from our 6 official curated business presets.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Option: Blank */}
              <div
                onClick={handleCreateBlank}
                className="p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/20 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors flex items-center justify-center">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700">
                      Blank Responsive Template
                    </h4>
                    <p className="text-xs text-slate-500">
                      Start fresh with clean responsive structure and customizable branding
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="text-xs font-semibold text-emerald-700">
                  Select →
                </Button>
              </div>

              {/* 6 Official Presets */}
              <div className="pt-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Curated Business Presets
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SYSTEM_TEMPLATES.map((preset) => (
                    <div
                      key={preset.name}
                      onClick={() => handleStartFromPreset(preset)}
                      className="p-3 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/30 transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 line-clamp-1">
                            {preset.name}
                          </span>
                          <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">
                            Preset
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {preset.description}
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-emerald-700">
                        <span>Use This Preset</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Full Screen Template Preview Dialog */}
        <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl">
            <DialogHeader className="p-4 border-b border-slate-200 bg-slate-50 flex flex-row items-center justify-between">
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  {previewTemplate?.name}
                  <Badge variant="outline" className="text-[10px] uppercase font-mono">
                    {previewTemplate?.category || "Email"}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Subject: <span className="text-slate-800 font-medium">{previewTemplate?.subject}</span>
                </DialogDescription>
              </div>

              <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg border text-xs mr-6">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-all ${
                    previewDevice === "desktop" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" /> Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-all ${
                    previewDevice === "mobile" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Mobile
                </button>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-auto bg-slate-100 p-4 sm:p-6 flex justify-center items-start">
              <div
                className={`transition-all duration-300 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden ${
                  previewDevice === "mobile" ? "w-[380px] border-[8px] border-slate-800 rounded-[32px]" : "w-full max-w-[620px]"
                }`}
              >
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="ml-2 font-mono text-[11px] truncate text-slate-600">
                      {previewTemplate?.subject}
                    </span>
                  </div>
                </div>

                <iframe
                  srcDoc={previewTemplate?.htmlContent
                    ?.replace(/\{\{firstName\}\}/g, "Alex")
                    ?.replace(/\{\{name\}\}/g, "Alex Morgan")
                    ?.replace(/\{\{email\}\}/g, "alex@example.com")
                    ?.replace(/\{\{unsubscribe_url\}\}/g, "#")
                  }
                  title="Full Template Preview"
                  className="w-full border-0"
                  style={{ height: previewDevice === "mobile" ? "520px" : "560px" }}
                  sandbox="allow-same-origin"
                />
              </div>
            </div>

            <DialogFooter className="p-3 border-t border-slate-200 bg-white flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyHtml(previewTemplate)}
                className="text-xs h-8 gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Raw HTML</span>
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPreviewTemplate(null)}>
                  Close
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-8 font-semibold"
                  onClick={() => {
                    const tmpl = previewTemplate;
                    setPreviewTemplate(null);
                    handleEditCustom(tmpl);
                  }}
                >
                  <Edit className="w-3.5 h-3.5 mr-1" /> Edit in Builder
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
