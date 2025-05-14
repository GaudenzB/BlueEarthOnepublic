# BlueEarth Capital - Design System Guidelines

This document provides a comprehensive guide to the BlueEarth Capital design system, ensuring consistency, accessibility, and a professional user experience across all application interfaces.

## Core Design Principles

1. **Clarity** - Information hierarchy and user flows should be immediately clear to users of all technical levels.
2. **Professionalism** - Maintain a polished, enterprise-grade aesthetic appropriate for financial services.
3. **Efficiency** - Interface elements should facilitate quick task completion with minimal friction.
4. **Consistency** - Use standardized patterns across the entire application to build user familiarity.
5. **Accessibility** - Ensure all interfaces meet WCAG 2.1 AA standards at minimum.

## Color System

### Primary Brand Colors

Our brand palette centers around a professional blue, supplemented with supporting neutrals:

```
Primary: #0F5E9C (theme.brand[600])
```

Usage:
- Primary buttons and interactive elements
- Navigation elements
- Key data visualization
- Section headers

### Neutral Colors

A range of grays provide structure and hierarchy:

```
Background: #F9FAFB (theme.gray[50]) 
Dividers: #E5E7EB (theme.gray[200])
Secondary text: #6B7280 (theme.gray[500])
Primary text: #111827 (theme.gray[900])
```

### Feedback Colors

Distinct colors communicate specific states:

```
Success: #16A34A (theme.success[500])
Warning: #F59E0B (theme.warning[500]) 
Error: #DC2626 (theme.error[500])
Info: #3B82F6 (theme.info[500])
```

Usage:
- Success colors for confirmations and completed states
- Warning colors for alerts requiring attention
- Error colors for critical issues needing correction
- Info colors for neutral notifications and guidance

## Typography

### Font Hierarchy

```
Primary: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif
Monospace: 'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace (for code/data)
```

### Font Sizes

```
Extra Small: 0.75rem (12px) - theme.typography.fontSize.xs
Small: 0.875rem (14px) - theme.typography.fontSize.sm
Base: 1rem (16px) - theme.typography.fontSize.base
Large: 1.125rem (18px) - theme.typography.fontSize.lg
Extra Large: 1.25rem (20px) - theme.typography.fontSize.xl
2XL: 1.5rem (24px) - theme.typography.fontSize['2xl']
3XL: 1.875rem (30px) - theme.typography.fontSize['3xl']
4XL: 2.25rem (36px) - theme.typography.fontSize['4xl']
```

### Font Weights

```
Light: 300 - theme.typography.fontWeight.light
Regular: 400 - theme.typography.fontWeight.normal
Medium: 500 - theme.typography.fontWeight.medium
Semibold: 600 - theme.typography.fontWeight.semibold
Bold: 700 - theme.typography.fontWeight.bold
```

### Usage Guidelines

- Page titles: 2XL/Semibold
- Section headers: XL/Semibold
- Subsection headers: Large/Medium
- Body text: Base/Regular
- Secondary text: Small/Regular
- Labels: Small/Medium
- Data tables: Small/Regular
- Buttons: Small/Medium

## Spacing System

Our spacing follows a 4px grid system:

```
0: 0
1: 0.25rem (4px)
2: 0.5rem (8px)
3: 0.75rem (12px)
4: 1rem (16px)
5: 1.25rem (20px)
6: 1.5rem (24px)
8: 2rem (32px)
10: 2.5rem (40px)
12: 3rem (48px)
16: 4rem (64px)
20: 5rem (80px)
24: 6rem (96px)
```

### Layout Spacing

- **Outer page margins**: 16px mobile, 24px tablet, 32px desktop
- **Content padding**: 16px (sm), 24px (md), 32px (lg)
- **Card padding**: 16px (sm), 24px (md)
- **Section spacing**: 24px mobile, 32px desktop
- **Form field spacing**: 16px
- **Inline element spacing**: 8px

## Component Guidelines

### Buttons

