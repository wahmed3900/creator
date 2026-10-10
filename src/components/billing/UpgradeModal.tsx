"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function UpgradeModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [plan, setPlan] = useState<"boost" | "max">("max");
  const [promoCode, setPromoCode] = useState("");
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [discount, setDiscount] = useState(0);

  if (!isOpen) return null;

  // Pricing Matrix (Adjust these prices to your liking)
  const pricing = {
    boost: { monthly: 29, yearly: 19 },
    max: { monthly: 49, yearly: 39 },
  };

  const basePrice = pricing[plan][billingCycle];
  const finalPrice = Math.max(0, basePrice - discount);

  const handleApplyPromo = () => {
    // Simple mock logic for promo code validation
    if (promoCode.toUpperCase() === "CREATOR20") {
      setDiscount(10); // $10 off
      alert("Promo code applied successfully!");
    } else {
      alert("Invalid promo code (Try 'CREATOR20')");
    }
  };

  const handleCheckout = async () => {
    const userId = "test-user-id-123"; // Replace with your auth provider userId

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, billingCycle, userId, promoCode }),
    });

    const { url, error } = await res.json();
    if (error) return alert(error);
    if (url) window.location.href = url;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A] shadow-2xl">
        
        {/* Left Side: Marketing */}
        <div className="w-1/2 bg-gradient-to-br from-indigo-900/40 to-purple-900/20 p-10">
          <div className="mb-6 flex justify-center">
            <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
              <button
                onClick={() => setPlan("boost")}
                className={`rounded-full px-6 py-2 text-sm transition ${
                  plan === "boost" ? "bg-white text-black" : "text-gray-400"
                }`}
              >
                Boost
              </button>
              <button
                onClick={() => setPlan("max")}
                className={`rounded-full px-6 py-2 text-sm transition ${
                  plan === "max" ? "bg-indigo-500 text-white" : "text-gray-400"
                }`}
              >
                MAX
              </button>
            </div>
          </div>
          <h2 className="mb-4 text-center text-4xl font-bold text-white">
            {plan === "max" ? "Maximum Intelligence," : "Growth Engine,"}
            <br />
            {plan === "max" ? "Unlimited Insights" : "Faster Analytics"}
          </h2>
          <p className="mb-8 text-center text-gray-400">
            {plan === "max"
              ? "5x deeper thinking, unlimited messages, & insights driven by billions of YouTube videos"
              : "Advanced analytics and smart suggestions to fast-track your channel growth."}
          </p>

          <div className="rounded-xl border border-white/10 bg-black/50 p-4">
            <p className="text-sm text-gray-300">
              Found a new meta which can help you grow 3x faster
            </p>
            <div className="mt-3 flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-12 rounded bg-gray-800"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Checkout */}
        <div className="relative w-1/2 p-10">
          <button
            onClick={onClose}
            className="absolute right-6 top-6 text-gray-400 hover:text-white"
          >
            <X />
          </button>
          <h3 className="mb-8 text-center text-2xl font-semibold text-white">
            Checkout
          </h3>

          {/* Billing Toggle */}
          <div className="mb-8 grid grid-cols-2 gap-4">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-xl border p-4 text-left transition ${
                billingCycle === "monthly"
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-white/10"
              }`}
            >
              <p className="font-medium text-white">Monthly</p>
              <p className="text-2xl font-bold text-white">
                ${pricing[plan].monthly}
                <span className="text-sm font-normal text-gray-400">/mo</span>
              </p>
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`relative rounded-xl border p-4 text-left transition ${
                billingCycle === "yearly"
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-white/10"
              }`}
            >
              <span className="absolute -top-3 right-4 rounded-full bg-green-500 px-2 py-1 text-xs text-white">
                Save
              </span>
              <p className="font-medium text-white">Yearly</p>
              <p className="text-2xl font-bold text-white">
                ${pricing[plan].yearly}
                <span className="text-sm font-normal text-gray-400">/mo</span>
              </p>
            </button>
          </div>

          {/* Order Summary */}
          <div className="mb-8 space-y-4">
            <div className="flex justify-between text-white capitalize">
              <span>{plan} Plan ({billingCycle})</span>
              <span>${basePrice}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-400 text-sm">
                <span>Discount</span>
                <span>-${discount}</span>
              </div>
            )}
            <div className="text-sm text-gray-400">
              <span>1 channel included</span>
            </div>

            {!showPromoInput ? (
              <div
                onClick={() => setShowPromoInput(true)}
                className="cursor-pointer text-sm text-blue-400 hover:underline"
              >
                Add Promo Code
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter CODE"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="w-full rounded-lg bg-black border border-white/20 px-3 py-1.5 text-sm text-white"
                />
                <button
                  onClick={handleApplyPromo}
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white"
                >
                  Apply
                </button>
              </div>
            )}

            <div className="flex justify-between border-t border-white/10 pt-4 font-bold text-white">
              <span>Amount Due Today</span>
              <span>${finalPrice}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            className="w-full rounded-xl bg-blue-500 py-4 font-semibold text-white transition-colors hover:bg-blue-600"
          >
            Pay Now
          </button>
          <p className="mt-4 text-center text-xs text-gray-500">
            Service begins immediately. All purchases are final per our Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
}