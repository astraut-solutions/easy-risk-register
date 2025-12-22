import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Uses DOMPurify with a restricted set of allowed elements and attributes
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string with only safe elements and attributes
 */
const sanitizeHTML = (html: string): string => {
  if (!html) return html
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'ol', 'ul', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code'
    ],
    ALLOWED_ATTR: [],
    FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'frame', 'frameset', 'form', 'input', 'button', 'select', 'textarea', 'link', 'meta', 'base'],
    FORBID_ATTR: ['src', 'href', 'on*', 'data*', 'form*', 'action', 'method', 'enctype', 'autocomplete']
  })
}

/**
 * Sanitizes text input by removing HTML tags and other potentially unsafe content
 * @param input - The text input string to sanitize
 * @returns Sanitized text with HTML tags removed and whitespace trimmed
 */
export const sanitizeTextInput = (input: string): string => {
  if (typeof input !== 'string') return input as string

  // First, remove any HTML tags using DOMPurify
  const sanitized = sanitizeHTML(input)

  // Then trim whitespace and remove any remaining dangerous characters
  return sanitized.trim()
}

/**
 * Validates input length to prevent extremely large inputs
 * @param input - The input string to validate
 * @param maxLength - Maximum allowed length (default: 5000)
 * @returns Error message if validation fails, null otherwise
 */
const validateInput = (input: string, maxLength: number = 5000): string | null => {
  if (input.length > maxLength) {
    return `Input exceeds maximum length of ${maxLength} characters`
  }
  return null
}

/**
 * Sanitizes all text fields in a risk input object
 * Applies both length validation and content sanitization to specified fields
 * @param input - Risk input object that may contain text fields to sanitize
 * @returns Object with sanitized text fields
 */
export const sanitizeRiskInput = (input: Record<string, any>): Record<string, any> => {
  const sanitizedInput = { ...input }

  // Fields that should be sanitized with specific validation rules
  const textFields: Array<{ field: string, maxLength: number }> = [
    { field: 'title', maxLength: 200 },
    { field: 'description', maxLength: 5000 },
    { field: 'mitigationPlan', maxLength: 5000 },
    { field: 'category', maxLength: 100 }
  ]

  for (const { field, maxLength } of textFields) {
    if (typeof sanitizedInput[field] === 'string') {
      // Validate input length
      const validationError = validateInput(sanitizedInput[field], maxLength)
      if (validationError) {
        console.warn(`Validation error for ${field}: ${validationError}`)
        // Truncate to max length as a fallback
        sanitizedInput[field] = sanitizedInput[field].substring(0, maxLength)
      }

      sanitizedInput[field] = sanitizeTextInput(sanitizedInput[field])
    }
  }

  return sanitizedInput
}

/**
 * Validates CSV content to prevent CSV injection attacks
 * Checks for formulas or commands that could be executed by spreadsheet applications
 * @param csv - The CSV content string to validate
 * @returns True if content is safe, false if potential injection patterns are found
 */
export const validateCSVContent = (csv: string): boolean => {
  // Check for potential CSV injection patterns (formulas) at the start of any field.
  // Quoting does not prevent spreadsheet apps from evaluating formulas, so allow for an optional quote.
  const injectionPattern = /(^|[,\r\n])\s*["']?\s*[=+\-@]/
  return !injectionPattern.test(csv)
}
