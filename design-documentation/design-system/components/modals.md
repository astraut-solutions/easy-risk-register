---
title: Easy Risk Register - Modal Components
description: Complete modal component specifications with patterns and usage guidelines
last-updated: 2025-11-08
version: 1.0.0
status: draft
---

# Easy Risk Register - Modal Components

## Overview

Modal components in the Easy Risk Register application provide focused interactions that temporarily block the main application flow to capture user input or display important information. These components create a clear separation from the main content while maintaining context and providing a controlled experience for completing specific tasks.

## Modal Base Specifications

### Visual Specifications
- **Overlay Background**: 50% opacity black (`rgba(0, 0, 0, 0.5)`)
- **Modal Background**: `#ffffff` (Background Primary)
- **Border**: 1px solid `#e2e8f0` (Border Mid)
- **Border Radius**: 8px
- **Box Shadow**: 0 25px 50px -12px rgba(0, 0, 0, 0.25)
- **Width**: 90% of viewport for mobile, 500px for desktop (max 90vw)
- **Max Height**: 90% of viewport with vertical centering
- **Z-Index**: 50 or higher to appear above all other content

### Content Areas
- **Header**: Title and close button area
- **Body**: Main content area for forms or information
- **Footer**: Action buttons with proper spacing

## Modal Variants

### Default Modal
- **Purpose**: General information display, forms, and confirmations
- **Visual Specifications**:
  - Width: 90% (mobile), 500px (desktop), max 90vw
  - Max Height: 90vh with vertical scrolling if needed
  - Background: `#ffffff` (Background Primary)
  - Border: 1px solid `#e2e8f0` (Border Mid)
  - Box Shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25)

- **Usage Examples**: Risk form, settings panel, confirmation dialogs

### Full-Screen Modal
- **Purpose**: Complex forms or detailed information requiring maximum space
- **Visual Specifications**:
  - Width: 100vw
  - Height: 100vh
  - Background: `#ffffff` (Background Primary)
  - Border: None
  - Box Shadow: None
  - Border Radius: 0

- **Usage Examples**: Detailed risk editor, full-screen image view

### Small Modal
- **Purpose**: Simple confirmations, alerts, quick actions
- **Visual Specifications**:
  - Width: 90% (mobile), 380px (desktop)
  - Max Height: 70vh
  - Background: `#ffffff` (Background Primary)
  - Border: 1px solid `#e2e8f0` (Border Mid)
  - Box Shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25)

- **Usage Examples**: Delete confirmations, simple alerts, quick settings

### Large Modal
- **Purpose**: Content-rich displays, complex forms, detailed information
- **Visual Specifications**:
  - Width: 90% (mobile), 800px (desktop), max 90vw
  - Max Height: 90vh
  - Background: `#ffffff` (Background Primary)
  - Border: 1px solid `#e2e8f0` (Border Mid)
  - Box Shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25)

- **Usage Examples**: Risk detail view, complex editor, reporting tool

## Modal Content Structure

### Modal Header
- **Visual Specifications**:
  - Height: 60px minimum
  - Padding: `spacing-lg` `spacing-xl`
  - Border Bottom: 1px solid `#e2e8f0` (Border Mid)
  - Background: `#ffffff` (Background Primary)

- **Content Elements**:
  - **Title**: H3 style text, `#0f172a` (Text High), bold
  - **Close Button**: Top-right corner, 44px × 44px touch target
  - **Icon**: Optional icon left of title, 24px × 24px

### Modal Body
- **Visual Specifications**:
  - Padding: `spacing-xl` (32px) desktop, `spacing-lg` (24px) mobile
  - Background: `#ffffff` (Background Primary)
  - Max Height: 60vh with vertical scrolling if needed
  - Overflow: Auto for content that exceeds available space

- **Content Elements**:
  - Forms with appropriate spacing
  - Information display with clear hierarchy
  - Interactive elements with proper affordances

### Modal Footer
- **Visual Specifications**:
  - Height: 72px minimum
  - Padding: `spacing-lg` `spacing-xl`
  - Border Top: 1px solid `#e2e8f0` (Border Mid)
  - Background: `#ffffff` (Background Primary)
  - Display: Flex with space-between or flex-end alignment

- **Content Elements**:
  - **Primary Action**: Right-aligned, primary button style
  - **Secondary Actions**: Left or right-aligned, secondary button style
  - **Progress Indicators**: For multi-step modals

## Interaction Specifications

### Entrance Animation
- **Type**: Fade and scale
- **Duration**: 250ms (medium)
- **Easing**: `cubic-bezier(0.34, 1.56, 0.64, 1)` (slightly elastic)
- **Transform**: Scale from 0.95 to 1 with fade from 0 to 1

### Exit Animation
- **Type**: Fade and scale
- **Duration**: 200ms (short)
- **Easing**: `cubic-bezier(0.4, 0, 1, 1)` (ease-in)
- **Transform**: Scale from 1 to 0.95 with fade from 1 to 0

### Overlay Interaction
- **Click Outside**: Closes modal when `dismissible` is true
- **Escape Key**: Closes modal with 200ms exit animation
- **Drag Gesture**: Not supported (could interfere with content)

## Modal States

### Loading State
- **Visual Specifications**:
  - Overlay with spinner in center of modal
  - Content area shows skeleton loader
  - Primary button disabled with loading indicator
  - Background: `#ffffff` with reduced opacity overlay

- **Behavior**:
  - Prevents user interaction with modal content
  - Maintains modal presence in UI
  - Shows loading indicator for operations

