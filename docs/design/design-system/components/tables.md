---
title: Easy Risk Register - Table Component
description: Complete table component specifications with variants, states, and usage guidelines
last-updated: 2025-11-10
version: 1.0.0
status: draft
---

# Easy Risk Register - Table Component

## Overview

Table components in the Easy Risk Register application provide an organized and efficient way to display structured data, such as risk listings, reports, and other tabular information. These components ensure clear information hierarchy, support data scanning, and offer interactive capabilities while maintaining accessibility standards.

## Component Specifications

### Base Table
- **Visual Specifications**:
  - Background: `#ffffff` (Background Primary)
  - Border: 1px solid `#e2e8f0` (Border Mid)
  - Border Radius: 8px
  - Box Shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1)
  - Width: 100% (responsive)
  - Font Size: 0.875rem (14px) for body, 0.75rem (12px) for headers
  - Line Height: 1.5

- **Spacing**:
  - Cell Padding: `spacing-md` (16px) horizontal, `spacing-lg` (24px) vertical
  - Row Spacing: Additional spacing may be added between rows for readability
  - Header Border: 2px solid `#cbd5e1` (Border Strong)

### Table Structure
- **Header Row**: Distinguished styling with sorting indicators
- **Body Rows**: Alternating background colors for readability
- **Footer Row**: Optional summary or aggregation row
- **Responsive Behavior**: Adapts to different screen sizes

## Table Variants

### Default Table
- **Purpose**: Standard data display for most use cases
- **Visual Specifications**:
  - Header Background: `#f8fafc` (Background Secondary)
  - Header Text: `#1e293b` (Text High), Semibold (600)
  - Body Row Background: Alternating `#ffffff` and `#f8fafc`
  - Border Bottom: 1px solid `#e2e8f0` for all rows
  - Cell Border: None (clean design)

- **Usage Examples**: Risk listings, reports, data overview

### Striped Table
- **Purpose**: Enhanced readability with alternating row colors
- **Visual Specifications**:
  - Row 1 Background: `#ffffff` (Background Primary)
  - Row 2 Background: `#f8fafc` (Background Secondary)
  - Row 3 Background: `#ffffff` (Background Primary)
  - Row 4 Background: `#f8fafc` (Background Secondary)
  - Consistent borders and spacing

- **Usage Examples**: Large datasets, long lists requiring scanning

### Bordered Table
- **Purpose**: Clear visual separation between cells
- **Visual Specifications**:
  - Cell Border: 1px solid `#e2e8f0` (Border Mid)
  - Header Border: 2px solid `#cbd5e1` (Border Strong)
  - Consistent border radius and spacing
  - Enhanced cell definition

- **Usage Examples**: Financial data, complex information matrices

### Compact Table
- **Purpose**: Dense data display for space-constrained layouts
- **Visual Specifications**:
  - Cell Padding: `spacing-sm` (8px) horizontal, `spacing-md` (16px) vertical
  - Font Size: 0.8125rem (13px) for body
  - Reduced row height for more data density
  - Maintains readability

- **Usage Examples**: Dashboard summaries, condensed reports

## Table Sections

### Table Header
- **Visual Specifications**:
  - Background: `#f8fafc` (Background Secondary)
  - Text Color: `#1e293b` (Text High)
  - Font Weight: 600 (Semibold)
  - Font Size: 0.75rem (12px)
  - Text Transform: uppercase
  - Letter Spacing: 0.025em
  - Border Bottom: 2px solid `#cbd5e1` (Border Strong)
  - Padding: `spacing-md` (16px) horizontal, `spacing-lg` (24px) vertical
  - Vertical Alignment: middle

- **Sorting Indicators**:
  - Arrow Icons: For sortable columns
  - Color: `#64748b` (Text Low) for inactive, `#2563eb` (Primary) for active
  - Position: Right of header text with `spacing-sm` (8px) spacing

### Table Body
- **Visual Specifications**:
  - Cell Background: Alternating based on row
  - Text Color: `#334155` (Text Mid) for body text
  - Font Size: 0.875rem (14px)
  - Font Weight: 400 (Regular)
  - Border Bottom: 1px solid `#e2e8f0` (Border Mid) for all rows except last
  - Padding: `spacing-md` (16px) horizontal, `spacing-lg` (24px) vertical
  - Vertical Alignment: middle

- **Row Alternation**:
  - Even Rows: `#ffffff` (Background Primary)
  - Odd Rows: `#f8fafc` (Background Secondary)

### Table Footer
- **Visual Specifications**:
  - Background: `#f1f5f9` (Background Tertiary)
  - Text Color: `#334155` (Text Mid)
  - Font Weight: 500 (Medium)
  - Border Top: 2px solid `#cbd5e1` (Border Strong)
  - Border Bottom: 1px solid `#e2e8f0` (Border Mid)
  - Padding: `spacing-md` (16px) horizontal, `spacing-lg` (24px) vertical
  - Vertical Alignment: middle

