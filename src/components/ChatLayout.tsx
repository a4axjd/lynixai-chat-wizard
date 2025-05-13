import React, { useState, useEffect } from "react";
import { useChatContext } from "@/context/ChatContext";
import Sidebar from "./Sidebar";
import ChatView from "./ChatView";
import { Menu, LogOut, Loader2, User, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  full_name: string | null;
  bio: string | null;
  interests: string | null;
  expertise: string | null;
  preferences: string | null;
  updated_at: string | null;
  username: string | null;
}

const ChatLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState(false);
  const isMobile = useIsMobile();
  const { user, signOut, loading: authLoading } = useAuth();
  const { loading: chatsLoading, currentChat } = useChatContext();
  
  const loading = authLoading || chatsLoading;

  useEffect(() => {
    if (user?.id) {
      fetchUserProfile(user.id);
    }
  }, [user]);

  const fetchUserProfile = async (userId: string) => {
    try {
      setProfileError(false);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        setProfileError(true);
        return;
      }

      if (data) {
        setUserProfile(data as UserProfile);
      } else {
        setProfileError(true);
        console.log("No profile found for user:", userId);
      }
    } catch (error) {
      setProfileError(true);
      console.error("Error fetching user profile:", error);
    }
  };
  
  const handleDownloadChat = () => {
    if (!currentChat) {
      toast({
        title: "No chat selected",
        description: "Please select a chat to download.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const chatTitle = currentChat.title || 'chat';
      const fileName = `${chatTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`;
      const chatData = JSON.stringify(currentChat, null, 2);
      
      const blob = new Blob([chatData], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = href;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
      
      toast({
        title: "Chat downloaded",
        description: `Successfully saved as ${fileName}`,
      });
    } catch (error) {
      console.error("Error downloading chat:", error);
      toast({
        title: "Download failed",
        description: "There was an error downloading your chat.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const displayName = userProfile?.full_name || 
                      userProfile?.username ||
                      user?.email?.split('@')[0] || 
                      (profileError ? 'User' : '');
  
  return (
    <div className="flex h-screen overflow-hidden">
      <div className={`${
        isMobile 
          ? `fixed top-0 left-0 z-40 h-full transition-transform duration-300 transform ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : 'relative'
      }`}>
        <Sidebar onCloseSidebar={() => setSidebarOpen(false)} />
      </div>
      
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b flex items-center px-4 justify-between sticky top-0 bg-background z-30">
          <div className="flex items-center">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mr-2"
                aria-label="Toggle sidebar"
              >
                <Menu size={20} />
              </Button>
            )}
            <h1 className="text-xl font-bold text-primary">LynixAI</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {currentChat && (
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleDownloadChat}
                className="hidden sm:flex"
                aria-label="Download chat"
              >
                <Download size={16} />
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <User size={16} />
                  <span className="hidden sm:inline">
                    {displayName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium mb-1">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email || 'Not logged in'}</p>
                </div>
                <DropdownMenuSeparator />
                {currentChat && (
                  <DropdownMenuItem onClick={handleDownloadChat} className="sm:hidden">
                    <Download size={16} className="mr-2" />
                    Download Chat
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={signOut}>
                  <LogOut size={16} className="mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        <main className="flex-1 overflow-hidden relative">
          <ChatView />
        </main>
      </div>
      
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default ChatLayout;
