'use client';
import { motion } from "framer-motion";
import { workflowSteps } from "../lib/data";
import { SectionTitle } from "./SectionTitle";

export function WorkflowTimeline() {
  return (
    <section id="workflow" className="px-4 py-24 sm:px-8 lg:px-12">
      <SectionTitle
        eyebrow="Autonomous flow"
        title="From registration to automated subsidy payout"
        className="mb-16"
      />
      <div className="relative mx-auto max-w-5xl">
        <div className="absolute left-6 top-0 hidden h-full w-px bg-gradient-to-b from-cyan-300/80 via-white/10 to-transparent md:block" />
        <div className="space-y-10">
          {workflowSteps.map((step, index) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 px-6 py-6 md:flex-row md:items-start"
            >
              <div className="flex items-center gap-4">
                <span className="glass flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-semibold text-cyan-200">
                  {step.label}
                </span>
                <div>
                  <p className="text-lg font-semibold text-white">
                    {step.title}
                  </p>
                  <p className="text-sm text-slate-300 md:hidden">
                    {step.description}
                  </p>
                </div>
              </div>
              <p className="text-base text-slate-300 hidden md:block">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

