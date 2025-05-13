
import React, { useState, FormEvent, KeyboardEvent, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CornerDownLeft, Image, ImageOff, SendIcon, CodeIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSubmit: (message: string, imageMode: boolean, fullCodeMode: boolean) => Promise<void>;
  isLoading?: boolean;
  onFullCodeToggle: (enabled: boolean) => void; // New prop for handling full code toggle
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSubmit,
  isLoading = false,
  onFullCodeToggle,
}) => {
  const [message, setMessage] = useState("");
  const [imageMode, setImageMode] = useState(false);
  const [fullCodeMode, setFullCodeMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [message]);

  // Handle full code mode toggle
  const handleFullCodeToggle = (checked: boolean) => {
    setFullCodeMode(checked);
    onFullCodeToggle(checked); // Immediately notify parent component
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSubmit(message, imageMode, fullCodeMode);
      setMessage("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "inherit";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="p-4 bg-background border-t border-border">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="image-mode"
              checked={imageMode}
              onCheckedChange={setImageMode}
            />
            <Label htmlFor="image-mode" className="flex items-center">
              {imageMode ? (
                <Image className="h-4 w-4 mr-1 text-primary" />
              ) : (
                <ImageOff className="h-4 w-4 mr-1 text-muted-foreground" />
              )}
              Image Mode
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="full-code-mode"
              checked={fullCodeMode}
              onCheckedChange={handleFullCodeToggle}
            />
            <Label htmlFor="full-code-mode" className="flex items-center">
              <CodeIcon className={cn("h-4 w-4 mr-1", fullCodeMode ? "text-primary" : "text-muted-foreground")} />
              Full Code Mode
            </Label>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              imageMode
                ? "Describe the image you want to generate..."
                : fullCodeMode
                ? "Describe the application you want to build..."
                : "Ask me anything..."
            }
            className="min-h-[60px] flex-1 resize-none p-3"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !message.trim()}
            className="h-[60px] w-[60px]"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SendIcon className="h-4 w-4" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
