

## Design Questions

### Gameplay Logic
- How does the system "remember" previous events? (log, context summary, etc.)
- How are player attributes actually used during story progression?
- How should RNG outcomes be incorporated in GPT prompts?

---

### GPT Prompt Engineering
- How much of the story history should be sent to GPT on each turn?
- What format should the system prompt follow to ensure continuity?
- How do we ensure the AI respects the scenario rules (attributes + skills)?

---

### UX & Player Experience
- How do we onboard users who aren’t familiar with D&D-style games?
- What makes choices feel meaningful and impactful?
- How is progress communicated visually or narratively?

---

### Technical Architecture
- How do we persist game state across sessions?
- How will scenario templates be loaded—statically or via Supabase?
- Can we support branching narratives or multiple-choice inputs?

---

### Stretch Goals
- Add voice input/output using Web Speech API
- Allow players to pick from a list of scenarios
- Consider multiplayer co-op or competitive story sessions
