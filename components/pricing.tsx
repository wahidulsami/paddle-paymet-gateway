"use client";

import { useEffect, useState } from "react";
import { initializePaddle, type Environments, type Paddle } from "@paddle/paddle-js";
import { PricingTiers, type Tier } from "@/constants/pricing-tier";
import { usePaddlePrices } from "@/hooks/usePaddlePrices";
import { Check, Loader2, Sparkles, AlertCircle, ArrowRight } from "lucide-react";

interface PricingProps {
  country?: string | null;
  initialEmail?: string;
}

export function Pricing({ country, initialEmail = "" }: PricingProps) {
  const [billingFrequency, setBillingFrequency] = useState<"month" | "year">("month");
  const [paddle, setPaddle] = useState<Paddle | undefined>(undefined);
  const [customerEmail, setCustomerEmail] = useState<string>(initialEmail);
  const [paddleInitError, setPaddleInitError] = useState<string | null>(null);
  const [checkoutOpeningPriceId, setCheckoutOpeningPriceId] = useState<string | null>(null);

  const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  const paddleEnv = process.env.NEXT_PUBLIC_PADDLE_ENV as Environments | undefined;

  const configError = !clientToken || !paddleEnv
    ? "Missing Paddle environment configuration. Please set NEXT_PUBLIC_PADDLE_CLIENT_TOKEN and NEXT_PUBLIC_PADDLE_ENV in your environment (e.g. .env.local)."
    : null;

  // Initialize Paddle.js
  useEffect(() => {
    if (!clientToken || !paddleEnv) {
      return;
    }

    initializePaddle({
      token: clientToken,
      environment: paddleEnv,
    })
      .then((instance) => {
        if (instance) {
          setPaddle(instance);
        } else {
          setPaddleInitError("Paddle.js initialization returned no instance.");
        }
      })
      .catch((err) => {
        console.error("Failed to initialize Paddle.js:", err);
        setPaddleInitError(
          `Failed to initialize Paddle.js: ${err instanceof Error ? err.message : String(err)}`
        );
      });
  }, [clientToken, paddleEnv]);

  const activeError = configError || paddleInitError;

  const { prices, loading: pricesLoading } = usePaddlePrices(paddle, country);

  function handleSubscribe(tier: Tier) {
    const priceId = tier.priceId[billingFrequency];
    if (!paddle) {
      alert("Paddle checkout is not ready. Please verify your client token.");
      return;
    }

    setCheckoutOpeningPriceId(priceId);

    try {
      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        settings: {
          displayMode: "overlay",
          theme: "light",
          variant: "one-page",
          successUrl: `${window.location.origin}/welcome`,
        },
        customer: customerEmail.trim() ? { email: customerEmail.trim() } : undefined,
      });
    } catch (err) {
      console.error("Error opening checkout:", err);
      alert("Error opening checkout. Check console for details.");
    } finally {
      setTimeout(() => setCheckoutOpeningPriceId(null), 1000);
    }
  }

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Environment Config Warning if unset */}
      {activeError && (
        <div className="mb-8 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Paddle Configuration Required</h4>
            <p className="text-xs text-amber-700 mt-1">{activeError}</p>
            <p className="text-xs text-amber-800 mt-2 font-mono">
              Run the catalog seed script or export NEXT_PUBLIC_PADDLE_CLIENT_TOKEN and NEXT_PUBLIC_PADDLE_ENV=sandbox
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>7-Day Free Trial On All Plans</span>
        </div>
        <h2 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
          Predictable, transparent pricing
        </h2>
        <p className="mt-4 text-lg text-zinc-600">
          Choose the plan that fits your growth. Seamless Paddle sandbox checkout with instant provisioning.
        </p>

        {/* Customer email prefill input */}
        <div className="mt-6 flex items-center justify-center gap-2 max-w-md mx-auto">
          <label htmlFor="customerEmail" className="text-xs font-medium text-zinc-500 whitespace-nowrap">
            Your Email:
          </label>
          <input
            id="customerEmail"
            type="email"
            placeholder="test@example.com (prefills checkout)"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Billing Frequency Toggle */}
        <div className="mt-8 flex justify-center">
          <div className="relative flex p-1 bg-zinc-100 rounded-xl border border-zinc-200 shadow-inner">
            <button
              type="button"
              onClick={() => setBillingFrequency("month")}
              className={`relative py-2 px-6 rounded-lg text-sm font-semibold transition-all duration-200 ${
                billingFrequency === "month"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Monthly billing
            </button>
            <button
              type="button"
              onClick={() => setBillingFrequency("year")}
              className={`relative py-2 px-6 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                billingFrequency === "year"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <span>Annual billing</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                2 Months Free
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {PricingTiers.map((tier) => {
          const currentPriceId = tier.priceId[billingFrequency];
          const formattedTotal = prices[currentPriceId];
          const isFeatured = tier.popular;

          return (
            <div
              key={tier.id}
              className={`relative flex flex-col rounded-2xl p-8 transition-all duration-300 ${
                isFeatured
                  ? "border-2 border-emerald-600 bg-white shadow-xl scale-105 z-10"
                  : "border border-zinc-200 bg-zinc-50/50 hover:bg-white hover:shadow-lg"
              }`}
            >
              {isFeatured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold uppercase tracking-wider shadow">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-zinc-900">{tier.name}</h3>
                <p className="text-sm text-zinc-500 mt-2 min-h-[40px]">{tier.description}</p>
              </div>

              {/* Price section - purely displays Paddle's formattedTotals */}
              <div className="mb-6 pb-6 border-b border-zinc-200/80">
                <div className="flex items-baseline gap-1">
                  {pricesLoading && !formattedTotal ? (
                    <div className="flex items-center gap-2 py-1 text-zinc-400">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-sm font-medium">Fetching price...</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-4xl font-extrabold tracking-tight text-zinc-900">
                        {formattedTotal || (billingFrequency === "month" ? "$10.00" : "$100.00")}
                      </span>
                      <span className="text-sm font-medium text-zinc-500">
                        /{billingFrequency === "month" ? "mo" : "yr"}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs text-emerald-600 font-semibold mt-2">
                  Includes 7-day free trial
                </p>
              </div>

              {/* Feature List */}
              <ul className="space-y-3.5 mb-8 flex-1">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-zinc-700">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => handleSubscribe(tier)}
                disabled={!paddle || checkoutOpeningPriceId === currentPriceId}
                className={`w-full py-3 px-5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                  isFeatured
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-emerald-600/25"
                    : "bg-zinc-900 hover:bg-zinc-800 text-white"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {checkoutOpeningPriceId === currentPriceId ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Opening Checkout...</span>
                  </>
                ) : (
                  <>
                    <span>Start 7-Day Free Trial</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
