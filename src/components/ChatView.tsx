
import React, { useRef, useEffect, useState } from "react";
import { useChatContext } from "@/context/ChatContext";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const ChatView: React.FC = () => {
  const { currentChat, addMessage, loading: chatsLoading } = useChatContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const handleSendMessage = async (message: string, imageMode: boolean) => {
    // Make sure currentChat exists before proceeding
    if (!currentChat) {
      toast({
        title: "Error",
        description: "No active chat session found. Try refreshing the page.",
        variant: "destructive"
      });
      return;
    }

    // Reset any previous errors
    setError(null);
    
    // Add user message to chat
    await addMessage(message, "user");

    // Set loading state while processing
    setIsLoading(true);

    try {
      // Force image generation when in image mode
      const isImageRequest = imageMode || /generate|create|draw|show|make.*image|picture|photo/i.test(message);
      
      if (isImageRequest && !imageMode) {
        toast({
          title: "Generating Image",
          description: "This may take up to 30 seconds. Please be patient.",
        });
      }

      // Get all previous messages for context (increased from 10 to 25 for better context)
      const previousMessages = currentChat.messages
        .slice(-25)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // Add the new user message
      previousMessages.push({
        role: "user",
        content: imageMode ? `Generate an image of: ${message}` : message
      });

      // Call the Azure OpenAI edge function
      const { data, error } = await supabase.functions.invoke("azure-chat", {
        body: {
          messages: previousMessages,
          forceImage: imageMode
        }
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(error.message);
      }

      if (data?.isConfigured === false) {
        // Configuration is missing
        setError("Azure OpenAI is not properly configured. Please check your API keys and endpoint.");
        toast({
          title: "Configuration Error",
          description: "Azure OpenAI is not properly configured. Please check your API keys and endpoint.",
          variant: "destructive"
        });
        return;
      }

      // Check for specific DALL-E deployment errors
      if (data?.error) {
        console.error("Azure OpenAI detailed error:", data.error);
        
        if (data.deploymentName) {
          console.log(`Attempted to use DALL-E deployment: ${data.deploymentName}`);
          console.log(`Azure OpenAI endpoint: ${data.endpoint}`);
          console.log(`API version used: ${data.apiVersion}`);
        }
      }

      if (data) {
        // Add the assistant's response to the chat
        await addMessage(data.content, "assistant", data.isImage);
      } else {
        throw new Error("No data returned from Azure OpenAI");
      }
    } catch (error: any) {
      console.error("Failed to process message:", error);
      setError("Failed to get a response. Please try again.");
      await addMessage("Sorry, I encountered an error processing your request. Please try again.", "assistant");
      toast({
        title: "Error",
        description: "Failed to get a response from AI service. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (chatsLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Ecommerce landing page HTML template
  const ecommerceLandingPage = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FashionHub - Premium Clothing Store</title>
    <style>
        /* Base styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        body {
            color: #333;
            line-height: 1.6;
        }
        
        a {
            color: inherit;
            text-decoration: none;
        }
        
        /* Header styles */
        header {
            background-color: #fff;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            position: fixed;
            width: 100%;
            z-index: 1000;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 0;
        }
        
        .logo {
            font-size: 24px;
            font-weight: 700;
            color: #333;
        }
        
        .logo span {
            color: #ff6b6b;
        }
        
        .nav-links {
            display: flex;
            align-items: center;
        }
        
        .nav-links a {
            margin-left: 25px;
            font-weight: 500;
            transition: color 0.3s;
        }
        
        .nav-links a:hover {
            color: #ff6b6b;
        }
        
        .nav-links .cart {
            position: relative;
        }
        
        .cart-count {
            position: absolute;
            top: -8px;
            right: -8px;
            background-color: #ff6b6b;
            color: white;
            font-size: 10px;
            width: 16px;
            height: 16px;
            display: flex;
            justify-content: center;
            align-items: center;
            border-radius: 50%;
        }
        
        /* Hero section */
        .hero {
            background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1441984904996-e0b6ba687e04');
            background-size: cover;
            background-position: center;
            height: 80vh;
            display: flex;
            align-items: center;
            color: white;
            padding-top: 76px; /* Header height */
        }
        
        .hero-content {
            max-width: 600px;
        }
        
        .hero h1 {
            font-size: 48px;
            font-weight: 700;
            margin-bottom: 20px;
        }
        
        .hero p {
            font-size: 18px;
            margin-bottom: 30px;
        }
        
        .btn {
            display: inline-block;
            background-color: #ff6b6b;
            color: white;
            padding: 12px 25px;
            border-radius: 4px;
            font-weight: 600;
            transition: background-color 0.3s;
        }
        
        .btn:hover {
            background-color: #ff5252;
        }
        
        /* Categories section */
        .categories {
            padding: 80px 0;
        }
        
        .section-title {
            text-align: center;
            margin-bottom: 50px;
        }
        
        .section-title h2 {
            font-size: 36px;
            font-weight: 700;
        }
        
        .section-title p {
            color: #777;
            margin-top: 15px;
        }
        
        .category-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 30px;
        }
        
        .category-card {
            position: relative;
            height: 250px;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s;
        }
        
        .category-card:hover {
            transform: translateY(-10px);
        }
        
        .category-card img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .category-card .overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
            padding: 20px;
            color: white;
        }
        
        .category-card h3 {
            font-size: 24px;
            margin-bottom: 5px;
        }
        
        /* Featured products */
        .featured-products {
            background-color: #f9f9f9;
            padding: 80px 0;
        }
        
        .product-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 30px;
        }
        
        .product-card {
            background-color: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
            transition: transform 0.3s;
        }
        
        .product-card:hover {
            transform: translateY(-5px);
        }
        
        .product-image {
            height: 250px;
            overflow: hidden;
        }
        
        .product-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.5s;
        }
        
        .product-card:hover .product-image img {
            transform: scale(1.05);
        }
        
        .product-info {
            padding: 20px;
        }
        
        .product-category {
            font-size: 12px;
            color: #777;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .product-title {
            font-size: 18px;
            margin: 10px 0;
            font-weight: 600;
        }
        
        .product-price {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 15px;
        }
        
        .price {
            font-weight: 700;
            font-size: 20px;
            color: #ff6b6b;
        }
        
        .add-to-cart {
            background-color: #ff6b6b;
            color: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        
        .add-to-cart:hover {
            background-color: #ff5252;
        }
        
        /* Testimonials */
        .testimonials {
            padding: 80px 0;
        }
        
        .testimonial-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 30px;
        }
        
        .testimonial-card {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
        }
        
        .testimonial-text {
            font-style: italic;
            margin-bottom: 20px;
        }
        
        .testimonial-author {
            display: flex;
            align-items: center;
        }
        
        .author-image {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            overflow: hidden;
            margin-right: 15px;
        }
        
        .author-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .author-info h4 {
            font-weight: 600;
        }
        
        .author-info p {
            font-size: 14px;
            color: #777;
        }
        
        /* Newsletter */
        .newsletter {
            background-color: #ff6b6b;
            color: white;
            padding: 80px 0;
            text-align: center;
        }
        
        .newsletter h2 {
            font-size: 36px;
            margin-bottom: 20px;
        }
        
        .newsletter-form {
            max-width: 500px;
            margin: 0 auto;
            display: flex;
        }
        
        .newsletter-form input {
            flex: 1;
            padding: 15px;
            border: none;
            border-radius: 4px 0 0 4px;
            font-size: 16px;
        }
        
        .newsletter-form button {
            background-color: #333;
            color: white;
            border: none;
            padding: 0 30px;
            border-radius: 0 4px 4px 0;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        
        .newsletter-form button:hover {
            background-color: #444;
        }
        
        /* Footer */
        .footer {
            background-color: #222;
            color: #fff;
            padding: 60px 0 30px;
        }
        
        .footer-content {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .footer-column h3 {
            font-size: 18px;
            margin-bottom: 20px;
            color: #ff6b6b;
        }
        
        .footer-column ul {
            list-style: none;
        }
        
        .footer-column ul li {
            margin-bottom: 10px;
        }
        
        .footer-column a {
            color: #ccc;
            transition: color 0.3s;
        }
        
        .footer-column a:hover {
            color: #ff6b6b;
        }
        
        .social-icons {
            display: flex;
            gap: 15px;
            margin-top: 15px;
        }
        
        .social-icons a {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            background-color: #333;
            border-radius: 50%;
            transition: background-color 0.3s;
        }
        
        .social-icons a:hover {
            background-color: #ff6b6b;
        }
        
        .footer-bottom {
            text-align: center;
            padding-top: 30px;
            border-top: 1px solid #444;
            color: #888;
        }
        
        /* Responsive styles */
        @media (max-width: 768px) {
            .hero h1 {
                font-size: 36px;
            }
            
            .hero p {
                font-size: 16px;
            }
            
            .section-title h2 {
                font-size: 28px;
            }
            
            .newsletter h2 {
                font-size: 28px;
            }
            
            .newsletter-form {
                flex-direction: column;
            }
            
            .newsletter-form input {
                border-radius: 4px;
                margin-bottom: 10px;
            }
            
            .newsletter-form button {
                border-radius: 4px;
                padding: 15px;
            }
        }
        
        @media (max-width: 480px) {
            .header-content {
                flex-direction: column;
                padding: 15px 0;
            }
            
            .nav-links {
                margin-top: 15px;
            }
            
            .nav-links a {
                margin-left: 15px;
            }
            
            .hero {
                height: 60vh;
            }
            
            .hero h1 {
                font-size: 28px;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header>
        <div class="container">
            <div class="header-content">
                <a href="#" class="logo">Fashion<span>Hub</span></a>
                <nav class="nav-links">
                    <a href="#">Home</a>
                    <a href="#">Shop</a>
                    <a href="#">Categories</a>
                    <a href="#">About</a>
                    <a href="#">Contact</a>
                    <a href="#" class="cart">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        <span class="cart-count">3</span>
                    </a>
                </nav>
            </div>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="hero">
        <div class="container">
            <div class="hero-content">
                <h1>Summer Collection 2025</h1>
                <p>Discover our latest summer collection with trends that combine style, comfort and sustainability. Limited time offer with free shipping on all orders.</p>
                <a href="#" class="btn">Shop Now</a>
            </div>
        </div>
    </section>

    <!-- Categories Section -->
    <section class="categories">
        <div class="container">
            <div class="section-title">
                <h2>Shop by Category</h2>
                <p>Browse our store by category and find the perfect style for you</p>
            </div>
            <div class="category-grid">
                <div class="category-card">
                    <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d" alt="Women's Fashion">
                    <div class="overlay">
                        <h3>Women</h3>
                        <p>25+ Products</p>
                    </div>
                </div>
                <div class="category-card">
                    <img src="https://images.unsplash.com/photo-1617196701537-7329482cc9fe" alt="Men's Fashion">
                    <div class="overlay">
                        <h3>Men</h3>
                        <p>18+ Products</p>
                    </div>
                </div>
                <div class="category-card">
                    <img src="https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8" alt="Kids Fashion">
                    <div class="overlay">
                        <h3>Kids</h3>
                        <p>12+ Products</p>
                    </div>
                </div>
                <div class="category-card">
                    <img src="https://images.unsplash.com/photo-1637190337458-7ae76a98211e" alt="Accessories">
                    <div class="overlay">
                        <h3>Accessories</h3>
                        <p>30+ Products</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Featured Products -->
    <section class="featured-products">
        <div class="container">
            <div class="section-title">
                <h2>Featured Products</h2>
                <p>Explore our selection of featured products that are trending right now</p>
            </div>
            <div class="product-grid">
                <div class="product-card">
                    <div class="product-image">
                        <img src="https://images.unsplash.com/photo-1581044777550-4cfa60707c03" alt="Summer Dress">
                    </div>
                    <div class="product-info">
                        <div class="product-category">Women's Fashion</div>
                        <h3 class="product-title">Floral Summer Dress</h3>
                        <div class="product-price">
                            <span class="price">$49.99</span>
                            <button class="add-to-cart">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M9 20l-5.5-5.5 1.5-1.5 4 4 9-9 1.5 1.5L9 20z"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="product-card">
                    <div class="product-image">
                        <img src="https://images.unsplash.com/photo-1520975661595-6453be3f7070" alt="Men's T-Shirt">
                    </div>
                    <div class="product-info">
                        <div class="product-category">Men's Fashion</div>
                        <h3 class="product-title">Cotton Slim Fit T-Shirt</h3>
                        <div class="product-price">
                            <span class="price">$29.99</span>
                            <button class="add-to-cart">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M9 20l-5.5-5.5 1.5-1.5 4 4 9-9 1.5 1.5L9 20z"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="product-card">
                    <div class="product-image">
                        <img src="https://images.unsplash.com/photo-1560769629-975ec94e6a86" alt="Casual Shoes">
                    </div>
                    <div class="product-info">
                        <div class="product-category">Footwear</div>
                        <h3 class="product-title">Casual Comfort Shoes</h3>
                        <div class="product-price">
                            <span class="price">$79.99</span>
                            <button class="add-to-cart">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M9 20l-5.5-5.5 1.5-1.5 4 4 9-9 1.5 1.5L9 20z"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="product-card">
                    <div class="product-image">
                        <img src="https://images.unsplash.com/photo-1598532213919-078e54dd1f40" alt="Handbag">
                    </div>
                    <div class="product-info">
                        <div class="product-category">Accessories</div>
                        <h3 class="product-title">Designer Leather Handbag</h3>
                        <div class="product-price">
                            <span class="price">$129.99</span>
                            <button class="add-to-cart">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M9 20l-5.5-5.5 1.5-1.5 4 4 9-9 1.5 1.5L9 20z"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Testimonials -->
    <section class="testimonials">
        <div class="container">
            <div class="section-title">
                <h2>Customer Testimonials</h2>
                <p>What our happy customers are saying about us</p>
            </div>
            <div class="testimonial-grid">
                <div class="testimonial-card">
                    <div class="testimonial-text">
                        <p>"I absolutely love the quality of the clothes I received. The fabrics are amazing and the fit is perfect. Will definitely be ordering more!"</p>
                    </div>
                    <div class="testimonial-author">
                        <div class="author-image">
                            <img src="https://randomuser.me/api/portraits/women/12.jpg" alt="Sarah Johnson">
                        </div>
                        <div class="author-info">
                            <h4>Sarah Johnson</h4>
                            <p>Regular Customer</p>
                        </div>
                    </div>
                </div>
                <div class="testimonial-card">
                    <div class="testimonial-text">
                        <p>"Quick delivery and the customer service is top notch. When I had a question about sizing, they responded immediately and were very helpful."</p>
                    </div>
                    <div class="testimonial-author">
                        <div class="author-image">
                            <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Michael Adams">
                        </div>
                        <div class="author-info">
                            <h4>Michael Adams</h4>
                            <p>New Customer</p>
                        </div>
                    </div>
                </div>
                <div class="testimonial-card">
                    <div class="testimonial-text">
                        <p>"Fashion Hub has become my go-to store for all my fashion needs. Their collection is always on trend and the prices are very reasonable."</p>
                    </div>
                    <div class="testimonial-author">
                        <div class="author-image">
                            <img src="https://randomuser.me/api/portraits/women/33.jpg" alt="Emily Wilson">
                        </div>
                        <div class="author-info">
                            <h4>Emily Wilson</h4>
                            <p>Loyal Customer</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Newsletter -->
    <section class="newsletter">
        <div class="container">
            <h2>Subscribe to Our Newsletter</h2>
            <p>Get updates on our latest arrivals and special offers</p>
            <form class="newsletter-form">
                <input type="email" placeholder="Enter your email address" required>
                <button type="submit">Subscribe</button>
            </form>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-column">
                    <h3>FashionHub</h3>
                    <p>Bringing you the latest trends in fashion with quality products at affordable prices.</p>
                    <div class="social-icons">
                        <a href="#"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></a>
                        <a href="#"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>
                        <a href="#"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg></a>
                    </div>
                </div>
                <div class="footer-column">
                    <h3>Shop</h3>
                    <ul>
                        <li><a href="#">Women's Fashion</a></li>
                        <li><a href="#">Men's Fashion</a></li>
                        <li><a href="#">Kids' Collection</a></li>
                        <li><a href="#">Accessories</a></li>
                        <li><a href="#">New Arrivals</a></li>
                    </ul>
                </div>
                <div class="footer-column">
                    <h3>Customer Service</h3>
                    <ul>
                        <li><a href="#">Contact Us</a></li>
                        <li><a href="#">Track Your Order</a></li>
                        <li><a href="#">Returns & Exchanges</a></li>
                        <li><a href="#">Shipping Information</a></li>
                        <li><a href="#">FAQ</a></li>
                    </ul>
                </div>
                <div class="footer-column">
                    <h3>Company</h3>
                    <ul>
                        <li><a href="#">About Us</a></li>
                        <li><a href="#">Our Story</a></li>
                        <li><a href="#">Careers</a></li>
                        <li><a href="#">Privacy Policy</a></li>
                        <li><a href="#">Terms & Conditions</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2025 FashionHub. All rights reserved.</p>
            </div>
        </div>
    </footer>
</body>
</html>`;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}
        
        {currentChat?.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <h3 className="text-2xl font-bold text-primary mb-2">Welcome to LynixAI</h3>
            <p className="text-gray-600 text-center max-w-md mb-6">
              Your free and lightweight ChatGPT alternative. Ask me anything, request code, or generate images!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl w-full">
              {[
                "Explain quantum computing in simple terms",
                "Write a function to check if a number is prime",
                "Create an image of a futuristic city",
                "Generate an image of a cat wearing sunglasses",
                "Create a complete HTML ecommerce landing page",
                "Debug this code: function add(x, y) { retur x + y; }"
              ].map((suggestion) => (
                <Button 
                  key={suggestion}
                  variant="outline" 
                  className="justify-start h-auto py-3 px-4 text-left"
                  onClick={() => handleSendMessage(suggestion, suggestion.includes("image"))}
                  disabled={isLoading}
                >
                  <span className="truncate">{suggestion}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {currentChat?.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="py-8 flex justify-center">
                <Loader2 className="animate-spin text-primary" />
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <ChatInput onSubmit={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default ChatView;
