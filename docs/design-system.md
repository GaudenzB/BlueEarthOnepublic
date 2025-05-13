# BlueEarthOne – Design System Guidelines

## Primary UI Library

- **Use**: Chakra UI (`@chakra-ui/react`)
- **Do not use**: shadcn/ui, raw Tailwind, or inline styles

## Styling Rules

- Use Chakra's **style props** (e.g., `p={4}`, `color="gray.100"`)
- Follow spacing and font scale from `theme.ts`

## Theme & Tokens

- Primary brand color: `brand.500` (`#004080`)
- Font family: `"Inter", sans-serif`
- Background: `gray.50` for app pages

## Components

- Use Chakra's built-in components:
  - Layout: `Box`, `Flex`, `Container`
  - Inputs: `Input`, `Select`, `Checkbox`
  - Navigation: `Tabs`, `Breadcrumb`, etc.
  - UI: `Button`, `Heading`, `Text`, `Icon`, `Avatar`

## Page Layout

- Use `<PageLayout>` from `components/PageLayout.tsx`
- Max width: `maxW="6xl"` inside a `Container`
- Default page heading: `Heading size="lg" color="brand.700"`

## Icons

- Use `@chakra-ui/icons`
- Only use external icon libraries when Chakra lacks the required icon

## Reference

- Use `DocumentsPage` as a visual and layout reference
- All new pages should follow the same spacing, heading, and padding structure