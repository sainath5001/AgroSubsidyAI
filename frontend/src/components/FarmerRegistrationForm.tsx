'use client';

import { useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { SectionTitle } from "./SectionTitle";
import {
  CONTRACT_ADDRESSES,
  FARMER_REGISTRY_ABI,
} from "../lib/constants";

const cropOptions = [
  { label: "Rice", value: 0 },
  { label: "Wheat", value: 1 },
  { label: "Corn", value: 2 },
  { label: "Sugarcane", value: 3 },
  { label: "Cotton", value: 4 },
  { label: "Soybean", value: 5 },
  { label: "Other", value: 6 },
];

const initialForm = {
  landProofHash: "",
  district: "",
  village: "",
  latitude: "",
  longitude: "",
  cropType: 0,
};

export function FarmerRegistrationForm() {
  const { isConnected } = useAccount();
  const [form, setForm] = useState(initialForm);
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

  const handleChange = (
    field: keyof typeof form,
    value: string | number,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) return;
    try {
      await writeContractAsync({
        abi: FARMER_REGISTRY_ABI,
        address: CONTRACT_ADDRESSES.farmerRegistry as `0x${string}`,
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
      setForm(initialForm);
    } catch (err) {
      console.error("register error", err);
    }
  };

  return (
    <section className="px-4 py-24 sm:px-8 lg:px-12">
      <SectionTitle
        eyebrow="Farmer onboarding"
        title="Register land, location, and crop once on-chain"
        className="mb-12 text-left"
        align="left"
      />
      <form
        onSubmit={handleSubmit}
        className="mx-auto grid max-w-5xl gap-6 rounded-[28px] border border-white/15 bg-white/5 p-8"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <label className="text-sm text-slate-200">
            Land proof hash
            <input
              required
              value={form.landProofHash}
              onChange={(e) => handleChange("landProofHash", e.target.value)}
              placeholder="ipfs://hash or doc ref"
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/40"
            />
          </label>
          <label className="text-sm text-slate-200">
            District
            <input
              required
              value={form.district}
              onChange={(e) => handleChange("district", e.target.value)}
              placeholder="Baghpat"
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/40"
            />
          </label>
          <label className="text-sm text-slate-200">
            Village
            <input
              required
              value={form.village}
              onChange={(e) => handleChange("village", e.target.value)}
              placeholder="Naurangabad"
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/40"
            />
          </label>
          <label className="text-sm text-slate-200">
            Crop type
            <select
              value={form.cropType}
              onChange={(e) => handleChange("cropType", Number(e.target.value))}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/40"
            >
              {cropOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="bg-slate-900 text-white"
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <label className="text-sm text-slate-200">
            Latitude (decimal)
            <input
              type="number"
              step="0.000001"
              value={form.latitude}
              onChange={(e) => handleChange("latitude", e.target.value)}
              placeholder="28.6139"
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/40"
            />
          </label>
          <label className="text-sm text-slate-200">
            Longitude (decimal)
            <input
              type="number"
              step="0.000001"
              value={form.longitude}
              onChange={(e) => handleChange("longitude", e.target.value)}
              placeholder="77.1234"
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/40"
            />
          </label>
        </div>
        <div className="flex flex-col gap-3 text-sm text-slate-300">
          {!isConnected && (
            <p className="text-rose-200">
              Connect your wallet above to register.
            </p>
          )}
          {writeError && (
            <p className="text-rose-300">{writeError.message.slice(0, 160)}</p>
          )}
          {isSuccess && (
            <div className="space-y-1">
              <p className="text-emerald-300 font-medium">✓ Registration stored on-chain.</p>
              <p className="text-emerald-200/80 text-xs">
                AI agent will now monitor this farmer for eligible subsidies when weather events occur.
              </p>
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={!isConnected || isPending || isConfirming}
          className="inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending || isConfirming ? "Submitting…" : "Register farmer"}
        </button>
      </form>
    </section>
  );
}

