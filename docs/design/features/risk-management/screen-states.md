---
title: Easy Risk Register - Risk Management Screen States
description: Complete screen-by-screen specifications for all UI components in the risk management feature
last-updated: 2025-11-08
version: 1.0.0
status: draft
related-files:
  - ./README.md
  - ./user-journey.md
  - ../design-system/components/buttons.md
  - ../design-system/components/forms.md
  - ../design-system/components/cards.md
dependencies:
  - Design system foundation
  - Component specifications
---

# Easy Risk Register - Risk Management Screen States

## Overview

This document provides detailed specifications for all screen states in the Risk Management feature. Each screen is documented with visual design specifications, interaction design specifications, and responsive design considerations.

## Dashboard Screen

### Screen: Dashboard Overview
**Purpose**: Provide high-level summary of risk status and quick access to key functions

**Layout Structure**: 
- Header with navigation and user controls
- Main content area with summary cards and visualization
- Responsive grid layout that adapts to screen size

**Content Strategy**: 
- Risk summary metrics as primary content
- Probability-impact matrix visualization as secondary content
- Quick action buttons for immediate tasks

###### State: Default
**Visual Design Specifications**:
- **Layout**: 
  - Header: 64px height, white background with border
  - Main: Responsive grid with sidebar (280px) and content (remainder)
  - Cards arranged in responsive grid with 2-4 columns depending on screen size
  
- **Typography**: 
  - Page title: H2 (`2rem`, 600 weight)
  - Card titles: H4 (`1.5rem`, 500 weight)
  - Body content: Body (`1rem`, 400 weight)
  
- **Color Application**: 
  - Background: `#f8fafc` (Background Secondary)
  - Card backgrounds: `#ffffff` (Background Primary)
  - Primary text: `#0f172a` (Text High)
  - Secondary text: `#64748b` (Text Low)
  
- **Interactive Elements**: 
  - Primary buttons: Blue (`#2563eb`) with white text
  - Secondary buttons: Transparent with gray border
  - Hover states: Background changes to `#f8fafc`
  
- **Visual Hierarchy**: 
  - Dashboard title at top (largest text)
  - Summary cards with larger numbers
  - Action buttons with color contrast
  - Visualizations drawing attention with color

**Interaction Design Specifications**:
- **Primary Actions**: 
  - "Create New Risk" button: Primary style, blue background
  - On click: Opens risk creation modal
  - Hover: Background darkens to `#1d4ed8`
  - Focus: 2px blue ring with 2px offset
  
- **Secondary Actions**: 
  - "View All Risks" link: Secondary button style
  - On click: Navigates to risk list page
  - Hover: Background changes to `#f8fafc`
  
- **Form Interactions**: 
  - N/A for this screen
  
- **Navigation Elements**: 
  - Sidebar items: 44px minimum touch target
  - Active item: Blue left border with blue text
  - Hover state: Background changes to `#f8fafc`
  
- **Keyboard Navigation**: 
  - Tab order: Header → Sidebar → Summary cards → Action buttons
  - Arrow keys: Navigate between risk summary cards
  - Enter: Activate highlighted button or card
  
- **Touch Interactions**: 
  - All buttons: Minimum 44px × 44px touch target
  - Cards: Tappable with visual feedback

**Animation & Motion Specifications**:
- **Entry Animations**: 
  - Cards fade in with 200ms duration, 50ms stagger between cards
  - Matrix visualization draws with 300ms draw animation
  
- **State Transitions**: 
  - Button hover: 150ms spring easing
  - Card selection: 200ms ease-in-out scale and shadow change
  
- **Loading Animations**: 
  - Skeleton loading with 1.5s gradient animation for empty states
  - Progress indicators for data refresh
  
- **Micro-interactions**: 
  - Button press: 150ms spring scale(0.98)
  - Card hover: Subtle 100ms background change

