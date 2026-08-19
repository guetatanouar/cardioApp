"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ThemeController = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <div className="fixed top-24 transition-all duration-300 right-[-50px] hover:right-0 z-50">
      <button
        className="theme-controller w-[102px] h-12 bg-indigo-600 rounded-l-lg text-white px-3 flex items-center gap-2"
        onClick={() => setTheme(isDark ? "light" : "dark")}
      >
        {/* Icône lune (mode clair) */}
        {!isDark && (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6" viewBox="0 0 512 512">
            <path d="M160 136c0-30.62 4.51-61.61 16-88C99.57 81.27 48 159.32 48 248c0 119.29 96.71 216 216 216 88.68 0 166.73-51.57 200-128-26.39 11.49-57.38 16-88 16-119.29 0-216-96.71-216-216z"
              fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" />
          </svg>
        )}
        <span className="font-semibold">{isDark ? "Clair" : "Sombre"}</span>

        {/* Icône soleil (mode sombre) */}
        {isDark && (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6" viewBox="0 0 512 512">
            <circle cx="256" cy="256" r="80" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="32" />
            <path fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="32"
              d="M256 48v48M256 416v48M403.08 108.92l-33.94 33.94M142.86 369.14l-33.94 33.94M464 256h-48M96 256H48M403.08 403.08l-33.94-33.94M142.86 142.86l-33.94-33.94" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default ThemeController;
