// components/LoadingOrb.jsx
import React from "react";

export default function LoadingOrb({
  title = "Generating dataset…",
  subtitle = "Extracting keywords • Scraping web • Structuring JSON",
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-xl">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 animate-orb" />
      <p className="mt-6 text-lg font-semibold text-purple-200 text-center">
        {title}
      </p>
      <p className="mt-1 text-xs text-slate-400 text-center max-w-md">
        {subtitle}
      </p>
    </div>
  );
}
