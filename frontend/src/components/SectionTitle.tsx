 'use client';
import { motion } from "framer-motion";
import clsx from "clsx";

type SectionTitleProps = {
  eyebrow: string;
  title: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionTitle({
  eyebrow,
  title,
  align = "center",
  className,
}: SectionTitleProps) {
  return (
    <div
      className={clsx(
        "mx-auto max-w-3xl text-balance",
        align === "center" ? "text-center" : "text-left",
        className,
      )}
    >
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300"
      >
        {eyebrow}
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl"
      >
        {title}
      </motion.h2>
    </div>
  );
}