- **Usage**: Aggregated data, totals, summary information

## Table States

### Default State
- Standard styling with appropriate background alternation
- Clear text hierarchy
- Proper spacing between cells and rows
- All borders and visual elements as specified

### Hover State (Rows)
- **Effect**: Subtle background color change
- **Background**: `#f1f5f9` (Background Tertiary) for entire row
- **Transition**: 150ms ease-out
- **Accessibility**: Sufficient contrast maintained

### Active/Selected State (Rows)
- **Effect**: Clear visual indication of selected row
- **Background**: `#e0f2fe` (Primary Light)
- **Border Left**: 3px solid `#2563eb` (Primary)
- **Accessibility**: High contrast indicator for accessibility

### Loading State
- **Effect**: Skeleton loading placeholders
- **Background**: Animated gradient from `#f1f5f9` to `#e2e8f0`
- **Animation**: Gradient sweep from left to right over 1.5s
- **Text Areas**: Placeholder blocks with loading animation

### Empty State
- **Container**: Full table height with centered content
- **Icon**: Relevant empty state icon
- **Title**: Clear heading explaining empty state
- **Description**: Helpful text with next steps
- **Action**: Primary button to add content

### Error State
- **Container**: Background with error color transparency
- **Icon**: Error icon in `#ef4444` (Error)
- **Title**: Error message in `#ef4444`
- **Description**: Detailed error information

## Column Specifications

### Standard Columns
- **Visual Specifications**:
  - Minimum Width: 80px
  - Maximum Width: None (responsive)
  - Text Alignment: Left for text, Right for numbers
  - Responsive Behavior: May hide on smaller screens
  - Padding: As specified for table cells

### Sortable Columns
- **Visual Specifications**:
  - Cursor: Pointer on hover
  - Hover Effect: Background change (like header)
  - Sort Indicator: Arrow icon showing direction
  - Active State: Indicator in primary color

### Action Columns
- **Visual Specifications**:
  - Width: Fixed (usually 80px-120px)
  - Content: Action buttons or icons
  - Alignment: Centered
  - Spacing: Appropriate between action elements

## Responsive Behavior

### Mobile (320px - 767px)
- **Layout**: Horizontal scrolling table container
- **Column Visibility**: Essential columns only, others hidden
- **Touch Targets**: Minimum 44px × 44px for interactive elements
- **Swipe Gesture**: Horizontal scrolling enabled
- **Sticky Headers**: On vertical scroll

### Tablet (768px - 1023px)
- **Layout**: May switch to card-based view for complex tables
- **Column Visibility**: More columns visible than mobile
- **Touch Targets**: Standard interactive element sizing
- **Scrolling**: Horizontal when needed

### Desktop (1024px+)
- **Layout**: Full table layout
- **Column Visibility**: All columns visible
- **Interaction**: Full interactive capabilities
- **Sorting**: Clickable header cells for sorting

## Card View Alternative

### Mobile Card View
- **Purpose**: Alternative layout for mobile devices
- **Structure**: Each table row becomes a card
- **Header**: Column headers become labels
- **Content**: Row data becomes card content
- **Actions**: Positioned consistently at bottom of card

## Sorting and Filtering

### Sorting Indicators
- **Visual Specifications**:
  - Icon: Up/down arrow indicating sort direction
  - Color: `#64748b` (Text Low) inactive, `#2563eb` (Primary) active
  - Size: 16px × 16px
  - Position: Right of header text with `spacing-sm` (8px) spacing

### Filter Controls
- **Position**: Above the table
- **Style**: Consistent with form controls
- **Behavior**: Updates table content dynamically
- **Clear Option**: Allow resetting filters

## Interaction Specifications

### Row Click Behavior
- **Selection**: Click to select single row
- **Multi-select**: Ctrl/Cmd+click for multiple rows
- **Navigation**: Click to navigate to detail view (if applicable)
- **Hover**: Visual feedback for clickable rows

### Cell Interaction
- **Selection**: Individual cell selection when needed
- **Editing**: Inline editing when appropriate
- **Links**: Links within cells function normally
- **Accessibility**: Proper keyboard navigation

### Scroll Behavior
- **Horizontal**: Auto-scrollbar when content exceeds width
- **Vertical**: Natural scrolling for tall tables
- **Sticky Elements**: Headers remain visible during scroll
- **Performance**: Optimized for large datasets

## Accessibility Specifications

