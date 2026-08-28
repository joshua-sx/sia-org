import { describe, expect, it } from "vitest";
import { friendlyError, hasSiaErrorCode } from "@/lib/siaErrors";

describe("friendlyError", () => {
  it.each([
    ["SIA_WINDOW_CLOSED", "This window is closed — changes aren't allowed right now."],
    ["SIA_STAGE_LOCKED", "This item is locked because the stage has been submitted."],
    ["SIA_WEIGHTS_NOT_100", "Goal weights must add up to 100% before submitting."],
    ["SIA_RATINGS_INCOMPLETE", "Every goal needs a rating before you can submit."],
    ["SIA_CYCLE_ALREADY_ACTIVE", "Another cycle is already active — complete it before launching this one."],
    ["SIA_NUDGE_COOLDOWN", "A reminder for this task was already sent in the last 24 hours."],
    ["SIA_INVALID_ORG_STRUCTURE", "The organization structure is invalid. Review the levels and units."],
    ["SIA_ORG_STRUCTURE_EXISTS", "This organization already has a structure."],
  ])("maps %s to friendly copy", (code, expected) => {
    expect(friendlyError(new Error(`Database error: ${code}`))).toBe(expected);
  });

  it("uses the fallback for an unknown non-message value", () => {
    expect(friendlyError({ code: "UNKNOWN" }, "Could not save")).toBe("Could not save");
  });

  it("preserves an unknown error message", () => {
    expect(friendlyError(new Error("Network unavailable"), "Could not save")).toBe(
      "Network unavailable",
    );
  });

  it("detects stable SIA codes in object-shaped API errors", () => {
    expect(
      hasSiaErrorCode(
        { message: "Database error: SIA_ORG_STRUCTURE_EXISTS" },
        "SIA_ORG_STRUCTURE_EXISTS",
      ),
    ).toBe(true);
  });
});
