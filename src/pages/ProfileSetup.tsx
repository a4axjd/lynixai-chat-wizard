
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

type ProfileData = {
  fullName: string;
  bio: string;
  interests: string;
  expertise: string;
  preferences: string;
  username: string;
};

interface Profile {
  id: string;
  full_name: string | null;
  bio: string | null;
  interests: string | null;
  expertise: string | null;
  preferences: string | null;
  updated_at: string | null;
  username: string | null;
}

const ProfileSetup = () => {
  const { user, loading, isNewUser, setIsNewUser } = useAuth();
  const [formData, setFormData] = useState<ProfileData>({
    fullName: "",
    bio: "",
    interests: "",
    expertise: "",
    preferences: "",
    username: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Generate a default username from email when component loads
  useEffect(() => {
    if (user?.email) {
      const defaultUsername = user.email.split('@')[0];
      setFormData(prev => ({
        ...prev,
        username: defaultUsername
      }));
      checkUsernameAvailability(defaultUsername);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !isNewUser && user) {
      // User already has a profile, redirect to home
      navigate("/");
    }
  }, [loading, isNewUser, user, navigate]);

  // Check if username is available
  const checkUsernameAvailability = async (username: string) => {
    if (!username.trim()) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (error) throw error;
      
      setUsernameAvailable(!data);
    } catch (error) {
      console.error("Error checking username:", error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Check username availability when username changes
    if (name === 'username') {
      checkUsernameAvailability(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!usernameAvailable) {
      toast({
        title: "Username not available",
        description: "Please choose a different username.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Fix the TypeScript error by creating an object that matches the expected type
      const profileData = {
        id: user.id, // Ensure id is always provided and not optional
        full_name: formData.fullName,
        bio: formData.bio,
        interests: formData.interests,
        expertise: formData.expertise,
        preferences: formData.preferences,
        username: formData.username,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData);

      if (error) {
        throw error;
      }

      toast({
        title: "Profile created",
        description: "Your profile has been set up successfully.",
      });
      
      setIsNewUser(false);
      navigate("/");
    } catch (error: any) {
      console.error("Profile setup error:", error);
      toast({
        title: "Error setting up profile",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl md:text-3xl text-center">Welcome to LynixAI!</CardTitle>
            <p className="text-center text-gray-600 text-sm md:text-base">Tell us a bit about yourself to personalize your experience</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  placeholder="Jane Doe"
                  className="h-10 md:h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  placeholder="janedoe"
                  className="h-10 md:h-11"
                />
                {!usernameAvailable && formData.username && (
                  <p className="text-sm text-destructive">This username is already taken</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us a bit about yourself"
                  rows={3}
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="interests">Interests</Label>
                <Textarea
                  id="interests"
                  name="interests"
                  value={formData.interests}
                  onChange={handleInputChange}
                  placeholder="What topics are you interested in? (e.g., AI, programming, design)"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expertise">Areas of Expertise</Label>
                <Textarea
                  id="expertise"
                  name="expertise"
                  value={formData.expertise}
                  onChange={handleInputChange}
                  placeholder="What are your areas of expertise or skills?"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="preferences">AI Assistant Preferences</Label>
                <Textarea
                  id="preferences"
                  name="preferences"
                  value={formData.preferences}
                  onChange={handleInputChange}
                  placeholder="How would you like the AI to assist you? Any specific preferences?"
                  rows={2}
                />
              </div>
              
              <CardFooter className="flex justify-end px-0 pt-4">
                <Button type="submit" disabled={isSubmitting || !usernameAvailable} className="w-full">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting Up...
                    </>
                  ) : (
                    "Complete Setup"
                  )}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSetup;
