
import React from "react";
import { Message } from "../types/chat";
import { cn } from "@/lib/utils";
import { Image } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === "user";
  
  // Format date for display
  const formattedDate = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

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
              <div className="inline-flex items-center gap-1 mb-2 text-sm text-primary-dark font-medium">
                <Image size={16} />
                <span>Generated Image</span>
              </div>
              <div className="mt-1 rounded-lg overflow-hidden border border-gray-200">
                <img 
                  src={message.content} 
                  alt="AI generated" 
                  className="w-full max-h-96 object-contain"
                />
              </div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                components={{
                  code({node, inline, className, children, ...props}) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={atomDark}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-md"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
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
