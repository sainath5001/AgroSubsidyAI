'use client';

import { useMemo, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { SectionTitle } from "./SectionTitle";
import {
  CONTRACT_ADDRESSES,
  ELIGIBILITY_ENGINE_ABI,
} from "../lib/constants";
import { formatEther } from "viem";

const DEFAULT_SCHEME = "scheme-001";

export function EligibilityConsole() {
  const { address, isConnected } = useAccount();
  const [weatherEventId, setWeatherEventId] = useState("");
  const [schemeId, setSchemeId] = useState(DEFAULT_SCHEME);

  const {
    data: decisionCount,
    error: decisionCountError,
    refetch: refetchCount,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.eligibilityEngine as `0x${string}`,
    abi: ELIGIBILITY_ENGINE_ABI,
    functionName: "getDecisionCount",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: Boolean(address) },
  });

  const {
    data: latestDecision,
    error: decisionError,
    refetch: refetchDecision,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.eligibilityEngine as `0x${string}`,
    abi: ELIGIBILITY_ENGINE_ABI,
    functionName: "getLatestDecision",
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled:
        Boolean(address) && Boolean(decisionCount) && Number(decisionCount) > 0,
      staleTime: 10_000,
    },
  });

  const {
    writeContractAsync,
    data: txHash,
    isPending,
    error: writeError,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: Boolean(txHash) },
  });

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) return;
    try {
      await writeContractAsync({
        abi: ELIGIBILITY_ENGINE_ABI,
        address: CONTRACT_ADDRESSES.eligibilityEngine as `0x${string}`,
        functionName: "checkEligibility",
        args: [
          address as `0x${string}`,
          weatherEventId,
          schemeId || DEFAULT_SCHEME,
        ],
      });
      await refetchCount();
      await refetchDecision();
      setWeatherEventId("");
    } catch (err) {
      console.error("eligibility error", err);
    }
  };

  const latestSummary = useMemo(() => {
    if (!latestDecision) return null;
    return {
      eligible: latestDecision[1],
      amount: formatEther(latestDecision[2] || 0n),
      reason: latestDecision[4],
      weatherEvent: latestDecision[5],
      timestamp: Number(latestDecision[6]) * 1000,
    };
  }, [latestDecision]);

  return (
    <section className="px-4 py-24 sm:px-8 lg:px-12">
      <SectionTitle
        eyebrow="Eligibility engine"
        title="Match farmer location + weather event to calculate subsidy proofs"
        className="mb-12 text-left"
        align="left"
      />
      <div className="mx-auto grid max-w-5xl gap-12 rounded-[28px] border border-white/15 bg-white/5 p-8 md:grid-cols-2">
        <form onSubmit={handleCheck} className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">
            Run eligibility check
          </p>
          <label className="text-sm text-slate-200">
            Weather event ID
            <input
              required
              value={weatherEventId}
              onChange={(e) => setWeatherEventId(e.target.value)}
              placeholder="event-2025-001"
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-200"
            />
          </label>
          <label className="text-sm text-slate-200">
            Scheme ID
            <input
              value={schemeId}
              onChange={(e) => setSchemeId(e.target.value)}
              placeholder="scheme-001"
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-200"
            />
          </label>
          {writeError && (
            <p className="text-sm text-rose-300">
              {writeError.message.slice(0, 160)}
            </p>
          )}
          {isSuccess && (
            <p className="text-sm text-emerald-300">
              Decision stored. Scroll to see proof/result.
            </p>
          )}
          <button
            type="submit"
            disabled={!isConnected || isPending || isConfirming}
            className="inline-flex w-full items-center justify-center rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-900 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending || isConfirming ? "Checking…" : "Check eligibility"}
          </button>
        </form>
        <div className="rounded-2xl border border-white/15 bg-slate-900/60 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">
            Latest decision
          </p>
          {!isConnected && (
            <p className="mt-4 text-sm text-slate-300">
              Connect your farmer wallet to view decisions.
            </p>
          )}
          {decisionCountError && (
            <p className="mt-4 text-sm text-rose-300">
              {decisionCountError.message.slice(0, 140)}
            </p>
          )}
          {latestSummary ? (
            <div className="mt-6 space-y-4">
              <p className="text-2xl font-display text-white">
                {latestSummary.eligible ? "✅ Eligible" : "❌ Ineligible"}
              </p>
              <p className="text-sm text-slate-300">
                Subsidy: {latestSummary.amount} ETH
              </p>
              <p className="text-sm text-slate-400">
                Reason: {latestSummary.reason || "No reason recorded"}
              </p>
              <p className="text-xs text-slate-500">
                Weather Event: {latestSummary.weatherEvent || "—"}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">
              {decisionError
                ? "No decisions yet. Trigger a check above."
                : "No decisions recorded for this wallet."}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

