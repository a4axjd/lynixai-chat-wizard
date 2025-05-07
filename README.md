
# LynixAI - Lightweight ChatGPT Alternative

LynixAI is a free and lightweight ChatGPT alternative that allows you to ask questions, generate code, fix bugs, and create images using AI.

## Features

- Clean chat interface with user and assistant messages
- Ask general questions
- Request code generation with syntax highlighting
- Submit broken code for fixes
- Ask for image generation
- Persistent chat history using localStorage
- Mobile responsive design

## Tech Stack

- Frontend: React with TypeScript
- Styling: Tailwind CSS
- UI Components: shadcn/ui
- Markdown Rendering: react-markdown
- Code Highlighting: react-syntax-highlighter

## Local Development

### Prerequisites

- Node.js (v18+)
- npm, yarn, or pnpm

### Setup

1. Clone this repository
2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```
3. Run the development server
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```
4. Open [http://localhost:8080](http://localhost:8080) in your browser

## Connecting to Supabase and Azure OpenAI

For full functionality including backend capabilities, you'll need to:

1. Set up a Supabase project at https://supabase.com/
2. Create an Azure account and set up Azure OpenAI service
3. Add the following environment variables to your Supabase Edge Functions:

```
AZURE_OPENAI_API_KEY=your-azure-openai-api-key
AZURE_ENDPOINT=your-azure-endpoint
AZURE_DEPLOYMENT_NAME=your-deployment-name
```

## License

MIT
