"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
  useBalance,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { parseEther, formatEther } from "viem";
import { createPublicClient, http } from "viem";
import {
  CheckCircleIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CpuChipIcon,
  CloudIcon,
  MapPinIcon,
  StarIcon,
  ArrowPathIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import {
  CONTRACT_ADDRESSES,
  SUBSIDY_DISTRIBUTOR_ABI,
  FARMER_REGISTRY_ABI,
  WEATHER_ORACLE_ABI,
  ELIGIBILITY_ENGINE_ABI,
} from "../lib/constants";
import { useWorkflowStore, type FarmerData } from "../lib/store";

type WorkflowPhase = "deposit" | "register" | "monitoring" | "processing" | "complete";

type AIActivity = {
  timestamp: number;
  type: "detection" | "analysis" | "decision" | "execution";
  message: string;
  data?: any;
};

type FarmerForm = {
  recipientAddress: string;
  landProofHash: string;
  district: string;
  village: string;
  latitude: string;
  longitude: string;
  cropType: number;
  fetchingCoords: boolean;
};

const cropOptions = [
  { label: "Rice", value: 0 },
  { label: "Wheat", value: 1 },
  { label: "Corn", value: 2 },
  { label: "Sugarcane", value: 3 },
  { label: "Cotton", value: 4 },
  { label: "Soybean", value: 5 },
  { label: "Other", value: 6 },
];

const initialForm: FarmerForm = {
  recipientAddress: "",
  landProofHash: "",
  district: "",
  village: "",
  latitude: "",
  longitude: "",
  cropType: 0,
  fetchingCoords: false,
};

// Typing animation hook
function useTypingAnimation(text: string, speed: number = 30) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!text) {
      setDisplayedText("");
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    setDisplayedText("");
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayedText, isTyping };
}