**Responsive Design Specifications**:
- **Mobile** (320-767px): 
  - Sidebar collapses to hamburger menu
  - Cards stack in single column
  - Header becomes compact with menu icon
  - Touch-friendly spacing maintained

- **Tablet** (768-1023px): 
  - Sidebar may remain open or collapse based on space
  - Cards display in 2-column grid
  - Maintains adequate touch target sizing
  - Optimized for both portrait and landscape

- **Desktop** (1024-1439px): 
  - Full sidebar visible
  - Cards in 2-3 column grid
  - Hover states available
  - Keyboard optimization

- **Wide** (1440px+): 
  - Cards in 3-4 column grid
  - More detailed information display
  - Additional space for visualizations

**Accessibility Specifications**:
- **Screen Reader Support**: 
  - Proper heading hierarchy (H1 for page, H2 for sections)
  - ARIA labels for all interactive elements
  - Landmark roles for main content areas
  - Announce dynamic updates to risk counts

- **Keyboard Navigation**: 
  - Logical tab order following visual flow
  - Clear focus indicators for all interactive elements
  - Skip links for main content navigation
  - Access to all functionality via keyboard

- **Color Contrast**: 
  - All text meets 4.5:1 contrast ratio (AA standard)
  - Interactive elements meet 3:1 contrast ratio
  - Sufficient contrast for risk scoring colors

- **Touch Targets**: 
  - All buttons and interactive elements: Minimum 44px × 44px
  - Adequate spacing between touch targets
  - Visual feedback for all interactions

- **Motion Sensitivity**: 
  - Respects `prefers-reduced-motion` setting
  - Subtle motion when motion is enabled
  - Functionality preserved when motion is reduced

- **Cognitive Load**: 
  - Information chunked into clear sections
  - Clear visual hierarchy with consistent design patterns
  - Progress indicators for longer operations

###### State: Empty State
**Visual Design Specifications**:
- **Layout**: 
  - Centered content in main area
  - Larger spacing for empty state graphics
  - Prominent call-to-action button
  
- **Typography**: 
  - Title: H3 (`1.75rem`, 500 weight)
  - Description: Body Large (`1.125rem`, 400 weight)
  - CTA: Body (`1rem`, 600 weight)
  
- **Color Application**: 
  - Background: `#f8fafc` (Background Secondary)
  - Content background: `#ffffff` (Background Primary)
  - Primary text: `#0f172a` (Text High)
  - CTA button: `#2563eb` (Primary)
  
- **Interactive Elements**: 
  - Primary CTA button: Prominent blue styling
  - Secondary support link: Underlined primary color

###### State: Loading State
**Visual Design Specifications**:
- **Layout**: 
  - Skeleton cards in grid pattern
  - Animated gradient loading placeholders
  - Maintained layout structure
  
- **Typography**: 
  - Placeholder lines with varying widths
  - No text during loading state
  
- **Color Application**: 
  - Background: `#f1f5f9` (neutral loading)
  - Animation: Gradient from `#e2e8f0` to `#f1f5f9`

## Risk List Screen

### Screen: Risk List View
**Purpose**: Display all risks in a sortable, filterable list with key information visible

**Layout Structure**: 
- Header with navigation and page title
- Filter and sort controls section
- Risk cards grid/list with infinite scroll or pagination
- Responsive layout adapting to screen size

**Content Strategy**: 
- Risk cards displaying essential information
- Clear action buttons for common operations
- Filtering and sorting controls at top

###### State: Default
**Visual Design Specifications**:
- **Layout**: 
  - Header: Page title with "Create New Risk" button
  - Controls: Filter dropdowns and sort options
  - Content: Responsive grid of risk cards (3-4 columns desktop, 1-2 mobile)
  
- **Typography**: 
  - Page title: H2 (`2rem`, 600 weight)
  - Risk title: H5 (`1.25rem`, 500 weight)
  - Risk details: Body (`1rem`, 400 weight)
  - Metadata: Caption (`0.75rem`, 400 weight)
  
