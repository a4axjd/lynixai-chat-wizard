
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useChatContext } from "@/context/ChatContext";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSubmit, isLoading }) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSubmit(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto resize textarea as content grows
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "56px"; // Reset height
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [message]);

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white border-t">
      <div className="max-w-3xl mx-auto relative">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          className="min-h-[56px] max-h-[200px] py-3 pr-12 resize-none"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="sm"
          className={`absolute right-2 bottom-2 rounded-full p-2 h-auto ${
            !message.trim() || isLoading
              ? "text-gray-400"
              : "text-primary-dark hover:bg-primary-light/10"
          }`}
          variant="ghost"
          disabled={!message.trim() || isLoading}
        >
          <Send size={20} />
        </Button>
      </div>
    </form>
  );
};

export default ChatInput;
