import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { 
  Box, 
  Container, 
  Heading, 
  Alert, 
  AlertIcon, 
  Text,
  Flex,
  ButtonGroup,
  Button as ChakraButton,
  useColorModeValue
} from "@chakra-ui/react";
import { InfoOutlineIcon } from "@chakra-ui/icons";
import { Button } from "@/components/ui/button";
import DocumentList from "@/components/documents/DocumentList";
import DocumentUpload from "@/components/documents/DocumentUpload";
import { PlusIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PermissionGuard } from "@/components/permissions/PermissionGuard";

export default function Documents() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { toast } = useToast();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  
  const { data: documentsResponse, isLoading, refetch } = useQuery({
    queryKey: ['/api/documents']
  });
  
  // Extract the documents array from the response
  const documents = React.useMemo(() => {
    if (!documentsResponse) return [];
    
    // Check if response has the expected structure
    if (documentsResponse && 'success' in documentsResponse && 'data' in documentsResponse) {
      // This is the standard API response format
      return documentsResponse.data || [];
    }
    
    // If it's already an array, return it directly (fall back for direct array responses)
    if (Array.isArray(documentsResponse)) {
      return documentsResponse;
    }
    
    // Default case: we couldn't find documents
    console.warn('Unexpected document response format:', documentsResponse);
    return [];
  }, [documentsResponse]);

  const handleUploadSuccess = () => {
    toast({
      title: "Document uploaded successfully",
      description: "Your document has been uploaded and is being processed.",
    });
    refetch();
    setIsUploadModalOpen(false);
  };

  return (
    <>
      <Helmet>
        <title>Documents | BlueEarth Capital</title>
        <meta name="description" content="Document management for BlueEarth Capital. View, upload, and manage company documents securely." />
      </Helmet>
      
      <Container maxW="6xl" px={6} py={6}>
        {/* Page Header */}
        <Flex justify="space-between" align="center" mb={6}>
          <Heading fontSize="2xl" fontWeight="semibold" color="brand.500">Documents</Heading>
          <PermissionGuard area="documents" permission="edit">
            <Button 
              onClick={() => setIsUploadModalOpen(true)} 
              className="flex items-center gap-2"
            >
              <PlusIcon size={16} />
              Upload Document
            </Button>
          </PermissionGuard>
        </Flex>
        
        {/* Permission Alert */}
        <Alert 
          status="info" 
          variant="left-accent" 
          bg="gray.50" 
          mb={6} 
          borderRadius="md"
        >
          <AlertIcon as={InfoOutlineIcon} />
          <Text fontSize="sm">You don't have permission to upload or edit documents.</Text>
        </Alert>
        
        {/* Filter Controls */}
        <Box 
          mb={6} 
          bg={bgColor} 
          borderRadius="md" 
          borderWidth="1px" 
          borderColor={borderColor}
          p={4}
        >
          <Flex direction="column" w="full">
            <Flex mb={4} align="center" justify="space-between">
              <Text fontSize="sm" fontWeight="medium" color="gray.700">
                Filter documents
              </Text>
            </Flex>
            
            <ButtonGroup size="sm" variant="outline" spacing={2} isAttached={false}>
              <ChakraButton 
                colorScheme={activeFilter === "all" ? "brand" : "gray"}
                variant={activeFilter === "all" ? "solid" : "outline"}
                onClick={() => setActiveFilter("all")}
                size="sm"
                fontWeight="medium"
                fontSize="xs"
              >
                All Documents
              </ChakraButton>
              <ChakraButton 
                colorScheme={activeFilter === "recent" ? "brand" : "gray"}
                variant={activeFilter === "recent" ? "solid" : "outline"}
                onClick={() => setActiveFilter("recent")}
                size="sm"
                fontWeight="medium"
                fontSize="xs"
              >
                Last 30 Days
              </ChakraButton>
              <ChakraButton 
                colorScheme={activeFilter === "CONTRACT" ? "brand" : "gray"}
                variant={activeFilter === "CONTRACT" ? "solid" : "outline"}
                onClick={() => setActiveFilter("CONTRACT")}
                size="sm"
                fontWeight="medium" 
                fontSize="xs"
              >
                Contracts
              </ChakraButton>
            </ButtonGroup>
          </Flex>
        </Box>
        
        {/* Document List */}
        <Box 
          bg={bgColor} 
          borderRadius="md" 
          borderWidth="1px" 
          borderColor={borderColor}
          overflow="hidden"
        >
          <DocumentList 
            documents={documents} 
            isLoading={isLoading} 
            filter={activeFilter}
          />
        </Box>
      </Container>

      <DocumentUpload 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </>
  );
}