# BlueEarth Capital Design System Guidelines

This document outlines the design system guidelines for the BlueEarth Capital application, ensuring consistent UI/UX across all components.

## Color System

Our color system is built using CSS variables with HSL values for better control over opacity and light/dark mode variations.

### Primary Colors

- Primary: `--primary` - Teal color (`179 100% 19%`) used for main actions, buttons, and highlights
- Secondary: `--secondary` - Dark gray (`0 0% 10%`) used for secondary actions
- Accent: `--accent` - Light teal (`178 50% 92%`) used for subtle highlights
- Background: `--background` - White in light mode, dark blue-gray in dark mode
- Foreground: `--foreground` - Dark text in light mode, light text in dark mode

### Semantic Colors

- Destructive: `--destructive` - Red color for deletion, warnings
- Link: `--link` - Blue color for links
- Muted: `--muted` - Gray color for less important elements
- Border: `--border` - Light gray for borders

## Typography

### Font Sizes

- xs: 0.75rem (12px)
- sm: 0.875rem (14px)
- base: 1rem (16px)
- lg: 1.125rem (18px)
- xl: 1.25rem (20px)
- 2xl: 1.5rem (24px)
- 3xl: 1.875rem (30px)
- 4xl: 2.25rem (36px)

### Font Weights

- normal: 400
- medium: 500
- semibold: 600
- bold: 700

## Spacing

Consistent spacing using variables:

- xs: 0.25rem (4px)
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)
- 2xl: 3rem (48px)

## Components

### Tabs

Tabs use a clear contrast between active and inactive states to ensure accessibility:

- **TabsList**: 
  - Light background (bg-muted/10) with a subtle border
  - Height of 12 (h-12) to provide adequate touch targets
  - Proper spacing with padding (p-1)

- **TabsTrigger**: 
  - Active: 
    - Bold text (font-bold) with primary color (text-primary)
    - A bottom border (border-b-2 border-primary) to visually highlight the active tab
    - Background change to white (bg-background)
    - Subtle shadow for depth (shadow-sm)
  - Inactive: 
    - Medium weight text (font-medium) with muted-foreground color
    - Hover state with subtle background change (hover:bg-muted/10)

**Implementation Notes:**
- Use generous padding (px-5 py-2.5) to provide comfortable click/tap targets
- Maintain a minimum 4.5:1 contrast ratio between text and background colors
- Use font weight differences (medium vs bold) to reinforce visual hierarchy
- Add a primary-colored bottom border to the active tab for clear visual indication

### Buttons

- Primary: Filled background with the primary color
- Secondary: Outlined with primary color
- Destructive: Red background for dangerous actions
- Link: Text-only with link color
- Ghost: No background until hovered

### Form Elements

- Input: Light background with darker border
- Select: Similar to Input with dropdown indicator
- Checkbox: Square with a check mark when selected
- Radio: Circle with a dot when selected

## Accessibility Guidelines

- All interactive elements must have a minimum contrast ratio of 4.5:1
- Focus states must be clearly visible
- Text should maintain a minimum contrast ratio of 4.5:1 (7:1 for small text)
- Hover and active states should provide clear visual feedback
- Disable states should have reduced opacity but maintain sufficient contrast

## Dark Mode Considerations

- Dark mode uses darker backgrounds and lighter text
- Contrast ratios should be maintained or improved in dark mode
- Avoid pure white text on dark backgrounds; use slightly off-white (e.g., 95% white)
- Shadow effects should be more subtle in dark mode

## Implementation Best Practices

- Use the provided CSS variables and utility classes
- Keep component styles consistent by using the shadcn components
- Use the Tailwind classes that reference the design system variables
- For custom styles, always refer back to this design system