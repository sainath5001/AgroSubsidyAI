"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-14 h-14 rounded-full bg-white/50 dark:bg-slate-800/50 border border-slate-300/50 dark:border-slate-700/50" />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <motion.button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative w-14 h-14 rounded-full bg-white/50 dark:bg-slate-800/50 border border-slate-300/50 dark:border-slate-700/50 backdrop-blur-sm flex items-center justify-center overflow-hidden group hover:border-pink-500/50 transition-colors duration-300 shadow-lg"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Toggle theme"
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-blue-500/20 dark:from-pink-500/10 dark:via-purple-500/10 dark:to-blue-500/10"
        animate={{
          opacity: isDark ? 0.3 : 0.5,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Sun Icon */}
      <motion.div
        className="absolute"
        initial={false}
        animate={{
          scale: isDark ? 0 : 1,
          rotate: isDark ? 90 : 0,
          opacity: isDark ? 0 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
        }}
      >
        <SunIcon className="w-6 h-6 text-yellow-400" />
      </motion.div>

      {/* Moon Icon */}
      <motion.div
        className="absolute"
        initial={false}
        animate={{
          scale: isDark ? 1 : 0,
          rotate: isDark ? 0 : -90,
          opacity: isDark ? 1 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
        }}
      >
        <MoonIcon className="w-6 h-6 text-blue-300" />
      </motion.div>

      {/* Ripple effect on click */}
      <motion.div
        className="absolute inset-0 rounded-full bg-white/10"
        initial={{ scale: 0, opacity: 0 }}
        whileTap={{
          scale: 2,
          opacity: [0, 0.5, 0],
        }}
        transition={{ duration: 0.6 }}
      />
    </motion.button>
  );
}

