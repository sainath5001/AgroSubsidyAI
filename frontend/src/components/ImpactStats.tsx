'use client';
import { SectionTitle } from "./SectionTitle";
import { impactStats } from "../lib/data";
import { motion } from "framer-motion";

export function ImpactStats() {
  return (
    <section className="px-4 py-24 sm:px-8 lg:px-12">
      <SectionTitle
        eyebrow="Impact"
        title="Hard numbers from our pilot simulations"
        className="mb-12"
      />
      <div className="grid gap-6 md:grid-cols-3">
        {impactStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="rounded-[28px] border border-white/15 bg-white/5 p-6"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">
              {stat.label}
            </p>
            <p className="mt-4 font-display text-4xl text-white">
              {stat.value}
            </p>
            <p className="mt-3 text-sm text-slate-300">{stat.subtext}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

