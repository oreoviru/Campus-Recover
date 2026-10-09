import { describe, it, expect } from "vitest";
import { sanitizeInput, isInstitutionalEmail } from "../utils/sanitize";

describe("Frontend Security Utilities", () => {
  describe("sanitizeInput (XSS prevention)", () => {
    it("strips script tags and inner contents", () => {
      const malicious = "Found phone <script>alert('xss')</script> in library";
      const cleaned = sanitizeInput(malicious);
      expect(cleaned).toBe("Found phone  in library");
      expect(cleaned).not.toContain("<script>");
      expect(cleaned).not.toContain("alert");
    });

    it("strips dangerous HTML tags and event handlers", () => {
      const payload = '<img src=x onerror="alert(1)"> Blue Bag';
      const cleaned = sanitizeInput(payload);
      expect(cleaned).toBe("Blue Bag");
      expect(cleaned).not.toContain("<img");
      expect(cleaned).not.toContain("onerror");
    });

    it("strips javascript: pseudoprotocol", () => {
      const payload = "javascript:alert(1)";
      const cleaned = sanitizeInput(payload);
      expect(cleaned).toBe("alert(1)");
    });

    it("handles null and undefined gracefully", () => {
      expect(sanitizeInput(null)).toBe("");
      expect(sanitizeInput(undefined)).toBe("");
      expect(sanitizeInput("")).toBe("");
    });
  });

  describe("Institutional Email Domain Guard", () => {
    it("accepts valid institutional domains", () => {
      expect(isInstitutionalEmail("student@student.university.edu")).toBe(true);
      expect(isInstitutionalEmail("faculty@university.edu")).toBe(true);
      expect(isInstitutionalEmail("researcher@cs.university.edu")).toBe(true);
    });

    it("rejects non-institutional commercial domains", () => {
      expect(isInstitutionalEmail("hacker@gmail.com")).toBe(false);
      expect(isInstitutionalEmail("attacker@yahoo.com")).toBe(false);
      expect(isInstitutionalEmail("spam@hotmail.com")).toBe(false);
      expect(isInstitutionalEmail("")).toBe(false);
      expect(isInstitutionalEmail("not-an-email")).toBe(false);
    });
  });
});
