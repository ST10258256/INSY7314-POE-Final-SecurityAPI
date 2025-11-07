// src/utils/validation.js

export const patterns = {
  username: /^[a-zA-Z0-9_]{3,20}$/,
  email: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
  password: /^[A-Za-z\d@$!%*?&]{8,20}$/,
  text: /^[a-zA-Z0-9\s.,!?'-]{1,200}$/,
  number: /^\d+$/,
  accountNumber: /^[0-9]{5,15}$/,     // digits only
  idNumber: /^[0-9]{6,13}$/,          // e.g., South African ID range
  fullName: /^[A-Za-z\s'-]{2,50}$/,   // only letters, spaces, hyphens, apostrophes
};

/**
 * Validate input against a pattern type
 * @param {string} value
 * @param {string} type - key from patterns
 * @returns {boolean}
 */
export function validateInput(value, type) {
  const pattern = patterns[type];
  return pattern ? pattern.test(value) : true;
}

/**
 * Remove dangerous content from input string
 * @param {string} value
 * @returns {string}
 */
export function sanitizeInput(value) {
  if (typeof value !== "string") return value;

  let sanitized = value;

  //Remove all HTML tags
  sanitized = sanitized.replace(/<[^>]+?>/g, "");

  //Remove dangerous schemes and inline events (simple XSS defense)
  sanitized = sanitized.replace(/\b(?:javascript|data|vbscript):/gi, "")
                       .replace(/on\w+\s*=/gi, "");

  //Remove ASCII control characters (0x00-0x1F and 0x7F)
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, "");

  //Trim leading/trailing whitespace
  return sanitized.trim();
}
