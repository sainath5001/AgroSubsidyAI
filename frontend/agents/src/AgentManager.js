import express from "express";
import cors from "cors";
import Groq from "groq-sdk";
import { randomBytes } from "crypto";
import { ethers } from "ethers";
import cron from "node-cron";

import {
  chainConfig,
  contractAddresses,
  runtimeConfig,
  cropTypes,
} from "./config.js";
import {
  FARMER_REGISTRY_ABI,
  WEATHER_ORACLE_ABI,
  ELIGIBILITY_ENGINE_ABI,
  SUBSIDY_DISTRIBUTOR_ABI,
} from "./abis.js";

const LOG_MAX = 1000;
const LOGS = [];

function addLog(level, text, data) {
  const entry = { ts: Date.now(), level, text, data };
  LOGS.push(entry);
  if (LOGS.length > LOG_MAX) LOGS.shift();
  const prefix = `[${new Date(entry.ts).toISOString()}] ${level.toUpperCase()} `;
  if (level === "error") console.error(prefix + text);
  else if (level === "warn") console.warn(prefix + text);
  else console.log(prefix + text);
  return entry;
}

const provider = new ethers.providers.JsonRpcProvider(chainConfig.rpcUrl, {
  name: chainConfig.name,
  chainId: chainConfig.chainId,
});

const signer = runtimeConfig.agentPrivateKey
  ? new ethers.Wallet(runtimeConfig.agentPrivateKey, provider)
  : null;

const farmerRegistry = new ethers.Contract(
  contractAddresses.farmerRegistry,
  FARMER_REGISTRY_ABI,
  provider,
);
const weatherOracle = new ethers.Contract(
  contractAddresses.weatherOracle,
  WEATHER_ORACLE_ABI,
  provider,
);
const eligibilityReader = new ethers.Contract(
  contractAddresses.eligibilityEngine,
  ELIGIBILITY_ENGINE_ABI,
  provider,
);
const eligibilityWriter = signer
  ? new ethers.Contract(
      contractAddresses.eligibilityEngine,
      ELIGIBILITY_ENGINE_ABI,
      signer,
    )
  : null;
const distributorWriter = signer
  ? new ethers.Contract(
      contractAddresses.subsidyDistributor,
      SUBSIDY_DISTRIBUTOR_ABI,
      signer,
    )
  : null;
const distributorReader = new ethers.Contract(
  contractAddresses.subsidyDistributor,
  SUBSIDY_DISTRIBUTOR_ABI,
  provider,
);

const weatherInterface = new ethers.utils.Interface(WEATHER_ORACLE_ABI);
const WEATHER_TOPIC = weatherInterface.getEventTopic("WeatherDataRecorded");

const groqClient = runtimeConfig.groqApiKey
  ? new Groq({ apiKey: runtimeConfig.groqApiKey })
  : null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const rnd = (min, max) => Math.random() * (max - min) + min;
const fakeTx = () => `0x${randomBytes(32).toString("hex")}`;

async function confirmVirtualTx(txHash, label = "tx") {
  const gasUsed = Math.floor(rnd(45_000, 130_000));
  addLog(
    "info",
    `⛏️  mined ${label} ${txHash.slice(0, 10)}… | gas ${gasUsed.toLocaleString()}`,
  );
  await sleep(rnd(250, 600));
  const confirmations = Math.floor(rnd(1, 4));
  for (let i = 1; i <= confirmations; i++) {
    addLog("info", `✅ ${label} ${txHash.slice(0, 10)}… confirmations: ${i}`);
    await sleep(rnd(200, 450));
  }
}

function cropName(index) {
  return cropTypes[index] || "UNKNOWN";
}

async function aiSummarize(event, farmers) {
  if (!groqClient) {
    return `Analyzed ${farmers.length} farmers in ${event.region}. Drought: ${event.droughtAlert}, Flood: ${event.floodAlert}.`;
  }
  try {
    const response = await groqClient.chat.completions.create({
      model: "llama3-8b-8192",
      temperature: 0.2,
      max_tokens: 200,
      messages: [
        {
          role: "system",
          content:
            "You are an agricultural relief AI. Provide concise reasoning referencing weather severity and fairness.",
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              region: event.region,
              droughtAlert: event.droughtAlert,
              floodAlert: event.floodAlert,
              rainfall: event.rainfall,
              temperature: event.temperature,
              farmers: farmers.map((f) => ({
                farmer: f.address,
                crop: cropName(f.profile.cropType),
                eligible: f.decision?.isEligible || false,
                reason: f.decision?.reason || "",
              })),
            },
            null,
            2,
          ),
        },
      ],
    });
    return response.choices[0].message.content.trim();
  } catch (err) {
    addLog("warn", `Groq summary failed: ${err.message}`);
    return `Weather summary unavailable (fallback). Farmers evaluated: ${farmers.length}.`;
  }
}

