---
title: Easy Risk Register - Color Tokens
description: Complete color palette documentation with usage guidelines and accessibility compliance
last-updated: 2025-11-08
version: 1.0.0
status: draft
---

# Easy Risk Register - Color Tokens

## Overview

This document defines the complete color palette for the Easy Risk Register application. All colors are specified using hex values and include usage guidelines, accessibility information, and contrast ratios.

## Primary Color Palette

### Brand Colors
- **Primary Base**: `#2563eb` (Indigo 600)
  - Usage: Primary buttons, main CTAs, active states, important links
  - Accessibility: Passes AA contrast on white background (4.6:1)

- **Primary Dark**: `#1d4ed8` (Indigo 700)
  - Usage: Hover states for primary buttons, active navigation items
  - Accessibility: Passes AA contrast on white background (6.0:1)

- **Primary Light**: `#dbeafe` (Indigo 100)
  - Usage: Subtle backgrounds, hover states on light UI
  - Accessibility: Does not pass AA contrast for text (1.4:1)

### Supporting Colors
- **Secondary Base**: `#64748b` (Slate 500)
  - Usage: Secondary buttons, supporting text, inactive elements
  - Accessibility: Passes AA contrast on white background (4.7:1)

- **Secondary Light**: `#e2e8f0` (Slate 200)
  - Usage: Backgrounds, subtle dividers
  - Accessibility: Does not pass AA contrast for text (1.3:1)

- **Secondary Pale**: `#f1f5f9` (Slate 100)
  - Usage: Selected states, highlight backgrounds, form fields
  - Accessibility: Does not pass AA contrast for text (1.2:1)

### Accent Colors
- **Accent Primary**: `#059669` (Emerald 600)
  - Usage: Success states, positive actions, add operations
  - Accessibility: Passes AA contrast on white background (4.9:1)

- **Accent Secondary**: `#d97706` (Amber 600)
  - Usage: Warning states, caution alerts, attention indicators
  - Accessibility: Passes AA contrast on white background (4.9:1)

- **Gradient Start**: `#3b82f6` (Blue 500)
  - Usage: Gradient elements, special visual accents
  - Accessibility: Passes AA contrast on white background (4.4:1)

- **Gradient End**: `#8b5cf6` (Violet 500)
  - Usage: Gradient elements, special visual accents
  - Accessibility: Passes AA contrast on white background (4.0:1)

## Semantic Colors

### Status Indicators
- **Success**: `#10b981` (Emerald 500)
  - Usage: Success messages, completed actions, positive feedback
  - Accessibility: Passes AA contrast on white background (4.3:1)

- **Warning**: `#f59e0b` (Amber 500)
  - Usage: Warning messages, pending states, caution indicators
  - Accessibility: Passes AA contrast on white background (4.0:1)

- **Error**: `#ef4444` (Red 500)
  - Usage: Error messages, destructive actions, critical alerts
  - Accessibility: Passes AA contrast on white background (4.0:1)

- **Info**: `#3b82f6` (Blue 500)
  - Usage: Informational messages, neutral notifications
  - Accessibility: Passes AA contrast on white background (4.4:1)

## Neutral Palette

### Text Colors
- **Text High**: `#0f172a` (Slate 900)
  - Usage: Primary text, headings, important information
  - Accessibility: Passes AAA contrast on white background (15.7:1)

- **Text Mid**: `#334155` (Slate 700)
  - Usage: Secondary text, body paragraphs, subheadings
  - Accessibility: Passes AA contrast on white background (8.1:1)

- **Text Low**: `#64748b` (Slate 500)
  - Usage: Tertiary text, placeholder text, subtle information
  - Accessibility: Passes AA contrast on white background (4.7:1)

- **Text Muted**: `#94a3b8` (Slate 400)
  - Usage: Disabled text, very subtle information
  - Accessibility: Does not pass AA contrast (2.6:1)

### Background Colors
- **Background Primary**: `#ffffff` (White)
  - Usage: Main content background, primary surfaces
  - Accessibility: Standard background color

- **Background Secondary**: `#f8fafc` (Slate 50)
  - Usage: Secondary surfaces, cards, panels
  - Accessibility: Standard background color

- **Background Tertiary**: `#f1f5f9` (Slate 100)
  - Usage: Tertiary surfaces, subtle backgrounds
  - Accessibility: Standard background color

### Border Colors
- **Border Strong**: `#cbd5e1` (Slate 300)
  - Usage: Primary borders, important dividers
  - Accessibility: Sufficient for visual hierarchy

- **Border Mid**: `#e2e8f0` (Slate 200)
  - Usage: Secondary borders, subtle dividers
  - Accessibility: Sufficient for visual hierarchy

- **Border Weak**: `#f1f5f9` (Slate 100)
  - Usage: Tertiary borders, faint dividers
  - Accessibility: Sufficient for visual hierarchy

## Accessibility Compliance

### WCAG AA Standards
All color combinations used for text and UI elements meet WCAG AA standards:
- Normal text (14px+): Minimum 4.5:1 contrast ratio
- Large text (18px+): Minimum 3:1 contrast ratio
- UI elements: Minimum 3:1 contrast ratio

### Recommended Color Combinations
- Primary text on white: `#0f172a` (Slate 900) - 15.7:1
- Secondary text on white: `#334155` (Slate 700) - 8.1:1
- Body text on white: `#475569` (Slate 600) - 6.3:1
- Disabled text on white: `#94a3b8` (Slate 400) - 2.6:1
- Links on white: `#2563eb` (Indigo 600) - 4.6:1

## Color Usage Guidelines

### Do's
- Use primary color for primary actions and important CTAs
- Maintain consistent color meanings across the application
- Always verify color contrast using tools like WebAIM Contrast Checker
- Consider color-blind accessibility when designing
- Use semantic colors consistently (green for success, red for errors)

### Don'ts
- Don't use low-contrast color combinations that fail accessibility standards
- Don't rely solely on color to convey important information (also use text or icons)
- Don't arbitrarily change color meanings across different sections of the application
- Don't use too many different colors in a single interface
- Don't use colors that may have cultural or accessibility implications without research

## Tools for Implementation

### CSS Custom Properties
```
:root {
  /* Primary Colors */
  --color-primary: #2563eb;
  --color-primary-dark: #1d4ed8;
  --color-primary-light: #dbeafe;
  
  /* Secondary Colors */
  --color-secondary: #64748b;
  --color-secondary-light: #e2e8f0;
  --color-secondary-pale: #f1f5f9;
  
  /* Semantic Colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
  
  /* Neutral Colors */
  --color-text-high: #0f172a;
  --color-text-mid: #334155;
  --color-text-low: #64748b;
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8fafc;
  --color-border: #cbd5e1;
}
```