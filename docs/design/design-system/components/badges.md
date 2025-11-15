---
title: Easy Risk Register - Badge Component
description: Complete badge component specifications with variants, states, and usage guidelines
last-updated: 2025-11-10
version: 1.0.0
status: draft
---

# Easy Risk Register - Badge Component

## Overview

Badge components in the Easy Risk Register application provide contextual labels for items, statuses, risk levels, and other categorical information. These components enhance content by adding visual indicators that quickly communicate important information to users without requiring additional explanation.

## Component Variants

### Success Badge
- **Purpose**: Indicate successful actions, positive status, or successful outcomes
- **Visual Specifications**:
  - Background: `#dcfce7` (Success light)
  - Text Color: `#15803d` (Success dark)
  - Border: 1px solid `#bbf7d0` (Success border)
  - Border Radius: 12px
  - Padding: `spacing-xs` `spacing-sm`
  - Font Size: 0.75rem (12px)
  - Font Weight: 500 (Medium)

- **Usage Examples**: "Completed", "Active", "Verified", "Success"

### Warning Badge
- **Purpose**: Indicate caution, pending status, or warnings
- **Visual Specifications**:
  - Background: `#fef3c7` (Warning light)
  - Text Color: `#d97706` (Warning dark)
  - Border: 1px solid `#fde68a` (Warning border)
  - Border Radius: 12px
  - Padding: `spacing-xs` `spacing-sm`
  - Font Size: 0.75rem (12px)
  - Font Weight: 500 (Medium)

- **Usage Examples**: "Pending", "Attention", "Warning", "Processing"

### Danger Badge
- **Purpose**: Indicate errors, dangerous actions, or critical issues
- **Visual Specifications**:
  - Background: `#fee2e2` (Danger light)
  - Text Color: `#dc2626` (Danger dark)
  - Border: 1px solid `#fecaca` (Danger border)
  - Border Radius: 12px
  - Padding: `spacing-xs` `spacing-sm`
  - Font Size: 0.75rem (12px)
  - Font Weight: 500 (Medium)

- **Usage Examples**: "Error", "Failed", "Critical", "Unsaved"

### Info Badge
- **Purpose**: Provide additional information or neutral status
- **Visual Specifications**:
  - Background: `#dbeafe` (Info light)
  - Text Color: `#2563eb` (Info dark)
  - Border: 1px solid `#bfdbfe` (Info border)
  - Border Radius: 12px
  - Padding: `spacing-xs` `spacing-sm`
  - Font Size: 0.75rem (12px)
  - Font Weight: 500 (Medium)

- **Usage Examples**: "New", "Info", "Updated", "Beta"

### Subtle Badge
- **Purpose**: Provide less prominent status indicators
- **Visual Specifications**:
  - Background: `#f1f5f9` (Subtle light)
  - Text Color: `#475569` (Subtle dark)
  - Border: 1px solid `#e2e8f0` (Subtle border)
  - Border Radius: 12px
  - Padding: `spacing-xs` `spacing-sm`
  - Font Size: 0.75rem (12px)
  - Font Weight: 500 (Medium)

- **Usage Examples**: "Draft", "Internal", "Archived", "Helper"

### Risk-Specific Badges
- **High Risk**: Background `#fee2e2`, Text `#dc2626`
- **Medium Risk**: Background `#fef3c7`, Text `#d97706`
- **Low Risk**: Background `#dcfce7`, Text `#15803d`

## Badge States

### Default State
- Standard appearance with variant-specific styling
- Background and text color as specified
- Consistent border and padding

### Disabled State
- Opacity reduced to 50% (0.5)
- Not interactive (if badge is not just visual)
- Maintains visual hierarchy but reduced emphasis

## Size Variants

### Small Badge
- **Font Size**: 0.75rem (12px)
- **Padding**: `spacing-xs` `spacing-sm` (4px 8px)
- **Border Radius**: 12px
- **Line Height**: 1

### Medium Badge (Default)
- **Font Size**: 0.75rem (12px)
- **Padding**: `spacing-sm` `spacing-md` (8px 16px)
- **Border Radius**: 12px
- **Line Height**: 1

### Large Badge
- **Font Size**: 0.875rem (14px)
- **Padding**: `spacing-sm` `spacing-md` (8px 16px)
- **Border Radius**: 12px
- **Line Height**: 1

## Badge Content Structure

### Text Content
- **Text Alignment**: Centered within badge
- **Text Transformation**: Usually sentence case, occasionally uppercase for emphasis
- **Max Length**: Preferably 1-2 words to maintain readability
- **Truncation**: For longer content, consider using an abbreviation or tooltip

