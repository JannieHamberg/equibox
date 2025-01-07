"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function SubscriptionSuccess() {

  useEffect(() => {
    // Clear any subscription data from storage
    localStorage.removeItem("cart");
    sessionStorage.removeItem("subscriptionPlan");
  }, []);

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="card bg-base-100 shadow-xl p-8 text-center">
        <h1 className="text-3xl font-bold mb-6">Tack!</h1>
        <div className="space-y-4">
          <p className="text-xl">Din prenumeration har blivit aktiverad.</p>
          <p>Du kommer snart få ett bekräftelsemail. </p>
          
          <div className="divider"></div>
          
          <div className="space-y-2">
            <p>Whats next?</p>
            <div className="flex flex-col gap-2">
              <Link href="/userprofile" className="btn btn-primary">
                Mitt Konto
              </Link>
              <Link href="/" className="btn btn-ghost">
                Tillbaka till startsidan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 