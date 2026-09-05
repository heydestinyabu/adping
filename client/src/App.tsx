import React, { useState, useEffect, Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChannelProvider } from "@/contexts/channel-context";
import { UnreadCountProvider } from "@/contexts/UnreadCountContext";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { SocketProvider } from "./contexts/socket-context";
import { useI18n } from "@/lib/i18n";
import Sidebar from "@/components/layout/sidebar";
import { AppLayout } from "./components/layout/AppLayout";
import Header from "./components/Header";
import Footer from "./components/Footer";
import LoadingAnimation from "./components/LoadingAnimation";
import MinimalLoader from "./components/MinimalLoader";
import { ScrollToTop } from "./components/ScrollToTop";
import { SignupPopupHandler } from "./components/SignupPopupHandler";

// Lazy-loaded page components for maximum performance and reduced initial bundle size
const NotFound = React.lazy(() => import("@/pages/not-found"));
const LoginPage = React.lazy(() => import("@/pages/login"));
const Dashboard = React.lazy(() => import("@/pages/dashboard"));
const Contacts = React.lazy(() => import("@/pages/contacts"));
const Campaigns = React.lazy(() => import("@/pages/campaigns"));
const Templates = React.lazy(() => import("@/pages/templates"));
const EmailTemplatesPage = React.lazy(() => import("@/pages/email-templates"));
const EmailCampaignsPage = React.lazy(() => import("@/pages/email/EmailCampaignsPage"));
const CreateEmailCampaignWizard = React.lazy(() => import("@/pages/email/CreateEmailCampaignWizard"));
const EmailSendersPage = React.lazy(() => import("@/pages/email/EmailSendersPage"));
const EmailAnalyticsPage = React.lazy(() => import("@/pages/email/EmailAnalyticsPage"));
const Inbox = React.lazy(() => import("@/pages/inbox"));
const Automations = React.lazy(() => import("@/pages/automations"));
const Analytics = React.lazy(() => import("@/pages/analytics"));
const CampaignAnalytics = React.lazy(() => import("@/pages/campaign-analytics"));
const Settings = React.lazy(() => import("@/pages/settings"));
const Logs = React.lazy(() => import("@/pages/logs"));
const Team = React.lazy(() => import("@/pages/team"));
const Account = React.lazy(() => import("./pages/account"));
const ChatbotBuilder = React.lazy(() => import("./pages/chatbot-builder"));
const AddChatbotBuilder = React.lazy(() => import("./pages/add-chatbot-builder"));
const WidgetBuilder = React.lazy(() => import("./pages/widget-builder"));
const Websites = React.lazy(() => import("./pages/websites"));
const Home = React.lazy(() => import("./pages/Home"));
const Signup = React.lazy(() => import("./pages/Signup"));
const Plans = React.lazy(() => import("./pages/plans"));
const GatewaySettings = React.lazy(() => import("./pages/GatewaySettings"));
const BotFlowBuilder = React.lazy(() => import("./pages/BotFlowBuilder"));
const Workflows = React.lazy(() => import("./pages/Workflows"));
const AIAssistant = React.lazy(() => import("./pages/AIAssistant"));
const AutoResponses = React.lazy(() => import("./pages/AutoResponses"));
const WABAConnection = React.lazy(() => import("./pages/WABAConnection"));
const MultiNumber = React.lazy(() => import("./pages/MultiNumber"));
const Webhooks = React.lazy(() => import("./pages/Webhooks"));
const QRCodes = React.lazy(() => import("./pages/QRCodes"));
const CRMSystem = React.lazy(() => import("./pages/CRMSystem"));
const LeadManagement = React.lazy(() => import("./pages/LeadManagement"));
const BulkImport = React.lazy(() => import("./pages/BulkImport"));
const Segmentation = React.lazy(() => import("./pages/Segmentation"));
const HealthMonitor = React.lazy(() => import("./pages/HealthMonitor"));
const Reports = React.lazy(() => import("./pages/Reports"));
const Notifications = React.lazy(() => import("./pages/Notifications"));
const UserNotifications = React.lazy(() => import("./pages/UserNotifications"));
const ChatHub = React.lazy(() => import("./pages/ChatHub"));
const User = React.lazy(() => import("./pages/users"));
const TransactionsPage = React.lazy(() => import("./pages/transactions-page"));
const ContactsManagements = React.lazy(() => import("./pages/contacts-managements"));
const SupportTicketsNew = React.lazy(() => import("./pages/support-tickets"));
const userDetails = React.lazy(() => import("./pages/userDetails"));
const UserSupportTicketsNew = React.lazy(() => import("./pages/user-support-tickets"));
const BillingSubscriptionPage = React.lazy(() => import("./components/billing-subscription-page"));
const GroupsUI = React.lazy(() => import("./pages/group-list"));
const AllSubscriptionsPage = React.lazy(() => import("./pages/masterSubscriptions"));
const DemoPage = React.lazy(() => import("./pages/DemoPage"));
const TermsPage = React.lazy(() => import("./pages/TermsPage").then((m) => ({ default: m.TermsPage })));
const PrivacyPage = React.lazy(() => import("./pages/PrivacyPage").then((m) => ({ default: m.PrivacyPage })));
const VerifyEmail = React.lazy(() => import("./pages/verify-email"));
const AboutUs = React.lazy(() => import("./pages/AboutUs"));
const Integrations = React.lazy(() => import("./components/Integrations"));
const PressKit = React.lazy(() => import("./components/PressKit"));
const CaseStudies = React.lazy(() => import("./components/CaseStudies"));
const WhatsAppGuide = React.lazy(() => import("./components/WhatsAppGuide"));
const BestPractices = React.lazy(() => import("./components/BestPractices"));
const CookiePolicy = React.lazy(() => import("./components/CookiePolicy"));
const ContactusLanding = React.lazy(() => import("./components/ContactusLanding"));
const Careers = React.lazy(() => import("./components/Careers"));
const LanguageManagement = React.lazy(() => import("./pages/LanguageManagement"));
const SuperadminMessageLogs = React.lazy(() => import("./pages/SuperadminMessageLogs"));
const ApiDocs = React.lazy(() => import("./pages/api-docs"));
const ChannelsManagement = React.lazy(() => import("./pages/channels-management"));
const AppUpdate = React.lazy(() => import("./pages/app-update"));
const WidgetChat = React.lazy(() => import("./pages/WidgetChat"));
const PaymentSuccessPage = React.lazy(() => import("./pages/PaymentSuccessPage"));
const StoresPage = React.lazy(() => import("./pages/ecommerce/StoresPage"));
const AbandonedCarts = React.lazy(() => import("./pages/ecommerce/AbandonedCarts"));
const CodOrdersPage = React.lazy(() => import("@/pages/ecommerce/CodOrders"));



