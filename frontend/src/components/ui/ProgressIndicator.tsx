"use client";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

interface Step {
  id: string;
  label: string;
  completed: boolean;
  active: boolean;
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function ProgressIndicator({ steps, currentStep }: ProgressIndicatorProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-700/50 -z-10" />
        <motion.div
          className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 -z-10"
          initial={{ width: 0 }}
          animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.5 }}
        />

        {/* Steps */}
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center flex-1">
            <motion.div
              className={`relative w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                step.completed
                  ? "bg-emerald-500 border-emerald-500"
                  : step.active
                  ? "bg-blue-500 border-blue-500 ring-4 ring-blue-500/20"
                  : "bg-slate-800 border-slate-700"
              }`}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              {step.completed ? (
                <CheckCircleIcon className="w-6 h-6 text-white" />
              ) : (
                <span className="text-sm font-semibold text-white">{index + 1}</span>
              )}
            </motion.div>
            <motion.div
              className="mt-2 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <p
                className={`text-xs font-medium ${
                  step.active ? "text-white" : step.completed ? "text-slate-400" : "text-slate-600"
                }`}
              >
                {step.label}
              </p>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}

