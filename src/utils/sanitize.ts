import DOMPurify from 'dompurify'

/**
 * Sanitizes plain text input to prevent XSS attacks
 * Removes all HTML tags and attributes
 */
export const sanitizeText = (text: string): string => {
  if (!text) return ''
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: []
  })
}

/**
 * Sanitizes HTML content allowing only safe formatting tags
 * Use this when you need to preserve some basic formatting
 */
export const sanitizeHTML = (html: string): string => {
  if (!html) return ''
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  })
}