// Route permissions map. Every authenticated route must have an entry here.
// Missing routes are treated as DENY (redirect to /dashboard). Empty string
// means authenticated-only (no specific permission required).
const ROUTE_PERMISSIONS: Record<string, string> = {
  "/dashboard": "",
  "/contacts": "contacts.view",
  "/users": "",
  "/channels-management": "",
  "/campaigns": "campaigns.view",
  "/templates": "templates.view",
  "/email-templates": "templates.view",
  "/email-campaigns": "",
  "/email-campaigns/new": "",
  "/email-senders": "",
  "/email-analytics": "",
  "/inbox": "inbox.view",
  "/plans": "",
  "/plan-upgrade": "",
  "/billing": "",
  "/payment/success": "",
  "/payment-success": "",
  "/gateway": "",
  "/languages": "",
  "/team": "team.view",
  "/automation": "automations.view",
  "/analytics": "analytics.view",
  "/analytics/campaign/:campaignId": "analytics.view",
  "/websites": "",
  "/add/chatbot-builder": "",
  "/widget-builder": "",
  "/chatbot-builder": "",
  "/settings": "settings.view",
  "/logs": "logs.view",
  "/account": "",
  "/bot-builder": "",
  "/workflows": "",
  "/ai-assistant": "",
  "/auto-responses": "",
  "/waba-connection": "",
  "/multi-number": "",
  "/webhooks": "",
  "/qr-codes": "",
  "/crm-systems": "",
  "/leads": "",
  "/bulk-import": "",
  "/segmentation": "",
  "/message-logs": "",
  "/health-monitor": "",
  "/reports": "",
  "/transactions-logs": "",
  "/contacts-management": "",
  "/support-tickets": "",
  "/groups": "",
  "/api-docs": "",
  "/user-support-tickets": "",
  "/notifications": "",
  "/user-notifications": "",
  "/chat-hub": "",
  "/master-subscriptions": "",
  "/app-update": "",
  "/ecommerce/stores": "",
  "/ecommerce/abandoned-carts": "",
  "/ecommerce/cod-orders" : ""
};

