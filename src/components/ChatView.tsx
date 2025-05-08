
import React, { useRef, useEffect, useState } from "react";
import { useChatContext } from "@/context/ChatContext";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const ChatView: React.FC = () => {
  const { currentChat, addMessage, loading: chatsLoading } = useChatContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const handleSendMessage = async (message: string) => {
    // Reset any previous errors
    setError(null);
    
    // Add user message to chat
    await addMessage(message, "user");

    // Set loading state while processing
    setIsLoading(true);

    try {
      // Check if it's an image generation request
      const isImageRequest = /generate|create|draw|show|make.*image|picture|photo/i.test(message);
      
      if (isImageRequest) {
        toast({
          title: "Generating Image",
          description: "This may take up to 30 seconds. Please be patient.",
        });
      }

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
        console.error("Supabase function error:", error);
        throw new Error(error.message);
      }

      if (data?.isConfigured === false) {
        // Configuration is missing
        setError("Azure OpenAI is not properly configured. Please check your API keys and endpoint.");
        toast({
          title: "Configuration Error",
          description: "Azure OpenAI is not properly configured. Please check your API keys and endpoint.",
          variant: "destructive"
        });
        return;
      }

      if (data) {
        // Add the assistant's response to the chat
        await addMessage(data.content, "assistant", data.isImage);
      } else {
        throw new Error("No data returned from Azure OpenAI");
      }
    } catch (error: any) {
      console.error("Failed to process message:", error);
      setError("Failed to get a response. Please try again.");
      await addMessage("Sorry, I encountered an error processing your request. Please try again.", "assistant");
      toast({
        title: "Error",
        description: "Failed to get a response from AI service. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (chatsLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}
        
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
                "Generate an image of a cat wearing sunglasses",
                "Draw a picture of mountains at sunset",
                "Debug this code: function add(x, y) { retur x + y; }"
              ].map((suggestion) => (
                <Button 
                  key={suggestion}
                  variant="outline" 
                  className="justify-start h-auto py-3 px-4 text-left"
                  onClick={() => handleSendMessage(suggestion)}
                  disabled={isLoading}
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
