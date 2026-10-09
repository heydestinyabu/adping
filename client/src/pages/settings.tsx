import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Smartphone,
  Webhook,
  SettingsIcon,
  Database,
  BotIcon,
  Bell,
  Globe,
  ScrollText,
  Headphones,
  Users,
  Key,
  Palette,
  Server
} from "lucide-react";
import { ChannelSettings } from "@/components/settings/ChannelSettings";
import { WebhookSettings } from "@/components/settings/WebhookSettings";
import { ApiKeySettings } from "@/components/settings/ApiKeySettings";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import StorageSettings from "@/components/settings/StorageSettings";
import AISettings from "@/components/settings/AISettings";
import { useAuth } from "@/contexts/auth-context";

import { useTranslation } from "@/lib/i18n";
import { EmbeddedSignupSettings } from "@/components/settings/EmbeddedSignupSettings";
import NotificationTemplatesSettings from "@/components/settings/NotificationTemplatesSettings";
import NotificationPreferences from "@/components/settings/NotificationPreferences";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import LanguageManagement from "@/pages/LanguageManagement";
import Logs from "@/pages/logs";
import UserSupportTicketsNew from "@/pages/user-support-tickets";
import TeamPage from "@/pages/team";

const tabTriggerClass =
  "flex items-center gap-1.5 whitespace-nowrap text-xs h-8 rounded-md px-2 sm:h-9 sm:px-2.5 sm:text-sm shrink-0";

const tabTriggerClasss =
  "flex items-center gap-2 whitespace-nowrap text-xs h-8 rounded-md px-3 sm:h-9 sm:px-4 sm:text-sm shrink-0";

