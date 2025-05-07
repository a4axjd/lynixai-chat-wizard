
import React, { useState } from "react";
import { useChatContext } from "@/context/ChatContext";
import Sidebar from "./Sidebar";
import ChatView from "./ChatView";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const ChatLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  
  return (
    <div className="flex h-screen">
      <div className={`${
        isMobile 
          ? `fixed top-0 left-0 z-40 h-full transition-transform duration-300 transform ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : 'relative'
      }`}>
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b flex items-center px-4">
          <div className="flex items-center">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mr-2"
              >
                <Menu size={20} />
              </Button>
            )}
            <h1 className="text-xl font-bold text-primary">LynixAI</h1>
          </div>
        </header>
        
        <main className="flex-1 overflow-hidden">
          <ChatView />
        </main>
      </div>
      
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default ChatLayout;
