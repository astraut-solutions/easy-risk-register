---
title: Easy Risk Register - Button Component
description: Complete button specifications with variants, states, and usage guidelines
last-updated: 2025-11-08
version: 1.0.0
status: draft
---

# Easy Risk Register - Button Component

## Overview

The button component is a fundamental interactive element in the Easy Risk Register application. It enables users to trigger actions, navigate between views, and interact with the risk management system. This component follows the design system's visual guidelines while providing clear affordances for interaction.

## Component Variants

### Primary Button
- **Purpose**: Principal actions, primary CTA, main workflow actions
- **Visual Specifications**:
  - Background: `#2563eb` (Primary color)
  - Text Color: White (`#ffffff`)
  - Border: None
  - Height: 44px minimum
  - Horizontal Padding: `spacing-md` (16px)
  - Vertical Padding: `spacing-sm` (8px)
  - Border Radius: 6px
  - Font Weight: 600 (Semibold)

- **Usage Examples**: "Create Risk", "Save Changes", "Export Data"

### Secondary Button
- **Purpose**: Neutral actions, secondary workflow steps, alternative options
- **Visual Specifications**:
  - Background: Transparent
  - Text Color: `#64748b` (Secondary color)
  - Border: 1px solid `#cbd5e1` (Border color)
  - Height: 44px minimum
  - Horizontal Padding: `spacing-md` (16px)
  - Vertical Padding: `spacing-sm` (8px)
  - Border Radius: 6px
  - Font Weight: 600 (Semibold)

- **Usage Examples**: "Cancel", "View Details", "Previous Step"

### Tertiary Button
- **Purpose**: Minimal importance actions, subtle interface elements, icon buttons
- **Visual Specifications**:
  - Background: Transparent
  - Text Color: `#64748b` (Secondary color)
  - Border: None
  - Height: 44px minimum
  - Horizontal Padding: `spacing-sm` (8px)
  - Vertical Padding: `spacing-xs` (4px)
  - Border Radius: 6px
  - Font Weight: 400 (Regular)

- **Usage Examples**: "Edit", "Delete", "More Options", Icon-only buttons

### Ghost Button
- **Purpose**: Minimal emphasis actions, subtle links, alternative actions
- **Visual Specifications**:
  - Background: Transparent
  - Text Color: `#2563eb` (Primary color)
  - Border: None
  - Height: 44px minimum
  - Horizontal Padding: `spacing-sm` (8px)
  - Vertical Padding: `spacing-xs` (4px)
  - Border Radius: 6px
  - Font Weight: 400 (Regular)

- **Usage Examples**: "Learn More", "Change Settings", "Reset"

## Button States

### Default State
- Normal appearance with design specifications above
- Background color as specified
- Text color as specified
- No additional visual effects

### Hover State
- **Primary**: Background color darkens to `#1d4ed8` (Primary Dark)
- **Secondary**: Background color becomes `#f8fafc` (Background Primary)
- **Tertiary**: Background color becomes `#f8fafc` (Background Primary)
- **Ghost**: Background color becomes `#f8fafc` (Background Primary)
- Transition: 150ms spring easing

### Active State
- Slight scale effect (0.98) to provide pressed feedback
- Additional shadow for depth perception
- Transition: 150ms spring easing

### Focus State
- Visible focus indicator: 2px solid `#2563eb` with 2px offset
- Background color same as hover state
- Complies with WCAG AA standards for focus visibility

### Disabled State
- Opacity reduced to 50% (0.5)
- Cursor changes to "not-allowed"
- No hover or active states
- Text color remains consistent but at reduced opacity

### Loading State
- Spinner icon appears (optional)
- Text "Loading..." replaces button text (optional)
- Interaction disabled during loading
- Background color remains consistent but with loading indicator

## Button Sizes

### Small
- Height: 32px
- Font Size: 0.875rem (14px)
- Horizontal Padding: 12px
- Vertical Padding: 4px
- Border Radius: 4px

### Medium (Default)
- Height: 44px
- Font Size: 1rem (16px)
- Horizontal Padding: 16px
- Vertical Padding: 8px
- Border Radius: 6px

