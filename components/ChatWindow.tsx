"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
}

interface Props {
  messages: Message[];
  onSendMessage: (text: string) => void;
}

export default function ChatWindow({ messages, onSendMessage }: Props) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  function handleSend() {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput("");
    }
  }

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-600 dark:text-gray-400 text-center mt-8">
            No messages yet. Say hi!
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[70%] rounded-md p-2 ${
              msg.sender === "user"
                ? "bg-indigo-600 text-white self-end"
                : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 self-start"
            }`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
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
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded px-4 py-2"
        >
          Send
        </button>
      </div>
    </div>
  );
}
