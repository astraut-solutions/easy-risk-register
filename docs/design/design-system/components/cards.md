---
title: Easy Risk Register - Card Components
description: Complete card component specifications with variants, states, and usage guidelines
last-updated: 2025-11-08
version: 1.0.0
status: draft
---

# Easy Risk Register - Card Components

## Overview

Card components in the Easy Risk Register application provide contained sections of related information with a clear visual hierarchy. These components are used to display individual risk entries, summary information, and other grouped content. Cards offer a flexible container that can accommodate various content types while maintaining consistent visual structure.

## Card Base Specifications

### Visual Specifications
- **Background**: `#ffffff` (Background Primary)
- **Border**: 1px solid `#e2e8f0` (Border Mid)
- **Border Radius**: 8px
- **Box Shadow**: 0 1px 3px 0 rgba(0, 0, 0, 0.1)
- **Padding**: `spacing-xl` (32px) desktop, `spacing-lg` (24px) mobile
- **Margin**: `spacing-xl` (32px) between cards desktop, `spacing-lg` (24px) mobile
- **Width**: Responsive - 100% on mobile, variable on desktop

### Content Areas
- **Header**: Optional area for title and actions
- **Body**: Main content area for information display
- **Footer**: Optional area for actions and metadata

## Card Variants

### Standard Card
- **Purpose**: General content display, risk summaries, information panels
- **Visual Specifications**:
  - Background: `#ffffff` (Background Primary)
  - Border: 1px solid `#e2e8f0` (Border Mid)
  - Box Shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1)
  - Padding: `spacing-xl` (32px)

- **Usage Examples**: Risk overview cards, dashboard summaries, informational content

### Highlighted Card
- **Purpose**: Important information, featured content, priority items
- **Visual Specifications**:
  - Background: `#f8fafc` (Background Secondary)
  - Border: 1px solid `#cbd5e1` (Border Strong)
  - Box Shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
  - Left Border: 4px solid `#2563eb` (Primary)
  - Padding: `spacing-xl` (32px)

- **Usage Examples**: Critical risks, important notifications, featured content

### Bordered Card
- **Purpose**: Content requiring clear separation from surroundings
- **Visual Specifications**:
  - Background: `#ffffff` (Background Primary)
  - Border: 2px solid `#94a3b8` (Border Weak)
  - Box Shadow: None
  - Padding: `spacing-xl` (32px)

- **Usage Examples**: Special instructions, standalone features, form sections

### Elevated Card
- **Purpose**: Content requiring more visual prominence
- **Visual Specifications**:
  - Background: `#ffffff` (Background Primary)
  - Border: 1px solid `#e2e8f0` (Border Mid)
  - Box Shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
  - Padding: `spacing-xl` (32px)

- **Usage Examples**: Modal content, important notifications, selection cards

## Card Content Structure

### Card Header
- **Visual Specifications**:
  - Border Bottom: 1px solid `#e2e8f0` (Border Mid)
  - Padding: `spacing-lg` `spacing-xl` `spacing-md` `spacing-xl`
  - Margin: 0 -`spacing-xl` -`spacing-md` -`spacing-xl` (for border alignment)

- **Content Elements**:
  - **Title**: H4 or H5 style text, `#0f172a` (Text High), bold
  - **Subtitle**: Body Small style text, `#64748b` (Text Low)
  - **Actions**: Button group aligned to right, `spacing-md` from content

### Card Body
- **Visual Specifications**:
  - Padding: `spacing-xl` (32px) all around
  - Content spacing: `spacing-md` (16px) between elements

- **Content Elements**:
  - Paragraphs: Body style text, `#334155` (Text Mid), line-height 1.5
  - Lists: Appropriate spacing, consistent with design system
  - Images: Responsive, proper aspect ratio maintenance

### Card Footer
- **Visual Specifications**:
  - Border Top: 1px solid `#e2e8f0` (Border Mid)
  - Padding: `spacing-lg` `spacing-xl` `spacing-xl` `spacing-xl`
  - Margin: -`spacing-md` -`spacing-xl` 0 -`spacing-xl` (for border alignment)

- **Content Elements**:
  - **Actions**: Primary and secondary buttons
  - **Metadata**: Timestamps, authors, other information
  - **Links**: Secondary links with appropriate styling

## Interactive Card Specifications

### Hover State
- **Effect**: Slight elevation increase
- **Box Shadow**: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
- **Transition**: 250ms ease-out
- **Cursor**: Pointer (when clickable)

### Active State
- **Effect**: Subtle scale and shadow
- **Transform**: scale(0.98)
- **Box Shadow**: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
- **Transition**: 150ms spring

### Focus State
- **Indicator**: 2px solid `#2563eb` with 2px offset
- **Border Radius**: Matches card border-radius
- **Compliance**: WCAG AA contrast standards

