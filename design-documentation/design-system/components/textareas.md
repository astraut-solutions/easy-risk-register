---
title: Easy Risk Register - Textarea Component
description: Complete textarea component specifications with variants, states, and usage guidelines
last-updated: 2025-11-10
version: 1.0.0
status: draft
---

# Easy Risk Register - Textarea Component

## Overview

Textarea components in the Easy Risk Register application provide multi-line text input for longer form content, such as risk descriptions, notes, and detailed explanations. This component allows users to enter and edit larger amounts of text with proper formatting and validation capabilities.

## Component Specifications

### Base Textarea
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
  - Line Height: 1.5
  - Resize: Vertical only (default) or none based on context

- **Content Area**:
  - Proper text wrapping
  - Support for multiple lines
  - Scrollable when content exceeds visible area
  - Consistent character spacing and line height

## Textarea Variants

### Default Textarea
- **Purpose**: General multi-line text input for most use cases
- **Visual Specifications**:
  - Standard height: 120px
  - Background: `#ffffff` (Background Primary)
  - Border: 1px solid `#cbd5e1` (Border Strong)
  - Border Radius: 6px
  - Padding: `spacing-md` (16px)
  - Text Color: `#0f172a` (Text High)
  - Placeholder: `#94a3b8` (Text Muted)

- **Usage Examples**: Risk description, notes, comments, detailed explanations

### Small Textarea
- **Purpose**: Compact multi-line input for shorter content
- **Visual Specifications**:
  - Height: 80px
  - Same styling as default
  - Smaller area for content that doesn't require extensive space
  - Appropriate for brief notes or summaries

- **Usage Examples**: Brief summary, short notes, caption text

### Large Textarea
- **Purpose**: Expanded input area for detailed content
- **Visual Specifications**:
  - Height: 200px
  - Same styling as default
  - More space for comprehensive input
  - Good for detailed descriptions or extensive notes

- **Usage Examples**: Detailed risk analysis, comprehensive notes, report content

### Full-Height Textarea
- **Purpose**: Maximum space utilization for content-heavy applications
- **Visual Specifications**:
  - Height: 300px or flex-grow to fill available space
  - Same styling as default
  - Maximum room for detailed content input
  - Typically used in dedicated note-taking areas

- **Usage Examples**: Note-taking applications, detailed documentation, reports

## Textarea States

### Default State
- Standard border color `#cbd5e1`
- Background `#ffffff`
- Text color `#0f172a`
- No resize handles visible (by default)
- Placeholder text in muted color

### Hover State
- Border color darkens slightly to `#94a3b8`
- Background remains `#ffffff`
- No change to text color
- Resize handle appears if resizable

### Focus State
- Border becomes `#2563eb` (Primary) with subtle shadow
- Subtle box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1)
- Focus ring: 2px solid `#2563eb` with 2px offset
- Complies with WCAG AA standards
- Placeholder may fade slightly

### Error State
- Border becomes `#ef4444` (Error)
- No subtle shadow
- Error icon appears (optional)
- Error message displayed below field
- Text color may remain the same or change to `#991b1b` for emphasis

### Disabled State
- Background becomes `#f8fafc`
- Text color becomes `#94a3b8`
- Border color becomes `#e2e8f0`
- Cursor changes to "not-allowed"
- No interaction possible
- Placeholder text becomes invisible

### Loading State
- Background shows subtle loading animation
- Input disabled during loading
- May show loading indicator
- Preserve user input during load operations

## Textarea Sizes

### Small
- Height: 80px
- Font Size: 0.875rem (14px)
- Padding: 12px
- Border Radius: 4px

### Medium (Default)
- Height: 120px
- Font Size: 1rem (16px)
- Padding: 16px
- Border Radius: 6px

### Large
- Height: 200px
- Font Size: 1.125rem (18px)
- Padding: 20px
- Border Radius: 8px

### Full-Height
- Height: 300px or more
- Font Size: 1rem (16px)
- Padding: 16px
- Border Radius: 6px

## Placeholder and Content Specifications

### Placeholder Text
- **Visual Specifications**:
  - Text Color: `#94a3b8` (Text Muted)
  - Font Size: 1rem (16px) or inherit from parent
  - Font Style: Regular (not italic by default)
  - Behavior: Disappears when user starts typing

### Character Count
- **Visual Specifications**:
  - Position: Bottom-right of textarea container
  - Text Color: `#64748b` (Text Low)
  - Font Size: 0.75rem (12px)
  - Font Style: Regular
  - Format: "X/Y" where X is current and Y is max

### Content Display
- **Visual Specifications**:
  - Text Color: `#0f172a` (Text High)
  - Font Size: 1rem (16px)
  - Line Height: 1.5
  - Proper text wrapping
  - Consistent character spacing

## Auto-Grow Behavior

### Auto-Grow Textarea
- **Purpose**: Automatically adjusts height based on content
- **Visual Specifications**:
  - Minimum height: 120px
  - Maximum height: 300px (before scrolling)
  - Smooth transition when height changes
  - No resize handle when auto-grow is enabled

- **Behavior**:
  - Expands as content is added
  - Contracts as content is removed
  - Maintains proper spacing and padding
  - Scrolls if content exceeds max height

## Interaction Specifications

### Focus Behavior
- **Duration**: Instant
- **Effect**: Border color change and shadow
- **Transition**: 150ms ease-out for shadow effect
- **Accessibility**: Clear focus indicator for keyboard users

### Resize Handles
- **Visibility**: Only visible when textarea is focused
- **Position**: Bottom-right corner
- **Style**: Default browser resize handle
- **Direction**: Vertical only (by default), or disabled entirely

