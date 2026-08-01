export function shuffleItems<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export function sampleItems<T>(items: readonly T[], count: number, random: () => number = Math.random): T[] {
  return shuffleItems(items, random).slice(0, Math.max(0, count));
}
