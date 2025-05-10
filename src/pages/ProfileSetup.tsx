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
};

interface Profile {
  id: string;
  full_name: string | null;
  bio: string | null;
  interests: string | null;
  expertise: string | null;
  preferences: string | null;
  updated_at: string | null;
}

const ProfileSetup = () => {
  const { user, loading, isNewUser, setIsNewUser } = useAuth();
  const [formData, setFormData] = useState<ProfileData>({
    fullName: "",
    bio: "",
    interests: "",
    expertise: "",
    preferences: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isNewUser && user) {
      // User already has a profile, redirect to home
      navigate("/");
    }
  }, [loading, isNewUser, user, navigate]);

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Insert the profile data into the database with explicit typing
      const profileData: Partial<Profile> = {
        id: user.id,
        full_name: formData.fullName,
        bio: formData.bio,
        interests: formData.interests,
        expertise: formData.expertise,
        preferences: formData.preferences,
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
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Welcome to LynixAI!</CardTitle>
            <p className="text-center text-gray-600">Tell us a bit about yourself to personalize your experience</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  placeholder="Jane Doe"
                />
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
                <Button type="submit" disabled={isSubmitting} className="w-full">
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
