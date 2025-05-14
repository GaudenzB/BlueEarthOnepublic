# BlueEarth Capital UI Design System

This document outlines our comprehensive design system which ensures visual consistency, usability, and maintainability across the BlueEarth Capital application.

## Table of Contents

1. [Design Principles](#design-principles)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing System](#spacing-system)
5. [Borders & Shadows](#borders--shadows)
6. [Component Guidelines](#component-guidelines)
7. [Pattern Library](#pattern-library)
8. [Icon Usage](#icon-usage)
9. [Accessibility Guidelines](#accessibility-guidelines)
10. [Implementation Details](#implementation-details)

## Design Principles

Our design system is guided by these core principles:

- **Clarity**: Information hierarchy should be clear and logical
- **Consistency**: UI elements should behave predictably and look cohesive
- **Efficiency**: Users should accomplish tasks with minimal effort
- **Enterprise-Grade**: Professional appearance appropriate for financial services
- **Accessibility**: Interfaces should be usable by everyone

## Color System

We use a carefully selected palette consisting of:

### Primary Palette

- **Brand Colors**: Primary brand colors representing BlueEarth Capital's identity
  - Primary Blue: `#0F5E9C`
  - Secondary Blue: `#2B80C5`
  - Accent Blue: `#63A6E2`

### UI Colors

- **Gray Scale**: For text, backgrounds, and UI elements
  - Gray 50: `#F9FAFB` - Page backgrounds
  - Gray 100: `#F3F4F6` - Card backgrounds
  - Gray 200: `#E5E7EB` - Borders, dividers
  - Gray 300: `#D1D5DB` - Disabled states
  - Gray 400: `#9CA3AF` - Placeholder text
  - Gray 500: `#6B7280` - Secondary text
  - Gray 600: `#4B5563` - Body text
  - Gray 700: `#374151` - Primary text
  - Gray 800: `#1F2937` - Headings
  - Gray 900: `#111827` - High contrast text

### Semantic Colors

- **Feedback Colors**: For status indicators and messaging
  - Success: `#16A34A` - Positive confirmation
  - Warning: `#F59E0B` - Attention required
  - Error: `#DC2626` - Critical issues
  - Info: `#3B82F6` - Informational content

### Usage Guidelines

- Use brand colors sparingly for primary actions and key UI elements
- Maintain proper contrast ratios (at least 4.5:1 for normal text)
- Reserve semantic colors for their intended purpose (status, feedback)
- Use gray scale for most interface elements

## Typography

### Font Family

- **Primary**: 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', sans-serif
- **Monospace**: 'SF Mono', 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', monospace

### Font Sizes

- xs: `0.75rem` (12px) - Fine print, captions
- sm: `0.875rem` (14px) - Secondary text, labels
- base: `1rem` (16px) - Body text
- lg: `1.125rem` (18px) - Large body text
- xl: `1.25rem` (20px) - Small headings
- 2xl: `1.5rem` (24px) - Headings
- 3xl: `1.875rem` (30px) - Large headings
- 4xl: `2.25rem` (36px) - Extra large headings

### Font Weights

- light: 300
- normal: 400
- medium: 500
- semibold: 600
- bold: 700

### Line Heights

- tight: 1.25 - Headings
- base: 1.5 - Body text
- relaxed: 1.75 - Multi-line body text

### Usage Guidelines

- Limit to 2-3 font sizes per page for content
- Use appropriate weights to establish hierarchy
- Maintain consistent alignment (usually left-aligned)
- Ensure proper line height for readability (usually 1.5x for paragraphs)

## Spacing System

We use a consistent 4px base unit spacing scale for layout, padding, margins and gaps.

### Spacing Scale

- 0: `0` - No spacing
- 1: `0.25rem` (4px)
- 2: `0.5rem` (8px) - Compact spacing
- 3: `0.75rem` (12px)
- 4: `1rem` (16px) - Standard spacing
- 5: `1.25rem` (20px)
- 6: `1.5rem` (24px) - Comfortable spacing
- 8: `2rem` (32px) - Section spacing
- 10: `2.5rem` (40px)
- 12: `3rem` (48px) - Large section spacing
- 16: `4rem` (64px) - Page section spacing
- 20: `5rem` (80px) - Page spacing
- 24: `6rem` (96px) - Extra large spacing

### Layout Guidelines

- Use consistent margins for page sections (usually 24-48px)
- Maintain uniform padding within components (usually 16-24px) 
- Apply consistent gap spacing between items in a group
- Card padding should be consistent (usually 16-24px)
- Form field spacing should be uniform (usually 16-24px between fields)

## Borders & Shadows

### Border Radius

- none: `0` - No rounding
- sm: `0.125rem` (2px) - Subtle rounding
- md: `0.375rem` (6px) - Button rounding
- lg: `0.5rem` (8px) - Card rounding
- xl: `0.75rem` (12px) - Modal rounding
- 2xl: `1rem` (16px) - Large component rounding
- full: `9999px` - Circular elements

### Shadows

- none: No shadow
- sm: `0 1px 2px 0 rgba(0, 0, 0, 0.05)` - Subtle elevation
- md: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)` - Cards, dropdowns
- lg: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)` - Modals, popovers
- xl: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)` - Large modals

## Component Guidelines

### Buttons

- **Primary**: Brand color background, white text, used for main actions
- **Secondary**: Gray background, dark text, used for secondary actions
- **Tertiary/Link**: No background, brand color text, used for minor actions
- **Danger**: Red background, white text, used for destructive actions

Sizes:
- Small: 28px height
- Default: 36px height
- Large: 44px height

### Form Inputs

- Standard height: 36px
- Border radius: 6px
- Label position: Above input
- Error state: Red border with error message below
- Disabled state: Gray background, reduced opacity

### Cards

- Standard padding: 24px
- Border radius: 8px (lg) or 12px (xl)
- Shadow: sm for flat design, md for elevated design
- Title-content spacing: 16px

### Modals and Dialogs

- Border radius: 12px
- Backdrop: Semi-transparent black
- Standard padding: 24px
- Header-content-footer spacing: 24px
- Max width: 500-600px for standard modals

### Tables

- Header: Bold text, light gray background
- Row hover: Subtle highlight
- Row separation: Light border or alternating background
- Cell padding: 12px 16px

### Status Indicators

- Use consistent colors for status states
- Include icons with status labels when possible
- Use badges/tags for compact status display

## Pattern Library

Common UI patterns standardized across the application:

### Navigation Patterns
- **Sidebar Navigation**: Primary app navigation
- **Breadcrumbs**: Secondary page navigation
- **Tabs**: Content organization within a page
- **Pagination**: For long content lists

### Content Patterns
- **Page Headers**: Consistent title, actions, and breadcrumbs
- **Data Tables**: Consistent sorting, filtering, and actions
- **Empty States**: When no content is available
- **Loading States**: Consistent skeleton loaders

### Interaction Patterns
- **Dialogs**: Confirmation and modal patterns
- **Notifications**: Toast and alert patterns
- **Form Submission**: Standard save/cancel patterns
- **Data Loading**: Skeleton loaders and progress indicators

## Icon Usage

We use Ant Design icons throughout the application:

- Use outlined icons for navigation and general UI elements
- Use filled icons for selected or active states
- Maintain consistent size in context (16px for inline, 20px for buttons)
- Ensure appropriate color contrast
- Pair with text for improved accessibility

## Accessibility Guidelines

- Maintain color contrast ratio of at least 4.5:1 for normal text
- Ensure keyboard navigability for all interactions
- Provide text alternatives for non-text content
- Design focus states for keyboard users
- Support screen readers with appropriate ARIA attributes
- Allow zooming without breaking layouts

## Implementation Details

### Component Architecture

Our components are organized in the following structure:

1. **Base Components**: Fundamental building blocks
2. **Composite Components**: Combinations of base components
3. **Page Templates**: Full page layouts

### Using the Theme System

All UI components should reference values from the theme system:

```typescript
import { theme } from '@/lib/theme';

// Use theme values for styling:
const styles = {
  padding: theme.spacing[4],
  fontSize: theme.typography.fontSize.base,
  color: theme.gray[700],
  borderRadius: theme.borderRadius.md,
};
```

### Using Centralized Components

Always prefer shared components from the UI library over custom implementations:

```tsx
// Import from centralized UI components
import { StatusTag, PageHeader, CardContainer } from '@/components/ui';

// Use shared components in your implementation
<PageHeader 
  title="Employee Details" 
  description="View and manage employee information"
/>

<CardContainer
  title="Contact Information"
  description="Personal contact details for this employee"
>
  {/* Card content */}
</CardContainer>
```