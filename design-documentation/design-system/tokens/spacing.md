---
title: Easy Risk Register - Spacing Tokens
description: Complete spacing system with dimensional values and layout guidelines
last-updated: 2025-11-08
version: 1.0.0
status: draft
---

# Easy Risk Register - Spacing Tokens

## Overview

This document defines the complete spacing system for the Easy Risk Register application. The spacing system is based on an 8px base unit that creates visual rhythm and consistent relationships throughout the interface.

## Spacing Scale

### Base Unit
- **Base Unit**: 8px
- **Rationale**: 8px is divisible by 2, 4 and 8, creating harmonious spacing relationships
- **Touch Target Minimum**: 44px (5.5x base unit) for accessibility

### Spacing Scale
- **xs**: base × 0.5 = 4px
  - Usage: Micro spacing between related elements, small padding adjustments
  - CSS: `spacing-xs: 0.25rem`

- **sm**: base × 1 = 8px
  - Usage: Small internal padding, spacing between closely related elements
  - CSS: `spacing-sm: 0.5rem`

- **md**: base × 2 = 16px
  - Usage: Default spacing between elements, standard margins
  - CSS: `spacing-md: 1rem`

- **lg**: base × 3 = 24px
  - Usage: Medium spacing between sections, comfortable breathing room
  - CSS: `spacing-lg: 1.5rem`

- **xl**: base × 4 = 32px
  - Usage: Large spacing between major sections, card padding
  - CSS: `spacing-xl: 2rem`

- **2xl**: base × 6 = 48px
  - Usage: Extra large spacing for screen padding, major section separation
  - CSS: `spacing-2xl: 3rem`

- **3xl**: base × 8 = 64px
  - Usage: Huge spacing for hero sections, significant element separation
  - CSS: `spacing-3xl: 4rem`

- **4xl**: base × 16 = 128px
  - Usage: Maximum spacing for special sections, large screen separation
  - CSS: `spacing-4xl: 8rem`

## Layout System

### Grid System
- **Mobile (320px–767px)**: 4-column grid
  - Gutter: 16px (spacing-md)
  - Margin: 16px from screen edge
  - Container: 100% width with side margins

- **Tablet (768px–1023px)**: 8-column grid
  - Gutter: 24px (spacing-lg)
  - Margin: 24px from screen edge
  - Container: 90% width max

- **Desktop (1024px+)**: 12-column grid
  - Gutter: 32px (spacing-xl)
  - Margin: 48px (spacing-2xl) from screen edge
  - Container: 1200px max-width, centered

### Breakpoints
- **Mobile**: 320px – 767px
  - Base spacing: spacing-md (16px)
  - Card padding: spacing-md (16px)
  - Section padding: spacing-md (16px)

- **Tablet**: 768px – 1023px
  - Base spacing: spacing-lg (24px)
  - Card padding: spacing-lg (24px)
  - Section padding: spacing-lg (24px)

- **Desktop**: 1024px – 1439px
  - Base spacing: spacing-xl (32px)
  - Card padding: spacing-xl (32px)
  - Section padding: spacing-xl (32px)

- **Wide**: 1440px+
  - Base spacing: spacing-2xl (48px)
  - Card padding: spacing-2xl (48px)
  - Section padding: spacing-2xl (48px)

## Component Spacing Guidelines

### Buttons
- **Internal Padding**:
  - Horizontal: spacing-md (16px) for default buttons
  - Vertical: spacing-sm (8px) for default buttons
  - Small buttons: horizontal spacing-sm (8px), vertical spacing-xs (4px)
  - Large buttons: horizontal spacing-lg (24px), vertical spacing-md (16px)

- **Spacing Between Buttons**:
  - In a button group: spacing-sm (8px)
  - Between button groups: spacing-md (16px)

### Cards
- **Padding**:
  - Outer padding: spacing-xl (32px) desktop, spacing-lg (24px) tablet, spacing-md (16px) mobile
  - Inner section padding: spacing-md (16px)

