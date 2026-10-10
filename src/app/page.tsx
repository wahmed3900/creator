"use client";

import { useState } from "react";
import { UpgradeModal } from "@/components/billing/UpgradeModal";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-[#0A0A0A] text-white">
      <h1 className="text-4xl font-bold mb-4">Creator AI Dashboard</h1>
      <p className="text-gray-400 mb-8">Your YouTube growth engine is ready.</p>
      
      <button 
        onClick={() => setIsModalOpen(true)}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition"
      >
        Open Upgrade Modal
      </button>

      <UpgradeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </main>
  );
}
