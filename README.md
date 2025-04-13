# DnD Role-Playing App

A modern web application that brings D&D-style role-playing games to life with customizable scenarios, character creation, and an AI-driven game master.

## Features

- Scenario-based gameplay with unique attributes and skills
- Character customization with different backgrounds and roles
- Dynamic storytelling powered by OpenAI's GPT
- D20 dice rolling mechanics to add randomness to outcomes
- Progress tracking and game state persistence

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Next.js API routes, Supabase
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **AI**: OpenAI API

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   cd dnd-app-impl
   ```
2. Install dependencies with `npm install`
3. Copy `.env.local.example` to `.env.local` and fill in your API keys
4. Run the development server with `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

The application requires the following environment variables:

```
# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# OpenAI configuration
OPENAI_API_KEY=your-openai-api-key
```

## Project Structure

- `/src/app` - Next.js App Router pages and layouts
- `/src/components` - Reusable React components
- `/src/lib` - Utility functions and API clients
- `/src/types` - TypeScript type definitions
- `/public` - Static assets

## Development Roadmap

See the `AppPlan.md` file for the full development roadmap and progress tracking.

## License

MIT 