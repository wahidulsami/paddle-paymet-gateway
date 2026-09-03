"use client";

import { useEffect, useState } from "react";
import { initializePaddle, type Environments, type Paddle } from "@paddle/paddle-js";
import { PricingTiers, type Tier } from "@/constants/pricing-tier";
import { usePaddlePrices } from "@/hooks/usePaddlePrices";
import { Check, Loader2, CreditCard, Copy } from "lucide-react";

interface PricingProps {
  country?: string | null;
}

export function Pricing({ country }: PricingProps) {
  const [billing, setBilling] = useState<"month" | "year">("month");
  const [paddle, setPaddle] = useState<Paddle | undefined>();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  const paddleEnv = process.env.NEXT_PUBLIC_PADDLE_ENV as Environments | undefined;

  const configError =
    !clientToken || !paddleEnv
      ? "Set NEXT_PUBLIC_PADDLE_CLIENT_TOKEN and NEXT_PUBLIC_PADDLE_ENV in .env.local"
      : null;

  useEffect(() => {
    if (!clientToken || !paddleEnv) return;

    initializePaddle({ token: clientToken, environment: paddleEnv })
      .then((p) => {
        if (p) setPaddle(p);
        else setError("Paddle.js returned no instance");
      })
      .catch((err) => setError(`Paddle.js init failed: ${err instanceof Error ? err.message : err}`));
  }, [clientToken, paddleEnv]);

  const activeError = configError || error;

  function copyField(label: string, value: string) {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 1500);
    });
  }

  const { prices, loading: pricesLoading } = usePaddlePrices(paddle, country);

  function subscribe(tier: Tier) {
    const priceId = tier.priceId[billing];
    if (!paddle) return;

    setError(null);
    setOpeningId(priceId);

    try {
      const successUrl = email.trim()
        ? `${window.location.origin}/welcome?email=${encodeURIComponent(email.trim())}`
        : `${window.location.origin}/welcome`;

      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        settings: {
          displayMode: "overlay",
          theme: "light",
          variant: "one-page",
          successUrl,
        },
        customer: email.trim() ? { email: email.trim() } : undefined,
      });
    } catch (err) {
      setError(`Checkout failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      setTimeout(() => setOpeningId(null), 1000);
    }
  }

  return (
    <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-16">
      {/* Config error toast */}
      {activeError && (
        <div className="mb-8 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          {activeError}
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-3">
          7-day free trial on all plans
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
          Simple pricing
        </h1>
        <p className="mt-3 text-zinc-500 max-w-lg mx-auto">
          Paddle handles checkout, tax, and subscriptions so you can focus on building.
        </p>

        {/* Email */}
        <div className="mt-6 max-w-xs mx-auto">
          <input
            type="email"
            placeholder="Email (optional, prefills checkout)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        {/* Billing toggle */}
        <div className="mt-6 inline-flex p-1 bg-zinc-100 rounded-lg">
          {(["month", "year"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setBilling(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                billing === f
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {f === "month" ? "Monthly" : "Annual"}
              {f === "year" && (
                <span className="ml-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  2 MO FREE
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Demo card hint */}
        <div className="mt-5 mx-auto max-w-sm rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-left">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-semibold text-zinc-700">Sandbox Test Card</span>
          </div>
          <div className="space-y-2">
            {[
              { label: "Card number", value: "4242 4242 4242 4242" },
              { label: "CVC", value: "100" },
              { label: "Expiry", value: "12 / 34" },
            ].map((field) => (
              <button
                key={field.label}
                type="button"
                onClick={() => copyField(field.label, field.value.replace(/\s/g, ""))}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition group"
              >
                <span className="text-[11px] text-zinc-400 font-medium">{field.label}</span>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-sm font-semibold text-zinc-800">
                    {field.value}
                  </code>
                  {copiedField === field.label ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-500 transition" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PricingTiers.map((tier) => {
          const priceId = tier.priceId[billing];
          const display = prices[priceId];
          const isFeatured = tier.popular;

          return (
            <div
              key={tier.id}
              className={`relative flex flex-col rounded-xl p-6 transition ${
                isFeatured
                  ? "border-2 border-emerald-600 bg-white shadow-lg scale-[1.02] z-10"
                  : "border border-zinc-200 bg-white"
              }`}
            >
              {isFeatured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-emerald-600 text-white rounded-full text-[11px] font-semibold">
                  Popular
                </div>
              )}

              <h3 className="text-lg font-semibold text-zinc-900">{tier.name}</h3>
              <p className="text-sm text-zinc-500 mt-1">{tier.description}</p>

              <div className="mt-4 pb-4 border-b border-zinc-100">
                {pricesLoading && !display ? (
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-300" />
                ) : (
                  <span className="text-3xl font-bold text-zinc-900">
                    {display || "$--"}
                  </span>
                )}
                <span className="text-sm text-zinc-400 ml-1">
                  /{billing === "month" ? "mo" : "yr"}
                </span>
              </div>

              <ul className="mt-4 space-y-2.5 flex-1">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-600">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => subscribe(tier)}
                disabled={!paddle || openingId === priceId}
                className={`mt-6 w-full py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  isFeatured
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-zinc-900 hover:bg-zinc-800 text-white"
                }`}
              >
                {openingId === priceId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Start free trial"
                )}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
