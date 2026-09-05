declare global {
  interface Window {
    aiChatConfig?: {
      siteId: string;
      channelId: string;
      url: string;
    };
  }
}

export {};
