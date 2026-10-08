import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  Sparkles,
  Key,
  Cpu,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  Loader2,
  RefreshCw,
  BookOpen,
  Smartphone,
  Check,
  Zap,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useChannelContext } from "@/contexts/channel-context";
import { useAuth } from "@/contexts/auth-context";
import AITrainingPanel from "@/pages/widget-builder/AITrainingPanel";

const PROVIDERS = [
  { id: "openai", name: "OpenAI", defaultEndpoint: "https://api.openai.com/v1" },
  { id: "anthropic", name: "Anthropic Claude", defaultEndpoint: "https://api.anthropic.com/v1" },
  { id: "gemini", name: "Google Gemini", defaultEndpoint: "https://generativelanguage.googleapis.com/v1beta" },
  { id: "groq", name: "Groq Cloud", defaultEndpoint: "https://api.groq.com/openai/v1" },
  { id: "custom", name: "Custom OpenAI Compatible", defaultEndpoint: "http://localhost:11434/v1" },
];

const MODEL_PRESETS: Record<string, string[]> = {
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
  anthropic: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"],
  gemini: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"],
  groq: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
  custom: ["local-model", "deepseek-chat", "mistral-large"],
};

export default function AISettings(): JSX.Element {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { selectedChannel, channels: contextChannels } = useChannelContext();

  const [activeSubTab, setActiveSubTab] = useState<"model" | "training">("model");
  const [showApiKey, setShowApiKey] = useState(false);

  // Fetch channels if not in context
  const { data: rawFetchedChannels } = useQuery<any>({
    queryKey: ["/api/channels"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/channels");
        const json = await res.json();
        return Array.isArray(json) ? json : (json?.data || []);
      } catch {
        return [];
      }
    },
  });

  const availableChannels: any[] = Array.isArray(contextChannels) && contextChannels.length > 0
    ? contextChannels
    : Array.isArray(rawFetchedChannels)
    ? rawFetchedChannels
    : rawFetchedChannels?.data || [];

  const allChannels = availableChannels;
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");

  useEffect(() => {
    if (selectedChannel?.id) {
      setSelectedChannelId(selectedChannel.id);
    } else if (allChannels.length > 0 && !selectedChannelId) {
      setSelectedChannelId(allChannels[0].id);
    }
  }, [selectedChannel, allChannels, selectedChannelId]);

  // Fetch AI Settings from backend
  const {
    data: rawAiSettings = [],
    isLoading: isLoadingAiSettings,
    refetch: refetchAiSettings,
  } = useQuery<any>({
    queryKey: ["/api/ai-settings"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/ai-settings");
        if (!res.ok) return [];
        const json = await res.json();
        return Array.isArray(json) ? json : (json?.data || []);
      } catch {
        return [];
      }
    },
  });

  const aiSettingsList: any[] = Array.isArray(rawAiSettings)
    ? rawAiSettings
    : (rawAiSettings?.data || []);

  // Diagnostics for current channel
  const { data: diagnostics, refetch: refetchDiagnostics } = useQuery<any>({
    queryKey: ["/api/ai-settings/diagnostics", selectedChannelId],
    queryFn: async () => {
      if (!selectedChannelId) return null;
      try {
        const res = await apiRequest("GET", `/api/ai-settings/diagnostics?channelId=${selectedChannelId}`);
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
    enabled: !!selectedChannelId,
  });

  // Form State
  const [provider, setProvider] = useState<string>("openai");
  const [apiKey, setApiKey] = useState<string>("");
  const [model, setModel] = useState<string>("gpt-4o-mini");
  const [endpoint, setEndpoint] = useState<string>("https://api.openai.com/v1");
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(2048);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [triggerWords, setTriggerWords] = useState<string>("");
  const [existingSettingId, setExistingSettingId] = useState<string | null>(null);

  // Load current channel setting into form state
  useEffect(() => {
    const matched = selectedChannelId
      ? aiSettingsList.find((s: any) => s.channelId === selectedChannelId)
      : aiSettingsList[0];

    if (matched) {
      setExistingSettingId(matched.id);
      setProvider(matched.provider || "openai");
      setApiKey(matched.apiKey || "");
      setModel(matched.model || "gpt-4o-mini");
      setEndpoint(matched.endpoint || "https://api.openai.com/v1");
      setTemperature(parseFloat(matched.temperature) || 0.7);
      setMaxTokens(parseInt(matched.maxTokens, 10) || 2048);
      setIsActive(Boolean(matched.isActive));
      const words = Array.isArray(matched.words) ? matched.words.join(", ") : matched.words || "";
      setTriggerWords(words);
    } else {
      setExistingSettingId(null);
      setApiKey("");
      setModel("gpt-4o-mini");
      setEndpoint("https://api.openai.com/v1");
      setTemperature(0.7);
      setMaxTokens(2048);
      setIsActive(false);
      setTriggerWords("");
    }
  }, [selectedChannelId, aiSettingsList]);

  // Handle Provider Change
  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    const pObj = PROVIDERS.find((p) => p.id === newProvider);
    if (pObj) {
      setEndpoint(pObj.defaultEndpoint);
    }
    const presets = MODEL_PRESETS[newProvider];
    if (presets && presets.length > 0) {
      setModel(presets[0]);
    }
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!apiKey.trim()) {
        throw new Error("API Key is required to enable AI responses.");
      }

      const wordsArray = triggerWords
        .split(",")
        .map((w) => w.trim())
        .filter(Boolean);

      const payload = {
        channelId: selectedChannelId || undefined,
        provider,
        apiKey: apiKey.trim(),
        model: model.trim(),
        endpoint: endpoint.trim(),
        temperature: temperature.toString(),
        maxTokens: maxTokens.toString(),
        isActive,
        words: wordsArray,
      };

      let res;
      if (existingSettingId) {
        res = await apiRequest("PUT", `/api/ai-settings/${existingSettingId}`, payload);
      } else {
        res = await apiRequest("POST", "/api/ai-settings", payload);
      }

      if (!res.ok) {
        const errText = await res.text();
        let errMsg = "Failed to save AI settings";
        try {
          errMsg = JSON.parse(errText).error || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-settings/diagnostics"] });
      toast({ title: "AI Configuration Saved", description: "Your AI auto-responder settings are now active." });
    },
    onError: (err: any) => {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    },
  });

  // Website widget site context for training panel
  const { data: activeSite } = useQuery<any>({
    queryKey: ["/api/active-site", selectedChannelId],
    queryFn: async () => {
      if (!selectedChannelId) return null;
      try {
        const res = await apiRequest("GET", `/api/active-site?channelId=${selectedChannelId}`);
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
    enabled: !!selectedChannelId,
  });

  const [widgetTrainingConfig, setWidgetTrainingConfig] = useState<any>({
    aiTone: "professional",
    aiMaxResponseLength: 500,
    aiFallbackMessage: "I'm sorry, I couldn't find an answer to your question. Let me connect you with a team member who can help.",
    systemPrompt: "",
    trainFromKB: false,
    escalationRules: { enabled: false, maxAttempts: 3, triggerPhrases: [], escalationMessage: "" },
  });

  useEffect(() => {
    if (activeSite) {
      const stored = activeSite.widgetConfig || activeSite.aiTrainingConfig || {};
      setWidgetTrainingConfig({
        aiTone: stored.aiTone || "professional",
        aiMaxResponseLength: stored.aiMaxResponseLength || 500,
        aiFallbackMessage: stored.aiFallbackMessage || "Let me connect you with a team member.",
        systemPrompt: stored.systemPrompt || "",
        trainFromKB: stored.trainFromKB ?? false,
        escalationRules: stored.escalationRules || { enabled: false, maxAttempts: 3, triggerPhrases: [], escalationMessage: "" },
      });
    }
  }, [activeSite]);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-card p-4 rounded-xl border border-gray-200 dark:border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              AI Assistant & Auto-Reply Engine
              {isActive ? (
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 text-[10px] font-semibold">
                  ● Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px]">
                  Inactive
                </Badge>
              )}
            </h2>
            <p className="text-xs text-muted-foreground">
              Configure LLM providers, credentials, and parameters for automated WhatsApp & inbox replies.
            </p>
          </div>
        </div>

        {/* Channel Selector */}
        {allChannels.length > 0 && (
          <div className="flex items-center gap-2">
            <Label htmlFor="ai-channel-select" className="text-xs text-muted-foreground whitespace-nowrap">
              Channel:
            </Label>
            <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
              <SelectTrigger id="ai-channel-select" className="h-8 text-xs w-[180px]">
                <Smartphone className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent>
                {allChannels.map((c: any) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    {c.name || c.phoneNumber || `Channel ${c.id.slice(0, 6)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Sub-Tabs: Model Settings vs Knowledge Base */}
      <div className="flex items-center gap-2 border-b pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab("model")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
            activeSubTab === "model"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 dark:bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          Model & Credentials
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("training")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
            activeSubTab === "training"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 dark:bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Knowledge Base & Training
        </button>
      </div>

      {activeSubTab === "model" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Center 2 Cols: Main Configuration Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="p-4 pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      LLM Provider & Credentials
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Select your preferred AI service and enter the required API authorization key.
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label htmlFor="ai-active-toggle" className="text-xs font-medium cursor-pointer">
                      Auto-Reply
                    </Label>
                    <Switch
                      id="ai-active-toggle"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                {/* Provider Selection */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">AI Provider</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PROVIDERS.map((p) => {
                      const isSelected = provider === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleProviderChange(p.id)}
                          className={`p-2.5 rounded-lg border text-left transition-all ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-600 font-semibold"
                              : "hover:bg-slate-50 dark:hover:bg-muted/50 text-muted-foreground"
                          }`}
                        >
                          <div className="text-xs font-medium text-slate-900 dark:text-white flex items-center justify-between">
                            {p.name}
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* API Key */}
                <div className="space-y-1.5">
                  <Label htmlFor="ai-api-key" className="text-xs font-semibold flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-500" />
                    API Key
                  </Label>
                  <div className="relative">
                    <Input
                      id="ai-api-key"
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={provider === "openai" ? "sk-..." : "Enter your API key"}
                      className="text-xs font-mono pr-10 h-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Stored securely. Keys are scoped strictly to your workspace.
                  </p>
                </div>

                {/* Model Selection & Custom Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="ai-model-select" className="text-xs font-semibold">
                      Model Preset
                    </Label>
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger id="ai-model-select" className="h-9 text-xs">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {(MODEL_PRESETS[provider] || ["gpt-4o-mini"]).map((m) => (
                          <SelectItem key={m} value={m} className="text-xs font-mono">
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ai-model-custom" className="text-xs font-semibold">
                      Model Name (Override)
                    </Label>
                    <Input
                      id="ai-model-custom"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="e.g. gpt-4o"
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* API Endpoint (for custom / Ollama / Azure / Local) */}
                <div className="space-y-1.5">
                  <Label htmlFor="ai-endpoint" className="text-xs font-semibold">
                    API Base Endpoint
                  </Label>
                  <Input
                    id="ai-endpoint"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    className="h-9 text-xs font-mono"
                  />
                </div>

                {/* Temperature & Max Tokens */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <Label className="font-semibold">Temperature ({temperature})</Label>
                      <span className="text-[10px] text-muted-foreground">
                        {temperature <= 0.3 ? "Precise" : temperature <= 0.7 ? "Balanced" : "Creative"}
                      </span>
                    </div>
                    <Slider
                      min={0}
                      max={1}
                      step={0.05}
                      value={[temperature]}
                      onValueChange={(val) => setTemperature(val[0])}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ai-max-tokens" className="text-xs font-semibold">
                      Max Response Tokens
                    </Label>
                    <Input
                      id="ai-max-tokens"
                      type="number"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(parseInt(e.target.value, 10) || 1024)}
                      className="h-9 text-xs"
                      min={100}
                      max={8192}
                    />
                  </div>
                </div>

                {/* Trigger Words */}
                <div className="space-y-1.5 pt-1">
                  <Label htmlFor="ai-trigger-words" className="text-xs font-semibold flex items-center justify-between">
                    <span>Trigger Words / Keywords</span>
                    <span className="text-[10px] text-muted-foreground font-normal">Optional filter</span>
                  </Label>
                  <Input
                    id="ai-trigger-words"
                    value={triggerWords}
                    onChange={(e) => setTriggerWords(e.target.value)}
                    placeholder="e.g. price, support, help, buy, info (or leave blank to trigger on all messages)"
                    className="text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Comma-separated. When empty or set to "*", AI will respond to every message received on this channel.
                  </p>
                </div>
              </CardContent>

              <CardFooter className="p-4 border-t flex justify-end gap-3">
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5"
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Save AI Configuration
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Right Column: Live Status & Diagnostics */}
          <div className="space-y-4">
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="p-4 pb-2 border-b bg-slate-50/50 dark:bg-muted/40">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Live Channel Diagnostics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-muted-foreground">Channel:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {allChannels.find((c: any) => c.id === selectedChannelId)?.name || selectedChannelId || "Global"}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-muted-foreground">Auto-Responder:</span>
                  <span className="font-semibold">
                    {isActive ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Enabled
                      </span>
                    ) : (
                      <span className="text-slate-400">Disabled</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-muted-foreground">Provider:</span>
                  <span className="font-mono font-medium text-indigo-600 uppercase text-[11px]">{provider}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-muted-foreground">Active Model:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 text-[11px]">{model}</span>
                </div>

                {diagnostics && (
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] text-muted-foreground font-semibold">Last Execution Info:</div>
                    <div className="bg-slate-50 dark:bg-muted/60 p-2 rounded border text-[11px] space-y-1">
                      <div>
                        <span className="text-muted-foreground">Last Skip Reason: </span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {diagnostics.lastSkipReason || "None (AI responded successfully)"}
                        </span>
                      </div>
                      {diagnostics.lastSkipAt && (
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(diagnostics.lastSkipAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    refetchAiSettings();
                    refetchDiagnostics();
                    toast({ title: "Diagnostics refreshed" });
                  }}
                  className="w-full text-xs h-8 gap-1.5 mt-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh Diagnostics
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-sm bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
              <CardContent className="p-4 space-y-2 text-xs">
                <div className="font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  How WhatsApp AI Works
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Incoming WhatsApp messages pass through the webhook handler. If Auto-Reply is active and the message matches your trigger words, the AI generates a contextual answer and replies automatically.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="p-4 pb-2 border-b">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Website Chatbot Training & Knowledge Base
            </CardTitle>
            <CardDescription className="text-xs">
              Upload custom Q&A pairs, documents, and train your AI knowledge base.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <AITrainingPanel
              config={widgetTrainingConfig}
              updateConfig={(k, v) => setWidgetTrainingConfig((prev: any) => ({ ...prev, [k]: v }))}
              siteId={activeSite?.id}
              channelId={selectedChannelId}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
