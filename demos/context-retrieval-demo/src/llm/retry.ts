export async function withRetry<T>(
  operation: () => Promise<T>,
  label: string,
  maxAttempts = 3,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) break;

      const backoffMs = Math.min(1500, 250 * 2 ** (attempt - 1));
      await new Promise((resolve) => {
        setTimeout(resolve, backoffMs);
      });
    }
  }

  throw new Error(
    `${label} failed after ${maxAttempts} attempts: ${formatError(lastError)}`,
  );
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