// Route patterns (regex) that correspond to dynamic routes. Keep keys aligned
// with ROUTE_PERMISSIONS so we can resolve dynamic paths like
// /analytics/campaign/:campaignId or /users/:id.
const DYNAMIC_ROUTE_PATTERNS: Array<{ pattern: RegExp; key: string }> = [
  {
    pattern: /^\/analytics\/campaign\/[^/]+$/,
    key: "/analytics/campaign/:campaignId",
  },
  { pattern: /^\/users\/[^/]+$/, key: "/users" },
];

function resolveRouteKey(location: string): string | undefined {
  const path = location.split("?")[0];
  if (path in ROUTE_PERMISSIONS) return path;
  for (const { pattern, key } of DYNAMIC_ROUTE_PATTERNS) {
    if (pattern.test(path)) return key;
  }
  return undefined;
}

function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600">
          You don't have permission to access this page.
        </p>
      </div>
    </div>
  );
}

// Permission wrapper component
function PermissionRoute({
  component: Component,
  requiredPermission,
  requiredRoles,
}: Readonly<{
  component: React.ComponentType;
  requiredPermission?: string;
  requiredRoles?: string[];
}>) {
  const { user } = useAuth();

  if (requiredRoles && requiredRoles.length > 0) {
    if (!user?.role || !requiredRoles.includes(user.role)) {
      return <UnauthorizedPage />;
    }
  }

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    if (!user?.permissions) return false;
    if (user.role === "superadmin") return true;

    const perms = Array.isArray(user.permissions)
      ? user.permissions
      : Object.keys(user.permissions);

    if (perms.includes("*")) return true;

    const normalize = (str: string) => str.replace(".", ":");

    return perms.some(
      (perm) =>
        perm.startsWith(normalize(permission)) &&
        (Array.isArray(user.permissions) ? true : user.permissions[perm]),
    );
  };

  if (!hasPermission(requiredPermission)) {
    return <UnauthorizedPage />;
  }

  return <Component />;
}

