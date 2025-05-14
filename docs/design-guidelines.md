# BlueEarth Financial Portal Design Guidelines

## Design Philosophy
The BlueEarth Financial Portal follows a design philosophy centered on creating a trustworthy, professional experience that inspires confidence while maintaining a modern aesthetic. Our design should evoke:

- **Trust and Stability**: Use of reserved color palette and classic design patterns
- **Precision and Clarity**: Clear information hierarchy and typography
- **Professional Polish**: Refined interactions and consistent visual language
- **Modern Financial Services**: Contemporary styling within a traditional foundation

## Color Palette

### Primary Colors
- **Corporate Blue**: `#0e4a86` - Primary brand color, used for primary actions and key highlights
- **Deep Navy**: `#172554` - Used for headers and important text
- **Financial Green**: `#10b981` - Success states, positive indicators

### Secondary Colors
- **Charcoal**: `#1e293b` - Used for primary text
- **Slate**: `#64748b` - Used for secondary text
- **Light Gray**: `#f8fafc` - Background color for panels and containers

### Accent Colors
- **Gold**: `#f59e0b` - Warnings and important alerts
- **Ruby**: `#e11d48` - Error states and critical information
- **Royal Purple**: `#8b5cf6` - Special feature highlights

### Status Colors
- **Active**: `#10b981` (green)
- **Pending**: `#3b82f6` (blue) 
- **Warning**: `#f59e0b` (amber)
- **Error**: `#ef4444` (red)
- **Inactive**: `#6b7280` (gray)

## Typography

### Font Families
- **Primary Font**: Inter - Used for all UI text
- **Heading Font**: Inter - Used with appropriate weights for headings

### Font Sizes
- **Headings**:
  - H1: 28px
  - H2: 24px
  - H3: 20px
  - H4: 18px
  - H5: 16px
  - H6: 14px

- **Body Text**:
  - Body Large: 16px
  - Body Regular: 14px
  - Body Small: 12px

### Font Weights
- **Bold**: 600 - Used for headings and emphasis
- **Medium**: 500 - Used for subheadings and important UI elements
- **Regular**: 400 - Used for body text

## Component Styling

### Buttons
- **Primary**: Blue background, white text, subtle shadow, slight border radius
- **Secondary**: White background, blue text and border
- **Destructive**: Red version of the primary style
- **Text Button**: No background, color-only interactive elements
- **Size Variants**: Small (24px), Default (32px), Large (40px)

### Cards
- Subtle border and shadow
- 8px border radius
- 16-24px padding (depending on card significance)
- Subtle borders (1px, #e5e7eb)
- Optional header section with stronger visual separation

### Tables
- Header row with light background (#f8fafc)
- Subtle row separators (1px, #e2e8f0)
- Row hover state (#f1f5f9)
- Comfortable padding (12-16px vertical, 16px horizontal)
- Optional zebra striping for dense tables

### Forms
- Field grouping with clear labeling
- 8px spacing between related elements
- 16px spacing between groups
- Inline validation with clear visual indicators
- Helpful field descriptions where needed

### Status Indicators
- Use the StatusTag component for consistent status display
- Each status type has consistent color, icon, and text
- Size variants: Small, Default, Large

## Layout and Spacing

### Grid System
- 24-column grid for desktop layouts
- 12-column grid for tablet
- Fluid single column for mobile

### Spacing Scale
- 4px base unit
- Primary increments: 4, 8, 12, 16, 24, 32, 48, 64px

### Container Widths
- Maximum content width: 1200px
- Forms: 600-800px maximum width
- Cards: Flexible, context-dependent

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 641px - 1024px
- Desktop: > 1024px
- Large Desktop: > 1440px

## Component Usage Guidelines

### StatusTag
Used for displaying status information consistently across the application. Available status types:
- active, inactive, on_leave, remote (employee statuses)
- completed, processing, failed, warning, pending (document statuses)
- draft, in_review, approved, expired, rejected (approval statuses)
- version, restricted, archived (special types)

Example:
```tsx
<StatusTag status="active" />
<StatusTag status="in_review" text="Under Review" />
```

### EmployeeCard
Used for displaying employee information in listings and grids. Available variants:
- compact: Minimal info for grid layouts
- detailed: More information for detailed views

Example:
```tsx
<EmployeeCard employee={employee} variant="compact" />
```

### Document Components
- DocumentStatusBadge: Consistently styled status for documents
- DocumentProcessingAlert: Information banners for documents in processing
- DocumentTags: Categorization tags using StatusTag

## Icon Usage
The application uses the Ant Design icon library consistently throughout the interface. Icons serve to:
- Provide visual cues for actions
- Reinforce status messaging
- Add visual hierarchy to dense information

## Accessibility Guidelines
- Minimum contrast ratio of 4.5:1 for text
- Fully keyboard navigable interface
- Focus states clearly visible
- Semantic HTML structure
- ARIA attributes where appropriate
- Screen reader friendly content

## Animation and Transitions
- Subtle, purposeful animations
- Standard transition speed: 200-300ms
- Avoid animations that block user interaction
- Respect reduced motion preferences

## Implementation Notes
- Use CSS variables for theme values
- Implement responsive designs using breakpoints
- Maintain consistent component props and APIs
- Use the existing Ant Design component library