export const CONTRACT_ADDRESSES = {
  farmerRegistry: "0x022fFe571Dd0d4886a0661eB5d98465F477f7422",
  weatherOracle: "0xB5746a9441CbA4E0011C1f191Dc68AF8549b5250",
  eligibilityEngine: "0x3f7CB167B7Bbe639053c16286dD2C2B0f86F4D81",
  subsidyDistributor: "0x9b003ee4E761355c716867089afb6373f23B8fc0",
} as const;

export const WEATHER_ORACLE_ABI = [
  {
    type: "constructor",
    inputs: [
      {
        name: "initialOwner",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "authorizeOracle",
    inputs: [
      {
        name: "oracleAddress",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "authorizedOracles",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "checkDisasterAlerts",
    inputs: [
      {
        name: "region",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "hasDrought",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "hasFlood",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "latestEventId",
        type: "string",
        internalType: "string",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "eventIds",
    inputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "string",
        internalType: "string",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAllEventIds",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "string[]",
        internalType: "string[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAllOracles",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address[]",
        internalType: "address[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getLatestEventForRegion",
    inputs: [
      {
        name: "region",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "weatherEvent",
        type: "tuple",
        internalType: "struct WeatherOracle.WeatherEvent",
        components: [
          {
            name: "region",
            type: "string",
            internalType: "string",
          },
          {
            name: "timestamp",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "temperature",
            type: "int256",
            internalType: "int256",
          },
          {
            name: "rainfall",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "droughtAlert",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "floodAlert",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "eventId",
            type: "string",
            internalType: "string",
          },
          {
            name: "oracleAddress",
            type: "address",
            internalType: "address",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getOracleCount",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRegionEvents",
    inputs: [
      {
        name: "region",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "events",
        type: "string[]",
        internalType: "string[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTotalEvents",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getWeatherEvent",
    inputs: [
      {
        name: "eventId",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "weatherEvent",
        type: "tuple",
        internalType: "struct WeatherOracle.WeatherEvent",
        components: [
          {
            name: "region",
            type: "string",
            internalType: "string",
          },
          {
            name: "timestamp",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "temperature",
            type: "int256",
            internalType: "int256",
          },
          {
            name: "rainfall",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "droughtAlert",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "floodAlert",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "eventId",
            type: "string",
            internalType: "string",
          },
          {
            name: "oracleAddress",
            type: "address",
            internalType: "address",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "oracleList",
    inputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "recordWeatherData",
    inputs: [
      {
        name: "region",
        type: "string",
        internalType: "string",
      },
      {
        name: "temperature",
        type: "int256",
        internalType: "int256",
      },
      {
        name: "rainfall",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "droughtAlert",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "floodAlert",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "eventId",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "regionEvents",
    inputs: [
      {
        name: "",
        type: "string",
        internalType: "string",
      },
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "string",
        internalType: "string",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "revokeOracle",
    inputs: [
      {
        name: "oracleAddress",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [
      {
        name: "newOwner",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "weatherEvents",
    inputs: [
      {
        name: "",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "region",
        type: "string",
        internalType: "string",
      },
      {
        name: "timestamp",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "temperature",
        type: "int256",
        internalType: "int256",
      },
      {
        name: "rainfall",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "droughtAlert",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "floodAlert",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "eventId",
        type: "string",
        internalType: "string",
      },
      {
        name: "oracleAddress",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "OracleAuthorized",
    inputs: [
      {
        name: "oracle",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "OracleRevoked",
    inputs: [
      {
        name: "oracle",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      {
        name: "previousOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "WeatherDataRecorded",
    inputs: [
      {
        name: "eventId",
        type: "string",
        indexed: true,
        internalType: "string",
      },
      {
        name: "region",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "temperature",
        type: "int256",
        indexed: false,
        internalType: "int256",
      },
      {
        name: "rainfall",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "droughtAlert",
        type: "bool",
        indexed: false,
        internalType: "bool",
      },
      {
        name: "floodAlert",
        type: "bool",
        indexed: false,
        internalType: "bool",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "OwnableInvalidOwner",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "OwnableUnauthorizedAccount",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "ReentrancyGuardReentrantCall",
    inputs: [],
  },
] as const;

export const SUBSIDY_DISTRIBUTOR_ABI = [
  {
    type: "constructor",
    inputs: [
      {
        name: "initialOwner",
        type: "address",
        internalType: "address",
      },
      {
        name: "_eligibilityEngine",
        type: "address",
        internalType: "address",
      },
      {
        name: "_paymentToken",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "receive",
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "agentList",
    inputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allPayments",
    inputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "authorizeAgent",
    inputs: [
      {
        name: "agentAddress",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "authorizedAgents",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "depositERC20Funds",
    inputs: [
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "depositFunds",
    inputs: [],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "eligibilityEngine",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract EligibilityEngine",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "executePayment",
    inputs: [
      {
        name: "farmerAddress",
        type: "address",
        internalType: "address",
      },
      {
        name: "eligibilityProof",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "farmerPayments",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAgentCount",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAllAgents",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address[]",
        internalType: "address[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getBalance",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getFarmerPayments",
    inputs: [
      {
        name: "farmerAddress",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bytes32[]",
        internalType: "bytes32[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPayment",
    inputs: [
      {
        name: "proofHash",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [
      {
        name: "payment",
        type: "tuple",
        internalType: "struct SubsidyDistributor.SubsidyPayment",
        components: [
          {
            name: "farmer",
            type: "address",
            internalType: "address",
          },
          {
            name: "amount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "eligibilityProof",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "timestamp",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "executed",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "paymentToken",
            type: "address",
            internalType: "address",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTotalPayments",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isPaymentExecuted",
    inputs: [
      {
        name: "proofHash",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "paymentToken",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IERC20",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "payments",
    inputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [
      {
        name: "farmer",
        type: "address",
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "eligibilityProof",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "timestamp",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "executed",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "paymentToken",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "revokeAgent",
    inputs: [
      {
        name: "agentAddress",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [
      {
        name: "newOwner",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawFunds",
    inputs: [
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "to",
        type: "address",
        internalType: "address payable",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "AgentAuthorized",
    inputs: [
      {
        name: "agent",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "AgentRevoked",
    inputs: [
      {
        name: "agent",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "FundsDeposited",
    inputs: [
      {
        name: "depositor",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "token",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "FundsWithdrawn",
    inputs: [
      {
        name: "recipient",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "token",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      {
        name: "previousOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PaymentExecuted",
    inputs: [
      {
        name: "farmer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "eligibilityProof",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32",
      },
      {
        name: "paymentToken",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "OwnableInvalidOwner",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "OwnableUnauthorizedAccount",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "ReentrancyGuardReentrantCall",
    inputs: [],
  },
  {
    type: "error",
    name: "SafeERC20FailedOperation",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
] as const;

export const FARMER_REGISTRY_ABI = [
  {
    type: "constructor",
    inputs: [
      {
        name: "initialOwner",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deactivateFarmer",
    inputs: [
      {
        name: "farmerAddress",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "farmers",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "wallet",
        type: "address",
        internalType: "address",
      },
      {
        name: "landProofHash",
        type: "string",
        internalType: "string",
      },
      {
        name: "district",
        type: "string",
        internalType: "string",
      },
      {
        name: "village",
        type: "string",
        internalType: "string",
      },
      {
        name: "latitude",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "longitude",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "cropType",
        type: "uint8",
        internalType: "enum FarmerRegistry.CropType",
      },
      {
        name: "registrationTimestamp",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "isActive",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAllFarmers",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address[]",
        internalType: "address[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getFarmerProfile",
    inputs: [
      {
        name: "farmerAddress",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "profile",
        type: "tuple",
        internalType: "struct FarmerRegistry.FarmerProfile",
        components: [
          {
            name: "wallet",
            type: "address",
            internalType: "address",
          },
          {
            name: "landProofHash",
            type: "string",
            internalType: "string",
          },
          {
            name: "district",
            type: "string",
            internalType: "string",
          },
          {
            name: "village",
            type: "string",
            internalType: "string",
          },
          {
            name: "latitude",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "longitude",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "cropType",
            type: "uint8",
            internalType: "enum FarmerRegistry.CropType",
          },
          {
            name: "registrationTimestamp",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "isActive",
            type: "bool",
            internalType: "bool",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getFarmersByDistrict",
    inputs: [
      {
        name: "district",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address[]",
        internalType: "address[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTotalFarmers",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isFarmerActive",
    inputs: [
      {
        name: "farmerAddress",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isRegistered",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "reactivateFarmer",
    inputs: [
      {
        name: "farmerAddress",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "registerFarmer",
    inputs: [
      {
        name: "landProofHash",
        type: "string",
        internalType: "string",
      },
      {
        name: "district",
        type: "string",
        internalType: "string",
      },
      {
        name: "village",
        type: "string",
        internalType: "string",
      },
      {
        name: "latitude",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "longitude",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "cropType",
        type: "uint8",
        internalType: "enum FarmerRegistry.CropType",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "registeredFarmers",
    inputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [
      {
        name: "newOwner",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updateProfile",
    inputs: [
      {
        name: "landProofHash",
        type: "string",
        internalType: "string",
      },
      {
        name: "district",
        type: "string",
        internalType: "string",
      },
      {
        name: "village",
        type: "string",
        internalType: "string",
      },
      {
        name: "latitude",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "longitude",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "cropType",
        type: "uint8",
        internalType: "enum FarmerRegistry.CropType",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "FarmerDeactivated",
    inputs: [
      {
        name: "farmer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "FarmerUpdated",
    inputs: [
      {
        name: "farmer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "district",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "village",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "cropType",
        type: "uint8",
        indexed: false,
        internalType: "enum FarmerRegistry.CropType",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "FarmerRegistered",
    inputs: [
      {
        name: "farmer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "district",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "village",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "cropType",
        type: "uint8",
        indexed: false,
        internalType: "enum FarmerRegistry.CropType",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "FarmerReactivated",
    inputs: [
      {
        name: "farmer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
] as const;

export const ELIGIBILITY_ENGINE_ABI = [
  {
    type: "constructor",
    inputs: [
      {
        name: "initialOwner",
        type: "address",
        internalType: "address",
      },
      {
        name: "_farmerRegistry",
        type: "address",
        internalType: "address",
      },
      {
        name: "_weatherOracle",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "checkEligibility",
    inputs: [
      {
        name: "farmerAddress",
        type: "address",
        internalType: "address",
      },
      {
        name: "weatherEventId",
        type: "string",
        internalType: "string",
      },
      {
        name: "schemeId",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "decision",
        type: "tuple",
        internalType: "struct EligibilityEngine.EligibilityDecision",
        components: [
          {
            name: "farmer",
            type: "address",
            internalType: "address",
          },
          {
            name: "isEligible",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "subsidyAmount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "proofHash",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "reason",
            type: "string",
            internalType: "string",
          },
          {
            name: "weatherEventId",
            type: "string",
            internalType: "string",
          },
          {
            name: "timestamp",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "createSubsidyScheme",
    inputs: [
      {
        name: "schemeId",
        type: "string",
        internalType: "string",
      },
      {
        name: "schemeName",
        type: "string",
        internalType: "string",
      },
      {
        name: "baseAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "droughtMultiplier",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "floodMultiplier",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "eligibleCrops",
        type: "string[]",
        internalType: "string[]",
      },
      {
        name: "startDate",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "endDate",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "farmerDecisions",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "farmer",
        type: "address",
        internalType: "address",
      },
      {
        name: "isEligible",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "subsidyAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "proofHash",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "reason",
        type: "string",
        internalType: "string",
      },
      {
        name: "weatherEventId",
        type: "string",
        internalType: "string",
      },
      {
        name: "timestamp",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "farmerRegistry",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract FarmerRegistry",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAllSchemeIds",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "string[]",
        internalType: "string[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getDecisionCount",
    inputs: [
      {
        name: "farmerAddress",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getFarmerDecision",
    inputs: [
      {
        name: "farmerAddress",
        type: "address",
        internalType: "address",
      },
      {
        name: "index",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "decision",
        type: "tuple",
        internalType: "struct EligibilityEngine.EligibilityDecision",
        components: [
          {
            name: "farmer",
            type: "address",
            internalType: "address",
          },
          {
            name: "isEligible",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "subsidyAmount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "proofHash",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "reason",
            type: "string",
            internalType: "string",
          },
          {
            name: "weatherEventId",
            type: "string",
            internalType: "string",
          },
          {
            name: "timestamp",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getLatestDecision",
    inputs: [
      {
        name: "farmerAddress",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "decision",
        type: "tuple",
        internalType: "struct EligibilityEngine.EligibilityDecision",
        components: [
          {
            name: "farmer",
            type: "address",
            internalType: "address",
          },
          {
            name: "isEligible",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "subsidyAmount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "proofHash",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "reason",
            type: "string",
            internalType: "string",
          },
          {
            name: "weatherEventId",
            type: "string",
            internalType: "string",
          },
          {
            name: "timestamp",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getSubsidyScheme",
    inputs: [
      {
        name: "schemeId",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "scheme",
        type: "tuple",
        internalType: "struct EligibilityEngine.SubsidyScheme",
        components: [
          {
            name: "schemeName",
            type: "string",
            internalType: "string",
          },
          {
            name: "isActive",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "baseAmount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "droughtMultiplier",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "floodMultiplier",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "eligibleCrops",
            type: "string[]",
            internalType: "string[]",
          },
          {
            name: "startDate",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "endDate",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "schemeIds",
    inputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "string",
        internalType: "string",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "subsidySchemes",
    inputs: [
      {
        name: "",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "schemeName",
        type: "string",
        internalType: "string",
      },
      {
        name: "isActive",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "baseAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "droughtMultiplier",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "floodMultiplier",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "startDate",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "endDate",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [
      {
        name: "newOwner",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updateSchemeStatus",
    inputs: [
      {
        name: "schemeId",
        type: "string",
        internalType: "string",
      },
      {
        name: "isActive",
        type: "bool",
        internalType: "bool",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "usedProofs",
    inputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "verifyProof",
    inputs: [
      {
        name: "proofHash",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "farmerAddress",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "isValid",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "decision",
        type: "tuple",
        internalType: "struct EligibilityEngine.EligibilityDecision",
        components: [
          {
            name: "farmer",
            type: "address",
            internalType: "address",
          },
          {
            name: "isEligible",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "subsidyAmount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "proofHash",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "reason",
            type: "string",
            internalType: "string",
          },
          {
            name: "weatherEventId",
            type: "string",
            internalType: "string",
          },
          {
            name: "timestamp",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "weatherOracle",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract WeatherOracle",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "EligibilityChecked",
    inputs: [
      {
        name: "farmer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "isEligible",
        type: "bool",
        indexed: false,
        internalType: "bool",
      },
      {
        name: "subsidyAmount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "proofHash",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32",
      },
      {
        name: "reason",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      {
        name: "previousOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "SubsidySchemeCreated",
    inputs: [
      {
        name: "schemeId",
        type: "string",
        indexed: true,
        internalType: "string",
      },
      {
        name: "schemeName",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "baseAmount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "SubsidySchemeUpdated",
    inputs: [
      {
        name: "schemeId",
        type: "string",
        indexed: true,
        internalType: "string",
      },
      {
        name: "isActive",
        type: "bool",
        indexed: false,
        internalType: "bool",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "OwnableInvalidOwner",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "OwnableUnauthorizedAccount",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
    ],
  },
] as const;

