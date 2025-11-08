---
title: Easy Risk Register - Typography Tokens
description: Complete typography system with font specifications, scales, and usage guidelines
last-updated: 2025-11-08
version: 1.0.0
status: draft
---

# Easy Risk Register - Typography Tokens

## Overview

This document defines the complete typography system for the Easy Risk Register application. It includes font specifications, scales, line heights, weights, and usage guidelines to ensure consistent text hierarchy and readability.

## Font Stack

### Primary Font
```
Primary: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif
```
- **Rationale**: Inter is an open-source font designed for UI applications with excellent readability at all sizes
- **Fallback**: System fonts ensure consistent experience across platforms
- **Usage**: All headings, body text, labels, and interface elements

### Monospace Font
```
Monospace: "JetBrains Mono", "Fira Code", Consolas, "Courier New", monospace
```
- **Rationale**: JetBrains Mono provides excellent readability for code and technical information
- **Fallback**: Standard monospace fonts
- **Usage**: Code snippets, technical data, and data displays

## Font Weights

### Available Weights
- **Light**: 300 - For subtle headings and light text treatments
- **Regular**: 400 - Standard body text and interface elements
- **Medium**: 500 - Subheadings and emphasized text that isn't quite bold
- **Semibold**: 600 - Headings, important labels, and key interface elements
- **Bold**: 700 - Strong emphasis, important headings, and key CTAs

### Weight Usage Guidelines
- Use 300 for light, airy headers or secondary information
- Use 400 for standard body text and default interface elements
- Use 500 for subheadings and moderately emphasized content
- Use 600 for headings, labels, and important interface elements
- Use 700 sparingly for maximum emphasis and important CTAs

## Type Scale

### Desktop Scale
- **H1**: `font-size: 2.5rem (40px)`, `line-height: 1.2`, `font-weight: 600`
  - Usage: Main page titles, primary marketing headers
  - Letter-spacing: -0.025em

- **H2**: `font-size: 2rem (32px)`, `line-height: 1.25`, `font-weight: 600`
  - Usage: Section headers, dashboard titles
  - Letter-spacing: -0.025em

- **H3**: `font-size: 1.75rem (28px)`, `line-height: 1.3`, `font-weight: 500`
  - Usage: Subsection headers, card titles
  - Letter-spacing: -0.025em

- **H4**: `font-size: 1.5rem (24px)`, `line-height: 1.33`, `font-weight: 500`
  - Usage: Card headers, secondary section titles
  - Letter-spacing: -0.025em

- **H5**: `font-size: 1.25rem (20px)`, `line-height: 1.4`, `font-weight: 500`
  - Usage: Minor headers, form section titles
  - Letter-spacing: -0.025em

- **H6**: `font-size: 1.125rem (18px)`, `line-height: 1.5`, `font-weight: 500`
  - Usage: Small headers, label enhancements
  - Letter-spacing: -0.025em

- **Body Large**: `font-size: 1.125rem (18px)`, `line-height: 1.6`
  - Usage: Primary reading text, important paragraphs
  - Letter-spacing: -0.015em

- **Body**: `font-size: 1rem (16px)`, `line-height: 1.5`
  - Usage: Standard body text, standard interface text
  - Letter-spacing: -0.015em

- **Body Small**: `font-size: 0.875rem (14px)`, `line-height: 1.43`
  - Usage: Secondary information, fine print, helper text
  - Letter-spacing: -0.005em

- **Caption**: `font-size: 0.75rem (12px)`, `line-height: 1.6`
  - Usage: Metadata, timestamps, legal information
  - Letter-spacing: 0.005em

- **Label**: `font-size: 0.875rem (14px)`, `line-height: 1.43`, `font-weight: 600`
  - Usage: Form labels, UI element identifiers
  - Letter-spacing: -0.005em

- **Code**: `font-size: 0.875rem (14px)`, `line-height: 1.43`, `font-family: monospace`
  - Usage: Code snippets, technical values, keys
  - Letter-spacing: 0.05em