export function AutonomousWorkflow() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { currentFarmer, addFarmer, updateFarmer, incrementSchemeNonce, farmers } = useWorkflowStore();
  const [showFarmersList, setShowFarmersList] = useState(false);
  
  // Use store getter function to avoid dependency issues
  const getCurrentFarmer = () => useWorkflowStore.getState().currentFarmer;

  const [phase, setPhase] = useState<WorkflowPhase>("deposit");
  const [depositAmount, setDepositAmount] = useState("");
  const [form, setForm] = useState<FarmerForm>(initialForm);
  const [aiActive, setAiActive] = useState(false);
  const [aiActivities, setAiActivities] = useState<AIActivity[]>([]);
  const [processedPayments, setProcessedPayments] = useState(0);
  const [weatherEventId, setWeatherEventId] = useState<string | null>(null);
  const [eligibilityProofHash, setEligibilityProofHash] = useState<string | null>(null);
  const [weatherForm, setWeatherForm] = useState({
    region: "",
    temperature: "",
    rainfall: "",
    droughtAlert: false,
    floodAlert: false,
    eventId: "",
    disasterType: "",
  });
  const [typingWeather, setTypingWeather] = useState("");
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [eligibilityScore, setEligibilityScore] = useState<{
    score: number;
    reasoning: string;
    factors: string[];
  } | null>(null);
  
  const activitiesEndRef = useRef<HTMLDivElement>(null);
  const hasProcessedRegistration = useRef(false);
  const hasStartedAI = useRef(false);

  // Deposit
  const { writeContract: writeDeposit, data: depositTxHash } = useWriteContract();
  const { isLoading: depositPending, isSuccess: depositSuccess, data: depositReceipt } = useWaitForTransactionReceipt({
    hash: depositTxHash,
  });

  // Registration
  const { writeContract: writeRegister, data: registerTxHash } = useWriteContract();
  const { isLoading: registerPending, isSuccess: registerSuccess } = useWaitForTransactionReceipt({
    hash: registerTxHash,
  });

  // Weather recording
  const { writeContract: writeWeather, data: weatherTxHash } = useWriteContract();
  const { isLoading: weatherPending, isSuccess: weatherSuccess } = useWaitForTransactionReceipt({
    hash: weatherTxHash,
  });

  // Eligibility check
  const { writeContract: writeEligibility, data: eligibilityTxHash } = useWriteContract();
  const { isLoading: eligibilityPending, isSuccess: eligibilitySuccess } = useWaitForTransactionReceipt({
    hash: eligibilityTxHash,
  });

  // Payment execution
  const { writeContract: writePayment, data: paymentTxHash } = useWriteContract();
  const { isLoading: paymentPending, isSuccess: paymentSuccess } = useWaitForTransactionReceipt({
    hash: paymentTxHash,
  });

  // Read contract balance - manual refresh only
  const { data: distributorBalance, refetch: refetchBalance, isLoading: balanceLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.subsidyDistributor,
    abi: SUBSIDY_DISTRIBUTOR_ABI,
    functionName: "getBalance",
  });

  // Also read native balance directly as fallback - manual refresh only
  const { data: nativeBalance, refetch: refetchNativeBalance } = useBalance({
    address: CONTRACT_ADDRESSES.subsidyDistributor,
  });

  // Read total farmers
  const { data: totalFarmers, refetch: refetchFarmers } = useReadContract({
    address: CONTRACT_ADDRESSES.farmerRegistry,
    abi: FARMER_REGISTRY_ABI,
    functionName: "getTotalFarmers",
    query: {
      refetchInterval: 3000,
    },
  });

  // Read eligibility decision
  const { data: eligibilityDecision, refetch: refetchEligibility } = useReadContract({
    address: CONTRACT_ADDRESSES.eligibilityEngine,
    abi: ELIGIBILITY_ENGINE_ABI,
    functionName: "getFarmerDecision",
    args:
      currentFarmer && weatherEventId
        ? [currentFarmer.recipientAddress as `0x${string}`, weatherEventId]
        : undefined,
    query: {
      enabled: !!currentFarmer && !!weatherEventId,
    },
  });

  // Use contract's getBalance() if available, otherwise fallback to native balance
  const contractBalance = distributorBalance 
    ? formatEther(distributorBalance as bigint) 
    : nativeBalance 
    ? formatEther(nativeBalance.value) 
    : "0";
  const registeredFarmersCount = totalFarmers ? Number(totalFarmers) : 0;

  useEffect(() => {
    activitiesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiActivities]);

  // Manual refresh function
  const handleRefreshBalance = async () => {
    setIsRefreshingBalance(true);
    try {
      console.log("Refreshing balance...");
      await Promise.all([refetchBalance(), refetchNativeBalance()]);
      
      // Also try to get balance directly from public client
      try {
        const publicClient = createPublicClient({
          chain: sepolia,
          transport: http(),
        });
        const directBalance = await publicClient.getBalance({
          address: CONTRACT_ADDRESSES.subsidyDistributor,
        });
        console.log("Direct balance:", formatEther(directBalance));
      } catch (e) {
        console.error("Direct balance check error:", e);
      }
      
      // Wait a bit for the update to propagate
      setTimeout(() => {
        setIsRefreshingBalance(false);
      }, 1500);
    } catch (error) {
      console.error("Balance refresh error:", error);
      setIsRefreshingBalance(false);
    }
  };

  // Refetch balance after deposit and show registration form
  useEffect(() => {
    if (depositSuccess && depositReceipt) {
      console.log("Deposit successful!", {
        txHash: depositTxHash,
        receipt: depositReceipt,
        status: depositReceipt.status,
      });
      
      // Log transaction details
      if (depositReceipt.status === "success") {
        console.log("Transaction confirmed on blockchain");
      } else {
        console.warn("Transaction may have failed:", depositReceipt.status);
      }
      
      // Immediate refetch balance once
      refetchBalance();
      refetchNativeBalance();
      
      // Set phase to register immediately to show form
      setPhase("register");
    }
  }, [depositSuccess, depositReceipt, depositTxHash, refetchBalance, refetchNativeBalance]);

  // After registration, save to store and start AI
  useEffect(() => {
    if (registerSuccess && address && !hasProcessedRegistration.current) {
      hasProcessedRegistration.current = true;
      
      // Get current farmer from store
      const farmer = getCurrentFarmer();
      if (farmer) {
        // Update farmer as registered (only once)
        updateFarmer({ registered: true, registrationTxHash: registerTxHash });
        refetchFarmers();
        setTimeout(() => {
          setPhase("monitoring");
          if (!hasStartedAI.current) {
            hasStartedAI.current = true;
            startAIMonitoring();
          }
        }, 2000);
      }
    }
  }, [registerSuccess, address, registerTxHash, refetchFarmers]);

  // After weather recorded, auto-check eligibility
  useEffect(() => {
    if (weatherSuccess && weatherEventId) {
      const farmer = getCurrentFarmer();
      if (farmer) {
        setTimeout(() => {
          checkEligibilityOnChain();
        }, 2000);
      }
    }
  }, [weatherSuccess, weatherEventId]);

  // After eligibility check, extract proof and execute payment
  useEffect(() => {
    if (eligibilitySuccess && eligibilityDecision) {
      const decision = eligibilityDecision as any;
      if (decision.isEligible && decision.proofHash) {
        setEligibilityProofHash(decision.proofHash);
        addAIActivity("decision", `Eligibility confirmed. Proof hash: ${String(decision.proofHash).slice(0, 20)}...`, {
          amount: formatEther(decision.subsidyAmount as bigint),
          reason: decision.reason,
        });
        setTimeout(() => {
          executePayment();
        }, 2000);
      } else {
        addAIActivity("decision", `Not eligible: ${decision.reason || "Criteria not met"}`);
        setPhase("complete");
      }
    }
  }, [eligibilitySuccess, eligibilityDecision]);

  // After payment, mark complete
  useEffect(() => {
    if (paymentSuccess) {
      setProcessedPayments((prev) => prev + 1);
      setPhase("complete");
      addAIActivity("execution", "Payment executed successfully. Subsidy sent to farmer wallet.", {
        txHash: paymentTxHash,
      });
    }
  }, [paymentSuccess, paymentTxHash]);

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    if (!isConnected || chainId !== sepolia.id) {
      alert("Please connect wallet and switch to Sepolia");
      return;
    }

    try {
      writeDeposit({
        address: CONTRACT_ADDRESSES.subsidyDistributor,
        abi: SUBSIDY_DISTRIBUTOR_ABI,
        functionName: "depositFunds",
        value: parseEther(depositAmount),
      });
    } catch (error) {
      console.error("Deposit error:", error);
    }
  };

  const fetchCoordinates = async (district: string, village: string) => {
    if (!district || !village) {
      console.log("Geocode: Missing district or village");
      return;
    }

    console.log("Geocode: Starting fetch for", district, village);
    setForm((prev) => ({ ...prev, fetchingCoords: true }));
    
    try {
      addAIActivity("analysis", `Fetching coordinates for ${village}, ${district}...`);
      
      console.log("Geocode: Calling API...");
      const response = await fetch("/api/ai/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          district: district.trim(),
          village: village.trim(),
        }),
      });

      console.log("Geocode: Response status", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Geocode: API error", response.status, errorText);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Geocode: Response data", data);
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (data.latitude && data.longitude) {
        console.log("Geocode: Success", data.latitude, data.longitude);
        setForm((prev) => ({
          ...prev,
          latitude: data.latitude.toString(),
          longitude: data.longitude.toString(),
          fetchingCoords: false,
        }));
        addAIActivity("execution", `Coordinates fetched: ${data.latitude}, ${data.longitude}`);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error: any) {
      console.error("Geocode error:", error);
      setForm((prev) => ({ ...prev, fetchingCoords: false }));
      addAIActivity("execution", `Geocoding failed: ${error.message || "Unknown error"}. Using default coordinates.`);
      // Set default coordinates as fallback
      setForm((prev) => ({
        ...prev,
        latitude: "28.6139",
        longitude: "77.1234",
        fetchingCoords: false,
      }));
    }
  };

  // Auto-fetch coordinates when district and village are filled
  useEffect(() => {
    const district = form.district.trim();
    const village = form.village.trim();
    
    if (district && village && !form.latitude && !form.fetchingCoords) {
      const timer = setTimeout(() => {
        fetchCoordinates(district, village);
      }, 1500); // Increased delay to avoid too many calls
      return () => clearTimeout(timer);
    }
  }, [form.district, form.village, form.latitude, form.fetchingCoords]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) return;

    const farmerData: FarmerData = {
      wallet: address,
      recipientAddress: form.recipientAddress || address,
      landProofHash: form.landProofHash,
      district: form.district,
      village: form.village,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      cropType: form.cropType,
      registered: false,
    };

    addFarmer(farmerData);

    try {
      writeRegister({
        address: CONTRACT_ADDRESSES.farmerRegistry,
        abi: FARMER_REGISTRY_ABI,
        functionName: "registerFarmer",
        args: [
          form.landProofHash,
          form.district,
          form.village,
          BigInt(Math.round(Number(form.latitude || 0) * 1_000_000)),
          BigInt(Math.round(Number(form.longitude || 0) * 1_000_000)),
          Number(form.cropType),
        ],
      });
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  const startAIMonitoring = async () => {
    const farmer = useWorkflowStore.getState().currentFarmer;
    if (!farmer) return;

    setAiActive(true);
    addAIActivity("detection", "AI agent initialized. Analyzing registered farmer data...");

    // Generate event ID
    const eventId = `event-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setWeatherEventId(eventId);

    addAIActivity("analysis", `Farmer registered in ${farmer.district}, ${farmer.village}. Checking for natural disasters in the past 6-7 months...`);

    // Use real AI to detect weather with typing animation
    setTimeout(async () => {
      const farmer = getCurrentFarmer();
      if (!farmer) return;
      
      try {
        const weatherResponse = await fetch("/api/ai/weather", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            district: farmer.district,
            village: farmer.village,
            latitude: farmer.latitude,
            longitude: farmer.longitude,
            cropType: farmer.cropType,
          }),
        });

        const weatherData = await weatherResponse.json();

        if (weatherData.hasDisaster && weatherData.disasterType !== "NONE") {
          // Map disaster types to contract flags
          // Drought-related: DROUGHT, HEATWAVE, PEST_OUTBREAK → droughtAlert
          // Flood-related: FLOOD, CYCLONE, TSUNAMI, LANDSLIDE → floodAlert
          // Other disasters: Map based on primary impact
          const droughtDisasters = ["DROUGHT", "HEATWAVE", "PEST_OUTBREAK", "WILDFIRE"];
          const floodDisasters = ["FLOOD", "CYCLONE", "TSUNAMI", "LANDSLIDE"];
          const isDroughtAlert = droughtDisasters.includes(weatherData.disasterType);
          const isFloodAlert = floodDisasters.includes(weatherData.disasterType);
          
          // For disasters that don't fit clearly, use droughtAlert for heat-related, floodAlert for water-related
          const otherDrought = ["FROST"]; // Frost can be considered drought-like (lack of water)
          const otherFlood = ["HAILSTORM", "EARTHQUAKE"]; // These can cause flooding or water issues
          
          const finalDroughtAlert = isDroughtAlert || otherDrought.includes(weatherData.disasterType);
          const finalFloodAlert = isFloodAlert || otherFlood.includes(weatherData.disasterType);
          
          // Type out weather data with animation
          const windSpeedText = weatherData.windSpeed ? `\nWind Speed: ${weatherData.windSpeed} km/h` : "";
          const weatherText = `Region: ${currentFarmer.district}\nTemperature: ${weatherData.temperature}°C\nRainfall: ${weatherData.rainfall}mm${windSpeedText}\nDisaster Type: ${weatherData.disasterType}\nReasoning: ${weatherData.reasoning}`;
          
          let typedText = "";
          for (let i = 0; i < weatherText.length; i++) {
            await new Promise((resolve) => setTimeout(resolve, 30));
            typedText += weatherText[i];
            setTypingWeather(typedText);
          }

          const currentFarmer = useWorkflowStore.getState().currentFarmer;
          if (currentFarmer) {
            setWeatherForm({
              region: currentFarmer.district,
              temperature: weatherData.temperature.toString(),
              rainfall: weatherData.rainfall.toString(),
              droughtAlert: finalDroughtAlert,
              floodAlert: finalFloodAlert,
              eventId: eventId,
              disasterType: weatherData.disasterType,
            });
          }

          addAIActivity("detection", `Natural disaster detected: ${weatherData.disasterType}`, {
            type: weatherData.disasterType,
            temperature: weatherData.temperature,
            rainfall: weatherData.rainfall,
            windSpeed: weatherData.windSpeed,
          });

          // Record weather on-chain
          setTimeout(() => {
            recordWeatherOnChain(weatherData, eventId, finalDroughtAlert, finalFloodAlert);
          }, 2000);
        } else {
          // No disaster detected - calculate ineligibility score and stop
          addAIActivity("analysis", "No natural disaster detected in the past 6-7 months. Calculating eligibility score...");
          
          // Calculate ineligibility score
          try {
            const scoreResponse = await fetch("/api/ai/eligibility-score", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                farmerData: {
                  district: currentFarmer.district,
                  village: currentFarmer.village,
                  cropType: currentFarmer.cropType,
                  latitude: currentFarmer.latitude,
                  longitude: currentFarmer.longitude,
                },
                weatherData: {
                  temperature: weatherData.temperature,
                  rainfall: weatherData.rainfall,
                  disasterType: weatherData.disasterType || "NONE",
                  reasoning: weatherData.reasoning || "No disaster detected",
                },
              }),
            });

            const scoreData = await scoreResponse.json();
            // Convert ineligibility score (0-10, higher = worse) to eligibility score (0-10, higher = better)
            const eligibilityScoreValue = 10 - scoreData.ineligibilityScore;
            setEligibilityScore({
              score: eligibilityScoreValue,
              reasoning: scoreData.reasoning,
              factors: scoreData.factors || [],
            });

            addAIActivity("decision", `Eligibility Score: ${eligibilityScoreValue.toFixed(1)}/10. ${scoreData.reasoning}`, {
              score: eligibilityScoreValue,
              factors: scoreData.factors,
            });

            setPhase("complete");
            setAiActive(false);
          } catch (error) {
            console.error("Score calculation error:", error);
            // Convert ineligibility to eligibility (10 - 8.5 = 1.5)
            setEligibilityScore({
              score: 1.5,
              reasoning: "Unable to calculate score. No disaster detected in region.",
              factors: ["No disaster alert"],
            });
            setPhase("complete");
            setAiActive(false);
          }
        }
      } catch (error) {
        console.error("Weather AI error:", error);
      }
    }, 3000);
  };

  const recordWeatherOnChain = (weatherData: any, eventId: string, droughtAlert: boolean, floodAlert: boolean) => {
    addAIActivity("execution", "Recording weather event on-chain...");

    const farmer = useWorkflowStore.getState().currentFarmer;
    if (!farmer) return;

    const temperature = Math.round(weatherData.temperature * 100);
    const rainfall = Math.round(weatherData.rainfall);

    try {
      writeWeather({
        address: CONTRACT_ADDRESSES.weatherOracle,
        abi: WEATHER_ORACLE_ABI,
        functionName: "recordWeatherData",
        args: [
          farmer.district,
          BigInt(temperature),
          BigInt(rainfall),
          droughtAlert,
          floodAlert,
          eventId,
        ],
      });
    } catch (error) {
      console.error("Weather recording error:", error);
    }
  };

  const checkEligibilityOnChain = async () => {
    const farmer = useWorkflowStore.getState().currentFarmer;
    if (!farmer || !weatherEventId) return;

    addAIActivity("analysis", "Evaluating eligibility using AI and on-chain verification...");

    // Generate scheme ID with nonce
    const schemeId = `scheme-${incrementSchemeNonce()}`;

    // Use real AI for eligibility evaluation
    try {
      const eligibilityResponse = await fetch("/api/ai/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmerData: {
            district: farmer.district,
            village: farmer.village,
            cropType: farmer.cropType,
            latitude: farmer.latitude,
            longitude: farmer.longitude,
          },
          weatherData: {
            disasterType: weatherForm.disasterType || (weatherForm.droughtAlert && weatherForm.floodAlert 
              ? "MULTIPLE" 
              : weatherForm.droughtAlert 
              ? "DROUGHT" 
              : weatherForm.floodAlert 
              ? "FLOOD" 
              : "NONE"),
            temperature: parseFloat(weatherForm.temperature),
            rainfall: parseFloat(weatherForm.rainfall),
          },
          schemeData: {
            baseAmount: "1.0",
            multiplier: "1.5",
            eligibleCrops: ["Rice", "Wheat", "Corn", "Sugarcane", "Cotton", "Soybean"],
          },
        }),
      });

      const eligibilityData = await eligibilityResponse.json();

      if (eligibilityData.eligible) {
        addAIActivity("decision", `AI Eligibility: ${eligibilityData.reasoning}`, {
          amount: eligibilityData.amount,
        });
      }

      // Check eligibility on-chain
      setTimeout(() => {
        const currentFarmer = getCurrentFarmer();
        if (currentFarmer) {
          writeEligibility({
            address: CONTRACT_ADDRESSES.eligibilityEngine,
            abi: ELIGIBILITY_ENGINE_ABI,
            functionName: "checkEligibility",
            args: [currentFarmer.recipientAddress as `0x${string}`, weatherEventId, schemeId],
          });
        }
      }, 2000);
    } catch (error) {
      console.error("Eligibility AI error:", error);
      // Fallback to on-chain check
      const farmer = getCurrentFarmer();
      if (!farmer || !weatherEventId) return;
      const schemeId = `scheme-${incrementSchemeNonce()}`;
      writeEligibility({
        address: CONTRACT_ADDRESSES.eligibilityEngine,
        abi: ELIGIBILITY_ENGINE_ABI,
        functionName: "checkEligibility",
        args: [farmer.recipientAddress as `0x${string}`, weatherEventId, schemeId],
      });
    }
  };

  const executePayment = () => {
    const farmer = useWorkflowStore.getState().currentFarmer;
    if (!farmer || !eligibilityProofHash) return;

    addAIActivity("execution", "Executing payment with verified proof hash...");

    try {
      writePayment({
        address: CONTRACT_ADDRESSES.subsidyDistributor,
        abi: SUBSIDY_DISTRIBUTOR_ABI,
        functionName: "executePayment",
        args: [farmer.recipientAddress as `0x${string}`, eligibilityProofHash as `0x${string}`],
      });
    } catch (error) {
      console.error("Payment execution error:", error);
    }
  };

  const addAIActivity = (type: AIActivity["type"], message: string, data?: any) => {
    setAiActivities((prev) => [
      ...prev,
      {
        timestamp: Date.now(),
        type,
        message,
        data,
      },
    ]);
  };

  const handleFormChange = (field: keyof FarmerForm, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetWorkflow = () => {
    // Reset form
    setForm(initialForm);
    
    // Reset phase to allow new registration
    setPhase("register");
    
    // Reset AI state
    setAiActive(false);
    setAiActivities([]);
    
    // Reset weather and eligibility
    setWeatherEventId(null);
    setEligibilityProofHash(null);
    setEligibilityScore(null);
    setTypingWeather("");
    setWeatherForm({
      region: "",
      temperature: "",
      rainfall: "",
      droughtAlert: false,
      floodAlert: false,
      eventId: "",
      disasterType: "",
    });
    
    // Reset refs
    hasProcessedRegistration.current = false;
    hasStartedAI.current = false;
    
    // Clear current farmer from store (but keep all farmers list for history)
    useWorkflowStore.getState().setCurrentFarmer(null);
    
    // Note: We don't reset registerSuccess/weatherSuccess/etc. as they're tied to transaction hashes
    // The form will show again because phase is "register" and we check for that
  };

  return (
    <section className="relative py-24 px-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Autonomous Subsidy Distribution
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Deposit funds, register farmers, and let AI handle the rest—completely autonomously
          </p>
        </div>

        {/* Workflow Steps */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Step 1: Deposit */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative p-6 rounded-2xl border-2 transition-all backdrop-blur-sm ${
              phase === "deposit"
                ? "border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/20"
                : "border-slate-700/50 bg-slate-800/30"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  depositSuccess
                    ? "bg-emerald-500/20 text-emerald-400"
                    : phase === "deposit"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-slate-700/50 text-slate-400"
                }`}
              >
                {depositSuccess ? <CheckCircleIcon className="w-7 h-7" /> : <CurrencyDollarIcon className="w-7 h-7" />}
              </div>
              <h3 className="text-xl font-semibold text-white">1. Fund Reserve Pool</h3>
            </div>

            {!depositSuccess ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Amount (ETH)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.0005"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    disabled={depositPending}
                  />
                </div>
                <button
                  onClick={handleDeposit}
                  disabled={!isConnected || chainId !== sepolia.id || depositPending || !depositAmount}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {depositPending ? "Processing..." : "Deposit to Contract"}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-400">Contract Balance</div>
                  <button
                    onClick={handleRefreshBalance}
                    disabled={isRefreshingBalance || balanceLoading}
                    className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Refresh balance"
                  >
                    <ArrowPathIcon
                      className={`w-4 h-4 text-slate-300 ${isRefreshingBalance || balanceLoading ? "animate-spin" : ""}`}
                    />
                  </button>
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  {balanceLoading ? "Loading..." : parseFloat(contractBalance).toFixed(8)} ETH
                </div>
                {depositSuccess && parseFloat(contractBalance) === 0 && (
                  <div className="text-xs text-yellow-400 mt-1 space-y-1">
                    <div>⚠️ Balance may take a few seconds to update.</div>
                    {depositTxHash && (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${depositTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        View transaction on Etherscan
                      </a>
                    )}
                  </div>
                )}
                <div className="text-xs text-slate-500 mt-2">Ready for distribution</div>
              </div>
            )}
          </motion.div>

          {/* Step 2: Register */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`relative p-6 rounded-2xl border-2 transition-all backdrop-blur-sm ${
              phase === "register" || phase === "monitoring"
                ? "border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-500/20"
                : "border-slate-700/50 bg-slate-800/30"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  registerSuccess
                    ? "bg-emerald-500/20 text-emerald-400"
                    : phase === "register"
                    ? "bg-purple-500/20 text-purple-400"
                    : "bg-slate-700/50 text-slate-400"
                }`}
              >
                {registerSuccess ? <CheckCircleIcon className="w-7 h-7" /> : <UserGroupIcon className="w-7 h-7" />}
              </div>
              <h3 className="text-xl font-semibold text-white">2. Register Farmer</h3>
            </div>

            {!registerSuccess ? (
              <div className="text-sm text-slate-400">Fill the form below to register</div>
            ) : (
              <div className="space-y-2">
                <div className="text-sm text-slate-400">Status</div>
                <div className="text-lg font-semibold text-emerald-400">✓ Registered</div>
                <div className="text-xs text-slate-500 mt-2">AI will now process this farmer</div>
              </div>
            )}
          </motion.div>

          {/* Step 3: AI Processing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`relative p-6 rounded-2xl border-2 transition-all backdrop-blur-sm ${
              aiActive ? "border-pink-500/50 bg-pink-500/10 shadow-lg shadow-pink-500/20" : "border-slate-700/50 bg-slate-800/30"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  aiActive
                    ? "bg-pink-500/20 text-pink-400"
                    : phase === "complete"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-slate-700/50 text-slate-400"
                }`}
              >
                {phase === "complete" ? (
                  <CheckCircleIcon className="w-7 h-7" />
                ) : aiActive ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <CpuChipIcon className="w-7 h-7" />
                  </motion.div>
                ) : (
                  <CpuChipIcon className="w-7 h-7" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-white">3. AI Processing</h3>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-slate-400">Status</div>
              <div className="text-lg font-semibold text-white">
                {aiActive ? (
                  <span className="text-pink-400">Active</span>
                ) : phase === "complete" ? (
                  <span className="text-emerald-400">Complete</span>
                ) : (
                  <span className="text-slate-500">Waiting...</span>
                )}
              </div>
              {processedPayments > 0 && (
                <div className="text-xs text-emerald-400 mt-2">✓ {processedPayments} payment(s) processed</div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Registration Form - Show when phase is register (allows reset to show form again) */}
        {phase === "register" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative p-8 rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-white flex items-center gap-2">
                <UserGroupIcon className="w-6 h-6 text-purple-400" />
                Register Farmer
              </h3>
              {!depositSuccess && (
                <div className="text-xs text-slate-400 bg-slate-700/50 px-3 py-1 rounded-lg">
                  Note: Deposit not required
                </div>
              )}
            </div>
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Recipient Address</label>
                  <input
                    type="text"
                    required
                    value={form.recipientAddress}
                    onChange={(e) => handleFormChange("recipientAddress", e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  />
                  <p className="text-xs text-slate-500 mt-1">Address to receive subsidy payments</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Land Proof Hash</label>
                  <input
                    type="text"
                    required
                    value={form.landProofHash}
                    onChange={(e) => handleFormChange("landProofHash", e.target.value)}
                    placeholder="ipfs://hash or doc ref"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">District</label>
                  <input
                    type="text"
                    required
                    value={form.district}
                    onChange={(e) => handleFormChange("district", e.target.value)}
                    placeholder="Baghpat"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Village</label>
                  <input
                    type="text"
                    required
                    value={form.village}
                    onChange={(e) => handleFormChange("village", e.target.value)}
                    placeholder="Naurangabad"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2 flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4" />
                    Latitude
                    {form.fetchingCoords && (
                      <span className="text-xs text-blue-400 flex items-center gap-1">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full"
                        />
                        AI fetching...
                      </span>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={form.latitude}
                      readOnly
                      className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white/70 cursor-not-allowed"
                      placeholder={form.fetchingCoords ? "Fetching coordinates..." : "Enter district & village"}
                    />
                    {form.district && form.village && !form.fetchingCoords && !form.latitude && (
                      <button
                        type="button"
                        onClick={() => fetchCoordinates(form.district, form.village)}
                        className="px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-sm font-medium transition-colors"
                      >
                        Fetch
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2 flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4" />
                    Longitude
                    {form.fetchingCoords && (
                      <span className="text-xs text-blue-400 flex items-center gap-1">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full"
                        />
                        AI fetching...
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={form.longitude}
                    readOnly
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white/70 cursor-not-allowed"
                    placeholder={form.fetchingCoords ? "Fetching coordinates..." : "Enter district & village"}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-slate-400 mb-2">Crop Type</label>
                  <select
                    value={form.cropType}
                    onChange={(e) => handleFormChange("cropType", Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  >
                    {cropOptions.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-slate-900">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={!isConnected || registerPending || !form.latitude || !form.longitude}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {registerPending ? "Registering..." : "Register Farmer"}
              </button>
            </form>
          </motion.div>
        )}

        {/* Weather Oracle - Only show after registration */}
        {registerSuccess && weatherForm.region && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative p-8 rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-white flex items-center gap-2">
                <CloudIcon className="w-6 h-6 text-blue-400" />
                Weather Oracle Data (AI Generated)
              </h3>
              <div className="text-xs text-slate-400 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">
                Checking last 6-7 months
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
              <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap">
                {typingWeather}
                {typingWeather && <span className="animate-pulse">|</span>}
              </pre>
            </div>
            <div className="mt-4 text-xs text-slate-500">
              Event ID: <span className="text-cyan-400 font-mono">{weatherForm.eventId}</span>
            </div>
          </motion.div>
        )}

        {/* Eligibility Assessment Display - Show when no disaster detected */}
        {eligibilityScore && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative p-8 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 backdrop-blur-sm mb-8"
          >
            <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
              <StarIcon className="w-6 h-6 text-yellow-400" />
              Eligibility Assessment
            </h3>
            <div className="space-y-4">
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-slate-400">Eligibility Score</div>
                  <div className="text-4xl font-bold text-yellow-400">{eligibilityScore.score.toFixed(1)}/10</div>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3 mb-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(eligibilityScore.score / 10) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 h-3 rounded-full"
                  />
                </div>
                <div className="text-sm text-slate-300 mb-3">
                  <strong>Reasoning:</strong> {eligibilityScore.reasoning}
                </div>
                {eligibilityScore.factors.length > 0 && (
                  <div className="text-sm text-slate-300">
                    <strong>Factors:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {eligibilityScore.factors.map((factor, idx) => (
                        <li key={idx} className="text-slate-400">{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="text-sm text-slate-400 bg-slate-900/50 p-4 rounded-lg">
                <strong>Note:</strong> This farmer has a low eligibility score ({eligibilityScore.score.toFixed(1)}/10) as no natural disaster was detected in their region within the past 6-7 months. 
                Subsidies are only available when natural disasters occur within this recent timeframe (last 6-7 months).
              </div>
              <button
                onClick={resetWorkflow}
                className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-white font-medium transition-all shadow-lg"
              >
                Register Another Farmer
              </button>
            </div>
          </motion.div>
        )}

        {/* Eligibility Console - Only show after weather recorded */}
        {weatherSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative p-8 rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm mb-8"
          >
            <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
              <StarIcon className="w-6 h-6 text-yellow-400" />
              Eligibility Check (Auto-triggered)
            </h3>
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
              {eligibilityPending ? (
                <div className="text-slate-400">Checking eligibility on-chain...</div>
              ) : eligibilityDecision ? (
                <div className="space-y-2">
                  <div className="text-slate-300">
                    Eligible: <span className="text-emerald-400">{(eligibilityDecision as any).isEligible ? "Yes" : "No"}</span>
                  </div>
                  {(eligibilityDecision as any).isEligible && (
                    <div className="text-slate-300">
                      Amount: <span className="text-emerald-400">{formatEther((eligibilityDecision as any).subsidyAmount as bigint)} ETH</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-400">Waiting for eligibility check...</div>
              )}
            </div>
          </motion.div>
        )}

        {/* AI Activity Monitor */}
        {(aiActive || aiActivities.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative p-8 rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CpuChipIcon className="w-6 h-6 text-pink-400" />
                <h3 className="text-xl font-semibold text-white">AI Agent Activity Monitor</h3>
              </div>
              {aiActive && (
                <div className="flex items-center gap-2 text-pink-400">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 bg-pink-400 rounded-full"
                  />
                  <span className="text-sm">Processing</span>
                </div>
              )}
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4 h-64 overflow-y-auto font-mono text-sm border border-slate-700/50">
              {aiActivities.length === 0 ? (
                <div className="text-slate-500 text-center py-8">Waiting for AI activity...</div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {aiActivities.map((activity, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-3 rounded-lg border-l-4 ${
                          activity.type === "detection"
                            ? "bg-blue-500/10 border-blue-500"
                            : activity.type === "analysis"
                            ? "bg-purple-500/10 border-purple-500"
                            : activity.type === "decision"
                            ? "bg-yellow-500/10 border-yellow-500"
                            : "bg-emerald-500/10 border-emerald-500"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-slate-500 text-xs mt-1">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </div>
                          <div className="flex-1">
                            <div className="text-white">{activity.message}</div>
                            {activity.data && (
                              <div className="mt-2 text-xs text-slate-400 space-y-1">
                                {activity.data.amount && (
                                  <div>
                                    Amount: <span className="text-emerald-400">{activity.data.amount} ETH</span>
                                  </div>
                                )}
                                {activity.data.txHash && (
                                  <div>
                                    TX: <span className="text-cyan-400 font-mono">{String(activity.data.txHash).slice(0, 20)}...</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={activitiesEndRef} />
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Reset Button - Show when workflow is complete (after eligibility assessment or payment) */}
        {(phase === "complete" || (eligibilityScore && !aiActive)) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <button
              onClick={resetWorkflow}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-white font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
            >
              Register Another Farmer
            </button>
            <p className="text-sm text-slate-400 mt-3">
              Start a new registration to check eligibility for another farmer
            </p>
          </motion.div>
        )}

        {/* System Status */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="relative p-4 rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm text-slate-400">Contract Balance</div>
              <button
                onClick={handleRefreshBalance}
                disabled={isRefreshingBalance || balanceLoading}
                className="p-1 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh balance"
              >
                <ArrowPathIcon
                  className={`w-3.5 h-3.5 text-slate-300 ${isRefreshingBalance || balanceLoading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
            <div className="text-2xl font-bold text-white">
              {balanceLoading ? "Loading..." : parseFloat(contractBalance).toFixed(8)} ETH
            </div>
            {parseFloat(contractBalance) === 0 && depositSuccess && (
              <div className="text-xs text-yellow-400 mt-1">
                Check transaction status
              </div>
            )}
          </div>
          <div className="relative p-4 rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm text-slate-400">Registered Farmers</div>
              {farmers.length > 0 && (
                <button
                  onClick={() => setShowFarmersList(!showFarmersList)}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  {showFarmersList ? "Hide" : "View List"}
                </button>
              )}
            </div>
            <div className="text-2xl font-bold text-white">{registeredFarmersCount}</div>
            {farmers.length > 0 && (
              <div className="text-xs text-slate-500 mt-1">
                {farmers.length} in current session
              </div>
            )}
          </div>
          <div className="relative p-4 rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
            <div className="text-sm text-slate-400 mb-1">AI Status</div>
            <div className="text-2xl font-bold text-white">
              {aiActive ? <span className="text-pink-400">Active</span> : <span className="text-slate-500">Standby</span>}
            </div>
          </div>
          <div className="relative p-4 rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
            <div className="text-sm text-slate-400 mb-1">Payments Processed</div>
            <div className="text-2xl font-bold text-white">{processedPayments}</div>
          </div>
        </div>

        {/* Registered Farmers List */}
        <AnimatePresence>
          {showFarmersList && farmers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 p-6 rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <UserGroupIcon className="w-5 h-5 text-purple-400" />
                  Registered Farmers ({farmers.length})
                </h3>
                <button
                  onClick={() => setShowFarmersList(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {farmers.map((farmer, idx) => (
                  <motion.div
                    key={farmer.wallet || idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4 rounded-xl border border-slate-700/50 bg-slate-900/50 hover:bg-slate-900/70 transition-colors"
                  >
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Wallet Address</div>
                        <div className="text-sm text-white font-mono break-all">
                          {farmer.wallet.slice(0, 6)}...{farmer.wallet.slice(-4)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Recipient Address</div>
                        <div className="text-sm text-white font-mono break-all">
                          {farmer.recipientAddress.slice(0, 6)}...{farmer.recipientAddress.slice(-4)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Location</div>
                        <div className="text-sm text-white">
                          {farmer.village}, {farmer.district}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {farmer.latitude.toFixed(4)}, {farmer.longitude.toFixed(4)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Crop Type</div>
                        <div className="text-sm text-white">
                          {CROP_TYPES.find(c => c.value === farmer.cropType)?.label || "Unknown"}
                        </div>
                      </div>
                      {farmer.registrationTxHash && (
                        <div className="md:col-span-2">
                          <div className="text-xs text-slate-500 mb-1">Registration TX</div>
                          <div className="text-xs text-purple-400 font-mono break-all">
                            {farmer.registrationTxHash}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Registration Criteria Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-6 rounded-2xl border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <StarIcon className="w-5 h-5 text-blue-400" />
            Registration Criteria
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-slate-300 font-medium mb-2">Required Fields (On-Chain):</div>
              <ul className="space-y-1 text-slate-400">
                <li>✓ Land Proof Hash (non-empty)</li>
                <li>✓ District (non-empty)</li>
                <li>✓ Village (non-empty)</li>
                <li>✓ Crop Type (enum value)</li>
                <li>✓ Wallet must not be already registered</li>
              </ul>
            </div>
            <div>
              <div className="text-slate-300 font-medium mb-2">Required Fields (Frontend):</div>
              <ul className="space-y-1 text-slate-400">
                <li>✓ Recipient Address (for subsidy payments)</li>
                <li>✓ Latitude & Longitude (auto-fetched by AI)</li>
                <li>✓ All on-chain requirements above</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
            <div className="text-xs text-slate-400">
              <strong>Note:</strong> Once registered, a farmer cannot register again with the same wallet address. 
              They can update their profile using the <code className="text-purple-400">updateProfile()</code> function.
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
