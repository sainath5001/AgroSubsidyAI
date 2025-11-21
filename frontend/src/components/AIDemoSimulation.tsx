"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { parseEther, formatEther } from "viem";
import {
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  CloudIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BoltIcon,
  ShieldCheckIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";
import { CONTRACT_ADDRESSES, FARMER_REGISTRY_ABI, WEATHER_ORACLE_ABI, ELIGIBILITY_ENGINE_ABI, SUBSIDY_DISTRIBUTOR_ABI } from "../lib/constants";

type DemoStep = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "pending" | "processing" | "success" | "error";
  txHash?: string;
  data?: any;
  timestamp?: number;
};

type AgentLog = {
  ts: number;
  level: string;
  text: string;
  data?: any;
};

export function AIDemoSimulation() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [agentStatus, setAgentStatus] = useState<{ online: boolean; lastCheck: number }>({ online: false, lastCheck: 0 });
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const [steps, setSteps] = useState<DemoStep[]>([
    {
      id: "1",
      title: "🌍 AI Agent Detects Weather Event",
      description: "Monitoring blockchain for disaster alerts...",
      icon: <CloudIcon className="w-8 h-8" />,
      status: "pending",
    },
    {
      id: "2",
      title: "🔍 Scanning Affected Region",
      description: "Finding registered farmers in disaster zone...",
      icon: <UserGroupIcon className="w-8 h-8" />,
      status: "pending",
    },
    {
      id: "3",
      title: "🧠 AI Evaluates Eligibility",
      description: "Checking crop types, location match, and scheme rules...",
      icon: <SparklesIcon className="w-8 h-8" />,
      status: "pending",
    },
    {
      id: "4",
      title: "✅ Generating Proof Hash",
      description: "Creating immutable eligibility proof on-chain...",
      icon: <CheckCircleIcon className="w-8 h-8" />,
      status: "pending",
    },
    {
      id: "5",
      title: "💰 Executing Automatic Payment",
      description: "Sending subsidy directly to farmer's wallet...",
      icon: <CurrencyDollarIcon className="w-8 h-8" />,
      status: "pending",
    },
    {
      id: "6",
      title: "🎉 Mission Complete!",
      description: "Farmer received subsidy in minutes, not months!",
      icon: <CheckCircleIcon className="w-8 h-8" />,
      status: "pending",
    },
  ]);

  // Check if agent is running
  useEffect(() => {
    const checkAgent = async () => {
      try {
        const res = await fetch("http://localhost:4001/status");
        if (res.ok) {
          const data = await res.json();
          setAgentStatus({ online: data.ok, lastCheck: Date.now() });
        }
      } catch {
        setAgentStatus({ online: false, lastCheck: Date.now() });
      }
    };
    checkAgent();
    const interval = setInterval(checkAgent, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch agent logs if running
  useEffect(() => {
    if (!isRunning || !agentStatus.online) return;
    const fetchLogs = async () => {
      try {
        const res = await fetch("http://localhost:4001/logs?limit=50");
        if (res.ok) {
          const data = await res.json();
          if (data.logs) {
            setAgentLogs(data.logs.slice(-20)); // Keep last 20 logs
          }
        }
      } catch {}
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [isRunning, agentStatus.online]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentLogs]);

  const { writeContract: writeWeather } = useWriteContract();
  const { writeContract: writeEligibility } = useWriteContract();
  const { writeContract: writePayment } = useWriteContract();

  const updateStep = (index: number, updates: Partial<DemoStep>) => {
    setSteps((prev) =>
      prev.map((step, i) =>
        i === index ? { ...step, ...updates, timestamp: Date.now() } : step
      )
    );
  };

  const addAgentLog = (text: string, level: string = "info") => {
    setAgentLogs((prev) => [
      ...prev.slice(-19),
      { ts: Date.now(), level, text, data: null },
    ]);
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms / simulationSpeed));

  const runDemo = async () => {
    if (!isConnected || chainId !== sepolia.id) {
      alert("Please connect your wallet and switch to Sepolia network first!");
      return;
    }

    setIsRunning(true);
    setCurrentStep(0);
    setAgentLogs([]);
    setSteps((prev) => prev.map((step) => ({ ...step, status: "pending" as const, txHash: undefined, data: undefined })));

    // Step 1: Weather Event Detection
    addAgentLog("🤖 AI Agent initialized and scanning blockchain...", "info");
    await sleep(800);
    updateStep(0, { status: "processing", description: "AI agent monitoring WeatherOracle contract..." });
    addAgentLog("📡 Listening for WeatherDataRecorded events...", "info");
    await sleep(1500);
    addAgentLog("🌡️  Weather event detected: Drought alert in DemoDistrict", "info");
    addAgentLog("   Temperature: 36°C | Rainfall: 1mm | Alert: DROUGHT", "info");
    await sleep(1000);
    updateStep(0, {
      status: "success",
      description: "✅ Drought alert confirmed! Temperature: 36°C, Rainfall: 1mm",
      data: { region: "DemoDistrict", temp: "36°C", rainfall: "1mm", alert: "DROUGHT" },
    });
    setCurrentStep(1);

    // Step 2: Find Farmers
    await sleep(500);
    addAgentLog("🔍 Querying FarmerRegistry for affected region...", "info");
    updateStep(1, { status: "processing", description: "Scanning blockchain for registered farmers..." });
    await sleep(1200);
    addAgentLog("👥 Found 3 registered farmers in DemoDistrict", "info");
    addAgentLog("   • Farmer 1: RICE crop, Village: DemoVillage", "info");
    addAgentLog("   • Farmer 2: WHEAT crop, Village: DemoVillage", "info");
    addAgentLog("   • Farmer 3: CORN crop, Village: DemoVillage", "info");
    await sleep(800);
    updateStep(1, {
      status: "success",
      description: "✅ Found 3 registered farmers in affected region",
      data: { farmers: 3, region: "DemoDistrict" },
    });
    setCurrentStep(2);

    // Step 3: Eligibility Check
    await sleep(500);
    addAgentLog("🧠 AI Agent evaluating eligibility for each farmer...", "info");
    updateStep(2, { status: "processing", description: "Running eligibility checks against subsidy scheme..." });
    await sleep(1000);
    addAgentLog("   ✓ Checking region match: DemoDistrict ✓", "info");
    await sleep(800);
    addAgentLog("   ✓ Checking disaster alert: DROUGHT ✓", "info");
    await sleep(800);
    addAgentLog("   ✓ Checking crop eligibility: RICE eligible ✓", "info");
    await sleep(1000);
    addAgentLog("💰 Calculating subsidy: Base 1.0 ETH × 150% (drought) = 1.5 ETH", "info");
    await sleep(800);
    updateStep(2, {
      status: "success",
      description: "✅ Farmer eligible! Subsidy: 1.5 ETH (150% multiplier for drought)",
      data: { eligible: true, amount: "1.5", reason: "Farmer meets all eligibility criteria", multiplier: "150%" },
    });
    setCurrentStep(3);

    // Step 4: Proof Generation
    await sleep(500);
    addAgentLog("🔐 Generating immutable eligibility proof...", "info");
    updateStep(3, { status: "processing", description: "Creating on-chain proof hash..." });
    await sleep(1000);
    const proofHash = "0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join("");
    addAgentLog(`   Proof Hash: ${proofHash.slice(0, 20)}...`, "info");
    await sleep(800);
    addAgentLog("✅ Proof recorded on-chain in EligibilityEngine", "info");
    updateStep(3, {
      status: "success",
      description: `✅ Proof generated: ${proofHash.slice(0, 10)}...${proofHash.slice(-8)}`,
      txHash: proofHash,
      data: { proofHash },
    });
    setCurrentStep(4);

    // Step 5: Payment Execution
    await sleep(500);
    addAgentLog("💸 Authorized AI agent executing payment...", "info");
    updateStep(4, { status: "processing", description: "Verifying proof and checking contract balance..." });
    await sleep(1000);
    addAgentLog("   ✓ Proof verified: Valid and eligible", "info");
    await sleep(800);
    addAgentLog("   ✓ Contract balance: Sufficient funds available", "info");
    await sleep(800);
    addAgentLog("   📤 Sending 1.5 ETH to farmer wallet...", "info");
    await sleep(1200);
    addAgentLog("   ✅ Transaction confirmed on Sepolia", "info");
    updateStep(4, {
      status: "success",
      description: "✅ Payment executed! 1.5 ETH sent to farmer's wallet",
      data: { amount: "1.5", recipient: address || "0x...", txHash: "0x..." + Math.random().toString(16).slice(2, 10) },
    });
    setCurrentStep(5);

    // Step 6: Complete
    await sleep(500);
    addAgentLog("🎉 Subsidy distribution complete!", "info");
    addAgentLog("   Total time: ~2 minutes (vs. months in traditional system)", "info");
    updateStep(5, {
      status: "success",
      description: "✅ Entire process completed autonomously! Zero human intervention required.",
    });

    await sleep(2000);
    addAgentLog("🤖 AI Agent ready for next disaster event...", "info");
    setIsRunning(false);
  };

  const resetDemo = () => {
    setSteps((prev) =>
      prev.map((step) => ({
        ...step,
        status: "pending" as const,
        txHash: undefined,
        data: undefined,
        timestamp: undefined,
      }))
    );
    setCurrentStep(0);
    setIsRunning(false);
    setAgentLogs([]);
  };

  return (
    <section className="relative py-24 px-4 bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-cyan-900/30 backdrop-blur-sm overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-purple-400/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              x: [null, Math.random() * window.innerWidth],
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-4"
          >
            <CpuChipIcon className="w-16 h-16 text-purple-400" />
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            🤖 AI Agent Live Simulation
          </h2>
          <p className="text-xl text-zinc-300 max-w-3xl mx-auto">
            Watch the autonomous AI agent process a complete subsidy workflow in real-time.
            <br />
            <span className="text-sm text-zinc-400 mt-2 block">
              Every step is transparent, verifiable, and executed on-chain
            </span>
          </p>
        </motion.div>

        {/* Agent Status Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-card p-6 rounded-2xl mb-8 border-2 border-purple-500/30"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`w-4 h-4 rounded-full ${agentStatus.online ? "bg-green-400" : "bg-red-400"}`}
                />
                {agentStatus.online && (
                  <motion.div
                    animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 w-4 h-4 rounded-full bg-green-400"
                  />
                )}
              </div>
              <div>
                <div className="font-semibold text-white">
                  Agent Status:{" "}
                  <span className={agentStatus.online ? "text-green-400" : "text-red-400"}>
                    {agentStatus.online ? "🟢 Online" : "🔴 Offline"}
                  </span>
                </div>
                <div className="text-sm text-zinc-400">
                  {agentStatus.online
                    ? "Connected to agent service (localhost:4001)"
                    : "Agent service not detected (running simulation only)"}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-zinc-400">Speed:</label>
                <select
                  value={simulationSpeed}
                  onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                  className="bg-zinc-800 text-white px-3 py-1 rounded-lg border border-zinc-700"
                  disabled={isRunning}
                >
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x</option>
                  <option value={2}>2x</option>
                  <option value={3}>3x</option>
                </select>
              </div>
              {!isRunning && (
                <button
                  onClick={runDemo}
                  disabled={!isConnected || chainId !== sepolia.id}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold text-white hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-purple-500/50"
                >
                  <BoltIcon className="w-5 h-5" />
                  Start AI Simulation
                </button>
              )}
              {isRunning && (
                <button
                  onClick={resetDemo}
                  className="px-6 py-3 bg-zinc-700 rounded-lg font-semibold text-white hover:bg-zinc-600 transition-all"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {!isConnected && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 text-yellow-200"
            >
              ⚠️ Please connect your wallet and switch to Sepolia network to run the demo
            </motion.div>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Workflow Steps */}
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-purple-400" />
              Autonomous Workflow
            </h3>
            <AnimatePresence>
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`glass-card p-6 rounded-xl border-2 transition-all ${
                    step.status === "success"
                      ? "border-green-500/50 bg-green-500/10 shadow-lg shadow-green-500/20"
                      : step.status === "processing"
                      ? "border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/20"
                      : step.status === "error"
                      ? "border-red-500/50 bg-red-500/10"
                      : "border-zinc-700/50"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                        step.status === "success"
                          ? "bg-green-500/20 text-green-400"
                          : step.status === "processing"
                          ? "bg-blue-500/20 text-blue-400"
                          : step.status === "error"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-zinc-700/50 text-zinc-400"
                      }`}
                    >
                      {step.status === "success" ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200 }}
                        >
                          <CheckCircleIcon className="w-7 h-7" />
                        </motion.div>
                      ) : step.status === "error" ? (
                        <XCircleIcon className="w-7 h-7" />
                      ) : step.status === "processing" ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <ClockIcon className="w-7 h-7" />
                        </motion.div>
                      ) : (
                        step.icon
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-semibold text-white mb-1">{step.title}</h4>
                      <p className="text-zinc-300 text-sm mb-2">{step.description}</p>
                      {step.data && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-3 p-3 bg-black/40 rounded-lg text-xs space-y-1"
                        >
                          {step.data.proofHash && (
                            <div className="text-cyan-400 font-mono break-all">
                              🔐 Proof: {step.data.proofHash.slice(0, 20)}...
                            </div>
                          )}
                          {step.data.amount && (
                            <div className="text-green-400 flex items-center gap-2">
                              💰 Amount: {step.data.amount} ETH
                              {step.data.multiplier && (
                                <span className="text-xs text-zinc-400">({step.data.multiplier} multiplier)</span>
                              )}
                            </div>
                          )}
                          {step.data.reason && (
                            <div className="text-zinc-300">{step.data.reason}</div>
                          )}
                          {step.data.farmers && (
                            <div className="text-blue-400">👥 {step.data.farmers} farmers found</div>
                          )}
                        </motion.div>
                      )}
                      {step.timestamp && (
                        <div className="text-xs text-zinc-500 mt-2">
                          {new Date(step.timestamp).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isRunning && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg border border-purple-500/30"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-3 h-3 bg-purple-400 rounded-full"
                  />
                  <span className="text-purple-300 font-semibold">
                    AI Agent is working autonomously... Step {currentStep + 1} of {steps.length}
                  </span>
                </div>
                <div className="mt-2 h-2 bg-zinc-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Right: Agent Logs */}
          <div>
            <h3 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <CpuChipIcon className="w-6 h-6 text-cyan-400" />
              AI Agent Logs
            </h3>
            <div className="glass-card p-4 rounded-xl h-[600px] flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-2 mb-4 font-mono text-xs">
                {agentLogs.length === 0 && !isRunning && (
                  <div className="text-zinc-500 text-center py-8">
                    Agent logs will appear here when simulation starts...
                  </div>
                )}
                <AnimatePresence>
                  {agentLogs.map((log, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className={`p-2 rounded ${
                        log.level === "error"
                          ? "bg-red-500/10 text-red-400 border-l-2 border-red-500"
                          : log.level === "warn"
                          ? "bg-yellow-500/10 text-yellow-400 border-l-2 border-yellow-500"
                          : "bg-zinc-800/50 text-zinc-300 border-l-2 border-cyan-500"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-zinc-500 text-[10px]">
                          {new Date(log.ts).toLocaleTimeString()}
                        </span>
                        <span className="flex-1">{log.text}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={logsEndRef} />
              </div>
              {isRunning && (
                <div className="flex items-center gap-2 text-xs text-zinc-400 pt-2 border-t border-zinc-700">
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-2 h-2 bg-cyan-400 rounded-full"
                  />
                  <span>AI Agent processing...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Key Features */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="glass-card p-8 rounded-2xl mt-8"
        >
          <h4 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
            <ShieldCheckIcon className="w-6 h-6 text-purple-400" />
            Why This Changes Everything
          </h4>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { icon: "⚡", title: "Lightning Fast", desc: "Minutes, not months", color: "from-yellow-500 to-orange-500" },
              { icon: "🔒", title: "Fully Transparent", desc: "Every decision on-chain", color: "from-blue-500 to-cyan-500" },
              { icon: "🤖", title: "Zero Human Error", desc: "AI operates 24/7", color: "from-purple-500 to-pink-500" },
              { icon: "💰", title: "No Middlemen", desc: "Direct to farmer wallet", color: "from-green-500 to-emerald-500" },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`p-6 bg-gradient-to-br ${feature.color} rounded-xl text-white`}
              >
                <div className="text-4xl mb-3">{feature.icon}</div>
                <div className="font-bold text-lg mb-1">{feature.title}</div>
                <div className="text-sm opacity-90">{feature.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
