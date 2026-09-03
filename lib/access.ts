import { SubscriptionRecord } from "./db";

export interface AccessCheckResult {
  hasAccess: boolean;
  reason: "active" | "trialing" | "past_due_grace" | "canceled" | "paused" | "no_subscription" | "unknown";
  isCancelScheduled: boolean;
  cancelEffectiveAt: string | null;
  status: string | null;
  subscription: SubscriptionRecord | null;
}

/**
 * Access helper: decides whether a subscription currently grants paid access.
 *
 * Rules:
 * - `active` AND `trialing` grant full access.
 * - Do NOT revoke access just because a `scheduled_change` (cancel or pause) exists.
 *   Only revoke when `status` is actually `canceled`.
 * - `past_due`: grants access during grace period so user can fix payment details,
 *   while signaling an alert.
 * - `paused`: access denied.
 * - `canceled`: access denied (terminal state).
 */
export function checkSubscriptionAccess(subscription: SubscriptionRecord | null | undefined): AccessCheckResult {
  if (!subscription) {
    return {
      hasAccess: false,
      reason: "no_subscription",
      isCancelScheduled: false,
      cancelEffectiveAt: null,
      status: null,
      subscription: null,
    };
  }

  const isCancelScheduled = Boolean(
    subscription.scheduled_change_action === "cancel" && subscription.scheduled_change_at
  );
  const cancelEffectiveAt = subscription.scheduled_change_at;

  switch (subscription.status) {
    case "active":
      return {
        hasAccess: true,
        reason: "active",
        isCancelScheduled,
        cancelEffectiveAt,
        status: subscription.status,
        subscription,
      };

    case "trialing":
      return {
        hasAccess: true,
        reason: "trialing",
        isCancelScheduled,
        cancelEffectiveAt,
        status: subscription.status,
        subscription,
      };

    case "past_due":
      // Paddle Retain is retrying invoice payment; grant grace period access with warning banner
      return {
        hasAccess: true,
        reason: "past_due_grace",
        isCancelScheduled,
        cancelEffectiveAt,
        status: subscription.status,
        subscription,
      };

    case "paused":
      return {
        hasAccess: false,
        reason: "paused",
        isCancelScheduled,
        cancelEffectiveAt,
        status: subscription.status,
        subscription,
      };

    case "canceled":
      return {
        hasAccess: false,
        reason: "canceled",
        isCancelScheduled: false,
        cancelEffectiveAt: null,
        status: subscription.status,
        subscription,
      };

    default:
      return {
        hasAccess: false,
        reason: "unknown",
        isCancelScheduled,
        cancelEffectiveAt,
        status: subscription.status,
        subscription,
      };
  }
}
