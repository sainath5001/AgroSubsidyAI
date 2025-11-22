"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { dashboardTabs } from "../lib/data";
import { SectionTitle } from "./SectionTitle";

export function DashboardShowcase() {
  const [activeTab, setActiveTab] = useState(dashboardTabs[0].id);
  const current = dashboardTabs.find((tab) => tab.id === activeTab)!;

  return (
    <section id="dashboards" className="px-4 py-24 sm:px-8 lg:px-12">
      <SectionTitle
        eyebrow="Product preview"
        title="Farmer, admin, and AI cockpit — all in one place"
        className="mb-12"
      />
      <div className="mx-auto max-w-6xl rounded-[32px] border border-slate-300/50 dark:border-white/15 bg-white/80 dark:bg-white/5 p-1">
        <div className="flex flex-wrap gap-2 rounded-[28px] bg-slate-200/50 dark:bg-slate-900/60 p-2">
          {dashboardTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-between rounded-[24px] px-4 py-3 text-sm font-semibold transition ${
                tab.id === activeTab
                  ? "bg-white dark:bg-white text-slate-900 dark:text-slate-900"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab.title}
              <span className="ml-3 rounded-full border border-current px-2 py-0.5 text-xs">
                {tab.badge}
              </span>
            </button>
          ))}
        </div>
        <div className="relative mt-4 min-h-[300px] rounded-[28px] bg-slate-100/80 dark:bg-slate-900/70 p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-600 dark:text-cyan-200">
                  {current.title}
                </p>
                <p className="mt-3 max-w-2xl text-lg text-slate-700 dark:text-slate-200">
                  {current.description}
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {current.highlights.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-slate-300/50 dark:border-white/10 bg-white/80 dark:bg-white/5 px-5 py-4 text-slate-800 dark:text-slate-100"
                  >
                    {item}
                  </div>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className="rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-900 dark:to-slate-800 p-4"
                  >
                    <div className="h-32 rounded-xl bg-slate-300/60 dark:bg-slate-700/40" />
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}




