---
title: Easy Risk Register - Select Component
description: Complete select component specifications with variants, states, and usage guidelines
last-updated: 2025-11-10
version: 1.0.0
status: draft
---

# Easy Risk Register - Select Component

## Overview

Select components in the Easy Risk Register application provide users with a way to choose from a list of predefined options. These components are essential for forms where users need to select categories, status values, risk levels, or other standardized options. The select component offers both single and multiple selection capabilities.

## Component Specifications

### Base Select
- **Visual Specifications**:
  - Height: 44px minimum (for accessibility)
  - Width: 100% of container or content-based
  - Background: `#ffffff` (Background Primary) with dropdown arrow
  - Border: 1px solid `#cbd5e1` (Border Strong)
  - Border Radius: 6px
  - Padding: `spacing-sm` (8px) vertical, `spacing-md` (16px) horizontal, `spacing-xl` (32px) right (for arrow)
  - Text Color: `#0f172a` (Text High)
  - Font Size: 1rem (16px)
  - Appearance: Custom-styled native select with proper dropdown arrow

- **Dropdown Options**:
  - Background: `#ffffff` (Background Primary)
  - Hover State: `#f1f5f9` (Background Tertiary)
  - Selected State: `#e0f2fe` (Primary Light with opacity)
  - Border: 1px solid `#e2e8f0` (Border Mid)
  - Border Radius: 4px
  - Max Height: 200px with scroll
  - Option Padding: `spacing-sm` (8px)
  - Option Font Size: 1rem (16px)

## Select Variants

### Default Select
- **Purpose**: Standard single selection from a list of options
- **Visual Specifications**:
  - Same as base specifications
  - Dropdown arrow: Downward caret icon
  - Placeholder text: `#94a3b8` (Text Muted)

- **Usage Examples**: Select risk category, priority level, status, assigned user

### Multi-Select
- **Purpose**: Allow users to select multiple options from a list
- **Visual Specifications**:
  - Height: Variable based on selected options (minimum 44px)
  - Display: Shows selected options as compact tags within the field
  - Background: `#ffffff` (Background Primary)
  - Border: 1px solid `#cbd5e1` (Border Strong)
  - Border Radius: 6px
  - Tag Background: `#f1f5f9` (Background Tertiary)
  - Tag Text: `#475569` (Text Mid)
  - Tag Padding: `spacing-xs` `spacing-sm`
  - Tag Border Radius: 4px

- **Usage Examples**: Select multiple risk tags, categories, or stakeholders

### Searchable Select
- **Purpose**: Allow users to search within a long list of options
- **Visual Specifications**:
  - Includes search input at top of dropdown
  - Search Input: `#f8fafc` background, `#0f172a` text
  - Search Icon: `#64748b` positioned to the left
  - Clear Button: `#94a3b8` "X" icon positioned to the right
  - Filtered Results: Matching text highlighted

- **Usage Examples**: Selecting from long lists like project names or user names

## Select States

### Default State
- Standard appearance with border color `#cbd5e1`
- Placeholder text visible if no selection made
- Properly positioned dropdown arrow
- Content area ready for user interaction

### Hover State
- Border color darkens to `#94a3b8`
- Background color remains `#ffffff`
- No change to text color
- Dropdown arrow darkens slightly

### Focus State
- Border becomes `#2563eb` (Primary) with subtle shadow
- Subtle box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1)
- Focus ring: 2px solid `#2563eb` with 2px offset
- Complies with WCAG AA standards

### Error State
- Border becomes `#ef4444` (Error)
- Dropdown arrow becomes `#ef4444`
- No subtle shadow
- Error icon appears (optional)
- Error message below field

### Disabled State
- Background becomes `#f8fafc`
- Text color becomes `#94a3b8`
- Border color becomes `#e2e8f0`
- Cursor changes to "not-allowed"
- No dropdown interaction possible

### Loading State
- Spinner icon appears (optional)
- Text color remains consistent but with loading indicator
- Interaction disabled during loading
- Background color remains consistent

## Select Sizes

### Small
- Height: 32px
- Font Size: 0.875rem (14px)
- Horizontal Padding: 12px
- Vertical Padding: 4px
- Border Radius: 4px
- Right Padding: 24px (for arrow)

### Medium (Default)
- Height: 44px
- Font Size: 1rem (16px)
- Horizontal Padding: 16px
- Vertical Padding: 8px
- Border Radius: 6px
- Right Padding: 32px (for arrow)

### Large
- Height: 52px
- Font Size: 1.125rem (18px)
- Horizontal Padding: 24px
- Vertical Padding: 12px
- Border Radius: 8px
- Right Padding: 40px (for arrow)

## Option Specifications

### Standard Options
- **Visual Specifications**:
  - Height: 40px minimum (for accessibility)
  - Padding: `spacing-sm` (8px) horizontal, `spacing-md` (16px) vertical
  - Text Color: `#0f172a` (Text High)
  - Font Size: 1rem (16px)
  - Background: `#ffffff` (Background Primary)

### Hover State Options
- Background: `#f1f5f9` (Background Tertiary)
- Text Color: `#0f172a` (Text High)
- No text decoration

### Selected State Options
- Background: `#e0f2fe` (Primary Light)
- Text Color: `#0f172a` (Text High)
- Checkmark icon (left-aligned) for single select
- Checkmark icon (left-aligned) for selected multi-select options

### Disabled Options
- Text Color: `#94a3b8` (Text Muted)
- Background: `#ffffff` (Background Primary)
- Not selectable
- Cursor: not-allowed

## Grouped Options

