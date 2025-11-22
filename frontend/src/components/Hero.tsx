'use client';
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLongRightIcon } from "@heroicons/react/24/outline";
import { heroHighlights } from "../lib/data";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-16 sm:px-8 lg:px-12">
      <div className="aurora" />
      <div className="mx-auto flex max-w-6xl flex-col-reverse gap-16 lg:flex-row lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex-1 space-y-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/50 dark:border-white/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">
            Autonomous Subsidy Agent
            <span className="inline-flex h-2 w-2 rounded-full bg-cyan-500 dark:bg-cyan-300" />
          </div>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl lg:text-6xl text-slate-900 dark:text-white">
            You are a farmer.<br />
            The drought hits.<br />
            The payout lands in minutes.
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 lg:text-xl">
            AgroSubsidyAI is a robot government officer that verifies land,
            checks weather, applies subsidy rules, and pays farmers instantly.
            No middlemen. No corruption. No waiting.
          </p>
          <div className="flex flex-col gap-3 text-sm text-slate-700 dark:text-slate-200 sm:flex-row sm:flex-wrap">
            {heroHighlights.map((item) => (
              <motion.div
                key={item}
                whileHover={{ y: -2 }}
                className="glass flex flex-1 items-center gap-3 rounded-2xl px-5 py-4"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                {item}
              </motion.div>
            ))}
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="#workflow"
              className="inline-flex items-center justify-center rounded-full bg-cyan-500 dark:bg-cyan-400 px-6 py-3 font-semibold text-white dark:text-slate-950 transition hover:bg-cyan-600 dark:hover:bg-cyan-300"
            >
              View autonomous workflow
              <ArrowLongRightIcon className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="#dashboards"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 dark:border-white/30 px-6 py-3 font-semibold text-slate-900 dark:text-white transition hover:bg-slate-100 dark:hover:bg-white/10"
            >
              Explore dashboards
            </Link>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotate: -4 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.9 }}
          className="glass relative flex-1 overflow-hidden rounded-3xl p-6"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <div className="relative space-y-4">
            <p className="text-sm uppercase tracking-[0.4em] text-slate-600 dark:text-slate-300">
              Today in real life
            </p>
            <ul className="space-y-3 text-lg text-slate-700 dark:text-slate-200">
              <li>❌ Travel to government office</li>
              <li>❌ Bribes + paper forms</li>
              <li>❌ Months of waiting</li>
            </ul>
            <div className="h-px w-full bg-slate-300/50 dark:bg-white/10" />
            <p className="text-sm uppercase tracking-[0.4em] text-emerald-600 dark:text-emerald-300">
              With AgroSubsidyAI
            </p>
            <ul className="space-y-3 text-lg text-slate-700 dark:text-white">
              <li>✅ Register once from your phone</li>
              <li>✅ AI agent validates land + weather</li>
              <li>✅ Funds land directly in wallet</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

