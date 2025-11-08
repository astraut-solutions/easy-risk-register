---
title: Easy Risk Register - Form Components
description: Complete form component specifications with fields, validation, and usage guidelines
last-updated: 2025-11-08
version: 1.0.0
status: draft
---

# Easy Risk Register - Form Components

## Overview

Form components in the Easy Risk Register application provide structured data entry for risk management information. This includes input fields, selection controls, and validation mechanisms that guide users through creating and managing risk entries while maintaining data quality and user experience standards.

## Form Structure

### Form Container
- **Purpose**: Organize related form elements with consistent layout
- **Visual Specifications**:
  - Background: `#ffffff` (Background Primary)
  - Border: 1px solid `#e2e8f0` (Border Mid)
  - Border Radius: 8px
  - Padding: `spacing-xl` (32px) desktop, `spacing-lg` (24px) mobile
  - Box Shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1)

- **Layout**:
  - Vertical stacking for single-column layouts
  - Grid layout for multi-column forms
  - Consistent spacing between elements (varies by breakpoint)
  - Clear visual hierarchy with section dividers where needed

### Form Sections
- **Purpose**: Group related fields logically
- **Visual Specifications**:
  - Section Header: H3 style with top margin of `spacing-xl`
  - Section Content: Standard vertical spacing of `spacing-md` between fields
  - Section Divider: 1px solid `#e2e8f0` when needed for visual separation
  - Optional: Collapsible sections for advanced options

## Input Field Specifications

### Text Input
- **Visual Specifications**:
  - Height: 44px minimum (for accessibility)
  - Width: 100% of container
  - Background: `#ffffff` (Background Primary)
  - Border: 1px solid `#cbd5e1` (Border Strong)
  - Border Radius: 6px
  - Padding: `spacing-sm` (8px) vertical, `spacing-md` (16px) horizontal
  - Text Color: `#0f172a` (Text High)
  - Font Size: 1rem (16px)

- **States**:
  - **Default**: Standard border color
  - **Hover**: Border color darkens slightly
  - **Focus**: Border becomes `#2563eb` (Primary) with subtle shadow
  - **Error**: Border becomes `#ef4444` (Error) with error icon
  - **Disabled**: Background becomes `#f8fafc`, text color `#94a3b8`

### Textarea
- **Visual Specifications**:
  - Height: 120px minimum (adjustable)
  - Width: 100% of container
  - Background: `#ffffff` (Background Primary)
  - Border: 1px solid `#cbd5e1` (Border Strong)
  - Border Radius: 6px
  - Padding: `spacing-md` (16px)
  - Text Color: `#0f172a` (Text High)
  - Font Size: 1rem (16px)
  - Font Family: inherit for consistency

- **States**: Same as text input with additional resize handle

### Dropdown/Select
- **Visual Specifications**:
  - Height: 44px minimum (for accessibility)
  - Width: 100% of container
  - Background: `#ffffff` (Background Primary) with dropdown arrow
  - Border: 1px solid `#cbd5e1` (Border Strong)
  - Border Radius: 6px
  - Padding: `spacing-sm` (8px) vertical, `spacing-md` (16px) horizontal
  - Text Color: `#0f172a` (Text High)
  - Font Size: 1rem (16px)

- **Dropdown Options**:
  - Background: `#ffffff` (Background Primary)
  - Hover State: `#f1f5f9` (Background Tertiary)
  - Selected State: `#e0f2fe` (Primary Light with opacity)
  - Border: 1px solid `#e2e8f0` (Border Mid)
  - Border Radius: 4px
  - Max Height: 200px with scroll

## Form Labels

### Field Labels
- **Visual Specifications**:
  - Text Color: `#334155` (Text Mid)
  - Font Size: 0.875rem (14px)
  - Font Weight: 600 (Semibold)
  - Line Height: 1.43
  - Margin Bottom: `spacing-sm` (8px)
  - Required Indicator: Red asterisk (*) next to label

- **Positioning**:
  - Above the input field (for most fields)
  - Left of the input for inline forms (when space permits)
  - Always adjacent to the associated input

### Legend for Fieldsets
- **Visual Specifications**:
  - Text Color: `#0f172a` (Text High)
  - Font Size: 1rem (16px)
  - Font Weight: 600 (Semibold)
  - Line Height: 1.5
  - Position: Top-left of fieldset
  - Margin: `spacing-md` below legend

## Helper Text and Instructions

### Helper Text
- **Purpose**: Provide additional context or instructions for fields
- **Visual Specifications**:
  - Text Color: `#64748b` (Text Low)
  - Font Size: 0.875rem (14px)
  - Line Height: 1.43
  - Position: Below the input field
  - Margin Top: `spacing-sm` (8px)

### Validation Messages
- **Purpose**: Communicate errors or successful validation
- **Visual Specifications**:
  - Text Color: `#ef4444` (Error) for errors, `#10b981` (Success) for success
  - Font Size: 0.875rem (14px)
  - Line Height: 1.43
  - Position: Below the input field
  - Margin Top: `spacing-sm` (8px)
  - Icon: Appropriate icon (exclamation for error, check for success)

## Form Controls

### Checkboxes
- **Visual Specifications**:
  - Size: 20px × 20px
  - Border: 1px solid `#94a3b8` (Border Weak)
  - Background: `#ffffff` (Background Primary)
  - Border Radius: 4px
  - Checked Background: `#2563eb` (Primary)
  - Checked Border: `#2563eb` (Primary)
  - Checkmark: White with stroke width of 2px

