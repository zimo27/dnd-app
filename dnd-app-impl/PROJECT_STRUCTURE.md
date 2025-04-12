# DnD App Project Structure

This document outlines the organization of the DnD Role-Playing App codebase, clearly separating frontend and backend while maintaining a single repository.

## Project Organization

```
dnd-app-impl/
├── src/
│   ├── app/                   # Next.js App Router (Frontend UI)
│   │   ├── api/               # API Routes (Backend API Endpoints)
│   │   │   └── ...
│   │   ├── (routes)/          # Frontend Routes
│   │   │   └── ...
│   │   ├── layout.tsx         # Root Layout
│   │   └── page.tsx           # Homepage
│   │
│   ├── components/            # Shared React Components
│   │   ├── ui/                # UI Components (buttons, inputs, etc.)
│   │   └── features/          # Feature-specific Components
│   │
│   ├── backend/               # Backend Logic
│   │   ├── services/          # Business Logic Services
│   │   │   ├── ai/            # AI Integration Services
│   │   │   ├── game/          # Game Logic Services
│   │   │   └── user/          # User Management Services
│   │   ├── models/            # Data Models
│   │   └── utils/             # Backend Utilities
│   │
│   ├── lib/                   # Frontend Libraries/Adapters
│   │   ├── auth/              # Authentication Related
│   │   ├── api/               # API Client
│   │   └── hooks/             # Custom React Hooks
│   │
│   └── shared/                # Shared between Frontend & Backend
│       ├── types/             # TypeScript Interfaces & Types
│       ├── constants/         # Shared Constants
│       └── utils/             # Shared Utility Functions
│
├── public/                    # Static Assets
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

## Implementation Plan

1. Move authentication-related code to `/src/lib/auth`
2. Organize API endpoints in `/src/app/api` 
3. Create a clear API client in `/src/lib/api`
4. Move game logic to `/src/backend/services/game`
5. Move AI integration to `/src/backend/services/ai`

This structure allows for a clear separation of concerns while maintaining the benefits of a monorepo approach. 