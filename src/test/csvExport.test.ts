import { describe, expect, it } from "vitest";
import { filenameSlug, rowsToCsv } from "@/lib/csvExport";

describe("rowsToCsv", () => {
  it("escapes quotes by doubling them", () => {
    expect(rowsToCsv(["name"], [['Ada "Enchantress" Lovelace']])).toBe(
      'name\n"Ada ""Enchantress"" Lovelace"\n',
    );
  });

  it("quotes cells containing embedded newlines", () => {
    expect(rowsToCsv(["notes"], [["first line\nsecond line"]])).toBe(
      'notes\n"first line\nsecond line"\n',
    );
  });
});

describe("filenameSlug", () => {
  it("normalizes report names and supplies a fallback", () => {
    expect(filenameSlug(" FY 2026 / Review ")).toBe("fy-2026-review");
    expect(filenameSlug("!!!")).toBe("cycle");
  });
});
