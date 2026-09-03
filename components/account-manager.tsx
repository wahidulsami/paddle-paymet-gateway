"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createPortalSessionAction,
  cancelSubscriptionAction,
  updateSubscriptionPlanAction,
} from "@/app/account/actions";
import { type SubscriptionRecord, type CustomerRecord, type TransactionRecord } from "@/lib/db";
import { type AccessCheckResult } from "@/lib/access";
import { PricingTiers } from "@/constants/pricing-tier";
import { ArrowUpRight, RefreshCw, X } from "lucide-react";
import Link from "next/link";

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
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  // On mount: if URL has no email but localStorage has a fresh checkout email, use it
  useEffect(() => {
    const storedEmail = localStorage.getItem("paddle_checkout_email");
    if (storedEmail && storedEmail !== email) {
      console.log(`[Account] Found checkout email in localStorage: ${storedEmail}, redirecting...`);
      localStorage.removeItem("paddle_checkout_email");
      router.replace(`/account?email=${encodeURIComponent(storedEmail)}`);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentTier = PricingTiers.find(
    (t) => t.priceId.month === subscription?.price_id || t.priceId.year === subscription?.price_id
  );

  function flash(type: "success" | "error", text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  }

  function handleOpenPortal() {
    if (!email.trim()) return;
    setMsg(null);
    startTransition(async () => {
      const res = await createPortalSessionAction(email.trim());
      if (res.error) flash("error", res.error);
      else if (res.url) window.location.href = res.url;
    });
  }

  function handleCancel(effectiveFrom: "next_billing_period" | "immediately") {
    if (!subscription || !email.trim()) return;
    setMsg(null);
    startTransition(async () => {
      const res = await cancelSubscriptionAction({
        subscriptionId: subscription.subscription_id,
        userEmail: email.trim(),
        effectiveFrom,
      });
      if (res.error) flash("error", res.error);
      else flash("success", `Canceled. Status: ${res.status}`);
    });
  }

  function handleUpgrade(priceId: string) {
    if (!subscription || !email.trim()) return;
    setMsg(null);
    startTransition(async () => {
      const res = await updateSubscriptionPlanAction({
        subscriptionId: subscription.subscription_id,
        userEmail: email.trim(),
        newPriceId: priceId,
        prorationBillingMode: "do_not_bill",
      });
      if (res.error) flash("error", res.error);
      else flash("success", `Plan updated. Status: ${res.status}`);
    });
  }

  return (
    <div className="space-y-6">
      {/* Email selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <label className="text-xs font-medium text-zinc-500">Account:</label>
        {customers.length > 0 && (
          <select
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              router.push(`/account?email=${encodeURIComponent(e.target.value)}`);
            }}
            className="text-xs rounded-md border border-zinc-200 px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <option value="">Select customer</option>
            {customers.map((c) => (
              <option key={c.customer_id} value={c.email}>
                {c.email}
              </option>
            ))}
          </select>
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          className="text-xs rounded-md border border-zinc-200 px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        />
        <button
          type="button"
          onClick={() => email.trim() && router.push(`/account?email=${encodeURIComponent(email.trim())}`)}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-zinc-900 text-white hover:bg-zinc-800 transition"
        >
          Load
        </button>
      </div>

      {/* Toast */}
      {msg && (
        <div
          className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between ${
            msg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {msg.text}
          <button type="button" onClick={() => setMsg(null)} className="ml-2 opacity-50 hover:opacity-100">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Subscription card */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Plan</p>
                <h2 className="text-lg font-bold text-zinc-900 mt-0.5">
                  {currentTier ? currentTier.name : subscription ? "Custom" : "None"}
                </h2>
              </div>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  access.hasAccess
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {access.hasAccess ? access.reason : "no access"}
              </span>
            </div>

            {subscription ? (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                    <span className="text-zinc-400">Status</span>
                    <div className="font-semibold text-zinc-800 mt-0.5 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        subscription.status === "active" || subscription.status === "trialing"
                          ? "bg-emerald-500"
                          : subscription.status === "past_due"
                          ? "bg-amber-500"
                          : "bg-zinc-400"
                      }`} />
                      {subscription.status}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                    <span className="text-zinc-400">Subscription ID</span>
                    <div className="font-mono font-semibold text-zinc-800 mt-0.5 truncate">
                      {subscription.subscription_id}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                    <span className="text-zinc-400">Price ID</span>
                    <div className="font-mono font-semibold text-zinc-800 mt-0.5 truncate">
                      {subscription.price_id}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                    <span className="text-zinc-400">Customer ID</span>
                    <div className="font-mono font-semibold text-zinc-800 mt-0.5 truncate">
                      {subscription.customer_id}
                    </div>
                  </div>
                </div>

                {subscription.scheduled_change_action && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    Scheduled: <strong>{subscription.scheduled_change_action}</strong> at{" "}
                    {subscription.scheduled_change_at || "end of period"}
                  </div>
                )}

                {/* Actions */}
                <div className="pt-3 border-t border-zinc-100 flex flex-wrap gap-2">
                  <span className="text-[11px] text-zinc-400 font-medium uppercase mr-1 self-center">Actions:</span>
                  {PricingTiers.filter((t) => t.id !== currentTier?.id).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      disabled={isPending}
                      onClick={() => handleUpgrade(t.priceId.month)}
                      className="px-2.5 py-1 text-[11px] font-medium rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition disabled:opacity-40"
                    >
                      Switch to {t.name}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={isPending || Boolean(subscription.scheduled_change_action)}
                    onClick={() => handleCancel("next_billing_period")}
                    className="px-2.5 py-1 text-[11px] font-medium rounded bg-amber-50 hover:bg-amber-100 text-amber-700 transition disabled:opacity-40"
                  >
                    Cancel at period end
                  </button>
                  <button
                    type="button"
                    disabled={isPending || subscription.status === "canceled"}
                    onClick={() => handleCancel("immediately")}
                    className="px-2.5 py-1 text-[11px] font-medium rounded bg-red-50 hover:bg-red-100 text-red-700 transition disabled:opacity-40"
                  >
                    Cancel now
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-400 py-4 text-center">
                No subscription found. Complete a checkout on the{" "}
                <Link href="/" className="text-emerald-600 underline">pricing page</Link> first.
              </p>
            )}
          </div>

          {/* Transactions */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Transactions ({transactions.length})
            </h3>
            {transactions.length === 0 ? (
              <p className="text-xs text-zinc-400 py-3 text-center">No transactions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-zinc-400 border-b border-zinc-100">
                      <th className="text-left pb-2 font-medium">ID</th>
                      <th className="text-left pb-2 font-medium">Status</th>
                      <th className="text-left pb-2 font-medium">Amount</th>
                      <th className="text-left pb-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {transactions.map((tx) => (
                      <tr key={tx.transaction_id}>
                        <td className="py-2 font-mono text-zinc-700 truncate max-w-[120px]">{tx.transaction_id}</td>
                        <td className="py-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            tx.status === "completed" || tx.status === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-zinc-100 text-zinc-600"
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-2 font-medium text-zinc-700">
                          {tx.amount ? `${(parseInt(tx.amount) / 100).toFixed(2)} ${tx.currency_code || "USD"}` : "—"}
                        </td>
                        <td className="py-2 text-zinc-400 font-mono text-[11px]">{tx.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Portal */}
          <div className="bg-zinc-900 text-white rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold">Customer Portal</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Paddle-hosted portal for updating payment methods and viewing invoices.
            </p>
            <button
              type="button"
              onClick={handleOpenPortal}
              disabled={isPending || !customer}
              className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-sm font-semibold flex items-center justify-center gap-2 transition disabled:opacity-40"
            >
              {isPending ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  Open portal
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
            {!customer && (
              <p className="text-[11px] text-amber-400 text-center">Complete a checkout first.</p>
            )}
          </div>

          {/* Access rules */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4">
            <h4 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Access rules</h4>
            <div className="text-xs text-zinc-600 space-y-1.5">
              <p><strong className="text-zinc-800">Active / Trialing:</strong> Full access</p>
              <p><strong className="text-zinc-800">Scheduled cancel:</strong> Access until period end</p>
              <p><strong className="text-zinc-800">Past due:</strong> Grace period (Paddle retries)</p>
              <p><strong className="text-zinc-800">Canceled:</strong> Access revoked</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