### Screen Reader Support
- **Table Structure**: Proper HTML table semantics
- **Headers**: Associated with data cells using headers attribute
- **Captions**: Descriptive table captions when needed
- **Navigation**: Row and column navigation support
- **Sort**: Announce sort direction and status

### Keyboard Navigation
- **Tab Order**: Logical navigation through table
- **Arrow Keys**: Navigate between cells
- **Home/End**: Navigate to first/last cell in row
- **Page Up/Down**: Navigate to top/bottom of table

### ARIA Attributes
- `role="table"` for table elements
- `role="rowheader"` for header cells
- `role="gridcell"` for data cells
- `aria-sort` for sortable columns
- `aria-selected` for selected rows

### Color Contrast
- **Text to Background**: Minimum 4.5:1 ratio
- **Active States**: Maintain sufficient contrast
- **Hover States**: Maintain sufficient contrast
- **Status Indicators**: High contrast elements

## Risk-Specific Table Usage

### Risk Listing Table
- **Columns**: ID, Title, Category, Probability, Impact, Status, Owner
- **Sorting**: Default by status and priority
- **Filtering**: By category, status, owner
- **Actions**: Edit, delete, view details

### Risk Report Table
- **Columns**: Metric, Current, Previous, Variance, Trend
- **Styling**: Bordered for financial data
- **Formatting**: Currency and percentage formatting
- **Aggregation**: Summary in footer

### Stakeholder Assignment Table
- **Columns**: Name, Role, Department, Assigned Risks, Status
- **Interactive**: Checkboxes for bulk actions
- **Filtering**: By department, role
- **Status Indicators**: Visual status badges

## Usage Guidelines

### When to Use Table Components
- For structured data with clear relationships
- When users need to compare related information
- For data that benefits from columnar organization
- When sorting or filtering capabilities are needed

### When NOT to Use Table Components
- For single pieces of information
- When data relationships aren't clearly tabular
- When a card or list layout would be more appropriate
- For content that doesn't have related columns

### Best Practices
- Ensure proper table semantics for accessibility
- Use appropriate column widths for content
- Implement responsive design for mobile
- Provide sorting and filtering when valuable
- Include clear headers for all columns
- Use visual hierarchy to highlight important data
- Consider pagination for large datasets
- Maintain consistent styling with design system

### Common Mistakes to Avoid
- Tables that require horizontal scrolling on desktop
- Missing table headers or incorrect associations
- Inconsistent styling with design system
- Forgetting to consider mobile layout
- Not providing enough space for content
- Overly complex tables that confuse users
- Inadequate accessibility implementation

## Implementation Examples

### HTML Structure
```html
<!-- Basic table -->
<div class="table-container">
  <table class="table table-striped">
    <thead>
      <tr>
        <th scope="col" class="sortable" aria-sort="ascending">
          <span>Risk ID</span>
          <span class="sort-icon" aria-hidden="true">▲</span>
        </th>
        <th scope="col">Title</th>
        <th scope="col">Category</th>
        <th scope="col">Status</th>
        <th scope="col">Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>R-001</td>
        <td>Financial Market Volatility</td>
        <td>Financial</td>
        <td>
          <span class="badge badge-warning">Active</span>
        </td>
        <td>
          <button class="btn btn-ghost btn-sm">Edit</button>
          <button class="btn btn-ghost btn-sm">View</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>

<!-- Table with empty state -->
<div class="table-container">
  <table class="table">
    <thead>
      <tr>
        <th scope="col">Risk ID</th>
        <th scope="col">Title</th>
        <th scope="col">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td colspan="3" class="empty-state">
          <div class="empty-state-content">
            <svg class="empty-state-icon" aria-hidden="true">...</svg>
            <h3 class="empty-state-title">No risks found</h3>
            <p class="empty-state-description">Create your first risk to get started</p>
            <button class="btn btn-primary">Create Risk</button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### CSS Classes
```css
.table-container {
  overflow-x: auto;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.table {
  width: 100%;
  border-collapse: collapse;
  background-color: #ffffff;
  font-size: 0.875rem;
}

.table th {
  background-color: #f8fafc;
  color: #1e293b;
  font-weight: 600;
  font-size: 0.75rem;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  padding: 16px 16px 24px 16px;
  border-bottom: 2px solid #cbd5e1;
  vertical-align: middle;
}

.table td {
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
}

.table tbody tr:nth-child(even) {
  background-color: #f8fafc;
}

.table tbody tr:hover {
  background-color: #f1f5f9;
}

.sortable {
  cursor: pointer;
  position: relative;
  user-select: none;
}

.sortable .sort-icon {
  margin-left: 4px;
  color: #64748b;
}

.sortable[aria-sort="ascending"] .sort-icon,
.sortable[aria-sort="descending"] .sort-icon {
  color: #2563eb;
}