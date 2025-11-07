// src/utils/validation.js

export const patterns = {
  username: /^[a-zA-Z0-9_]{3,20}$/,
  email: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
  password: /^[A-Za-z\d@$!%*?&]{8,20}$/,
  text: /^[a-zA-Z0-9\s.,!?'-]{1,200}$/,
  number: /^\d+$/,
  accountNumber: /^[0-9]{5,15}$/, // digits only
  idNumber: /^[0-9]{6,13}$/,      // e.g., South African ID range
  fullName: /^[A-Za-z\s'-]{2,50}$/ // only letters, spaces, hyphens, apostrophes
};

/**
 * Validate input against a predefined pattern.
 * Returns true if input is valid, false otherwise.
 */
export function validateInput(value, type) {
  if (typeof value !== "string") return false; // Defensive check
  const pattern = patterns[type];
  return pattern ? pattern.test(value) : true;
}

/**
 * Remove HTML tags from a string.
 */
function removeHtmlTags(str) {
  return str.replace(/<[^>]+?>/g, "");
}

/**
 * Remove script-like schemes and inline event handlers.
 */
function removeScriptSchemes(str) {
  return str
    .replace(/\b(?:javascript|data|vbscript):/gi, "")
    .replace(/on\w+\s*=/gi, "");
}

/**
 * Remove control characters from a string.
 */
function removeControlChars(str) {
  return str.replace(/[\x00-\x1F\x7F]/g, "");
}

/**
 * Sanitize input for safe use.
 * Removes HTML tags, dangerous scripts, control characters, and trims whitespace.
 */
export function sanitizeInput(value) {
  if (typeof value !== "string") return value;

  let sanitized = value;
  sanitized = removeHtmlTags(sanitized);
  sanitized = removeScriptSchemes(sanitized);
  sanitized = removeControlChars(sanitized);

  return sanitized.trim();
}