#### Primary Button
- Background: Primary color (#0F5E9C)
- Text color: White
- Border radius: 4px
- Padding: 8px 16px (sm), 10px 20px (md)
- Font: Small/Medium
- Hover state: Slightly darker (#0D5089)

#### Secondary Button
- Background: White
- Border: 1px solid Primary color
- Text color: Primary color
- Same padding/radius as primary

#### Text Button
- No background/border
- Text color: Primary color
- Hover: Text decoration underline

### Form Elements

#### Input Fields
- Height: 40px
- Border radius: 4px
- Border color: theme.gray[300]
- Focus state: 2px border Primary color
- Placeholder text color: theme.gray[400]
- Padding: 8px 12px
- Font: Small/Regular

#### Select Dropdowns
- Same styling as Input fields
- Dropdown icon: theme.gray[500]
- Options padding: 8px 12px
- Selected option: Light primary background

#### Checkboxes & Radio Buttons
- Size: 16px x 16px
- Checked state: Primary color
- Border radius: 2px (checkboxes), full (radio)

### Cards

- Background: White
- Border radius: 8px
- Box shadow: theme.shadows.md
- Padding: 16px (sm), 24px (md)
- Title: Large/Medium
- Content spacing: 16px

### Tables

- Header background: theme.gray[100]
- Header text: Small/Medium, theme.gray[700]
- Row border-bottom: 1px solid theme.gray[200]
- Cell padding: 12px 16px
- Row hover: theme.gray[50]
- Font: Small/Regular

### Status Indicators

- **Pills/Tags**: Border radius 16px, padding 4px 12px
- **Success**: Green background (success[100]), green text (success[700])
- **Warning**: Yellow background (warning[100]), yellow text (warning[700])
- **Error**: Red background (error[100]), red text (error[700])
- **Info**: Blue background (info[100]), blue text (info[700])

## Iconography

### System Icons
- Use Ant Design Icons consistently throughout the application
- Maintain consistent sizing (16px for inline, 20px for UI elements)
- Match icon color to accompanying text
- Use outlined variants for general UI, filled for active/selected states

### Interface Icons
Use specific icons consistently across the platform:

- Document actions: FileOutlined, FileAddOutlined
- User actions: UserOutlined, TeamOutlined
- Settings: SettingOutlined
- Navigation: ArrowLeftOutlined, ArrowRightOutlined
- Alerts: ExclamationCircleOutlined, CheckCircleOutlined
- Common actions: EditOutlined, DeleteOutlined, SearchOutlined

## Responsive Design

### Breakpoints

```
xs: 480px
sm: 640px
md: 768px
tablet landscape: 1024px
desktop: 1280px
large desktop: 1536px
```

### Responsive Principles
- Use a mobile-first approach
- Stack elements vertically on mobile
- Use appropriate component sizing
- Adjust whitespace proportionally
- Hide secondary content on smaller screens
- Maintain touch targets minimum 44px on mobile

## Accessibility Guidelines

- Maintain color contrast ratio of at least 4.5:1 for all text
- Never use color alone to convey meaning
- Provide text alternatives for non-text content
- Ensure keyboard navigability for all interactive elements
- Use properly structured semantic HTML elements
- Implement ARIA attributes when necessary
- Test all interfaces with screen readers

## Animation & Transitions

- Keep transitions subtle and purpose-driven
- Standard transition time: 300ms
- Fast transitions: 150ms (for hover states)
- Use easing curves: ease-in-out for most transitions
- Avoid animations that prevent user interaction
- Consider reduced-motion preferences

## Implementation Guidelines

### Using Theme Tokens

Always reference the centralized theme tokens:

```tsx
import { theme } from '@/lib/theme';

// Good example
<Button style={{ backgroundColor: theme.brand[600] }}>

// Bad example - avoid hardcoding values
<Button style={{ backgroundColor: '#0F5E9C' }}>
```

### Component Best Practices

1. Use Ant Design components as the foundation
2. Extend components with consistent styling based on this guide
3. Create reusable custom components for repeated patterns
4. Document component usage with examples
5. Implement responsive behavior using theme breakpoints
6. Test across all supported viewport sizes

## Customizing Ant Design

### Theme Configuration

Configure the Ant Design theme to match our design system:

```tsx
// Example configuration
const antdConfig = {
  token: {
    colorPrimary: theme.brand[600],
    colorSuccess: theme.success[500],
    colorWarning: theme.warning[500],
    colorError: theme.error[500],
    colorInfo: theme.info[500],
    borderRadius: 4,
    fontFamily: theme.typography.fontFamily.sans
  }
};
```

### Component Customization

When customizing Ant Design components:

1. Maintain consistency with Ant Design patterns
2. Extend rather than override base functionality
3. Use Ant Design's built-in customization options where possible
4. Create wrapper components for complex customizations
5. Document any deviations from standard Ant Design behavior

## File Structure & Import Patterns

### Component Organization

```
/components
  /ui              # Shared UI components
    StatusTag.tsx  # Reusable status tag component
    CardContainer.tsx  # Standard card layout
    PageHeader.tsx  # Consistent page headers
    EmptyState.tsx  # Standard empty state
    index.ts       # Re-export all UI components
  /employee        # Feature-specific components
  /documents       # Feature-specific components
```

### Import Best Practices

```tsx
// Import from UI components collection
import { StatusTag, PageHeader } from '@/components/ui';

// Import theme
import { theme } from '@/lib/theme';

// Import antd components
import { Table, Button } from 'antd';
import { UserOutlined } from '@ant-design/icons';
```

---

This design system guide is a living document that will evolve as our application grows and as we gather user feedback.