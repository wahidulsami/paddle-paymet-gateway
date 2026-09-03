import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-zinc-900">Checkout complete</h1>
          <p className="text-sm text-zinc-500">
            Your subscription is being processed. Check your account for details.
          </p>
        </div>

        <div className="space-y-2">
          <Link
            href="/account"
            className="block w-full py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition"
          >
            Go to account
            <ArrowRight className="w-3.5 h-3.5 inline ml-1.5" />
          </Link>
          <Link
            href="/"
            className="block w-full py-2.5 rounded-lg text-zinc-500 text-sm font-medium hover:text-zinc-800 transition"
          >
            Back to pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
