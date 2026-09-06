import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationBell } from "@/components/NotificationBell";

const mocks = vi.hoisted(() => ({
  markRead: vi.fn(),
  markAllRead: vi.fn(),
  useNotifications: vi.fn(),
}));

vi.mock("@/hooks/useNotifications", () => ({
  useNotifications: mocks.useNotifications,
}));

vi.mock("@/hooks/useReducedMotion", () => ({
  usePrefersReducedMotion: () => true,
}));

function CurrentPath() {
  return <output aria-label="Current path">{useLocation().pathname}</output>;
}

describe("NotificationBell", () => {
  beforeEach(() => {
    mocks.markRead.mockReset();
    mocks.markAllRead.mockReset();
    mocks.useNotifications.mockReturnValue({
      notifications: [
        {
          id: "notification-1",
          title: "Goal window closes Friday",
          body: "Finish the remaining goal sets.",
          link: "/appraisals/goals",
          read_at: null,
          created_at: "2026-09-06T08:00:00.000Z",
        },
      ],
      unreadCount: 1,
      markRead: mocks.markRead,
      markAllRead: mocks.markAllRead,
      isLoading: false,
    });
  });

  it("labels unread notifications and closes the panel after navigation", () => {
    render(
      <MemoryRouter
        initialEntries={["/dashboard"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <NotificationBell />
        <CurrentPath />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Notifications, 1 unread" }));
    expect(screen.getByText("Goal window closes Friday")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Goal window closes Friday/i }));
    expect(mocks.markRead).toHaveBeenCalledWith(["notification-1"]);
    expect(screen.getByLabelText("Current path")).toHaveTextContent("/appraisals/goals");
    expect(screen.queryByText("Finish the remaining goal sets.")).not.toBeInTheDocument();
  });
});
