
import React, { createContext, useContext, useState, useEffect } from "react";
import { Chat, Message, MessageRole } from "../types/chat";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ChatContextType {
  chats: Chat[];
  currentChat: Chat | null;
  setCurrentChat: (chat: Chat) => void;
  createNewChat: () => Promise<void>;
  addMessage: (content: string, role: MessageRole, isImage?: boolean) => Promise<void>;
  clearChats: () => Promise<void>;
  loading: boolean;
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
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Create default chat when no chats exist
  const ensureDefaultChat = async () => {
    // Only create a default chat if user is logged in and there are no chats
    if (user && chats.length === 0) {
      try {
        const newChat: Chat = {
          id: uuidv4(),
          title: "New Chat",
          messages: [],
          createdAt: Date.now(),
          username: profile?.username || null,
        };

        // Save chat to Supabase
        const { error } = await supabase.from("user_chats").insert({
          id: newChat.id,
          user_id: user.id,
          title: newChat.title,
          created_at: new Date(newChat.createdAt).toISOString(),
        });

        if (error) throw error;

        setChats([newChat]);
        setCurrentChatState(newChat);
        
      } catch (error) {
        console.error("Error creating default chat:", error);
        toast({
          title: "Error creating chat",
          description: "Could not create a default chat. Please try refreshing the page.",
          variant: "destructive",
        });
      }
    }
  };

  // Load chats from Supabase when user logs in
  useEffect(() => {
    const loadChats = async () => {
      if (!user) {
        setChats([]);
        setCurrentChatState(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data: userChats, error: chatsError } = await supabase
          .from("user_chats")
          .select("*")
          .eq("user_id", user.id) // Ensure we only fetch chats for the current user
          .order("created_at", { ascending: false });

        if (chatsError) throw chatsError;

        // If user has chats, fetch messages for all chats
        if (userChats && userChats.length > 0) {
          const chatsWithMessages: Chat[] = [];
          
          for (const chat of userChats) {
            const { data: messages, error: messagesError } = await supabase
              .from("chat_messages")
              .select("*")
              .eq("chat_id", chat.id)
              .order("timestamp", { ascending: true });

            if (messagesError) throw messagesError;

            chatsWithMessages.push({
              id: chat.id,
              title: chat.title,
              messages: messages.map(msg => ({
                id: msg.id,
                role: msg.role as MessageRole,
                content: msg.content,
                timestamp: new Date(msg.timestamp).getTime(),
                isImage: msg.is_image,
              })),
              createdAt: new Date(chat.created_at).getTime(),
              username: profile?.username || null,
            });
          }

          setChats(chatsWithMessages);
          setCurrentChatState(chatsWithMessages[0]);
        } else {
          // No chats exist, we'll create one
          await ensureDefaultChat();
        }
      } catch (error) {
        console.error("Error loading chats:", error);
        toast({
          title: "Error loading chats",
          description: "Could not load your chat history. Please try refreshing the page.",
          variant: "destructive",
        });
        // Attempt to create a default chat if load failed
        await ensureDefaultChat();
      } finally {
        setLoading(false);
      }
    };

    if (user && profile) {
      loadChats();
    }
  }, [user, profile]);

  const createNewChat = async () => {
    if (!user) return;

    try {
      const newChat: Chat = {
        id: uuidv4(),
        title: "New Chat",
        messages: [],
        createdAt: Date.now(),
        username: profile?.username || null,
      };

      // Save chat to Supabase
      const { error } = await supabase.from("user_chats").insert({
        id: newChat.id,
        user_id: user.id,
        title: newChat.title,
        created_at: new Date(newChat.createdAt).toISOString(),
      });

      if (error) throw error;

      setChats(prevChats => [newChat, ...prevChats]);
      setCurrentChatState(newChat);
    } catch (error) {
      console.error("Error creating chat:", error);
      toast({
        title: "Error creating chat",
        description: "Could not create a new chat. Please try again.",
        variant: "destructive",
      });
    }
  };

  const setCurrentChat = (chat: Chat) => {
    setCurrentChatState(chat);
  };

  const addMessage = async (content: string, role: MessageRole, isImage = false) => {
    if (!currentChat || !user) return;

    try {
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
        
        // Update chat title in Supabase
        const { error: titleError } = await supabase
          .from("user_chats")
          .update({ title: updatedTitle })
          .eq("id", currentChat.id);

        if (titleError) throw titleError;
      }

      // Save message to Supabase
      const { error: messageError } = await supabase.from("chat_messages").insert({
        id: newMessage.id,
        chat_id: currentChat.id,
        role: newMessage.role,
        content: newMessage.content,
        is_image: isImage,
        timestamp: new Date(newMessage.timestamp).toISOString(),
      });

      if (messageError) throw messageError;

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
    } catch (error) {
      console.error("Error adding message:", error);
      toast({
        title: "Error adding message",
        description: "Could not save your message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const clearChats = async () => {
    if (!user) return;

    try {
      // Delete all user chats from Supabase (cascade will delete messages too)
      const { error } = await supabase
        .from("user_chats")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setChats([]);
      await createNewChat();
      
      toast({
        title: "Chats cleared",
        description: "All your chats have been deleted.",
      });
    } catch (error) {
      console.error("Error clearing chats:", error);
      toast({
        title: "Error clearing chats",
        description: "Could not clear your chats. Please try again.",
        variant: "destructive",
      });
    }
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
        loading,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
