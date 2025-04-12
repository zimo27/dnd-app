/**
 * A utility for simulating dice rolls in the game
 */

/**
 * Roll a die with the specified number of sides
 * @param sides The number of sides on the die
 * @returns A random number between 1 and sides
 */
export function rollDie(sides: number = 20): number {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Roll multiple dice and sum the results
 * @param count The number of dice to roll
 * @param sides The number of sides on each die
 * @returns The sum of all dice rolls
 */
export function rollDice(count: number, sides: number = 20): number {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += rollDie(sides);
  }
  return total;
}

/**
 * Roll a die and apply a modifier
 * @param sides The number of sides on the die
 * @param modifier The modifier to add to the roll
 * @returns The roll result with the modifier applied
 */
export function rollWithModifier(sides: number = 20, modifier: number = 0): { 
  roll: number; 
  modified: number;
} {
  const roll = rollDie(sides);
  return {
    roll,
    modified: roll + modifier
  };
} 