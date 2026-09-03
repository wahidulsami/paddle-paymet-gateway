"use client";

import { type Paddle, type PricePreviewParams, type PricePreviewResponse } from "@paddle/paddle-js";
import { useEffect, useState } from "react";
import { PricingTiers } from "@/constants/pricing-tier";

export type PaddlePrices = Record<string, string>;

function getLineItems(): PricePreviewParams["items"] {
  return PricingTiers.flatMap((tier) => [
    { priceId: tier.priceId.month, quantity: 1 },
    { priceId: tier.priceId.year, quantity: 1 },
  ]);
}

function extractPriceAmounts(previewResponse: PricePreviewResponse): PaddlePrices {
  if (!previewResponse?.data?.details?.lineItems) {
    return {};
  }
  return previewResponse.data.details.lineItems.reduce<PaddlePrices>((acc, item) => {
    // Rely strictly on formattedTotals.total provided by Paddle
    acc[item.price.id] = item.formattedTotals.total;
    return acc;
  }, {});
}

export function usePaddlePrices(
  paddle: Paddle | undefined,
  country?: string | null
): { prices: PaddlePrices; loading: boolean; error: string | null } {
  const [prices, setPrices] = useState<PaddlePrices>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!paddle) {
      return;
    }

    const lineItems = getLineItems();

    // Check if valid price IDs are present (not empty or unconfigured placeholders)
    const hasValidPriceIds = lineItems.some(
      (item) => item.priceId && !item.priceId.includes("placeholder")
    );

    if (!hasValidPriceIds) {
      return;
    }

    const params: Partial<PricePreviewParams> = {
      items: lineItems,
    };

    // If country is provided and not the internal sentinel "OTHERS", attach address.countryCode.
    // If absent or "OTHERS", do NOT pass address so Paddle auto-detects from visitor IP!
    if (country && country !== "OTHERS" && country.trim().length === 2) {
      params.address = { countryCode: country.trim().toUpperCase() };
    }

    queueMicrotask(() => {
      setLoading(true);
      setError(null);
    });

    paddle
      .PricePreview(params as PricePreviewParams)
      .then((response) => {
        if (response?.data?.details?.lineItems) {
          setPrices(extractPriceAmounts(response));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Paddle PricePreview notice:", err);
        setError(err instanceof Error ? err.message : "Failed to preview prices");
        setLoading(false);
      });
  }, [paddle, country]);

  return { prices, loading, error };
}
