"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createPortalSessionAction,
  cancelSubscriptionAction,
  updateSubscriptionPlanAction,
} from "@/app/account/actions";
import { type SubscriptionRecord, type CustomerRecord, type TransactionRecord } from "@/lib/db";
import { type AccessCheckResult } from "@/lib/access";
import { PricingTiers } from "@/constants/pricing-tier";
import {
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  RefreshCw,
  Zap,
  Ban,
  Receipt,
  User,
} from "lucide-react";

interface AccountManagerProps {
  customers: CustomerRecord[];
  initialSelectedEmail?: string;
  customer: CustomerRecord | null;
  subscription: SubscriptionRecord | null;
  access: AccessCheckResult;
  transactions: TransactionRecord[];
}

export function AccountManager({
  customers,
  initialSelectedEmail = "",
  customer,
  subscription,
  access,
  transactions,
}: AccountManagerProps) {
  const [email, setEmail] = useState(initialSelectedEmail || customer?.email || "");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const router = useRouter();

  // Determine current tier from price_id
  const currentTier = PricingTiers.find(
    (t) => t.priceId.month === subscription?.price_id || t.priceId.year === subscription?.price_id
  );

  async function handleOpenPortal() {
    if (!email.trim()) {
      setMessage({ type: "error", text: "Please enter or select an account email." });
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const res = await createPortalSessionAction(email.trim());
      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else if (res.url) {
        window.location.href = res.url;
      }
    });
  }

  async function handleCancel(effectiveFrom: "next_billing_period" | "immediately") {
    if (!subscription || !email.trim()) return;

    setMessage(null);
    startTransition(async () => {
      const res = await cancelSubscriptionAction({
        subscriptionId: subscription.subscription_id,
        userEmail: email.trim(),
        effectiveFrom,
      });

      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({
          type: "success",
          text:
            effectiveFrom === "next_billing_period"
              ? `Cancellation scheduled for end of billing period. Status is still '${res.status}' and access remains active until then.`
              : `Subscription canceled immediately. Status is now '${res.status}'. Access has been revoked.`,
        });
      }
    });
  }

  async function handleUpgrade(newPriceId: string, prorationBillingMode: "do_not_bill" | "prorated_immediately") {
    if (!subscription || !email.trim()) return;

    setMessage(null);
    startTransition(async () => {
      const res = await updateSubscriptionPlanAction({
        subscriptionId: subscription.subscription_id,
        userEmail: email.trim(),
        newPriceId,
        prorationBillingMode,
      });

      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({
          type: "success",
          text: `Plan updated successfully! Status: ${res.status}. Switched to new price: ${res.priceId}`,
        });
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Account Email Switcher / Input */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <User className="w-4 h-4 text-zinc-600" />
              <span>Simulate Authenticated User / Account</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Select or type the email address associated with your Paddle sandbox checkout.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {customers.length > 0 && (
              <select
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  router.push(`/account?email=${encodeURIComponent(e.target.value)}`);
                }}
                className="text-xs rounded-lg border border-zinc-300 px-3 py-2 bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Choose Existing Customer --</option>
                {customers.map((c) => (
                  <option key={c.customer_id} value={c.email}>
                    {c.email} ({c.customer_id.slice(0, 10)}...)
                  </option>
                ))}
              </select>
            )}

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="text-xs rounded-lg border border-zinc-300 px-3 py-2 bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <button
              type="button"
              onClick={() => {
                if (email.trim()) {
                  router.push(`/account?email=${encodeURIComponent(email.trim())}`);
                }
              }}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 transition"
            >
              Load
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div
          className={`p-4 rounded-xl text-sm flex items-start gap-3 border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-red-50 text-red-900 border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="text-xs sm:text-sm font-medium">{message.text}</div>
        </div>
      )}

      {/* Main Grid: Subscription Details & Portal Access */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Subscription Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Current Plan</span>
                <h2 className="text-2xl font-black text-zinc-900 mt-1">
                  {currentTier ? currentTier.name : subscription ? "Custom Subscription" : "No Active Subscription"}
                </h2>
              </div>

              {/* Status Badge */}
              <div>
                {access.hasAccess ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Access Granted ({access.reason})</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                    <ShieldAlert className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Access Denied ({access.reason})</span>
                  </div>
                )}
              </div>
            </div>

            {subscription ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-100">
                  <span className="text-zinc-400 font-medium">Subscription ID:</span>
                  <div className="font-mono font-semibold text-zinc-800 mt-0.5 break-all">
                    {subscription.subscription_id}
                  </div>
                </div>

                <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-100">
                  <span className="text-zinc-400 font-medium">Customer ID:</span>
                  <div className="font-mono font-semibold text-zinc-800 mt-0.5 break-all">
                    {subscription.customer_id}
                  </div>
                </div>

                <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-100">
                  <span className="text-zinc-400 font-medium">Status in Database:</span>
                  <div className="font-semibold text-zinc-900 mt-0.5 flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        subscription.status === "active" || subscription.status === "trialing"
                          ? "bg-emerald-500"
                          : subscription.status === "past_due"
                          ? "bg-amber-500"
                          : "bg-zinc-400"
                      }`}
                    />
                    <span className="capitalize">{subscription.status}</span>
                  </div>
                </div>

                <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-100">
                  <span className="text-zinc-400 font-medium">Active Price ID:</span>
                  <div className="font-mono font-semibold text-zinc-800 mt-0.5 break-all">
                    {subscription.price_id}
                  </div>
                </div>

                {/* Scheduled Change Notice */}
                {subscription.scheduled_change_action && (
                  <div className="sm:col-span-2 bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-900 flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Scheduled Action:</span>{" "}
                      <span className="capitalize">{subscription.scheduled_change_action}</span> effective at{" "}
                      <span className="font-mono">{subscription.scheduled_change_at || "end of billing cycle"}</span>.
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Paid features remain available until the scheduled date arrives.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-zinc-500 text-xs">
                No subscription mirrored in database for this customer yet. Complete a checkout on the pricing page to activate.
              </div>
            )}

            {/* Lifecycle Testing Actions */}
            {subscription && (
              <div className="border-t border-zinc-100 pt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
                  Subscription Lifecycle Operations
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Upgrade / Change Plan */}
                  <div className="p-3.5 rounded-xl border border-zinc-200 bg-white space-y-2">
                    <span className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                      <span>Upgrade Plan (Immediate)</span>
                    </span>
                    <p className="text-[11px] text-zinc-500">
                      Switch to Pro or Advanced immediately with proration mode <code>do_not_bill</code>.
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleUpgrade(PricingTiers[1].priceId.month, "do_not_bill")}
                        className="px-2.5 py-1.5 text-[11px] font-semibold rounded bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50"
                      >
                        To Pro (Month)
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleUpgrade(PricingTiers[2].priceId.month, "do_not_bill")}
                        className="px-2.5 py-1.5 text-[11px] font-semibold rounded bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50"
                      >
                        To Advanced
                      </button>
                    </div>
                  </div>

                  {/* Cancellation */}
                  <div className="p-3.5 rounded-xl border border-zinc-200 bg-white space-y-2">
                    <span className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                      <Ban className="w-3.5 h-3.5 text-red-600" />
                      <span>Cancel Subscription</span>
                    </span>
                    <p className="text-[11px] text-zinc-500">
                      Schedule cancellation at period end or cancel immediately.
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isPending || Boolean(subscription.scheduled_change_action)}
                        onClick={() => handleCancel("next_billing_period")}
                        className="px-2.5 py-1.5 text-[11px] font-semibold rounded bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                      >
                        Schedule End-of-Period
                      </button>
                      <button
                        type="button"
                        disabled={isPending || subscription.status === "canceled"}
                        onClick={() => handleCancel("immediately")}
                        className="px-2.5 py-1.5 text-[11px] font-semibold rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Cancel Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Transactions List */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2 mb-4">
              <Receipt className="w-4 h-4 text-zinc-600" />
              <span>Mirrored Transactions ({transactions.length})</span>
            </h3>

            {transactions.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">
                No transactions recorded in database for this customer yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-400 uppercase font-mono">
                      <th className="pb-2">Transaction ID</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {transactions.map((tx) => (
                      <tr key={tx.transaction_id} className="text-zinc-700">
                        <td className="py-2.5 font-mono text-zinc-900">{tx.transaction_id}</td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              tx.status === "completed" || tx.status === "paid"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-zinc-100 text-zinc-700"
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-2.5 font-medium">
                          {tx.amount
                            ? `${(parseInt(tx.amount) / 100).toFixed(2)} ${tx.currency_code || "USD"}`
                            : "—"}
                        </td>
                        <td className="py-2.5 text-zinc-500 font-mono text-[11px]">{tx.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Customer Portal Action */}
        <div className="space-y-6">
          <div className="bg-zinc-900 text-white rounded-2xl p-6 shadow-xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-lg font-bold">Paddle Customer Portal</h3>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                Paddle hosts the customer self-service portal where users update payment cards, view billing history, and download official invoices.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleOpenPortal}
                disabled={isPending || !customer}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
              >
                {isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Minting Portal Session...</span>
                  </>
                ) : (
                  <>
                    <span>Open Customer Portal</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {!customer && (
                <p className="text-[11px] text-amber-400 mt-2 text-center">
                  Checkout first to create a Paddle customer record.
                </p>
              )}
            </div>

            <div className="border-t border-white/10 pt-4 space-y-2 text-[11px] text-zinc-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>One-time authenticated session URL</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Customer ID resolved server-side</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Direct deep links to active subscriptions</span>
              </div>
            </div>
          </div>

          {/* Verification & Testing Help Card */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Access Helper Logic</span>
            </h4>
            <div className="text-xs text-zinc-600 space-y-2 leading-relaxed">
              <p>
                <strong>Active / Trialing:</strong> Grants full access to paid features.
              </p>
              <p>
                <strong>Scheduled Cancellation:</strong> Does <em>not</em> revoke access until status is terminal <code>canceled</code>.
              </p>
              <p>
                <strong>Past Due:</strong> Grants temporary grace period while Retain retries.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
