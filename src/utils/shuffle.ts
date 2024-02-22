import { GeneratorYield } from "./types";

/**
 * Fisher-Yates shuffle. Modifies in place.
 */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));

    [arr[i], arr[randomIndex]] = [arr[randomIndex]!, arr[i]!];
  }

  return arr;
}

/**
 * Yields items from passed array in random order.
 */
export function* bagShuffle<T>(passedArr: T[]): GeneratorYield<{ bag: T[]; next: T }> {
  const memoArr = [...passedArr];
  const arr = [...shuffle([...memoArr]), ...shuffle([...memoArr])];

  while (true) {
    // Always keep one bag ahead
    if (arr.length === memoArr.length) {
      arr.push(...shuffle([...memoArr]));
    }

    yield {
      bag: arr,
      next: arr.shift()!,
    };
  }
}
