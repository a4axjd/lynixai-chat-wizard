
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeftIcon, CodeIcon, Wand2 } from "lucide-react";

interface FullCodeWizardProps {
  onSubmit: (data: {
    projectType: string;
    techStack: string;
    designPrefs: string;
    features: string;
  }) => void;
  onCancel: () => void;
}

const FullCodeWizard: React.FC<FullCodeWizardProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    projectType: "",
    techStack: "",
    designPrefs: "",
    features: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center space-x-2">
          <CodeIcon className="h-5 w-5 text-primary" />
          <CardTitle className="text-2xl">Full Code Project Wizard</CardTitle>
        </div>
        <CardDescription>
          Fill in the details below to generate a complete project structure with production-ready code
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectType">Project Type</Label>
            <Input
              id="projectType"
              name="projectType"
              placeholder="E.g., Website, Web App, E-commerce Platform"
              value={formData.projectType}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="techStack">Preferred Tech Stack</Label>
            <Input
              id="techStack"
              name="techStack"
              placeholder="E.g., React + Tailwind, Next.js + Supabase, MERN Stack"
              value={formData.techStack}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="designPrefs">Theme or Design Preferences</Label>
            <Input
              id="designPrefs"
              name="designPrefs"
              placeholder="E.g., Minimal, Dark Mode, Material Design"
              value={formData.designPrefs}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="features">Core Features Needed</Label>
            <Textarea
              id="features"
              name="features"
              placeholder="E.g., Authentication, Blog, Payment Processing, Admin Panel"
              className="min-h-[100px]"
              value={formData.features}
              onChange={handleChange}
              required
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline"
            onClick={onCancel}
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Chat
          </Button>
          
          <Button type="submit">
            <Wand2 className="mr-2 h-4 w-4" />
            Generate Project
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default FullCodeWizard;
