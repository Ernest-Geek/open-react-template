"use client";

import { useState } from "react";

interface Chat {
  id: string;
  title: string;
}

interface Props {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onAddChat: (title: string) => void;
}

export default function ChatSidebar({ chats, activeChatId, onSelectChat, onAddChat }: Props) {
  const [newChatTitle, setNewChatTitle] = useState("");

  function handleAddChat() {
    if (newChatTitle.trim()) {
      onAddChat(newChatTitle.trim());
      setNewChatTitle("");
    }
  }

  return (
    <div className="w-64 bg-gray-100 dark:bg-gray-900 border-r border-gray-300 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-300 dark:border-gray-700 flex justify-between items-center">
        <h2 className="font-bold text-lg text-gray-900 dark:text-gray-100">Chats</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 && (
          <p className="p-4 text-gray-600 dark:text-gray-400">No chats yet. Add one!</p>
        )}
        <ul>
          {chats.map((chat) => (
            <li
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`cursor-pointer px-4 py-2 border-l-4 ${
                activeChatId === chat.id
                  ? "border-indigo-600 bg-indigo-100 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-200"
                  : "border-transparent hover:bg-gray-200 dark:hover:bg-gray-800"
              }`}
            >
              {chat.title}
            </li>
          ))}
        </ul>
      </div>
      <div className="p-4 border-t border-gray-300 dark:border-gray-700">
        <input
          type="text"
          placeholder="New chat title"
          className="w-full px-3 py-2 rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          value={newChatTitle}
          onChange={(e) => setNewChatTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddChat();
          }}
        />
        <button
          onClick={handleAddChat}
          className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded px-3 py-2"
        >
          Add Chat
        </button>
      </div>
    </div>
  );
}
