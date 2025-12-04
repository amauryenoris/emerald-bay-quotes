/**
 * Email validation utility
 * Validates email format according to RFC 5322 (simplified)
 */
export const isValidEmail = (email: string): boolean => {
  // RFC 5322 compliant regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

  if (!email || email.length > 254) return false
  if (!emailRegex.test(email)) return false

  // Additional checks
  const parts = email.split('@')
  if (parts.length !== 2) return false
  if (parts[0].length > 64) return false

  return true
}

/**
 * Sanitizes user input to prevent XSS attacks
 * Removes potentially dangerous characters and limits length
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .slice(0, 255) // Limit length
}