### Selected State
- **Border**: 1px solid `#2563eb` (Primary)
- **Box Shadow**: 0 0 0 3px rgba(37, 99, 235, 0.1)
- **Background**: `#f0f9ff` (Primary lightened)

## Card-Specific States

### Loading State
- **Visual Specifications**:
  - Content: Skeleton loading placeholders
  - Background: Animated gradient from `#f1f5f9` to `#e2e8f0`
  - Animation: Gradient sweep from left to right over 1.5s

### Empty State
- **Visual Specifications**:
  - Icon: Relevant empty state icon
  - Title: Clear heading explaining empty state
  - Description: Helpful text with next steps
  - Action: Primary button to add content

### Error State
- **Visual Specifications**:
  - Border: 1px solid `#ef4444` (Error)
  - Icon: Error icon in `#ef4444`
  - Content: Error message in `#ef4444`
  - Action: Button to retry or fix

## Risk-Specific Card Patterns

### Risk Summary Card
- **Header**: Risk title, status indicator, risk score badge
- **Body**: Risk description, probability, impact, category
- **Footer**: Action buttons (edit, delete), metadata

### Risk Matrix Card
- **Header**: Probability-impact matrix title
- **Body**: Interactive chart with risk positioning
- **Footer**: Filter controls, legend

### Risk Detail Card
- **Header**: Risk name, breadcrumb navigation
- **Body**: Detailed risk information with formatted content
- **Footer**: Action buttons, related risks section

## Responsive Card Behavior

### Mobile (320px - 767px)
- **Width**: 100% - (2 × `spacing-lg`) to account for page padding
- **Padding**: `spacing-lg` (24px) instead of `spacing-xl` (32px)
- **Actions**: May convert to full-width buttons
- **Content**: Simplified with reduced detail
- **Spacing**: Reduced between cards to preserve space

### Tablet (768px - 1023px)
- **Width**: Responsive grid that accommodates 2 cards in a row
- **Padding**: Standard `spacing-xl` (32px)
- **Actions**: May stack vertically if horizontal space is limited
- **Content**: Moderate level of detail
- **Spacing**: Standard between cards

### Desktop (1024px+)
- **Width**: Responsive grid that accommodates 3-4 cards in a row
- **Padding**: Standard `spacing-xl` (32px)
- **Actions**: Horizontal button group
- **Content**: Full level of detail
- **Spacing**: Standard between cards

## Card Groups and Grids

### Card Collections
- **Spacing**: Consistent margin between cards based on breakpoint
- **Alignment**: Left-aligned with consistent spacing
- **Wrapping**: Responsive wrapping based on available width
- **Gutters**: Consistent spacing in grid layouts

### Grid Specifications
- **Mobile**: Single column grid
- **Tablet**: Two column grid with equal width cards
- **Desktop**: Three or four column grid depending on content width
- **Gap**: `spacing-xl` (32px) between cards

## Accessibility Specifications

### Keyboard Navigation
- **Focus Management**: Clear focus indicator for keyboard users
- **Tab Order**: Logical navigation through card content
- **Action Keys**: Enter/Space to activate card if it functions as a link
- **Escape**: Close any opened card details

### Screen Reader Support
- **Semantic Structure**: Proper heading hierarchy within cards
- **Labels**: Clear labels for all interactive elements
- **Relationships**: Proper associations between related elements
- **Status Updates**: Announce state changes (loading, error)

### Touch Accessibility
- **Touch Targets**: All interactive elements meet minimum 44px × 44px requirement
- **Spacing**: Adequate spacing to prevent accidental activations
- **Gestures**: Support for swipe gestures in card carousels if implemented

## Usage Guidelines

### When to Use Card Components
- Displaying related information in a contained area
- Presenting multiple similar items (like risks) in a consistent format
- Providing a clear visual hierarchy within content
- Creating distinct sections within larger pages
- Responsive content layouts that adapt to different screen sizes

### When NOT to Use Card Components
- For single, simple pieces of information that don't need grouping
- When trying to force content into a card layout that doesn't naturally fit
- In situations where a simpler element (like a list item) would suffice
- When the card structure would create unnecessary visual complexity
- For primary navigation elements that need different affordances

### Best Practices
- Maintain consistent card spacing throughout the application
- Ensure cards have a clear, specific purpose
- Use appropriate card variant for the content type
- Include clear calls to action when users should interact
- Make cards responsive to different screen sizes
- Use visual hierarchy within cards to guide attention
- Ensure adequate touch targets for mobile devices

### Common Mistakes to Avoid
- Inconsistent card styling within the same context
- Cards with no clear primary action or purpose
- Insufficient spacing between cards
- Cards that are too cramped or too spacious
- Missing accessibility considerations
- Forcing unrelated content into a card structure
- Cards that break the design system's visual hierarchy
