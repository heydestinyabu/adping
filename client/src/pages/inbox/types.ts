import type { Conversation, Contact } from "@shared/schema";

export interface Message {
  id: string;
  conversationId: string;
  whatsappMessageId?: string;
  fromUser: boolean;
  direction: string;
  content: string;
  type: string;
  messageType: string;
  mediaId?: string;
  mediaUrl?: string;
  mediaMimeType?: string;
  status?: string;
  errorDetails?: any;
  metadata?: {
    filePath?: string;
    fileSize?: number;
    mimeType?: string;
    originalName?: string;
    cloudUrl?: string;
    fileName?: string;
    buttons?: { id?: string; text: string }[];
  };
  createdAt: string;
}

export type ConversationWithContact = Conversation & { contact?: Contact };
