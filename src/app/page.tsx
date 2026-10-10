"use client";

import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { AddChannelModal } from "@/components/channels/AddChannelModal";
import { UpgradeModal } from "@/components/billing/UpgradeModal";

interface ChatSession {
  id: string;
  title: string;
}

interface Channel {
  id: string;
  channelId: string;
  title: string;
  subscribers?: number;
}

const USER_KEY = "creator-user-id";

// Returns the stored guest user id, creating a new guest if none exists or it was deleted.
async function loadUserId(): Promise<string> {
  const stored = localStorage.getItem(USER_KEY);
  if (stored) {
    const res = await fetch(`/api/users?userId=${stored}`);
    if (res.ok) return stored;
  }
  const res = await fetch("/api/users", { method: "POST" });
  if (!res.ok) throw new Error("Could not create user");
  const user = await res.json();
  localStorage.setItem(USER_KEY, user.id);
  return user.id;
}

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  useEffect(() => {
    loadUserId()
      .then(setUserId)
      .catch(() => setLoadError("Could not connect to the database. Check DATABASE_URL."));
  }, []);

  const refreshChats = useCallback(async (uid: string) => {
    const res = await fetch(`/api/chats?userId=${uid}`);
    if (!res.ok) return [];
    const list: ChatSession[] = await res.json();
    setChats(list);
    return list;
  }, []);

  const refreshChannels = useCallback(async (uid: string) => {
    const res = await fetch(`/api/channels?userId=${uid}`);
    if (res.ok) setChannels(await res.json());
  }, []);

  useEffect(() => {
    if (!userId) return;
    // Open the most recent chat, or start one so messages always have somewhere to be saved
    refreshChats(userId).then((list) => {
      if (list.length) setActiveChatId(list[0].id);
      else handleNewChat();
    });
    refreshChannels(userId);
  }, [userId, refreshChats, refreshChannels]);

  async function handleNewChat() {
    if (!userId) return;
    const res = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) return;
    const chat = await res.json();
    setChats((prev) => [chat, ...prev]);
    setActiveChatId(chat.id);
  }

  const handleAddChannel = async ({ channelId, title }: { channelId: string; title: string }) => {
    if (!userId) return;
    const res = await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, channelId, title }),
    });
    if (res.ok) refreshChannels(userId);
  };

  const handleDeleteChannel = async (channelId: string) => {
    const res = await fetch(`/api/channels?channelId=${encodeURIComponent(channelId)}`, {
      method: "DELETE",
    });
    if (res.ok) setChannels((prev) => prev.filter((c) => c.channelId !== channelId));
  };

  return (
    <div className="flex h-screen bg-[#050505] text-white">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onNewChat={handleNewChat}
        channels={channels}
        onOpenChannelModal={() => setIsChannelModalOpen(true)}
        onDeleteChannel={handleDeleteChannel}
      />

      <main className="flex flex-1 flex-col items-center justify-center overflow-y-auto p-6">
        {loadError ? (
          <p className="text-sm text-red-400">{loadError}</p>
        ) : !userId || !activeChatId ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          // key resets the conversation when switching or starting a chat
          <ChatInterface
            key={activeChatId}
            userId={userId}
            chatId={activeChatId}
            onOpenUpgrade={() => setIsUpgradeOpen(true)}
            onMessageSent={() => refreshChats(userId)}
          />
        )}
      </main>

      <AddChannelModal
        isOpen={isChannelModalOpen}
        onClose={() => setIsChannelModalOpen(false)}
        onAddChannel={handleAddChannel}
      />
      <UpgradeModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
    </div>
  );
}
