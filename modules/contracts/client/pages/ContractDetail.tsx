import React, { useState } from 'react';
import {
  Box,
  Button,
  Heading,
  Text,
  Flex,
  Grid,
  GridItem,
  Badge,
  Spinner,
  IconButton,
  useToast,
  Card,
  CardHeader,
  CardBody,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  List,
  ListItem,
  HStack,
  Link,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td
} from '@chakra-ui/react';
import { ChevronLeftIcon, EditIcon, DownloadIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { DocumentViewer } from '../../documents/client/components/DocumentViewer';

// Feature flag check
const isContractsEnabled = () => {
  return process.env.ENABLE_CONTRACTS === 'true';
};

// Helper to determine badge color based on contract status
const getStatusColor = (status: string) => {
  switch (status) {
    case 'DRAFT': return 'gray';
    case 'UNDER_REVIEW': return 'yellow';
    case 'ACTIVE': return 'green';
    case 'EXPIRED': return 'red';
    case 'TERMINATED': return 'purple';
    case 'RENEWED': return 'blue';
    default: return 'gray';
  }
};

// Helper to determine color based on obligation type
const getObligationColorScheme = (type: string): string => {
  switch (type) {
    case 'REPORTING': return 'blue';
    case 'PAYMENT': return 'green';
    case 'DISCLOSURE': return 'purple';
    case 'COMPLIANCE': return 'orange';
    case 'OPERATIONAL': return 'cyan';
    default: return 'gray';
  }
};

// Helper to determine color based on confidence
const getConfidenceColor = (confidence: string | null) => {
  switch (confidence) {
    case 'HIGH': return 'green';
    case 'MEDIUM': return 'yellow';
    case 'LOW': return 'orange';
    default: return 'gray';
  }
};

export default function ContractDetail() {
  const params = useParams<{ id: string }>();
  const [location, setLocation] = useLocation();
  const toast = useToast();
  const showConfidence = process.env.ENABLE_CONTRACT_AI === 'true'; // Read confidence UI flag
  
  // Fetch contract details
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['/api/contracts', params.id],
    queryFn: async () => {
      return apiRequest(`/api/contracts/${params.id}`);
    }
  });
  
  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Navigate back to contracts list
  const handleBackToList = () => {
    setLocation('/contracts');
  };
  
  // Navigate to edit page
  const handleEdit = () => {
    setLocation(`/contracts/${params.id}/edit`);
  };
  
  // Handle document viewer reference for source linking
  const documentViewerRef = React.useRef<any>(null);
  
  // Handle scrolling to source in document
  const scrollToSource = (pageNumber: number, coords?: any) => {
    if (documentViewerRef.current && documentViewerRef.current.scrollToPage) {
      documentViewerRef.current.scrollToPage(pageNumber, coords);
      
      toast({
        title: "Source Located",
        description: `Scrolled to page ${pageNumber}`,
        status: "info",
        duration: 2000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Cannot Scroll",
        description: "Document viewer is not available",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
    }
  };
  
  // Feature flag check
  if (!isContractsEnabled()) {
    return (
      <Box p={8} textAlign="center">
        <Heading size="md">Contract Management</Heading>
        <Text mt={4}>Contract management is not enabled in this environment.</Text>
      </Box>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <Flex justify="center" align="center" height="50vh">
        <Spinner size="xl" />
      </Flex>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <Box p={8} textAlign="center">
        <Heading size="md" color="red.500">Error Loading Contract</Heading>
        <Text mt={4}>{(error as Error)?.message || 'Unknown error'}</Text>
        <Button mt={6} onClick={handleBackToList} leftIcon={<ChevronLeftIcon />}>
          Back to Contracts
        </Button>
      </Box>
    );
  }
  
  // Extract contract data
  const contract = data?.data;
  if (!contract) {
    return (
      <Box p={8} textAlign="center">
        <Heading size="md">Contract Not Found</Heading>
        <Button mt={6} onClick={handleBackToList} leftIcon={<ChevronLeftIcon />}>
          Back to Contracts
        </Button>
      </Box>
    );
  }
  
  // Extract document related data
  const documentId = contract.documentId;
  const clauses = contract.clauses || [];
  const obligations = contract.obligations || [];
  
  // Confidence level from AI extraction
  const confidenceLevel = contract.confidenceLevel || null;
  
  return (
    <Box p={6}>
      {/* Header */}
      <Flex 
        justify="space-between" 
        align="center" 
        mb={6} 
        wrap="wrap"
        gap={4}
      >
        <Box>
          <Button 
            variant="ghost" 
            leftIcon={<ChevronLeftIcon />} 
            onClick={handleBackToList}
            size="sm"
            mb={2}
          >
            All Contracts
          </Button>
          <Heading size="lg">
            {contract.contractNumber ? 
              `Contract ${contract.contractNumber}` : 
              'Contract Details'}
          </Heading>
          <HStack mt={1} spacing={2}>
            <Badge colorScheme={getStatusColor(contract.contractStatus)} fontSize="0.8em">
              {contract.contractStatus.replace('_', ' ')}
            </Badge>
            <Badge colorScheme="blue" fontSize="0.8em">
              {contract.contractType.replace('_', ' ')}
            </Badge>
            {showConfidence && confidenceLevel && (
              <Badge colorScheme={getConfidenceColor(confidenceLevel)} fontSize="0.8em">
                AI Confidence: {confidenceLevel}
              </Badge>
            )}
          </HStack>
        </Box>
        
        <HStack spacing={2}>
          <Button 
            leftIcon={<DownloadIcon />} 
            variant="outline"
            onClick={() => window.open(`/api/documents/${documentId}/download`, '_blank')}
          >
            Download Document
          </Button>
          <Button 
            leftIcon={<EditIcon />} 
            colorScheme="blue"
            onClick={handleEdit}
          >
            Edit Contract
          </Button>
        </HStack>
      </Flex>
      
      {/* Content */}
      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
        {/* Left Side - Contract Details */}
        <GridItem>
          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab>Details</Tab>
              <Tab>Obligations ({obligations.length})</Tab>
              <Tab>Clauses ({clauses.length})</Tab>
            </TabList>
            
            <TabPanels>
              {/* Details Tab */}
              <TabPanel p={4}>
                <Card mb={4}>
                  <CardHeader bg="gray.50" py={3}>
                    <Heading size="sm">Key Information</Heading>
                  </CardHeader>
                  <CardBody>
                    <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                      <GridItem>
                        <Text fontWeight="bold">Contract Type</Text>
                        <Text>{contract.contractType.replace('_', ' ')}</Text>
                      </GridItem>
                      <GridItem>
                        <Text fontWeight="bold">Contract Number</Text>
                        <Text>{contract.contractNumber || 'Not specified'}</Text>
                      </GridItem>
                      <GridItem colSpan={2}>
                        <Text fontWeight="bold">Counterparty</Text>
                        <Text>{contract.counterpartyName}</Text>
                        {contract.counterpartyContactEmail && (
                          <Text fontSize="sm" color="blue.600">
                            {contract.counterpartyContactEmail}
                          </Text>
                        )}
                      </GridItem>
                      {contract.counterpartyAddress && (
                        <GridItem colSpan={2}>
                          <Text fontWeight="bold">Counterparty Address</Text>
                          <Text whiteSpace="pre-line">{contract.counterpartyAddress}</Text>
                        </GridItem>
                      )}
                    </Grid>
                  </CardBody>
                </Card>
                
                <Card mb={4}>
                  <CardHeader bg="gray.50" py={3}>
                    <Heading size="sm">Key Dates</Heading>
                  </CardHeader>
                  <CardBody>
                    <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                      <GridItem>
                        <Text fontWeight="bold">Effective Date</Text>
                        <Text>{formatDate(contract.effectiveDate)}</Text>
                      </GridItem>
                      <GridItem>
                        <Text fontWeight="bold">Expiry Date</Text>
                        <Text>{formatDate(contract.expiryDate)}</Text>
                      </GridItem>
                      <GridItem>
                        <Text fontWeight="bold">Execution Date</Text>
                        <Text>{formatDate(contract.executionDate)}</Text>
                      </GridItem>
                      <GridItem>
                        <Text fontWeight="bold">Renewal Date</Text>
                        <Text>{formatDate(contract.renewalDate)}</Text>
                      </GridItem>
                    </Grid>
                  </CardBody>
                </Card>
                
                <Card>
                  <CardHeader bg="gray.50" py={3}>
                    <Heading size="sm">Financial Terms</Heading>
                  </CardHeader>
                  <CardBody>
                    <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                      <GridItem>
                        <Text fontWeight="bold">Total Value</Text>
                        <Text>
                          {contract.totalValue
                            ? `${contract.totalValue} ${contract.currency || ''}`
                            : 'Not specified'}
                        </Text>
                      </GridItem>
                      <GridItem>
                        <Text fontWeight="bold">Currency</Text>
                        <Text>{contract.currency || 'Not specified'}</Text>
                      </GridItem>
                    </Grid>
                  </CardBody>
                </Card>
              </TabPanel>
              
              {/* Obligations Tab */}
              <TabPanel p={4}>
                {obligations.length === 0 ? (
                  <Box textAlign="center" py={8} bg="gray.50" borderRadius="md">
                    <Text color="gray.500">No obligations added to this contract.</Text>
                    <Button 
                      mt={4} 
                      colorScheme="blue" 
                      size="sm"
                      onClick={handleEdit}
                    >
                      Add Obligations
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Title</Th>
                          <Th>Type</Th>
                          <Th>Due Date</Th>
                          <Th>Responsible Party</Th>
                          <Th width="80px">Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {obligations.map((obligation: any) => (
                          <Tr key={obligation.id}>
                            <Td>
                              {obligation.title}
                              {showConfidence && obligation.confidenceLevel && (
                                <Badge 
                                  ml={2} 
                                  colorScheme={getConfidenceColor(obligation.confidenceLevel)}
                                  fontSize="xs"
                                >
                                  {obligation.confidenceLevel}
                                </Badge>
                              )}
                            </Td>
                            <Td>
                              <Badge colorScheme={getObligationColorScheme(obligation.obligationType)}>
                                {obligation.obligationType}
                              </Badge>
                            </Td>
                            <Td>
                              {obligation.dueDate ? new Date(obligation.dueDate).toLocaleDateString() : 'N/A'}
                              {obligation.recurringPattern && (
                                <Badge ml={2} colorScheme="purple" fontSize="xs">
                                  {obligation.recurringPattern}
                                </Badge>
                              )}
                            </Td>
                            <Td>{obligation.responsibleParty || 'N/A'}</Td>
                            <Td>
                              {obligation.clauseId && (
                                <IconButton
                                  aria-label="View source"
                                  icon={<ChevronDownIcon />}
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    // Find the clause for this obligation
                                    const clause = clauses.find((c: any) => c.id === obligation.clauseId);
                                    if (clause && clause.pageNumber) {
                                      scrollToSource(clause.pageNumber, clause.pageCoordinates);
                                    } else {
                                      toast({
                                        title: "Source Not Found",
                                        description: "No page reference available for this obligation",
                                        status: "warning",
                                        duration: 2000,
                                        isClosable: true,
                                      });
                                    }
                                  }}
                                />
                              )}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </TabPanel>
              
              {/* Clauses Tab */}
              <TabPanel p={4}>
                {clauses.length === 0 ? (
                  <Box textAlign="center" py={8} bg="gray.50" borderRadius="md">
                    <Text color="gray.500">No clauses extracted from this contract.</Text>
                  </Box>
                ) : (
                  <List spacing={4}>
                    {clauses.map((clause: any, index: number) => (
                      <ListItem 
                        key={clause.id || index} 
                        p={3} 
                        border="1px" 
                        borderColor="gray.200" 
                        borderRadius="md"
                      >
                        <Flex justify="space-between">
                          <Box>
                            <Flex align="center">
                              <Text fontWeight="bold">
                                {clause.title || `Clause ${clause.sectionNumber || (index + 1)}`}
                              </Text>
                              {showConfidence && clause.confidenceLevel && (
                                <Badge 
                                  ml={2} 
                                  colorScheme={getConfidenceColor(clause.confidenceLevel)}
                                  fontSize="xs"
                                >
                                  {clause.confidenceLevel}
                                </Badge>
                              )}
                            </Flex>
                            {clause.sectionNumber && (
                              <Text fontSize="sm" color="gray.500">
                                Section {clause.sectionNumber}
                              </Text>
                            )}
                          </Box>
                          
                          {clause.pageNumber && (
                            <IconButton
                              aria-label="Go to page"
                              icon={<ChevronDownIcon />}
                              size="sm"
                              variant="ghost"
                              onClick={() => scrollToSource(clause.pageNumber, clause.pageCoordinates)}
                            />
                          )}
                        </Flex>
                        
                        <Divider my={2} />
                        
                        <Text mt={2} fontSize="sm" whiteSpace="pre-line">
                          {clause.content.substring(0, 300)}
                          {clause.content.length > 300 && '...'}
                        </Text>
                        
                        {clause.pageNumber && (
                          <Text fontSize="xs" mt={2} color="gray.500">
                            Page {clause.pageNumber}
                          </Text>
                        )}
                      </ListItem>
                    ))}
                  </List>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </GridItem>
        
        {/* Right Side - Document Viewer */}
        <GridItem>
          <Card height="calc(100vh - 180px)" overflow="hidden">
            <CardHeader bg="gray.50" py={3}>
              <Heading size="sm">Document Viewer</Heading>
            </CardHeader>
            <CardBody p={0} height="100%" overflow="auto">
              {documentId ? (
                <DocumentViewer 
                  documentId={documentId} 
                  readOnly={true}
                  ref={documentViewerRef}
                />
              ) : (
                <Flex 
                  justify="center" 
                  align="center" 
                  height="100%" 
                  bg="gray.50"
                >
                  <Text color="gray.500">No document associated with this contract</Text>
                </Flex>
              )}
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </Box>
  );
}