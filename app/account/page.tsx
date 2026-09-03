import Link from "next/link";
import {
  getAllCustomers,
  getCustomerByEmail,
  getSubscriptionByCustomerId,
  getAllTransactions,
} from "@/lib/db";
import { checkSubscriptionAccess } from "@/lib/access";
import { AccountManager } from "@/components/account-manager";
import { ArrowLeft, UserCheck } from "lucide-react";

interface AccountPageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const { email } = await searchParams;

  const customers = getAllCustomers();
  const selectedEmail = email || (customers.length > 0 ? customers[0].email : "");

  const customer = selectedEmail ? getCustomerByEmail(selectedEmail) ?? null : null;
  const subscription = customer ? getSubscriptionByCustomerId(customer.customer_id) ?? null : null;
  const access = checkSubscriptionAccess(subscription);

  const allTx = getAllTransactions();
  const transactions = customer
    ? allTx.filter((t) => t.customer_id === customer.customer_id)
    : allTx;

  return (
    <div className="min-h-screen bg-zinc-50/50 text-zinc-900 font-sans">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition"
              title="Back to Pricing"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
                P
              </div>
              <h1 className="font-bold text-lg tracking-tight">Account & Customer Portal</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="font-semibold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
              Sandbox
            </span>
            <Link
              href="/"
              className="text-zinc-600 hover:text-zinc-900 font-medium transition"
            >
              Pricing Page
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-2">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Paddle Customer Portal & Fulfillment</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900">
            Subscription Management
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Access your Paddle-hosted customer portal, test plan upgrades, and verify webhook state mirroring.
          </p>
        </div>

        <AccountManager
          customers={customers}
          initialSelectedEmail={selectedEmail}
          customer={customer}
          subscription={subscription}
          access={access}
          transactions={transactions}
        />
      </main>
    </div>
  );
}
