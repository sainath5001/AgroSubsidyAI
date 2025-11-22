"use client";

import { useMemo, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
  useChainId,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { SectionTitle } from "./SectionTitle";
import { CONTRACT_ADDRESSES, SUBSIDY_DISTRIBUTOR_ABI } from "../lib/constants";
import { sepolia } from "wagmi/chains";

export function FarmerPortal() {
  const { address, chainId, isConnected } = useAccount();
  const currentChainId = useChainId();
  const { connectAsync, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const { data: balanceData } = useBalance({
    address,
    chainId,
    query: { enabled: Boolean(address) },
  });

  const [amount, setAmount] = useState("");
  const {
    writeContractAsync,
    data: txHash,
    error: writeError,
    isPending: isSubmitting,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash,
      query: { enabled: Boolean(txHash) },
    });

  const connectWallet = async () => {
    const wallet = connectors?.[0];
    if (!wallet) return;
    try {
      await connectAsync({ connector: wallet, chainId: sepolia.id });
    } catch (err) {
      console.error("connect error", err);
    }
  };

  const wrongNetwork =
    isConnected && currentChainId && currentChainId !== sepolia.id;

  const depositDisabled = useMemo(() => {
    if (!isConnected) return true;
    if (wrongNetwork) return true;
    if (!amount || Number(amount) <= 0) return true;
    return isSubmitting || isConfirming;
  }, [amount, isConnected, wrongNetwork, isSubmitting, isConfirming]);

  const handleDeposit = async () => {
    if (depositDisabled) return;
    try {
      if (wrongNetwork && switchChainAsync) {
        await switchChainAsync({ chainId: sepolia.id });
      }
      await writeContractAsync({
        abi: SUBSIDY_DISTRIBUTOR_ABI,
        address: CONTRACT_ADDRESSES.subsidyDistributor as `0x${string}`,
        functionName: "depositFunds",
        value: parseEther(amount),
      });
      setAmount("");
    } catch (err) {
      console.error("deposit error", err);
    }
  };

  return (
    <section className="px-4 py-24 sm:px-8 lg:px-12">
      <SectionTitle
        eyebrow="Farmer portal"
        title="Connect wallet, fund the relief pool, and track your status"
        className="mb-12"
      />
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
        <div className="rounded-[28px] border border-white/15 bg-white/5 p-8">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">
              Wallet
            </p>
            {isConnected ? (
              <>
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-white">
                    {address?.slice(0, 6)}…{address?.slice(-4)}
                  </p>
                  <p className="text-sm text-slate-300">
                    Balance: {balanceData
                      ? `${Number(formatEther(balanceData.value)).toFixed(4)} ${
                          balanceData.symbol
                        }`
                      : "–"}
                  </p>
                </div>
                <button
                  onClick={() => disconnect()}
                  className="inline-flex w-full items-center justify-center rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isConnecting ? "Connecting…" : "Connect wallet"}
              </button>
            )}
            {wrongNetwork ? (
              <div className="space-y-3 rounded-2xl border border-rose-300/30 bg-rose-500/10 p-4 text-sm text-rose-100">
                <p className="font-semibold">Wrong network detected</p>
                <p>Switch to Sepolia Testnet to deposit into the farmer pool.</p>
                <button
                  onClick={() => switchChainAsync?.({ chainId: sepolia.id })}
                  disabled={isSwitching}
                  className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-white/90 px-4 py-2 font-semibold text-rose-800"
                >
                  {isSwitching ? "Switching…" : "Switch to Sepolia"}
                </button>
              </div>
            ) : null}
            <div className="rounded-2xl bg-slate-900/70 p-4 text-sm text-slate-300">
              <p className="font-semibold text-white">
                Need Sepolia ETH for testing?
              </p>
              <p className="mt-2">
                Grab it from a faucet, then deposit here to top-up the
                SubsidyDistributor reserve that pays eligible farmers.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-emerald-300/20 bg-emerald-500/10 p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">
            Deposit Sepolia ETH
          </p>
          <p className="mt-4 text-lg text-slate-100">
            Funds go directly into the SubsidyDistributor reserve
            ({CONTRACT_ADDRESSES.subsidyDistributor.slice(0, 6)}…
            {CONTRACT_ADDRESSES.subsidyDistributor.slice(-4)}). Only authorized
            AI agents can release them to eligible farmers.
          </p>
          <div className="mt-6 space-y-4">
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-lg text-white outline-none focus:border-white/40"
            />
            <button
              onClick={handleDeposit}
              disabled={depositDisabled}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-300 px-6 py-3 font-semibold text-slate-900 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting || isConfirming
                ? "Processing…"
                : "Deposit to relief pool"}
            </button>
            {writeError ? (
              <p className="text-sm text-rose-300">
                {writeError.message.slice(0, 120)}
              </p>
            ) : null}
            {isConfirmed ? (
              <p className="text-sm text-emerald-300">
                Deposit confirmed on-chain.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

