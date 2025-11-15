---
title: Easy Risk Register - Design System Documentation
description: Implementation guidelines and usage patterns for the Easy Risk Register design system
last-updated: 2025-11-10
version: 1.0.0
status: draft
---

# Easy Risk Register - Design System Documentation

This documentation provides guidance on implementing the design system and usage patterns for the Easy Risk Register application. For detailed specifications of individual components, refer to the specific component documentation files.

## Design Tokens

The design system uses a comprehensive set of tokens for consistent styling across the application, as detailed in the [Style Guide](./style-guide.md). The tokens include:

### Color Tokens
- **Brand Colors**: Primary indigo-based colors for CTAs and brand elements
- **Semantic Colors**: Success (green), Warning (amber), Danger (red), Info (blue) for status indicators
- **Status Colors**: Dedicated color palette for different status types
- **Surface Colors**: Backgrounds for different surface levels
- **Border Colors**: Different border weights for UI hierarchy
- **Text Colors**: Accessible text colors for different contrast levels
- **Risk Colors**: Specialized colors for risk severity levels

### Spacing Tokens
For detailed spacing specifications, see the [Style Guide](./style-guide.md#spacing--layout-system).

### Typography Tokens
For detailed typography specifications, see the [Style Guide](./style-guide.md#typography-system).

## Available Components

### Button
```tsx
<Button variant="primary" size="md" fullWidth={false}>
  Button text
</Button>
```
- Variants: primary, secondary, ghost, destructive, subtle
- Sizes: sm (36px), md (44px), lg (48px)

### Input
```tsx
<Input 
  label="Field Label" 
  placeholder="Enter text"
  error={errorMessage}
  helperText="Additional information"
/>
```

### Select
```tsx
<Select
  label="Field Label"
  options={[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
  ]}
  error={errorMessage}
  helperText="Additional information"
/>
```

### Textarea
```tsx
<Textarea
  label="Field Label"
  placeholder="Enter text"
  rows={3}
  error={errorMessage}
  helperText="Additional information"
/>
```

### Card
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
  <CardFooter>
    Footer content
  </CardFooter>
</Card>
```

### Badge
```tsx
<Badge variant="success">
  Success badge
</Badge>
```
- Variants: success, warning, danger, info, subtle

### Modal
```tsx
<Modal 
  isOpen={isOpen} 
  onClose={closeHandler} 
  title="Modal Title"
  size="md"
>
  Modal content
</Modal>
```

### Table
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column 1</TableHead>
      <TableHead>Column 2</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Data 1</TableCell>
      <TableCell>Data 2</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

## Usage Patterns

### Detail Layout
Use Card components with structured sections for detailed views:
- CardHeader for title and description
- CardContent for main content
- CardFooter for actions

### Report Layout
Combine StatCard and Table components for reporting views:
- Use StatCard for key metrics
- Use Table for detailed data listings
- Add filtering and sorting controls at the top

### Modal Usage
Modal components should be used for:
- Creating new items
- Editing existing items
- Confirming destructive actions
- Showing detailed information without navigation

## Component Integration Patterns

### Form Patterns
- Use Input, Select, and Textarea for form fields
- Include error states and helper text
- Use Button components for actions
- Include real-time validation when possible

### List/Item Patterns
- Use Card components for individual items
- Include badges for status indicators
- Provide clear action buttons
- Consider using Table for larger datasets

### Navigation Patterns
- Use consistent button variants for similar actions
- Maintain visual hierarchy with typography tokens
- Use appropriate spacing tokens between sections
- Ensure proper color contrast for accessibility

## Accessibility Considerations

- All interactive elements should have proper focus states
- Text colors must have sufficient contrast with backgrounds
- Form elements should have associated labels
- Semantic HTML elements should be used appropriately
- Keyboard navigation should be supported