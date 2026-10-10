"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, Bot, AlertCircle } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const GREETING: Message = {
  role: "assistant",
  content: "Hey creator! I'm your AI growth strategist. What YouTube strategy, CTR hook, or packaging idea can we work on today?",
};

export function ChatInterface({
  userId,
  chatId,
  onOpenUpgrade,
  onMessageSent,
}: {
  userId: string;
  chatId: string | null;
  onOpenUpgrade: () => void;
  onMessageSent?: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load saved messages for this chat
  useEffect(() => {
    if (!chatId) return;
    let cancelled = false;
    fetch(`/api/chats/${chatId}?userId=${userId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.messages?.length) return;
        setMessages([GREETING, ...data.messages.map((m: Message) => ({ role: m.role, content: m.content }))]);
      });
    return () => {
      cancelled = true;
    };
  }, [chatId, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setErrorMsg(null);

    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, userId, chatId }),
      });

      if (res.status === 403) {
        const data = await res.json();
        setErrorMsg(data.error || "Out of credits!");
        setLoading(false);
        onOpenUpgrade(); // Automatically trigger upgrade modal if out of credits
        return;
      }

      if (!res.ok || !res.body) {
        throw new Error("Failed to generate response");
      }

      // Read the stream from the backend
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = "";

      // Add placeholder for assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantResponse += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: assistantResponse };
          return updated;
        });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
      onMessageSent?.();
    }
  };

  return (
    <div className="flex flex-col h-[650px] w-full max-w-4xl rounded-2xl border border-white/10 bg-[#0A0A0A] shadow-2xl overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2">
          <Sparkles className="text-indigo-400" size={20} />
          <h3 className="font-semibold text-white">YouTube Growth Strategist</h3>
        </div>
        <span className="text-xs text-gray-400 bg-black/40 px-3 py-1 rounded-full border border-white/5">
          GPT-4o Powered
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                msg.role === "user" ? "bg-indigo-600 text-white" : "bg-white/10 text-indigo-400"
              }`}
            >
              {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-tr-none"
                  : "bg-white/5 text-gray-200 border border-white/10 rounded-tl-none"
              }`}
            >
              {msg.content || (loading && index === messages.length - 1 ? "Thinking..." : "")}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="flex items-center gap-2 bg-red-500/10 border-t border-red-500/20 px-6 py-3 text-red-400 text-sm">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-black/40 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about video ideas, thumbnails, or retention strategies..."
          className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-white font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}