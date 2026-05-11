import { describe, it, expect } from "vitest";
import { esc } from "../src/js/utils/dom.js";

describe("esc() — HTML entity escaping", () => {
  it("escapes ampersands", () => {
    expect(esc("a & b")).toBe("a &amp; b");
  });

  it("escapes angle brackets", () => {
    expect(esc("<script>")).toBe("&lt;script&gt;");
  });

  it("escapes double quotes", () => {
    expect(esc('he said "hi"')).toBe("he said &quot;hi&quot;");
  });

  it("escapes single quotes (XSS fix A-1)", () => {
    expect(esc("test' onclick='alert(1)'")).toBe("test&#39; onclick=&#39;alert(1)&#39;");
  });

  it("handles null/undefined", () => {
    expect(esc(null)).toBe("");
    expect(esc(undefined)).toBe("");
    expect(esc("")).toBe("");
  });

  it("handles numbers", () => {
    expect(esc(42)).toBe("42");
  });
});
