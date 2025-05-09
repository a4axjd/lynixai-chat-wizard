import { serve } from "https://deno.land/std@0.168.0/http/server.ts";  
  
// Fetching environment variables for Azure OpenAI configuration  
const AZURE_OPENAI_API_KEY = Deno.env.get("AZURE_OPENAI_API_KEY");  
const AZURE_OPENAI_ENDPOINT = Deno.env.get("AZURE_OPENAI_ENDPOINT");  
const AZURE_OPENAI_DEPLOYMENT_NAME = Deno.env.get("AZURE_OPENAI_DEPLOYMENT_NAME");  
const AZURE_OPENAI_DALLE_DEPLOYMENT = Deno.env.get("AZURE_OPENAI_DALLE_DEPLOYMENT");  
  
// CORS headers for allowing cross-origin requests  
const corsHeaders = {  
  'Access-Control-Allow-Origin': '*',  
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'  
};  
  
// Starting the HTTP server  
serve(async (req) => {  
  // Handle CORS preflight requests  
  if (req.method === 'OPTIONS') {  
    return new Response(null, { headers: corsHeaders });  
  }  
  
  try {  
    // Check if required environment variables are available  
    if (!AZURE_OPENAI_API_KEY || !AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_DEPLOYMENT_NAME) {  
      console.error("Missing required environment variables");  
      return new Response(JSON.stringify({  
        error: "Missing Azure OpenAI configuration. Please check your environment variables.",  
        isConfigured: false  
      }), {  
        status: 500,  
        headers: {  
          ...corsHeaders,  
          "Content-Type": "application/json"  
        }  
      });  
    }  
  
    // Parse the incoming request JSON to get the messages  
    const { messages } = await req.json();  
  
    // Check if the last message indicates an image generation request  
    const isImageRequest = /generate|create|draw|show|make.*image|picture|photo/i.test(messages[messages.length - 1].content);  
  
    if (isImageRequest) {  
      // Handle image generation request  
  
      // Check if the DALL-E deployment is configured  
      if (!AZURE_OPENAI_DALLE_DEPLOYMENT) {  
        console.error("Missing DALLE deployment configuration");  
        return new Response(JSON.stringify({  
          isImage: false,  
          content: "Image generation is not configured. Please set up the AZURE_OPENAI_DALLE_DEPLOYMENT environment variable."  
        }), {  
          headers: {  
            ...corsHeaders,  
            "Content-Type": "application/json"  
          }  
        });  
      }  
  
      // Extract the image generation prompt from the last message  
      const imagePrompt = messages[messages.length - 1].content;  
  
      // Log the deployment name and endpoint for debugging  
      console.log(`DALLE deployment name: ${AZURE_OPENAI_DALLE_DEPLOYMENT}`);  
      console.log(`Endpoint: ${AZURE_OPENAI_ENDPOINT}`);  
  
      // Update to use the 2024-02-01 API version for DALL-E 3  
      const apiVersion = "2024-02-01";  
  
      // Construct the API endpoint for image generation  
      const imageGenUrl = `${AZURE_OPENAI_ENDPOINT}/openai/images/generations:submit?api-version=${apiVersion}`;  
      console.log(`Image generation URL: ${imageGenUrl}`);  
  
      // Prepare the body for the image generation request  
      const bodyContent = JSON.stringify({  
        prompt: imagePrompt,  
        n: 1,  
        size: "1024x1024",  
        model: AZURE_OPENAI_DALLE_DEPLOYMENT,  
        response_format: "url"  
      });  
      console.log(`Request body: ${bodyContent}`);  
  
      // Make the API call to Azure OpenAI DALL-E for image generation  
      const imageResponse = await fetch(imageGenUrl, {  
        method: "POST",  
        headers: {  
          "Content-Type": "application/json",  
          "api-key": AZURE_OPENAI_API_KEY  
        },  
        body: bodyContent  
      });  
  
      // Check if the response is okay  
      if (!imageResponse.ok) {  
        // Handle error response from the image generation API  
        const errorData = await imageResponse.text();  
        console.error("Azure OpenAI image generation error:", errorData);  
          
        // Format error messages based on specific cases (404, 401, 429)  
        let formattedErrorMessage = `I couldn't generate that image. The Azure OpenAI DALL-E service returned an error: ${errorData}`;  
          
        // More specific error handling  
        if (errorData.includes("404") || errorData.includes("Resource not found")) {  
          formattedErrorMessage = `I couldn't generate that image because the API endpoint for DALL-E couldn't be accessed. This usually means either:  
1. The deployment name '${AZURE_OPENAI_DALLE_DEPLOYMENT}' doesn't exist in your Azure OpenAI service, or  
2. The API version being used (${apiVersion}) isn't compatible with your DALL-E model.`;  
        } else if (errorData.includes("401") || errorData.includes("unauthorized")) {  
          formattedErrorMessage = `I couldn't generate that image because the Azure OpenAI service rejected the API key. Please verify your AZURE_OPENAI_API_KEY is correct and has permission to use the DALL-E deployment.`;  
        } else if (errorData.includes("429")) {  
          formattedErrorMessage = `I couldn't generate that image because your Azure OpenAI service has reached its rate limit. Please try again later or check your quota settings.`;  
        }  
          
        return new Response(JSON.stringify({  
          isImage: false,  
          content: formattedErrorMessage  
        }), {  
          headers: {  
            ...corsHeaders,  
            "Content-Type": "application/json"  
          }  
        });  
      }  
  
      // Get the operation-location header for the async operation  
      const operationLocation = imageResponse.headers.get("operation-location");  
      if (!operationLocation) {  
        console.error("Missing operation-location header");  
        return new Response(JSON.stringify({  
          isImage: false,  
          content: "I couldn't generate that image. The Azure OpenAI DALL-E service didn't return an operation location."  
        }), {  
          headers: {  
            ...corsHeaders,  
            "Content-Type": "application/json"  
          }  
        });  
      }  
      console.log(`Operation location: ${operationLocation}`);  
  
      // Poll the operation location until the image is ready  
      let imageResult = null;  
      let retries = 0;  
      const maxRetries = 10;  
      while (retries < maxRetries) {  
        console.log(`Polling attempt ${retries + 1}/${maxRetries}`);  
        // Wait 1 second between polling attempts  
        await new Promise((resolve) => setTimeout(resolve, 1000));  
          
        // Fetch the result of the image generation operation  
        const pollResponse = await fetch(operationLocation, {  
          method: "GET",  
          headers: {  
            "api-key": AZURE_OPENAI_API_KEY  
          }  
        });  
          
        if (!pollResponse.ok) {  
          console.error(`Polling failed with status ${pollResponse.status}`);  
          retries++;  
          continue;  
        }  
          
        const pollData = await pollResponse.json();  
        console.log(`Poll response: ${JSON.stringify(pollData)}`);  
          
        // Check the status of the image generation  
        if (pollData.status === "succeeded") {  
          imageResult = pollData;  
          break; // Exit polling loop if succeeded  
        } else if (pollData.status === "failed") {  
          return new Response(JSON.stringify({  
            isImage: false,  
            content: `Image generation failed: ${pollData.error?.message || "Unknown error"}`  
          }), {  
            headers: {  
              ...corsHeaders,  
              "Content-Type": "application/json"  
            }  
          });  
        }  
        retries++;  
      }  
  
      // If no image result was obtained after polling  
      if (!imageResult) {  
        return new Response(JSON.stringify({  
          isImage: false,  
          content: "Image generation timed out. Please try again."  
        }), {  
          headers: {  
            ...corsHeaders,  
            "Content-Type": "application/json"  
          }  
        });  
      }  
  
      // Extract the image URL from the result  
      if (imageResult.result && imageResult.result.data && imageResult.result.data.length > 0) {  
        const imageUrl = imageResult.result.data[0].url;  
        console.log(`Generated image URL: ${imageUrl}`);  
          
        // Respond with the generated image URL  
        return new Response(JSON.stringify({  
          isImage: true,  
          content: imageUrl  
        }), {  
          headers: {  
            ...corsHeaders,  
            "Content-Type": "application/json"  
          }  
        });  
      } else {  
        console.error("Missing image URL in result:", JSON.stringify(imageResult));  
        return new Response(JSON.stringify({  
          isImage: false,  
          content: "I couldn't generate that image. The Azure OpenAI service returned incomplete data."  
        }), {  
          headers: {  
            ...corsHeaders,  
            "Content-Type": "application/json"  
          }  
        });  
      }  
  
    } else {  
      // Handle regular chat completion request  
  
      console.log("Sending chat completion request to Azure OpenAI");  
      // Log the endpoint for chat completions  
      console.log(`Endpoint: ${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=2023-05-15`);  
  
      // Define an improved system prompt for chat responses  
      const systemPrompt = "You are a helpful assistant that can answer questions, generate HTML/CSS/JS code, fix code bugs, and create images based on user prompts. When asked to create HTML pages or code snippets, always provide complete, detailed, and fully functional code including all necessary sections. For HTML, include all standard elements like doctype, html, head, body, etc. When asked for other content, be thorough and comprehensive in your responses. Format code nicely with markdown code blocks.";  
  
      // Send a request to Azure OpenAI for chat completion  
      const chatResponse = await fetch(`${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=2023-05-15`, {  
        method: "POST",  
        headers: {  
          "Content-Type": "application/json",  
          "api-key": AZURE_OPENAI_API_KEY  
        },  
        body: JSON.stringify({  
          messages: [  
            {  
              role: "system",  
              content: systemPrompt  
            },  
            ...messages // Include user messages  
          ],  
          temperature: 0.7 // Set the randomness of the response  
        })  
      });  
  
      // Check if the chat response is okay  
      if (!chatResponse.ok) {  
        const errorText = await chatResponse.text();  
        console.error("Chat completion error:", errorText);  
        return new Response(JSON.stringify({  
          isImage: false,  
          content: "An error occurred while processing your request.",  
          error: errorText  
        }), {  
          headers: {  
            ...corsHeaders,  
            "Content-Type": "application/json"  
          }  
        });  
      }  
  
      // Parse the response from the chat API  
      const data = await chatResponse.json();  
      const reply = data.choices?.[0]?.message?.content || "No response from assistant.";  
  
      // Return the chat response  
      return new Response(JSON.stringify({  
        isImage: false,  
        content: reply  
      }), {  
        headers: {  
          ...corsHeaders,  
          "Content-Type": "application/json"  
        }  
      });  
    }  
  } catch (e) {  
    // Handle unexpected server errors  
    console.error("Unexpected server error:", e);  
    return new Response(JSON.stringify({  
      isImage: false,  
      content: "An unexpected server error occurred.",  
      error: e.message  
    }), {  
      status: 500,  
      headers: {  
        ...corsHeaders,  
        "Content-Type": "application/json"  
      }  
    });  
  }  
});  
