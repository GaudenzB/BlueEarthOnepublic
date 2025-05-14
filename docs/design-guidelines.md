# BlueEarth Capital Design System Guidelines

This document provides a comprehensive guide to our design system, ensuring consistency across all components and pages of the BlueEarth Capital application.

## Design Principles

- **Professional**: Clean, mature enterprise design appropriate for financial services
- **Consistent**: Unified experience across all modules and components
- **Accessible**: Legible typography and sufficient color contrast
- **Responsive**: Adapts gracefully to all screen sizes

## Color System

### Primary Colors

- **Primary**: `#0f52ba` - Used for primary buttons, key actions, and links
- **Primary Hover**: `#0d47a1` - Used for hover states on primary elements
- **Primary Dark**: `#1a3d7c` - Used for dark sections and dark mode components

### Neutral Colors

- **Gray 50**: `#f8f9fa` - Page backgrounds, subtle backgrounds
- **Gray 100**: `#f0f2f5` - Card backgrounds, dividers
- **Gray 200**: `#e9ecef` - Input fields, borders
- **Gray 300**: `#dee2e6` - Disabled states, secondary borders
- **Gray 400**: `#ced4da` - Placeholder text
- **Gray 500**: `#adb5bd` - Secondary text, disabled text
- **Gray 600**: `#6c757d` - Muted text, secondary headings
- **Gray 700**: `#495057` - Primary text
- **Gray 800**: `#343a40` - Headings 
- **Gray 900**: `#212529` - Main headings

### Status Colors

- **Success**: `#52c41a` - Positive indicators, completions
- **Warning**: `#faad14` - Warnings, alerts, pending states
- **Error**: `#ff4d4f` - Errors, destructive actions
- **Info**: `#1890ff` - Informational states, active states
- **Processing**: `#1890ff` - Processing states, in-progress

## Typography

### Font Family

- **Primary Font**: Inter, sans-serif
- **Fallback**: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif

### Font Sizes

- **text-xs**: 0.75rem (12px) - Fine print, captions
- **text-sm**: 0.875rem (14px) - Secondary text, labels, interface text
- **text-base**: 1rem (16px) - Primary body text
- **text-lg**: 1.125rem (18px) - Large body text, section headers
- **text-xl**: 1.25rem (20px) - Subtitle headings
- **text-2xl**: 1.5rem (24px) - Main headings
- **text-3xl**: 1.875rem (30px) - Major headings
- **text-4xl**: 2.25rem (36px) - Page titles

### Font Weights

- **font-light**: 300
- **font-normal**: 400
- **font-medium**: 500
- **font-semibold**: 600
- **font-bold**: 700

## Spacing System

### Layout Spacing

- **max-w-7xl**: 80rem (1280px) - Maximum content width
- **max-w-5xl**: 64rem (1024px) - Medium content width
- **max-w-3xl**: 48rem (768px) - Small content width
- **px-4**: 1rem (16px) - Mobile padding
- **px-6**: 1.5rem (24px) - Tablet padding
- **px-8**: 2rem (32px) - Desktop padding

### Component Spacing

- **gap-2**: 0.5rem (8px) - Tight component spacing
- **gap-4**: 1rem (16px) - Standard component spacing
- **gap-6**: 1.5rem (24px) - Medium component spacing
- **gap-8**: 2rem (32px) - Large component spacing
- **gap-10**: 2.5rem (40px) - Section spacing
- **gap-12**: 3rem (48px) - Large section spacing

### Margins

- **mb-2**: 0.5rem (8px) - Small bottom margin
- **mb-4**: 1rem (16px) - Standard bottom margin
- **mb-6**: 1.5rem (24px) - Medium bottom margin
- **mb-8**: 2rem (32px) - Large bottom margin
- **mt-2**: 0.5rem (8px) - Small top margin
- **mt-4**: 1rem (16px) - Standard top margin
- **mt-6**: 1.5rem (24px) - Medium top margin
- **mt-8**: 2rem (32px) - Large top margin

## Component Design Guidelines

### Cards

Cards should maintain consistent styling:

- **Background**: `white` or `gray-50`
- **Border**: `1px solid #f0f2f5` (Gray 100)
- **Border Radius**: `rounded-xl` (0.75rem / 12px)
- **Shadow**: `shadow-sm` (Subtle shadow)
- **Padding**: `p-6` (1.5rem / 24px)
- **Max Width**: Appropriate for content, typically `max-w-lg` (32rem / 512px) for detail cards

### Buttons

- **Primary**: `brand.700` background, white text, `rounded-md`
- **Default**: White background, gray text/border, `rounded-md`
- **Danger**: Red background, white text, `rounded-md`
- **Link**: No background, primary color text, no border
- **Size**: Standard `h-10` (2.5rem), small `h-8` (2rem), large `h-12` (3rem)

### Avatar

- **Size**: Standard `w-10 h-10` (2.5rem), small `w-8 h-8` (2rem), large `w-12 h-12` (3rem), extra large `w-32 h-32` (8rem)
- **Border Radius**: `rounded-full` for circular avatars
- **Fallback**: If no image, use initials on `gray-100` background
- **Fallback Font**: `font-medium`, size depends on avatar size

### Status Indicators (Tags)

- **Shape**: `rounded-full` for status pills
- **Size**: Compact, with appropriate padding
- **Text**: Lowercase, with icon when appropriate
- **Colors**:
  - Active: Success color
  - Inactive: Gray/neutral
  - Warning states: Warning color
  - Error states: Error color
  - Info states: Info color

### Tables

- **Header**: Bold text, light gray background
- **Borders**: Subtle borders between rows
- **Hover**: Light highlight on row hover
- **Padding**: Consistent padding in cells

## Page Structure

### Page Layout

- **Container**: Centered, `max-w-7xl` with appropriate padding
- **Margin**: Consistent margin around all sides of the page
- **Section spacing**: Consistent vertical spacing between main sections

### Section Headers

- **Style**: Clear hierarchy with appropriate font size/weight
- **Spacing**: Consistent spacing between header and content
- **Text transform**: Consider `uppercase` for small section labels

### Forms

- **Label position**: Above inputs
- **Input sizing**: Consistent height and padding
- **Field spacing**: Consistent vertical spacing between form fields
- **Error states**: Clear error messaging with appropriate color
- **Help text**: Subtle helper text below inputs when needed

## Responsive Design

- **Mobile breakpoint**: 640px and below
- **Tablet breakpoint**: 641px to 1024px
- **Desktop breakpoint**: 1025px and above
- **Layout changes**: 
  - Single column on mobile
  - Potential two columns on tablet
  - Full layout on desktop

## Best Practices

1. Always use design tokens instead of hard-coded values
2. Maintain consistent spacing throughout the application
3. Use appropriate text sizes for hierarchy and readability
4. Ensure color contrast meets accessibility standards
5. Follow consistent patterns for similar components
6. Centralize shared component definitions
7. Document any exceptions or special cases

## Implementation

The design system is implemented through:

1. A centralized theme file with tokens
2. Shared components that apply these tokens
3. Consistent usage patterns across all modules
4. Regular audits to ensure compliance

By following these guidelines, we ensure a cohesive, professional experience across the entire application.