### Icon Badges
- **Icon Position**: Left of text, 4px from text
- **Icon Size**: 12px × 12px
- **Icon Color**: Matches text color
- **Accessibility**: Proper ARIA labels for icon meaning

## Interaction Specifications

### Hover State (When Interactive)
- **Effect**: Slight background darkening
- **Transition**: 150ms ease-out
- **Cursor**: Pointer only if clickable
- **Accessibility**: Clear affordance for interactive badges

### Click Feedback
- **Duration**: 150ms (micro)
- **Effect**: Subtle scale (0.98)
- **Only for interactive badges**: Non-interactive badges should not have click feedback

### Focus State
- **Indicator**: 2px solid `#2563eb` with 2px offset
- **Border Radius**: Maintains badge border-radius
- **Compliance**: WCAG AA contrast standards

## Responsive Behavior

### Mobile (320px - 767px)
- **Size**: May use small variant to preserve space
- **Layout**: Horizontal stacking with appropriate spacing
- **Readability**: Ensure font size remains legible
- **Touch Targets**: Maintain adequate spacing between badges

### Tablet (768px - 1023px)
- **Size**: Standard size applies
- **Layout**: Horizontal stacking with standard spacing
- **Adaptation**: May adjust to different form factors if needed

### Desktop (1024px+)
- **Size**: Standard size applies
- **Layout**: Horizontal stacking with standard spacing
- **Adaptation**: Full functionality available

## Accessibility Specifications

### Screen Reader Support
- **Labels**: Badge content should be meaningful when read aloud
- **Role**: Use appropriate ARIA roles if badge is interactive
- **Status**: For status badges, consider `aria-live` for dynamic updates
- **Color Independence**: Meaning should not be conveyed only through color

### Color Contrast
- **Text to Background**: Minimum 4.5:1 contrast ratio
- **Border to Background**: Minimum 3:1 contrast ratio
- **Special Variants**: Risk-specific colors maintain accessibility standards

### Keyboard Navigation
- **Focus Management**: Only for interactive badges
- **Key Handling**: Space/Enter for interactive badges
- **Order**: Logical tab order maintained

## Usage Guidelines

### When to Use Badge Components
- Display categorical information or status
- Highlight specific attributes of items
- Show risk levels or priority
- Add metadata to list items or cards
- Provide quick visual scanning cues

### When NOT to Use Badge Components
- As primary navigation elements
- For primary content that should be in regular text
- When too many badges clutter the interface
- As a replacement for proper form validation

### Best Practices
- Use consistent colors for similar types of information
- Keep text concise and meaningful
- Position badges logically near related content
- Maintain appropriate sizing relative to parent content
- Use appropriate accessibility attributes
- Follow semantic color conventions

### Common Mistakes to Avoid
- Overusing badges which can dilute their impact
- Using too many different badge variants in one view
- Creating badges that are too large for their context
- Relying solely on color to convey information
- Making text illegible due to poor contrast

## Risk-Specific Usage

### Risk Severity Indicators
- **Critical Risk**: Danger variant (`#dc2626`)
- **High Risk**: Warning variant (`#d97706`) 
- **Medium Risk**: Info variant (`#2563eb`)
- **Low Risk**: Success variant (`#15803d`)

### Risk Status Badges
- **Active**: Success variant
- **Mitigated**: Info variant
- **Monitored**: Warning variant
- **Closed**: Subtle variant

## Implementation Examples

### HTML Structure
```html
<!-- Success badge -->
<span class="badge badge-success" role="status">Active</span>

<!-- Warning badge with icon -->
<span class="badge badge-warning" role="status">
  <svg class="badge-icon" aria-hidden="true">...</svg>
  Pending
</span>

<!-- Risk severity badge -->
<span class="badge badge-risk-high" role="status">High Risk</span>
```

### CSS Classes
```css
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  text-align: center;
  box-sizing: border-box;
}

.badge-success {
  background-color: #dcfce7;
  color: #15803d;
  border: 1px solid #bbf7d0;
  padding: 4px 8px;
}

.badge-warning {
  background-color: #fef3c7;
  color: #d97706;
  border: 1px solid #fde68a;
  padding: 4px 8px;
}

.badge-danger {
  background-color: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
  padding: 4px 8px;
}

.badge-info {
  background-color: #dbeafe;
  color: #2563eb;
  border: 1px solid #bfdbfe;
  padding: 4px 8px;
}

.badge-subtle {
  background-color: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  padding: 4px 8px;
}