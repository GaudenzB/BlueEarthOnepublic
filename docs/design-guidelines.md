# BlueEarth Capital Design System Guidelines

This document provides guidelines for implementing the BlueEarth Capital design system in our application. Following these guidelines ensures visual consistency, improves user experience, and speeds up development.

## Core Principles

1. **Consistency** - Use the same visual patterns across the application
2. **Modularity** - Components should be reusable and self-contained
3. **Accessibility** - Design should be accessible to all users
4. **Performance** - Components should be optimized for performance

## Design Tokens

All design values should reference the centralized tokens defined in `client/src/lib/theme.ts` instead of using hardcoded values.

### Usage Example

```tsx
// ✅ GOOD: Reference theme values
<div style={{ padding: theme.spacing[4], color: theme.gray[700] }}>
  Content
</div>

// ❌ BAD: Hardcoded values
<div style={{ padding: '16px', color: '#374151' }}>
  Content
</div>
```

## Color System

The color palette is organized into several categories:

- **Brand Colors**: The primary blue palette that represents our brand identity
- **Grayscale**: Neutral colors for text, backgrounds, and borders
- **Feedback Colors**: Colors used to communicate status (success, warning, error, info)

### Usage Guidelines

- Use brand colors for primary actions and emphasis
- Use grayscale for most UI elements, text, and borders
- Use feedback colors consistently to indicate status

## Typography

The typography system is designed for readability and hierarchy:

- **Font Families**: SF Pro Display (sans-serif) and SF Mono (monospace)
- **Font Sizes**: Range from xs (12px) to 4xl (36px)
- **Font Weights**: Light (300), Regular (400), Medium (500), Semibold (600), Bold (700)

### Heading Guidelines

```tsx
// Example heading styles
<h1 style={{ 
  fontSize: theme.typography.fontSize['3xl'],
  fontWeight: theme.typography.fontWeight.semibold 
}}>
  Page Title
</h1>

<h2 style={{ 
  fontSize: theme.typography.fontSize['2xl'],
  fontWeight: theme.typography.fontWeight.medium
}}>
  Section Title
</h2>
```

## Spacing System

The spacing system is based on a 4px grid, with tokens ranging from 0 to 24 (96px).

### Usage Guidelines

- Use the spacing tokens for margins, padding, and positioning
- Maintain consistent spacing between related elements
- Use larger spacing values to create visual separation between sections

## UI Components

### StatusTag

Used to display status information consistently throughout the application.

```tsx
<StatusTag status="active" />
<StatusTag status="on_leave" text="Away" />
<StatusTag status="in_review" size="large" />
```

### EmployeeCard

Displays employee information in a standardized card format.

```tsx
<EmployeeCard employee={employee} />
<EmployeeCard employee={employee} loading={isLoading} />
```

### PageHeader

Provides a consistent header for all pages.

```tsx
<PageHeader 
  title="Employee Directory" 
  description="View and manage all employees" 
  actions={<Button>Add Employee</Button>}
/>
```

### CardContainer

Wrapper for card content with consistent styling.

```tsx
<CardContainer title="Employee Information">
  <p>Card content goes here</p>
</CardContainer>
```

### EmptyState

Displays a consistent empty state when no data is available.

```tsx
<EmptyState 
  title="No Documents Found" 
  description="Try adjusting your search criteria" 
  icon={<FileOutlined />}
  action={<Button>Upload Document</Button>}
/>
```

## Layout Guidelines

### Page Layout

Pages should follow a consistent layout structure:

1. **Page Header** - Title, description, and actions
2. **Content Area** - Main content with appropriate spacing
3. **Section Headers** - Clear headings for different sections

### Responsive Design

- Use the breakpoint tokens for responsive design
- Implement mobile-first design, adding complexity for larger screens
- Ensure all pages work well on mobile, tablet, and desktop

## Error States

Display errors in a consistent manner using the appropriate feedback colors:

- **Validation Errors** - Use inline error messages with error colors
- **System Errors** - Use error components or toast notifications
- **Empty States** - Use the EmptyState component with appropriate messaging

## Accessibility Guidelines

- Ensure sufficient color contrast (minimum 4.5:1 for normal text)
- Provide alternative text for images and icons
- Make interactive elements keyboard accessible
- Use semantic HTML elements

## Icons

Use Ant Design icons consistently throughout the application:

- Use icons from the @ant-design/icons package
- Maintain consistent sizing for icons within similar contexts
- Use icons to enhance, not replace, text labels for important actions

## Implementation Checklist

When creating new components or pages:

- [ ] Use design tokens from the theme file
- [ ] Follow component patterns for consistency
- [ ] Ensure responsive behavior works correctly
- [ ] Test accessibility compliance
- [ ] Document any new patterns or components

## Resources

- [Ant Design Documentation](https://ant.design/components/overview/)
- [Figma Design System](https://www.figma.com) (Internal link)
- [Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/standards-guidelines/wcag/)