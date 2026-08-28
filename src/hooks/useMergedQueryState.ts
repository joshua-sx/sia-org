export interface MergeableQueryState {
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  refetch?: () => unknown;
  enabled?: boolean;
}

function errorMessage(error: unknown): string | undefined {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return undefined;
}

export function useMergedQueryState(queries: MergeableQueryState[]) {
  const enabledQueries = queries.filter((query) => query.enabled !== false);
  const firstError = enabledQueries.find((query) => query.isError);

  return {
    isLoading: enabledQueries.some((query) => query.isLoading),
    isError: firstError !== undefined,
    errorMessage: errorMessage(firstError?.error),
    retryAll: () => {
      enabledQueries.forEach((query) => {
        if (query.refetch) void query.refetch();
      });
    },
  };
}
