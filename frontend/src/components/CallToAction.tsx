'use client';
import { motion } from "framer-motion";
import Link from "next/link";

export function CallToAction() {
  return (
    <section className="px-4 pb-24 sm:px-8 lg:px-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-[36px] border border-cyan-300/50 dark:border-cyan-200/10 bg-gradient-to-br from-cyan-100/80 dark:from-cyan-900/30 via-slate-200 dark:via-slate-900 to-slate-300 dark:to-slate-950 px-8 py-12 text-center"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.1),_transparent_60%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.2),_transparent_60%)]" />
        <div className="relative space-y-6">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-700 dark:text-cyan-200">
            next steps
          </p>
          <h3 className="font-display text-3xl sm:text-4xl text-slate-900 dark:text-white">
            Ready to wire the agent to live wallets?
          </h3>
          <p className="mx-auto max-w-3xl text-lg text-slate-700 dark:text-slate-200">
            We've shown the story, dashboards, and workflow. Next we'll plug in
            Wagmi, bring real farmer data, and schedule the agent cron so Sepolia
            payouts happen automatically.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="https://sepolia.etherscan.io/address/0x9b003ee4E761355c716867089afb6373f23B8fc0"
              target="_blank"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 dark:bg-white px-8 py-3 font-semibold text-white dark:text-slate-900 transition hover:bg-slate-800 dark:hover:bg-slate-200"
            >
              View SubsidyDistributor on Etherscan
            </Link>
            <Link
              href="#"
              className="inline-flex items-center justify-center rounded-full border border-slate-700 dark:border-white/20 px-8 py-3 font-semibold text-slate-900 dark:text-white transition hover:bg-slate-100 dark:hover:bg-white/10"
            >
              Book a live walkthrough
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

