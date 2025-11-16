# Accessibility Features

The Easy Risk Register application is built with accessibility in mind, meeting WCAG 2.1 AA compliance standards. This document outlines the accessibility features implemented in the application.

## WCAG 2.1 AA Compliance

Our application follows the Web Content Accessibility Guidelines (WCAG) 2.1 AA standards to ensure the application is accessible to users with disabilities. Key compliance features include:

### Perceivable
- Sufficient color contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Alternative text and ARIA labels for interactive elements
- Proper heading structure (H1, H2, H3, etc.)
- Non-color dependent information with text or other visual indicators

### Operable
- Full keyboard navigation support
- Visible focus indicators for all interactive elements
- Skip links for screen reader users
- Time-based media controls (where applicable)
- No keyboard traps

### Understandable
- Clear and consistent navigation
- Predictable user interface behavior
- Proper form labels and error messages
- Instructions for completing form fields
- Clear language and terminology

### Robust
- Valid HTML markup
- Proper ARIA roles and attributes
- Compatibility with assistive technologies
- Semantic HTML elements

## Implemented Accessibility Features

### Semantic HTML
- Proper use of heading hierarchy
- Semantic elements (header, nav, main, aside, footer)
- Correct use of ARIA landmarks

### Keyboard Navigation
- All interactive elements accessible via keyboard
- Logical tab order
- Focus indicators on all interactive elements
- Skip links for main content

### Screen Reader Support
- Proper ARIA labels for interactive elements
- Descriptive alternative text for images and icons
- Status messages for screen readers
- Proper form labels and instructions

### Form Accessibility
- Properly associated labels with form controls
- Clear error messages with ARIA attributes
- Instructions for form completion
- Accessible custom form controls

### Color and Contrast
- Sufficient color contrast ratios
- Non-color indicators for important information
- Support for high contrast mode
- Color-blind friendly design

## Automated Testing

The application includes automated accessibility testing using axe-core, which runs in development mode to catch accessibility issues early in the development process.

## Testing Tools

We recommend testing with the following tools:
- axe DevTools browser extension
- WAVE Web Accessibility Evaluation Tool
- Lighthouse Accessibility Audit
- Screen readers (NVDA, JAWS, VoiceOver)
- Keyboard-only navigation