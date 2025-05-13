
import React, { useEffect } from "react";
import ChatLayout from "@/components/ChatLayout";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useParams } from "react-router-dom";
import { useChatContext } from "@/context/ChatContext";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { chatId } = useParams();
  const { chats, setCurrentChat, loading: chatsLoading, createNewChat } = useChatContext();
  
  useEffect(() => {
    // Only proceed if user is logged in and chats are loaded
    if (user && !chatsLoading && chats) {
      if (chatId) {
        // Find the requested chat by ID
        const requestedChat = chats.find(chat => chat.id === chatId);
        if (requestedChat) {
          setCurrentChat(requestedChat);
        } else {
          // If chat doesn't exist or not found, create a new chat
          createNewChat();
        }
      } else if (chats.length === 0) {
        // If no chat ID in URL and no chats exist, create a new chat
        createNewChat();
      } else if (chats.length > 0) {
        // If no chat ID in URL but chats exist, set the first chat as current
        setCurrentChat(chats[0]);
      }
    }
  }, [user, chatsLoading, chats, chatId]);

  // If user is not authenticated and auth is not still loading, redirect to auth page
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  return <ChatLayout />;
};

export default Index;
