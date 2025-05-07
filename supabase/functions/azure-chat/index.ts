
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const AZURE_OPENAI_API_KEY = Deno.env.get("AZURE_OPENAI_API_KEY");
const AZURE_OPENAI_ENDPOINT = Deno.env.get("AZURE_OPENAI_ENDPOINT");
const AZURE_OPENAI_DEPLOYMENT_NAME = Deno.env.get("AZURE_OPENAI_DEPLOYMENT_NAME");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    // Check if it's an image generation request
    const isImageRequest = /generate|create|draw|show|make.*image|picture|photo/i.test(
      messages[messages.length - 1].content
    );

    if (isImageRequest) {
      // Call Azure OpenAI DALL-E API for image generation
      const imagePrompt = messages[messages.length - 1].content;
      
      const imageResponse = await fetch(
        `${AZURE_OPENAI_ENDPOINT}/openai/images/generations:submit?api-version=2023-12-01-preview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": AZURE_OPENAI_API_KEY,
          },
          body: JSON.stringify({
            prompt: imagePrompt,
            n: 1,
            size: "1024x1024",
            response_format: "url",
          }),
        }
      );

      if (!imageResponse.ok) {
        const errorData = await imageResponse.text();
        console.error("Azure OpenAI image generation error:", errorData);
        throw new Error(`Failed to generate image: ${errorData}`);
      }

      const imageData = await imageResponse.json();
      const operationLocation = imageResponse.headers.get("operation-location");
      
      // Poll for the image result
      let imageResult = null;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (!imageResult && attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResponse = await fetch(operationLocation, {
          headers: {
            "api-key": AZURE_OPENAI_API_KEY,
          },
        });
        
        const statusData = await statusResponse.json();
        
        if (statusData.status === "succeeded") {
          imageResult = statusData.result.data[0].url;
          break;
        }
      }
      
      if (!imageResult) {
        throw new Error("Image generation timed out");
      }
      
      return new Response(
        JSON.stringify({
          isImage: true,
          content: imageResult,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      // Regular text completion
      const chatResponse = await fetch(
        `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=2023-05-15`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": AZURE_OPENAI_API_KEY,
          },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content: "You are a helpful assistant that can answer questions, generate HTML/CSS/JS code, fix code bugs, and create images based on user prompts. Respond concisely unless otherwise requested. Format code nicely with markdown code blocks."
              },
              ...messages
            ],
            temperature: 0.7,
            max_tokens: 800,
          }),
        }
      );

      if (!chatResponse.ok) {
        const errorText = await chatResponse.text();
        console.error("Azure OpenAI error:", errorText);
        throw new Error(`Failed to get response: ${errorText}`);
      }

      const chatData = await chatResponse.json();
      const responseContent = chatData.choices[0].message.content;

      return new Response(
        JSON.stringify({
          isImage: false,
          content: responseContent,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
