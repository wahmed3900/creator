"use client";

import { useState } from "react";
import { X, Youtube } from "lucide-react";

export function AddChannelModal({
  isOpen,
  onClose,
  onAddChannel,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAddChannel: (channel: { channelId: string; title: string }) => void;
}) {
  const [channelId, setChannelId] = useState("");
  const [title, setTitle] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelId || !title) return;
    onAddChannel({ channelId, title });
    setChannelId("");
    setTitle("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Youtube className="text-red-500" size={24} />
          <h3 className="text-xl font-bold text-white">Connect YouTube Channel</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Channel Name
            </label>
            <input
              type="text"
              placeholder="e.g. MrBeast"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Channel ID
            </label>
            <input
              type="text"
              placeholder="e.g. UCX6OQ3DkcsbYNE6H8uQQuVA"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            Save Channel
          </button>
        </form>
      </div>
    </div>
  );
}