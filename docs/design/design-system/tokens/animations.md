---
title: Easy Risk Register - Animation Tokens
description: Complete motion and animation specifications with timing, easing, and usage guidelines
last-updated: 2025-11-08
version: 1.0.0
status: draft
---

# Easy Risk Register - Animation Tokens

## Overview

This document defines the complete motion and animation system for the Easy Risk Register application. The animation system enhances user experience by providing feedback, indicating state changes, and creating smooth transitions that feel natural and purposeful.

## Timing Functions

### Easing Curves
- **ease-out**: `cubic-bezier(0.0, 0, 0.2, 1)`
  - Usage: Element entrances, expanding containers, fade-ins
  - Feel: Starts quickly and decelerates, feels natural for entering elements
  - CSS: `animation-timing-function: cubic-bezier(0.0, 0, 0.2, 1)`

- **ease-in**: `cubic-bezier(0.4, 0, 1, 1)`
  - Usage: Element exits, collapsing containers, fade-outs
  - Feel: Starts slowly and accelerates, feels natural for leaving elements
  - CSS: `animation-timing-function: cubic-bezier(0.4, 0, 1, 1)`

- **ease-in-out**: `cubic-bezier(0.4, 0, 0.6, 1)`
  - Usage: Transitions between states, modal appearances, page transitions
  - Feel: Balanced acceleration and deceleration, smooth overall motion
  - CSS: `animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1)`

- **spring**: `cubic-bezier(0.3, 0.45, 0.75, 1.3)`
  - Usage: Playful interactions, button presses, micro-interactions
  - Feel: Slight overshoot and settle, adds personality without being distracting
  - CSS: `animation-timing-function: cubic-bezier(0.3, 0.45, 0.75, 1.3)`

### Duration Scale
- **Micro**: 100ms – 150ms
  - Usage: State changes, hover effects, quick feedback
  - Examples: Button hover, tooltip appearance, input focus states

- **Short**: 200ms – 300ms
  - Usage: Local transitions, dropdowns, simple UI changes
  - Examples: Modal content transitions, form field animations, tab switches

- **Medium**: 400ms – 500ms
  - Usage: Page transitions, modal appearances, significant UI changes
  - Examples: Page routing, modal presentation, card expansion

- **Long**: 600ms – 800ms
  - Usage: Complex animations, onboarding flows, heavy page transitions
  - Examples: Onboarding screens, tutorial highlights

## Animation Specifications

### Entry Animations
- **Fade In**: 
  - Duration: 200ms (short)
  - Easing: ease-out
  - Properties: opacity from 0 to 1
  - Usage: New content appearing, tooltips, notifications

- **Slide Up**:
  - Duration: 250ms (short)
  - Easing: ease-out
  - Properties: transform: translateY(10px) to translateY(0), opacity from 0 to 1
  - Usage: Dropdown menus, action sheets, bottom modals

- **Scale In**:
  - Duration: 200ms (short)
  - Easing: spring
  - Properties: transform: scale(0.95) to scale(1), opacity from 0 to 1
  - Usage: Modals, popovers, confirmation dialogs

### State Transitions
- **Button Press**:
  - Duration: 150ms (micro)
  - Easing: spring
  - Properties: transform: scale(0.98)
  - Usage: Primary and secondary buttons on click

- **Toggle Switch**:
  - Duration: 200ms (micro)
  - Easing: ease-out
  - Properties: transform: translateX(0) to translateX(20px) for checked state
  - Usage: Toggle switches, check boxes with sliding indicators

- **Input Focus**:
  - Duration: 150ms (micro)
  - Easing: ease-out
  - Properties: border-color, box-shadow
  - Usage: Form inputs, text areas, selection states

### Loading Animations
- **Spinner**:
  - Duration: 1s (infinite)
  - Easing: linear
  - Properties: transform: rotate(0deg) to rotate(360deg)
  - Usage: Page loading, data fetching, processing states

- **Skeleton Loading**:
  - Duration: 1.5s (infinite)
  - Easing: ease-in-out
  - Properties: background gradient animation
  - Usage: Content loading placeholders

### Micro-interactions
- **Hover Scale**:
  - Duration: 150ms (micro)
  - Easing: spring
  - Properties: transform: scale(1) to scale(1.03)
  - Usage: Cards, buttons, interactive elements

