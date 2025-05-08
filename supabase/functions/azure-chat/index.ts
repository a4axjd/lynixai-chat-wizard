
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const AZURE_OPENAI_API_KEY = Deno.env.get("AZURE_OPENAI_API_KEY");
const AZURE_OPENAI_ENDPOINT = Deno.env.get("AZURE_OPENAI_ENDPOINT");
const AZURE_OPENAI_DEPLOYMENT_NAME = Deno.env.get("AZURE_OPENAI_DEPLOYMENT_NAME");
const AZURE_OPENAI_DALLE_DEPLOYMENT = Deno.env.get("AZURE_OPENAI_DALLE_DEPLOYMENT");

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
    // Check if environment variables are available
    if (!AZURE_OPENAI_API_KEY || !AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_DEPLOYMENT_NAME) {
      console.error("Missing required environment variables");
      return new Response(
        JSON.stringify({ 
          error: "Missing Azure OpenAI configuration. Please check your environment variables.",
          isConfigured: false
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const { messages } = await req.json();
    
    // Check if it's an image generation request
    const isImageRequest = /generate|create|draw|show|make.*image|picture|photo/i.test(
      messages[messages.length - 1].content
    );

    if (isImageRequest) {
      // Check if DALLE deployment is configured
      if (!AZURE_OPENAI_DALLE_DEPLOYMENT) {
        console.error("Missing DALLE deployment configuration");
        return new Response(
          JSON.stringify({ 
            isImage: false, 
            content: "Image generation is not configured. Please set up the AZURE_OPENAI_DALLE_DEPLOYMENT environment variable."
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Call Azure OpenAI DALL-E API for image generation
      const imagePrompt = messages[messages.length - 1].content;
      
      console.log(`DALLE deployment name: ${AZURE_OPENAI_DALLE_DEPLOYMENT}`);
      console.log(`Endpoint: ${AZURE_OPENAI_ENDPOINT}`);
      console.log(`Sending image generation request to Azure OpenAI with prompt: ${imagePrompt}`);
      
      try {
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
              model: AZURE_OPENAI_DALLE_DEPLOYMENT,
            }),
          }
        );

        if (!imageResponse.ok) {
          const errorData = await imageResponse.text();
          console.error("Azure OpenAI image generation error:", errorData);
          
          return new Response(
            JSON.stringify({ 
              isImage: false, 
              content: `I'm sorry, I couldn't generate that image. The Azure OpenAI DALL-E service returned an error: ${errorData}. Please check your AZURE_OPENAI_DALLE_DEPLOYMENT value and make sure it matches exactly with what's in Azure OpenAI.`
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const imageData = await imageResponse.json();
        console.log("Image generation submitted successfully. Operation location:", imageResponse.headers.get("operation-location"));
        
        const operationLocation = imageResponse.headers.get("operation-location");
        if (!operationLocation) {
          console.error("Missing operation location in response");
          return new Response(
            JSON.stringify({ 
              isImage: false, 
              content: "The image generation service didn't return a valid operation location. Please try again." 
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        
        // Poll for the image result
        let imageResult = null;
        let attempts = 0;
        const maxAttempts = 10;
        
        while (!imageResult && attempts < maxAttempts) {
          attempts++;
          console.log(`Polling attempt ${attempts}/${maxAttempts}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const statusResponse = await fetch(operationLocation, {
            headers: {
              "api-key": AZURE_OPENAI_API_KEY,
            },
          });
          
          if (!statusResponse.ok) {
            const statusError = await statusResponse.text();
            console.error("Error checking image status:", statusError);
            continue;
          }
          
          const statusData = await statusResponse.json();
          console.log("Status check response:", JSON.stringify(statusData));
          
          if (statusData.status === "succeeded") {
            if (statusData.result && statusData.result.data && statusData.result.data.length > 0) {
              imageResult = statusData.result.data[0].url;
              break;
            } else {
              console.error("Success response but missing image data:", JSON.stringify(statusData));
            }
          } else if (statusData.status === "failed") {
            console.error("Image generation failed:", JSON.stringify(statusData));
            return new Response(
              JSON.stringify({ 
                isImage: false, 
                content: `Image generation failed: ${statusData.error?.message || "Unknown error"}` 
              }),
              {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
        }
        
        if (!imageResult) {
          return new Response(
            JSON.stringify({ 
              isImage: false, 
              content: "The image generation took too long to process or failed. Please try again with a simpler prompt." 
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
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
      } catch (imageError) {
        console.error("Unexpected error during image generation:", imageError);
        return new Response(
          JSON.stringify({ 
            isImage: false, 
            content: `An unexpected error occurred during image generation: ${imageError.message}` 
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      // Regular text completion
      console.log("Sending chat completion request to Azure OpenAI");
      console.log(`Endpoint: ${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=2023-05-15`);
      
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
        
        return new Response(
          JSON.stringify({ 
            isImage: false, 
            content: "I'm sorry, I couldn't process your request due to a connection issue with Azure OpenAI. Please try again in a moment or contact support if this persists." 
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
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
      JSON.stringify({ 
        isImage: false, 
        content: "I encountered an unexpected error processing your request. Please try again or contact support if this persists." 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