async function evaluateFarmerEligibility(farmer, event, schemeId) {
  const profileTuple = await farmerRegistry.getFarmerProfile(farmer);
  const profile = {
    wallet: profileTuple.wallet,
    landProofHash: profileTuple.landProofHash,
    district: profileTuple.district,
    village: profileTuple.village,
    cropType: Number(profileTuple.cropType),
    isActive: profileTuple.isActive,
  };

  if (!profile.isActive) {
    addLog(
      "warn",
      `Skipping ${farmer} — profile inactive for region ${event.region}`,
    );
    return { address: farmer, profile, decision: null };
  }

  let preview;
  try {
    preview = await eligibilityReader.callStatic.checkEligibility(
      farmer,
      event.eventId,
      schemeId,
    );
  } catch (err) {
    addLog(
      "warn",
      `callStatic.checkEligibility failed for ${farmer}: ${err.message}`,
    );
    return { address: farmer, profile, decision: null };
  }

  if (!preview.isEligible) {
    addLog(
      "info",
      `Farmer ${farmer} not eligible: ${preview.reason || "rule mismatch"}`,
    );
    return { address: farmer, profile, decision: preview };
  }

  let decision = preview;
  if (runtimeConfig.autoExecuteTx && eligibilityWriter) {
    try {
      const tx = await eligibilityWriter.checkEligibility(
        farmer,
        event.eventId,
        schemeId,
      );
      addLog(
        "info",
        `📤 checkEligibility tx sent for ${farmer} — hash ${tx.hash}`,
      );
      await tx.wait(1);
      decision = await eligibilityReader.getLatestDecision(farmer);
      addLog(
        "info",
        `   ✔️ on-chain decision stored (proof ${decision.proofHash})`,
      );
    } catch (err) {
      addLog(
        "error",
        `checkEligibility tx failed for ${farmer}: ${err.message}`,
      );
    }
  } else {
    const simulated = fakeTx();
    addLog(
      "info",
      `🧪 Simulated eligibility approval for ${farmer} (tx ${simulated.slice(0, 10)}…)`,
    );
    await confirmVirtualTx(simulated, "eligibility");
  }

  return { address: farmer, profile, decision };
}

async function attemptPayment(farmerResult) {
  if (!farmerResult.decision?.isEligible) return;
  const { decision, address } = farmerResult;

  if (await distributorReader.isPaymentExecuted(decision.proofHash)) {
    addLog(
      "info",
      `Payment already executed for proof ${decision.proofHash.slice(0, 10)}…`,
    );
    return;
  }

  if (runtimeConfig.autoPayments && distributorWriter) {
    try {
      const tx = await distributorWriter.executePayment(
        address,
        decision.proofHash,
        decision.subsidyAmount,
      );
      addLog(
        "info",
        `💸 executePayment submitted for ${address} — hash ${tx.hash}`,
      );
      await tx.wait(1);
      addLog(
        "info",
        `   ✅ subsidy sent (${ethers.utils.formatEther(decision.subsidyAmount)} ETH)`,
      );
    } catch (err) {
      addLog("error", `executePayment failed for ${address}: ${err.message}`);
    }
  } else {
    const virtual = fakeTx();
    addLog(
      "info",
      `💤 Auto payments disabled — virtual payout ${virtual.slice(0, 10)}…`,
    );
    await confirmVirtualTx(virtual, "payout");
  }
}

class SubsidyAgentManager {
  constructor() {
    this.lastBlock = 0;
    this.interval = null;
  }

  async start() {
    addLog(
      "info",
      `🚀 Subsidy agent starting on ${chainConfig.name} (poll every ${runtimeConfig.pollIntervalMs} ms)`,
    );
    this.lastBlock = await provider.getBlockNumber();
    await this.processLatestHistoricalEvent();
    this.interval = setInterval(
      () =>
        this.pollWeatherEvents().catch((err) =>
          addLog("error", `Polling error: ${err.message}`),
        ),
      runtimeConfig.pollIntervalMs,
    );
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
  }

  async processLatestHistoricalEvent() {
    try {
      const ids = await weatherOracle.getAllEventIds();
      if (!ids.length) {
        addLog("info", "No historical weather events yet.");
        return;
      }
      const latestId = ids[ids.length - 1];
      const event = await weatherOracle.getWeatherEvent(latestId);
      await this.handleWeatherEvent(event);
    } catch (err) {
      addLog("warn", `Unable to fetch historical event: ${err.message}`);
    }
  }

  async pollWeatherEvents() {
    const current = await provider.getBlockNumber();
    const fromBlock = this.lastBlock + 1;
    const toBlock = current;
    if (toBlock < fromBlock) return;

    const filter = {
      address: contractAddresses.weatherOracle,
      fromBlock,
      toBlock,
      topics: [WEATHER_TOPIC],
    };

    const logs = await provider.getLogs(filter);
    if (logs.length) {
      for (const logRec of logs) {
        const parsed = weatherInterface.parseLog(logRec);
        const event = {
          eventId: parsed.args.eventId,
          region: parsed.args.region,
          temperature: Number(parsed.args.temperature),
          rainfall: Number(parsed.args.rainfall),
          droughtAlert: parsed.args.droughtAlert,
          floodAlert: parsed.args.floodAlert,
          timestamp: Number(parsed.args.timestamp),
        };
        await this.handleWeatherEvent(event);
      }
    }

    this.lastBlock = toBlock;
  }