- **Icon Rotation**:
  - Duration: 200ms (short)
  - Easing: ease-out
  - Properties: transform: rotate(0deg) to rotate(180deg)
  - Usage: Expand/collapse icons, arrows, collapsible elements

## Animation Principles

### Performance
- Maintain 60fps for all animations using transforms and opacity
- Avoid animating properties that trigger layout or paint
- Use `will-change` for elements that will be animated frequently
- Implement animation performance as a core requirement, not an afterthought

### Purpose
- Every animation should serve a clear purpose that enhances usability
- Use animation to provide feedback, indicate state changes, or guide attention
- Avoid decorative animations that don't improve the user experience
- Ensure animations are meaningful and contextually appropriate

### Consistency
- Similar actions use similar timing and easing functions
- Maintain consistent animation language across all components
- Document animation patterns for consistent implementation
- Create animation templates for common interactions

### Accessibility
- Respect `prefers-reduced-motion` user preferences
- Provide controls to pause or disable animations when appropriate
- Ensure animations don't cause seizures or discomfort
- Keep animation duration reasonable for cognitive accessibility

## Responsive Animations

### Desktop
- Use standard animation timing and easing
- Take advantage of hover states for additional feedback
- More complex animations acceptable due to performance

### Mobile
- Slightly reduced animation durations (10-15% faster)
- Simplified animations due to performance constraints
- Touch feedback prioritized over hover animations
- Consider battery impact of continuous animations

## CSS Implementation

### Custom Properties
```css
:root {
  /* Timing functions */
  --ease-out: cubic-bezier(0.0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.6, 1);
  --spring: cubic-bezier(0.3, 0.45, 0.75, 1.3);
  
  /* Duration values */
  --duration-micro: 125ms;
  --duration-short: 250ms;
  --duration-medium: 450ms;
  --duration-long: 700ms;
  
  /* Animation combinations */
  --transition-button: var(--duration-micro) var(--spring);
  --transition-modal: var(--duration-medium) var(--ease-out);
  --transition-hover: var(--duration-micro) var(--spring);
  --transition-focus: var(--duration-micro) var(--ease-out);
}
```

### Animation Classes
```css
/* Fade in animation */
.animate-fade-in {
  opacity: 0;
  animation: fadeIn var(--duration-short) var(--ease-out) forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Slide up animation */
.animate-slide-up {
  opacity: 0;
  transform: translateY(10px);
  animation: slideUp var(--duration-short) var(--ease-out) forwards;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Button press animation */
.animate-button-press {
  transition: transform var(--duration-micro) var(--spring);
}

.animate-button-press:active {
  transform: scale(0.98);
}

/* Hover scale effect */
.animate-hover-scale {
  transition: transform var(--duration-micro) var(--spring);
}

.animate-hover-scale:hover {
  transform: scale(1.03);
}

/* Toggle switch animation */
.toggle-switch::after {
  transition: transform var(--duration-micro) var(--ease-out);
}

.toggle-switch.checked::after {
  transform: translateX(20px);
}
```

## JavaScript Animation Guidelines

### Animation Libraries
- Use CSS animations for simple state changes and transitions
- Use Web Animations API for more complex sequences
- Consider lightweight libraries like Framer Motion for complex interactions
- Prioritize performance and bundle size

### Animation States
```javascript
// Example of respecting user preferences
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  // Apply animations
  element.classList.add('animate-fade-in');
} else {
  // Skip animations for accessibility
  element.style.opacity = 1;
}
```

## Reducing Motion Implementation

### CSS Media Query
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  /* Override for essential animations */
  .essential-animation {
    animation-duration: 200ms !important;
    transition-duration: 200ms !important;
  }
}
```

## Performance Optimization

### Best Practices
- Use `transform` and `opacity` for animations to avoid layout reflows
- Animate elements with `position: fixed` or `transform: translateZ(0)` for hardware acceleration
- Use `will-change` property to hint which properties will change
- Implement animation performance monitoring in development

### Performance Monitoring
- Monitor for dropped frames using browser dev tools
- Implement performance budgets that include animation constraints
- Test animations on lower-end devices to ensure smooth performance
- Provide animation quality settings that can be throttled when needed