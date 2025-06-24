"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import ChatSidebar from "../../components/ChatSidebar";
import ChatWindow from "../../components/ChatWindow";
import ThemeToggle from "../../components/ThemeToggle";

interface Chat {
  id: string;
  title: string;
  messages: Message[];
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
}

export default function ChatbotPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  function addChat(title: string) {
    const newChat: Chat = { id: uuidv4(), title, messages: [] };
    setChats((prev) => [...prev, newChat]);
    setActiveChatId(newChat.id);
  }

  function selectChat(id: string) {
    setActiveChatId(id);
  }

  function sendMessage(text: string) {
    if (!activeChatId) return;

    // Append user's message
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              messages: [
                ...chat.messages,
                { id: uuidv4(), text, sender: "user" },
                { id: uuidv4(), text: "This is a demo bot response.", sender: "bot" },
              ],
            }
          : chat
      )
    );
  }

  const activeChat = chats.find((c) => c.id === activeChatId);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={selectChat}
        onAddChat={addChat}
      />

      {/* Main chat window */}
      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-between p-4 border-b border-gray-300 dark:border-gray-700">
          <h1 className="text-xl font-bold">Chatbot</h1>
          <ThemeToggle />
        </header>

        {activeChat ? (
          <ChatWindow messages={activeChat.messages} onSendMessage={sendMessage} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-gray-600 dark:text-gray-400">
            <p>Select a chat or add a new chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
