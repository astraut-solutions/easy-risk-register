---
title: Easy Risk Register - Style Guide
description: Complete visual style guide with color, typography, spacing, and component specifications
last-updated: 2025-11-08
version: 1.0.0
status: draft
---

# Easy Risk Register - Style Guide

## Color System

### Primary Colors
- **Primary**: `#2563eb` – Main CTAs, brand elements (Indigo 600)
- **Primary Dark**: `#1d4ed8` – Hover states, emphasis
- **Primary Light**: `#dbeafe` – Subtle backgrounds, highlights

### Secondary Colors
- **Secondary**: `#64748b` – Supporting elements (Slate 500)
- **Secondary Light**: `#e2e8f0` – Backgrounds, subtle accents
- **Secondary Pale**: `#f1f5f9` – Selected states, highlights

### Accent Colors
- **Accent Primary**: `#059669` – Important actions, notifications (Emerald 600)
- **Accent Secondary**: `#d97706` – Warnings, highlights (Amber 600)
- **Gradient Start**: `#3b82f6` – For gradient elements (Blue 500)
- **Gradient End**: `#8b5cf6` – For gradient elements (Violet 500)

### Semantic Colors
- **Success**: `#10b981` – Positive actions, confirmations (Emerald 500)
- **Warning**: `#f59e0b` – Caution states, alerts (Amber 500)
- **Error**: `#ef4444` – Errors, destructive actions (Red 500)
- **Info**: `#3b82f6` – Informational messages (Blue 500)

### Neutral Palette
- `Neutral-50`: `#f8fafc` – Very light backgrounds
- `Neutral-100`: `#f1f5f9` – Light backgrounds
- `Neutral-200`: `#e2e8f0` – Borders, subtle dividers
- `Neutral-300`: `#cbd5e1` – Medium borders
- `Neutral-400`: `#94a3b8` – Medium text, icons
- `Neutral-500`: `#64748b` – Body text
- `Neutral-600`: `#475569` – Headings
- `Neutral-700`: `#334155` – Dark headings
- `Neutral-800`: `#1e293b` – Text on light backgrounds
- `Neutral-900`: `#0f172a` – Text on light backgrounds

### Accessibility Notes
- All color combinations meet WCAG AA standards (4.5:1 normal text, 3:1 large text)
- Critical interactions maintain 7:1 contrast ratio for enhanced accessibility
- Color-blind friendly palette verification included using tools like Color Oracle

## Typography System

### Font Stack
- **Primary**: `Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`
- **Monospace**: `JetBrains Mono, Consolas, Monaco, monospace`

### Font Weights
- Light: 300, Regular: 400, Medium: 500, Semibold: 600, Bold: 700

### Type Scale
- **H1**: `2.5rem/1.2` (40px), Semibold: 600, Tracking: -0.025em – Page titles, major sections
- **H2**: `2rem/1.25` (32px), Semibold: 600, Tracking: -0.025em – Section headers
- **H3**: `1.75rem/1.3` (28px), Medium: 500, Tracking: -0.025em – Subsection headers
- **H4**: `1.5rem/1.33` (24px), Medium: 500, Tracking: -0.025em – Card titles
- **H5**: `1.25rem/1.4` (20px), Medium: 500, Tracking: -0.025em – Minor headers
- **H6**: `1.125rem/1.5` (18px), Medium: 500, Tracking: -0.025em – Small headers
- **Body Large**: `1.125rem/1.6` (18px) – Primary reading text
- **Body**: `1rem/1.5` (16px) – Standard UI text
- **Body Small**: `0.875rem/1.43` (14px) – Secondary information
- **Caption**: `0.75rem/1.6` (12px) – Metadata, timestamps
- **Label**: `0.875rem/1.43` (14px), Semibold: 600 – Form labels
- **Code**: `0.875rem/1.43` (14px), monospace – Code blocks and technical text

### Responsive Typography
- **Mobile**: Base size: 14px, H1: 1.75rem, H2: 1.5rem, Body: 0.875rem
- **Tablet**: Base size: 15px, H1: 2rem, H2: 1.75rem, Body: 1rem
- **Desktop**: Base size: 16px, H1: 2.5rem, H2: 2rem, Body: 1rem
- **Wide**: Base size: 16px, H1: 3rem, H2: 2.25rem, Body: 1.125rem

## Spacing & Layout System

### Base Unit: 8px

### Spacing Scale
- `xs`: base × 0.5 (4px) – Micro spacing between related elements
- `sm`: base × 1 (8px) – Small spacing, internal padding
- `md`: base × 2 (16px) – Default spacing, standard margins
- `lg`: base × 3 (24px) – Medium spacing between sections
- `xl`: base × 4 (32px) – Large spacing, major section separation
- `2xl`: base × 6 (48px) – Extra large spacing, screen padding
- `3xl`: base × 8 (64px) – Huge spacing, hero sections
- `4xl`: base × 16 (128px) – Maximum spacing for special sections

### Grid System
- **Columns**: 4 (mobile), 8 (tablet), 12 (desktop)
- **Gutters**: 16px mobile, 24px tablet, 32px desktop
- **Margins**: 16px from screen edge (mobile), 24px (tablet), 48px (desktop)
- **Container max-widths**: 100% (mobile), 90% (tablet), 1200px (desktop)

### Breakpoints
- **Mobile**: 320px – 767px
- **Tablet**: 768px – 1023px
- **Desktop**: 1024px – 1439px
- **Wide**: 1440px+

## Visual Hierarchy

### Layout Principles
- Use consistent spacing based on the 8px grid system
- Apply appropriate contrast through color, size, and weight
- Create clear visual groupings with proximity and containers
- Use whitespace strategically to reduce cognitive load
- Establish clear pathways for user tasks

### Interaction States
- Default: Base appearance for all interactive elements
- Hover: Subtle visual change to indicate interactivity
- Active: Visual feedback for ongoing interaction
- Focus: Clear, visible focus indicator for keyboard navigation
- Disabled: Reduced opacity and contrast for non-interactive elements

## Motion & Animation System

### Timing Functions
- **Ease-out**: `cubic-bezier(0.0, 0, 0.2, 1)` – Entrances, expansions
- **Ease-in-out**: `cubic-bezier(0.4, 0, 0.6, 1)` – Transitions, movements
- **Spring**: `cubic-bezier(0.3, 0.45, 0.75, 1.3)` – Playful interactions, elastic effects

### Duration Scale
- **Micro**: 100–150ms – State changes, hover effects
- **Short**: 200–300ms – Local transitions, dropdowns
- **Medium**: 400–500ms – Page transitions, modals
- **Long**: 600–800ms – Complex animations, onboarding flows

### Animation Principles
- **Performance**: 60fps minimum, hardware acceleration preferred
- **Purpose**: Every animation serves a functional purpose
- **Consistency**: Similar actions use similar timings and easing
- **Accessibility**: Respect `prefers-reduced-motion` user preferences