import { Box, Container, Heading } from "@chakra-ui/react";
import React from "react";

/**
 * Page layout component that follows the BlueEarthOne design system.
 * 
 * This component provides a consistent layout for all pages in the application,
 * including a header with the page title and a container for content.
 * 
 * @see docs/design-system.md for design system guidelines.
 */
type PageLayoutProps = {
  /** Page title to be displayed in the header */
  title: string;
  /** Page content */
  children: React.ReactNode;
};

export function PageLayout({ title, children }: PageLayoutProps) {
  return (
    <Box minH="100vh" bg="gray.50">
      <Box as="header" bg="white" boxShadow="sm" py={4} px={6}>
        <Heading size="lg" color="brand.700">
          {title}
        </Heading>
      </Box>
      <Container maxW="6xl" py={6}>
        {children}
      </Container>
    </Box>
  );
}