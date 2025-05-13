import React, { useState, useMemo } from "react";
import { Link } from "wouter";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileIcon, 
  FileTextIcon, 
  FileCheckIcon,
  FileX2Icon, 
  MoreHorizontalIcon, 
  ClockIcon,
  FilePenIcon,
  ImageIcon,
  FileEditIcon,
  HelpCircleIcon,
  Receipt,
  Trash2Icon
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { PermissionGuard } from "@/components/permissions/PermissionGuard";
import { queryClient } from "@/lib/queryClient";

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
        return <FileTextIcon className="h-4 w-4" />;
      case "AGREEMENT":
        return <FileCheckIcon className="h-4 w-4" />;
      case "REPORT":
        return <FilePenIcon className="h-4 w-4" />;
      case "POLICY":
        return <FileEditIcon className="h-4 w-4" />;
      case "INVOICE":
        return <Receipt className="h-4 w-4" />;
      case "PRESENTATION":
        return <ImageIcon className="h-4 w-4" />;
      case "CORRESPONDENCE":
        return <FileTextIcon className="h-4 w-4" />;
      default:
        return <HelpCircleIcon className="h-4 w-4" />;
    }
  };

  const getProcessingStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="success" className="gap-1 px-2"><FileCheckIcon className="h-3 w-3" /> Processed</Badge>;
      case "PROCESSING":
        return <Badge variant="warning" className="gap-1 px-2"><ClockIcon className="h-3 w-3" /> Processing</Badge>;
      case "PENDING":
      case "QUEUED":
        return <Badge variant="outline" className="gap-1 px-2"><ClockIcon className="h-3 w-3" /> Pending</Badge>;
      case "FAILED":
      case "ERROR":
        return <Badge variant="destructive" className="gap-1 px-2"><FileX2Icon className="h-3 w-3" /> Failed</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1 px-2"><FileIcon className="h-3 w-3" /> Unknown</Badge>;
    }
  };

  const filteredDocuments = useMemo(() => {
    if (filter === "all") {
      return documents;
    } else if (filter === "recent") {
      // Sort by created date and get first 10
      return [...documents]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);
    } else {
      // Filter by document type
      return documents.filter(doc => doc.documentType === filter);
    }
  }, [documents, filter]);

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-8 w-[100px]" />
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Skeleton className="h-4 w-full" /></TableHead>
                <TableHead><Skeleton className="h-4 w-full" /></TableHead>
                <TableHead><Skeleton className="h-4 w-full" /></TableHead>
                <TableHead><Skeleton className="h-4 w-full" /></TableHead>
                <TableHead><Skeleton className="h-4 w-full" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5).fill(0).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[40px]" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (filteredDocuments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 border rounded-md bg-muted/10">
        <FileIcon className="h-12 w-12 text-muted-foreground mb-3" />
        <h3 className="text-lg font-medium">No documents found</h3>
        <p className="text-muted-foreground mb-4">
          {filter === "all" 
            ? "No documents have been uploaded yet."
            : filter === "recent"
              ? "No recent documents found."
              : `No ${filter.toLowerCase()} documents found.`}
        </p>
        <PermissionGuard area="documents" permission="edit">
          <Button variant="outline">Upload your first document</Button>
        </PermissionGuard>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.map((document) => (
          <Card key={document.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-2 flex flex-row items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                {getDocumentTypeIcon(document.documentType, "h-5 w-5 text-primary")}
              </div>
              <div className="space-y-1 overflow-hidden">
                <CardTitle className="text-base font-medium truncate">
                  {document.title || document.originalFilename}
                </CardTitle>
                <CardDescription className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-xs font-normal">
                    {document.documentType || "Other"}
                  </Badge>
                  <span className="text-xs">•</span>
                  <span className="text-xs">{format(new Date(document.createdAt), "MMM d, yyyy")}</span>
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-auto">
                    <MoreHorizontalIcon className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/documents/${document.id}`}>
                      <FileTextIcon className="h-4 w-4 mr-2" />
                      <span>View details</span>
                    </Link>
                  </DropdownMenuItem>
                  <PermissionGuard area="documents" permission="view">
                    <DropdownMenuItem asChild>
                      <a href={`/api/documents/${document.id}/download`}>
                        <FileIcon className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </DropdownMenuItem>
                  </PermissionGuard>
                  <PermissionGuard area="documents" permission="delete">
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => handleDeleteClick(document.id, document.title || document.originalFilename)}
                    >
                      <Trash2Icon className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </PermissionGuard>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="h-[2px] w-full bg-muted mb-3 mt-1"></div>
              <div className="flex items-center justify-between">
                {getProcessingStatusBadge(document.processingStatus)}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  asChild 
                  className="text-xs"
                >
                  <Link href={`/documents/${document.id}`}>
                    View details →
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
    </div>
  );
}