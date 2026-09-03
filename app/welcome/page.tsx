import Link from "next/link";
import { CheckCircle2, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-zinc-200 rounded-3xl p-8 text-center shadow-xl">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
          Welcome aboard!
        </h1>

        <p className="mt-3 text-sm text-zinc-600">
          Your Paddle sandbox checkout completed successfully. Your 7-day free trial has been activated and your subscription webhook is being processed.
        </p>

        <div className="my-6 p-4 rounded-xl bg-zinc-50 border border-zinc-100 text-left space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Paddle Webhook Fulfillment</span>
          </div>
          <p className="text-xs text-zinc-500">
            Our server-side webhook handler has received your transaction, verified its signature, and mirrored your subscription into the local database.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/account"
            className="w-full py-3 px-4 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 font-semibold text-sm flex items-center justify-center gap-2 transition shadow-sm"
          >
            <UserCheck className="w-4 h-4" />
            <span>Go to Account & Portal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/"
            className="w-full py-2.5 px-4 rounded-xl text-zinc-600 hover:text-zinc-900 font-medium text-xs block transition"
          >
            Back to Pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
