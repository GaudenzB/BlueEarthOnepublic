import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { format } from "date-fns";
import {
  Typography,
  Badge,
  Button,
  Card,
  Row,
  Col,
  Divider,
  Tabs,
  Tooltip,
  Skeleton,
  Progress,
  Alert,
  Space,
  Tag,
  List,
  Table,
  Collapse,
  Dropdown,
  Menu,
  Modal
} from "antd";
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  StarOutlined,
  SyncOutlined,
  EditOutlined,
  EyeOutlined,
  LockOutlined,
  PaperClipOutlined,
  LinkOutlined,
  RightOutlined,
  MoreOutlined
} from "@ant-design/icons";
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

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

// Skeleton component for loading state
function DocumentDetailSkeleton() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ display: 'flex', marginBottom: 24, alignItems: 'center', gap: 16 }}>
        <Skeleton.Avatar active size={40} shape="square" />
        <div style={{ flex: 1 }}>
          <Skeleton.Input active style={{ width: '60%', marginBottom: 8 }} />
          <Skeleton.Input active style={{ width: '40%' }} />
        </div>
        <Skeleton.Button active style={{ width: 120 }} />
      </div>
      
      <div style={{ marginBottom: 24 }}>
        <Skeleton.Input active block style={{ height: 48, marginBottom: 24 }} />
        <Row gutter={24}>
          <Col span={16}>
            <Skeleton.Image active style={{ width: '100%', height: 200, marginBottom: 16 }} />
            <Skeleton active paragraph={{ rows: 5 }} />
          </Col>
          <Col span={8}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Skeleton.Input active block style={{ height: 120 }} />
              <Skeleton.Input active block style={{ height: 180 }} />
            </div>
          </Col>
        </Row>
      </div>
    </div>
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
  
  // Colors for Ant Design
  const bgColor = '#ffffff';
  const borderColor = '#f0f0f0';
  const headerBg = '#fafafa';
  const tagBg = '#f5f5f5';
  
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
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>
        <Alert
          type="error"
          showIcon
          message={<Title level={4}>Error Loading Document</Title>}
          description={
            <div>
              <Paragraph>There was a problem loading the document. Please try again later.</Paragraph>
              <div style={{ 
                background: '#f5f5f5', 
                padding: '12px', 
                borderRadius: '4px', 
                fontFamily: 'monospace',
                fontSize: '14px',
                marginTop: '16px'
              }}>
                {error instanceof Error ? error.message : "Unknown error"}
              </div>
            </div>
          }
        />
        <Button 
          style={{ marginTop: '16px' }}
          icon={<ArrowLeftOutlined />}
          href="/documents"
          type="primary"
          ghost
        >
          Back to Documents
        </Button>
      </div>
    );
  }
  
  // Extract document data regardless of response format
  const document = documentResponse?.data || documentResponse;
  
  if (!document) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ textAlign: 'center', padding: '40px 24px' }}>
          <InfoCircleOutlined style={{ fontSize: '50px', color: '#bfbfbf' }} />
          <Title level={2} style={{ marginTop: '24px', marginBottom: '8px' }}>
            Document Not Found
          </Title>
          <Paragraph type="secondary">
            The requested document could not be found.
          </Paragraph>
          <Button 
            style={{ marginTop: '24px' }}
            icon={<ArrowLeftOutlined />}
            href="/documents"
            type="primary"
          >
            Back to Documents
          </Button>
        </div>
      </div>
    );
  }
  
  // Helper function to get processing status text
  const getProcessingStatusText = (status: string): string => {
    switch(status) {
      case "PROCESSING":
        return "Processing document...";
      case "PENDING":
        return "Pending processing...";
      case "QUEUED":
        return "Queued for processing...";
      default:
        return "Waiting to process...";
    }
  };
  
  // Helper function to get processing progress percentage
  const getProcessingProgress = (status: string): number => {
    switch(status) {
      case "PROCESSING":
        return 65;
      case "PENDING":
        return 25;
      case "QUEUED":
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
      case "COMPLETED":
        return (
          <Tooltip title="Document processed successfully">
            <Badge 
              status="success" 
              text={
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircleOutlined style={{ marginRight: 4, fontSize: 12 }} />
                  <span>Processed</span>
                </span>
              }
            />
          </Tooltip>
        );
      case "PROCESSING":
        return (
          <Tooltip title="Document is being processed">
            <Badge 
              status="processing" 
              text={
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <ClockCircleOutlined style={{ marginRight: 4, fontSize: 12 }} />
                  <span>Processing</span>
                </span>
              }
            />
          </Tooltip>
        );
      case "PENDING":
      case "QUEUED":
        return (
          <Tooltip title="Document is waiting for processing">
            <Badge 
              status="warning" 
              text={
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <ClockCircleOutlined style={{ marginRight: 4, fontSize: 12 }} />
                  <span>Pending</span>
                </span>
              }
            />
          </Tooltip>
        );
      case "FAILED":
      case "ERROR":
        return (
          <Tooltip title="Document processing failed">
            <Badge 
              status="error" 
              text={
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <WarningOutlined style={{ marginRight: 4, fontSize: 12 }} />
                  <span>Failed</span>
                </span>
              }
            />
          </Tooltip>
        );
      default:
        return (
          <Tooltip title="Unknown document status">
            <Badge 
              status="default" 
              text={
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <InfoCircleOutlined style={{ marginRight: 4, fontSize: 12 }} />
                  <span>Unknown</span>
                </span>
              }
            />
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
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Document Header */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          marginBottom: 24, 
          alignItems: 'center', 
          gap: 16,
          flexWrap: 'wrap'
        }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            href="/documents"
            type="default"
            size="small"
          />
          
          <div style={{ flex: 1 }}>
            <Title level={4} style={{ marginBottom: 4 }}>{document.title}</Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Tag color="default">{document.documentType || "Other"}</Tag>
              <Typography.Text type="secondary">
                Last updated {format(new Date(document.updatedAt), "MMMM d, yyyy")}
              </Typography.Text>
              {getStatusBadge(document.processingStatus)}
            </div>
          </div>
          
          <Space>
            <Tooltip title="Download document">
              <Button
                type="primary"
                ghost
                icon={<DownloadOutlined />}
                href={`/api/documents/${document.id}/download?auth=${localStorage.getItem('authToken')}`}
                size="middle"
              />
            </Tooltip>
            
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'refresh',
                    label: 'Refresh Status',
                    icon: <SyncOutlined />,
                    onClick: handleRefreshStatus
                  },
                  {
                    key: 'process',
                    label: 'Process Document',
                    icon: <PaperClipOutlined />,
                    onClick: handleProcessDocument,
                    disabled: document.processingStatus === "PROCESSING" || 
                              document.processingStatus === "PENDING" || 
                              document.processingStatus === "QUEUED"
                  },
                  {
                    key: 'edit',
                    label: 'Edit Details',
                    icon: <EditOutlined />
                  },
                  {
                    key: 'view',
                    label: 'View Original',
                    icon: <EyeOutlined />
                  },
                  {
                    key: 'delete',
                    label: 'Delete Document',
                    icon: <DeleteOutlined />,
                    onClick: handleDeleteDocument,
                    danger: true
                  }
                ]
              }}
              trigger={['click']}
            >
              <Button icon={<MoreOutlined />} />
            </Dropdown>
            
            {getStatusBadge(document.processingStatus)}
          </Space>
        </div>
        
        {/* Processing Alert if needed */}
        {['PROCESSING', 'PENDING', 'QUEUED'].includes(document.processingStatus) && (
          <Alert status="info" variant="left-accent" mb={6} borderRadius="md">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle fontSize="sm">Document Processing</AlertTitle>
              <AlertDescription fontSize="xs">
                {getProcessingStatusText(document.processingStatus)}
                <Progress 
                  size="xs" 
                  isIndeterminate 
                  colorScheme="blue" 
                  mt={2} 
                  borderRadius="full"
                  value={getProcessingProgress(document.processingStatus)}
                />
              </AlertDescription>
            </Box>
            <Button
              size="xs"
              variant="outline"
              leftIcon={<RepeatIcon />}
              onClick={handleRefreshStatus}
            >
              Refresh
            </Button>
          </Alert>
        )}
        
        {/* Main Content */}
        <Tabs variant="enclosed" index={selectedTab} onChange={handleTabChange} colorScheme="blue">
          <TabList>
            <Tab fontWeight="medium">Details</Tab>
            <Tab fontWeight="medium">Preview</Tab>
            <Tab fontWeight="medium" isDisabled={!hasInsights}>AI Insights</Tab>
            <Tab fontWeight="medium">Timeline</Tab>
          </TabList>
          
          <TabPanels>
            {/* Details Tab */}
            <TabPanel px={0} py={4}>
              <Grid templateColumns={{base: "1fr", md: "2fr 1fr"}} gap={6}>
                {/* Left Column */}
                <GridItem>
                  <Card variant="outline" mb={6}>
                    <CardHeader bg={headerBg} py={3} px={4} borderBottomWidth="1px" borderColor={borderColor}>
                      <Heading size="sm">Document Information</Heading>
                    </CardHeader>
                    <CardBody p={4}>
                      <Stack spacing={5}>
                        <Box>
                          <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={1}>
                            Description
                          </Text>
                          <Text>{document.description || "No description provided."}</Text>
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
                    <Card variant="outline" mb={6}>
                      <CardHeader bg={headerBg} py={3} px={4} display="flex" alignItems="center" justifyContent="space-between" borderBottomWidth="1px" borderColor={borderColor}>
                        <Heading size="sm">Document Summary</Heading>
                        <Badge colorScheme="purple" variant="subtle">AI Generated</Badge>
                      </CardHeader>
                      <CardBody p={4}>
                        <Text fontSize="sm">{document.aiMetadata.summary}</Text>
                      </CardBody>
                    </Card>
                  )}
                </GridItem>
                
                {/* Right Column */}
                <GridItem>
                  {/* Document Properties */}
                  <Card variant="outline" mb={6}>
                    <CardHeader bg={headerBg} py={3} px={4} borderBottomWidth="1px" borderColor={borderColor}>
                      <Heading size="sm">Properties</Heading>
                    </CardHeader>
                    <CardBody p={4}>
                      <Stack spacing={4}>
                        {/* Tags */}
                        <Box>
                          <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={1}>
                            Tags
                          </Text>
                          {document.tags && Array.isArray(document.tags) && document.tags.length > 0 ? (
                            <Wrap>
                              {document.tags.map((tag: string, index: number) => (
                                <WrapItem key={index}>
                                  <Tag size="sm" bg={tagBg}>{tag}</Tag>
                                </WrapItem>
                              ))}
                            </Wrap>
                          ) : (
                            <Text fontSize="sm" color="gray.500">No tags</Text>
                          )}
                        </Box>
                        
                        {/* Confidentiality */}
                        <Box>
                          <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={1}>
                            Confidentiality
                          </Text>
                          <Badge colorScheme={document.isConfidential ? "red" : "green"}>
                            {document.isConfidential ? "Confidential" : "Not Confidential"}
                          </Badge>
                        </Box>
                        
                        {/* AI Processing */}
                        <Box>
                          <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={1}>
                            AI Processing
                          </Text>
                          {document.processingStatus === "COMPLETED" ? (
                            <Badge colorScheme="green" display="flex" alignItems="center" width="fit-content">
                              <Icon as={CheckIcon} mr={1} boxSize={3} />
                              Processed
                            </Badge>
                          ) : document.processingStatus === "FAILED" || document.processingStatus === "ERROR" ? (
                            <Box>
                              <Badge colorScheme="red" display="flex" alignItems="center" width="fit-content" mb={1}>
                                <Icon as={WarningIcon} mr={1} boxSize={3} />
                                Failed
                              </Badge>
                              {document.processingError && (
                                <Text fontSize="xs" color="red.500" mt={1}>
                                  {document.processingError}
                                </Text>
                              )}
                            </Box>
                          ) : (
                            <Box>
                              <Badge colorScheme="blue" display="flex" alignItems="center" width="fit-content">
                                <Icon as={TimeIcon} mr={1} boxSize={3} />
                                {document.processingStatus}
                              </Badge>
                              <Button
                                mt={2}
                                size="xs"
                                leftIcon={<RepeatIcon />}
                                onClick={handleProcessDocument}
                                isLoading={processDocumentMutation.isPending}
                                isDisabled={processDocumentMutation.isPending || ['PROCESSING', 'PENDING', 'QUEUED'].includes(document.processingStatus)}
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
                    <Card variant="outline">
                      <CardHeader bg={headerBg} py={3} px={4} borderBottomWidth="1px" borderColor={borderColor}>
                        <Heading size="sm">AI Insights</Heading>
                      </CardHeader>
                      <CardBody p={4}>
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
              <Card variant="outline" height="600px">
                <CardHeader bg={headerBg} py={3} px={4} borderBottomWidth="1px" borderColor={borderColor}>
                  <Heading size="sm">Document Preview</Heading>
                </CardHeader>
                <CardBody p={0} position="relative">
                  {document.mimeType?.includes('pdf') ? (
                    <Box position="relative" height="100%" width="100%">
                      <iframe 
                        src={`/api/documents/${document.id}/download?auth=${localStorage.getItem('authToken')}`}
                        width="100%" 
                        height="100%" 
                        style={{ border: 'none', borderBottomLeftRadius: '0.375rem', borderBottomRightRadius: '0.375rem' }}
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
                        p={8}
                      >
                        <Icon as={WarningIcon} boxSize={12} color="orange.500" mb={4} />
                        <Heading size="md" mb={2}>Preview temporarily unavailable</Heading>
                        <Text textAlign="center" color="gray.600" mb={4}>
                          The document preview is currently experiencing technical difficulties.
                        </Text>
                        <Button 
                          as="a"
                          href={`/api/documents/${document.id}/download?auth=${localStorage.getItem('authToken')}`}
                          leftIcon={<DownloadIcon />}
                          colorScheme="blue"
                          target="_blank"
                        >
                          Download document
                        </Button>
                      </Flex>
                    </Box>
                  ) : (
                    <Flex direction="column" alignItems="center" justifyContent="center" height="100%" p={8}>
                      <Icon as={AttachmentIcon} boxSize={12} color="gray.400" mb={4} />
                      <Heading size="md" mb={2}>Preview not available</Heading>
                      <Text textAlign="center" color="gray.500" mb={4}>
                        Preview is not available for this file type ({document.mimeType}).
                      </Text>
                      <Button 
                        as="a"
                        href={`/api/documents/${document.id}/download?auth=${localStorage.getItem('authToken')}`}
                        leftIcon={<DownloadIcon />}
                        colorScheme="blue"
                        target="_blank"
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
                    <Card variant="outline" mb={6}>
                      <CardHeader bg={headerBg} py={3} px={4} borderBottomWidth="1px" borderColor={borderColor}>
                        <Heading size="sm">Document Summary</Heading>
                      </CardHeader>
                      <CardBody p={4}>
                        {document.aiMetadata.summary ? (
                          <Text>{document.aiMetadata.summary}</Text>
                        ) : (
                          <Text color="gray.500">No summary available</Text>
                        )}
                      </CardBody>
                    </Card>

                    {/* Key Points */}
                    {document.aiMetadata.keyPoints && Array.isArray(document.aiMetadata.keyPoints) && (
                      <Card variant="outline" mb={6}>
                        <CardHeader bg={headerBg} py={3} px={4} borderBottomWidth="1px" borderColor={borderColor}>
                          <Heading size="sm">Key Points</Heading>
                        </CardHeader>
                        <CardBody p={4}>
                          <List spacing={2}>
                            {document.aiMetadata.keyPoints.map((point: string, index: number) => (
                              <ListItem key={index} display="flex" alignItems="baseline">
                                <Icon as={CheckIcon} color="green.500" mr={2} boxSize={3} />
                                <Text>{point}</Text>
                              </ListItem>
                            ))}
                          </List>
                        </CardBody>
                      </Card>
                    )}

                    {/* Entities */}
                    {document.aiMetadata.entities && Array.isArray(document.aiMetadata.entities) && document.aiMetadata.entities.length > 0 && (
                      <Card variant="outline" mb={6}>
                        <CardHeader bg={headerBg} py={3} px={4} borderBottomWidth="1px" borderColor={borderColor}>
                          <Heading size="sm">Entities Mentioned</Heading>
                        </CardHeader>
                        <CardBody p={4}>
                          <Table size="sm" variant="simple">
                            <Thead>
                              <Tr>
                                <Th pl={0}>Entity</Th>
                                <Th>Type</Th>
                                <Th>Relevance</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {document.aiMetadata.entities.map((entity: any, index: number) => (
                                <Tr key={index}>
                                  <Td pl={0} borderColor={borderColor}>{entity.name}</Td>
                                  <Td borderColor={borderColor}>
                                    <Badge size="sm" colorScheme="blue" variant="subtle">
                                      {entity.type}
                                    </Badge>
                                  </Td>
                                  <Td borderColor={borderColor}>
                                    {entity.relevance ? (
                                      <Progress 
                                        value={entity.relevance * 100} 
                                        size="xs" 
                                        colorScheme="blue" 
                                        borderRadius="full"
                                        width="80px"
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