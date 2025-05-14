# BlueEarth Capital Design System

## Overview

This design system provides a comprehensive set of guidelines and components to ensure a consistent, professional UI across the BlueEarth Capital application. The system is built on top of Ant Design with customizations that reflect our financial services aesthetic - trustworthy, classic, elegant, and modern.

## Color System

### Primary Colors

- **Primary Blue** (`#0e4a86`): Used for primary buttons, important UI elements, and brand identification
- **Hover Blue** (`#1e63a5`): Applied to interactive elements on hover state
- **Light Blue** (`#f0f7ff`): Used for subtle backgrounds and selected states
- **Dark Blue** (`#0a3a68`): Used for active states and emphasized UI elements

### Text Colors

- **Primary Text** (`#1e293b`): Default text color for body copy and headers
- **Secondary Text** (`#64748b`): Used for supporting text and less important information
- **Muted Text** (`#94a3b8`): Used for placeholders, disabled states, and tertiary content
- **Inverse Text** (`#ffffff`): White text for use on dark backgrounds

### Status Colors

- **Success** (`#10b981`): Indicates successful actions, approved status, active status
- **Warning** (`#f59e0b`): Indicates caution, pending states, or attention required
- **Error** (`#ef4444`): Indicates errors, rejected states, or destructive actions
- **Info** (`#3b82f6`): Indicates informational content or review states
- **Draft** (`#94a3b8`): Indicates draft or incomplete status

### Background Colors

- **Page Background** (`#f8fafc`): Default background for all pages
- **Card Background** (`#ffffff`): White background for cards and content containers
- **Subtle Background** (`#f1f5f9`): Light grey for secondary backgrounds
- **Selected Background** (`#f0f7ff`): Light blue for selected items
- **Hover Background** (`#f0f7ff`): Light blue for hover states

### Border Colors

- **Light Border** (`#eaecf0`): Light grey for subtle borders
- **Default Border** (`#d1d5db`): Medium grey for standard borders
- **Focus Border** (`#0e4a86`): Primary blue for focus states

## Typography

Our typography system uses a clean, professional font hierarchy optimized for financial applications.

### Font Family

```
Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif
```

### Font Sizes

- **xs**: 12px (0.75rem) - Smallest size for auxiliary text, footnotes
- **sm**: 13px (0.813rem) - Small size for secondary text
- **md**: 14px (0.875rem) - Default size for body text in data-dense areas
- **base**: 16px (1rem) - Default body text size
- **lg**: 18px (1.125rem) - Large text, small headings
- **xl**: 20px (1.25rem) - Extra large text, subheadings
- **2xl**: 24px (1.5rem) - Level 3 headings
- **3xl**: 30px (1.875rem) - Level 2 headings
- **4xl**: 36px (2.25rem) - Level 1 headings
- **5xl**: 48px (3rem) - Hero text, large display text

### Font Weights

- **Regular**: 400 - Default body text
- **Medium**: 500 - Emphasis, buttons, subheadings
- **Semibold**: 600 - Section headings
- **Bold**: 700 - Page titles, strong emphasis

## Spacing

Our spacing system uses a consistent scale to ensure proper layout and component spacing.

### Scale

- **0**: 0
- **0.5**: 2px (0.125rem)
- **1**: 4px (0.25rem)
- **1.5**: 6px (0.375rem)
- **2**: 8px (0.5rem)
- **2.5**: 10px (0.625rem)
- **3**: 12px (0.75rem)
- **4**: 16px (1rem)
- **5**: 20px (1.25rem)
- **6**: 24px (1.5rem)
- **8**: 32px (2rem)
- **10**: 40px (2.5rem)
- **12**: 48px (3rem)
- **16**: 64px (4rem)

### Semantic Aliases

- **xs**: 8px (0.5rem)
- **sm**: 12px (0.75rem)
- **md**: 16px (1rem)
- **lg**: 24px (1.5rem)
- **xl**: 32px (2rem)
- **2xl**: 40px (2.5rem)
- **3xl**: 48px (3rem)

## Shadows and Elevation

Shadows provide subtle depth cues and elevation hierarchy.

- **none**: No shadow
- **xs**: `0 1px 2px 0 rgba(0, 0, 0, 0.05)` - Subtle shadow for low-level elements
- **sm**: `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)` - Default card shadow
- **md**: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)` - Medium elevation
- **lg**: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)` - High elevation
- **xl**: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)` - Modal/dialog shadow
- **2xl**: `0 25px 50px -12px rgba(0, 0, 0, 0.25)` - Highest elevation

## Border Radius

- **none**: 0 - No rounding
- **xs**: 2px - Minimal rounding
- **sm**: 4px - Subtle rounding
- **md**: 6px - Default border radius
- **lg**: 8px - Card border radius
- **xl**: 12px - Prominent UI elements
- **2xl**: 16px - Large UI elements
- **3xl**: 24px - Very large UI elements
- **full**: 9999px - Circular elements

## Component Styles

### Buttons

Buttons follow a consistent style with variants for different actions.

- **Height**: 40px
- **Padding**: 0 16px
- **Border Radius**: 6px (md)
- **Font Weight**: Medium (500)
- **Transition**: Standard (0.25s ease-in-out)

### Cards

Cards are used to group related content and provide visual separation.

- **Border Radius**: 8px (lg)
- **Box Shadow**: sm
- **Background**: White
- **Border**: 1px solid light border
- **Padding**: 16px (md)

### Inputs

Form inputs maintain consistent styling for usability.

- **Height**: 40px
- **Padding**: 0 12px
- **Border Radius**: 6px (md)
- **Border**: 1px solid default border
- **Background**: White

### Tables

Tables present data in a clean, scannable format.

- **Header Background**: Subtle background
- **Row Hover Background**: Hover background
- **Border Color**: Light border
- **Padding**: 16px (md)

## Usage with Ant Design

This design system is built on top of Ant Design with customizations to match our financial services aesthetic. The theme configuration is applied globally to all Ant Design components.

### Implementation

The theme is configured in `client/src/theme/ant-theme.ts` and applied in the root component through Ant Design's `ConfigProvider`.

### Examples

```tsx
// Button example
<Button type="primary">Primary Action</Button>
<Button>Secondary Action</Button>

// Card example
<Card title="Financial Report">
  <p>Content here</p>
</Card>

// Form example
<Form layout="vertical">
  <Form.Item label="Name">
    <Input placeholder="Enter your name" />
  </Form.Item>
</Form>
```

## Status Indicators

Status indicators use consistent colors and labels to communicate state.

### Status Tags

- **Active**: Green
- **Inactive**: Red
- **Pending**: Amber
- **Completed**: Green
- **In Review**: Blue
- **Approved**: Green
- **Rejected**: Red
- **Draft**: Grey

## Responsive Design

The application follows a responsive design approach with breakpoints aligned to standard device sizes.

### Breakpoints

- **xs**: < 576px (Mobile)
- **sm**: ≥ 576px (Large mobile)
- **md**: ≥ 768px (Tablet)
- **lg**: ≥ 992px (Desktop)
- **xl**: ≥ 1200px (Large desktop)
- **xxl**: ≥ 1600px (Extra large desktop)