import { useRef, useState, useEffect } from "react";
import EmailEditor from "react-email-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, ArrowLeft, Code, Layout, Smartphone, Monitor, Eye, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TemplateBuilderProps {
  initialData?: any;
  onSave: (data: { name: string; category?: string; subject: string; jsonContent?: any; htmlContent: string; previewText: string }) => Promise<void>;
  onCancel: () => void;
}

export function TemplateBuilder({ initialData, onSave, onCancel }: TemplateBuilderProps) {
  const emailEditorRef = useRef<any>(null);
  const { toast } = useToast();
  
  const [name, setName] = useState(initialData?.name || "New Template");
  const [subject, setSubject] = useState(initialData?.subject || "Email Subject");
  const [previewText, setPreviewText] = useState(initialData?.previewText || "");
  const [category, setCategory] = useState(initialData?.category || "general");
  const [htmlContent, setHtmlContent] = useState<string>(initialData?.htmlContent || "");
  const [mode, setMode] = useState<"html" | "visual">(
    initialData?.jsonContent && Object.keys(initialData.jsonContent).length > 0 ? "visual" : "html"
  );
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditorLoaded, setIsEditorLoaded] = useState(false);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "visual" && isEditorLoaded && initialData?.jsonContent && Object.keys(initialData.jsonContent).length > 0 && emailEditorRef.current?.editor) {
      try {
        emailEditorRef.current.editor.loadDesign(initialData.jsonContent);
      } catch (err) {
        console.warn("Failed to load Unlayer design, falling back to HTML mode", err);
      }
    }
  }, [isEditorLoaded, initialData, mode]);

  const handleInsertTag = (tag: string) => {
    setHtmlContent(prev => prev + " " + tag);
    navigator.clipboard?.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 2000);
    toast({ title: `Copied ${tag} to clipboard & appended to editor` });
  };

  const handleSave = async () => {
    if (!name.trim() || !subject.trim()) {
      toast({ title: "Missing fields", description: "Template Name and Subject are required.", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    if (mode === "visual" && emailEditorRef.current?.editor) {
      emailEditorRef.current.editor.exportHtml(async (data: any) => {
        const { design, html } = data;
        try {
          await onSave({
            name,
            subject,
            category,
            previewText,
            jsonContent: design,
            htmlContent: html,
          });
        } catch (err: any) {
          console.error("Save failed", err);
          toast({ title: "Save failed", description: err.message, variant: "destructive" });
        } finally {
          setIsSaving(false);
        }
      });
    } else {
      try {
        if (!htmlContent.trim()) {
          toast({ title: "Empty template", description: "Please enter HTML content for your template.", variant: "destructive" });
          setIsSaving(false);
          return;
        }

        await onSave({
          name,
          subject,
          category,
          previewText,
          htmlContent,
          jsonContent: initialData?.jsonContent || null,
        });
      } catch (err: any) {
        console.error("Save failed", err);
        toast({ title: "Save failed", description: err.message, variant: "destructive" });
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
          </Button>

          <div className="flex items-center gap-3">
            <div>
              <Label className="text-[11px] font-semibold text-gray-500 uppercase">Template Name</Label>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="h-8 w-[190px] text-sm" 
                placeholder="e.g. Welcome Series"
              />
            </div>

            <div>
              <Label className="text-[11px] font-semibold text-gray-500 uppercase">Subject Line</Label>
              <Input 
                value={subject} 
                onChange={e => setSubject(e.target.value)} 
                className="h-8 w-[240px] text-sm" 
                placeholder="e.g. Welcome to ADping, {{name}}!"
              />
            </div>

            <div>
              <Label className="text-[11px] font-semibold text-gray-500 uppercase">Preview Text</Label>
              <Input 
                value={previewText} 
                onChange={e => setPreviewText(e.target.value)} 
                className="h-8 w-[190px] text-sm" 
                placeholder="Optional snippet"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center bg-gray-100 p-1 rounded-lg border text-xs">
            <button
              type="button"
              onClick={() => setMode("html")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                mode === "html" ? "bg-white text-emerald-800 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Code className="w-3.5 h-3.5" /> HTML & Live Preview
            </button>
            <button
              type="button"
              onClick={() => setMode("visual")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                mode === "visual" ? "bg-white text-emerald-800 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Layout className="w-3.5 h-3.5" /> Drag & Drop Builder
            </button>
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-700 hover:bg-emerald-800 text-white font-medium">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Template
          </Button>
        </div>
      </div>

      {/* Editor Content Area */}
      {mode === "visual" ? (
        <div className="flex-1 relative w-full bg-gray-100 flex flex-col">
          <EmailEditor
            ref={emailEditorRef}
            onLoad={() => setIsEditorLoaded(true)}
            options={{
              displayMode: "email",
              appearance: {
                theme: "modern_light",
              }
            }}
            style={{ minHeight: "calc(100vh - 200px)", width: "100%" }}
          />
          {!isEditorLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/80 z-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-sm text-gray-600">Loading drag & drop builder...</p>
              <Button variant="outline" size="sm" onClick={() => setMode("html")} className="mt-2">
                Switch to HTML & Live Preview instead
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-x divide-gray-200 overflow-hidden bg-gray-50">
          {/* Left: Code Editor & Merge Tags */}
          <div className="flex flex-col h-full overflow-hidden bg-white">
            <div className="p-3 border-b bg-gray-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">HTML Source</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-gray-400 mr-1">Insert:</span>
                {["{{firstName}}", "{{name}}", "{{email}}", "{{unsubscribe_url}}"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleInsertTag(tag)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-mono transition-colors"
                  >
                    {copiedTag === tag ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-2.5 h-2.5 text-emerald-500" />}
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 p-3 overflow-hidden">
              <Textarea
                value={htmlContent}
                onChange={e => setHtmlContent(e.target.value)}
                placeholder="Paste or write your HTML email code here..."
                className="w-full h-full font-mono text-xs p-3 leading-relaxed border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg resize-none"
              />
            </div>
          </div>

          {/* Right: Real-time Live Preview */}
          <div className="flex flex-col h-full overflow-hidden bg-gray-100">
            <div className="p-3 border-b bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Live Preview</span>
              </div>

              <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium ${
                    previewDevice === "desktop" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" /> Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium ${
                    previewDevice === "mobile" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Mobile
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex justify-center items-start">
              <div
                className={`transition-all duration-300 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden ${
                  previewDevice === "mobile" ? "w-[375px] my-2" : "w-full max-w-[680px]"
                }`}
                style={{ minHeight: "560px" }}
              >
                {/* Fake browser top bar */}
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <span className="ml-2 font-mono text-[11px] truncate">{subject || "No Subject"}</span>
                </div>

                <iframe
                  srcDoc={htmlContent
                    .replace(/\{\{firstName\}\}/g, "Alex")
                    .replace(/\{\{name\}\}/g, "Alex Morgan")
                    .replace(/\{\{email\}\}/g, "alex@example.com")
                    .replace(/\{\{unsubscribe_url\}\}/g, "#unsubscribe")
                  }
                  title="Live Email Preview"
                  className="w-full border-0"
                  style={{ height: "600px" }}
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
