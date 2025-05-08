
import React, { useState } from "react";
import { useChatContext } from "@/context/ChatContext";
import Sidebar from "./Sidebar";
import ChatView from "./ChatView";
import { Menu, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext";

const ChatLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const { user, signOut, loading: authLoading } = useAuth();
  const { loading: chatsLoading } = useChatContext();
  
  const loading = authLoading || chatsLoading;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
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
        <header className="h-14 border-b flex items-center px-4 justify-between">
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
          
          <div className="flex items-center">
            <div className="mr-3 text-sm">
              {user?.email}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={signOut}
              className="flex items-center"
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </Button>
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
