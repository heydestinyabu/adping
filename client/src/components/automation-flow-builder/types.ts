export type NodeKind =
  | "start"
  | "conditions"
  | "custom_reply"
  | "user_reply"
  | "time_gap"
  | "send_template"
  | "assign_user"
  | "webhook"
  | "end"
  | "add_to_group"
  | "update_contact"
  | "set_variable"
  | "send_location"
  | "send_list_message"
  | "send_media"
  | "mark_as_read";

export interface ListSection {
  title: string;
  rows: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
}

export interface BuilderNodeData {
  kind: NodeKind;
  label?: string;
  message?: string;
  imageFile?: File | null;
  imagePreview?: string;
  videoFile?: File | null;
  videoPreview?: string;
  audioFile?: File | null;
  audioPreview?: string;
  documentFile?: File | null;
  documentPreview?: string;
  question?: string;
  saveAs?: string;
  delay?: number;
  templateId?: string;
  assigneeId?: string;
  conditionType?: "keyword" | "contains" | "equals" | "starts_with";
  keywords?: string[];
  matchType?: "any" | "all";
  buttons?: Array<{
    id: string;
    text: string;
    action: "next" | "custom";
    value?: string;
  }>;
  webhookUrl?: string;
  webhookMethod?: "GET" | "POST" | "PUT";
  webhookHeaders?: Record<string, string>;
  webhookBody?: string;
  endMessage?: string;
  groupId?: string;
  groupName?: string;
  contactField?: string;
  contactFieldValue?: string;
  variableName?: string;
  variableValue?: string;
  variableSource?: "static" | "from_message" | "from_webhook";
  latitude?: string;
  longitude?: string;
  locationName?: string;
  locationAddress?: string;
  listButtonText?: string;
  listSections?: ListSection[];
  mediaType?: "image" | "video" | "audio" | "document";
  mediaUrl?: string;
  mediaId?: string;
  mediaSourceType?: "url" | "upload";
  mediaFileName?: string;
  mediaCaption?: string;
  [key: string]: unknown;
}

export interface AutomationFlowBuilderProps {
  automation?: any;
  channelId?: string;
  onClose: () => void;
  onDraftSaved?: () => void;
}

export interface Template {
  id: string;
  name: string;
  status: string;
  whatsappTemplateId?: string;
  variables?: string[];
}

export interface Member {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}

export interface CustomEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  style?: React.CSSProperties;
  markerEnd?: string;
  setEdges: React.Dispatch<React.SetStateAction<any[]>>;
}
