
import React, { useState } from "react";
import { useChatContext } from "@/context/ChatContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusIcon, Trash2, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const Sidebar: React.FC = () => {
  const { chats, currentChat, createNewChat, setCurrentChat, clearChats } = useChatContext();
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();
  
  // Automatically collapse sidebar on mobile
  React.useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile]);
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className={cn(
      "flex flex-col transition-all duration-300 ease-in-out bg-gray-50 border-r border-gray-200",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="p-3 border-b border-gray-200">
        <Button
          onClick={createNewChat}
          className={cn(
            "w-full bg-primary hover:bg-primary-dark text-white",
            collapsed && "px-2"
          )}
        >
          <PlusIcon size={16} />
          {!collapsed && <span className="ml-2">New Chat</span>}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {chats.map((chat) => (
            <Button
              key={chat.id}
              variant="ghost"
              className={cn(
                "w-full justify-start mb-1 text-left",
                chat.id === currentChat?.id && "bg-gray-200",
                collapsed ? "px-2" : "px-3"
              )}
              onClick={() => setCurrentChat(chat)}
            >
              <MessageCircle size={collapsed ? 20 : 16} />
              {!collapsed && (
                <div className="ml-2 truncate flex-1">
                  <div className="truncate text-sm">{chat.title}</div>
                  <div className="text-xs text-gray-500">{formatDate(chat.createdAt)}</div>
                </div>
              )}
            </Button>
          ))}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-gray-200">
        {!collapsed && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mb-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              if (confirm("Are you sure you want to clear all chats?")) {
                clearChats();
              }
            }}
          >
            <Trash2 size={16} className="mr-2" />
            Clear All Chats
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "w-full justify-center",
            collapsed ? "mx-auto" : "hidden sm:flex"
          )}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
