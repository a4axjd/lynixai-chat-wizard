import React, { useState, useEffect } from "react";
import { useChatContext } from "@/context/ChatContext";
import Sidebar from "./Sidebar";
import ChatView from "./ChatView";
import { Menu, LogOut, Loader2, User } from "lucide-react";
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

interface UserProfile {
  id: string;
  full_name: string | null;
  bio: string | null;
  interests: string | null;
  expertise: string | null;
  preferences: string | null;
  updated_at: string | null;
}

const ChatLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const isMobile = useIsMobile();
  const { user, signOut, loading: authLoading } = useAuth();
  const { loading: chatsLoading } = useChatContext();
  
  const loading = authLoading || chatsLoading;

  useEffect(() => {
    if (user?.id) {
      fetchUserProfile(user.id);
    }
  }, [user]);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Use the type assertion to treat the result as UserProfile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setUserProfile(data as UserProfile);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <User size={16} />
                  {userProfile?.full_name || user?.email?.split('@')[0] || 'Profile'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userProfile && (
                  <>
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium mb-1">{userProfile.full_name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={signOut}>
                  <LogOut size={16} className="mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
