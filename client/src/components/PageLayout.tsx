import { Box, Container, Heading } from "@chakra-ui/react";
import React from "react";

type PageLayoutProps = {
  title: string;
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