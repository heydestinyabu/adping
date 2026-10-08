import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppSettings } from "@/types/types";
import adpingLogo from "@/images/adping-logo.svg";

interface MinimalLoaderProps {
  onComplete?: () => void;
  duration?: number;
  color?: string;
  variant?: "spinner" | "pulse" | "dots" | "ring" | "dual";
}

const MinimalLoader: React.FC<MinimalLoaderProps> = ({
  onComplete,
  duration = 0,
}) => {
  const { data: brandSettings } = useQuery<AppSettings>({
    queryKey: ["/api/brand-settings"],
    queryFn: () => fetch("/api/brand-settings").then((res) => res.json()),
    staleTime: 5 * 60 * 1000,
  });

  const logoSrc = brandSettings?.logo || adpingLogo;

  useEffect(() => {
    if (onComplete && duration > 0) {
      const timer = setTimeout(() => {
        onComplete();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [onComplete, duration]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] w-full p-6 select-none">
      {/* Subtle glowing halo */}
      <div className="relative mb-5 flex items-center justify-center">
        <div className="absolute -inset-3 bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-blue-500/15 rounded-2xl blur-sm animate-pulse" />
        <div className="relative bg-white dark:bg-slate-900 px-5 py-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-lg shadow-emerald-500/5">
          <img
            src={logoSrc}
            alt={brandSettings?.title || "ADping"}
            className="h-10 sm:h-12 w-auto object-contain transition-transform duration-700 animate-[logoPulse_2s_ease-in-out_infinite]"
          />
        </div>
      </div>

      {/* Modern micro progress bar */}
      <div className="w-36 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
        <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 rounded-full animate-[miniBar_1.2s_cubic-bezier(0.65,0,0.35,1)_infinite]" />
      </div>

      <style>{`
        @keyframes miniBar {
          0% {
            left: -40%;
            width: 30%;
          }
          50% {
            left: 30%;
            width: 50%;
          }
          100% {
            left: 100%;
            width: 30%;
          }
        }
        @keyframes logoPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.95;
          }
          50% {
            transform: scale(1.03);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default MinimalLoader;
