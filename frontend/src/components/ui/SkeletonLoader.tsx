"use client";
import { motion } from "framer-motion";

export function SkeletonCard() {
  return (
    <div className="p-6 rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
      <div className="space-y-4">
        <div className="h-6 bg-slate-700/50 rounded-lg w-3/4 animate-pulse" />
        <div className="h-4 bg-slate-700/50 rounded-lg w-1/2 animate-pulse" />
        <div className="h-20 bg-slate-700/50 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
          className="h-4 bg-slate-700/50 rounded-lg"
          style={{ width: i === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}

export function SkeletonButton({ className = "" }: { className?: string }) {
  return (
    <div className={`h-12 bg-slate-700/50 rounded-xl animate-pulse ${className}`} />
  );
}

export function SkeletonInput({ className = "" }: { className?: string }) {
  return (
    <div className={`h-12 bg-slate-700/50 rounded-xl animate-pulse ${className}`} />
  );
}

