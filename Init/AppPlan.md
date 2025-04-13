# DnD App Plan

### 1. **Project Setup**
- [x] Initialize a new Next.js app (frontend + backend in one repo)
- [x] Integrate Supabase:
  - [x] Enable email/password auth
  - [x] Create user profile table (if needed)
  - [x] Set up tables for saving game state
- [x] Set up `.env` with Supabase and OpenAI API keys

---

### 2. **Scenario Management**
- [x] Create JSON parser/loader for scenario templates
- [x] Fix JSON formatting issues in scenario files
- [x] Parse and store:
  - Scenario title
  - Attributes (6 core attributes per scenario)
  - Base skills (12 skills tied to attributes)
  - Player customizations (2 categories with 5 options each)
  - Starting point
- [x] Display scenario metadata and options in UI
- [x] Build scenario selection screen

---

### 3. **Player Onboarding Flow**
- [x] Present `playerCustomizations` (e.g., parentingStyle/role, familyBackground/background)
- [x] Apply attribute bonuses to character state
- [x] Create character sheet display with attributes and skills
- [x] Show the intro scene (`startingPoint`) from the scenario
- [x] Add beginner tutorial for players unfamiliar with D&D mechanics

---

### 4. **Gameplay Loop**
- [x] Design a chat-style interface for interaction
- [x] Use OpenAI API to:
  - [x] Introduce the story and respond to player actions
  - [x] Include previous context and D20 outcome
  - [x] Create prompt template that enforces scenario rules
- [x] Simulate a D20 roll to add randomness to outcomes
  - [x] Factor in attribute modifiers to roll outcomes
  - [x] Visual dice rolling animation
- [x] Keep track of decisions, events, and attribute updates
- [x] Implement game state persistence between sessions

---

### 5. **UI/UX Layer**
- [x] Implement a clean, intuitive layout
- [x] Visual cues for progress (e.g., logs, badges, progression bar)
- [x] Character sheet with attributes, skills, and backstory
- [x] Responsive design for mobile and desktop
- [x] Visual theming based on active scenario

---

### 6. **Polish & Deliverables**
- [x] Add a `README.md` with setup and thought process
- [x] Address design questions from the README
- [ ] Record optional 30-minute playthrough with voiceover
- [x] Deploy app with Vercel (optional)
- [x] Push code to GitHub and share the link
- [ ] Optional: Implement stretch goals (voice input/output, multiplayer features)
