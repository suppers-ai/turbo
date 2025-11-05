/**
 * Random number generation utilities with seeding support
 */

/**
 * Seeded random number generator using xorshift algorithm
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: string | number) {
    this.seed = typeof seed === 'string' ? this.hashString(seed) : seed;
  }

  /**
   * Generate a random number between 0 and 1
   */
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  /**
   * Generate a random integer between min and max (inclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Generate a random boolean
   */
  nextBoolean(probability = 0.5): boolean {
    return this.next() < probability;
  }

  /**
   * Shuffle an array
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Pick a random element from an array
   */
  pick<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    return array[this.nextInt(0, array.length - 1)];
  }

  /**
   * Pick multiple random elements without replacement
   */
  pickMultiple<T>(array: T[], count: number): T[] {
    const shuffled = this.shuffle(array);
    return shuffled.slice(0, Math.min(count, array.length));
  }

  /**
   * Generate a normally distributed random number (Box-Muller transform)
   */
  gaussian(mean = 0, stdDev = 1): number {
    let u1 = 0;
    let u2 = 0;

    while (u1 === 0) u1 = this.next(); // Converting [0,1) to (0,1)
    while (u2 === 0) u2 = this.next();

    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

/**
 * Weighted random selector
 */
export class WeightedRandom<T> {
  private items: Array<{ item: T; weight: number }>;
  private totalWeight: number;

  constructor(items: Array<{ item: T; weight: number }>) {
    this.items = items;
    this.totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  }

  /**
   * Select a random item based on weights
   */
  select(random: () => number = Math.random): T | undefined {
    if (this.items.length === 0 || this.totalWeight === 0) {
      return undefined;
    }

    let randomValue = random() * this.totalWeight;

    for (const { item, weight } of this.items) {
      randomValue -= weight;
      if (randomValue <= 0) {
        return item;
      }
    }

    return this.items[this.items.length - 1].item;
  }

  /**
   * Update weight for an item
   */
  updateWeight(item: T, newWeight: number): void {
    const entry = this.items.find(e => e.item === item);
    if (entry) {
      this.totalWeight = this.totalWeight - entry.weight + newWeight;
      entry.weight = newWeight;
    }
  }

  /**
   * Add a new item with weight
   */
  add(item: T, weight: number): void {
    this.items.push({ item, weight });
    this.totalWeight += weight;
  }

  /**
   * Remove an item
   */
  remove(item: T): boolean {
    const index = this.items.findIndex(e => e.item === item);
    if (index !== -1) {
      this.totalWeight -= this.items[index].weight;
      this.items.splice(index, 1);
      return true;
    }
    return false;
  }
}