import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardHrHome } from "@/components/appraisals/DashboardHrHome";

describe("DashboardHrHome", () => {
  it("offers Open cycle for a drafted first cycle", () => {
    render(
      <MemoryRouter>
        <DashboardHrHome
          cycles={[{ id: "c1", name: "2026 Annual Review", status: "draft" }]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /open cycle/i })).toHaveAttribute(
      "href",
      "/appraisals/c1",
    );
    expect(screen.getByText(/launch 2026 annual review/i)).toBeInTheDocument();
  });
});
