import React from "react";
import PageLayout from "@/components/layout/PageLayout";
import { 
  Button, 
  Box, 
  Card, 
  CardBody, 
  CardHeader, 
  Flex, 
  Heading, 
  Stack, 
  Text,
  VStack, 
  HStack,
  useColorModeValue,
  Badge
} from "@chakra-ui/react";

/**
 * Test page for Chakra UI integration
 * Showcases various Chakra UI components with BlueEarth branding
 */
const ChakraTestPage: React.FC = () => {
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  
  return (
    <PageLayout title="Chakra UI Components" maxW="container.xl">
      <Text mb={6}>
        This page demonstrates Chakra UI components with BlueEarth Capital branding.
      </Text>
      
      <Heading as="h2" size="lg" mb={4}>Button Variations</Heading>
      <Flex wrap="wrap" gap={4} mb={8}>
        <Button colorScheme="brand">Primary Button</Button>
        <Button variant="outline" colorScheme="brand">Outline Button</Button>
        <Button variant="ghost" colorScheme="brand">Ghost Button</Button>
        <Button colorScheme="accent">Accent Button</Button>
        <Button variant="link" colorScheme="brand">Link Button</Button>
      </Flex>

      <Heading as="h2" size="lg" mb={4}>Cards & Containers</Heading>
      <Stack direction={{ base: "column", md: "row" }} spacing={6} mb={8}>
        <Card 
          bg={bgColor} 
          boxShadow="md" 
          borderRadius="lg" 
          borderWidth="1px"
          borderColor={borderColor}
          flex="1"
        >
          <CardHeader pb={0}>
            <HStack justify="space-between">
              <Heading size="md">Employee Profile</Heading>
              <Badge colorScheme="green">Active</Badge>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={2}>
              <Text>
                <strong>Name:</strong> John Smith
              </Text>
              <Text>
                <strong>Position:</strong> Finance Manager
              </Text>
              <Text>
                <strong>Department:</strong> Finance
              </Text>
              <Text>
                <strong>Email:</strong> john.smith@blueearth.capital
              </Text>
            </VStack>
          </CardBody>
        </Card>

        <Card 
          bg={bgColor} 
          boxShadow="md" 
          borderRadius="lg" 
          borderWidth="1px"
          borderColor={borderColor}
          flex="1"
        >
          <CardHeader pb={0}>
            <Heading size="md">Document Overview</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={3}>
              <Box p={3} borderWidth="1px" borderRadius="md" borderColor={borderColor}>
                <Text fontWeight="bold">Q2 Financial Report.pdf</Text>
                <Text fontSize="sm" color="gray.600">Uploaded: May 10, 2025</Text>
              </Box>
              <Box p={3} borderWidth="1px" borderRadius="md" borderColor={borderColor}>
                <Text fontWeight="bold">Investment Strategy.docx</Text>
                <Text fontSize="sm" color="gray.600">Uploaded: May 8, 2025</Text>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </Stack>

      <Heading as="h2" size="lg" mb={4}>Color Palette</Heading>
      <Text mb={3}>Brand Colors</Text>
      <Flex wrap="wrap" gap={2} mb={6}>
        <Box bg="brand.50" p={4} borderRadius="md" w="100px" h="100px" display="flex" alignItems="center" justifyContent="center">
          <Text fontSize="sm" fontWeight="bold">brand.50</Text>
        </Box>
        <Box bg="brand.100" p={4} borderRadius="md" w="100px" h="100px" display="flex" alignItems="center" justifyContent="center">
          <Text fontSize="sm" fontWeight="bold">brand.100</Text>
        </Box>
        <Box bg="brand.300" p={4} borderRadius="md" w="100px" h="100px" display="flex" alignItems="center" justifyContent="center">
          <Text fontSize="sm" fontWeight="bold" color="white">brand.300</Text>
        </Box>
        <Box bg="brand.500" p={4} borderRadius="md" w="100px" h="100px" display="flex" alignItems="center" justifyContent="center">
          <Text fontSize="sm" fontWeight="bold" color="white">brand.500</Text>
        </Box>
        <Box bg="brand.700" p={4} borderRadius="md" w="100px" h="100px" display="flex" alignItems="center" justifyContent="center">
          <Text fontSize="sm" fontWeight="bold" color="white">brand.700</Text>
        </Box>
        <Box bg="brand.900" p={4} borderRadius="md" w="100px" h="100px" display="flex" alignItems="center" justifyContent="center">
          <Text fontSize="sm" fontWeight="bold" color="white">brand.900</Text>
        </Box>
      </Flex>

      <Text mb={3}>Accent Colors</Text>
      <Flex wrap="wrap" gap={2} mb={6}>
        <Box bg="accent.50" p={4} borderRadius="md" w="100px" h="100px" display="flex" alignItems="center" justifyContent="center">
          <Text fontSize="sm" fontWeight="bold">accent.50</Text>
        </Box>
        <Box bg="accent.100" p={4} borderRadius="md" w="100px" h="100px" display="flex" alignItems="center" justifyContent="center">
          <Text fontSize="sm" fontWeight="bold">accent.100</Text>
        </Box>
        <Box bg="accent.300" p={4} borderRadius="md" w="100px" h="100px" display="flex" alignItems="center" justifyContent="center">
          <Text fontSize="sm" fontWeight="bold" color="white">accent.300</Text>
        </Box>
        <Box bg="accent.500" p={4} borderRadius="md" w="100px" h="100px" display="flex" alignItems="center" justifyContent="center">
          <Text fontSize="sm" fontWeight="bold" color="white">accent.500</Text>
        </Box>
        <Box bg="accent.700" p={4} borderRadius="md" w="100px" h="100px" display="flex" alignItems="center" justifyContent="center">
          <Text fontSize="sm" fontWeight="bold" color="white">accent.700</Text>
        </Box>
        <Box bg="accent.900" p={4} borderRadius="md" w="100px" h="100px" display="flex" alignItems="center" justifyContent="center">
          <Text fontSize="sm" fontWeight="bold" color="white">accent.900</Text>
        </Box>
      </Flex>
    </PageLayout>
  );
};

export default ChakraTestPage;