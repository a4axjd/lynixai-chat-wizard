
import React, { useState } from "react";
import { Message } from "../types/chat";
import { cn } from "@/lib/utils";
import { Image, Loader2, AlertCircle, Download, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "@/hooks/use-toast";

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === "user";
  const [isImageLoading, setIsImageLoading] = useState(message.isImage || false);
  const isError = message.content.includes("Sorry, I encountered an error");
  const [copied, setCopied] = useState<{[key: string]: boolean}>({});
  
  // Format date for display
  const formattedDate = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Handle image download
  const handleDownload = () => {
    if (!message.isImage) return;
    
    try {
      // Convert data URL to blob
      const fetchImage = async () => {
        try {
          const response = await fetch(message.content);
          const blob = await response.blob();
          
          // Create a download link and trigger it
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `ai-generated-image-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          toast({
            title: "Download started",
            description: "Your image is being downloaded",
          });
        } catch (error) {
          console.error("Download failed:", error);
          toast({
            title: "Download failed",
            description: "Could not download the image. Please try again.",
            variant: "destructive",
          });
        }
      };
      
      fetchImage();
    } catch (error) {
      console.error("Error downloading image:", error);
      toast({
        title: "Download failed",
        description: "Could not download the image. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle code copy
  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied({ ...copied, [id]: true });
      setTimeout(() => {
        setCopied({ ...copied, [id]: false });
      }, 2000);
    });
  };

  return (
    <div
      className={cn(
        "py-4 px-6 md:px-8 animate-fade-in",
        isUser ? "bg-white" : "bg-gray-50"
      )}
    >
      <div className="max-w-3xl mx-auto flex gap-4">
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm",
            isUser ? "bg-primary-dark" : "bg-primary"
          )}
        >
          {isUser ? "U" : "AI"}
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="font-medium">
              {isUser ? "You" : "LynixAI"}
            </span>
            <span className="text-xs text-gray-500">{formattedDate}</span>
          </div>
          
          {message.isImage ? (
            <div className="mt-2">
              <div className="flex justify-between items-center mb-2">
                <div className="inline-flex items-center gap-1 text-sm text-primary-dark font-medium">
                  <Image size={16} />
                  <span>Generated Image</span>
                </div>
                <button 
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary-dark"
                  title="Download image"
                >
                  <Download size={16} />
                  <span>Download</span>
                </button>
              </div>
              <div className="mt-1 rounded-lg overflow-hidden border border-gray-200 relative">
                {isImageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                <img 
                  src={message.content} 
                  alt="AI generated" 
                  className="w-full max-h-96 object-contain"
                  onLoad={() => setIsImageLoading(false)}
                  onError={() => setIsImageLoading(false)}
                />
              </div>
            </div>
          ) : isError ? (
            <div className="flex items-start gap-2 text-destructive">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p>{message.content}</p>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                components={{
                  code({node, className, children, ...props}) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeContent = String(children).replace(/\n$/, '');
                    const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;
                    
                    return !match ? (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    ) : (
                      <div className="relative">
                        <div className="absolute right-2 top-2">
                          <button 
                            onClick={() => copyToClipboard(codeContent, codeId)}
                            className="p-1.5 rounded-md text-white bg-gray-700 hover:bg-gray-600 transition-colors"
                            title="Copy code"
                          >
                            {copied[codeId] ? (
                              <Check size={14} />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                        <SyntaxHighlighter
                          style={atomDark}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-md"
                          {...props}
                        >
                          {codeContent}
                        </SyntaxHighlighter>
                      </div>
                    );
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
