// Calculate the modifier value from an attribute score (D&D-style)
export function calculateModifier(attributeScore: number): number {
  return Math.floor((attributeScore - 10) / 2);
}

// Roll a d20 and apply the attribute modifier
export function rollD20(attributeScore: number): {
  naturalRoll: number;
  modifier: number;
  totalRoll: number;
} {
  // Generate a random number between 1 and 20
  const naturalRoll = Math.floor(Math.random() * 20) + 1;
  
  // Calculate the modifier from the attribute score
  const modifier = calculateModifier(attributeScore);
  
  // Calculate the total roll
  const totalRoll = naturalRoll + modifier;
  
  return {
    naturalRoll,
    modifier,
    totalRoll
  };
}

// Interpret the result of a roll
export function interpretRoll(totalRoll: number): 'critical-failure' | 'failure' | 'success' | 'critical-success' {
  if (totalRoll <= 5) {
    return 'critical-failure';
  } else if (totalRoll <= 10) {
    return 'failure';
  } else if (totalRoll <= 19) {
    return 'success';
  } else {
    return 'critical-success';
  }
} 