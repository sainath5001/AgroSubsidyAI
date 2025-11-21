'use client';
import { motion } from "framer-motion";
import { problemVsSolution } from "../lib/data";
import { SectionTitle } from "./SectionTitle";

export function ProblemSolution() {
  return (
    <section className="relative px-4 py-20 sm:px-8 lg:px-12">
      <SectionTitle
        eyebrow="Story"
        title="We eliminated every bureaucratic pain point"
        className="mb-12"
      />
      <div className="grid gap-6 md:grid-cols-2">
        {problemVsSolution.map((column) => (
          <motion.div
            key={column.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass rounded-3xl p-8"
          >
            <p
              className={`text-sm font-semibold uppercase tracking-[0.3em] ${
                column.tone === "problem" ? "text-rose-300" : "text-emerald-300"
              }`}
            >
              {column.title}
            </p>
            <ul className="mt-6 space-y-4 text-lg text-slate-100">
              {column.items.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    className={`mt-1 inline-block h-2 w-2 rounded-full ${
                      column.tone === "problem" ? "bg-rose-400" : "bg-emerald-400"
                    }`}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