function ProtectedRoutes() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location, setLocation] = useLocation();

  // Check flag immediately on mount - synchronously
  const fromLoginFlag =
    typeof window !== "undefined" &&
    sessionStorage.getItem("fromLogin") === "true";

  const [showLoading, setShowLoading] = useState(fromLoginFlag);
  const [isLoginRedirect] = useState(fromLoginFlag);

  // Clear flag immediately after reading
  useEffect(() => {
    if (fromLoginFlag) {
      sessionStorage.removeItem("fromLogin");
    }
  }, [fromLoginFlag]);

  // Check if user has access to current route. Default policy is DENY:
  // unmapped routes redirect to /dashboard. Empty-string permissions mean
  // "authenticated-only" (allowed).
  useEffect(() => {
    if (
      isAuthenticated &&
      user &&
      location !== "/" &&
      location !== "/dashboard"
    ) {
      const routeKey = resolveRouteKey(location);
      if (routeKey === undefined) {
        setLocation("/dashboard");
        return;
      }
      const requiredPermission = ROUTE_PERMISSIONS[routeKey];
      if (requiredPermission && !hasRoutePermission(requiredPermission, user)) {
        setLocation("/dashboard");
      }
    }
  }, [location, isAuthenticated, user, setLocation]);

  // Priority 1: Show login animation loader immediately
  if (showLoading && isLoginRedirect) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-[9999]">
        <LoadingAnimation onComplete={() => setShowLoading(false)} />
      </div>
    );
  }

  // Priority 2: Show minimal loader during auth check
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-[9999]">
        <MinimalLoader onComplete={() => {}} duration={1500} color="green" />
      </div>
    );
  }

  // Priority 3: Not authenticated - show public routes
  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <Switch>
          <Route path="/" component={Home} />
          <Route component={Home} />
        </Switch>
        <Footer />
      </>
    );
  }

  // Priority 4: Authenticated - show dashboard and protected routes
  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <Suspense fallback={<MinimalLoader />}>
          <Switch>
            <Route path="/dashboard">
            <Dashboard />
          </Route>
          <Route path="/contacts">
            <PermissionRoute
              component={Contacts}
              requiredPermission="contacts:view"
            />
          </Route>
          <Route path="/users">
            <PermissionRoute component={User} requiredRoles={["superadmin"]} />
          </Route>
          <Route path="/channels-management">
            <PermissionRoute
              component={ChannelsManagement}
              requiredRoles={["superadmin"]}
            />
          </Route>
          <Route path="/users/:id">
            <PermissionRoute
              component={userDetails}
              requiredRoles={["superadmin"]}
            />
          </Route>
          <Route path="/campaigns">
            <PermissionRoute
              component={Campaigns}
              requiredPermission="campaigns:view"
            />
          </Route>
          <Route path="/templates">
            <PermissionRoute
              component={Templates}
              requiredPermission="templates:view"
            />
          </Route>
          <Route path="/email-templates">
            <PermissionRoute
              component={EmailTemplatesPage}
              requiredPermission="templates:view"
            />
          </Route>
          <Route path="/email-campaigns">
            <PermissionRoute component={EmailCampaignsPage} />
          </Route>
          <Route path="/email-campaigns/new">
            <PermissionRoute component={CreateEmailCampaignWizard} />
          </Route>
          <Route path="/email-senders">
            <PermissionRoute component={EmailSendersPage} />
          </Route>
          <Route path="/email-analytics">
            <PermissionRoute component={EmailAnalyticsPage} />
          </Route>
          <Route path="/inbox">
            <PermissionRoute
              component={Inbox}
              requiredPermission="inbox:view"
            />
          </Route>
          <Route path="/plans">
            <PermissionRoute component={Plans} />
          </Route>
          <Route path="/gateway">
            <PermissionRoute
              component={GatewaySettings}
              requiredRoles={["superadmin"]}
            />
          </Route>
          <Route path="/languages">
            <PermissionRoute
              component={LanguageManagement}
              requiredRoles={["superadmin"]}
            />
          </Route>
          <Route path="/team">
            <PermissionRoute component={Team} requiredPermission="team:view" />
          </Route>
          <Route path="/automation">
            <PermissionRoute
              component={Automations}
              requiredPermission="automations:view"
            />
          </Route>
          <Route path="/analytics">
            <PermissionRoute component={Analytics} />
          </Route>
          <Route path="/websites">
            <PermissionRoute component={Websites} />
          </Route>
          <Route path="/add/chatbot-builder">
            <PermissionRoute component={AddChatbotBuilder} />
          </Route>
          <Route path="/widget-builder">
            <PermissionRoute component={WidgetBuilder} />
          </Route>
          <Route path="/chatbot-builder">
            <PermissionRoute component={ChatbotBuilder} />
          </Route>
          <Route path="/settings">
            <PermissionRoute
              component={Settings}
              requiredPermission="settings:view"
            />
          </Route>
          <Route path="/analytics/campaign/:campaignId">
            <PermissionRoute
              component={CampaignAnalytics}
              // requiredPermission="settings:view"
            />
          </Route>
          <Route path="/account">
            <PermissionRoute component={Account} />
          </Route>
          <Route path="/bot-builder">
            <PermissionRoute component={BotFlowBuilder} />
          </Route>
          <Route path="/workflows">
            <PermissionRoute component={Workflows} />
          </Route>
          <Route path="/ai-assistant">
            <PermissionRoute component={AIAssistant} />
          </Route>
          <Route path="/auto-responses">
            <PermissionRoute component={AutoResponses} />
          </Route>
          <Route path="/waba-connection">
            <PermissionRoute component={WABAConnection} />
          </Route>
          <Route path="/multi-number">
            <PermissionRoute component={MultiNumber} />
          </Route>
          <Route path="/webhooks">
            <PermissionRoute component={Webhooks} />
          </Route>
          <Route path="/qr-codes">
            <PermissionRoute component={QRCodes} />
          </Route>
          <Route path="/crm-systems">
            <PermissionRoute component={CRMSystem} />
          </Route>
          <Route path="/leads">
            <PermissionRoute component={LeadManagement} />
          </Route>
          <Route path="/bulk-import">
            <PermissionRoute component={BulkImport} />
          </Route>
          <Route path="/segmentation">
            <PermissionRoute component={Segmentation} />
          </Route>
          <Route path="/message-logs">
            <PermissionRoute
              component={SuperadminMessageLogs}
              requiredRoles={["superadmin"]}
            />
          </Route>
          <Route path="/health-monitor">
            <PermissionRoute component={HealthMonitor} />
          </Route>
          <Route path="/reports">
            <PermissionRoute component={Reports} />
          </Route>
          <Route path="/transactions-logs">
            <PermissionRoute
              component={TransactionsPage}
              requiredRoles={["superadmin"]}
            />
          </Route>
          <Route path="/contacts-management">
            <PermissionRoute
              component={ContactsManagements}
              requiredRoles={["superadmin"]}
            />
          </Route>
          <Route path="/support-tickets">
            <PermissionRoute
              component={SupportTicketsNew}
              requiredRoles={["superadmin"]}
            />
          </Route>
          <Route path="/groups">
            <PermissionRoute component={GroupsUI} />
          </Route>

          <Route path="/ecommerce/stores">
            <PermissionRoute component={StoresPage} />
          </Route>

          <Route path="/ecommerce/abandoned-carts">
            <PermissionRoute component={AbandonedCarts} />
          </Route>

          <Route path="/ecommerce/cod-orders">
            <PermissionRoute component={CodOrdersPage} />
          </Route>
          <Route path="/api-docs">
            <PermissionRoute component={ApiDocs} requiredRoles={["admin"]} />
          </Route>
          <Route path="/user-support-tickets">
            <PermissionRoute component={UserSupportTicketsNew} />
          </Route>
          <Route path="/plan-upgrade">
            <PermissionRoute component={Plans} />
          </Route>
          <Route path="/billing">
            <PermissionRoute component={BillingSubscriptionPage} />
          </Route>
          <Route path="/payment/success">
            <PermissionRoute component={PaymentSuccessPage} />
          </Route>
          <Route path="/payment-success">
            <PermissionRoute component={PaymentSuccessPage} />
          </Route>
          <Route path="/notifications">
            <PermissionRoute
              component={Notifications}
              requiredRoles={["superadmin"]}
            />
          </Route>
          <Route path="/user-notifications">
            <PermissionRoute component={UserNotifications} />
          </Route>
          <Route path="/chat-hub">
            <PermissionRoute component={ChatHub} />
          </Route>
          <Route path="/master-subscriptions">
            <PermissionRoute
              component={AllSubscriptionsPage}
              requiredRoles={["superadmin"]}
            />
          </Route>
          <Route path="/app-update">
            <PermissionRoute
              component={AppUpdate}
              requiredRoles={["superadmin"]}
            />
          </Route>
          <Route component={NotFound} />
        </Switch>
        </Suspense>
      </div>
    </div>
  );
}

