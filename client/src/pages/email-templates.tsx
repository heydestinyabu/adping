import { useState, useMemo } from "react";
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
  Sparkles, Mail, Smartphone, Monitor, CheckCircle2 
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TemplateBuilder } from "@/components/email/TemplateBuilder";
import { SYSTEM_TEMPLATES } from "@/components/email/SystemTemplates";

export default function EmailTemplatesPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTemplate, setActiveTemplate] = useState<any | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<"all" | "custom" | "system">("all");

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["/api/email/templates"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/email/templates");
      return res.json();
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = data.id ? `/api/email/templates/${data.id}` : "/api/email/templates";
      const method = data.id ? "PUT" : "POST";
      const res = await apiRequest(method, url, data);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/templates"] });
      toast({ title: "Template saved successfully" });
      setIsBuilderOpen(false);
      setActiveTemplate(null);
    },
    onError: (err: any) => {
      toast({ title: "Failed to save template", description: err.message, variant: "destructive" });
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

  // Combine database templates with built-in system templates if not already present in DB
  const allTemplates = useMemo(() => {
    const list = [...(templates || [])];
    // Check if any system template is missing from DB list
    for (const sys of SYSTEM_TEMPLATES) {
      if (!list.some(t => t.name.toLowerCase() === sys.name.toLowerCase())) {
        list.push({ ...sys, id: `sys-${sys.name.toLowerCase().replace(/\s+/g, '-')}` });
      }
    }
    return list;
  }, [templates]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return allTemplates.filter(t => {
      if (selectedTab === "custom" && t.isSystem) return false;
      if (selectedTab === "system" && !t.isSystem) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.name?.toLowerCase().includes(q) ||
        t.subject?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      );
    });
  }, [allTemplates, selectedTab, searchQuery]);

  const handleCreateNew = () => {
    setActiveTemplate({
      name: "New Custom Template",
      subject: "Important announcement from ADping",
      previewText: "Preview text for inbox snippet",
      category: "general",
      htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
  <h2 style="color: #01594F;">Hello {{firstName}},</h2>
  <p>Write your email message here.</p>
  <div style="margin: 28px 0;">
    <a href="#" style="background: #00A854; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Take Action</a>
  </div>
  <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px;">
    To stop receiving updates, <a href="{{unsubscribe_url}}" style="color: #64748b;">unsubscribe here</a>.
  </p>
</div>`
    });
    setIsBuilderOpen(true);
  };

  const handleEdit = (tmpl: any) => {
    setActiveTemplate(tmpl);
    setIsBuilderOpen(true);
  };

  const handleClone = (tmpl: any) => {
    setActiveTemplate({
      name: `${tmpl.name} (Customized)`,
      subject: tmpl.subject,
      previewText: tmpl.previewText || "",
      category: tmpl.category || "marketing",
      htmlContent: tmpl.htmlContent,
      jsonContent: tmpl.jsonContent || null,
      isSystem: false,
    });
    setIsBuilderOpen(true);
  };

  return (
    <div className="flex-1 dots-bg min-h-screen flex flex-col">
      <Header
        title={isBuilderOpen ? (activeTemplate?.id ? "Edit Template" : "New Email Template") : "Email Templates"}
        subtitle="Design, customize, and manage responsive email marketing templates."
      />

      <main className="p-4 sm:p-6 my-2 flex-1 max-w-7xl w-full mx-auto">
        {isBuilderOpen ? (
          <div className="h-[calc(100vh-140px)]">
            <TemplateBuilder 
              initialData={activeTemplate} 
              onSave={async (data) => {
                await saveMutation.mutateAsync({
                  ...(activeTemplate?.id && !activeTemplate?.id.startsWith("sys-") ? { id: activeTemplate.id } : {}),
                  ...data,
                });
              }}
              onCancel={() => {
                setIsBuilderOpen(false);
                setActiveTemplate(null);
              }}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedTab("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    selectedTab === "all" ? "bg-emerald-700 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  All ({allTemplates.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTab("system")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    selectedTab === "system" ? "bg-emerald-700 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-emerald-400" /> System Templates ({SYSTEM_TEMPLATES.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTab("custom")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    selectedTab === "custom" ? "bg-emerald-700 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  My Templates ({templates.filter((t: any) => !t.isSystem).length})
                </button>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>
                <Button onClick={handleCreateNew} className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-9 font-medium shrink-0">
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Create Template
                </Button>
              </div>
            </div>

            {/* Template Grid */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                <p className="text-sm text-gray-500">Loading templates...</p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed rounded-xl bg-white p-8">
                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-900">No templates found</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                  {searchQuery ? "Try refining your search query." : "Get started by customizing one of the built-in system templates or create a blank one."}
                </p>
                <Button onClick={handleCreateNew} className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" /> New Template
                </Button>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((tmpl: any) => {
                  const isSys = tmpl.isSystem || String(tmpl.id).startsWith("sys-");

                  return (
                    <Card key={tmpl.id || tmpl.name} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow border-gray-200">
                      <CardHeader className="pb-3 border-b bg-gray-50/50">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <CardTitle className="text-sm font-semibold truncate text-gray-900">{tmpl.name}</CardTitle>
                            <CardDescription className="text-xs truncate mt-0.5">{tmpl.subject}</CardDescription>
                          </div>
                          {isSys ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-[10px] shrink-0 font-medium">
                              Built-in
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              Custom
                            </Badge>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 flex-1 flex flex-col justify-center">
                        <div 
                          className="relative h-44 rounded-lg border border-gray-200 bg-white overflow-hidden group cursor-pointer shadow-inner"
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
                            className="w-full h-full pointer-events-none scale-75 origin-top-left"
                            style={{ width: "133.33%", height: "133.33%" }}
                            sandbox="allow-same-origin"
                          />
                          <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-all flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5 text-emerald-600" /> Click to Preview
                            </span>
                          </div>
                        </div>

                        {tmpl.previewText && (
                          <p className="text-[11px] text-gray-400 mt-2 truncate italic">
                            &ldquo;{tmpl.previewText}&rdquo;
                          </p>
                        )}
                      </CardContent>

                      <CardFooter className="pt-2 pb-3 px-4 flex items-center justify-between border-t bg-gray-50/70 text-xs">
                        <Button variant="ghost" size="sm" onClick={() => setPreviewTemplate(tmpl)} className="text-gray-600 hover:text-gray-900 text-xs h-8 px-2.5">
                          <Eye className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Preview
                        </Button>

                        <div className="flex items-center gap-1.5">
                          <Button variant="outline" size="sm" onClick={() => handleClone(tmpl)} className="text-xs h-8 px-2.5">
                            <Copy className="w-3.5 h-3.5 mr-1 text-gray-500" /> {isSys ? "Use Template" : "Clone"}
                          </Button>

                          {!isSys && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleEdit(tmpl)} className="text-xs h-8 px-2.5">
                                <Edit className="w-3.5 h-3.5 mr-1 text-gray-500" /> Edit
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(tmpl.id)} className="text-xs h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Full Screen Template Preview Dialog */}
        <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-4 border-b bg-gray-50 flex flex-row items-center justify-between">
              <div>
                <DialogTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  {previewTemplate?.name}
                  <Badge variant="outline" className="text-[10px] uppercase font-mono">
                    {previewTemplate?.category || "email"}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 mt-0.5">
                  Subject: <span className="text-gray-800 font-medium">{previewTemplate?.subject}</span>
                </DialogDescription>
              </div>

              <div className="flex items-center bg-gray-200/80 p-0.5 rounded-lg border text-xs mr-6">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium ${
                    previewDevice === "desktop" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" /> Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium ${
                    previewDevice === "mobile" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Mobile
                </button>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-auto bg-gray-100 p-6 flex justify-center items-start">
              <div
                className={`transition-all duration-300 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${
                  previewDevice === "mobile" ? "w-[380px]" : "w-full max-w-[680px]"
                }`}
              >
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <span className="ml-2 font-mono text-[11px] truncate">{previewTemplate?.subject}</span>
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
                  style={{ height: "550px" }}
                  sandbox="allow-same-origin"
                />
              </div>
            </div>

            <DialogFooter className="p-3 border-t bg-white flex items-center justify-between">
              <span className="text-xs text-gray-400">Tokens like <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">{"{{firstName}}"}</code> automatically populate from recipients.</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPreviewTemplate(null)}>
                  Close
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white"
                  onClick={() => {
                    const tmpl = previewTemplate;
                    setPreviewTemplate(null);
                    handleClone(tmpl);
                  }}
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5" /> Use This Template
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
