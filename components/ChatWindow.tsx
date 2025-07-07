"use client";

import { useState, useRef, useEffect } from "react";
import { marked } from "marked";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
}

interface Props {
  messages?: Message[]; // ✅ Make messages optional
  onSendMessage: (text: string) => void; // Will be responsible for sending the message
  isLoading?: boolean;
}

export default function ChatWindow({ messages = [], onSendMessage, isLoading = false }: Props) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle sending a message (call backend API)
  const handleSend = async () => {
    if (input.trim()) {
      // Temporarily add the user message
      const userMessage = {
        id: `${Date.now()}-user`, // Unique ID based on timestamp
        text: input.trim(),
        sender: "user" as "user",
      };
      onSendMessage(userMessage.text);

      setInput("");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md">
      {/* Message area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-200px)]">
        {messages.length === 0 && (
          <p className="text-gray-600 dark:text-gray-400 text-center mt-8">
            No messages yet. Say hi!
          </p>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`prose dark:prose-invert max-w-[75%] rounded-lg px-4 py-3 text-sm break-words whitespace-pre-wrap ${
                msg.sender === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              }`}
              dangerouslySetInnerHTML={{
                __html: msg.sender === "bot" ? marked.parse(msg.text) : msg.text,
              }}
            />
          </div>
        ))}

        {/* Typing animation */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-md italic text-sm">
              Assistant is typing...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area - Always displayed */}
      <div className="p-4 border-t border-gray-300 dark:border-gray-700 flex gap-2">
        <input
          type="text"
          placeholder="Type your message..."
          className="flex-1 rounded border border-gray-400 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          onClick={handleSend}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded px-4 py-2 disabled:opacity-50"
          disabled={isLoading}
        >
          <span className="hidden sm:inline"></span>
          <PaperAirplaneIcon className="w-5 h-5 transform" />
        </button>
      </div>
    </div>
  );
}