- **Color Application**: 
  - Background: `#f8fafc` (Background Secondary)
  - Card backgrounds: `#ffffff` (Background Primary)
  - Risk score colors: Green (low), Yellow (medium), Red (high)
  - Text: `#0f172a` (Text High), `#64748b` (Text Low)

**Interaction Design Specifications**:
- **Primary Actions**: 
  - "Create New Risk" button: Primary blue button
  - Click: Opens risk creation modal
  - Hover/Focus: Standard button states
  
- **Risk Card Interactions**: 
  - Click anywhere on card: Navigate to risk detail
  - Hover: Subtle elevation increase
  - Action buttons: Individual edit/delete options
  
- **Filter Interactions**: 
  - Dropdown selectors: Standard form field behavior
  - Real-time filtering: Results update as selections change
  - Clear filters: Reset all to default state

###### State: Filtered State
**Visual Design Specifications**:
- **Layout**: 
  - Active filter indicators at top of list
  - Updated risk count display
  - Same card layout with fewer items
  
- **Color Application**: 
  - Active filter tags in primary color
  - "Clear Filters" button for resetting

## Risk Creation/Editing Screen

### Screen: Risk Form Modal
**Purpose**: Collect risk information through a structured form with real-time validation

**Layout Structure**: 
- Modal header with title and close button
- Form sections with labeled inputs
- Real-time risk score display
- Action buttons in footer

**Content Strategy**: 
- Progressive disclosure of form fields
- Clear validation messaging
- Real-time risk score calculation

###### State: Default (Create Mode)
**Visual Design Specifications**:
- **Layout**: 
  - Header: Modal title "Create New Risk" and close button
  - Body: Form fields with proper spacing
  - Footer: "Cancel" and "Create Risk" buttons
  
- **Typography**: 
  - Modal title: H3 (`1.25rem`, 600 weight)
  - Field labels: Label (`0.875rem`, 600 weight, uppercase)
  - Field text: Body (`1rem`, 400 weight)
  
- **Color Application**: 
  - Background: `#ffffff` (Background Primary)
  - Form field backgrounds: `#ffffff` with `#cbd5e1` borders
  - Required field indicators: `#ef4444` (Error) asterisks

**Interaction Design Specifications**:
- **Form Interactions**: 
  - Real-time risk score calculation as probability/impact change
  - Input validation on blur
  - Submit button enabled only when form is valid
  
- **Primary Actions**: 
  - "Create Risk" button: Primary blue, disabled until form valid
  - Click: Saves risk and closes modal
  - Hover/Focus: Standard button states

###### State: Editing Mode
**Visual Design Specifications**:
- **Layout**: 
  - Header: Modal title "Edit Risk" and close button
  - Body: Pre-filled form fields with current values
  - Footer: "Cancel", "Save Changes", "Delete Risk" buttons
  
- **Color Application**: 
  - Same as create mode with additional delete button in red

## Risk Detail Screen

### Screen: Risk Detail View
**Purpose**: Display complete information for a single risk with editing options

**Layout Structure**: 
- Header with navigation and page title
- Risk information sections
- Action buttons for editing/deleting

**Content Strategy**: 
- Clear section organization
- Risk score prominently displayed
- Action buttons appropriately positioned

###### State: Default
**Visual Design Specifications**:
- **Layout**: 
  - Header: Breadcrumb navigation and page title
  - Content: Information organized in clear sections
  - Footer: Action buttons
  
- **Typography**: 
  - Risk title: H2 (`2rem`, 600 weight)
  - Section headers: H4 (`1.5rem`, 500 weight)
  - Detail text: Body (`1rem`, 400 weight)

**Interaction Design Specifications**:
- **Primary Actions**: 
  - "Edit Risk" button: Secondary style
  - "Delete Risk" button: Destructive style with confirmation
  - Hover/Focus: Standard button states with caution for delete