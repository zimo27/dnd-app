# DnD App Project Structure

This document outlines the organization of the DnD Role-Playing App codebase, clearly separating frontend and backend while maintaining a single repository.

## Project Organization

```
dnd-app-impl/
├── src/
│   ├── app/                   # Next.js App Router (Frontend UI)
│   │   ├── api/               # API Routes (Backend API Endpoints)
│   │   │   ├── chat/          # AI Chat response generation
│   │   │   ├── check-rewards/ # Reward evaluation after skill use
│   │   │   ├── generate-image/# Character image generation
│   │   │   ├── narrative-skill/# Narrative response for skills
│   │   │   ├── reward/        # Apply attribute rewards
│   │   │   ├── scenarios/     # Scenario data endpoints
│   │   │   ├── skills/        # Skill check processing
│   │   │   └── story-structure/# Story structure generation
│   │   │
│   │   ├── auth/              # Authentication pages
│   │   ├── login/             # Login pages
│   │   ├── profile/           # User profile pages
│   │   ├── scenarios/         # Scenario browsing and gameplay
│   │   ├── (protected)/       # Protected routes requiring auth
│   │   ├── layout.tsx         # Root Layout
│   │   ├── page.tsx           # Homepage
│   │   └── globals.css        # Global styles
│   │
│   ├── components/            # Shared React Components
│   │   ├── ui/                # UI Components (buttons, inputs, etc.)
│   │   │   ├── Header.tsx     # App header
│   │   │   ├── CharacterImage.tsx # Character portrait component
│   │   │   └── ...            # Other UI components
│   │   │
│   │   └── features/          # Feature-specific Components
│   │
│   ├── backend/               # Backend Logic
│   │   ├── services/          # Business Logic Services
│   │   │   ├── ai/            # AI Integration Services
│   │   │   │   ├── openai.ts  # OpenAI API integration
│   │   │   │   └── ...
│   │   │   ├── game/          # Game Logic Services
│   │   │   │   ├── scenarios.ts # Scenario management
│   │   │   │   └── ...
│   │   │   └── user/          # User Management Services
│   │   │
│   │   └── utils/             # Backend Utilities
│   │
│   ├── lib/                   # Frontend Libraries/Adapters
│   │   ├── auth/              # Authentication Related
│   │   ├── api/               # API Client
│   │   │   ├── index.ts       # Main API functions
│   │   │   ├── skills.ts      # Skill-related API functions
│   │   │   ├── rewards.ts     # Reward-related API functions
│   │   │   ├── images.ts      # Image generation API functions
│   │   │   └── supabase.ts    # Supabase client
│   │   │
│   │   └── hooks/             # Custom React Hooks
│   │
│   ├── middleware.ts          # Auth middleware
│   │
│   └── shared/                # Shared between Frontend & Backend
│       ├── types/             # TypeScript Interfaces & Types
│       │   ├── game.ts        # Game-related types
│       │   └── ...
│       ├── constants/         # Shared Constants
│       └── utils/             # Shared Utility Functions
│
├── public/                    # Static Assets
│   ├── scenarios/             # JSON scenario files
│   └── ...
│
├── PROJECT_STRUCTURE.md       # This file
├── .env.local                 # Environment Variables
├── package.json
└── tsconfig.json
```

## Key Separation Points

1. **Frontend**:
   - `/src/app`: Next.js App Router components and routes
   - `/src/components`: Reusable React components
   - `/src/lib`: Frontend-specific libraries and hooks

2. **Backend**:
   - `/src/app/api`: API route handlers (Next.js API routes)
   - `/src/backend`: Core backend logic and services
   
3. **Shared**:
   - `/src/shared`: Code shared between frontend and backend

## Implementation Notes

The project follows a clean architecture with:

1. **AI Integration**: OpenAI is used for generating narrative responses, checking for rewards, and generating character images.

2. **Game State Management**: The game state is persisted in localStorage and includes:
   - Character attributes
   - Skills
   - Customizations 
   - History of interactions
   - Achievements and rewards

3. **Authentication**: Implemented using Supabase authentication

4. **Rewards System**: Includes an achievement system that rewards players for creative problem-solving and character development

5. **Skills System**: Allows players to use skills with D20 mechanics for randomness and attribute modifiers

This structure allows for a clear separation of concerns while maintaining the benefits of a monorepo approach. 