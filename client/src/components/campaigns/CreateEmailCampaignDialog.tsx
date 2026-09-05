import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
  groups?: any[];
}

export function CreateEmailCampaignDialog({ open, onOpenChange, userId, groups = [] }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [senderId, setSenderId] = useState("");
  const [audienceType, setAudienceType] = useState("all");
  const [excludedContactIds, setExcludedContactIds] = useState<string[]>([]);
  const [trackOpens, setTrackOpens] = useState(true);
  const [trackClicks, setTrackClicks] = useState(true);
  const [scheduledAt, setScheduledAt] = useState("");

  // Fetch contacts for the selected group
  const { data: groupContacts, isLoading: isLoadingContacts } = useQuery({
    queryKey: ["/api/user/contacts", userId, audienceType],
    enabled: open && !!userId && audienceType !== "all",
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/user/contacts/${userId}?limit=5000&group=${audienceType}`);
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    }
  });

  const { data: templates } = useQuery({
    queryKey: ["/api/email/templates"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/email/templates");
      return res.json();
    },
    enabled: open
  });

  const { data: senders } = useQuery({
    queryKey: ["/api/email/senders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/email/senders");
      return res.json();
    },
    enabled: open
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/email/campaigns", data);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || body.error || "Failed to create campaign");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] }); // Main campaigns list
      toast({ title: "Email Campaign Created!", description: "Your campaign is now being sent in the background." });
      onOpenChange(false);
      
      // Reset form
      setName("");
      setSubject("");
      setTemplateId("");
      setSenderId("");
      setAudienceType("all");
      setExcludedContactIds([]);
      setScheduledAt("");
    },
    onError: (err: any) => {
      toast({ title: "Campaign blocked", description: err.message, variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !templateId || !senderId) {
      toast({ title: "Missing fields", description: "Name, Template, and Sender are required.", variant: "destructive" });
      return;
    }

    const tmpl = templates?.find((t: any) => t.id === templateId);

    createMutation.mutate({
      name,
      subject: subject || tmpl?.subject || "No Subject",
      emailTemplateId: templateId,
      emailSenderId: senderId,
      audienceType: audienceType === "all" ? "all" : "group",
      audienceParams: audienceType === "all" ? {} : { 
        groupIds: [audienceType],
        excludedContactIds 
      },
      htmlContent: tmpl?.htmlContent,
      plainTextContent: tmpl?.plainTextContent,
      trackOpens,
      trackClicks,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Email Campaign</DialogTitle>
          <DialogDescription>Setup your new email broadcast.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Campaign Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Summer Sale 2026" />
          </div>

          <div className="space-y-2">
            <Label>Sender Identity</Label>
            <Select value={senderId} onValueChange={setSenderId}>
              <SelectTrigger><SelectValue placeholder="Select sender..." /></SelectTrigger>
              <SelectContent>
                {senders?.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{s.fromName} ({s.fromEmail})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Email Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger><SelectValue placeholder="Select template..." /></SelectTrigger>
              <SelectContent>
                {templates?.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.name} {t.isSystem ? '(System)' : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Subject Line Override (Optional)</Label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Leave blank to use template default" />
          </div>

          <div className="space-y-2">
            <Label>Audience</Label>
            <Select 
              value={audienceType} 
              onValueChange={(val) => {
                setAudienceType(val);
                setExcludedContactIds([]); // reset exclusions on group change
              }}
            >
              <SelectTrigger><SelectValue placeholder="Select audience..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contacts</SelectItem>
                {groups?.map((g: any) => (
                  <SelectItem key={g.id} value={g.id}>Group: {g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {audienceType !== "all" && (
            <div className="space-y-2 border rounded-md p-3 max-h-48 overflow-y-auto">
              <Label className="text-xs text-muted-foreground mb-2 block">
                Select contacts to include in this broadcast:
              </Label>
              {isLoadingContacts ? (
                <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
              ) : groupContacts?.length > 0 ? (
                groupContacts.map((contact: any) => {
                  const isChecked = !excludedContactIds.includes(contact.id);
                  return (
                    <div key={contact.id} className="flex items-center space-x-2 py-1">
                      <Checkbox 
                        id={`contact-${contact.id}`} 
                        checked={isChecked}
                        onCheckedChange={(c: boolean) => {
                          if (c) {
                            setExcludedContactIds(prev => prev.filter(id => id !== contact.id));
                          } else {
                            setExcludedContactIds(prev => [...prev, contact.id]);
                          }
                        }}
                      />
                      <Label htmlFor={`contact-${contact.id}`} className="text-sm font-normal cursor-pointer flex-1">
                        {contact.name || "Unknown"} <span className="text-xs text-muted-foreground ml-1">({contact.email || contact.phone})</span>
                      </Label>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-muted-foreground italic p-2">No contacts in this group.</div>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="trackOpens" checked={trackOpens} onCheckedChange={(c: boolean) => setTrackOpens(c)} />
              <Label htmlFor="trackOpens">Track Opens</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="trackClicks" checked={trackClicks} onCheckedChange={(c: boolean) => setTrackClicks(c)} />
              <Label htmlFor="trackClicks">Track Clicks</Label>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <Label>Schedule (Optional)</Label>
            <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
            <p className="text-xs text-muted-foreground">Leave empty to send immediately.</p>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Campaign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
