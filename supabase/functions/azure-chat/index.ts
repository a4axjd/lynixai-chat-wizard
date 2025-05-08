
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
      console.log(`Image generation endpoint: ${AZURE_OPENAI_ENDPOINT}/openai/images/generations:submit?api-version=2023-12-01-preview`);
      console.log(`Sending image generation request to Azure OpenAI with prompt: ${imagePrompt}`);
      
      try {
        // Check API key and endpoint
        console.log(`API Key exists: ${!!AZURE_OPENAI_API_KEY}`);
        console.log(`API Key length: ${AZURE_OPENAI_API_KEY ? AZURE_OPENAI_API_KEY.length : 0}`);
        
        const imageGenUrl = `${AZURE_OPENAI_ENDPOINT}/openai/images/generations:submit?api-version=2023-12-01-preview`;
        console.log(`Sending request to: ${imageGenUrl}`);
        
        const bodyContent = JSON.stringify({
          prompt: imagePrompt,
          n: 1,
          size: "1024x1024",
          response_format: "url",
          model: AZURE_OPENAI_DALLE_DEPLOYMENT,
        });
        
        console.log(`Request body: ${bodyContent}`);
        
        const imageResponse = await fetch(
          imageGenUrl,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "api-key": AZURE_OPENAI_API_KEY,
            },
            body: bodyContent,
          }
        );

        console.log(`Response status: ${imageResponse.status}`);
        console.log(`Response headers: ${JSON.stringify([...imageResponse.headers.entries()])}`);
        
        if (!imageResponse.ok) {
          const errorData = await imageResponse.text();
          console.error("Azure OpenAI image generation error:", errorData);
          
          // Attempt to parse the error to provide better feedback
          let errorMessage = "Unknown error occurred";
          try {
            const errorJson = JSON.parse(errorData);
            errorMessage = errorJson.error?.message || errorData;
          } catch {
            errorMessage = errorData || "Unknown error occurred";
          }
          
          // Check for specific error types
          if (errorData.includes("404") || errorData.includes("Resource not found")) {
            return new Response(
              JSON.stringify({ 
                isImage: false, 
                content: `I couldn't generate that image because the DALL-E deployment '${AZURE_OPENAI_DALLE_DEPLOYMENT}' was not found. Please verify the deployment name in your Azure OpenAI service and update the AZURE_OPENAI_DALLE_DEPLOYMENT value to match exactly.`
              }),
              {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
          
          return new Response(
            JSON.stringify({ 
              isImage: false, 
              content: `I'm sorry, I couldn't generate that image. The Azure OpenAI DALL-E service returned an error: ${errorMessage}. Please verify your Azure OpenAI configuration.`
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const operationLocation = imageResponse.headers.get("operation-location");
        console.log("Image generation submitted successfully. Operation location:", operationLocation);
        
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
          console.log(`Polling attempt ${attempts}/${maxAttempts} at ${operationLocation}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const statusResponse = await fetch(operationLocation, {
            headers: {
              "api-key": AZURE_OPENAI_API_KEY,
            },
          });
          
          console.log(`Status response: ${statusResponse.status}`);
          
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
