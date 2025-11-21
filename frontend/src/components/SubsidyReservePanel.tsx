'use client';

import { SectionTitle } from "./SectionTitle";
import { useReadContract } from "wagmi";
import {
  CONTRACT_ADDRESSES,
  SUBSIDY_DISTRIBUTOR_ABI,
} from "../lib/constants";
import { formatEther } from "viem";

export function SubsidyReservePanel() {
  const {
    data: balance,
    refetch: refetchBalance,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.subsidyDistributor as `0x${string}`,
    abi: SUBSIDY_DISTRIBUTOR_ABI,
    functionName: "getBalance",
  });

  const {
    data: totalPayments,
    refetch: refetchPayments,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.subsidyDistributor as `0x${string}`,
    abi: SUBSIDY_DISTRIBUTOR_ABI,
    functionName: "getTotalPayments",
  });

  const {
    data: agentCount,
    refetch: refetchAgents,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.subsidyDistributor as `0x${string}`,
    abi: SUBSIDY_DISTRIBUTOR_ABI,
    functionName: "getAgentCount",
  });

  const formattedBalance = balance
    ? `${Number(formatEther(balance as bigint)).toFixed(4)} ETH`
    : "—";

  return (
    <section className="px-4 py-24 sm:px-8 lg:px-12">
      <SectionTitle
        eyebrow="Treasury"
        title="Live subsidy reserve and agent activity"
        className="mb-12"
      />
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
        <div className="rounded-[28px] border border-emerald-400/30 bg-emerald-500/10 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">
            Reserve balance
          </p>
          <p className="mt-4 font-display text-3xl text-white">
            {formattedBalance}
          </p>
          <button
            onClick={() => refetchBalance()}
            className="mt-6 text-sm text-emerald-200 underline-offset-4 hover:underline"
          >
            Refresh
          </button>
        </div>
        <div className="rounded-[28px] border border-white/15 bg-white/5 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-200">
            Subsidy payouts
          </p>
          <p className="mt-4 font-display text-4xl text-white">
            {totalPayments ? Number(totalPayments).toString() : "0"}
          </p>
          <button
            onClick={() => refetchPayments()}
            className="mt-6 text-sm text-slate-200 underline-offset-4 hover:underline"
          >
            Refresh
          </button>
        </div>
        <div className="rounded-[28px] border border-white/15 bg-white/5 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-200">
            Authorized AI agents
          </p>
          <p className="mt-4 font-display text-4xl text-white">
            {agentCount ? Number(agentCount).toString() : "0"}
          </p>
          <button
            onClick={() => refetchAgents()}
            className="mt-6 text-sm text-slate-200 underline-offset-4 hover:underline"
          >
            Refresh
          </button>
        </div>
      </div>
    </section>
  );
}




