
import React, { createContext, useContext, useState, useEffect } from "react";
import { Chat, Message, MessageRole } from "../types/chat";
import { v4 as uuidv4 } from "uuid";

interface ChatContextType {
  chats: Chat[];
  currentChat: Chat | null;
  setCurrentChat: (chat: Chat) => void;
  createNewChat: () => void;
  addMessage: (content: string, role: MessageRole, isImage?: boolean) => void;
  clearChats: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};

interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChatState] = useState<Chat | null>(null);

  // Load chats from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem("lynixai-chats");
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats) as Chat[];
      setChats(parsedChats);
      
      // Set the most recent chat as current
      if (parsedChats.length > 0) {
        setCurrentChatState(parsedChats[0]);
      } else {
        createNewChat();
      }
    } else {
      createNewChat();
    }
  }, []);

  // Save chats to localStorage whenever they change
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem("lynixai-chats", JSON.stringify(chats));
    }
  }, [chats]);

  const createNewChat = () => {
    const newChat: Chat = {
      id: uuidv4(),
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
    };

    setChats((prevChats) => [newChat, ...prevChats]);
    setCurrentChatState(newChat);
  };

  const setCurrentChat = (chat: Chat) => {
    setCurrentChatState(chat);
  };

  const addMessage = (content: string, role: MessageRole, isImage = false) => {
    if (!currentChat) return;

    const newMessage: Message = {
      id: uuidv4(),
      role,
      content,
      timestamp: Date.now(),
      isImage,
    };

    // Update title based on first user message if it's a new chat
    let updatedTitle = currentChat.title;
    if (
      role === "user" &&
      !currentChat.messages.some((m) => m.role === "user") &&
      content.length > 0
    ) {
      updatedTitle = content.slice(0, 30) + (content.length > 30 ? "..." : "");
    }

    const updatedChat: Chat = {
      ...currentChat,
      title: updatedTitle,
      messages: [...currentChat.messages, newMessage],
    };

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === currentChat.id ? updatedChat : chat
      )
    );
    
    setCurrentChatState(updatedChat);
  };

  const clearChats = () => {
    setChats([]);
    localStorage.removeItem("lynixai-chats");
    createNewChat();
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        currentChat,
        setCurrentChat,
        createNewChat,
        addMessage,
        clearChats,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
