"use client";

import { Plus, MessageSquare, Youtube, Trash2, X, PlusCircle } from "lucide-react";

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

interface SidebarProps {
  chats: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  channels: Channel[];
  onOpenChannelModal: () => void;
  onDeleteChannel: (channelId: string) => void;
}

export function Sidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  channels,
  onOpenChannelModal,
  onDeleteChannel,
}: SidebarProps) {
  return (
    <aside className="w-64 border-r border-white/10 bg-[#0A0A0A] p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition"
        >
          <Plus size={18} /> New Chat
        </button>

        {/* Chat History Section */}
        <div>
          <p className="px-2 text-xs font-semibold uppercase text-gray-500 mb-2">
            History
          </p>
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {chats.length === 0 ? (
              <p className="px-2 text-xs text-gray-500">No past sessions yet.</p>
            ) : (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition text-left truncate ${
                    activeChatId === chat.id
                      ? "bg-white/10 text-white font-medium"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <MessageSquare size={16} className="shrink-0" />
                  <span className="truncate">{chat.title}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Connected Channels Section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <p className="text-xs font-semibold uppercase text-gray-500">
              Channels
            </p>
            <button
              onClick={onOpenChannelModal}
              className="text-indigo-400 hover:text-indigo-300 transition"
              title="Connect Channel"
            >
              <PlusCircle size={16} />
            </button>
          </div>

          <div className="space-y-2">
            {channels.length === 0 ? (
              <p className="px-2 text-xs text-gray-500">No channels connected.</p>
            ) : (
              channels.map((chan) => (
                <div
                  key={chan.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Youtube size={16} className="text-red-500 shrink-0" />
                    <span className="truncate font-medium text-white">
                      {chan.title}
                    </span>
                  </div>
                  <button
                    onClick={() => onDeleteChannel(chan.channelId)}
                    className="text-gray-500 hover:text-red-400 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}