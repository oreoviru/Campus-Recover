/**
 * Campus Recover — Frontend Input Sanitization & Anti-XSS Utilities
 */

/**
 * Strips script tags, javascript: links, and HTML tags from user strings.
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export function isInstitutionalEmail(
  email: string,
  allowedDomains: string[] = [
    "rishihood.edu.in",
    "nst.rishihood.edu.in",
    "university.edu.in",
    "student.university.edu",
    "university.edu",
  ]
): boolean {
  if (!email || !email.includes("@")) return false;
  const domain = email.split("@")[1].toLowerCase();
  return allowedDomains.some((d) => domain === d.toLowerCase() || domain.endsWith(`.${d.toLowerCase()}`));
}
