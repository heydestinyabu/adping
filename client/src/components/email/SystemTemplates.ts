export interface TemplateCustomFields {
  badge?: string;
  headline?: string;
  greeting?: string;
  bodyText?: string;
  buttonText?: string;
  buttonUrl?: string;
  calloutTitle?: string;
  calloutText?: string;
  footerText?: string;
}

export interface EmailTemplateDefinition {
  id?: string;
  name: string;
  subject: string;
  previewText: string;
  category: string;
  thumbnailColor: string;
  description: string;
  htmlContent: string;
  isSystem?: boolean;
  defaultFields?: TemplateCustomFields;
}

export function applyTemplateFields(html: string, fields: Partial<TemplateCustomFields>): string {
  let result = html;
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    // Replace text between editable tags
    const regex = new RegExp(`<!-- EDITABLE:${key} -->[\\s\\S]*?<!-- /EDITABLE:${key} -->`, "g");
    result = result.replace(regex, `<!-- EDITABLE:${key} -->${value}<!-- /EDITABLE:${key} -->`);
  }
  return result;
}

export function extractTemplateFields(html: string, defaults?: TemplateCustomFields): TemplateCustomFields {
  const fields: TemplateCustomFields = { ...(defaults || {}) };
  const keys: (keyof TemplateCustomFields)[] = [
    "badge",
    "headline",
    "greeting",
    "bodyText",
    "buttonText",
    "buttonUrl",
    "calloutTitle",
    "calloutText",
    "footerText"
  ];
  for (const key of keys) {
    const regex = new RegExp(`<!-- EDITABLE:${key} -->([\\s\\S]*?)<!-- /EDITABLE:${key} -->`);
    const match = html.match(regex);
    if (match && match[1] !== undefined) {
      fields[key] = match[1].trim();
    }
  }
  return fields;
}

