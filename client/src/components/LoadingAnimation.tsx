import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppSettings } from "@/types/types";
import adpingLogo from "@/images/adping-logo.svg";

interface LoadingAnimationProps {
  onComplete?: () => void;
  size?: "sm" | "md" | "lg";
  color?: "green" | "white" | "blue";
  message?: string;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  onComplete,
  size = "lg",
  color = "green",
  message = "Loading your workspace...",
}) => {
  const { data: brandSettings } = useQuery<AppSettings>({
    queryKey: ["/api/brand-settings"],
    queryFn: () => fetch("/api/brand-settings").then((res) => res.json()),
    staleTime: 5 * 60 * 1000,
  });

  const logoSrc = brandSettings?.logo || adpingLogo;

  useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [onComplete]);

  // Micro-spinner for buttons
  if (size === "sm" || size === "md") {
    return (
      <div
        className={`animate-spin rounded-full border-2 border-t-transparent ${
          size === "sm" ? "w-4 h-4" : "w-6 h-6"
        } ${
          color === "white"
            ? "border-white"
            : color === "blue"
            ? "border-blue-600"
            : "border-emerald-600"
        }`}
      />
    );
  }

  // Full-Page Sleek Brand Logo Preloader
  return (
    <div className="fixed inset-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center z-[99999] select-none">
      {/* Ambient background glow */}
      <div className="absolute w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute w-64 h-64 bg-teal-500/10 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none -bottom-10" />

      <div className="relative z-10 flex flex-col items-center max-w-xs mx-auto px-6 text-center">
        {/* Logo Container with Breathing Glow Effect */}
        <div className="relative mb-6 flex items-center justify-center">
          {/* Subtle pulsating aura */}
          <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-blue-500/20 rounded-3xl blur-md animate-pulse" />
          
          <div className="relative bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-emerald-500/5 transition-all duration-300">
            <img
              src={logoSrc}
              alt={brandSettings?.title || "ADping"}
              className="h-12 sm:h-14 w-auto object-contain transition-transform duration-700 animate-[logoBreathe_2.4s_ease-in-out_infinite]"
            />
          </div>
        </div>

        {/* Minimalist Indeterminate Progress Bar */}
        <div className="w-44 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3.5 relative">
          <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 rounded-full animate-[preloaderBar_1.4s_cubic-bezier(0.65,0,0.35,1)_infinite]" />
        </div>

        {/* Clean status note */}
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wide animate-pulse">
          {message}
        </p>
      </div>

      <style>{`
        @keyframes preloaderBar {
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
        @keyframes logoBreathe {
          0%, 100% {
            transform: scale(1);
            opacity: 0.95;
          }
          50% {
            transform: scale(1.04);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingAnimation;