  async handleWeatherEvent(event) {
    addLog(
      "info",
      `🌦️ Weather event ${event.eventId} | Region ${event.region} | drought=${event.droughtAlert} flood=${event.floodAlert}`,
    );

    const farmers = await farmerRegistry.getFarmersByDistrict(event.region);
    if (!farmers.length) {
      addLog("warn", `No farmers registered under district ${event.region}`);
      return;
    }

    addLog("info", `🔍 Evaluating ${farmers.length} farmers for ${event.region}`);
    const results = [];

    for (const farmer of farmers) {
      const result = await evaluateFarmerEligibility(
        farmer,
        event,
        runtimeConfig.defaultSchemeId,
      );
      results.push(result);
      if (result.decision?.isEligible) {
        await attemptPayment(result);
      }
    }

    const summary = await aiSummarize(event, results);
    addLog("info", `🧠 AI summary: ${summary}`);
  }

  async simulateEvent(payload) {
    const event = {
      eventId: payload.eventId || `demo-${Date.now()}`,
      region: payload.region || "DemoDistrict",
      temperature: payload.temperature ?? 3000,
      rainfall: payload.rainfall ?? 500,
      droughtAlert: Boolean(payload.droughtAlert ?? true),
      floodAlert: Boolean(payload.floodAlert ?? false),
      timestamp: Math.floor(Date.now() / 1000),
    };
    await this.handleWeatherEvent(event);
    return event;
  }
}

const manager = new SubsidyAgentManager();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
  }),
);
app.use((req, res, next) => {
  res.setHeader("Vary", "Origin");
  next();
});

app.get("/logs", (req, res) => {
  const since = Number(req.query.since || 0);
  const limit = Math.min(Number(req.query.limit || 200), 1000);
  const out = since
    ? LOGS.filter((entry) => entry.ts > since)
    : LOGS.slice(-limit);
  res.json({ ok: true, logs: out, now: Date.now() });
});

app.get("/status", (_req, res) => {
  res.json({
    ok: true,
    network: chainConfig.name,
    contracts: contractAddresses,
    schemeId: runtimeConfig.defaultSchemeId,
    autoExecuteTx: runtimeConfig.autoExecuteTx,
    autoPayments: runtimeConfig.autoPayments,
    groq: Boolean(groqClient),
    signer: Boolean(signer),
  });
});

app.get("/demo", async (_req, res) => {
  const demo = await manager.simulateEvent({
    region: "DemoDistrict",
    droughtAlert: true,
    rainfall: 100,
    temperature: 3600,
  });
  res.json({ ok: true, event: demo });
});

app.post("/simulate", async (req, res) => {
  const event = await manager.simulateEvent(req.body || {});
  res.json({ ok: true, event });
});

async function startServer() {
  addLog("info", "🤖 Initializing AgroSubsidyAI agents…");
  if (signer) {
    addLog("info", `   • signer address: ${await signer.getAddress()}`);
  } else {
    addLog("warn", "   • no agent private key — running in read-only mode");
  }
  if (groqClient) addLog("info", "   • Groq AI enabled");
  else addLog("warn", "   • Groq API key missing — fallback reasoning");

  app.listen(runtimeConfig.port, () => {
    addLog("info", `📡 REST server listening on http://localhost:${runtimeConfig.port}`);
    addLog("info", "   • GET /logs");
    addLog("info", "   • GET /status");
    addLog("info", "   • GET /demo");
    addLog("info", "   • POST /simulate");
  });

  await manager.start();
}

async function startCronMode() {
  addLog("info", "⏱️  Starting cron mode (15 min cadence)");
  if (!runtimeConfig.agentPrivateKey) {
    addLog(
      "warn",
      "Cron mode typically requires a signer for payouts. Continuing in read-only mode.",
    );
  }
  await manager.processLatestOnBoot();
  cron.schedule("*/15 * * * *", async () => {
    addLog("info", "⏱️  Cron tick → polling latest weather events");
    try {
      await manager.pollWeatherEvents();
    } catch (err) {
      addLog("error", `Cron poll failed: ${err.message}`);
    }
  });
}

const mode = process.argv[2] || "server";

if (mode === "demo") {
  manager
    .simulateEvent({})
    .then(() => process.exit(0))
    .catch((err) => {
      addLog("error", `Demo error: ${err.message}`);
      process.exit(1);
    });
} else if (mode === "cron") {
  startCronMode().catch((err) => addLog("error", `Cron boot error: ${err.message}`));
} else {
  startServer().catch((err) => addLog("error", `Boot error: ${err.message}`));
}

