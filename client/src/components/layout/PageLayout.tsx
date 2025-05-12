import React, { ReactNode } from "react";
import { Box, Container, Heading, VStack } from "@chakra-ui/react";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  maxW?: string;
  px?: number | string;
  py?: number | string;
}

/**
 * PageLayout component for consistent page layouts across the application
 * @param children - The content to be displayed in the layout
 * @param title - Optional page title to display at the top
 * @param maxW - Optional max width for the container (default: "container.xl")
 * @param px - Optional horizontal padding (default: 4)
 * @param py - Optional vertical padding (default: 6)
 */
export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  maxW = "container.xl",
  px = 4,
  py = 6,
}) => {
  return (
    <Box as="main" w="full" bg="gray.50">
      <Container maxW={maxW} px={px} py={py}>
        <VStack spacing="8" align="stretch">
          {title && (
            <Heading as="h1" size="xl" color="brand.500">
              {title}
            </Heading>
          )}
          {children}
        </VStack>
      </Container>
    </Box>
  );
};

export default PageLayout;