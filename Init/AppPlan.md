# DnD App Plan

### 1. **Project Setup**
- [ ] Initialize a new Next.js app (frontend + backend in one repo)
- [ ] Integrate Supabase:
  - [ ] Enable email/password auth
  - [ ] Create user profile table (if needed)
  - [ ] Set up tables for saving game state
- [ ] Set up `.env` with Supabase and OpenAI API keys

---

### 2. **Scenario Management**
- [ ] Create JSON parser/loader for scenario templates
- [ ] Fix JSON formatting issues in scenario files
- [ ] Parse and store:
  - Scenario title
  - Attributes (6 core attributes per scenario)
  - Base skills (12 skills tied to attributes)
  - Player customizations (2 categories with 5 options each)
  - Starting point
- [ ] Display scenario metadata and options in UI
- [ ] Build scenario selection screen

---

### 3. **Player Onboarding Flow**
- [ ] Present `playerCustomizations` (e.g., parentingStyle/role, familyBackground/background)
- [ ] Apply attribute bonuses to character state
- [ ] Create character sheet display with attributes and skills
- [ ] Show the intro scene (`startingPoint`) from the scenario
- [ ] Add beginner tutorial for players unfamiliar with D&D mechanics

---

### 4. **Gameplay Loop**
- [ ] Design a chat-style interface for interaction
- [ ] Use OpenAI API to:
  - [ ] Introduce the story and respond to player actions
  - [ ] Include previous context and D20 outcome
  - [ ] Create prompt template that enforces scenario rules
- [ ] Simulate a D20 roll to add randomness to outcomes
  - [ ] Factor in attribute modifiers to roll outcomes
  - [ ] Visual dice rolling animation
- [ ] Keep track of decisions, events, and attribute updates
- [ ] Implement game state persistence between sessions

---

### 5. **UI/UX Layer**
- [ ] Implement a clean, intuitive layout
- [ ] Visual cues for progress (e.g., logs, badges, progression bar)
- [ ] Character sheet with attributes, skills, and backstory
- [ ] Responsive design for mobile and desktop
- [ ] Visual theming based on active scenario

---

### 6. **Polish & Deliverables**
- [ ] Add a `README.md` with setup and thought process
- [ ] Address design questions from the README
- [ ] Record optional 30-minute playthrough with voiceover
- [ ] Deploy app with Vercel (optional)
- [ ] Push code to GitHub and share the link
- [ ] Optional: Implement stretch goals (voice input/output, multiplayer features)
