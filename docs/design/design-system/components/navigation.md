---
title: Easy Risk Register - Navigation Components
description: Complete navigation component specifications with patterns and usage guidelines
last-updated: 2025-11-08
version: 1.0.0
status: draft
---

# Easy Risk Register - Navigation Components

## Overview

Navigation components in the Easy Risk Register application provide consistent pathways for users to move between different sections and views. These components ensure users can efficiently access all features while maintaining spatial awareness of their location within the application.

## Header Navigation

### Main Header
- **Visual Specifications**:
  - Height: 64px
  - Background: `#ffffff` (Background Primary)
  - Border: 1px solid `#e2e8f0` (Border Mid)
  - Box Shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
  - Padding: 0 `spacing-xl` (32px)

- **Content Layout**:
  - Left: Application logo and name (desktop), menu icon (mobile)
  - Center: Optional page title (on mobile)
  - Right: User controls, settings, help

- **Responsive Behavior**:
  - Desktop: Full logo, navigation menu, all controls visible
  - Tablet: May collapse navigation to icons only
  - Mobile: Hamburger menu, page title centered, minimal controls

### Navigation Menu
- **Visual Specifications**:
  - Background: `#ffffff` (Background Primary)
  - Height: 64px
  - Border: None
  - Text Color: `#64748b` (Text Low) for inactive, `#2563eb` (Primary) for active

- **Menu Items**:
  - Height: 40px minimum (accessibility)
  - Padding: 0 `spacing-md` (16px)
  - Text Color: `#64748b` (Text Low) for default, `#2563eb` (Primary) for active
  - Font Size: 0.875rem (14px)
  - Font Weight: 500 (Medium)
  - Border Radius: 6px for active state

- **Active State**:
  - Background: `#dbeafe` (Primary Light)
  - Border Left: 3px solid `#2563eb` (Primary)
  - Text Color: `#2563eb` (Primary)
  - Font Weight: 600 (Semibold)

## Sidebar Navigation

### Collapsible Sidebar
- **Visual Specifications**:
  - Width: 280px (expanded), 80px (collapsed)
  - Background: `#ffffff` (Background Primary)
  - Border: 1px solid `#e2e8f0` (Border Mid)
  - Height: 100vh (full viewport height)

- **Content Layout**:
  - Top: App logo and expand/collapse toggle
  - Middle: Navigation items with icons and text (expanded) or icons only (collapsed)
  - Bottom: User profile, settings, and help

- **Navigation Items**:
  - Height: 48px minimum (accessibility)
  - Padding: `spacing-sm` `spacing-md` (expanded), `spacing-md` (collapsed)
  - Text Color: `#64748b` (Text Low) for default, `#2563eb` (Primary) for active
  - Font Size: 0.875rem (14px)
  - Icon Size: 20px × 20px
  - Border Radius: 6px for hover/active states

- **Active State**:
  - Background: `#dbeafe` (Primary Light)
  - Text Color: `#2563eb` (Primary)
  - Icon Color: `#2563eb` (Primary)

### Navigation Item States
- **Default**: Text `#64748b`, Icon `#64748b`
- **Hover**: Background `#f8fafc`, Text `#334155`, Icon `#334155`
- **Active**: Background `#dbeafe`, Text `#2563eb`, Icon `#2563eb`
- **Focus**: 2px ring with `#2563eb` color
- **Disabled**: Opacity 0.5, not clickable

## Breadcrumb Navigation

### Breadcrumb Trail
- **Visual Specifications**:
  - Height: Auto (typically 24px)
  - Padding: `spacing-sm` 0
  - Text Color: `#64748b` (Text Low)
  - Font Size: 0.875rem (14px)
  - Line Height: 1.43

- **Separator**:
  - Character: " / " (slash with spaces)
  - Color: `#94a3b8` (Border Weak)
  - Font Size: 0.875rem (14px)

- **Links**:
  - Text Color: `#2563eb` (Primary) for links
  - Text Color: `#64748b` (Text Low) for current page
  - Hover: Underline, Text Color darkens to `#1d4ed8`
  - Focus: Underline, 2px ring with `#2563eb`

## Tab Navigation

### Horizontal Tabs
- **Visual Specifications**:
  - Height: 44px minimum
  - Background: `#ffffff` (Background Primary)
  - Border: 1px solid `#e2e8f0` (Border Mid) at bottom
  - Space between: `spacing-xs` (4px)

- **Tab Items**:
  - Padding: 0 `spacing-lg` (24px)
  - Text Color: `#64748b` (Text Low) for inactive, `#2563eb` (Primary) for active
  - Font Size: 0.875rem (14px)
  - Font Weight: 500 (Medium)
  - Border Radius: 6px 6px 0 0 (for bottom connection)

- **Active State**:
  - Border: 1px solid `#e2e8f0` (Border Mid) on top, left, right
  - Border: None at bottom (connects to content)
  - Background: `#ffffff` (Background Primary)
  - Text Color: `#2563eb` (Primary)
  - Font Weight: 600 (Semibold)
  - Border Bottom: 2px solid `#2563eb` (Primary)

- **Hover State**:
  - Background: `#f8fafc` (Background Secondary)
  - No change to active tabs

## Vertical Navigation

### Vertical Menu
- **Visual Specifications**:
  - Width: 240px
  - Background: `#ffffff` (Background Primary)
  - Border: 1px solid `#e2e8f0` (Border Mid)

