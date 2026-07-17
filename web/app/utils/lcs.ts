/**
 * Aligns two sequences using Longest Common Subsequence (LCS).
 * Returns aligned pairs where null indicates a gap (insertion/deletion).
 */
export function alignByLCS<T>(
  seqA: T[],
  seqB: T[],
  keyFn: (item: T) => string,
): Array<{ a: T | null; b: T | null }> {
  const n = seqA.length;
  const m = seqB.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array(m + 1).fill(0),
  );

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (keyFn(seqA[i - 1]) === keyFn(seqB[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to produce alignment
  const result: Array<{ a: T | null; b: T | null }> = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && keyFn(seqA[i - 1]) === keyFn(seqB[j - 1])) {
      result.unshift({ a: seqA[i - 1], b: seqB[j - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ a: null, b: seqB[j - 1] });
      j--;
    } else {
      result.unshift({ a: seqA[i - 1], b: null });
      i--;
    }
  }

  return result;
}
