"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

function WelcomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");

  useEffect(() => {
    if (email) {
      localStorage.setItem("paddle_checkout_email", email);
      console.log(`[Welcome] Stored checkout email in localStorage: ${email}`);
      router.replace(`/account?email=${encodeURIComponent(email)}`);
    }
  }, [email, router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-zinc-900">Checkout complete</h1>
          <p className="text-sm text-zinc-500">
            {email ? (
              <>Redirecting to your account for <strong>{email}</strong>...</>
            ) : (
              <>Your trial is active. Redirecting to your account...</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense>
      <WelcomeContent />
    </Suspense>
  );
}
