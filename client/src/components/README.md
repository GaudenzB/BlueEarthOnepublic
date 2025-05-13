# BlueEarthOne Components

This directory contains the shared components used throughout the BlueEarthOne application. All components should follow the design system guidelines documented in `docs/design-system.md`.

## Core Components

### PageLayout

`PageLayout.tsx` provides the standard page wrapper for all application pages. It includes:

- Consistent page background
- Page title header with proper styling
- Content container with appropriate max width and padding

Example usage:

```tsx
import { PageLayout } from "@/components/PageLayout";

export default function MyPage() {
  return (
    <PageLayout title="My Page Title">
      {/* Your page content here */}
    </PageLayout>
  );
}
```

## Component Development Guidelines

When creating new components:

1. Use Chakra UI components and style props
2. Follow the theme settings from `theme.ts`
3. Keep components focused on a single responsibility
4. Document props with clear TypeScript interfaces
5. Use consistent naming conventions

For more details, refer to the full design system guidelines in `docs/design-system.md`.