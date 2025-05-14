# BlueEarth Capital Design System

This document outlines the design system guidelines for BlueEarth Capital's employee management platform, focusing on creating a professional, trustworthy financial services aesthetic.

## Color Palette

### Primary Colors
- Primary Blue: `#0e4a86` - Used for primary actions, important UI elements
- Secondary Blue: `#1e63a5` - Used for hover states and secondary emphasis
- Accent Blue: `#f0f7ff` - Light blue for selected states and highlights

### Neutral Colors
- Dark Text: `#1e293b` - Primary text color
- Medium Text: `#64748b` - Secondary text, labels
- Light Text: `#94a3b8` - Tertiary text, placeholders
- Border: `#eaecf0` - Borders, dividers
- Background: `#f9fafc` - Page background
- White: `#ffffff` - Component backgrounds

### Semantic Colors
- Success: `#10b981` - Success states, approvals
- Warning: `#f59e0b` - Warning states, pending actions
- Error: `#ef4444` - Error states, destructive actions
- Info: `#3b82f6` - Informational states

## Typography

### Font Family
- Primary: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

### Font Weights
- Regular: `400`
- Medium: `500`
- Semibold: `600`
- Bold: `700`

### Font Sizes
- XS: `12px`
- SM: `14px`
- Base: `16px`
- LG: `18px`
- XL: `20px`
- 2XL: `24px`
- 3XL: `30px`
- 4XL: `36px`

## Spacing

Our spacing scale follows an 8px base unit:
- `4px` - Extra small spacing (XS)
- `8px` - Small spacing (SM)
- `16px` - Medium spacing (MD)
- `24px` - Large spacing (LG)
- `32px` - Extra large spacing (XL)
- `48px` - 2XL spacing
- `64px` - 3XL spacing

## Component Styling

### Cards
```
{
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(16, 24, 40, 0.1)',
  border: '1px solid #eaecf0',
  transition: 'all 0.2s ease-in-out'
}
```

### Buttons
- Primary Button: Solid blue background with white text
- Secondary Button: White background with blue border and text
- Tertiary Button: No background or border, just text color

### Form Inputs
- Height: `40px`
- Border Radius: `6px`
- Border Color: `#d1d5db`
- Focus State: Blue ring with slight shadow

### Tables
- Header Background: `#f9fafc`
- Row Border: `1px solid #eaecf0`
- Alternate Row Background: `#f9fafc` (optional)
- Row Hover: `#f0f7ff`

## Status Indicators

### Status Tag Variants
- Completed/Approved: Green (`#10b981`)
- Pending: Yellow (`#f59e0b`)
- In Review: Blue (`#3b82f6`)
- Rejected: Red (`#ef4444`)
- Draft: Gray (`#94a3b8`)

## Layout Guidelines

### Container Widths
- Max Content Width: `1280px`
- Sidebar Width: `280px`
- Panel Width: `320px` (for side panels)

### Grid System
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3-4 columns
- Large Desktop: 4-6 columns

### Margins & Padding
- Page Margins: `24px` (mobile), `32px` (tablet), `48px` (desktop)
- Card Padding: `24px`
- Section Spacing: `48px` between major sections

## Shadows

### Shadow Levels
```
shadows: {
  sm: '0 1px 2px rgba(16, 24, 40, 0.05)',
  md: '0 4px 6px -1px rgba(16, 24, 40, 0.1)',
  lg: '0 10px 15px -3px rgba(16, 24, 40, 0.1)',
  xl: '0 20px 25px -5px rgba(16, 24, 40, 0.1)'
}
```

## Animation & Transitions

- Default Transition: `all 0.2s ease-in-out`
- Hover Transition: `all 0.15s ease`
- Page Transition: `all 0.3s ease-in-out`