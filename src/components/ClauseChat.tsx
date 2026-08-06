"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  clauseText: string;
  state: string;
}

const SUGGESTED = [
  "Can my landlord actually do this?",
  "Is this negotiable?",
  "What happens if I ignore this?",
];

export default function ClauseChat({ clauseText, state }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content) return;

    const userMsg: Message = { role: "user", content };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, clauseText, state }),
      });
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Something went wrong. Try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="text-[11px] text-[#4a6fa5] hover:text-[#6a8fc5] font-medium mt-1 w-fit tracking-wide transition-colors"
      >
        💬 Ask about this clause
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40"
          onClick={() => { setOpen(false); setMessages([]); }}
        />
      )}

      {/* Slide-in panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#161616] border-l border-[#282828] z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#282828] bg-[#1c1c1c] shrink-0">
          <div>
            <span className="text-sm font-medium text-[#888]">
              💬 Clause Chat
            </span>
            <p className="text-[11px] text-[#3a3a3a] mt-0.5 line-clamp-1 italic">
              "{clauseText.slice(0, 60)}..."
            </p>
          </div>
          <button
            onClick={() => { setOpen(false); setMessages([]); }}
            className="text-[#333] hover:text-[#666] text-lg leading-none ml-4 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex flex-col gap-3 p-4 overflow-y-auto flex-1">
          {messages.length === 0 ? (
            <div className="flex flex-col gap-2 mt-2">
              <p className="text-[11px] text-center text-[#333] mb-1 uppercase tracking-widest">
                Ask anything about this clause
              </p>
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-sm text-[#555] bg-[#161616] hover:bg-[#282828] border border-[#282828] px-4 py-3 rounded-xl text-left transition-colors w-full"
                >
                  {q}
                </button>
              ))}
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <p
                  className={`text-sm leading-relaxed px-4 py-3 rounded-2xl max-w-[80%] whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-[#282828] text-[#aaa] rounded-br-sm"
                      : "bg-[#161616] text-[#666] rounded-bl-sm border border-[#282828]"
                  }`}
                >
                  {m.content}
                </p>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <p className="text-sm px-4 py-3 rounded-2xl rounded-bl-sm bg-[#161616] text-[#333] animate-pulse border border-[#282828]">
                Thinking...
              </p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 p-4 border-t border-[#282828] bg-[#161616] shrink-0">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask a follow-up..."
            className="flex-1 min-w-0 text-sm border border-[#333] rounded-xl px-4 py-3 bg-[#1c1c1c] text-[#888] placeholder-[#333] focus:outline-none focus:border-[#3a3a3a] transition-colors"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="shrink-0 text-sm bg-[#282828] hover:bg-[#333] text-[#666] px-4 py-3 rounded-xl disabled:opacity-40 transition-colors font-medium border border-[#333]"
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
}