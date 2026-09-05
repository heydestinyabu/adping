export interface EmailTemplateDefinition {
  id?: string;
  name: string;
  subject: string;
  previewText: string;
  category: string;
  thumbnailColor: string;
  description: string;
  htmlContent: string;
}

export const SYSTEM_TEMPLATES: EmailTemplateDefinition[] = [
  {
    name: "Welcome & Getting Started",
    subject: "Welcome to ADping, {{firstName}}! Let's get you set up",
    previewText: "Your all-in-one messaging and email growth suite is ready.",
    category: "Onboarding",
    thumbnailColor: "#00A854",
    description: "A warm, high-converting onboarding email with getting started steps and primary CTA.",
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ADping</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #E2E8F0;">
          
          <!-- Brand Header -->
          <tr>
            <td style="padding: 36px 40px 24px; text-align: center; background: linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 100%); border-bottom: 1px solid #EDF2F7;">
              <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #01594F; width: 36px; height: 36px; border-radius: 10px; text-align: center; vertical-align: middle;">
                    <span style="color: #00C853; font-size: 20px; font-weight: bold; line-height: 36px;">▲</span>
                  </td>
                  <td style="padding-left: 12px; text-align: left;">
                    <span style="font-size: 26px; font-weight: 900; color: #01594F; letter-spacing: -0.5px;">AD</span><span style="font-size: 26px; font-weight: 800; color: #00A854;">ping</span>
                  </td>
                </tr>
              </table>
              <div style="margin-top: 8px; font-size: 11px; font-weight: 700; color: #01594F; letter-spacing: 3px;">REACH. ENGAGE. CONVERT.</div>
            </td>
          </tr>

          <!-- Hero Content -->
          <tr>
            <td style="padding: 36px 40px 20px;">
              <div style="display: inline-block; background-color: #DCFCE7; color: #15803D; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; margin-bottom: 16px;">
                🎉 WELCOME ABOARD
              </div>
              <h1 style="margin: 0 0 16px; font-size: 28px; font-weight: 800; color: #0F172A; line-height: 1.3;">
                Hi {{firstName}}, welcome to next-level growth!
              </h1>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #475569;">
                We're excited to have you with us. With <strong>ADping</strong>, you now have the ultimate omnichannel powerhouse to broadcast campaigns, automate customer journeys, and drive conversions across email and messaging channels.
              </p>
            </td>
          </tr>

          <!-- 3 Step Getting Started Card -->
          <tr>
            <td style="padding: 0 40px 28px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px;">
                <tr>
                  <td style="padding-bottom: 14px;">
                    <strong style="font-size: 14px; color: #0F172A; text-transform: uppercase; letter-spacing: 0.5px;">Get Started in 3 Fast Steps:</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #EDF2F7;">
                    <table border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width: 24px; height: 24px; background-color: #00A854; color: #FFFFFF; font-size: 12px; font-weight: bold; border-radius: 50%; text-align: center; vertical-align: middle;">1</td>
                        <td style="padding-left: 12px; font-size: 14px; color: #334155;"><strong>Verify Your Sender Identity</strong> — Ensure top deliverability.</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #EDF2F7;">
                    <table border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width: 24px; height: 24px; background-color: #00A854; color: #FFFFFF; font-size: 12px; font-weight: bold; border-radius: 50%; text-align: center; vertical-align: middle;">2</td>
                        <td style="padding-left: 12px; font-size: 14px; color: #334155;"><strong>Add Your Audience</strong> — Import contacts or paste direct lists.</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <table border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width: 24px; height: 24px; background-color: #00A854; color: #FFFFFF; font-size: 12px; font-weight: bold; border-radius: 50%; text-align: center; vertical-align: middle;">3</td>
                        <td style="padding-left: 12px; font-size: 14px; color: #334155;"><strong>Launch Your First Campaign</strong> — Hit inboxes in seconds.</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Primary CTA Button -->
          <tr>
            <td style="padding: 0 40px 36px; text-align: center;">
              <a href="https://adping.com/dashboard" style="display: inline-block; background-color: #00A854; color: #FFFFFF; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 10px; box-shadow: 0 4px 14px rgba(0, 168, 84, 0.35);">
                Launch Your First Campaign →
              </a>
              <div style="margin-top: 14px; font-size: 12px; color: #94A3B8;">No credit card required. Free live support available.</div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #64748B;">
                Sent with ❤️ by <strong>ADping</strong> — Reach. Engage. Convert.
              </p>
              <p style="margin: 0; font-size: 11px; color: #94A3B8;">
                You received this email because you registered on our platform. 
                <a href="{{unsubscribe_url}}" style="color: #64748B; text-decoration: underline;">Unsubscribe</a> or manage preferences.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    name: "Flash Sale & Special Promo",
    subject: "⚡ 50% OFF: Exclusive 48-Hour Flash Sale for {{firstName}}",
    previewText: "Don't miss our biggest discount of the season. Use code PING50 at checkout.",
    category: "Promotional",
    thumbnailColor: "#F59E0B",
    description: "Urgent, high-energy sales announcement with countdown banner, promo code voucher, and prominent button.",
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Special Promotional Offer</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0F172A; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);">
          
          <!-- Urgency Top Bar -->
          <tr>
            <td style="background-color: #DC2626; color: #FFFFFF; text-align: center; padding: 10px 20px; font-size: 12px; font-weight: 800; letter-spacing: 1.5px;">
              ⚡ 48 HOURS ONLY • LIMITED TIME OFFER ⚡
            </td>
          </tr>

          <!-- Brand Logo Header -->
          <tr>
            <td style="padding: 28px 40px 10px; text-align: center;">
              <span style="font-size: 24px; font-weight: 900; color: #01594F;">AD</span><span style="font-size: 24px; font-weight: 800; color: #00A854;">ping</span>
            </td>
          </tr>

          <!-- Main Promo Headline -->
          <tr>
            <td style="padding: 20px 40px; text-align: center;">
              <div style="display: inline-block; background-color: #FEF3C7; color: #B45309; font-size: 13px; font-weight: 800; padding: 6px 16px; border-radius: 20px; margin-bottom: 12px;">
                EXCLUSIVE FLASH SALE
              </div>
              <h1 style="margin: 0 0 12px; font-size: 38px; font-weight: 900; color: #0F172A; line-height: 1.1;">
                Get <span style="color: #00A854;">50% OFF</span> All Plans
              </h1>
              <p style="margin: 0 0 24px; font-size: 16px; color: #475569; line-height: 1.5;">
                Hey {{firstName}}, for the next 48 hours only, upgrade your marketing stack at half price. Unlimited campaigns, verified delivery, and 24/7 dedicated assistance.
              </p>

              <!-- Voucher Code Box -->
              <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 28px; background-color: #F0FDF4; border: 2px dashed #00A854; border-radius: 12px; padding: 16px 28px;">
                <tr>
                  <td style="text-align: center;">
                    <div style="font-size: 11px; color: #166534; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">USE COUPON CODE</div>
                    <div style="font-size: 24px; font-weight: 900; color: #01594F; letter-spacing: 3px; margin: 4px 0;">PING50</div>
                    <div style="font-size: 11px; color: #15803D;">Applies automatically at checkout</div>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <div>
                <a href="https://adping.com/pricing" style="display: inline-block; background-color: #00A854; color: #FFFFFF; font-size: 18px; font-weight: 800; text-decoration: none; padding: 16px 40px; border-radius: 12px; box-shadow: 0 6px 20px rgba(0, 168, 84, 0.4);">
                  Claim Your 50% Discount Now →
                </a>
              </div>
            </td>
          </tr>

          <!-- Value Guarantees -->
          <tr>
            <td style="padding: 20px 40px 30px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid #E2E8F0; padding-top: 20px; text-align: center;">
                <tr>
                  <td width="33%" style="font-size: 12px; color: #64748B;">
                    <strong style="color: #0F172A; display: block; font-size: 13px;">🔒 Secure Checkout</strong>
                    Bank-grade encryption
                  </td>
                  <td width="33%" style="font-size: 12px; color: #64748B;">
                    <strong style="color: #0F172A; display: block; font-size: 13px;">⚡ Instant Activation</strong>
                    Access features right away
                  </td>
                  <td width="33%" style="font-size: 12px; color: #64748B;">
                    <strong style="color: #0F172A; display: block; font-size: 13px;">💯 30-Day Guarantee</strong>
                    Full money-back promise
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94A3B8;">
                Terms apply. Discount expires in 48 hours. 
                <a href="{{unsubscribe_url}}" style="color: #64748B; text-decoration: underline;">Unsubscribe</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    name: "Monthly Growth Newsletter",
    subject: "The ADping Digest: 5 Strategies to Boost In-Box Open Rates",
    previewText: "Curated insights, platform updates, and marketing growth tips.",
    category: "Newsletter",
    thumbnailColor: "#3B82F6",
    description: "An elegant editorial newsletter template with featured stories, pro tips, and reading times.",
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Monthly Growth Newsletter</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F1F5F9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 14px; overflow: hidden; border: 1px solid #E2E8F0;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 28px 40px; background-color: #01594F; color: #FFFFFF;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 22px; font-weight: 900; color: #FFFFFF;">AD</span><span style="font-size: 22px; font-weight: 800; color: #00C853;">ping</span>
                    <span style="font-size: 12px; color: #A7F3D0; margin-left: 8px;">DIGEST</span>
                  </td>
                  <td align="right" style="font-size: 12px; color: #CBD5E1;">
                    ISSUE #12 • MONTHLY
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Featured Article -->
          <tr>
            <td style="padding: 32px 40px 20px;">
              <div style="font-size: 11px; font-weight: 800; color: #00A854; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                FEATURED STORY • 4 MIN READ
              </div>
              <h2 style="margin: 0 0 14px; font-size: 24px; font-weight: 800; color: #0F172A; line-height: 1.3;">
                How Modern Brands Achieve a 42% Open Rate on Marketing Broadcasts
              </h2>
              <p style="margin: 0 0 16px; font-size: 15px; color: #475569; line-height: 1.6;">
                Hi {{firstName}}, deliverability is no longer just about avoiding spam filters — it's about domain authentication (DKIM, SPF), intelligent preheaders, and sending content that sparks real engagement.
              </p>
              <a href="https://adping.com/blog/open-rate-guide" style="font-size: 14px; font-weight: 700; color: #00A854; text-decoration: none;">
                Read Full Article →
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 0;">
            </td>
          </tr>

          <!-- Pro Tip Callout -->
          <tr>
            <td style="padding: 24px 40px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F0FDF4; border-left: 4px solid #00A854; border-radius: 0 8px 8px 0; padding: 16px;">
                <tr>
                  <td>
                    <strong style="color: #166534; font-size: 13px; display: block; margin-bottom: 4px;">💡 Pro Tip of the Month</strong>
                    <span style="color: #334155; font-size: 13px; line-height: 1.5;">
                      Personalizing your subject line with <code>{{firstName}}</code> boosts open rates by up to 26% compared to generic subject lines.
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Secondary Grid -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="48%" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px; vertical-align: top;">
                    <div style="font-size: 11px; color: #64748B; font-weight: 700;">PRODUCT UPDATE</div>
                    <h4 style="margin: 6px 0 8px; font-size: 15px; color: #0F172A;">Brevo-Style Email Engine</h4>
                    <p style="margin: 0; font-size: 12px; color: #64748B; line-height: 1.4;">
                      Create responsive email campaigns decoupled from WhatsApp numbers.
                    </p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px; vertical-align: top;">
                    <div style="font-size: 11px; color: #64748B; font-weight: 700;">CASE STUDY</div>
                    <h4 style="margin: 6px 0 8px; font-size: 15px; color: #0F172A;">Scaling to 1M Messages</h4>
                    <p style="margin: 0; font-size: 12px; color: #64748B; line-height: 1.4;">
                      See how ecommerce brands automate notifications without downtime.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 12px; color: #64748B;">
                Delivered by <strong>ADping</strong>. Reach. Engage. Convert.
              </p>
              <p style="margin: 0; font-size: 11px; color: #94A3B8;">
                <a href="{{unsubscribe_url}}" style="color: #64748B; text-decoration: underline;">Unsubscribe</a> from this newsletter.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    name: "New Feature Announcement",
    subject: "🚀 Introducing New Marketing Capabilities in ADping",
    previewText: "Explore our upgraded suite designed to convert more customers.",
    category: "Product",
    thumbnailColor: "#8B5CF6",
    description: "Sleek modern update announcement with feature highlight cards and preview badges.",
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Product Announcement</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 16px rgba(0,0,0,0.05);">
          
          <!-- Top Accent -->
          <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #01594F, #00A854, #8B5CF6);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px 16px; text-align: center;">
              <div style="font-size: 24px; font-weight: 900; color: #01594F;">AD<span style="color: #00A854;">ping</span></div>
              <div style="margin-top: 16px; display: inline-block; background-color: #EDE9FE; color: #6D28D9; font-size: 11px; font-weight: 800; padding: 4px 14px; border-radius: 20px; letter-spacing: 1px;">
                NEW RELEASE
              </div>
              <h1 style="margin: 12px 0 10px; font-size: 28px; font-weight: 800; color: #0F172A; line-height: 1.2;">
                Say Hello to Independent Email Campaigns
              </h1>
              <p style="margin: 0; font-size: 15px; color: #475569; line-height: 1.6;">
                Hi {{firstName}}, we've completely rebuilt the email engine from the ground up. You can now compose, schedule, and track professional email broadcasts just like in Brevo.
              </p>
            </td>
          </tr>

          <!-- 3 Feature Cards -->
          <tr>
            <td style="padding: 16px 40px 24px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 12px; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; margin-bottom: 8px;">
                    <strong style="color: #0F172A; font-size: 14px; display: block;">📬 No WhatsApp Required</strong>
                    <span style="color: #64748B; font-size: 13px;">Send dedicated email campaigns to any subscriber without linking a phone number.</span>
                  </td>
                </tr>
                <tr><td style="height: 10px;"></td></tr>
                <tr>
                  <td style="padding: 12px; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; margin-bottom: 8px;">
                    <strong style="color: #0F172A; font-size: 14px; display: block;">🎯 Send to Specific Contacts or Direct Emails</strong>
                    <span style="color: #64748B; font-size: 13px;">Pick individual users, paste raw email addresses, or broadcast to contact segments.</span>
                  </td>
                </tr>
                <tr><td style="height: 10px;"></td></tr>
                <tr>
                  <td style="padding: 12px; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px;">
                    <strong style="color: #0F172A; font-size: 14px; display: block;">📊 Real-Time Deliverability KPIs</strong>
                    <span style="color: #64748B; font-size: 13px;">Monitor open rates, click rates, delivery reliability, and inbox test rendering.</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 36px; text-align: center;">
              <a href="https://adping.com/email-campaigns/new" style="display: inline-block; background-color: #00A854; color: #FFFFFF; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 34px; border-radius: 10px; box-shadow: 0 4px 14px rgba(0, 168, 84, 0.35);">
                Try New Email Campaigns →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94A3B8;">
                ADping Platform Updates • <a href="{{unsubscribe_url}}" style="color: #64748B;">Unsubscribe</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    name: "Webinar & Event Invitation",
    subject: "📅 You're Invited: Live Growth Masterclass with ADping",
    previewText: "Save your seat for our exclusive live session on customer retention.",
    category: "Events",
    thumbnailColor: "#0D9488",
    description: "Event registration email with date callout, speaker highlights, bulleted agenda, and seat reservation button.",
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Event Invitation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0;">
          
          <!-- Date Badge Bar -->
          <tr>
            <td style="background-color: #01594F; color: #A7F3D0; text-align: center; padding: 12px 20px; font-size: 13px; font-weight: 800; letter-spacing: 1px;">
              🔴 LIVE MASTERCLASS • THURSDAY, OCTOBER 15 • 2:00 PM EST
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 40px 24px;">
              <div style="font-size: 22px; font-weight: 900; color: #01594F; margin-bottom: 12px;">AD<span style="color: #00A854;">ping</span> Workshop</div>
              <h1 style="margin: 0 0 16px; font-size: 26px; font-weight: 800; color: #0F172A; line-height: 1.3;">
                How to 10x Customer Retention with WhatsApp & Email Workflows
              </h1>
              <p style="margin: 0 0 20px; font-size: 15px; color: #475569; line-height: 1.6;">
                Hi {{firstName}}, join our senior marketing engineers for a live, interactive 45-minute workshop demonstrating how to build high-converting automated funnels that engage customers on both WhatsApp and email simultaneously.
              </p>

              <!-- Agenda Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F0FDF4; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <strong style="color: #166534; font-size: 14px; display: block; margin-bottom: 10px;">What You'll Learn:</strong>
                    <ul style="margin: 0; padding-left: 20px; color: #334155; font-size: 13px; line-height: 1.8;">
                      <li>The anatomy of a 60%+ open rate onboarding sequence</li>
                      <li>How to recover abandoned carts using multi-touch triggers</li>
                      <li>Setting up DKIM & SPF for pristine deliverability</li>
                      <li>Live Q&A session with our deliverability experts</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- Registration Button -->
              <div style="text-align: center;">
                <a href="https://adping.com/events/webinar" style="display: inline-block; background-color: #00A854; color: #FFFFFF; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 10px; box-shadow: 0 4px 14px rgba(0, 168, 84, 0.35);">
                  Reserve Your Free Seat Now →
                </a>
                <div style="margin-top: 10px; font-size: 12px; color: #94A3B8;">Free registration • Recording sent to all registrants</div>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94A3B8;">
                <a href="{{unsubscribe_url}}" style="color: #64748B;">Unsubscribe</a> from event alerts.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    name: "Order Receipt & Confirmation",
    subject: "Receipt for Order #{{orderId}} from ADping",
    previewText: "Thank you for your order. Here is your receipt and details.",
    category: "Transactional",
    thumbnailColor: "#10B981",
    description: "Clean, itemized transactional confirmation with order breakdown, totals, and support links.",
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px 20px; border-bottom: 1px solid #E2E8F0;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 24px; font-weight: 900; color: #01594F;">AD</span><span style="font-size: 24px; font-weight: 800; color: #00A854;">ping</span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: #DCFCE7; color: #166534; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px;">
                      PAID ✓
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Confirmation Body -->
          <tr>
            <td style="padding: 30px 40px 20px;">
              <h1 style="margin: 0 0 10px; font-size: 22px; font-weight: 800; color: #0F172A;">Thank you for your order, {{firstName}}!</h1>
              <p style="margin: 0 0 20px; font-size: 14px; color: #475569; line-height: 1.5;">
                We've received your payment and your service is active. Below is a copy of your receipt for your records.
              </p>

              <!-- Order Summary Table -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; margin-bottom: 24px;">
                <tr style="background-color: #F8FAFC; font-size: 12px; color: #64748B; font-weight: 700;">
                  <th align="left" style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0;">DESCRIPTION</th>
                  <th align="center" style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0;">QTY</th>
                  <th align="right" style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0;">AMOUNT</th>
                </tr>
                <tr style="font-size: 14px; color: #0F172A;">
                  <td style="padding: 12px 14px; border-bottom: 1px solid #E2E8F0;">
                    <strong>ADping Business Growth Plan</strong><br>
                    <span style="font-size: 12px; color: #64748B;">Monthly Subscription</span>
                  </td>
                  <td align="center" style="padding: 12px 14px; border-bottom: 1px solid #E2E8F0;">1</td>
                  <td align="right" style="padding: 12px 14px; border-bottom: 1px solid #E2E8F0;">$49.00</td>
                </tr>
                <tr style="font-size: 14px; font-weight: 800; background-color: #F8FAFC;">
                  <td colspan="2" style="padding: 12px 14px; text-align: right; color: #334155;">Total Paid:</td>
                  <td style="padding: 12px 14px; text-align: right; color: #00A854; font-size: 16px;">$49.00</td>
                </tr>
              </table>

              <!-- Button -->
              <div style="text-align: center; margin-bottom: 10px;">
                <a href="https://adping.com/billing" style="display: inline-block; background-color: #00A854; color: #FFFFFF; font-size: 15px; font-weight: 700; text-decoration: none; padding: 12px 30px; border-radius: 8px;">
                  View Invoice in Dashboard →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94A3B8;">
                Need assistance? Contact <a href="mailto:support@adping.com" style="color: #64748B;">support@adping.com</a> • <a href="{{unsubscribe_url}}" style="color: #64748B;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  }
];
