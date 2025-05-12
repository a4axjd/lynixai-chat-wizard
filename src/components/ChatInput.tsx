
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Image, ImageOff } from "lucide-react";
import { useChatContext } from "@/context/ChatContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatInputProps {
  onSubmit: (message: string, imageMode: boolean) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSubmit, isLoading }) => {
  const [message, setMessage] = useState("");
  const [imageMode, setImageMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile("md");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSubmit(message.trim(), imageMode);
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
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="image-mode"
                    checked={imageMode} 
                    onCheckedChange={setImageMode}
                  />
                  <Label htmlFor="image-mode" className="cursor-pointer flex items-center gap-1 text-sm text-gray-600">
                    {imageMode ? 
                      <><Image size={16} className="text-primary" /> Image mode</> : 
                      <><ImageOff size={16} /> Text mode</>
                    }
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent side={isMobile ? "top" : "bottom"}>
                {imageMode ? "AI will prioritize generating images" : "AI will prioritize generating text and code"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={imageMode ? "Describe the image you want..." : "Ask anything..."}
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
      </div>
    </form>
  );
};

export default ChatInput;
