"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import ChatSidebar from "@/components/ChatSidebar";
import ChatWindow from "@/components/ChatWindow";
import { UserCircleIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid";
import { Menu } from "@headlessui/react";
import { useRouter } from "next/navigation";

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
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [loadingChatId, setLoadingChatId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 💡 New: sidebar toggle for mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedChats = localStorage.getItem("chats");
    if (savedChats) setChats(JSON.parse(savedChats));

    const savedActiveChatId = localStorage.getItem("activeChatId");
    if (savedActiveChatId) setActiveChatId(savedActiveChatId);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("chats", JSON.stringify(chats));
  }, [chats, mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (activeChatId) localStorage.setItem("activeChatId", activeChatId);
    else localStorage.removeItem("activeChatId");
  }, [activeChatId, mounted]);

  function handleAddChat(title: string) {
    const newChat: Chat = { id: uuidv4(), title, messages: [] };
    setChats((prev) => [...prev, newChat]);
    setActiveChatId(newChat.id);
    setError(null);
    setIsSidebarOpen(false); // close sidebar on mobile after adding
  }

  function handleSelectChat(id: string) {
    setActiveChatId(id);
    setError(null);
    setIsSidebarOpen(false); // close sidebar on mobile after selecting
  }

  function handleRenameChat(id: string, newTitle: string) {
    setChats((prev) =>
      prev.map((chat) => (chat.id === id ? { ...chat, title: newTitle } : chat))
    );
  }

  function handleDeleteChat(id: string) {
    setChats((prev) => prev.filter((chat) => chat.id !== id));
    if (activeChatId === id) setActiveChatId(null);
  }

  async function sendMessage(text: string) {
    if (!activeChatId) return;
  
    setError(null);
    setLoadingChatId(activeChatId);
  
    // Log the outgoing request to make sure we're sending the right message
    console.log("Sending message to backend:", { message: text });
  
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? { ...chat, messages: [...chat.messages, { id: uuidv4(), text, sender: "user" }] }
          : chat
      )
    );
  
    try {
      const response = await fetch("http://127.0.0.1:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text }),
        credentials: "include",
      });
  
      // Log the response status and body to see what's returned
      console.log("Response from backend:", response);
      
      // Handle non-200 responses
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error from backend:", errorData);
        throw new Error(errorData.error || "Failed to get response from backend");
      }
  
      const data = await response.json();
  
      // Log the parsed data to ensure the response is correct
      console.log("Bot response data:", data);
  
      // Update the chat with the bot's response
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  { id: uuidv4(), text: data.response, sender: "bot" },
                ],
              }
            : chat
        )
      );
    } catch (err: any) {
      // Log any errors that happen
      console.error("Error during fetch:", err);
      setError(err.message || "Unknown error");
    } finally {
      setLoadingChatId(null);
    }
  }
  

  const activeChat = chats.find((chat) => chat.id === activeChatId);

  if (!mounted) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-600 dark:text-gray-400">
        <p>Loading chats...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col md:flex-row bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* 💡 Sidebar drawer for mobile */}
      <div
        className={`fixed inset-0 z-40 flex md:hidden transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="w-64 bg-white dark:bg-gray-900 shadow-lg h-full">
          <ChatSidebar
            chats={chats}
            activeChatId={activeChatId}
            onSelectChat={handleSelectChat}
            onAddChat={handleAddChat}
            onRenameChat={handleRenameChat}
            onDeleteChat={handleDeleteChat}
          />
        </div>
        {/* Overlay */}
        <div
          className="flex-1 bg-black bg-opacity-50"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      </div>

      {/* 💡 Sidebar for desktop */}
      <div className="hidden md:flex md:w-64">
        <ChatSidebar
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onAddChat={handleAddChat}
          onRenameChat={handleRenameChat}
          onDeleteChat={handleDeleteChat}
        />
      </div>

      {/* 💡 Main content */}
      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-between p-4 border-b border-gray-300 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle for mobile */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold">Auto Centrale</h1>
          </div>

          <Menu as="div" className="relative">
            <Menu.Button className="focus:outline-none">
              <UserCircleIcon className="h-8 w-8 text-gray-700 dark:text-gray-300" />
            </Menu.Button>

            <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch("http://127.0.0.1:5000/auth/logout", {
                            method: "POST",
                            credentials: "include",
                          });

                          if (res.ok) {
                            localStorage.clear();
                            router.push("/signin");
                          } else {
                            console.error("Logout failed");
                          }
                        } catch (err) {
                          console.error("Error during logout:", err);
                        }
                      }}
                      className={`${
                        active ? "bg-gray-100 dark:bg-gray-700" : ""
                      } block w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200`}
                    >
                      Logout
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Menu>
        </header>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 m-4 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {activeChat ? (
          <ChatWindow
            messages={activeChat.messages}
            onSendMessage={sendMessage}
            isLoading={loadingChatId === activeChatId}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-gray-600 dark:text-gray-400">
            <p>Select a chat or add a new chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
