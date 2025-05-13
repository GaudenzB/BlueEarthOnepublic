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
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Icon,
  Tooltip
} from "@chakra-ui/react";
import {
  InfoIcon,
  AttachmentIcon,
  DownloadIcon,
  DeleteIcon,
  EditIcon,
  ViewIcon
} from "@chakra-ui/icons";
import { Tabs, TabList, TabPanels, Tab, TabPanel } from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import DocumentList from "@/components/documents/DocumentList";
import DocumentUpload from "@/components/documents/DocumentUpload";
import { documentTypeEnum } from "@shared/schema/documents/documents";
import { PlusIcon, FolderIcon, ClockIcon, FileTextIcon, MoreHorizontalIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PermissionGuard } from "@/components/permissions/PermissionGuard";

export default function Documents() {
  const [activeTab, setActiveTab] = useState("all");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { toast } = useToast();
  const bgColor = useColorModeValue("white", "gray.800");
  
  const { data: documentsResponse, isLoading, refetch, error } = useQuery({
    queryKey: ['/api/documents'],
    retry: false,
    onError: (err) => {
      console.error('Documents query failed:', err);
    }
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

  const handleFilterChange = (index: number) => {
    const tabValues = ["all", "recent", "contracts"];
    setActiveTab(tabValues[index]);
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
          <Heading size="lg" color="brand.700">Documents</Heading>
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
        <Alert status="warning" mb={6} borderRadius="md">
          <AlertIcon />
          <Text>You don't have permission to upload or edit documents.</Text>
        </Alert>
        
        {/* Document Tabs */}
        <Box bg={bgColor} borderRadius="md" boxShadow="sm" mb={6}>
          <Tabs variant="soft-rounded" colorScheme="blue" onChange={handleFilterChange}>
            <TabList px={4} pt={4}>
              <Tab>All</Tab>
              <Tab>Last 30 Days</Tab>
              <Tab>Contracts</Tab>
            </TabList>
            
            <TabPanels>
              <TabPanel>
                <DocumentList 
                  documents={documents} 
                  isLoading={isLoading} 
                  filter="all"
                />
              </TabPanel>
              
              <TabPanel>
                <DocumentList 
                  documents={documents} 
                  isLoading={isLoading} 
                  filter="recent"
                />
              </TabPanel>
              
              <TabPanel>
                <DocumentList 
                  documents={documents} 
                  isLoading={isLoading} 
                  filter="CONTRACT"
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
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