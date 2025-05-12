import React from "react";
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
  Receipt
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { PermissionGuard } from "@/components/permissions/PermissionGuard";

interface DocumentListProps {
  documents: any[];
  isLoading: boolean;
  filter?: string;
}

export default function DocumentList({ documents, isLoading, filter = "all" }: DocumentListProps) {
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

  const filteredDocuments = React.useMemo(() => {
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
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredDocuments.map((document) => (
            <TableRow key={document.id}>
              <TableCell className="font-medium">
                <Link href={`/documents/${document.id}`}>
                  <div className="flex items-center gap-2 text-primary hover:underline cursor-pointer">
                    {getDocumentTypeIcon(document.documentType)}
                    <span>{document.title || document.originalFilename}</span>
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                {document.documentType || "Other"}
              </TableCell>
              <TableCell>
                {getProcessingStatusBadge(document.processingStatus)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(document.createdAt), "MMM d, yyyy")}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontalIcon className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Link href={`/documents/${document.id}`}>
                        <span>View details</span>
                      </Link>
                    </DropdownMenuItem>
                    <PermissionGuard area="documents" permission="view">
                      <DropdownMenuItem asChild>
                        <a href={`/api/documents/${document.id}/download`}>
                          Download
                        </a>
                      </DropdownMenuItem>
                    </PermissionGuard>
                    <PermissionGuard area="documents" permission="delete">
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </PermissionGuard>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}