### Success State
- **Visual Specifications**:
  - Checkmark icon in success color
  - Success message with success color
  - Success-specific button label
  - Optional auto-dismiss after delay

- **Behavior**:
  - Clear visual feedback for successful actions
  - Option to remain open or auto-close
  - Clear next steps for the user

### Error State
- **Visual Specifications**:
  - Error icon in red (`#ef4444`)
  - Error message in red text
  - Error-specific button options
  - Maintains ability to correct and retry

- **Behavior**:
  - Clear information about what went wrong
  - Clear guidance for correction
  - Maintains ability to address the error

### Warning State
- **Visual Specifications**:
  - Warning icon in amber (`#f59e0b`)
  - Warning message in amber text
  - Appropriate action buttons for warning context
  - More prominent display than default

- **Behavior**:
  - Highlights potential issues or consequences
  - Requires explicit user confirmation
  - Clear information about implications

## Responsive Modal Behavior

### Mobile (320px - 767px)
- **Width**: 90% of viewport (with 16px minimum margins)
- **Height**: Responsive with max-height consideration
- **Padding**: `spacing-lg` (24px) instead of `spacing-xl` (32px)
- **Positioning**: Bottom-oriented with slide-up animation
- **Close Button**: Larger touch target (48px × 48px)
- **Actions**: Full-width buttons stacked vertically

### Tablet (768px - 1023px)
- **Width**: 90% of viewport or 500px (whichever is smaller)
- **Height**: Responsive with max-height of 80vh
- **Padding**: Standard `spacing-xl` (32px)
- **Positioning**: Centered vertically and horizontally
- **Close Button**: Standard 44px × 44px touch target
- **Actions**: Horizontal button group

### Desktop (1024px+)
- **Width**: Fixed 500px for default, appropriate width for variants
- **Height**: Responsive with max-height of 90vh
- **Padding**: Standard `spacing-xl` (32px)
- **Positioning**: Centered vertically and horizontally
- **Close Button**: Standard 44px × 44px touch target
- **Actions**: Horizontal button group

## Modal Content Types

### Form Modals
- **Purpose**: Collect user input in a focused environment
- **Specifications**:
  - Form fields with proper spacing and validation
  - Clear primary and secondary actions
  - Error handling with appropriate affordances
  - Loading states during form processing

### Confirmation Modals
- **Purpose**: Confirm important or destructive actions
- **Specifications**:
  - Clear description of the action to be taken
  - Prominent primary action (often destructive)
  - Clear secondary action (cancel or go back)
  - Appropriate icon to indicate action type

### Information Modals
- **Purpose**: Display detailed information without leaving context
- **Specifications**:
  - Well-formatted content display
  - Appropriate scrolling for long content
  - Clear action to close or proceed
  - Search or navigation within if needed

### Multi-Step Modals
- **Purpose**: Complex forms or wizards that require multiple steps
- **Specifications**:
  - Progress indicator showing current step
  - Clear navigation between steps
  - Ability to go back to previous steps
  - Summary or confirmation in final step

## Accessibility Specifications

### Keyboard Navigation
- **Focus Trap**: Keep focus within modal while open
- **Initial Focus**: Focus on first interactive element or modal container
- **Tab Order**: Logical navigation through modal content
- **Escape Key**: Close modal when pressed
- **Close Button**: Accessible via keyboard navigation

### Screen Reader Support
- **Announcement**: Modal content announced when opened
- **Labels**: Clear, descriptive labels for all elements
- **Relationships**: Proper associations between elements
- **States**: Announce modal state changes

### Touch Accessibility
- **Touch Targets**: All interactive elements meet minimum 44px × 44px
- **Close Areas**: Adequate touch target for close button
- **Swipe Gestures**: Not implemented (could interfere with content)
- **Voice Control**: Support for voice navigation commands

## Common Modal Patterns

### Risk Creation Modal
- **Header**: "Create New Risk" title with close button
- **Body**: Form with risk details (description, probability, impact, etc.)
- **Footer**: "Cancel" and "Create Risk" buttons with loading state
- **Validation**: Real-time feedback with error states

### Risk Confirmation Modal
- **Header**: Warning icon with "Delete Risk" title
- **Body**: Clear message about what will be deleted
- **Footer**: "Cancel" and "Delete" buttons with destructive styling
- **Secondary Info**: Additional details if needed

### Settings Modal
- **Header**: "Settings" title with close button
- **Body**: Form with configuration options
- **Footer**: "Cancel" and "Save Changes" buttons
- **Reset Option**: Additional link to reset settings

## Usage Guidelines

### When to Use Modal Components
- For focused interactions that require immediate attention
- When collecting information that doesn't require a full page
- For confirmations of important or destructive actions
- To display detailed information without losing context
- When multi-step processes need to be contained

### When NOT to Use Modal Components
- For primary navigation or main application content
- When the interaction doesn't require a focused context
- For content that users might want to reference while doing other tasks
- When a simple inline interaction would suffice
- For mobile when a full-screen view might be more appropriate

### Best Practices
- Use appropriate modal size for the content and context
- Always provide clear ways to exit the modal
- Maintain visual hierarchy and design system consistency
- Implement proper accessibility considerations
- Test on all supported devices and screen sizes
- Use loading states for operations that might take time
- Provide clear primary and secondary actions

### Common Mistakes to Avoid
- Using modals for primary navigation
- Modals without clear exit strategies
- Inconsistent styling with design system
- Missing accessibility considerations
- Modals that are too large or too small for content
- Not handling keyboard navigation properly
- Opening multiple overlapping modals