- **Menu Items**:
  - Height: 44px minimum (accessibility)
  - Padding: `spacing-sm` `spacing-md`
  - Text Color: `#64748b` (Text Low) for default, `#2563eb` (Primary) for active
  - Font Size: 0.875rem (14px)
  - Border Radius: 6px for active/hover

- **Group Labels**:
  - Text Color: `#94a3b8` (Text Muted)
  - Font Size: 0.75rem (12px)
  - Font Weight: 600 (Semibold)
  - Text Transform: uppercase
  - Letter Spacing: 0.05em
  - Margin: `spacing-lg` `spacing-md` `spacing-sm`

- **Active State**:
  - Background: `#dbeafe` (Primary Light)
  - Text Color: `#2563eb` (Primary)
  - Border Left: 3px solid `#2563eb` (Primary)

## Mobile Navigation

### Hamburger Menu
- **Button Specifications**:
  - Size: 44px × 44px (touch target)
  - Padding: `spacing-sm`
  - Background: transparent
  - Icon: Hamburger icon when closed, X icon when open
  - Focus: 2px ring with `#2563eb`

- **Drawer Specifications**:
  - Width: 85% of viewport or 300px (whichever is smaller)
  - Background: `#ffffff` (Background Primary)
  - Position: Fixed, covering the main content
  - Overlay: 50% black background when open
  - Animation: Slide in from left, 250ms ease-out

- **Drawer Content**:
  - Header: App logo and close button
  - Navigation: Main navigation items as full-width buttons
  - Footer: User controls and settings

## Navigation States

### Active State Indicators
- **Primary Highlight**: Background color change for active item
- **Visual Cue**: Left border or bottom border for active item
- **Color Change**: Text color shifts to primary color
- **Icon Emphasis**: Icons in active state use primary color

### Hover States
- **Background**: Subtle color change (`#f8fafc`)
- **Cursor**: Pointer cursor for clickable items
- **Transition**: 150ms spring easing
- **Accessibility**: No hover states on touch devices

### Focus States
- **Indicator**: 2px solid `#2563eb` ring
- **Offset**: 2px from element edge
- **Radius**: Matches element border-radius
- **Accessibility**: Comply with WCAG AA contrast requirements

## Responsive Navigation Patterns

### Desktop (1024px+)
- **Layout**: Header with horizontal navigation, sidebar for primary navigation
- **Behavior**: Always visible navigation elements
- **Interaction**: Hover states available
- **Space**: Full navigation with text labels and icons

### Tablet (768px - 1023px)
- **Layout**: Header with horizontal navigation or collapsible sidebar
- **Behavior**: May adapt based on available space
- **Interaction**: Touch-friendly with adequate spacing
- **Space**: May reduce to icons with tooltips

### Mobile (320px - 767px)
- **Layout**: Header with menu icon, drawer navigation
- **Behavior**: Collapsed navigation by default
- **Interaction**: Touch-first interactions
- **Space**: Full-screen navigation overlay

## Accessibility Specifications

### Keyboard Navigation
- **Tab Order**: Logical, following visual order of elements
- **Skip Links**: "Skip to content" for main content navigation
- **Arrow Keys**: For navigating between menu items in dropdowns
- **Enter/Space**: Activate navigation links
- **Escape**: Close open dropdowns or mobile menus

### Screen Reader Support
- **Landmarks**: Use navigation, main, header ARIA roles
- **Labels**: Clear, descriptive labels for all navigation elements
- **Current Page**: Indicate current page with `aria-current="page"`
- **Expanded/Collapsed**: Use `aria-expanded` for collapsible navigation

### Touch Accessibility
- **Touch Targets**: Minimum 44px × 44px for all interactive elements
- **Close Areas**: Adequate spacing to prevent accidental taps
- **Gestures**: Support swipe gestures where appropriate
- **Haptic Feedback**: Consider for important navigation actions

## Common Navigation Patterns

### Dashboard Navigation
- **Primary**: Sidebar with main sections (Dashboard, Risks, Reports, Settings)
- **Secondary**: Breadcrumbs for location context
- **Contextual**: Page-specific navigation for related actions

### Risk Management Navigation
- **Primary**: Create new risk, filter options, sort controls
- **Secondary**: Category filters, status indicators
- **Contextual**: Actions related to selected risks

### Settings Navigation
- **Primary**: Settings sections (General, Display, Export, Security)
- **Secondary**: Save/cancel actions
- **Contextual**: Help and support links

## Usage Guidelines

### When to Use Navigation Components
- Moving between major sections of the application
- Providing consistent access to primary functions
- Maintaining user orientation within the application
- Offering quick access to frequently used features

### When NOT to Use Navigation Components
- When content is self-contained and doesn't require navigation
- For decorative purposes without functional navigation
- When a single-step process doesn't need navigation
- In contexts where navigation would be redundant

### Best Practices
- Maintain consistent navigation structure throughout the application
- Use clear, descriptive labels for all navigation items
- Provide visual feedback for current location
- Ensure adequate spacing for touch targets
- Implement proper accessibility features
- Test navigation on all supported devices

### Common Mistakes to Avoid
- Inconsistent navigation structure across pages
- Unclear labels that don't describe the destination
- Missing active state indicators
- Navigation items that don't respond to interaction
- Inadequate touch targets on mobile devices
- Forgetting to test keyboard navigation
- Missing accessibility attributes