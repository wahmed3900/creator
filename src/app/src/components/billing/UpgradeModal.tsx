 "use client";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#121212] border border-gray-800 p-6 shadow-2xl text-white">
        <h2 className="text-2xl font-bold mb-2">Upgrade to Pro</h2>
        <p className="text-gray-400 text-sm mb-6">
          Unlock unlimited AI video scripts, title generation, and automated thumbnail ideas.
        </p>

        <div className="space-y-3 mb-6">
          <div className="flex items-center text-sm text-gray-300">
            <span className="mr-2 text-indigo-400">✓</span> Unlimited AI Script Generation
          </div>
          <div className="flex items-center text-sm text-gray-300">
            <span className="mr-2 text-indigo-400">✓</span> Advanced SEO & Analytics
          </div>
          <div className="flex items-center text-sm text-gray-300">
            <span className="mr-2 text-indigo-400">✓</span> Priority Rendering
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={() => alert("Redirecting to Stripe payment...")}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
}