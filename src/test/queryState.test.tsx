import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryError, QueryLoading } from "@/components/QueryState";

describe("QueryState", () => {
  it("QueryLoading exposes busy status and label", () => {
    render(<QueryLoading label="Loading employees" />);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-busy", "true");
    expect(region).toHaveAttribute("aria-label", "Loading employees");
  });

  it("QueryError retries on button click", () => {
    const onRetry = vi.fn();
    render(<QueryError message="Network error" onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Network error");
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
