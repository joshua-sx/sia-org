import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useMergedQueryState } from "@/hooks/useMergedQueryState";

describe("useMergedQueryState", () => {
  it("uses the first enabled query error", () => {
    const { result } = renderHook(() =>
      useMergedQueryState([
        { isError: true, error: new Error("First error") },
        { isError: true, error: new Error("Second error") },
      ]),
    );

    expect(result.current.isError).toBe(true);
    expect(result.current.errorMessage).toBe("First error");
  });

  it("ignores disabled query state", () => {
    const { result } = renderHook(() =>
      useMergedQueryState([
        { enabled: false, isLoading: true, isError: true, error: new Error("Hidden") },
        { isLoading: false, isError: false },
      ]),
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("retries every enabled query with a refetch function", () => {
    const firstRefetch = vi.fn();
    const secondRefetch = vi.fn();
    const disabledRefetch = vi.fn();
    const { result } = renderHook(() =>
      useMergedQueryState([
        { refetch: firstRefetch },
        { refetch: secondRefetch },
        { enabled: false, refetch: disabledRefetch },
      ]),
    );

    result.current.retryAll();

    expect(firstRefetch).toHaveBeenCalledOnce();
    expect(secondRefetch).toHaveBeenCalledOnce();
    expect(disabledRefetch).not.toHaveBeenCalled();
  });
});
