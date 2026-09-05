import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Plus, Server, CheckCircle2, AlertCircle } from "lucide-react";

export default function EmailProviderSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [providerType, setProviderType] = useState("resend");
  const [config, setConfig] = useState<Record<string, string>>({ apiKey: "" });
  const [label, setLabel] = useState("Main Email Provider");
  const [defaultFromName, setDefaultFromName] = useState("");
  const [defaultFromEmail, setDefaultFromEmail] = useState("");

  const { data: providers, isLoading } = useQuery({
    queryKey: ["/api/email/providers"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/email/providers");
      return res.json();
    }
  });

  useEffect(() => {
    if (providers && providers.length > 0) {
      const active = providers.find((p: any) => p.isDefault) || providers[0];
      if (active) {
        setProviderType(active.providerType || "resend");
        setConfig(active.config || {});
        setLabel(active.label || "Main Email Provider");
        setDefaultFromName(active.defaultFromName || active.config?.defaultFromName || "");
        setDefaultFromEmail(active.defaultFromEmail || active.config?.defaultFromEmail || "");
      }
    }
  }, [providers]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/email/providers", data);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/providers"] });
      toast({ title: "Provider saved successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    }
  });

  const verifyMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/email/providers/verify", data);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Verification failed");
      return json;
    },
    onSuccess: () => {
      toast({ title: "Connection verified successfully!" });
    },
    onError: (err: any) => {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    }
  });

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-6 h-6 text-emerald-600" /></div>;

  const activeProvider = providers?.find((p: any) => p.isDefault) || providers?.[0];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Delivery Providers</CardTitle>
          <CardDescription>Configure which provider sends outbound emails for the platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Provider Type</Label>
              <Select value={providerType} onValueChange={(val) => {
                setProviderType(val);
                setConfig({}); // Reset config on change
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resend">Resend</SelectItem>
                  <SelectItem value="aws_ses">AWS SES</SelectItem>
                  <SelectItem value="sendgrid">SendGrid</SelectItem>
                  <SelectItem value="brevo">Brevo</SelectItem>
                  <SelectItem value="mailgun">Mailgun</SelectItem>
                  <SelectItem value="postmark">Postmark</SelectItem>
                  <SelectItem value="sparkpost">SparkPost</SelectItem>
                  <SelectItem value="smtp">Generic SMTP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Label</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Production SendGrid" />
            </div>

            {/* Platform Default Identity */}
            <div className="space-y-2">
              <Label>Platform Default Sender Name</Label>
              <Input 
                value={defaultFromName} 
                onChange={(e) => setDefaultFromName(e.target.value)} 
                placeholder="e.g. Your Platform Name" 
              />
              <p className="text-xs text-muted-foreground">Default display name used for platform emails</p>
            </div>

            <div className="space-y-2">
              <Label>Platform Default Sender Email <span className="text-destructive">*</span></Label>
              <Input 
                value={defaultFromEmail} 
                onChange={(e) => setDefaultFromEmail(e.target.value)} 
                placeholder="e.g. noreply@yourdomain.com" 
              />
              <p className="text-xs text-muted-foreground">
                <strong>CRITICAL:</strong> Must be a domain verified on your email provider account (e.g. Resend domains). All tenant campaigns send through this address by default.
              </p>
            </div>

            {/* Provider specific config fields */}
            {providerType === "resend" && (
              <div className="space-y-2 md:col-span-2">
                <Label>API Key</Label>
                <Input type="password" value={config.apiKey || ""} onChange={(e) => setConfig({ ...config, apiKey: e.target.value })} />
              </div>
            )}
            
            {providerType === "aws_ses" && (
              <>
                <div className="space-y-2 md:col-span-2">
                  <Label>Region</Label>
                  <Input value={config.region || ""} onChange={(e) => setConfig({ ...config, region: e.target.value })} placeholder="us-east-1" />
                </div>
                <div className="space-y-2">
                  <Label>Access Key ID</Label>
                  <Input value={config.accessKeyId || ""} onChange={(e) => setConfig({ ...config, accessKeyId: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Secret Access Key</Label>
                  <Input type="password" value={config.secretAccessKey || ""} onChange={(e) => setConfig({ ...config, secretAccessKey: e.target.value })} />
                </div>
              </>
            )}

            {(providerType === "sendgrid" || providerType === "brevo" || providerType === "sparkpost") && (
              <div className="space-y-2 md:col-span-2">
                <Label>API Key</Label>
                <Input type="password" value={config.apiKey || ""} onChange={(e) => setConfig({ ...config, apiKey: e.target.value })} />
              </div>
            )}

            {providerType === "postmark" && (
              <div className="space-y-2 md:col-span-2">
                <Label>Server Token</Label>
                <Input type="password" value={config.serverToken || ""} onChange={(e) => setConfig({ ...config, serverToken: e.target.value })} />
              </div>
            )}

            {providerType === "mailgun" && (
              <>
                <div className="space-y-2 md:col-span-2">
                  <Label>Domain</Label>
                  <Input value={config.domain || ""} onChange={(e) => setConfig({ ...config, domain: e.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>API Key</Label>
                  <Input type="password" value={config.apiKey || ""} onChange={(e) => setConfig({ ...config, apiKey: e.target.value })} />
                </div>
              </>
            )}

            {providerType === "smtp" && (
              <>
                <div className="space-y-2 md:col-span-2">
                  <Label>Host</Label>
                  <Input value={config.host || ""} onChange={(e) => setConfig({ ...config, host: e.target.value })} placeholder="smtp.example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input type="number" value={config.port || ""} onChange={(e) => setConfig({ ...config, port: e.target.value })} placeholder="587" />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input value={config.user || ""} onChange={(e) => setConfig({ ...config, user: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={config.password || ""} onChange={(e) => setConfig({ ...config, password: e.target.value })} />
                </div>
              </>
            )}

          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => verifyMutation.mutate({ providerType, config })} disabled={verifyMutation.isPending}>
            {verifyMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Server className="w-4 h-4 mr-2" />}
            Verify Connection
          </Button>
          <Button onClick={() => saveMutation.mutate({ providerType, config, label, defaultFromName, defaultFromEmail, isDefault: true, isActive: true })} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Save & Set Active
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
