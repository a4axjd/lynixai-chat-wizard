
import React, { useRef, useEffect, useState } from "react";
import { useChatContext } from "@/context/ChatContext";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ChatView: React.FC = () => {
  const { currentChat, addMessage } = useChatContext();
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const handleSendMessage = async (message: string) => {
    // Add user message to chat
    addMessage(message, "user");

    // Set loading state while processing
    setIsLoading(true);

    try {
      // Get all previous messages for context (limit to last 10)
      const previousMessages = currentChat?.messages
        .slice(-10)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // Add the new user message
      previousMessages.push({
        role: "user",
        content: message
      });

      // Call the Azure OpenAI edge function
      const { data, error } = await supabase.functions.invoke("azure-chat", {
        body: {
          messages: previousMessages
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data) {
        // Add the assistant's response to the chat
        addMessage(data.content, "assistant", data.isImage);
      }
    } catch (error) {
      console.error("Failed to process message:", error);
      addMessage("Sorry, I encountered an error processing your request. Please try again.", "assistant");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {currentChat?.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <h3 className="text-2xl font-bold text-primary mb-2">Welcome to LynixAI</h3>
            <p className="text-gray-600 text-center max-w-md mb-6">
              Your free and lightweight ChatGPT alternative. Ask me anything, request code, or generate images!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl w-full">
              {[
                "Explain quantum computing in simple terms",
                "Write a function to check if a number is prime",
                "Create an image of a futuristic city",
                "Debug this code: function add(x, y) { retur x + y; }"
              ].map((suggestion) => (
                <Button 
                  key={suggestion}
                  variant="outline" 
                  className="justify-start h-auto py-3 px-4 text-left"
                  onClick={() => handleSendMessage(suggestion)}
                >
                  <span className="truncate">{suggestion}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {currentChat?.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="py-8 flex justify-center">
                <Loader2 className="animate-spin text-primary" />
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <ChatInput onSubmit={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default ChatView;