### Option Groups
- **Visual Specifications**:
  - Group Label: `#64748b` (Text Mid), 0.75rem font, uppercase
  - Group Border: Top border `#e2e8f0` (Border Mid)
  - Group Padding: `spacing-md` (16px) bottom
  - Option Padding: `spacing-sm` (8px) horizontal, `spacing-md` (16px) vertical

- **Usage**: For organizing options into logical categories

## Placeholder and Empty States

### Placeholder Text
- **Visual Specifications**:
  - Text Color: `#94a3b8` (Text Muted)
  - Font Size: 1rem (16px) or inherit from parent
  - Font Style: Regular (not italic by default)
  - Behavior: Disappears when selection is made

### Empty State (Searchable)
- **Visual Specifications**:
  - Text: "No options match your search"
  - Text Color: `#94a3b8` (Text Muted)
  - Font Size: 0.875rem (14px)
  - Padding: `spacing-lg` (24px) all around
  - Centered content

## Interaction Specifications

### Dropdown Behavior
- **Opening**: On click or arrow key interaction
- **Position**: Below select (flips above if insufficient space)
- **Width**: Matches select width or content width (whichever is greater)
- **Animation**: 150ms fade-in with subtle scale
- **Closing**: On option selection, outside click, or escape key

### Keyboard Navigation
- **Arrow Keys**: Navigate through options
- **Enter/Space**: Select highlighted option
- **Escape**: Close dropdown without selection
- **Typing**: Filter options if searchable
- **Tab**: Move to next focusable element

### Hover Feedback
- **Duration**: Instant
- **Effect**: Background change on option hover
- **Accessibility**: Visual only, no movement that could interfere with selection

## Responsive Behavior

### Mobile (320px - 767px)
- **Modal Behavior**: Full-screen overlay with search header
- **Touch Targets**: Minimum 44px × 44px for options
- **Positioning**: Bottom sheet or full-screen depending on options count
- **Search**: Prominent search bar for long option lists

### Tablet (768px - 1023px)
- **Dropdown Position**: May appear in modal for complex options
- **Touch Targets**: Standard 44px × 44px minimum
- **Width**: Full width of select or container

### Desktop (1024px+)
- **Dropdown Position**: Below or above select depending on space
- **Width**: Matches select width or content width
- **Hover States**: Available for all interactive elements

## Accessibility Specifications

### ARIA Attributes
- `role="combobox"` for the select element
- `aria-expanded="true/false"` for dropdown state
- `aria-haspopup="listbox"` indicating dropdown content
- `aria-owns` for accessibility tree relationships
- `aria-activedescendant` for keyboard navigation

### Screen Reader Support
- Clear announcement of select purpose
- Current selection announced when focus gained
- Option count announced (e.g., "5 of 20")
- State changes announced clearly
- Error messages announced immediately

### Keyboard Navigation
- Tab order follows logical sequence
- Arrow keys navigate options
- Enter/Space to select
- Escape to close without selection
- Type-ahead for alphabetical selection

## Risk-Specific Usage

### Risk Category Select
- **Options**: Financial, Operational, Strategic, Compliance, etc.
- **Behavior**: Single selection only
- **Validation**: Required field in risk creation

### Risk Level Select
- **Options**: Low, Medium, High, Critical
- **Color Coding**: Options may show color indicators
- **Default**: Medium if not specified

### Stakeholder Select
- **Options**: User names or department names
- **Multi-Select**: Allow multiple stakeholders
- **Searchable**: For long user lists

## Usage Guidelines

### When to Use Select Components
- When users need to choose from predefined options
- When the number of options is greater than 4-5
- When space is limited but options are numerous
- For standardized data input

### When NOT to Use Select Components
- When there are only 2-3 options (use radio buttons instead)
- When users need to input free-form text values
- When options change frequently based on other selections
- For options that require visual information (use radio buttons with images)

### Best Practices
- Use clear, concise option labels
- Order options logically (alphabetically, by frequency, etc.)
- Group related options when appropriate
- Include a clear placeholder or default selection
- Provide search functionality for long option lists
- Use multi-select appropriately with visual feedback
- Implement proper validation and error handling

### Common Mistakes to Avoid
- Too many options that require scrolling
- Unclear or ambiguous option labels
- Missing required field indicators
- Not providing search for long option lists
- Inconsistent option grouping
- Forgetting to handle empty states

## Implementation Examples

### HTML Structure
```html
<!-- Standard select -->
<div class="select-wrapper">
  <label for="risk-category" class="select-label">Risk Category</label>
  <select id="risk-category" class="select select-default" aria-describedby="category-help">
    <option value="">Select a category</option>
    <option value="financial">Financial</option>
    <option value="operational">Operational</option>
    <option value="strategic">Strategic</option>
  </select>
  <div id="category-help" class="help-text">Choose the primary category for this risk</div>
</div>

<!-- Multi-select example -->
<div class="select-wrapper">
  <label for="stakeholders" class="select-label">Stakeholders</label>
  <div class="select-multiselect" role="listbox" aria-multiselectable="true">
    <input type="text" class="select-input" placeholder="Select stakeholders..." role="combobox" />
    <div class="select-tags">
      <!-- Selected tags appear here -->
    </div>
  </div>
</div>
```

### CSS Classes
```css
.select-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.select {
  width: 100%;
  min-height: 44px;
  padding: 8px 32px 8px 16px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background-color: #ffffff;
  color: #0f172a;
  font-size: 1rem;
  box-sizing: border-box;
  position: relative;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 8px center;
  background-repeat: no-repeat;
  background-size: 20px;
}

.select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}