import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { format } from "date-fns";
import {
  Box,
  Flex,
  Heading,
  Text,
  Badge,
  Icon,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Grid,
  GridItem,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Tooltip,
  useColorModeValue,
  Skeleton,
  SkeletonText,
  Stack,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  List,
  ListItem,
  Tag,
  Avatar,
  Wrap,
  WrapItem,
  Container,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon
} from "@chakra-ui/react";
import {
  ArrowBackIcon,
  DownloadIcon,
  DeleteIcon,
  InfoOutlineIcon,
  CheckIcon,
  WarningIcon,
  TimeIcon,
  StarIcon,
  RepeatIcon,
  EditIcon,
  ViewIcon,
  LockIcon,
  AttachmentIcon,
  ExternalLinkIcon,
  ChevronRightIcon
} from "@chakra-ui/icons";
import { useToast } from "@/hooks/use-toast";
import { PermissionGuard } from "@/components/permissions/PermissionGuard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Helper function for toast
const createToast = (toast: any, props: any) => {
  if (typeof toast === 'function') {
    return toast(props);
  } else if (toast && typeof toast.toast === 'function') {
    return toast.toast(props);
  }
  console.error('Toast function not available');
  return null;
};

// Skeleton component for loading state
function DocumentDetailSkeleton() {
  return (
    <Box maxW="1200px" mx="auto" pt={8} px={4}>
      <Flex mb={6} align="center" gap={4}>
        <Skeleton height="40px" width="40px" borderRadius="md" />
        <Box flex="1">
          <Skeleton height="24px" width="60%" mb={2} />
          <Skeleton height="18px" width="40%" />
        </Box>
        <Skeleton height="40px" width="120px" borderRadius="md" />
      </Flex>
      
      <Box mb={6}>
        <Skeleton height="48px" width="100%" borderRadius="md" mb={6} />
        <Grid templateColumns={{base: "1fr", md: "2fr 1fr"}} gap={6}>
          <Box>
            <Skeleton height="200px" width="100%" borderRadius="md" mb={4} />
            <Stack spacing={4}>
              <SkeletonText mt="4" noOfLines={3} spacing="4" skeletonHeight="2" />
              <SkeletonText mt="4" noOfLines={2} spacing="4" skeletonHeight="2" />
            </Stack>
          </Box>
          <Stack spacing={4}>
            <Skeleton height="120px" width="100%" borderRadius="md" />
            <Skeleton height="180px" width="100%" borderRadius="md" />
          </Stack>
        </Grid>
      </Box>
    </Box>
  );
}

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const [selectedTab, setSelectedTab] = useState(0);
  const toast = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  // States for UI
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [prevStatus, setPrevStatus] = useState<string | null>(null);
  
  // Colors
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headerBg = useColorModeValue("gray.50", "gray.700");
  const tagBg = useColorModeValue("gray.100", "gray.700");
  
  // Fetch document data with automatic polling for processing status
  const { data: documentResponse, isLoading, error, refetch } = useQuery({
    queryKey: [`/api/documents/${id}`],
    retry: 3,
    retryDelay: 1000,
    enabled: !!id,
    // Add polling refresh interval if document is in a processing state
    refetchInterval: (data) => {
      // Extract document data regardless of response format
      const doc = data?.data || data;
      
      // More aggressive polling when document is processing
      if (doc?.processingStatus === 'PROCESSING' || doc?.processingStatus === 'PENDING' || 
          doc?.processingStatus === 'QUEUED') {
        console.log("Document is processing, polling every 1 second");
        return 1000; // Poll every 1 second while processing
      }
      return 5000; // Continue polling every 5 seconds even when not processing to catch status changes
    },
    // Set shorter stale time to force refresh sooner
    staleTime: 1000,
    // Force refetch on window focus
    refetchOnWindowFocus: true
  });
  
  // Watch for changes in document status
  useEffect(() => {
    if (!documentResponse) return;
    
    // Extract the document from the response
    let doc = null;
    
    // Check if documentResponse is an object
    if (documentResponse && typeof documentResponse === 'object') {
      // Check if it's a response with success flag and data property
      if ('success' in documentResponse && 
          documentResponse.success === true && 
          'data' in documentResponse && 
          documentResponse.data) {
        doc = documentResponse.data;
        console.log("Document found in response wrapper:", {
          docId: doc.id,
          docTitle: doc.title,
          docStatus: doc.processingStatus
        });
      } 
      // Check if it's a direct document object with ID
      else if ('id' in documentResponse) {
        doc = documentResponse;
        console.log("Document is direct object:", doc);
      }
    }
    
    if (!doc) {
      console.log("No valid document found in response:", documentResponse);
      return;
    }
    
    console.log("Status change check:", {
      prevStatus,
      currentStatus: doc.processingStatus,
      isTransitioning: prevStatus && 
        ['PENDING', 'PROCESSING', 'QUEUED'].includes(prevStatus) && 
        doc.processingStatus === 'COMPLETED'
    });
    
    // Check if status changed from a processing state to COMPLETED
    if (prevStatus && 
        ['PENDING', 'PROCESSING', 'QUEUED'].includes(prevStatus) && 
        doc.processingStatus === 'COMPLETED') {
      createToast(toast, {
        title: "Document processing complete",
        description: "The document has been successfully processed with AI.",
        variant: "default" 
      });
      
      // Force an immediate refetch to ensure we have the latest data
      refetch();
    }
    
    // Update previous status
    setPrevStatus(doc.processingStatus);
  }, [documentResponse, prevStatus, toast, refetch]);
  
  // Process document mutation
  const processDocumentMutation = useMutation({
    mutationFn: () => {
      return fetch(`/api/documents/${id}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(res => {
        if (!res.ok) {
          throw new Error('Failed to process document');
        }
        return res.json();
      });
    },
    onSuccess: () => {
      createToast(toast, {
        title: "Processing started",
        description: "Document analysis has been queued and will begin processing shortly.",
        variant: "default"
      });
      
      // Invalidate queries to refresh the document status
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${id}`] });
      
      // Set a timeout to refetch after a short delay
      setTimeout(() => {
        refetch();
      }, 2000);
    },
    onError: (error) => {
      createToast(toast, {
        title: "Processing failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });
  
  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: () => {
      return fetch(`/api/documents/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(res => {
        if (!res.ok) {
          throw new Error('Failed to delete document');
        }
        return res.json();
      });
    },
    onSuccess: () => {
      createToast(toast, {
        title: "Document deleted",
        description: "Document has been permanently deleted.",
        variant: "default"
      });
      
      // Invalidate the documents list query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      
      // Navigate back to documents list
      navigate('/documents');
    },
    onError: (error) => {
      createToast(toast, {
        title: "Deletion failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });
  
  // Handle document processing
  const handleProcessDocument = () => {
    processDocumentMutation.mutate();
  };
  
  // Handle document deletion with confirmation
  const handleDeleteDocument = () => {
    setShowDeleteDialog(true);
  };
  
  // Confirm and execute document deletion
  const confirmDeleteDocument = () => {
    deleteDocumentMutation.mutate();
    setShowDeleteDialog(false);
  };
  
  // Handle manually refreshing document status
  const handleRefreshStatus = () => {
    refetch();
    createToast(toast, {
      title: "Refreshing document status",
      description: "Checking for the latest document processing status...",
      variant: "default"
    });
  };
  
  if (isLoading) {
    return <DocumentDetailSkeleton />;
  }
  
  if (error) {
    console.error("Error loading document:", error);
    return (
      <Container maxW="1200px" py={8}>
        <Alert status="error" variant="left-accent" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle fontSize="lg">Error Loading Document</AlertTitle>
            <AlertDescription>
              There was a problem loading the document. Please try again later.
              <Box mt={4} p={3} bg="gray.50" borderRadius="md" fontSize="sm" fontFamily="mono">
                {error instanceof Error ? error.message : "Unknown error"}
              </Box>
            </AlertDescription>
          </Box>
        </Alert>
        <Button mt={4} leftIcon={<ArrowBackIcon />} as={Link} href="/documents" colorScheme="blue" variant="outline">
          Back to Documents
        </Button>
      </Container>
    );
  }
  
  // Extract document data regardless of response format
  const document = documentResponse?.data || documentResponse;
  
  if (!document) {
    return (
      <Container maxW="1200px" py={8}>
        <Box textAlign="center" py={10} px={6}>
          <Icon as={InfoOutlineIcon} boxSize="50px" color="gray.500" />
          <Heading as="h2" size="xl" mt={6} mb={2}>
            Document Not Found
          </Heading>
          <Text color="gray.500">
            The requested document could not be found.
          </Text>
          <Button mt={6} leftIcon={<ArrowBackIcon />} as={Link} href="/documents" colorScheme="blue">
            Back to Documents
          </Button>
        </Box>
      </Container>
    );
  }
  
  // Helper function to get processing status text
  const getProcessingStatusText = (status: string): string => {
    switch(status) {
      case "PROCESSING": // Fall through
       // Fall through
       return "Processing document...";
      case "PENDING": // Fall through
       // Fall through
       return "Pending processing...";
      case "QUEUED": // Fall through
       // Fall through
       return "Queued for processing...";
      default:
        return "Waiting to process...";
    }
  };
  
  // Helper function to get processing progress percentage
  const getProcessingProgress = (status: string): number => {
    switch(status) {
      case "PROCESSING": // Fall through
       // Fall through
       return 65;
      case "PENDING": // Fall through
       // Fall through
       return 25;
      case "QUEUED": // Fall through
       // Fall through
       return 15;
      default:
        return 5;
    }
  };
  
  // Function to get the appropriate status badge based on processing status
  const getStatusBadge = (status: string) => {
    // Debug logging for status changes
    console.log("getStatusBadge called with status:", status);
    
    switch (status) {
      case "COMPLETED": // Fall through
       // Fall through
       return (
          <Tooltip label="Document processed successfully">
            <Badge variant="subtle" colorScheme="green" display="flex" alignItems="center">
              <Icon as={CheckIcon} mr={1} boxSize={3} /> 
              <Text fontSize="xs">Processed</Text>
            </Badge>
          </Tooltip>
        );
      case "PROCESSING": // Fall through
       // Fall through
       return (
          <Tooltip label="Document is being processed">
            <Badge variant="subtle" colorScheme="yellow" display="flex" alignItems="center">
              <Icon as={TimeIcon} mr={1} boxSize={3} /> 
              <Text fontSize="xs">Processing</Text>
            </Badge>
          </Tooltip>
        );
      case "PENDING": // Fall through
       // Fall through
       // Fall through
      case "QUEUED": // Fall through
       // Fall through
       return (
          <Tooltip label="Document is waiting for processing">
            <Badge variant="subtle" colorScheme="blue" display="flex" alignItems="center">
              <Icon as={TimeIcon} mr={1} boxSize={3} /> 
              <Text fontSize="xs">Pending</Text>
            </Badge>
          </Tooltip>
        );
      case "FAILED": // Fall through
       // Fall through
       // Fall through
      case "ERROR": // Fall through
       // Fall through
       return (
          <Tooltip label="Document processing failed">
            <Badge variant="subtle" colorScheme="red" display="flex" alignItems="center">
              <Icon as={WarningIcon} mr={1} boxSize={3} /> 
              <Text fontSize="xs">Failed</Text>
            </Badge>
          </Tooltip>
        );
      default:
        return (
          <Tooltip label="Unknown document status">
            <Badge variant="subtle" colorScheme="gray" display="flex" alignItems="center">
              <Icon as={InfoOutlineIcon} mr={1} boxSize={3} /> 
              <Text fontSize="xs">Unknown</Text>
            </Badge>
          </Tooltip>
        );
    }
  };
  
  // Format file size in a readable format
  const formatFileSize = (sizeInBytes: number | string) => {
    const size = typeof sizeInBytes === 'string' ? parseInt(sizeInBytes, 10) : sizeInBytes;
    
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
  };
  
  // Check if document has AI processing completed
  const isProcessed = document.processingStatus === "COMPLETED";
  const hasInsights = isProcessed && document.aiMetadata && Object.keys(document.aiMetadata).length > 0;
  
  // Function to handle tab change
  const handleTabChange = (index: number) => {
    setSelectedTab(index);
  };
  
  // Function to format MIME Type to readable format
  const formatMimeType = (mimeType: string) => {
    const mimeMap: Record<string, string> = {
      'application/pdf': 'PDF Document',
      'application/msword': 'Word Document',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document (DOCX)',
      'application/vnd.ms-excel': 'Excel Spreadsheet',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet (XLSX)',
      'application/vnd.ms-powerpoint': 'PowerPoint Presentation',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint Presentation (PPTX)',
      'text/plain': 'Text Document',
      'text/html': 'HTML Document',
      'image/jpeg': 'JPEG Image',
      'image/png': 'PNG Image'
    };
    
    return mimeMap[mimeType] || mimeType;
  };
  
  return (
    <>
      <Helmet>
        <title>{document.title || "Document"} | BlueEarth Portal</title>
        <meta name="description" content={`View details and insights for ${document.title || "document"}`} />
      </Helmet>
      
      <Container maxW="1200px" py={8} px={{base: 5, md: 8}}>
        {/* Document Header with improved spacing and structure */}
        <Box 
          mb={8} 
          pb={6} 
          borderBottom="1px" 
          borderColor={borderColor}
          as="section"
          aria-label="Document header"
        >
          <Flex 
            direction={{base: "column", md: "row"}} 
            alignItems={{base: "flex-start", md: "center"}} 
            gap={4}
            mb={4}
          >
            <IconButton
              aria-label="Back to documents"
              as={Link}
              href="/documents"
              icon={<ArrowBackIcon />}
              variant="outline"
              size="sm"
              borderRadius="md"
              boxShadow="sm"
              _hover={{ boxShadow: "md", transform: "translateY(-1px)" }}
              transition="all 0.2s"
            />
            
            <Box flex="1">
              <Heading size="lg" fontWeight="bold" mb={2}>
                {document.title}
              </Heading>
              <Flex 
                alignItems="center" 
                gap={3}
                flexWrap="wrap"
              >
                <Badge 
                  colorScheme="gray" 
                  fontSize="xs" 
                  py={1} 
                  px={2} 
                  borderRadius="md"
                >
                  {document.documentType || "Other"}
                </Badge>
                <Text fontSize="sm" color="gray.600">
                  Last updated {format(new Date(document.updatedAt), "MMMM d, yyyy")}
                </Text>
                {getStatusBadge(document.processingStatus)}
              </Flex>
            </Box>
            
            <HStack spacing={3}>
              <Tooltip label="Download document">
                <IconButton
                  as="a"
                  href={`/api/documents/${document.id}/download?auth=${localStorage.getItem('authToken')}`}
                  download
                  icon={<DownloadIcon />}
                  aria-label="Download document"
                  colorScheme="blue"
                  variant="outline"
                  size="sm"
                  boxShadow="sm"
                  _hover={{ boxShadow: "md", transform: "translateY(-1px)" }}
                  transition="all 0.2s"
                />
              </Tooltip>
              
              <Menu>
                <MenuButton
                  as={IconButton}
                  aria-label="More options"
                  icon={<InfoOutlineIcon />}
                  variant="outline"
                  size="sm"
                  boxShadow="sm"
                  _hover={{ boxShadow: "md", transform: "translateY(-1px)" }}
                  transition="all 0.2s"
                />
                <MenuList>
                  <MenuItem icon={<RepeatIcon />} onClick={handleRefreshStatus}>
                    Refresh Status
                  </MenuItem>
                  <MenuItem
                    icon={<AttachmentIcon />} 
                    onClick={handleProcessDocument} 
                    isDisabled={processDocumentMutation.isPending}
                  >
                    Process with AI
                  </MenuItem>
                  <MenuItem icon={<EditIcon />}>
                    Edit Properties
                  </MenuItem>
                  <MenuItem icon={<ViewIcon />}>
                    View Version History
                  </MenuItem>
                  <MenuItem icon={<DeleteIcon />} onClick={handleDeleteDocument} color="red.500">
                    Delete Document
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </Flex>
        </Box>
        
        {/* Processing Alert if needed - Improved with better spacing and animation */}
        {['PROCESSING', 'PENDING', 'QUEUED'].includes(document.processingStatus) && (
          <Alert 
            status="info" 
            variant="left-accent" 
            mb={8} 
            borderRadius="md"
            boxShadow="sm"
            animation="pulse 2s infinite"
            sx={{
              "@keyframes pulse": {
                "0%": { boxShadow: "0 0 0 0 rgba(66, 153, 225, 0.4)" },
                "70%": { boxShadow: "0 0 0 6px rgba(66, 153, 225, 0)" },
                "100%": { boxShadow: "0 0 0 0 rgba(66, 153, 225, 0)" }
              }
            }}
          >
            <AlertIcon />
            <Box flex="1">
              <AlertTitle fontSize="sm" fontWeight="medium">Document Processing</AlertTitle>
              <AlertDescription fontSize="sm">
                {getProcessingStatusText(document.processingStatus)}
                <Progress 
                  size="xs" 
                  isIndeterminate={document.processingStatus === "PROCESSING"}
                  colorScheme="blue" 
                  mt={3} 
                  mb={1}
                  borderRadius="full"
                  value={getProcessingProgress(document.processingStatus)}
                />
              </AlertDescription>
            </Box>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<RepeatIcon />}
              onClick={handleRefreshStatus}
              ml={2}
              _hover={{ bg: "blue.50" }}
            >
              Refresh
            </Button>
          </Alert>
        )}
        
        {/* Main Content - Improved with box shadow and spacing */}
        <Box 
          borderRadius="md" 
          boxShadow="md" 
          bg={bgColor} 
          overflow="hidden"
        >
          <Tabs 
            variant="enclosed" 
            index={selectedTab} 
            onChange={handleTabChange} 
            colorScheme="blue"
            isLazy
          >
            <TabList 
              bg={headerBg} 
              px={4}
              pt={2}
              borderBottomWidth="1px"
              borderBottomColor={borderColor}
            >
              <Tab 
                fontWeight="medium" 
                _selected={{ 
                  bg: bgColor, 
                  borderColor: borderColor, 
                  borderBottomColor: bgColor,
                  fontWeight: "semibold" 
                }}
              >
                Details
              </Tab>
              <Tab 
                fontWeight="medium"
                _selected={{ 
                  bg: bgColor, 
                  borderColor: borderColor, 
                  borderBottomColor: bgColor,
                  fontWeight: "semibold" 
                }}
              >
                Preview
              </Tab>
              <Tab 
                fontWeight="medium" 
                isDisabled={!hasInsights}
                _selected={{ 
                  bg: bgColor, 
                  borderColor: borderColor, 
                  borderBottomColor: bgColor,
                  fontWeight: "semibold" 
                }}
              >
                AI Insights
              </Tab>
              <Tab 
                fontWeight="medium"
                _selected={{ 
                  bg: bgColor, 
                  borderColor: borderColor, 
                  borderBottomColor: bgColor,
                  fontWeight: "semibold" 
                }}
              >
                Timeline
              </Tab>
            </TabList>
          
          <TabPanels>
            {/* Details Tab with improved layout */}
            <TabPanel px={6} py={6}>
              <Grid 
                templateColumns={{base: "1fr", md: "2fr 1fr"}} 
                gap={8}
                sx={{
                  "& > div": {
                    animation: "fadeIn 0.5s ease-in-out",
                  },
                  "@keyframes fadeIn": {
                    "0%": { opacity: 0, transform: "translateY(10px)" },
                    "100%": { opacity: 1, transform: "translateY(0)" }
                  }
                }}
              >
                {/* Left Column */}
                <GridItem>
                  <Card 
                    variant="outline" 
                    mb={8} 
                    borderRadius="md"
                    boxShadow="sm"
                    transition="box-shadow 0.2s"
                    _hover={{ boxShadow: "md" }}
                  >
                    <CardHeader 
                      bg={headerBg} 
                      py={4} 
                      px={6} 
                      borderBottomWidth="1px" 
                      borderColor={borderColor}
                      borderTopRadius="md"
                    >
                      <Heading size="sm">Document Information</Heading>
                    </CardHeader>
                    <CardBody p={6}>
                      <Stack spacing={6}>
                        <Box>
                          <Text 
                            fontSize="sm" 
                            fontWeight="semibold" 
                            color="gray.500" 
                            mb={2}
                            textTransform="uppercase"
                            letterSpacing="wider"
                          >
                            Description
                          </Text>
                          <Text lineHeight="tall">{document.description || "No description provided."}</Text>
                        </Box>

                        <Box>
                          <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={1}>
                            Document Type
                          </Text>
                          <Text>{document.documentType || "Unspecified"}</Text>
                        </Box>
                        
                        <Box>
                          <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={1}>
                            File Information
                          </Text>
                          <Table size="sm" variant="simple">
                            <Tbody>
                              <Tr>
                                <Td pl={0} borderColor={borderColor} width="180px">Original Filename</Td>
                                <Td borderColor={borderColor}>{document.originalFilename}</Td>
                              </Tr>
                              <Tr>
                                <Td pl={0} borderColor={borderColor}>File Type</Td>
                                <Td borderColor={borderColor}>{formatMimeType(document.mimeType)}</Td>
                              </Tr>
                              <Tr>
                                <Td pl={0} borderColor={borderColor}>File Size</Td>
                                <Td borderColor={borderColor}>{formatFileSize(document.fileSize)}</Td>
                              </Tr>
                              <Tr>
                                <Td pl={0} borderColor={borderColor}>Upload Date</Td>
                                <Td borderColor={borderColor}>{format(new Date(document.createdAt), "MMMM d, yyyy")}</Td>
                              </Tr>
                            </Tbody>
                          </Table>
                        </Box>
                      </Stack>
                    </CardBody>
                  </Card>

                  {/* AI Summary (if available) */}
                  {hasInsights && document.aiMetadata && document.aiMetadata.summary && (
                    <Card 
                      variant="outline" 
                      mb={8}
                      borderRadius="md"
                      boxShadow="sm"
                      transition="box-shadow 0.2s"
                      _hover={{ boxShadow: "md" }}
                      sx={{
                        animation: "fadeIn 0.6s ease-in-out",
                        "@keyframes fadeIn": {
                          "0%": { opacity: 0, transform: "translateY(15px)" },
                          "100%": { opacity: 1, transform: "translateY(0)" }
                        }
                      }}
                    >
                      <CardHeader 
                        bg={headerBg} 
                        py={4} 
                        px={6} 
                        display="flex" 
                        alignItems="center" 
                        justifyContent="space-between" 
                        borderBottomWidth="1px" 
                        borderColor={borderColor}
                        borderTopRadius="md"
                      >
                        <Flex alignItems="center" gap={2}>
                          <Icon as={InfoOutlineIcon} color="blue.500" />
                          <Heading size="sm">Document Summary</Heading>
                        </Flex>
                        <Badge 
                          colorScheme="purple" 
                          variant="subtle"
                          px={2}
                          py={1}
                          borderRadius="full"
                          fontSize="xs"
                        >
                          AI Generated
                        </Badge>
                      </CardHeader>
                      <CardBody p={6}>
                        <Text 
                          fontSize="sm" 
                          lineHeight="1.7"
                          color="gray.700"
                          _dark={{ color: "gray.300" }}
                          sx={{
                            "p:not(:last-of-type)": {
                              marginBottom: "1rem"
                            }
                          }}
                        >
                          {document.aiMetadata.summary}
                        </Text>
                      </CardBody>
                    </Card>
                  )}
                </GridItem>
                
                {/* Right Column with enhanced styling and animations */}
                <GridItem>
                  {/* Document Properties */}
                  <Card 
                    variant="outline" 
                    mb={8} 
                    borderRadius="md"
                    boxShadow="sm"
                    transition="box-shadow 0.2s"
                    _hover={{ boxShadow: "md" }}
                    sx={{
                      animation: "fadeIn 0.6s ease-in-out",
                      "@keyframes fadeIn": {
                        "0%": { opacity: 0, transform: "translateY(15px)" },
                        "100%": { opacity: 1, transform: "translateY(0)" }
                      }
                    }}
                  >
                    <CardHeader 
                      bg={headerBg} 
                      py={4} 
                      px={6} 
                      borderBottomWidth="1px" 
                      borderColor={borderColor}
                      borderTopRadius="md"
                      display="flex"
                      alignItems="center"
                      gap={2}
                    >
                      <Icon as={InfoOutlineIcon} color="blue.500" />
                      <Heading size="sm">Properties</Heading>
                    </CardHeader>
                    <CardBody p={6}>
                      <Stack spacing={5}>
                        {/* Tags - improved styling */}
                        <Box>
                          <Text 
                            fontSize="sm" 
                            fontWeight="semibold" 
                            color="gray.500" 
                            mb={2}
                            textTransform="uppercase"
                            letterSpacing="wider"
                          >
                            Tags
                          </Text>
                          {document.tags && Array.isArray(document.tags) && document.tags.length > 0 ? (
                            <Wrap spacing={2} mt={1}>
                              {document.tags.map((tag: string, index: number) => (
                                <WrapItem key={index}>
                                  <Tag 
                                    size="md" 
                                    colorScheme="blue" 
                                    variant="subtle" 
                                    borderRadius="full"
                                    py={1}
                                    px={3}
                                    _hover={{ 
                                      transform: "translateY(-1px)",
                                      boxShadow: "sm",
                                      bg: "blue.100"
                                    }}
                                    transition="all 0.2s"
                                  >
                                    {tag}
                                  </Tag>
                                </WrapItem>
                              ))}
                            </Wrap>
                          ) : (
                            <Text fontSize="sm" color="gray.500" fontStyle="italic">No tags assigned to this document</Text>
                          )}
                        </Box>
                        
                        {/* Confidentiality - Enhanced styling */}
                        <Box>
                          <Text 
                            fontSize="sm" 
                            fontWeight="semibold" 
                            color="gray.500" 
                            mb={2}
                            textTransform="uppercase"
                            letterSpacing="wider"
                          >
                            Confidentiality
                          </Text>
                          <Badge 
                            colorScheme={document.isConfidential ? "red" : "green"}
                            px={3}
                            py={1}
                            borderRadius="full"
                            textTransform="capitalize"
                            fontWeight="medium"
                            boxShadow="sm"
                            fontSize="sm"
                          >
                            {document.isConfidential ? "Confidential" : "Not Confidential"}
                          </Badge>
                        </Box>
                        
                        {/* AI Processing - Enhanced styling */}
                        <Box>
                          <Text 
                            fontSize="sm" 
                            fontWeight="semibold" 
                            color="gray.500" 
                            mb={2}
                            textTransform="uppercase"
                            letterSpacing="wider"
                          >
                            AI Processing
                          </Text>
                          {document.processingStatus === "COMPLETED" ? (
                            <Badge 
                              colorScheme="green" 
                              display="flex" 
                              alignItems="center" 
                              width="fit-content"
                              px={3}
                              py={1}
                              borderRadius="full"
                              textTransform="capitalize"
                              fontWeight="medium"
                              boxShadow="sm"
                              fontSize="sm"
                              transition="all 0.2s"
                              _hover={{ 
                                transform: "translateY(-1px)",
                                boxShadow: "md"
                              }}
                            >
                              <Icon as={CheckIcon} mr={2} boxSize={3} />
                              Processed
                            </Badge>
                          ) : document.processingStatus === "FAILED" || document.processingStatus === "ERROR" ? (
                            <Box>
                              <Badge 
                                colorScheme="red" 
                                display="flex" 
                                alignItems="center" 
                                width="fit-content" 
                                mb={2}
                                px={3}
                                py={1}
                                borderRadius="full"
                                textTransform="capitalize"
                                fontWeight="medium"
                                boxShadow="sm"
                                fontSize="sm"
                              >
                                <Icon as={WarningIcon} mr={2} boxSize={3} />
                                Failed
                              </Badge>
                              {document.processingError && (
                                <Text 
                                  fontSize="xs" 
                                  color="red.500" 
                                  mt={2}
                                  p={3}
                                  bg="red.50"
                                  borderRadius="md"
                                  borderLeft="3px solid"
                                  borderColor="red.500"
                                  fontStyle="italic"
                                >
                                  <Icon as={InfoOutlineIcon} mr={1} color="red.500" />
                                  {document.processingError}
                                </Text>
                              )}
                            </Box>
                          ) : (
                            <Box>
                              <Badge 
                                colorScheme="blue" 
                                display="flex" 
                                alignItems="center" 
                                width="fit-content"
                                px={3}
                                py={1}
                                borderRadius="full"
                                textTransform="capitalize"
                                fontWeight="medium"
                                boxShadow="sm"
                                fontSize="sm"
                              >
                                <Icon as={TimeIcon} mr={2} boxSize={3} />
                                {document.processingStatus === "PENDING" ? "Processing" : document.processingStatus}
                              </Badge>
                              <Button
                                mt={3}
                                size="sm"
                                leftIcon={<RepeatIcon />}
                                onClick={handleProcessDocument}
                                isLoading={processDocumentMutation.isPending}
                                isDisabled={processDocumentMutation.isPending || ['PROCESSING', 'PENDING', 'QUEUED'].includes(document.processingStatus)}
                                colorScheme="blue"
                                borderRadius="md"
                                boxShadow="sm"
                                _hover={{ 
                                  transform: "translateY(-1px)",
                                  boxShadow: "md" 
                                }}
                                transition="all 0.2s"
                              >
                                Process Document
                              </Button>
                            </Box>
                          )}
                        </Box>
                      </Stack>
                    </CardBody>
                  </Card>
                  
                  {/* AI Insights Preview */}
                  {hasInsights && document.aiMetadata && (
                    <Card 
                      variant="outline" 
                      borderRadius="md"
                      boxShadow="sm"
                      transition="box-shadow 0.2s"
                      _hover={{ boxShadow: "md" }}
                      sx={{
                        animation: "fadeIn 0.6s ease-in-out",
                        animationDelay: "0.1s",
                        "@keyframes fadeIn": {
                          "0%": { opacity: 0, transform: "translateY(15px)" },
                          "100%": { opacity: 1, transform: "translateY(0)" }
                        }
                      }}
                    >
                      <CardHeader 
                        bg={headerBg} 
                        py={4} 
                        px={6} 
                        borderBottomWidth="1px" 
                        borderColor={borderColor}
                        borderTopRadius="md"
                      >
                        <Flex alignItems="center" gap={2}>
                          <Icon as={InfoOutlineIcon} color="purple.500" />
                          <Heading size="sm">AI Insights</Heading>
                        </Flex>
                      </CardHeader>
                      <CardBody p={6}>
                        <Stack spacing={4}>
                          {/* Keywords */}
                          {document.aiMetadata.keywords && Array.isArray(document.aiMetadata.keywords) && (
                            <Box>
                              <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={1}>
                                Keywords
                              </Text>
                              <Wrap>
                                {document.aiMetadata.keywords.slice(0, 5).map((keyword: string, index: number) => (
                                  <WrapItem key={index}>
                                    <Tag size="sm" colorScheme="blue" variant="subtle">{keyword}</Tag>
                                  </WrapItem>
                                ))}
                                {document.aiMetadata.keywords.length > 5 && (
                                  <WrapItem>
                                    <Tag size="sm" colorScheme="gray" variant="subtle">+{document.aiMetadata.keywords.length - 5} more</Tag>
                                  </WrapItem>
                                )}
                              </Wrap>
                            </Box>
                          )}
                          
                          <Button 
                            size="sm" 
                            rightIcon={<ChevronRightIcon />} 
                            onClick={() => setSelectedTab(2)}
                            variant="outline"
                          >
                            View full insights
                          </Button>
                        </Stack>
                      </CardBody>
                    </Card>
                  )}
                </GridItem>
              </Grid>
            </TabPanel>
            
            {/* Preview Tab */}
            <TabPanel px={0} py={4}>
              <Card 
                variant="outline" 
                height="600px"
                borderRadius="md" 
                boxShadow="sm"
                transition="box-shadow 0.2s"
                _hover={{ boxShadow: "md" }}
                sx={{
                  animation: "fadeIn 0.6s ease-in-out",
                  animationDelay: "0.2s",
                  "@keyframes fadeIn": {
                    "0%": { opacity: 0, transform: "translateY(15px)" },
                    "100%": { opacity: 1, transform: "translateY(0)" }
                  }
                }}
              >
                <CardHeader 
                  bg={headerBg} 
                  py={4} 
                  px={6} 
                  borderBottomWidth="1px" 
                  borderColor={borderColor}
                  borderTopRadius="md"
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Flex alignItems="center" gap={2}>
                    <Icon as={ViewIcon} color="blue.500" />
                    <Heading size="sm">Document Preview</Heading>
                  </Flex>
                  {document.downloadUrl && (
                    <Button 
                      as="a" 
                      href={document.downloadUrl} 
                      target="_blank" 
                      size="xs"
                      colorScheme="blue"
                      variant="outline"
                      leftIcon={<DownloadIcon />}
                      _hover={{
                        transform: "translateY(-1px)",
                        boxShadow: "sm" 
                      }}
                      transition="all 0.2s"
                    >
                      Download
                    </Button>
                  )}
                </CardHeader>
                <CardBody p={0} position="relative">
                  {document.mimeType?.includes('pdf') ? (
                    <Box 
                        position="relative" 
                        height="100%" 
                        width="100%"
                        borderRadius="md"
                        overflow="hidden"
                      >
                        <Box
                          position="absolute"
                          top={0}
                          left={0}
                          right={0}
                          bottom={0}
                          bg="gray.700"
                          opacity={0.05}
                          zIndex={0}
                        />
                        <iframe 
                          src={`/api/documents/${document.id}/download?auth=${localStorage.getItem('authToken')}`}
                          width="100%" 
                          height="100%" 
                          style={{ 
                            border: 'none', 
                            borderBottomLeftRadius: '0.375rem', 
                            borderBottomRightRadius: '0.375rem',
                            position: 'relative',
                            zIndex: 1
                          }}
                          onLoad={(e) => {
                          // Try to detect failed load or error messages
                          try {
                            const iframe = e.target as HTMLIFrameElement;
                            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                            
                            if (iframeDoc) {
                              const content = iframeDoc.body.textContent || '';
                              if (content.includes('Invalid token') || content.includes('Error') || content.includes('failed')) {
                                // Show the fallback message
                                const fallback = document.getElementById('preview-fallback');
                                if (fallback) fallback.style.display = 'flex';
                              }
                            }
                          } catch (err) {
                            console.log("Error checking iframe content:", err);
                          }
                        }}
                        onError={() => {
                          // Show the fallback message
                          const fallback = document.getElementById('preview-fallback');
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <Flex 
                        position="absolute" 
                        top={0} 
                        left={0} 
                        width="100%" 
                        height="100%" 
                        bg="blackAlpha.50"
                        justifyContent="center"
                        alignItems="center"
                        display="none"
                        id="preview-fallback"
                        flexDirection="column"
                        p={10}
                        backdropFilter="blur(4px)"
                        borderRadius="md"
                      >
                        <Box
                          p={5}
                          bg="white"
                          _dark={{ bg: "gray.800" }}
                          borderRadius="xl"
                          boxShadow="xl"
                          display="flex"
                          flexDirection="column"
                          alignItems="center"
                          maxW="md"
                          border="1px solid"
                          borderColor="gray.100"
                          _dark={{ borderColor: "gray.700" }}
                        >
                          <Icon 
                            as={WarningIcon} 
                            boxSize={16} 
                            color="orange.400" 
                            mb={6}
                            sx={{
                              animation: "pulse 2s infinite",
                              "@keyframes pulse": {
                                "0%": { opacity: 0.7, transform: "scale(1)" },
                                "50%": { opacity: 1, transform: "scale(1.05)" },
                                "100%": { opacity: 0.7, transform: "scale(1)" }
                              }
                            }}
                          />
                          <Heading 
                            size="md" 
                            mb={3} 
                            color="gray.700" 
                            _dark={{ color: "gray.100" }}
                            textAlign="center"
                          >
                            Preview temporarily unavailable
                          </Heading>
                          <Text 
                            textAlign="center" 
                            color="gray.500" 
                            mb={6}
                            fontSize="sm"
                            lineHeight="1.7"
                          >
                            The document preview is currently experiencing technical difficulties.
                            You can download the document to view it directly.
                          </Text>
                          <Button 
                            as="a"
                            href={`/api/documents/${document.id}/download?auth=${localStorage.getItem('authToken')}`}
                            leftIcon={<DownloadIcon />}
                            colorScheme="blue"
                            size="md"
                            target="_blank"
                            boxShadow="md"
                            _hover={{ 
                              transform: "translateY(-2px)",
                              boxShadow: "lg" 
                            }}
                            transition="all 0.3s"
                          >
                            Download document
                          </Button>
                        </Box>
                      </Flex>
                    </Box>
                  ) : (
                    <Flex 
                      direction="column" 
                      alignItems="center" 
                      justifyContent="center" 
                      height="100%" 
                      p={10}
                      bg="gray.50"
                      _dark={{ bg: "gray.700" }}
                      borderRadius="md"
                      borderBottomRadius="md"
                      boxShadow="inner"
                    >
                      <Icon 
                        as={AttachmentIcon} 
                        boxSize={16} 
                        color="blue.400" 
                        mb={6}
                        sx={{
                          animation: "pulse 2s infinite",
                          "@keyframes pulse": {
                            "0%": { opacity: 0.7, transform: "scale(1)" },
                            "50%": { opacity: 1, transform: "scale(1.05)" },
                            "100%": { opacity: 0.7, transform: "scale(1)" }
                          }
                        }}
                      />
                      <Heading size="md" mb={3} color="gray.700" _dark={{ color: "gray.100" }}>
                        Preview not available
                      </Heading>
                      <Text 
                        textAlign="center" 
                        color="gray.500" 
                        mb={6}
                        maxW="md"
                        fontSize="sm"
                        lineHeight="1.7"
                      >
                        Preview is not available for this file type ({document.mimeType}). 
                        You can download the file to view it in your preferred application.
                      </Text>
                      <Button 
                        as="a"
                        href={`/api/documents/${document.id}/download?auth=${localStorage.getItem('authToken')}`}
                        leftIcon={<DownloadIcon />}
                        colorScheme="blue"
                        size="md"
                        target="_blank"
                        boxShadow="md"
                        _hover={{ 
                          transform: "translateY(-2px)",
                          boxShadow: "lg" 
                        }}
                        transition="all 0.3s"
                      >
                        Download instead
                      </Button>
                    </Flex>
                  )}
                </CardBody>
              </Card>
            </TabPanel>
            
            {/* AI Insights Tab */}
            <TabPanel px={0} py={4}>
              {hasInsights && document.aiMetadata ? (
                <Grid templateColumns={{base: "1fr", lg: "2fr 1fr"}} gap={6}>
                  <GridItem>
                    {/* Summary */}
                    <Card 
                      variant="outline" 
                      mb={6} 
                      borderWidth="1px"
                      borderColor={borderColor}
                      boxShadow="sm"
                      transition="all 0.2s"
                      _hover={{ boxShadow: "md" }}
                    >
                      <CardHeader 
                        bg={headerBg} 
                        py={3} 
                        px={5} 
                        borderBottomWidth="1px" 
                        borderColor={borderColor}
                        display="flex"
                        alignItems="center"
                      >
                        <Icon as={InfoOutlineIcon} mr={2} color="blue.500" />
                        <Heading size="sm">Document Summary</Heading>
                      </CardHeader>
                      <CardBody p={5}>
                        {document.aiMetadata.summary ? (
                          <Box>
                            <Text 
                              lineHeight="1.7" 
                              fontSize="sm" 
                              whiteSpace="pre-line"
                              color="gray.700"
                              _dark={{ color: "gray.300" }}
                              sx={{
                                "p:not(:last-of-type)": {
                                  marginBottom: "1rem"
                                }
                              }}
                            >
                              {document.aiMetadata.summary}
                            </Text>
                            <Box 
                              mt={4} 
                              pt={4} 
                              borderTop="1px dashed" 
                              borderColor="gray.200"
                              _dark={{ borderColor: "gray.700" }}
                              fontSize="xs"
                              color="gray.500"
                              display="flex"
                              alignItems="center"
                            >
                              <Icon as={TimeIcon} mr={1} fontSize="xs" />
                              Generated {new Date(document.updatedAt || document.createdAt).toLocaleDateString()}
                            </Box>
                          </Box>
                        ) : (
                          <Flex 
                            direction="column" 
                            align="center" 
                            justify="center" 
                            py={8}
                            color="gray.400"
                          >
                            <Icon as={WarningTwoIcon} boxSize={10} mb={3} />
                            <Text fontSize="sm">No summary available</Text>
                            <Text fontSize="xs" mt={2} maxW="sm" textAlign="center" color="gray.500">
                              AI processing couldn't generate a summary for this document.
                            </Text>
                          </Flex>
                        )}
                      </CardBody>
                    </Card>

                    {/* Key Points */}
                    {document.aiMetadata.keyPoints && Array.isArray(document.aiMetadata.keyPoints) && (
                      <Card 
                        variant="outline" 
                        mb={6}
                        borderWidth="1px"
                        borderColor={borderColor}
                        boxShadow="sm"
                        transition="all 0.2s"
                        _hover={{ boxShadow: "md" }}
                      >
                        <CardHeader 
                          bg={headerBg} 
                          py={3} 
                          px={5} 
                          borderBottomWidth="1px" 
                          borderColor={borderColor}
                          display="flex"
                          alignItems="center"
                        >
                          <Icon as={ListIcon} mr={2} color="blue.500" />
                          <Heading size="sm">Key Points</Heading>
                        </CardHeader>
                        <CardBody p={5}>
                          <List spacing={3}>
                            {document.aiMetadata.keyPoints.map((point: string, index: number) => (
                              <ListItem 
                                key={index} 
                                display="flex" 
                                alignItems="flex-start"
                                p={2}
                                _hover={{ bg: "gray.50", _dark: { bg: "gray.800" } }}
                                borderRadius="md"
                                transition="background-color 0.2s"
                              >
                                <Icon 
                                  as={CheckCircleIcon} 
                                  color="green.500" 
                                  mr={3} 
                                  mt={1}
                                  boxSize={4} 
                                />
                                <Text 
                                  fontSize="sm" 
                                  lineHeight="1.6"
                                  color="gray.700"
                                  _dark={{ color: "gray.300" }}
                                >
                                  {point}
                                </Text>
                              </ListItem>
                            ))}
                          </List>
                        </CardBody>
                      </Card>
                    )}

                    {/* Entities */}
                    {document.aiMetadata.entities && Array.isArray(document.aiMetadata.entities) && document.aiMetadata.entities.length > 0 && (
                      <Card 
                        variant="outline" 
                        mb={6}
                        borderWidth="1px"
                        borderColor={borderColor}
                        boxShadow="sm"
                        transition="all 0.2s"
                        _hover={{ boxShadow: "md" }}
                      >
                        <CardHeader 
                          bg={headerBg} 
                          py={3} 
                          px={5} 
                          borderBottomWidth="1px" 
                          borderColor={borderColor}
                          display="flex"
                          alignItems="center"
                        >
                          <Icon as={AtSignIcon} mr={2} color="blue.500" />
                          <Heading size="sm">Entities Mentioned</Heading>
                        </CardHeader>
                        <CardBody p={0}>
                          <Box overflow="auto" maxH="400px">
                            <Table size="sm" variant="simple">
                              <Thead position="sticky" top={0} bg={headerBg} zIndex={1}>
                                <Tr>
                                  <Th pl={5} py={3}>Entity</Th>
                                  <Th py={3}>Type</Th>
                                  <Th py={3} pr={5}>Relevance</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {document.aiMetadata.entities.map((entity: any, index: number) => (
                                  <Tr 
                                    key={index}
                                    _hover={{ bg: "gray.50", _dark: { bg: "gray.800" } }}
                                    transition="background-color 0.2s"
                                  >
                                    <Td 
                                      pl={5} 
                                      borderColor={borderColor}
                                      fontWeight="medium"
                                      color="gray.700"
                                      _dark={{ color: "gray.300" }}
                                    >
                                      {entity.name}
                                    </Td>
                                    <Td borderColor={borderColor}>
                                      <Badge 
                                        px={2} 
                                        py={1} 
                                        borderRadius="full" 
                                        colorScheme={
                                          entity.type === 'PERSON' ? 'purple' : 
                                          entity.type === 'ORGANIZATION' ? 'blue' : 
                                          entity.type === 'LOCATION' ? 'green' : 
                                          entity.type === 'DATE' ? 'orange' : 
                                          entity.type === 'MONEY' ? 'teal' : 
                                          'gray'
                                        }
                                        variant="subtle"
                                        fontWeight="medium"
                                        fontSize="xs"
                                      >
                                        {entity.type}
                                      </Badge>
                                    </Td>
                                    <Td borderColor={borderColor} pr={5}>
                                      {entity.relevance ? (
                                        <Flex alignItems="center">
                                          <Progress 
                                            value={entity.relevance * 100} 
                                            size="xs" 
                                            colorScheme={entity.relevance > 0.7 ? "green" : entity.relevance > 0.4 ? "blue" : "gray"} 
                                            borderRadius="full"
                                            width="70px"
                                            mr={2}
                                          />
                                    ) : (
                                      <Text>-</Text>
                                    )}
                                  </Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </CardBody>
                      </Card>
                    )}
                  </GridItem>

                  <GridItem>
                    {/* Keywords */}
                    {document.aiMetadata.keywords && Array.isArray(document.aiMetadata.keywords) && (
                      <Card variant="outline" mb={6}>
                        <CardHeader bg={headerBg} py={3} px={4} borderBottomWidth="1px" borderColor={borderColor}>
                          <Heading size="sm">Keywords</Heading>
                        </CardHeader>
                        <CardBody p={4}>
                          <Wrap>
                            {document.aiMetadata.keywords.map((keyword: string, index: number) => (
                              <WrapItem key={index}>
                                <Tag size="md" colorScheme="blue" variant="subtle" borderRadius="full" mb={1}>
                                  {keyword}
                                </Tag>
                              </WrapItem>
                            ))}
                          </Wrap>
                        </CardBody>
                      </Card>
                    )}

                    {/* Topics */}
                    {document.aiMetadata.topics && Array.isArray(document.aiMetadata.topics) && document.aiMetadata.topics.length > 0 && (
                      <Card variant="outline" mb={6}>
                        <CardHeader bg={headerBg} py={3} px={4} borderBottomWidth="1px" borderColor={borderColor}>
                          <Heading size="sm">Topics</Heading>
                        </CardHeader>
                        <CardBody p={4}>
                          <Accordion allowMultiple>
                            {document.aiMetadata.topics.map((topic: any, index: number) => (
                              <AccordionItem key={index} borderColor={borderColor}>
                                <AccordionButton py={2}>
                                  <Box flex="1" textAlign="left" fontWeight="medium">
                                    {topic.name}
                                  </Box>
                                  <AccordionIcon />
                                </AccordionButton>
                                <AccordionPanel pb={4}>
                                  <Text fontSize="sm">{topic.description || "No description available"}</Text>
                                  {topic.relevance && (
                                    <Box mt={2}>
                                      <Text fontSize="xs" color="gray.500" mb={1}>Relevance</Text>
                                      <Progress 
                                        value={topic.relevance * 100} 
                                        size="xs" 
                                        colorScheme="blue" 
                                        borderRadius="full" 
                                      />
                                    </Box>
                                  )}
                                </AccordionPanel>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </CardBody>
                      </Card>
                    )}

                    {/* Processing Info */}
                    <Card variant="outline">
                      <CardHeader bg={headerBg} py={3} px={4} borderBottomWidth="1px" borderColor={borderColor}>
                        <Heading size="sm">Processing Information</Heading>
                      </CardHeader>
                      <CardBody p={4}>
                        <Table size="sm" variant="simple">
                          <Tbody>
                            <Tr>
                              <Td pl={0} borderColor={borderColor}>Status</Td>
                              <Td borderColor={borderColor}>
                                {getStatusBadge(document.processingStatus)}
                              </Td>
                            </Tr>
                            <Tr>
                              <Td pl={0} borderColor={borderColor}>Processed Date</Td>
                              <Td borderColor={borderColor}>
                                {document.processingCompletedAt ? 
                                  format(new Date(document.processingCompletedAt), "MMMM d, yyyy") : 
                                  "-"}
                              </Td>
                            </Tr>
                            <Tr>
                              <Td pl={0} borderColor={borderColor}>AI Model</Td>
                              <Td borderColor={borderColor}>GPT-4o</Td>
                            </Tr>
                          </Tbody>
                        </Table>
                        
                        <Button
                          mt={4}
                          size="sm"
                          leftIcon={<RepeatIcon />}
                          onClick={handleProcessDocument}
                          isLoading={processDocumentMutation.isPending}
                          isDisabled={processDocumentMutation.isPending || ['PROCESSING', 'PENDING', 'QUEUED'].includes(document.processingStatus)}
                        >
                          Reprocess Document
                        </Button>
                      </CardBody>
                    </Card>
                  </GridItem>
                </Grid>
              ) : (
                <Box textAlign="center" py={12}>
                  <Icon as={InfoOutlineIcon} boxSize={12} color="gray.400" mb={3} />
                  <Heading size="md" mb={2}>No AI insights available</Heading>
                  <Text color="gray.500" maxW="md" mx="auto" mb={6}>
                    This document hasn't been processed with AI yet or the processing has failed.
                  </Text>
                  <Button
                    leftIcon={<RepeatIcon />}
                    onClick={handleProcessDocument}
                    isLoading={processDocumentMutation.isPending}
                    isDisabled={processDocumentMutation.isPending || ['PROCESSING', 'PENDING', 'QUEUED'].includes(document.processingStatus)}
                    colorScheme="blue"
                  >
                    Process with AI
                  </Button>
                </Box>
              )}
            </TabPanel>
            
            {/* Timeline Tab */}
            <TabPanel px={0} py={4}>
              <Card variant="outline">
                <CardHeader bg={headerBg} py={3} px={4} borderBottomWidth="1px" borderColor={borderColor}>
                  <Heading size="sm">Document Timeline</Heading>
                </CardHeader>
                <CardBody p={4}>
                  <Box position="relative" pl={8}>
                    <Box
                      position="absolute"
                      left={0}
                      top={0}
                      bottom={0}
                      width="2px"
                      bg="blue.100"
                      ml={4}
                    />
                    
                    {/* Upload event */}
                    <Box position="relative" mb={8}>
                      <Box 
                        position="absolute" 
                        left="-8px" 
                        bg="blue.500" 
                        borderRadius="full" 
                        p={1}
                        color="white"
                      >
                        <Icon as={AttachmentIcon} boxSize={3} />
                      </Box>
                      <Box ml={4}>
                        <Text fontWeight="medium">Document Uploaded</Text>
                        <Text fontSize="sm" color="gray.500">
                          {format(new Date(document.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                        </Text>
                        <Text fontSize="sm" mt={1}>
                          Original filename: {document.originalFilename}
                        </Text>
                      </Box>
                    </Box>
                    
                    {/* Processing event */}
                    {document.processingStatus !== 'PENDING' && (
                      <Box position="relative" mb={8}>
                        <Box 
                          position="absolute" 
                          left="-8px" 
                          bg={document.processingStatus === 'COMPLETED' ? 'green.500' : 
                              document.processingStatus === 'FAILED' ? 'red.500' : 'yellow.500'} 
                          borderRadius="full" 
                          p={1}
                          color="white"
                        >
                          <Icon 
                            as={document.processingStatus === 'COMPLETED' ? CheckIcon : 
                                document.processingStatus === 'FAILED' ? WarningIcon : TimeIcon} 
                            boxSize={3} 
                          />
                        </Box>
                        <Box ml={4}>
                          <Text fontWeight="medium">
                            {document.processingStatus === 'COMPLETED' ? 'AI Processing Completed' :
                             document.processingStatus === 'FAILED' ? 'AI Processing Failed' :
                             document.processingStatus === 'PROCESSING' ? 'AI Processing Started' :
                             'Document Queued for Processing'}
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            {document.processingCompletedAt ? 
                              format(new Date(document.processingCompletedAt), "MMMM d, yyyy 'at' h:mm a") : 
                              document.processingStartedAt ?
                              format(new Date(document.processingStartedAt), "MMMM d, yyyy 'at' h:mm a") :
                              '-'}
                          </Text>
                          {document.processingError && (
                            <Alert status="error" mt={2} py={2} px={3} borderRadius="md" fontSize="sm">
                              <AlertIcon />
                              {document.processingError}
                            </Alert>
                          )}
                        </Box>
                      </Box>
                    )}
                    
                    {/* Update event if different from created date */}
                    {document.updatedAt !== document.createdAt && (
                      <Box position="relative">
                        <Box 
                          position="absolute" 
                          left="-8px" 
                          bg="purple.500" 
                          borderRadius="full" 
                          p={1}
                          color="white"
                        >
                          <Icon as={EditIcon} boxSize={3} />
                        </Box>
                        <Box ml={4}>
                          <Text fontWeight="medium">Document Updated</Text>
                          <Text fontSize="sm" color="gray.500">
                            {format(new Date(document.updatedAt), "MMMM d, yyyy 'at' h:mm a")}
                          </Text>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
        </Box>
      </Container>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Document Deletion</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete the following document?
              </p>
              <p className="font-medium text-foreground">
                "{document.title}"
              </p>
              <p className="text-destructive">
                This action cannot be undone and all associated data will be permanently removed.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDocumentMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteDocument} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteDocumentMutation.isPending}
            >
              {deleteDocumentMutation.isPending ? "Deleting..." : "Delete Document"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Missing Import Mock
const ShareIcon = ({ className = "" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
    <polyline points="16 6 12 2 8 6"></polyline>
    <line x1="12" y1="2" x2="12" y2="15"></line>
  </svg>
);

// Already defined at the top of the file