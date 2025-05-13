
import React, { useState, useEffect } from "react";
import { useChatContext } from "@/context/ChatContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusIcon, Trash2, MessageCircle, ChevronLeft, ChevronRight, Loader2, X, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  onCloseSidebar?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onCloseSidebar }) => {
  const { chats, currentChat, createNewChat, setCurrentChat, clearChats, loading } = useChatContext();
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const { profile } = useAuth();
  
  // Automatically collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setCollapsed(false); // Keep expanded on mobile for better UX
    }
  }, [isMobile]);
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  const handleChatSelect = (chat: any) => {
    setCurrentChat(chat);
    if (isMobile && onCloseSidebar) {
      onCloseSidebar();
    }
  };

  return (
    <div className={cn(
      "flex flex-col transition-all duration-300 ease-in-out bg-gray-50 border-r border-gray-200 h-full",
      collapsed ? "w-16" : isMobile ? "w-[85vw]" : "w-64"
    )}>
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2 pr-2">
            <User size={16} className="text-primary" />
            <span className="text-sm font-medium truncate">
              {profile?.username || 'User'}
            </span>
          </div>
        )}
        
        <Button
          onClick={() => createNewChat()}
          className={cn(
            "bg-primary hover:bg-primary-dark text-white",
            collapsed ? "w-full px-2" : "flex-1"
          )}
          disabled={loading}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <PlusIcon size={16} />
              {!collapsed && <span className="ml-2">New Chat</span>}
            </>
          )}
        </Button>
        
        {isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-2" 
            onClick={onCloseSidebar}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 scrollbar-thin">
        <div className="p-2">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-sm px-2">
              {!collapsed && "No chats yet. Start a new conversation!"}
            </div>
          ) : (
            chats.map((chat) => (
              <Button
                key={chat.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start mb-1 text-left transition-colors",
                  chat.id === currentChat?.id ? "bg-gray-200 hover:bg-gray-200" : "hover:bg-gray-100",
                  collapsed ? "px-2" : "px-3"
                )}
                onClick={() => handleChatSelect(chat)}
              >
                <MessageCircle size={collapsed ? 20 : 16} />
                {!collapsed && (
                  <div className="ml-2 truncate flex-1">
                    <div className="truncate text-sm font-medium">{chat.title}</div>
                    <div className="text-xs text-gray-500">{formatDate(chat.createdAt)}</div>
                  </div>
                )}
              </Button>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-gray-200">
        {!collapsed && chats.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mb-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              if (confirm("Are you sure you want to clear all chats?")) {
                clearChats();
                toast({
                  title: "Chats cleared",
                  description: "All your chats have been removed.",
                });
              }
            }}
            disabled={loading}
          >
            <Trash2 size={16} className="mr-2" />
            Clear All Chats
          </Button>
        )}
        
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "w-full justify-center",
              collapsed ? "mx-auto" : "hidden sm:flex"
            )}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
