"use client";

import { useState, useRef, useEffect } from "react";

interface Chat {
  id: string;
  title: string;
}

interface Props {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onAddChat: (title: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onDeleteChat: (id: string) => void;
}

export default function ChatSidebar({
  chats,
  activeChatId,
  onSelectChat,
  onAddChat,
  onRenameChat,
  onDeleteChat,
}: Props) {
  const [newChatTitle, setNewChatTitle] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddChat = () => {
    // Create a new chat with the title "Untitled"
    onAddChat("Untitled");
  };

  const openRenameModal = (id: string, title: string) => {
    setRenameId(id);
    setRenameValue(title);
    setMenuOpenId(null);
  };

  const confirmRename = () => {
    if (renameValue.trim()) {
      onRenameChat(renameId!, renameValue.trim());
    }
    setRenameId(null);
    setRenameValue("");
  };

  const confirmDelete = () => {
    if (deleteId) {
      onDeleteChat(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="w-64 bg-gray-100 dark:bg-gray-900 border-r border-gray-300 dark:border-gray-700 flex flex-col">
      {/* New Chat Button */}
      <div className="p-4 border-b border-gray-300 dark:border-gray-700 flex justify-between items-center">
        <button
          onClick={handleAddChat}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded px-3 py-2"
        >
          New Chat
        </button>
      </div>

      {/* Chat List Section - Replaced with "New Chat" button */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 && (
          <p className="p-4 text-gray-600 dark:text-gray-400">No chats yet. Click "New Chat" to add one!</p>
        )}
        <ul>
          {chats.map((chat) => (
            <li
              key={chat.id}
              className={`relative group px-4 py-2 flex justify-between items-center border-l-4 ${
                activeChatId === chat.id
                  ? "border-indigo-600 bg-indigo-100 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-200"
                  : "border-transparent hover:bg-gray-200 dark:hover:bg-gray-800"
              }`}
              onClick={() => onSelectChat(chat.id)}
            >
              <span className="truncate">{chat.title}</span>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(chat.id === menuOpenId ? null : chat.id);
                  }}
                  className="p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-700"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM10 8.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM10 14a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
                  </svg>
                </button>

                {menuOpenId === chat.id && (
                  <div className="absolute right-0 z-10 mt-2 w-32 bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700 rounded">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openRenameModal(chat.id, chat.title);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Rename
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(chat.id);
                        setMenuOpenId(null);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Rename Modal */}
      {renameId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-md w-80">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Rename Chat</h3>
            <input
              type="text"
              autoFocus
              className="w-full px-3 py-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmRename();
                if (e.key === "Escape") setRenameId(null);
              }}
            />
            <div className="flex justify-end mt-4 gap-2">
              <button onClick={() => setRenameId(null)} className="text-sm text-gray-500 hover:underline">
                Cancel
              </button>
              <button
                onClick={confirmRename}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-1.5 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-md w-80">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Chat</h3>
            <p className="text-sm mt-2 text-gray-600 dark:text-gray-300">
              Are you sure you want to delete this chat?
            </p>
            <div className="flex justify-end mt-4 gap-2">
              <button onClick={() => setDeleteId(null)} className="text-sm text-gray-500 hover:underline">
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-1.5 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
