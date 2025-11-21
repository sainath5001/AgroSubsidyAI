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
  WEATHER_ORACLE_ABI,
} from "../lib/constants";

const initialWeather = {
  region: "",
  temperature: "",
  rainfall: "",
  droughtAlert: true,
  floodAlert: false,
  eventId: "",
};

export function WeatherOracleConsole() {
  const { isConnected } = useAccount();
  const [form, setForm] = useState(initialWeather);
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

  const handleChange = (field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) return;
    try {
      await writeContractAsync({
        abi: WEATHER_ORACLE_ABI,
        address: CONTRACT_ADDRESSES.weatherOracle as `0x${string}`,
        functionName: "recordWeatherData",
        args: [
          form.region,
          BigInt(Math.round(Number(form.temperature || 0) * 100)),
          BigInt(Math.round(Number(form.rainfall || 0) * 100)),
          Boolean(form.droughtAlert),
          Boolean(form.floodAlert),
          form.eventId || `event-${Date.now()}`,
        ],
      });
      setForm(initialWeather);
    } catch (err) {
      console.error("weather error", err);
    }
  };

  return (
    <section className="px-4 py-24 sm:px-8 lg:px-12">
      <SectionTitle
        eyebrow="Weather oracle"
        title="Push verified drought/flood alerts to the blockchain"
        className="mb-12 text-left"
        align="left"
      />
      <form
        onSubmit={handleSubmit}
        className="mx-auto grid max-w-5xl gap-6 rounded-[28px] border border-white/15 bg-gradient-to-br from-cyan-900/30 to-slate-900/70 p-8"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <label className="text-sm text-slate-100">
            Region (district/village)
            <input
              required
              value={form.region}
              onChange={(e) => handleChange("region", e.target.value)}
              placeholder="Baghpat"
              className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-200"
            />
          </label>
          <label className="text-sm text-slate-100">
            Event ID
            <input
              value={form.eventId}
              onChange={(e) => handleChange("eventId", e.target.value)}
              placeholder="event-2025-001"
              className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-200"
            />
          </label>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <label className="text-sm text-slate-100">
            Temperature (°C)
            <input
              type="number"
              step="0.1"
              value={form.temperature}
              onChange={(e) => handleChange("temperature", e.target.value)}
              placeholder="37.5"
              className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-200"
            />
          </label>
          <label className="text-sm text-slate-100">
            Rainfall (mm)
            <input
              type="number"
              step="0.1"
              value={form.rainfall}
              onChange={(e) => handleChange("rainfall", e.target.value)}
              placeholder="5.5"
              className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-200"
            />
          </label>
          <div className="flex flex-col gap-3 text-sm text-slate-100">
            <span>Drought / Flood alerts</span>
            <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/5 px-4 py-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.droughtAlert}
                  onChange={(e) => handleChange("droughtAlert", e.target.checked)}
                />
                Drought
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.floodAlert}
                  onChange={(e) => handleChange("floodAlert", e.target.checked)}
                />
                Flood
              </label>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 text-sm text-slate-200">
          {!isConnected && (
            <p className="text-rose-200">
              Connect an authorized oracle wallet to submit events.
            </p>
          )}
          {writeError && (
            <p className="text-rose-300">{writeError.message.slice(0, 160)}</p>
          )}
          {isSuccess && (
            <p className="text-emerald-200">Weather event stored successfully.</p>
          )}
        </div>
        <button
          type="submit"
          disabled={!isConnected || isPending || isConfirming}
          className="inline-flex w-full items-center justify-center rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-900 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending || isConfirming ? "Submitting…" : "Record weather event"}
        </button>
      </form>
    </section>
  );
}




