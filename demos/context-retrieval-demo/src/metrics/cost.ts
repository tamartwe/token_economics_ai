export function estimateCost(
  inputTokens: number,
  outputTokens: number,
  inputTokenPricePer1M: number,
  outputTokenPricePer1M: number,
): number {
  return (
    (inputTokens / 1_000_000) * inputTokenPricePer1M +
    (outputTokens / 1_000_000) * outputTokenPricePer1M
  );
}