### Scroll Behavior
- **Trigger**: Content exceeds visible height
- **Appearance**: Native scrollbar styling
- **Position**: Right side of textarea (when needed)
- **Accessibility**: Keyboard navigable

## Responsive Behavior

### Mobile (320px - 767px)
- **Width**: 100% of container minus padding
- **Padding**: `spacing-md` (16px) adjusted for smaller screens
- **Height**: May adjust to accommodate virtual keyboard
- **Touch Targets**: Consider adjacent elements when virtual keyboard appears
- **Scroll Behavior**: Optimized for touch scrolling

### Tablet (768px - 1023px)
- **Width**: 100% of container with proper margins
- **Height**: Standard sizes apply
- **Touch Targets**: Appropriate for touch interaction
- **Resize Behavior**: May be disabled for better mobile UX

### Desktop (1024px+)
- **Width**: 100% of container (with max-width considerations)
- **Height**: Full range of size options available
- **Resize Options**: Full resize functionality available
- **Focus Behavior**: Enhanced visual feedback

## Accessibility Specifications

### ARIA Attributes
- `aria-label` or associated `<label>` for proper labeling
- `aria-describedby` for helper text and validation messages
- `aria-invalid="true"` for fields with errors
- `aria-required="true"` for required fields
- `aria-multiline="true"` for screen reader identification

### Screen Reader Support
- Clear announcement of field purpose and current content
- Proper labeling with associated labels
- Announcements for validation messages
- Updates for character count (if implemented)
- Proper identification as multi-line input

### Keyboard Navigation
- Tab order follows logical sequence
- Arrow keys navigate within text
- Home/End keys navigate to beginning/end
- Ctrl+Up/Down for line-by-line navigation
- Proper focus management when field is required

## Validation and Constraints

### Character Limits
- **Maximum Characters**: Clear limit defined in configuration
- **Visual Indicator**: Character counter showing X/Y
- **Hard Limit**: Prevents typing beyond limit (with option to show warning)
- **Warning Range**: Visual change when near limit (e.g., yellow at 80%)

### Required Fields
- **Indicator**: Red asterisk next to label
- **Validation**: On blur or form submission
- **Error Message**: Clear, actionable message
- **Focus**: On error, focus returns to field

### Content Validation
- **Real-Time**: Validation for specific content types if applicable
- **On Submit**: Comprehensive validation when form is submitted
- **Error Display**: Below the textarea with clear error message
- **Correction**: Clear guidance for correcting errors

## Risk-Specific Usage

### Risk Description Textarea
- **Purpose**: Detailed description of the risk
- **Size**: Large variant (200px height)
- **Placeholder**: "Describe the risk in detail..."
- **Validation**: Minimum character count, required field

### Risk Impact Textarea
- **Purpose**: Detailed explanation of potential impact
- **Size**: Medium variant (120px height)
- **Placeholder**: "Explain the potential impact of this risk..."
- **Validation**: Required field

### Risk Mitigation Textarea
- **Purpose**: Strategies to mitigate the risk
- **Size**: Large variant (200px height)
- **Placeholder**: "List strategies to mitigate this risk..."
- **Validation**: Required field

## Usage Guidelines

### When to Use Textarea Components
- When users need to enter multi-line text content
- For detailed descriptions, notes, or explanations
- When text input exceeds what a single-line input can accommodate
- For content that benefits from text formatting capabilities

### When NOT to Use Textarea Components
- For single-line input (use text input instead)
- For numerical input (use number input instead)
- For content that requires specific formatting (use rich text editor)
- When space constraints make multi-line input impractical

### Best Practices
- Set appropriate initial height for expected content
- Use character limits appropriately
- Provide clear placeholders with example content
- Include helpful helper text when needed
- Implement proper validation and error handling
- Ensure proper accessibility attributes
- Consider auto-grow for better UX where appropriate
- Test with different content lengths and languages

### Common Mistakes to Avoid
- Fixed height that's too small for expected content
- Missing required field indicators
- Inadequate character count or validation
- Poor accessibility implementation
- Ignoring character encoding and line breaks
- Not handling long text properly for display

## Implementation Examples

### HTML Structure
```html
<!-- Standard textarea -->
<div class="textarea-wrapper">
  <label for="risk-description" class="textarea-label">Risk Description</label>
  <textarea 
    id="risk-description" 
    class="textarea textarea-default"
    placeholder="Describe the risk in detail..."
    rows="6"
    maxlength="500"
    aria-describedby="description-help description-count">
  </textarea>
  <div class="textarea-footer">
    <div id="description-help" class="help-text">Provide a detailed description of the risk</div>
    <div id="description-count" class="char-count">0/500</div>
  </div>
</div>

<!-- Required textarea with error -->
<div class="textarea-wrapper">
  <label for="risk-impact" class="textarea-label">Risk Impact *</label>
  <textarea 
    id="risk-impact" 
    class="textarea textarea-error"
    placeholder="Explain the potential impact..."
    rows="4"
    aria-describedby="impact-error"
    aria-invalid="true"
    required>
  </textarea>
  <div id="impact-error" class="error-text">Risk impact is required</div>
</div>
```

### CSS Classes
```css
.textarea-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.textarea {
  width: 100%;
  min-height: 120px;
  padding: 16px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background-color: #ffffff;
  color: #0f172a;
  font-size: 1rem;
  line-height: 1.5;
  resize: vertical;
  box-sizing: border-box;
  font-family: inherit;
}

.textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.textarea-error {
  border-color: #ef4444;
}

.textarea-error:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.textarea-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.char-count {
  font-size: 0.75rem;
  color: #64748b;
  margin-left: auto;
}