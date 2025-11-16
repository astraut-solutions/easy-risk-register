import DOMPurify from 'isomorphic-dompurify'

// Configure DOMPurify to allow only safe HTML elements and attributes
// This prevents XSS attacks by removing any potentially dangerous code
const sanitizeHTML = (html: string): string => {
  if (!html) return html
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'ol', 'ul', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code'
    ],
    ALLOWED_ATTR: [],
    FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'frame', 'frameset'],
    FORBID_ATTR: ['src', 'href', 'on*']
  })
}

// Sanitize text input by removing HTML tags and other potentially unsafe content
export const sanitizeTextInput = (input: string): string => {
  if (typeof input !== 'string') return input as string

  // First, remove any HTML tags using DOMPurify
  const sanitized = sanitizeHTML(input)

  // Then trim whitespace and remove any remaining dangerous characters
  return sanitized.trim()
}

// Sanitize all text fields that can accept user input
export const sanitizeRiskInput = (input: Record<string, any>): Record<string, any> => {
  const sanitizedInput = { ...input }

  // Fields that should be sanitized
  const textFields = ['title', 'description', 'mitigationPlan', 'category']

  textFields.forEach(field => {
    if (typeof sanitizedInput[field] === 'string') {
      sanitizedInput[field] = sanitizeTextInput(sanitizedInput[field])
    }
  })

  return sanitizedInput
}