- **States**:
  - **Default**: Standard border and background
  - **Hover**: Border color darkens slightly
  - **Focus**: 2px ring around checkbox with `#2563eb`
  - **Checked**: Solid primary color with white checkmark
  - **Indeterminate**: Horizontal line in center with primary color

### Radio Buttons
- **Visual Specifications**:
  - Size: 20px × 20px
  - Border: 1px solid `#94a3b8` (Border Weak)
  - Background: `#ffffff` (Background Primary)
  - Border Radius: 50% (full circle)
  - Selected Background: `#2563eb` (Primary)
  - Selected Border: `#2563eb` (Primary)

- **States**:
  - **Default**: Standard border and background
  - **Hover**: Border color darkens slightly
  - **Focus**: 2px ring around radio button with `#2563eb`
  - **Selected**: Solid primary dot in center of button

### Toggle Switches
- **Visual Specifications**:
  - Width: 44px, Height: 24px
  - Track Background: `#cbd5e1` (Border Strong)
  - Track Border Radius: 12px (capsule shape)
  - Thumb Background: `#ffffff` (Background Primary)
  - Thumb Size: 20px diameter
  - Thumb Border: 1px solid `#94a3b8` (Border Weak)
  - Thumb Border Radius: 50%
  - Active Track Background: `#2563eb` (Primary)

- **States**:
  - **Off**: Light track with dark thumb
  - **On**: Dark thumb with primary track
  - **Focus**: 2px ring around entire switch
  - **Disabled**: Opacity reduced to 50%

## Form Actions

### Submit Button
- **Visual Specifications**:
  - Style: Primary button variant
  - Position: Bottom of form, right-aligned
  - Width: Auto (content-based)
  - Minimum 44px height
  - Appropriate spacing from form content

### Secondary Actions
- **Visual Specifications**:
  - Style: Secondary or Ghost button variant
  - Position: Bottom of form, left-aligned or in-line with submit
  - Width: Auto (content-based)
  - Appropriate spacing from submit button

## Validation Patterns

### Real-time Validation
- **Trigger**: On blur for most fields, on input for complex validations
- **Feedback**: Visual changes to input border and helper text
- **Timing**: Immediate feedback with debounce for performance

### Summary Validation
- **Trigger**: On form submission or explicit validation request
- **Display**: At top of form or section with list of issues
- **Navigation**: Links to specific problematic fields

### Inline Validation
- **Display**: Directly below the relevant field
- **Persistence**: Remains visible during focus unless resolved
- **Positioning**: Does not cause layout shift in most cases

## Accessibility Specifications

### Form Labeling
- Associate labels with inputs using `for` attribute and `id`
- Use `aria-describedby` for helper text and validation messages
- Include `aria-invalid` for fields with errors
- Use `aria-required` for required fields

### Keyboard Navigation
- Tab order follows visual order
- Clear focus indicators for all interactive elements
- Support for arrow keys in radio groups and dropdowns
- Form submission with Enter key in final field

### Screen Reader Support
- Form instructions announced clearly
- Error messages announced immediately after input
- Required fields indicated appropriately
- Field types and states announced

## Responsive Form Behavior

### Mobile (320px - 767px)
- Full-width inputs to maximize space
- Increased touch targets (minimum 44px)
- Stacked layout for all form elements
- Scrollable areas for complex forms
- Simplified validation display

### Tablet (768px - 1023px)
- May use two-column layouts for related fields
- Standard spacing with minor adjustments
- Consistent touch targets
- May include additional inline help

### Desktop (1024px+)
- Multi-column layouts where logically grouped
- More generous spacing for clarity
- Additional inline help options
- More complex validation messaging

## Form States

### Loading States
- Form disabled during data loading
- Loading indicators for specific fields when needed
- Preserve user input during load operations
- Clear loading indicators when complete

### Success States
- Visual confirmation of successful submission
- Temporary success messages
- Option to clear form or create another entry
- Smooth transitions from input to success state

### Error States
- Clear error indicators for problematic fields
- Helpful error messages that explain the issue and solution
- Maintain user input to prevent data loss
- Focus on first error field when possible

## Common Form Patterns

### Risk Creation Form
- Multi-step form for complex risk entry
- Required validation for essential fields
- Conditional fields based on selections
- Real-time risk scoring updates

### Filter and Search Forms
- Inline form elements with minimal chrome
- Clear visual separation from main content
- Easy reset functionality
- Responsive to different viewport sizes

### Settings Forms
- Grouped settings with clear section dividers
- Consistent control styles throughout
- Clear save/discard actions
- Visual feedback for saved changes

## Usage Guidelines

### When to Use Form Components
- Collecting user input for risk data
- Updating existing risk information
- Configuring application settings
- Filtering and searching data

### When NOT to Use Form Components
- When a single selection can be made differently
- When navigation is the primary goal
- For decorative or non-interactive elements
- When space constraints prevent proper form layout

### Best Practices
- Use appropriate input types (email, number, etc.)
- Provide clear, concise labels
- Include helpful placeholder text when appropriate
- Validate input in real-time where possible
- Group related fields logically
- Make required fields clear
- Provide clear feedback after submission

### Common Mistakes to Avoid
- Missing required field indicators
- Inconsistent validation across forms
- Unclear error messages
- Insufficient spacing between form elements
- Forgetting to test with assistive technologies
- Auto-focusing on forms without user intent