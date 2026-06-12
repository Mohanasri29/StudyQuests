import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Bot, X, Sparkles, AlertCircle } from "lucide-react";
import { ChatMessage } from "../types";

export default function ProdoChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Hello! I am **Prodo**, your AI Study Companion on the Online Study Challenges portal. 🎯 How can I help you understand study challenges, visual proctoring, or optimize your Pomodoro slots today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [apiError, setApiError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    setApiError("");
    const userText = inputVal.trim();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Add user message
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: userText,
      timestamp
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setIsTyping(true);

    try {
      // 2. Contact Express Gemini Chatbot Proxy
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userText, history: [] }),
      });

      if (!response.ok) {
        throw new Error("Unable to reach Gemini assistant. Check API token.");
      }

      const data = await response.json();
      
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: data.text || "I was unable to formulate a response. Let me know if you want to try another topic!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);

    } catch (err: any) {
      console.warn("Gemini Chat Failure: ", err);
      // Give a friendly fallback message directly rather than showing ugly stack
      const fallbackMsg: ChatMessage = {
        id: `bot-fallback-${Date.now()}`,
        sender: "bot",
        text: "It seems our backend Gemini helper is in offline demo mode. Don't worry! This application lets you: \n\n* **Challenge friends** or connect with random online students.\n* **Use live study timers** to record your focused slots.\n* **Activate the AI visual proctor** to track your screen focus.\n* **Climb the Global Leaderboard** to secure XP rewards and weekly ranks.\n\nType another study advice request or start a match directly to begin!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Expanded chat window */}
      {isOpen && (
        <div 
          className="w-80 md:w-96 h-[480px] bg-slate-850 border border-slate-800 rounded-2xl shadow-2xl flex flex-col mb-4 overflow-hidden relative"
          id="prodo-chatbot-window"
        >
          {/* Header */}
          <div className="bg-indigo-600 px-4 py-3.5 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <Bot className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <span className="text-xs font-bold block leading-none">Prodo</span>
                <span className="text-[10px] text-indigo-200 block mt-0.5 font-mono">AI Study Proctor</span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Messages screen */}
          <div className="flex-1 bg-slate-900/40 p-4 overflow-y-auto space-y-4">
            {messages.map((m) => {
              const isBot = m.sender === "bot";
              return (
                <div key={m.id} className={`flex gap-2.5 ${isBot ? "" : "flex-row-reverse"}`}>
                  {isBot && (
                    <div className="w-7 h-7 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/25 shrink-0 self-start mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                  )}

                  <div className={`max-w-[75%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    isBot 
                      ? "bg-slate-800 text-slate-200" 
                      : "bg-indigo-600 text-white rounded-tr-none"
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>
                    <span className="text-[9px] text-slate-500 block text-right mt-1 font-mono">
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex gap-2.5 items-center">
                <div className="w-7 h-7 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/25 shrink-0">
                  <Bot className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                </div>
                <div className="bg-slate-800 text-slate-450 rounded-xl px-4 py-2 text-xs font-medium">
                  Prodo is writing study tips...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Form write */}
          <form onSubmit={handleSend} className="p-3 bg-slate-850/80 border-t border-slate-800/80 flex gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask Prodo about Pomodoro or app tips..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl active:scale-95 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        id="proodo-chatbot-launcher"
        className="w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer border border-indigo-500/20"
        title="Chat with Study Guide Advisor"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    </div>
  );
}
