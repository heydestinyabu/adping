// setMeta.ts
export interface MetaOptions {
  title?: string;
  favicon?: string;
  description?: string;
  keywords?: string;
  currency?: string;
  country?: string;
  supportEmail?: string;
}

export function setMeta(options: MetaOptions) {
  const head = document.head;

  // ---- Title ----
  if (options.title) {
    let cleanTitle = options.title.trim();
    if (!cleanTitle || cleanTitle.toLowerCase().includes("whatsway") || cleanTitle === "Your App Name") {
      cleanTitle = "ADping — WhatsApp Marketing & Business Automation Platform";
    }
    document.title = cleanTitle;
  }

  // ---- Favicon ----
  let rawFavicon = options.favicon?.trim();
  if (!rawFavicon || rawFavicon.toLowerCase().includes("whatsway") || rawFavicon.includes("null")) {
    rawFavicon = "/favicon.svg";
  }

  // Remove any legacy/broken icon tags
  head.querySelectorAll("link[rel*='icon']").forEach((el) => el.remove());

  // Add primary favicon
  const link = document.createElement("link");
  link.rel = "icon";
  if (rawFavicon.endsWith(".svg") || rawFavicon.includes(".svg")) {
    link.type = "image/svg+xml";
  } else if (rawFavicon.endsWith(".png")) {
    link.type = "image/png";
  } else {
    link.type = "image/x-icon";
  }
  link.href = rawFavicon;
  head.appendChild(link);

  // Add shortcut icon link for older browsers
  const shortcut = document.createElement("link");
  shortcut.rel = "shortcut icon";
  if (rawFavicon.endsWith(".svg") || rawFavicon.includes(".svg")) {
    shortcut.type = "image/svg+xml";
  }
  shortcut.href = rawFavicon;
  head.appendChild(shortcut);

  // ---- Description ----
  if (options.description) {
    let cleanDesc = options.description.trim();
    if (cleanDesc.toLowerCase().includes("whatsway")) {
      cleanDesc = "ADping — Next-Gen WhatsApp Marketing & Business Automation Platform. Reach. Engage. Convert.";
    }
    let descTag = head.querySelector<HTMLMetaElement>("meta[name='description']");
    if (!descTag) {
      descTag = document.createElement("meta");
      descTag.name = "description";
      head.appendChild(descTag);
    }
    descTag.content = cleanDesc;
  }

  // ---- Keywords ----
  if (options.keywords) {
    let cleanKeywords = options.keywords.replace(/whatsway/gi, "ADping");
    let keywordsTag = head.querySelector<HTMLMetaElement>("meta[name='keywords']");
    if (!keywordsTag) {
      keywordsTag = document.createElement("meta");
      keywordsTag.name = "keywords";
      head.appendChild(keywordsTag);
    }
    keywordsTag.content = cleanKeywords;
  }
}