import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { setMeta } from "@/hooks/setMeta";
import { AppSettings } from "@/types/types";

interface LayoutProps {
  children: React.ReactNode;
}

export const HeaderFooterWraper = ({ children }: LayoutProps) => {
  const [location] = useLocation();

  const { data: brandSettings } = useQuery<AppSettings>({
    queryKey: ["/api/brand-settings"],
    queryFn: () => fetch("/api/brand-settings").then((res) => res.json()),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);

  useEffect(() => {
    const rawTitle = brandSettings?.title;
    const cleanTitle = (rawTitle && !rawTitle.toLowerCase().includes("whatsway") && rawTitle !== "Your App Name")
      ? rawTitle
      : "ADping — WhatsApp Marketing & Business Automation Platform";
    const rawFavicon = brandSettings?.favicon;
    const cleanFavicon = (rawFavicon && !rawFavicon.toLowerCase().includes("whatsway") && !rawFavicon.includes("null"))
      ? rawFavicon
      : "/favicon.svg";

    setMeta({
      title: cleanTitle,
      favicon: cleanFavicon,
      description: brandSettings?.tagline || "Reach. Engage. Convert.",
    });
  }, [brandSettings]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
};