export default function Settings() {
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "general_setting";
  });
  const { user } = useAuth();

  const { t } = useTranslation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab) {
      setActiveTab(tab);
    } else if (user?.role !== "superadmin") {
      setActiveTab("whatsapp");
    }
  }, [user]);

  useEffect(() => {
    const readTab = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab) setActiveTab(tab);
    };

    const origPushState = history.pushState.bind(history);
    const origReplaceState = history.replaceState.bind(history);
    history.pushState = (...args: Parameters<typeof history.pushState>) => {
      origPushState(...args);
      readTab();
    };
    history.replaceState = (...args: Parameters<typeof history.replaceState>) => {
      origReplaceState(...args);
      readTab();
    };
    window.addEventListener("popstate", readTab);

    return () => {
      history.pushState = origPushState;
      history.replaceState = origReplaceState;
      window.removeEventListener("popstate", readTab);
    };
  }, []);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", newTab);
    window.history.pushState({}, "", url.toString());
  };

  const { data: versionData } = useQuery<{ version: string; product: string }>({
    queryKey: ["/api/version"],
    queryFn: () => fetch("/api/version").then((r) => r.json()),
    staleTime: Infinity,
  });

  return (
    <div className="flex-1 dots-bg min-h-screen">
      <Header
        title={t("settings.headTitle")}
        subtitle={t("settings.subTitle")}
      />

      {user?.role === "superadmin" && versionData?.version && (
        <div className="mx-6 mt-4 mb-0">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
            <span className="font-medium">ADping Version {versionData.version}</span>
          </div>
        </div>
      )}

      <main className="p-6 my-4">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-6"
        >
          <div className="overflow-x-auto -mx-1 px-1 pb-2">
            <TabsList className="inline-flex w-auto min-w-full gap-1 p-1 h-auto flex-nowrap">
              {user?.role === "superadmin" && (
                <>
                  <TabsTrigger value="general_setting" className={tabTriggerClass}>
                    <SettingsIcon className="w-4 h-4 shrink-0" />
                    <span>{t("settings.general_setting.tabName")}</span>
                  </TabsTrigger>

                  <TabsTrigger value="storage_setting" className={tabTriggerClass}>
                    <Database className="w-4 h-4 shrink-0" />
                    <span>{t("settings.storage_setting.tabName")}</span>
                  </TabsTrigger>

                  <TabsTrigger value="webhooks" className={tabTriggerClass}>
                    <Webhook className="w-4 h-4 shrink-0" />
                    <span>{t("settings.webhook_setting.tabName")}</span>
                  </TabsTrigger>

                  <TabsTrigger value="embedded_signup" className={tabTriggerClass}>
                    <Smartphone className="w-4 h-4 shrink-0" />
                    <span>{t("settings.tabs.waOnboarding")}</span>
                  </TabsTrigger>

                  <TabsTrigger value="notification_templates" className={tabTriggerClass}>
                    <Bell className="w-4 h-4 shrink-0" />
                    <span>{t("settings.tabs.notifications")}</span>
                  </TabsTrigger>

                  <TabsTrigger value="languages" className={tabTriggerClass}>
                    <Globe className="w-4 h-4 shrink-0" />
                    <span>{t("settings.tabs.languages")}</span>
                  </TabsTrigger>

                  <TabsTrigger value="appearance" className={tabTriggerClass}>
                    <Palette className="w-4 h-4 shrink-0" />
                    <span>{t("settings.tabs.appearance")}</span>
                  </TabsTrigger>

                  <TabsTrigger value="ai_setting" className={tabTriggerClass}>
                    <BotIcon className="w-4 h-4 shrink-0" />
                    <span>{t("settings.ai_setting.tabName")}</span>
                  </TabsTrigger>
                </>
              )}

              {user?.role !== "superadmin" && (
                <>
                  <TabsTrigger value="whatsapp" className={tabTriggerClass}>
                    <Smartphone className="w-4 h-4 shrink-0" />
                    <span>{t("settings.channel_setting.tabName")}</span>
                  </TabsTrigger>

                  <TabsTrigger value="ai_setting" className={tabTriggerClass}>
                    <BotIcon className="w-4 h-4 shrink-0" />
                    <span>{t("settings.ai_setting.tabName")}</span>
                  </TabsTrigger>

                  <TabsTrigger value="message_logs" className={tabTriggerClass}>
                    <ScrollText className="w-4 h-4 shrink-0" />
                    <span>{t("settings.tabs.messageLogs")}</span>
                  </TabsTrigger>

                  <TabsTrigger value="support" className={tabTriggerClass}>
                    <Headphones className="w-4 h-4 shrink-0" />
                    <span>{t("settings.tabs.support")}</span>
                  </TabsTrigger>

                  <TabsTrigger value="team" className={tabTriggerClass}>
                    <Users className="w-4 h-4 shrink-0" />
                    <span>{t("settings.tabs.team")}</span>
                  </TabsTrigger>

                  <TabsTrigger value="notification_prefs" className={tabTriggerClass}>
                    <Bell className="w-4 h-4 shrink-0" />
                    <span>{t("settings.tabs.notifications")}</span>
                  </TabsTrigger>

                  <TabsTrigger value="api" className={tabTriggerClass}>
                    <Key className="w-4 h-4 shrink-0" />
                    <span>{t("settings.api_key_setting.tabName")}</span>
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>

          {user?.role === "superadmin" && (
            <>
              <TabsContent value="general_setting">
                <GeneralSettings />
              </TabsContent>

              <TabsContent value="storage_setting">
                <StorageSettings />
              </TabsContent>

              <TabsContent value="webhooks">
                <WebhookSettings />
              </TabsContent>
              <TabsContent value="embedded_signup">
                <EmbeddedSignupSettings />
              </TabsContent>

              <TabsContent value="notification_templates">
                <NotificationTemplatesSettings />
              </TabsContent>

              <TabsContent value="languages">
                <LanguageManagement embedded={true} />
              </TabsContent>

              <TabsContent value="appearance">
                <AppearanceSettings />
              </TabsContent>
            </>
          )}

          {user?.role !== "superadmin" && (
            <>
              <TabsContent value="whatsapp">
                <ChannelSettings />
              </TabsContent>

              <TabsContent value="message_logs">
                <Logs embedded={true} />
              </TabsContent>

              <TabsContent value="support">
                <UserSupportTicketsNew embedded={true} />
              </TabsContent>

              <TabsContent value="team">
                <TeamPage embedded={true} />
              </TabsContent>

              <TabsContent value="notification_prefs">
                <NotificationPreferences />
              </TabsContent>
            </>
          )}

          <TabsContent value="ai_setting">
            <AISettings />
          </TabsContent>

          <TabsContent value="api">
            <ApiKeySettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
