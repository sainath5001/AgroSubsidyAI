import dotenv from "dotenv";

dotenv.config();

const DEFAULT_RPC = "https://sepolia.infura.io/v3/YOUR_KEY";

export const chainConfig = {
  name: "sepolia",
  chainId: 11155111,
  rpcUrl: process.env.SEPOLIA_RPC_URL || DEFAULT_RPC,
};

export const contractAddresses = {
  farmerRegistry:
    process.env.FARMER_REGISTRY_ADDRESS ||
    "0x022fFe571Dd0d4886a0661eB5d98465F477f7422",
  weatherOracle:
    process.env.WEATHER_ORACLE_ADDRESS ||
    "0xB5746a9441CbA4E0011C1f191Dc68AF8549b5250",
  eligibilityEngine:
    process.env.ELIGIBILITY_ENGINE_ADDRESS ||
    "0x3f7CB167B7Bbe639053c16286dD2C2B0f86F4D81",
  subsidyDistributor:
    process.env.SUBSIDY_DISTRIBUTOR_ADDRESS ||
    "0x9b003ee4E761355c716867089afb6373f23B8fc0",
};

export const runtimeConfig = {
  defaultSchemeId: process.env.DEFAULT_SCHEME_ID || "scheme-001",
  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS || 15000),
  port: Number(process.env.PORT || 4001),
  autoExecuteTx: /^true$/i.test(process.env.AUTO_EXECUTE_TX || "false"),
  autoPayments: /^true$/i.test(process.env.AUTO_PAYMENTS || "false"),
  groqApiKey: process.env.GROQ_API_KEY || "",
  agentPrivateKey: process.env.AGENT_PRIVATE_KEY || "",
};

export const cropTypes = [
  "RICE",
  "WHEAT",
  "CORN",
  "SUGARCANE",
  "COTTON",
  "SOYBEAN",
  "OTHER",
];





