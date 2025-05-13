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
  Tooltip,
  Skeleton,
  Stack,
  Center,
  useColorModeValue
} from "@chakra-ui/react";
import { 
  InfoOutlineIcon, 
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
        return AttachmentIcon;
      case "AGREEMENT":
        return CheckIcon;
      case "REPORT":
        return InfoOutlineIcon;
      case "POLICY":
        return InfoOutlineIcon;
      case "INVOICE":
        return AttachmentIcon;
      case "PRESENTATION":
        return InfoOutlineIcon;
      case "CORRESPONDENCE":
        return InfoOutlineIcon;
      default:
        return AttachmentIcon;
    }
  };

  const getProcessingStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Tooltip label="Document processed successfully">
            <Badge variant="subtle" colorScheme="green" display="flex" alignItems="center">
              <Icon as={CheckIcon} mr={1} boxSize={3} /> 
              <Text fontSize="xs">Processed</Text>
            </Badge>
          </Tooltip>
        );
      case "PROCESSING":
        return (
          <Tooltip label="Document is being processed">
            <Badge variant="subtle" colorScheme="yellow" display="flex" alignItems="center">
              <Icon as={TimeIcon} mr={1} boxSize={3} /> 
              <Text fontSize="xs">Processing</Text>
            </Badge>
          </Tooltip>
        );
      case "PENDING":
      case "QUEUED":
        return (
          <Tooltip label="Document is waiting for processing">
            <Badge variant="subtle" colorScheme="blue" display="flex" alignItems="center">
              <Icon as={TimeIcon} mr={1} boxSize={3} /> 
              <Text fontSize="xs">Pending</Text>
            </Badge>
          </Tooltip>
        );
      case "FAILED":
      case "ERROR":
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
      <Center py={10} flexDirection="column">
        <Icon as={AttachmentIcon} boxSize={8} color="gray.400" mb={3} />
        <Text fontSize="md" fontWeight="medium" mb={1}>No documents found</Text>
        <Text color="gray.500" fontSize="sm" mb={4}>
          {filter === "all" 
            ? "No documents have been uploaded yet."
            : filter === "recent"
              ? "No documents from the last 30 days."
              : `No ${filter.toLowerCase()} documents found.`}
        </Text>
        <PermissionGuard area="documents" permission="edit">
          <Button variant="outline" size="sm">Upload your first document</Button>
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
                    <Icon 
                      as={getDocumentTypeIcon(document.documentType)} 
                      color="gray.500" 
                      mr={2}
                    />
                    <Text 
                      fontWeight="medium" 
                      color="brand.500" 
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
                <Badge variant="subtle" colorScheme="gray" fontSize="xs">
                  {document.documentType || "Other"}
                </Badge>
              </Td>
              <Td>
                {getProcessingStatusBadge(document.processingStatus)}
              </Td>
              <Td>
                <Text fontSize="sm" color="gray.600">
                  {format(new Date(document.createdAt), "MMM d, yyyy")}
                </Text>
              </Td>
              <Td>
                <Text fontSize="sm" isTruncated maxW="120px" color="gray.600">
                  {document.uploadedBy || "System"}
                </Text>
              </Td>
              <Td>
                <Menu>
                  <MenuButton
                    as={IconButton}
                    aria-label="Options"
                    icon={<Icon as={InfoOutlineIcon} />}
                    variant="ghost"
                    size="sm"
                  />
                  <MenuList fontSize="sm" boxShadow="md">
                    <MenuItem as={Link} href={`/documents/${document.id}`} icon={<Icon as={ViewIcon} boxSize={4} />}>
                      View
                    </MenuItem>
                    <PermissionGuard area="documents" permission="view">
                      <MenuItem 
                        as="a" 
                        href={`/api/documents/${document.id}/download`}
                        icon={<Icon as={DownloadIcon} boxSize={4} />}
                      >
                        Download
                      </MenuItem>
                    </PermissionGuard>
                    <PermissionGuard area="documents" permission="edit">
                      <MenuItem icon={<Icon as={EditIcon} boxSize={4} />}>
                        Replace
                      </MenuItem>
                    </PermissionGuard>
                    <PermissionGuard area="documents" permission="delete">
                      <MenuItem 
                        icon={<Icon as={DeleteIcon} boxSize={4} />}
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