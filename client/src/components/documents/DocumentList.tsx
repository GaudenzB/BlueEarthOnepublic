import React, { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Flex,
  Text,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Icon,
  Avatar,
  Tooltip,
  Skeleton,
  Stack,
  Center,
  useColorModeValue
} from "@chakra-ui/react";
import { 
  InfoIcon, 
  AttachmentIcon, 
  DownloadIcon, 
  DeleteIcon, 
  EditIcon, 
  ViewIcon, 
  CheckIcon, 
  WarningIcon, 
  TimeIcon
} from "@chakra-ui/icons";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { PermissionGuard } from "@/components/permissions/PermissionGuard";
import { queryClient } from "@/lib/queryClient";
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

interface DocumentListProps {
  documents: any[];
  isLoading: boolean;
  filter?: string;
}

export default function DocumentList({ documents, isLoading, filter = "all" }: DocumentListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{id: string, title: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  
  // Debug logging to help diagnose document data issues
  console.log('DocumentList component:', {
    receivedDocs: !!documents,
    docsIsArray: Array.isArray(documents),
    documentCount: Array.isArray(documents) ? documents.length : 0,
    sampleDoc: Array.isArray(documents) && documents.length > 0 ? documents[0] : null
  });

  const handleDeleteClick = (documentId: string, documentTitle: string) => {
    setDocumentToDelete({
      id: documentId,
      title: documentTitle || 'Untitled Document'
    });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;
    
    try {
      setIsDeleting(true);
      
      // Get the auth token from localStorage
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/documents/${documentToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete document');
      }
      
      // Invalidate documents query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      
      toast({
        title: "Document deleted",
        description: `"${documentToDelete.title}" has been successfully deleted`,
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting document",
        description: error.message || "Failed to delete the document. Please try again.",
        variant: "destructive",
      });
      console.error('Error deleting document:', error);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const getDocumentTypeIcon = (type: string | null) => {
    switch (type) {
      case "CONTRACT":
        return <Icon as={AttachmentIcon} />;
      case "AGREEMENT":
        return <Icon as={CheckIcon} />;
      case "REPORT":
        return <Icon as={InfoIcon} />;
      case "POLICY":
        return <Icon as={InfoIcon} />;
      case "INVOICE":
        return <Icon as={AttachmentIcon} />;
      case "PRESENTATION":
        return <Icon as={InfoIcon} />;
      case "CORRESPONDENCE":
        return <Icon as={InfoIcon} />;
      default:
        return <Icon as={AttachmentIcon} />;
    }
  };

  const getProcessingStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Tooltip label="Document processed successfully">
            <Badge colorScheme="green" display="flex" alignItems="center">
              <CheckIcon mr={1} /> Processed
            </Badge>
          </Tooltip>
        );
      case "PROCESSING":
        return (
          <Tooltip label="Document is being processed">
            <Badge colorScheme="yellow" display="flex" alignItems="center">
              <TimeIcon mr={1} /> Processing
            </Badge>
          </Tooltip>
        );
      case "PENDING":
      case "QUEUED":
        return (
          <Tooltip label="Document is waiting for processing">
            <Badge colorScheme="blue" display="flex" alignItems="center">
              <TimeIcon mr={1} /> Pending
            </Badge>
          </Tooltip>
        );
      case "FAILED":
      case "ERROR":
        return (
          <Tooltip label="Document processing failed">
            <Badge colorScheme="red" display="flex" alignItems="center">
              <WarningIcon mr={1} /> Failed
            </Badge>
          </Tooltip>
        );
      default:
        return (
          <Tooltip label="Unknown document status">
            <Badge colorScheme="gray" display="flex" alignItems="center">
              <InfoIcon mr={1} /> Unknown
            </Badge>
          </Tooltip>
        );
    }
  };

  const filteredDocuments = useMemo(() => {
    if (filter === "all") {
      return documents;
    } else if (filter === "recent") {
      // Get documents from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      return documents.filter(doc => 
        new Date(doc.createdAt) >= thirtyDaysAgo
      );
    } else {
      // Filter by document type
      return documents.filter(doc => doc.documentType === filter);
    }
  }, [documents, filter]);

  if (isLoading) {
    return (
      <Box w="100%" p={4}>
        <Stack spacing={4}>
          <Skeleton height="40px" />
          <Skeleton height="40px" />
          <Skeleton height="40px" />
          <Skeleton height="40px" />
          <Skeleton height="40px" />
        </Stack>
      </Box>
    );
  }

  if (filteredDocuments.length === 0) {
    return (
      <Center py={10} flexDirection="column" borderWidth="1px" borderRadius="md" borderColor={borderColor}>
        <Icon as={AttachmentIcon} boxSize={12} color="gray.400" mb={3} />
        <Text fontSize="lg" fontWeight="medium" mb={1}>No documents found</Text>
        <Text color="gray.500" mb={4}>
          {filter === "all" 
            ? "No documents have been uploaded yet."
            : filter === "recent"
              ? "No documents from the last 30 days."
              : `No ${filter.toLowerCase()} documents found.`}
        </Text>
        <PermissionGuard area="documents" permission="edit">
          <Button variant="outline">Upload your first document</Button>
        </PermissionGuard>
      </Center>
    );
  }

  return (
    <Box overflowX="auto">
      <Table variant="simple" size="md">
        <Thead>
          <Tr>
            <Th width="40%">Name</Th>
            <Th>Type</Th>
            <Th>Status</Th>
            <Th>Date Uploaded</Th>
            <Th>Uploaded By</Th>
            <Th width="80px">Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filteredDocuments.map((document) => (
            <Tr 
              key={document.id} 
              _hover={{ bg: hoverBg }}
              transition="background-color 0.2s"
            >
              <Td>
                <Link href={`/documents/${document.id}`}>
                  <Flex align="center" cursor="pointer">
                    <Avatar 
                      icon={getDocumentTypeIcon(document.documentType)} 
                      bg="blue.100" 
                      color="blue.600" 
                      size="sm" 
                      mr={3}
                    />
                    <Text 
                      fontWeight="medium" 
                      color="blue.600" 
                      isTruncated 
                      maxW="300px" 
                      _hover={{ textDecoration: "underline" }}
                    >
                      {document.title || document.originalFilename}
                    </Text>
                  </Flex>
                </Link>
              </Td>
              <Td>
                <Badge variant="subtle" colorScheme="gray">
                  {document.documentType || "Other"}
                </Badge>
              </Td>
              <Td>
                {getProcessingStatusBadge(document.processingStatus)}
              </Td>
              <Td>
                {format(new Date(document.createdAt), "MMM d, yyyy")}
              </Td>
              <Td>
                <Text isTruncated maxW="120px">
                  {document.uploadedBy || "System"}
                </Text>
              </Td>
              <Td>
                <Menu>
                  <MenuButton
                    as={IconButton}
                    aria-label="Options"
                    icon={<Icon as={InfoIcon} />}
                    variant="ghost"
                    size="sm"
                  />
                  <MenuList>
                    <MenuItem as={Link} href={`/documents/${document.id}`} icon={<Icon as={ViewIcon} />}>
                      View
                    </MenuItem>
                    <PermissionGuard area="documents" permission="view">
                      <MenuItem 
                        as="a" 
                        href={`/api/documents/${document.id}/download`}
                        icon={<Icon as={DownloadIcon} />}
                      >
                        Download
                      </MenuItem>
                    </PermissionGuard>
                    <PermissionGuard area="documents" permission="edit">
                      <MenuItem icon={<Icon as={EditIcon} />}>
                        Replace
                      </MenuItem>
                    </PermissionGuard>
                    <PermissionGuard area="documents" permission="delete">
                      <MenuItem 
                        icon={<Icon as={DeleteIcon} />}
                        onClick={() => handleDeleteClick(document.id, document.title || document.originalFilename)}
                        color="red.500"
                      >
                        Delete
                      </MenuItem>
                    </PermissionGuard>
                  </MenuList>
                </Menu>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Document Deletion</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete the following document?
              </p>
              {documentToDelete && (
                <p className="font-medium text-foreground">
                  "{documentToDelete.title}"
                </p>
              )}
              <p className="text-destructive">
                This action cannot be undone and all associated data will be permanently removed.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Document"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Box>
  );
}