- **Spacing**:
  - Between card elements: spacing-md (16px)
  - Between cards: spacing-xl (32px) desktop, spacing-lg (24px) mobile

### Forms
- **Label to Input**: spacing-sm (8px)
- **Input to Input**: spacing-md (16px)
- **Input Field Padding**: spacing-sm (8px) vertical, spacing-md (16px) horizontal
- **Form Section Spacing**: spacing-xl (32px)
- **Input Container Padding**: spacing-md (16px)

### Navigation
- **Menu Item Height**: 48px minimum
- **Menu Item Padding**: spacing-md (16px) horizontal
- **Spacing Between Items**: 0px (use border or background for separation)
- **Sidebar Width**: 280px (35x base unit)

## Spacing Usage Principles

### Visual Hierarchy
- Use larger spacing to separate more important sections
- Use smaller spacing for closely related elements
- Create rhythm and flow with consistent spacing patterns
- Avoid arbitrary spacing values not in the scale

### Touch Target Requirements
- Minimum touch target: 44px × 44px (for accessibility)
- Minimum spacing between touch targets: 8px (spacing-sm)
- This ensures WCAG 2.1 AA compliance for touch targets

### Responsive Spacing
- Increase spacing on larger screens to improve readability
- Reduce spacing on smaller screens to preserve content space
- Maintain proportional relationships across screen sizes
- Use spacing tokens rather than fixed pixel values

## CSS Implementation

### Custom Properties
```css
:root {
  --spacing-xs: 0.25rem;    /* 4px */
  --spacing-sm: 0.5rem;     /* 8px */
  --spacing-md: 1rem;       /* 16px */
  --spacing-lg: 1.5rem;     /* 24px */
  --spacing-xl: 2rem;       /* 32px */
  --spacing-2xl: 3rem;      /* 48px */
  --spacing-3xl: 4rem;      /* 64px */
  --spacing-4xl: 8rem;      /* 128px */
  
  /* Container spacing */
  --container-padding: var(--spacing-xl);
  --container-padding-sm: var(--spacing-md);
  --container-padding-lg: var(--spacing-2xl);
  
  /* Component spacing */
  --card-padding: var(--spacing-xl);
  --card-spacing: var(--spacing-xl);
  --form-field-spacing: var(--spacing-md);
  --button-spacing: var(--spacing-sm);
}
```

### Utility Classes
```css
.padding-xs { padding: var(--spacing-xs); }
.padding-sm { padding: var(--spacing-sm); }
.padding-md { padding: var(--spacing-md); }
.padding-lg { padding: var(--spacing-lg); }
.padding-xl { padding: var(--spacing-xl); }
.padding-2xl { padding: var(--spacing-2xl); }

.margin-xs { margin: var(--spacing-xs); }
.margin-sm { margin: var(--spacing-sm); }
.margin-md { margin: var(--spacing-md); }
.margin-lg { margin: var(--spacing-lg); }
.margin-xl { margin: var(--spacing-xl); }
.margin-2xl { margin: var(--spacing-2xl); }

.margin-top-xs { margin-top: var(--spacing-xs); }
.margin-bottom-xs { margin-bottom: var(--spacing-xs); }
.margin-left-xs { margin-left: var(--spacing-xs); }
.margin-right-xs { margin-right: var(--spacing-xs); }
/* Similar patterns for other spacing values */
```

## Do's and Don'ts

### Do's
- Use spacing tokens consistently throughout the application
- Maintain visual rhythm with proportional spacing
- Apply larger spacing on larger screens for better readability
- Ensure adequate spacing around touch targets (44px minimum)
- Create visual groups with closer spacing between related items

### Don'ts
- Don't use spacing values not in the established scale
- Don't make spacing decisions based on "feeling right" without reference
- Don't use arbitrary pixel values for consistent spacing
- Don't make spacing so tight that elements feel cramped
- Don't make spacing so loose that the interface feels disconnected