import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  full_name: string | null;
  bio: string | null;
  interests: string | null;
  expertise: string | null;
  preferences: string | null;
  updated_at: string | null;
}

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isNewUser: boolean;
  setIsNewUser: React.Dispatch<React.SetStateAction<boolean>>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth event:", event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (event === 'SIGNED_IN') {
          // Check if this is a new user
          checkForUserProfile(currentSession?.user?.id);
          navigate('/');
        } else if (event === 'SIGNED_OUT') {
          navigate('/auth');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        checkForUserProfile(currentSession.user.id);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Check if the user already has a profile
  const checkForUserProfile = async (userId: string | undefined) => {
    if (!userId) return;

    try {
      // Use a more explicit typing to ensure TypeScript understands the structure
      const { data, error } = await supabase
        .from('profiles')
        .select()
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      // If no profile exists, this is a new user
      setIsNewUser(!data);
      
      if (!data) {
        console.log("New user detected - redirecting to profile setup");
        navigate('/profile-setup');
      }
    } catch (error) {
      console.error("Error checking user profile:", error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({
          title: "Sign in error",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
    } catch (error: any) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        toast({
          title: "Sign up error",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      toast({
        title: "Account created",
        description: "Check your email for a confirmation link.",
      });
    } catch (error: any) {
      console.error("Sign up error:", error);
      throw error;
    }
  };
  
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      
      if (error) {
        toast({
          title: "Google sign in error",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    } catch (error: any) {
      console.error("Google sign in error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Sign out error",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error: any) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        isNewUser,
        setIsNewUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