// Helper function to check route permissions
function hasRoutePermission(permission: string, user: any) {
  if (!user?.permissions) return false;
  if (user.role === "superadmin") return true;

  const perms = Array.isArray(user.permissions)
    ? user.permissions
    : Object.keys(user.permissions);

  if (perms.includes("*")) return true;

  const normalize = (str: string) => str.replace(".", ":");

  return perms.some(
    (perm: string) =>
      perm.startsWith(normalize(permission)) &&
      (Array.isArray(user.permissions) ? true : user.permissions[perm]),
  );
}

// Custom hook for permission checking
export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = (permission: string) => {
    if (!user?.permissions) return false;

    const perms = Array.isArray(user.permissions)
      ? user.permissions
      : Object.keys(user.permissions);

    const normalize = (str: string) => str.replace(".", ":");
    const normalizedPermission = normalize(permission);

    return perms.some(
      (perm) =>
        perm.startsWith(normalizedPermission) &&
        (Array.isArray(user.permissions) ? true : user.permissions[perm]),
    );
  };

  const canAccessRoute = (route: string) => {
    const routeKey = resolveRouteKey(route);
    if (routeKey === undefined) return false; // default DENY for unmapped routes
    const requiredPermission = ROUTE_PERMISSIONS[routeKey];
    return requiredPermission ? hasPermission(requiredPermission) : true;
  };

  return { hasPermission, canAccessRoute, user };
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <SignupPopupHandler />
      <Suspense fallback={<MinimalLoader />}>
        <Switch>
          <Route path="/widget-chat" component={WidgetChat} />
          <Route path="/demo">
            <>
              <DemoPage />
            </>
          </Route>
          <Route path="/login" component={LoginPage} />
          <Route path="/verify-email">
            <>
              <Header />
              <VerifyEmail />
              <Footer />
            </>
          </Route>
          <Route path="/signup" component={Signup} />
          <Route path="/privacy-policy">
            <>
              <Header />
              <PrivacyPage />
              <Footer />
            </>
          </Route>
          <Route path="/terms">
            <>
              <Header />
              <TermsPage />
              <Footer />
            </>
          </Route>
          <Route path="/about">
            <>
              <Header />
              <AboutUs />
              <Footer />
            </>
          </Route>
          <Route path="/integrations">
            <>
              <Header />
              <Integrations />
              <Footer />
            </>
          </Route>
          <Route path="/press-kit">
            <>
              <Header />
              <PressKit />
              <Footer />
            </>
          </Route>
          <Route path="/case-studies">
            <>
              <Header />
              <CaseStudies />
              <Footer />
            </>
          </Route>
          <Route path="/whatsapp-guide">
            <>
              <Header />
              <WhatsAppGuide />
              <Footer />
            </>
          </Route>
          <Route path="/best-practices">
            <>
              <Header />
              <BestPractices />
              <Footer />
            </>
          </Route>
          <Route path="/cookie-policy">
            <>
              <Header />
              <CookiePolicy />
              <Footer />
            </>
          </Route>
          <Route path="/contact">
            <>
              <Header />
              <ContactusLanding />
              <Footer />
            </>
          </Route>
          <Route path="/careers">
            <>
              <Header />
              <Careers />
              <Footer />
            </>
          </Route>
          <Route path="/">
            <>
              <Header />
              <Home />
              <Footer />
            </>
          </Route>
          <Route component={ProtectedRoutes} />
        </Switch>
      </Suspense>
    </>
  );
}

function App() {
  useEffect(() => {
    useI18n.getState().fetchEnabledLanguages();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <UnreadCountProvider>
            <AppLayout>
              <ChannelProvider>
                <TooltipProvider>
                  <Toaster />
                  <Router />
                </TooltipProvider>
              </ChannelProvider>
            </AppLayout>
          </UnreadCountProvider>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