### Large
- Height: 52px
- Font Size: 1.125rem (18px)
- Horizontal Padding: 24px
- Vertical Padding: 12px
- Border Radius: 8px

## Icon Buttons

### Icon Only
- Square button with centered icon
- Size: 44px × 44px (minimum touch target)
- Background color follows variant specifications
- Proper ARIA label for accessibility
- Focus state with visible ring

### Icon + Text
- Icon positioned to the left of text
- 8px spacing between icon and text
- Icon vertically centered
- Text horizontally aligned with button text
- Maintains minimum 44px touch target

## Interaction Specifications

### Hover Transition
- Duration: 150ms (micro)
- Easing: `cubic-bezier(0.3, 0.45, 0.75, 1.3)` (spring)
- Properties affected: background-color, border-color, transform

### Click Feedback
- Duration: 150ms (micro)
- Easing: `cubic-bezier(0.3, 0.45, 0.75, 1.3)` (spring)
- Properties affected: transform (scale(0.98)), box-shadow

### Focus Ring
- Style: 2px solid `#2563eb`
- Offset: 2px from button edge
- Border-radius: matches button border-radius
- Complies with WCAG AA contrast requirements

## Accessibility Specifications

### ARIA Labels
- `role="button"` for non-native button elements
- `aria-pressed="true/false"` for toggle buttons
- `aria-disabled="true"` for disabled buttons
- `aria-label` for icon-only buttons

### Keyboard Navigation
- Accessible via Tab key in logical order
- Trigger with Space or Enter key
- Focus management for modal buttons
- Focus trap for modal button groups

### Screen Reader Support
- Button purpose announced clearly
- State changes announced (loading, disabled, pressed)
- Icon buttons have descriptive labels
- Button grouping announced appropriately

## Responsive Behavior

### Mobile (320px - 767px)
- Minimum touch target: 44px × 44px
- Slightly reduced padding to preserve space
- Full-width buttons in some contexts
- Simplified icon-only buttons when space-constrained

### Tablet (768px - 1023px)
- Standard padding and sizing
- May adjust to full-width in some layouts
- Hover states may not be available on touch screens

### Desktop (1024px+)
- Full-size buttons with maximum interactive area
- Hover states fully available
- Additional space for text labels or longer content

## Usage Guidelines

### When to Use This Component
- Triggering actions or functions
- Navigating between application views
- Submitting forms or saving data
- Providing clear, visible interactive options

### When NOT to Use This Component
- When a link is more appropriate for navigation
- When the action is a toggle switch function
- For non-interactive decorative elements
- When space constraints prevent proper touch targets

### Best Practices
- Use appropriate variant for action importance
- Maintain consistent labeling across the application
- Include loading states for asynchronous actions
- Ensure adequate spacing between buttons in groups
- Use only one primary button per logical section

### Common Mistakes to Avoid
- Too many primary buttons in one view
- Inconsistent labeling between similar functions
- Disabling buttons without clear explanation
- Using buttons for navigation when links are more appropriate
- Insufficient touch target size on mobile

## Implementation Examples

### HTML Structure
```html
<!-- Primary button -->
<button class="btn btn-primary" type="button">
  Create Risk
</button>

<!-- Primary button with icon -->
<button class="btn btn-primary" type="button">
  <svg class="btn-icon" aria-hidden="true">...</svg>
  Export Data
</button>

<!-- Disabled button -->
<button class="btn btn-primary" type="button" disabled>
  Save Changes
</button>
```

### CSS Classes
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  font-family: var(--font-primary);
  font-size: var(--text-body-size);
  font-weight: var(--font-weight-semibold);
  line-height: 1;
  cursor: pointer;
  transition: all var(--duration-micro) var(--spring);
  text-decoration: none;
  position: relative;
  box-sizing: border-box;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
  border-radius: 6px;
  min-height: 44px;
  padding: var(--spacing-sm) var(--spacing-md);
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
}

.btn-primary:focus {
  outline: none;
  box-shadow: 0 0 0 2px white, 0 0 0 4px var(--color-primary);
}

.btn-primary:disabled {
  background-color: var(--color-primary);
  opacity: 0.5;
  cursor: not-allowed;
}
```