export const SYSTEM_TEMPLATES: EmailTemplateDefinition[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. WELCOME & ONBOARDING
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "Welcome & Getting Started",
    subject: "Welcome to {{companyName}}! Let's get you set up 🚀",
    previewText: "Everything you need to get the most out of your new account in 3 easy steps.",
    category: "Welcome & Onboarding",
    thumbnailColor: "#2563EB",
    description: "A clean, high-conversion welcome email with getting-started milestones and clear call-to-action.",
    defaultFields: {
      badge: "🎉 WELCOME ABOARD",
      headline: "We are thrilled to have you with us!",
      greeting: "Hi {{firstName}},",
      bodyText: "Thank you for joining {{companyName}}. You are now part of a community of forward-thinking teams using our platform to connect, engage, and grow faster. To help you hit the ground running, we've prepared a quick 3-step checklist to guide your first win.",
      buttonText: "Go to Your Dashboard →",
      buttonUrl: "https://example.com/dashboard",
      calloutTitle: "Quick 3-Minute Quickstart:",
      calloutText: "1. Complete your workspace profile\n2. Invite your team members or collaborators\n3. Launch your first automated broadcast in under 2 minutes",
      footerText: "Sent with ❤️ by {{companyName}} • Need help? Reply directly to this email."
    },
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to {{companyName}}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 0; }
    .email-card { max-width: 580px; margin: 30px auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
    .email-header { background: #2563eb; padding: 32px 28px; text-align: left; }
    .email-body { padding: 32px 28px; }
    .badge { display: inline-block; background: #eff6ff; color: #1d4ed8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px; }
    .btn { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 14px 28px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 10px; margin: 20px 0; }
    .callout { background: #f8fafc; border-left: 4px solid #2563eb; padding: 18px 20px; border-radius: 8px; margin: 24px 0; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-line; }
    .footer { border-top: 1px solid #f1f5f9; padding: 24px 28px; font-size: 12px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="email-card">
    <div class="email-header">
      <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">{{companyName}}</h2>
    </div>
    <div class="email-body">
      <span class="badge"><!-- EDITABLE:badge -->🎉 WELCOME ABOARD<!-- /EDITABLE:badge --></span>
      <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; line-height: 1.3;"><!-- EDITABLE:headline -->We are thrilled to have you with us!<!-- /EDITABLE:headline --></h1>
      <p style="font-size: 15px; font-weight: 600; color: #334155; margin: 0 0 12px 0;"><!-- EDITABLE:greeting -->Hi {{firstName}},<!-- /EDITABLE:greeting --></p>
      <p style="font-size: 15px; line-height: 1.65; color: #475569; margin: 0 0 20px 0;"><!-- EDITABLE:bodyText -->Thank you for joining {{companyName}}. You are now part of a community of forward-thinking teams using our platform to connect, engage, and grow faster. To help you hit the ground running, we've prepared a quick 3-step checklist to guide your first win.<!-- /EDITABLE:bodyText --></p>
      <div style="text-align: center;">
        <a href="<!-- EDITABLE:buttonUrl -->https://example.com/dashboard<!-- /EDITABLE:buttonUrl -->" class="btn"><!-- EDITABLE:buttonText -->Go to Your Dashboard →<!-- /EDITABLE:buttonText --></a>
      </div>
      <div class="callout">
        <strong style="color: #0f172a; display: block; margin-bottom: 8px;"><!-- EDITABLE:calloutTitle -->Quick 3-Minute Quickstart:<!-- /EDITABLE:calloutTitle --></strong>
        <!-- EDITABLE:calloutText -->1. Complete your workspace profile
2. Invite your team members or collaborators
3. Launch your first automated broadcast in under 2 minutes<!-- /EDITABLE:calloutText -->
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 8px 0;"><!-- EDITABLE:footerText -->Sent with ❤️ by {{companyName}} • Need help? Reply directly to this email.<!-- /EDITABLE:footerText --></p>
      <p style="margin: 0;">&copy; {{year}} {{companyName}}. All rights reserved. • <a href="{{unsubscribe_url}}" style="color: #94a3b8; text-decoration: underline;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. PROMOTIONAL & FLASH SALES
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "Limited-Time Flash Sale",
    subject: "⚡ 48-Hour Exclusive: Up to 35% OFF Everything!",
    previewText: "Don't miss out on our biggest promotion of the season. Claim your discount now.",
    category: "Promotions & Sales",
    thumbnailColor: "#EA580C",
    description: "Eye-catching promotional template designed for product discounts, coupons, and seasonal sales.",
    defaultFields: {
      badge: "⚡ LIMITED-TIME OFFER",
      headline: "Unlock Up to 35% OFF Storewide",
      greeting: "Hello {{firstName}},",
      bodyText: "For the next 48 hours only, enjoy exclusive savings across our entire catalog! Whether you're restocking on essentials or trying out our newest products, now is the ideal time to grab what you need before items sell out.",
      buttonText: "Claim Your Discount Now →",
      buttonUrl: "https://example.com/sale",
      calloutTitle: "Use Promo Code at Checkout:",
      calloutText: "Use coupon code FLASH35 during checkout to apply 35% off your entire order. Offer expires Sunday midnight.",
      footerText: "Terms and conditions apply. Promotion valid while supplies last."
    },
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Special Offer from {{companyName}}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fff7ed; color: #0f172a; margin: 0; padding: 0; }
    .email-card { max-width: 580px; margin: 30px auto; background: #ffffff; border: 1px solid #fed7aa; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 14px rgba(234,88,12,0.06); }
    .email-header { background: linear-gradient(135deg, #ea580c, #f97316); padding: 32px 28px; text-align: center; }
    .email-body { padding: 32px 28px; }
    .badge { display: inline-block; background: #ffedd5; color: #c2410c; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px; }
    .btn { display: inline-block; background: #ea580c; color: #ffffff !important; padding: 14px 32px; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 10px; margin: 20px 0; }
    .coupon-box { background: #fffbeb; border: 2px dashed #f59e0b; padding: 18px 20px; border-radius: 10px; margin: 24px 0; text-align: center; }
    .footer { border-top: 1px solid #fed7aa; padding: 24px 28px; font-size: 12px; color: #9a3412; text-align: center; }
  </style>
</head>
<body>
  <div class="email-card">
    <div class="email-header">
      <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 900;">{{companyName}}</h2>
    </div>
    <div class="email-body">
      <div style="text-align: center;">
        <span class="badge"><!-- EDITABLE:badge -->⚡ LIMITED-TIME OFFER<!-- /EDITABLE:badge --></span>
        <h1 style="font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; line-height: 1.25;"><!-- EDITABLE:headline -->Unlock Up to 35% OFF Storewide<!-- /EDITABLE:headline --></h1>
      </div>
      <p style="font-size: 15px; font-weight: 600; color: #334155; margin: 0 0 12px 0;"><!-- EDITABLE:greeting -->Hello {{firstName}},<!-- /EDITABLE:greeting --></p>
      <p style="font-size: 15px; line-height: 1.65; color: #475569; margin: 0 0 20px 0;"><!-- EDITABLE:bodyText -->For the next 48 hours only, enjoy exclusive savings across our entire catalog! Whether you're restocking on essentials or trying out our newest products, now is the ideal time to grab what you need before items sell out.<!-- /EDITABLE:bodyText --></p>
      <div class="coupon-box">
        <strong style="color: #92400e; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px;"><!-- EDITABLE:calloutTitle -->Use Promo Code at Checkout:<!-- /EDITABLE:calloutTitle --></strong>
        <p style="margin: 0; font-size: 15px; color: #78350f; font-weight: 500;"><!-- EDITABLE:calloutText -->Use coupon code FLASH35 during checkout to apply 35% off your entire order. Offer expires Sunday midnight.<!-- /EDITABLE:calloutText --></p>
      </div>
      <div style="text-align: center;">
        <a href="<!-- EDITABLE:buttonUrl -->https://example.com/sale<!-- /EDITABLE:buttonUrl -->" class="btn"><!-- EDITABLE:buttonText -->Claim Your Discount Now →<!-- /EDITABLE:buttonText --></a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 8px 0;"><!-- EDITABLE:footerText -->Terms and conditions apply. Promotion valid while supplies last.<!-- /EDITABLE:footerText --></p>
      <p style="margin: 0;">&copy; {{year}} {{companyName}}. All rights reserved. • <a href="{{unsubscribe_url}}" style="color: #9a3412; text-decoration: underline;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. PRODUCT ANNOUNCEMENT
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "New Feature & Product Launch",
    subject: "✨ Introducing our newest features designed for you",
    previewText: "Explore the new tools we just rolled out to supercharge your workflow.",
    category: "Product Updates",
    thumbnailColor: "#7C3AED",
    description: "Sleek product release template to showcase newly added capabilities, improvements, and roadmap highlights.",
    defaultFields: {
      badge: "🚀 WHAT'S NEW",
      headline: "Meet the all-new experience built for speed",
      greeting: "Hey {{firstName}},",
      bodyText: "We have been listening closely to your feedback! Over the past few weeks, our engineering team has been building powerful new enhancements to streamline your daily workflow, save you hours of manual work, and deliver deeper insights.",
      buttonText: "Explore New Features →",
      buttonUrl: "https://example.com/releases",
      calloutTitle: "Key Highlights Included:",
      calloutText: "• 3x faster performance and real-time synchronization\n• Intuitive drag-and-drop campaign canvas\n• Smarter audience segmentation with custom behavioral tags\n• Comprehensive audit logs and activity tracking",
      footerText: "Got questions or feedback? Our product team would love to hear from you."
    },
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Product Announcement from {{companyName}}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #faf5ff; color: #0f172a; margin: 0; padding: 0; }
    .email-card { max-width: 580px; margin: 30px auto; background: #ffffff; border: 1px solid #e9d5ff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 14px rgba(124,58,237,0.05); }
    .email-header { background: #7c3aed; padding: 32px 28px; text-align: left; }
    .email-body { padding: 32px 28px; }
    .badge { display: inline-block; background: #f3e8ff; color: #6b21a8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px; }
    .btn { display: inline-block; background: #7c3aed; color: #ffffff !important; padding: 14px 28px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 10px; margin: 20px 0; }
    .callout { background: #faf5ff; border: 1px solid #e9d5ff; padding: 18px 20px; border-radius: 10px; margin: 24px 0; font-size: 14px; line-height: 1.65; color: #4c1d95; white-space: pre-line; }
    .footer { border-top: 1px solid #f3e8ff; padding: 24px 28px; font-size: 12px; color: #9333ea; text-align: center; }
  </style>
</head>
<body>
  <div class="email-card">
    <div class="email-header">
      <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">{{companyName}}</h2>
    </div>
    <div class="email-body">
      <span class="badge"><!-- EDITABLE:badge -->🚀 WHAT'S NEW<!-- /EDITABLE:badge --></span>
      <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; line-height: 1.3;"><!-- EDITABLE:headline -->Meet the all-new experience built for speed<!-- /EDITABLE:headline --></h1>
      <p style="font-size: 15px; font-weight: 600; color: #334155; margin: 0 0 12px 0;"><!-- EDITABLE:greeting -->Hey {{firstName}},<!-- /EDITABLE:greeting --></p>
      <p style="font-size: 15px; line-height: 1.65; color: #475569; margin: 0 0 20px 0;"><!-- EDITABLE:bodyText -->We have been listening closely to your feedback! Over the past few weeks, our engineering team has been building powerful new enhancements to streamline your daily workflow, save you hours of manual work, and deliver deeper insights.<!-- /EDITABLE:bodyText --></p>
      <div class="callout">
        <strong style="display: block; margin-bottom: 8px; font-size: 14px; color: #581c87;"><!-- EDITABLE:calloutTitle -->Key Highlights Included:<!-- /EDITABLE:calloutTitle --></strong>
        <!-- EDITABLE:calloutText -->• 3x faster performance and real-time synchronization
• Intuitive drag-and-drop campaign canvas
• Smarter audience segmentation with custom behavioral tags
• Comprehensive audit logs and activity tracking<!-- /EDITABLE:calloutText -->
      </div>
      <div style="text-align: center;">
        <a href="<!-- EDITABLE:buttonUrl -->https://example.com/releases<!-- /EDITABLE:buttonUrl -->" class="btn"><!-- EDITABLE:buttonText -->Explore New Features →<!-- /EDITABLE:buttonText --></a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 8px 0;"><!-- EDITABLE:footerText -->Got questions or feedback? Our product team would love to hear from you.<!-- /EDITABLE:footerText --></p>
      <p style="margin: 0;">&copy; {{year}} {{companyName}}. All rights reserved. • <a href="{{unsubscribe_url}}" style="color: #9333ea; text-decoration: underline;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. WEEKLY NEWSLETTER & CURATED DIGEST
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "Weekly Newsletter & Digest",
    subject: "📬 The Weekly Brief: Insights, Strategies & Trends",
    previewText: "Your handpicked curation of stories, industry breakdowns, and practical tips.",
    category: "Newsletters",
    thumbnailColor: "#059669",
    description: "Editorial newsletter template optimized for readability, featured insights, and engaging content roundups.",
    defaultFields: {
      badge: "📰 WEEKLY DIGEST",
      headline: "The Latest Trends & Tactical Insights",
      greeting: "Dear {{firstName}},",
      bodyText: "Welcome to this week's edition of The Weekly Brief! Every week, we break down actionable tactics, industry updates, and case studies to help you execute better and scale your business without the guesswork.",
      buttonText: "Read the Full Edition Online →",
      buttonUrl: "https://example.com/newsletter",
      calloutTitle: "This Week's Top 3 Highlights:",
      calloutText: "1. How modern brands are driving 40%+ open rates with WhatsApp & Email synergy\n2. 5 critical mistakes killing your transactional email deliverability\n3. Creator spotlight: Scaling from 0 to 100K subscribers in 90 days",
      footerText: "You are receiving this because you subscribed to updates from {{companyName}}."
    },
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter from {{companyName}}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f0fdf4; color: #0f172a; margin: 0; padding: 0; }
    .email-card { max-width: 580px; margin: 30px auto; background: #ffffff; border: 1px solid #bbf7d0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 14px rgba(5,150,105,0.05); }
    .email-header { background: #059669; padding: 32px 28px; text-align: left; }
    .email-body { padding: 32px 28px; }
    .badge { display: inline-block; background: #dcfce7; color: #15803d; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px; }
    .btn { display: inline-block; background: #059669; color: #ffffff !important; padding: 14px 28px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 10px; margin: 20px 0; }
    .callout { background: #f0fdf4; border-left: 4px solid #059669; padding: 18px 20px; border-radius: 8px; margin: 24px 0; font-size: 14px; line-height: 1.65; color: #166534; white-space: pre-line; }
    .footer { border-top: 1px solid #dcfce7; padding: 24px 28px; font-size: 12px; color: #15803d; text-align: center; }
  </style>
</head>
<body>
  <div class="email-card">
    <div class="email-header">
      <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">{{companyName}}</h2>
    </div>
    <div class="email-body">
      <span class="badge"><!-- EDITABLE:badge -->📰 WEEKLY DIGEST<!-- /EDITABLE:badge --></span>
      <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; line-height: 1.3;"><!-- EDITABLE:headline -->The Latest Trends & Tactical Insights<!-- /EDITABLE:headline --></h1>
      <p style="font-size: 15px; font-weight: 600; color: #334155; margin: 0 0 12px 0;"><!-- EDITABLE:greeting -->Dear {{firstName}},<!-- /EDITABLE:greeting --></p>
      <p style="font-size: 15px; line-height: 1.65; color: #475569; margin: 0 0 20px 0;"><!-- EDITABLE:bodyText -->Welcome to this week's edition of The Weekly Brief! Every week, we break down actionable tactics, industry updates, and case studies to help you execute better and scale your business without the guesswork.<!-- /EDITABLE:bodyText --></p>
      <div class="callout">
        <strong style="color: #14532d; display: block; margin-bottom: 8px;"><!-- EDITABLE:calloutTitle -->This Week's Top 3 Highlights:<!-- /EDITABLE:calloutTitle --></strong>
        <!-- EDITABLE:calloutText -->1. How modern brands are driving 40%+ open rates with WhatsApp & Email synergy
2. 5 critical mistakes killing your transactional email deliverability
3. Creator spotlight: Scaling from 0 to 100K subscribers in 90 days<!-- /EDITABLE:calloutText -->
      </div>
      <div style="text-align: center;">
        <a href="<!-- EDITABLE:buttonUrl -->https://example.com/newsletter<!-- /EDITABLE:buttonUrl -->" class="btn"><!-- EDITABLE:buttonText -->Read the Full Edition Online →<!-- /EDITABLE:buttonText --></a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 8px 0;"><!-- EDITABLE:footerText -->You are receiving this because you subscribed to updates from {{companyName}}.<!-- /EDITABLE:footerText --></p>
      <p style="margin: 0;">&copy; {{year}} {{companyName}}. All rights reserved. • <a href="{{unsubscribe_url}}" style="color: #15803d; text-decoration: underline;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. EVENT & WEBINAR INVITATION
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "Live Webinar & Event Invitation",
    subject: "🎙️ You're Invited: Live Masterclass on Growth & Automation",
    previewText: "Reserve your seat for this live deep-dive session with industry leaders.",
    category: "Events & Webinars",
    thumbnailColor: "#0284C7",
    description: "Professional invitation template featuring event date, speaker spotlight, key takeaways, and reservation button.",
    defaultFields: {
      badge: "🎙️ LIVE MASTERCLASS",
      headline: "How to Build Omnichannel Automation in 2025",
      greeting: "Hi {{firstName}},",
      bodyText: "Join us for an exclusive, highly interactive live session where our growth experts share real-world frameworks for connecting WhatsApp campaigns and email sequences into conversion-driving automated funnels.",
      buttonText: "Reserve My Free Seat →",
      buttonUrl: "https://example.com/webinar",
      calloutTitle: "Event Details & Logistics:",
      calloutText: "📅 Date: Thursday, Next Week\n⏰ Time: 2:00 PM EST / 7:00 PM GMT\n📍 Location: Live Video Broadcast (Link sent upon RSVP)\n🎁 Bonus: All live attendees receive our free Omnichannel Playbook template pack.",
      footerText: "Can't make it live? Register anyway and we'll send you the on-demand recording."
    },
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Invitation from {{companyName}}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f0f9ff; color: #0f172a; margin: 0; padding: 0; }
    .email-card { max-width: 580px; margin: 30px auto; background: #ffffff; border: 1px solid #bae6fd; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 14px rgba(2,132,199,0.06); }
    .email-header { background: #0284c7; padding: 32px 28px; text-align: left; }
    .email-body { padding: 32px 28px; }
    .badge { display: inline-block; background: #e0f2fe; color: #0369a1; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px; }
    .btn { display: inline-block; background: #0284c7; color: #ffffff !important; padding: 14px 28px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 10px; margin: 20px 0; }
    .callout { background: #f0f9ff; border-left: 4px solid #0284c7; padding: 18px 20px; border-radius: 8px; margin: 24px 0; font-size: 14px; line-height: 1.65; color: #075985; white-space: pre-line; }
    .footer { border-top: 1px solid #e0f2fe; padding: 24px 28px; font-size: 12px; color: #0284c7; text-align: center; }
  </style>
</head>
<body>
  <div class="email-card">
    <div class="email-header">
      <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">{{companyName}}</h2>
    </div>
    <div class="email-body">
      <span class="badge"><!-- EDITABLE:badge -->🎙️ LIVE MASTERCLASS<!-- /EDITABLE:badge --></span>
      <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; line-height: 1.3;"><!-- EDITABLE:headline -->How to Build Omnichannel Automation in 2025<!-- /EDITABLE:headline --></h1>
      <p style="font-size: 15px; font-weight: 600; color: #334155; margin: 0 0 12px 0;"><!-- EDITABLE:greeting -->Hi {{firstName}},<!-- /EDITABLE:greeting --></p>
      <p style="font-size: 15px; line-height: 1.65; color: #475569; margin: 0 0 20px 0;"><!-- EDITABLE:bodyText -->Join us for an exclusive, highly interactive live session where our growth experts share real-world frameworks for connecting WhatsApp campaigns and email sequences into conversion-driving automated funnels.<!-- /EDITABLE:bodyText --></p>
      <div class="callout">
        <strong style="color: #0c4a6e; display: block; margin-bottom: 8px;"><!-- EDITABLE:calloutTitle -->Event Details & Logistics:<!-- /EDITABLE:calloutTitle --></strong>
        <!-- EDITABLE:calloutText -->📅 Date: Thursday, Next Week
⏰ Time: 2:00 PM EST / 7:00 PM GMT
📍 Location: Live Video Broadcast (Link sent upon RSVP)
🎁 Bonus: All live attendees receive our free Omnichannel Playbook template pack.<!-- /EDITABLE:calloutText -->
      </div>
      <div style="text-align: center;">
        <a href="<!-- EDITABLE:buttonUrl -->https://example.com/webinar<!-- /EDITABLE:buttonUrl -->" class="btn"><!-- EDITABLE:buttonText -->Reserve My Free Seat →<!-- /EDITABLE:buttonText --></a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 8px 0;"><!-- EDITABLE:footerText -->Can't make it live? Register anyway and we'll send you the on-demand recording.<!-- /EDITABLE:footerText --></p>
      <p style="margin: 0;">&copy; {{year}} {{companyName}}. All rights reserved. • <a href="{{unsubscribe_url}}" style="color: #0284c7; text-decoration: underline;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. TRANSACTIONAL & SECURITY ALERT
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "Security Notice & Account Alert",
    subject: "🛡️ Important Security Notice Regarding Your Account",
    previewText: "Please review recent account activity or confirm your identity.",
    category: "Transactional & Security",
    thumbnailColor: "#DC2626",
    description: "Critical transactional template for password resets, sign-in alerts, verification OTPs, and security notices.",
    defaultFields: {
      badge: "🛡️ SECURITY NOTIFICATION",
      headline: "Notice Regarding Recent Account Activity",
      greeting: "Hello {{firstName}},",
      bodyText: "We recently detected a security-relevant event or sign-in request on your account. If this was authorized by you, no further action is required. If you did not initiate this request, we strongly recommend reviewing your session history and securing your password immediately.",
      buttonText: "Review Account Security →",
      buttonUrl: "https://example.com/security",
      calloutTitle: "Security Check Details:",
      calloutText: "• Status: Awaiting User Review\n• IP Address: {{ipAddress}}\n• Timestamp: {{timestamp}}\n• Device: {{deviceType}}\n• Action Required: Confirm legitimacy or reset credentials",
      footerText: "If you need immediate assistance, please contact our support desk."
    },
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Alert from {{companyName}}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fef2f2; color: #0f172a; margin: 0; padding: 0; }
    .email-card { max-width: 580px; margin: 30px auto; background: #ffffff; border: 1px solid #fecaca; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 14px rgba(220,38,38,0.06); }
    .email-header { background: #dc2626; padding: 32px 28px; text-align: left; }
    .email-body { padding: 32px 28px; }
    .badge { display: inline-block; background: #fee2e2; color: #991b1b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px; }
    .btn { display: inline-block; background: #dc2626; color: #ffffff !important; padding: 14px 28px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 10px; margin: 20px 0; }
    .callout { background: #fef2f2; border: 1px solid #fecaca; padding: 18px 20px; border-radius: 8px; margin: 24px 0; font-size: 14px; line-height: 1.65; color: #7f1d1d; white-space: pre-line; }
    .footer { border-top: 1px solid #fee2e2; padding: 24px 28px; font-size: 12px; color: #b91c1c; text-align: center; }
  </style>
</head>
<body>
  <div class="email-card">
    <div class="email-header">
      <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">{{companyName}}</h2>
    </div>
    <div class="email-body">
      <span class="badge"><!-- EDITABLE:badge -->🛡️ SECURITY NOTIFICATION<!-- /EDITABLE:badge --></span>
      <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; line-height: 1.3;"><!-- EDITABLE:headline -->Notice Regarding Recent Account Activity<!-- /EDITABLE:headline --></h1>
      <p style="font-size: 15px; font-weight: 600; color: #334155; margin: 0 0 12px 0;"><!-- EDITABLE:greeting -->Hello {{firstName}},<!-- /EDITABLE:greeting --></p>
      <p style="font-size: 15px; line-height: 1.65; color: #475569; margin: 0 0 20px 0;"><!-- EDITABLE:bodyText -->We recently detected a security-relevant event or sign-in request on your account. If this was authorized by you, no further action is required. If you did not initiate this request, we strongly recommend reviewing your session history and securing your password immediately.<!-- /EDITABLE:bodyText --></p>
      <div class="callout">
        <strong style="color: #7f1d1d; display: block; margin-bottom: 8px;"><!-- EDITABLE:calloutTitle -->Security Check Details:<!-- /EDITABLE:calloutTitle --></strong>
        <!-- EDITABLE:calloutText -->• Status: Awaiting User Review
• IP Address: {{ipAddress}}
• Timestamp: {{timestamp}}
• Device: {{deviceType}}
• Action Required: Confirm legitimacy or reset credentials<!-- /EDITABLE:calloutText -->
      </div>
      <div style="text-align: center;">
        <a href="<!-- EDITABLE:buttonUrl -->https://example.com/security<!-- /EDITABLE:buttonUrl -->" class="btn"><!-- EDITABLE:buttonText -->Review Account Security →<!-- /EDITABLE:buttonText --></a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 8px 0;"><!-- EDITABLE:footerText -->If you need immediate assistance, please contact our support desk.<!-- /EDITABLE:footerText --></p>
      <p style="margin: 0;">&copy; {{year}} {{companyName}}. All rights reserved. • <a href="{{unsubscribe_url}}" style="color: #b91c1c; text-decoration: underline;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`
  }
];
