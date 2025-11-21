export const heroHighlights = [
  "AI verifies land ownership & crop claims",
  "Weather oracle tracks droughts and floods in real time",
  "Subsidies released instantly to farmer wallets",
];

export const problemVsSolution = [
  {
    title: "Real world right now",
    items: [
      "Visit government office multiple times",
      "Paper forms, manual verification, bribes",
      "Months of delay, middlemen steal payouts",
    ],
    tone: "problem",
  },
  {
    title: "With AgroSubsidyAI",
    items: [
      "Register once with wallet + land proof",
      "AI agent cross-checks oracles & schemes",
      "Automatic payouts in minutes, no bribes",
    ],
    tone: "solution",
  },
];

export const workflowSteps = [
  {
    label: "01",
    title: "Farmer registers once",
    description:
      "Wallet address, land proof hash, district, village, crop type stored on-chain.",
  },
  {
    label: "02",
    title: "Weather data streams in",
    description:
      "Authorized WeatherOracle feeds temperature, rainfall, flood/drought alerts daily.",
  },
  {
    label: "03",
    title: "AI agent watches regions",
    description:
      "ERC-8004 agent scans alerts, subsidy schemes, and cross-matches farmer profiles.",
  },
  {
    label: "04",
    title: "Eligibility engine decides",
    description:
      "Checks region match, crop rules, scheme window, and generates tamper-proof proofs.",
  },
  {
    label: "05",
    title: "Autonomous payouts",
    description:
      "Authorized agent triggers SubsidyDistributor to transfer native/erc20 funds.",
  },
  {
    label: "06",
    title: "Transparent audit trail",
    description:
      "Every decision emits proof hash + reason so citizens and auditors can verify.",
  },
];

export const impactStats = [
  {
    label: "Average payout time",
    value: "6 min",
    subtext: "from disaster alert to farmer wallet in our pilot sims",
  },
  {
    label: "Farmers protected",
    value: "12,480",
    subtext: "across seven districts with real registries & mock payouts",
  },
  {
    label: "Paperwork eliminated",
    value: "100%",
    subtext: "No offices. No forms. Just cryptographic proofs + AI reasoning.",
  },
];

export const dashboardTabs = [
  {
    id: "farmer",
    title: "Farmer view",
    badge: "Live weather signal",
    description:
      "Shows weather alerts for their district, eligibility status, and payouts.",
    highlights: [
      "District: Baghpat, Village: Naurangabad",
      "Crop: RICE • Status: Eligible",
      "Subsidy amount: 1.5 ETH (drought multiplier)",
    ],
  },
  {
    id: "admin",
    title: "Admin control",
    badge: "Scheme monitor",
    description:
      "Activate schemes, approve oracles, and watch subsidy reserves in real-time.",
    highlights: [
      "Scheme: Drought Relief 2025 • Active",
      "Reserve health: 92% • Agents online: 3",
      "Next review window: 14:00 UTC",
    ],
  },
  {
    id: "agent",
    title: "AI agent cockpit",
    badge: "ERC-8004 hopping",
    description:
      "Shows the agent verifying proofs, moving across chains, and triggering payouts.",
    highlights: [
      "Latest weather event: 0xevent-044",
      "Proof hash: 0x4a91…6de2 • Valid",
      "Payment tx simulated (auto execute pending)",
    ],
  },
];




