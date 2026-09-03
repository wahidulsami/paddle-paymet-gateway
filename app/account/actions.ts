"use server";

import { getPaddleInstance } from "@/utils/paddle/get-paddle-instance";
import {
  getCustomerByEmail,
  getSubscriptionByCustomerId,
  getSubscriptionById,
} from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface PortalSessionResult {
  url?: string;
  error?: string;
}

/**
 * Server Action: Mint a Paddle Customer Portal Session
 *
 * Requirements:
 * - Resolve customer ID server-side from authenticated user email / session.
 * - Never trust a customer ID supplied directly by client input.
 * - Lookup customer and subscription in database mirror.
 * - Mint session with Paddle Node SDK and return only the redirect URL.
 */
export async function createPortalSessionAction(
  userEmail: string
): Promise<PortalSessionResult> {
  const email = userEmail?.trim();
  if (!email) {
    return { error: "Authentication required: Please provide your email." };
  }

  // 1. Resolve Paddle customer ID server-side via email bridge
  const customer = getCustomerByEmail(email);
  if (!customer?.customer_id) {
    console.warn(`[Portal] No customer found for email: "${email}"`);
    return {
      error:
        "No Paddle customer record found for this email. Please complete a checkout on the pricing page first.",
    };
  }

  console.log(`[Portal] Resolved customer: ${customer.customer_id} for email: "${email}"`);

  // 2. Fetch active subscriptions for deep links
  const sub = getSubscriptionByCustomerId(customer.customer_id);
  const subscriptionIds = sub ? [sub.subscription_id] : [];

  console.log(`[Portal] Subscription for deep links: ${sub ? sub.subscription_id : "none"}, customer_id: ${customer.customer_id}`);

  try {
    const paddle = getPaddleInstance();

    // 3. Mint portal session with the Paddle Node SDK
    const session = await paddle.customerPortalSessions.create(
      customer.customer_id,
      subscriptionIds
    );

    if (!session?.urls?.general?.overview) {
      return { error: "Paddle did not return a valid portal session URL." };
    }

    // Return ONLY the redirect URL to client (never raw session or internal IDs)
    return { url: session.urls.general.overview };
  } catch (err) {
    console.error("[Customer Portal] Failed to create portal session:", err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "Failed to create customer portal session.",
    };
  }
}

/**
 * Server Action: Update a subscription plan (upgrade / downgrade)
 *
 * Supports proration modes:
 * - 'prorated_immediately': default for user upgrade
 * - 'do_not_bill': used for testing / admin immediate change without charge
 */
export async function updateSubscriptionPlanAction(params: {
  subscriptionId: string;
  userEmail: string;
  newPriceId: string;
  prorationBillingMode?: "prorated_immediately" | "do_not_bill" | "prorated_next_billing_period";
}) {
  const email = params.userEmail?.trim();
  if (!email) {
    return { error: "Authentication required: Please provide your email." };
  }

  // Ownership verification: ensure user owns this subscription
  const customer = getCustomerByEmail(email);
  if (!customer) {
    return { error: "Customer not found." };
  }

  const sub = getSubscriptionById(params.subscriptionId);
  if (!sub || sub.customer_id !== customer.customer_id) {
    return { error: "Forbidden: You do not own this subscription." };
  }

  try {
    const paddle = getPaddleInstance();
    const prorationMode = params.prorationBillingMode || "prorated_immediately";

    const updated = await paddle.subscriptions.update(params.subscriptionId, {
      items: [{ priceId: params.newPriceId, quantity: 1 }],
      prorationBillingMode: prorationMode,
    });

    revalidatePath("/account");
    return {
      success: true,
      status: updated.status,
      priceId: updated.items?.[0]?.price?.id,
    };
  } catch (err) {
    console.error("[Subscription Update] Error:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to update subscription.",
    };
  }
}

/**
 * Server Action: Cancel a subscription
 *
 * Supports:
 * - 'next_billing_period': schedules cancellation at end of period (status stays active until period ends)
 * - 'immediately': cancels immediately (status flips to canceled)
 */
export async function cancelSubscriptionAction(params: {
  subscriptionId: string;
  userEmail: string;
  effectiveFrom: "next_billing_period" | "immediately";
}) {
  const email = params.userEmail?.trim();
  if (!email) {
    return { error: "Authentication required: Please provide your email." };
  }

  // Ownership verification
  const customer = getCustomerByEmail(email);
  if (!customer) {
    return { error: "Customer not found." };
  }

  const sub = getSubscriptionById(params.subscriptionId);
  if (!sub || sub.customer_id !== customer.customer_id) {
    return { error: "Forbidden: You do not own this subscription." };
  }

  try {
    const paddle = getPaddleInstance();
    const canceled = await paddle.subscriptions.cancel(params.subscriptionId, {
      effectiveFrom: params.effectiveFrom,
    });

    revalidatePath("/account");
    return {
      success: true,
      status: canceled.status,
      scheduledChange: canceled.scheduledChange?.effectiveAt ?? null,
      scheduledAction: canceled.scheduledChange?.action ?? null,
    };
  } catch (err) {
    console.error("[Subscription Cancel] Error:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to cancel subscription.",
    };
  }
}
