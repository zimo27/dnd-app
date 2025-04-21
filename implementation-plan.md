# D&D Mini-Game Implementation Plan

## Requirements Summary

1. **Mini-Game Type**: Timing bar/slider mini-game ✅
2. **Interaction Method**: Click-based interaction ✅
3. **Game Concept**: Coffee temperature control slider ✅
4. **Trigger Condition**: Third round of conversation with the president ✅
5. **Success Criteria**: Player must stop the indicator within the success zone ✅
6. **Integration**: The mini-game appears within the chat interface ✅
7. **Outcome Display**: Show success/failure message in chat ✅
8. **Plot Impact**: Influence D&D game plot based on success/failure ✅

## Implementation Steps

### 1. Create Mini-Game Component (TimingBarGame.tsx) ✅

- Build a reusable React component for the timing bar mini-game ✅
- Implement slider animation with a moving indicator ✅
- Add click interaction to stop the indicator ✅
- Include success/failure detection logic ✅
- Style the component to fit within chat interface ✅
- Add difficulty scaling options ✅

```typescript
// Component features:
// - Animated indicator moving across a bar
// - Success zone(s) that can be configured
// - Click handler to stop the indicator
// - Success/failure state and callbacks
// - Visual feedback on result
```

### 2. Modify Game State Type ✅

- Update the GameState type to track mini-game interactions ✅
- Add a field to track conversation rounds ✅

```typescript
// Add to GameState interface:
// - miniGamePlayed: boolean
// - conversationRound: number
// - miniGameResult?: 'success' | 'failure'
```

### 3. Create Mini-Game Trigger Logic ✅

- Add conversation round tracking in the chat logic ✅
- Implement detection for the president's coffee request ✅
- Create condition to show mini-game at the right time ✅

```typescript
// Logic to:
// - Track conversation rounds
// - Detect when we're in the third round
// - Check for president's coffee request
// - Trigger mini-game display
```

### 4. Integrate Mini-Game with Chat Interface ✅

- Add mini-game component to chat rendering logic ✅
- Create a message container for mini-game display ✅
- Handle mini-game completion and state updates ✅

```typescript
// Integration points:
// - Add component to message flow
// - Create custom message type for mini-games
// - Handle mini-game state in chat component
```

### 5. Create Result Handling Logic ✅

- Process mini-game success/failure ✅
- Display appropriate message in chat ✅
- Update game state with result ✅

```typescript
// Result handling:
// - Store result in game state
// - Display success/failure message
// - Pass result to narrative generation
```

### 6. Modify AI Response Generation ✅

- Update AI prompting to include mini-game result ✅
- Guide narrative based on success/failure ✅
- Create different plot branches ✅

```typescript
// AI integration:
// - Include mini-game result in prompt
// - Direct narrative toward positive or negative outcomes
// - Create appropriate president reaction
```

### 7. Test and Debug ✅

- Test the mini-game in isolation ✅
- Test the trigger conditions ✅
- Test integration with chat flow ✅
- Test narrative branching ✅

## Files to Modify/Create

1. **New Files**: ✅
   - `src/components/features/MiniGames/TimingBarGame.tsx` - The mini-game component ✅
   - `src/components/features/MiniGames/index.ts` - Export for mini-games ✅

2. **Files to Modify**: ✅
   - `src/shared/types/game.ts` - Update GameState type ✅
   - `src/app/scenarios/[id]/chat/page.tsx` - Chat page integration ✅
   - `src/lib/api/index.ts` - Add mini-game result to AI requests ✅
   - `src/app/api/chat/route.ts` - Handle mini-game results in AI prompt ✅
   - `src/backend/services/ai/openai.ts` - Update generateResponse function ✅

## Implementation Timeline

1. Mini-game component - 15 minutes ✅
2. Game state updates - 5 minutes ✅
3. Trigger logic - 10 minutes ✅
4. Chat integration - 10 minutes ✅
5. Result handling - 5 minutes ✅
6. AI response modification - 5 minutes ✅

Total: 50 minutes ✅ 