### Mobile Scale (320-767px)
- H1: 1.75rem, H2: 1.5rem, Body: 0.875rem
- All line heights remain the same for readability
- Adjust scale by -1 step for mobile equivalent

### Tablet Scale (768-1023px)
- H1: 2rem, H2: 1.75rem, Body: 1rem
- Midway between mobile and desktop scales

## Responsive Typography

### Breakpoints and Scaling
- **Mobile**: 320px – 767px
  - Base font-size: 14px
  - H1: 1.75rem, H2: 1.5rem, Body: 0.875rem
  - Line heights remain consistent for readability

- **Tablet**: 768px – 1023px
  - Base font-size: 15px
  - H1: 2rem, H2: 1.75rem, Body: 1rem
  - Gradual scaling between mobile and desktop

- **Desktop**: 1024px – 1439px
  - Base font-size: 16px
  - Full desktop scale
  - Optimal reading experience

- **Wide**: 1440px+
  - Base font-size: 16px
  - H1: 3rem, H2: 2.25rem, Body: 1.125rem
  - Slight increase in hierarchy for large screens

## Typography Hierarchy Guidelines

### Information Architecture
- Use H1 for page titles only (max 1 per page)
- Use H2 for main section headers
- Use H3 for subsections
- Use H4 for card titles or important sub-items
- Use H5 for minor divisions
- Use H6 for small clarifications

### Accessibility Considerations
- Maintain semantic HTML heading order (H1 → H2 → H3, etc.)
- Use real HTML headings rather than styled text for proper screen reader navigation
- Ensure sufficient contrast ratios for all text (minimum 4.5:1 for normal text)
- Consider line length for readability (50-75 characters per line)

### Readability Best Practices
- Use 1.5x line height for body text for optimal readability
- Limit line length to 60-70 characters for best reading experience
- Use appropriate font weights to create visual hierarchy without increasing font size
- Ensure adequate spacing between paragraphs (at least 1rem)

## CSS Custom Properties

### Typography Variables
```css
:root {
  /* Font stacks */
  --font-primary: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", Consolas, "Courier New", monospace;
  
  /* Font weights */
  --font-weight-light: 300;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* Type scale */
  --text-h1-size: 2.5rem;
  --text-h1-line-height: 1.2;
  --text-h1-weight: 600;
  
  --text-h2-size: 2rem;
  --text-h2-line-height: 1.25;
  --text-h2-weight: 600;
  
  --text-h3-size: 1.75rem;
  --text-h3-line-height: 1.3;
  --text-h3-weight: 500;
  
  --text-h4-size: 1.5rem;
  --text-h4-line-height: 1.33;
  --text-h4-weight: 500;
  
  --text-h5-size: 1.25rem;
  --text-h5-line-height: 1.4;
  --text-h5-weight: 500;
  
  --text-h6-size: 1.125rem;
  --text-h6-line-height: 1.5;
  --text-h6-weight: 500;
  
  --text-body-large-size: 1.125rem;
  --text-body-large-line-height: 1.6;
  
  --text-body-size: 1rem;
  --text-body-line-height: 1.5;
  
  --text-body-small-size: 0.875rem;
  --text-body-small-line-height: 1.43;
  
  --text-caption-size: 0.75rem;
  --text-caption-line-height: 1.6;
  
  --text-label-size: 0.875rem;
  --text-label-line-height: 1.43;
  --text-label-weight: 600;
  
  --text-code-size: 0.875rem;
  --text-code-line-height: 1.43;
}
```

## Implementation Examples

### CSS Class Implementation
```css
.text-h1 {
  font-size: var(--text-h1-size);
  line-height: var(--text-h1-line-height);
  font-weight: var(--text-h1-weight);
  font-family: var(--font-primary);
}

.text-body {
  font-size: var(--text-body-size);
  line-height: var(--text-body-line-height);
  font-weight: var(--font-weight-regular);
  font-family: var(--font-primary);
}

.text-label {
  font-size: var(--text-label-size);
  line-height: var(--text-label-line-height);
  font-weight: var(--text-label-weight);
  font-family: var(--font-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```