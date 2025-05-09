
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
      
      // Update to use 2024-02-01 API version for DALL-E 3
      const apiVersion = "2024-02-01";
      
      // Use direct path format for the API call
      const imageGenUrl = `${AZURE_OPENAI_ENDPOINT}/openai/images/generations:submit?api-version=${apiVersion}`;
      
      console.log(`Image generation URL: ${imageGenUrl}`);
      console.log(`Sending image generation request with prompt: ${imagePrompt}`);
      
      try {
        console.log(`API Key exists: ${!!AZURE_OPENAI_API_KEY}`);
        console.log(`API Key length: ${AZURE_OPENAI_API_KEY ? AZURE_OPENAI_API_KEY.length : 0}`);
        
        const bodyContent = JSON.stringify({
          prompt: imagePrompt,
          n: 1,
          size: "1024x1024",
          model: AZURE_OPENAI_DALLE_DEPLOYMENT,
          response_format: "url"
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
          
          let errorMessage = "Unknown error occurred";
          let errorDetails = null;
          
          try {
            const errorJson = JSON.parse(errorData);
            errorMessage = errorJson.error?.message || "Unknown error";
            errorDetails = errorJson.error;
          } catch {
            errorMessage = errorData || "Unknown error occurred";
          }
          
          // Format a more helpful error message based on the error type
          let formattedErrorMessage = `I couldn't generate that image. The Azure OpenAI DALL-E service returned an error: ${errorMessage}`;
          
          // For specific error codes, provide more guidance
          if (errorData.includes("404") || errorData.includes("Resource not found")) {
            formattedErrorMessage = `I couldn't generate that image because the API endpoint for DALL-E couldn't be accessed. This usually means either:
1. The deployment name '${AZURE_OPENAI_DALLE_DEPLOYMENT}' doesn't exist in your Azure OpenAI service, or
2. The API version being used (${apiVersion}) isn't compatible with your DALL-E model.

Please verify in your Azure OpenAI service that:
- The deployment name is exactly '${AZURE_OPENAI_DALLE_DEPLOYMENT}' (check for typos or case sensitivity)
- The model supports the API version ${apiVersion}
- Your Azure OpenAI endpoint (${AZURE_OPENAI_ENDPOINT}) is correct`;
          } else if (errorData.includes("401") || errorData.includes("unauthorized")) {
            formattedErrorMessage = `I couldn't generate that image because the Azure OpenAI service rejected the API key. Please verify your AZURE_OPENAI_API_KEY is correct and has permission to use the DALL-E deployment.`;
          } else if (errorData.includes("429")) {
            formattedErrorMessage = `I couldn't generate that image because your Azure OpenAI service has reached its rate limit. Please try again later or check your quota settings.`;
          }
          
          return new Response(
            JSON.stringify({ 
              isImage: false, 
              content: formattedErrorMessage,
              error: errorDetails,
              deploymentName: AZURE_OPENAI_DALLE_DEPLOYMENT,
              endpoint: AZURE_OPENAI_ENDPOINT,
              apiVersion: apiVersion
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Get the operation-location header for the async operation
        const operationLocation = imageResponse.headers.get("operation-location");
        if (!operationLocation) {
          console.error("Missing operation-location header");
          return new Response(
            JSON.stringify({ 
              isImage: false, 
              content: "I couldn't generate that image. The Azure OpenAI DALL-E service didn't return an operation location." 
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        console.log(`Operation location: ${operationLocation}`);
        
        // Poll the operation location until the image is ready
        let imageResult = null;
        let retries = 0;
        const maxRetries = 10;
        
        while (retries < maxRetries) {
          console.log(`Polling attempt ${retries + 1}/${maxRetries}`);
          
          // Wait 1 second between polling attempts
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const pollResponse = await fetch(operationLocation, {
            method: "GET",
            headers: {
              "api-key": AZURE_OPENAI_API_KEY,
            },
          });
          
          if (!pollResponse.ok) {
            console.error(`Polling failed with status ${pollResponse.status}`);
            retries++;
            continue;
          }
          
          const pollData = await pollResponse.json();
          console.log(`Poll response: ${JSON.stringify(pollData)}`);
          
          if (pollData.status === "succeeded") {
            imageResult = pollData;
            break;
          } else if (pollData.status === "failed") {
            return new Response(
              JSON.stringify({ 
                isImage: false, 
                content: `Image generation failed: ${pollData.error?.message || "Unknown error"}` 
              }),
              {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
          
          retries++;
        }
        
        if (!imageResult) {
          return new Response(
            JSON.stringify({ 
              isImage: false, 
              content: "Image generation timed out. Please try again." 
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        
        // Extract the image URL from the result
        if (imageResult.result && imageResult.result.data && imageResult.result.data.length > 0) {
          const imageUrl = imageResult.result.data[0].url;
          console.log(`Generated image URL: ${imageUrl}`);
          
          return new Response(
            JSON.stringify({
              isImage: true,
              content: imageUrl,
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        } else {
          console.error("Missing image URL in result:", JSON.stringify(imageResult));
          return new Response(
            JSON.stringify({ 
              isImage: false, 
              content: "I couldn't generate that image. The Azure OpenAI service returned incomplete data." 
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
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
      
      // Improved system prompt for more complete responses
      const systemPrompt = "You are a helpful assistant that can answer questions, generate HTML/CSS/JS code, fix code bugs, and create images based on user prompts. When asked to create HTML pages or code snippets, always provide complete, detailed, and fully functional code including all necessary sections. For HTML, include all standard elements like doctype, html, head, body, etc. When asked for other content, be thorough and comprehensive in your responses. Format code nicely with markdown code blocks.";
      
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
                content: systemPrompt
              },
              ...messages
            ],
            temperature: 0.7,
            // Increased max tokens to allow for longer responses
            max_tokens: 4000,
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
