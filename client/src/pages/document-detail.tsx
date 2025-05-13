import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { 
  ArrowLeftIcon, 
  FileIcon, 
  FileTextIcon, 
  Download, 
  Share2Icon, 
  ClockIcon, 
  InfoIcon,
  FileCheckIcon,
  FileX2Icon,
  LockIcon
} from "lucide-react";
import { PermissionGuard } from "@/components/permissions/PermissionGuard";

export default function DocumentDetail() {
  // Get document id from URL params
  const params = useParams<{ id: string }>();
  const id = params?.id;

  // Fetch document data
  const { data: documentResponse, isLoading, error } = useQuery<any>({
    queryKey: [`/api/documents/${id}`],
    retry: false,
    enabled: !!id,
  });

  // Debug logging
  console.log("Document detail response:", documentResponse);

  // Special handling to check the response structure and extract the document correctly
  let document = null;
  if (documentResponse) {
    // Case 1: Wrapped API response with success and data properties
    if (typeof documentResponse === 'object' && 'success' in documentResponse) {
      if (documentResponse.success && documentResponse.data) {
        document = documentResponse.data;
      }
    }
    // Case 2: Direct document object (the API returned the document directly)
    else if (typeof documentResponse === 'object' && 'id' in documentResponse) {
      document = documentResponse;
    }
  }
  
  console.log("Extracted document:", document);

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" disabled>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-[300px]" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-[200px]" />
              </CardHeader>
              <CardContent>
                <div className="aspect-[16/10] rounded-md bg-muted w-full" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-[150px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-[120px]" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-[120px]" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="space-y-6">
        <Link href="/documents">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeftIcon className="h-4 w-4" /> Back to Documents
          </Button>
        </Link>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileX2Icon className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-2xl font-semibold mb-2">Document Not Found</h3>
            <p className="text-muted-foreground mb-6">
              The document you're looking for could not be found or you don't have permission to access it.
            </p>
            <Link href="/documents">
              <Button>Return to Documents</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{document.title || document.originalFilename} | BlueEarth Capital</title>
        <meta name="description" content={document.description || "Document details"} />
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/documents">
              <Button variant="outline" size="icon">
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{document.title || document.originalFilename}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>{document.documentType || "Other"}</span>
                <span>•</span>
                <span>Uploaded {format(new Date(document.createdAt), "MMMM d, yyyy")}</span>
                {document.isConfidential && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-amber-500">
                      <LockIcon className="h-3 w-3" /> Confidential
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <PermissionGuard area="documents" permission="view">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </PermissionGuard>
            <PermissionGuard area="documents" permission="edit">
              <Button variant="outline" size="sm" className="gap-2">
                <Share2Icon className="h-4 w-4" />
                Share
              </Button>
            </PermissionGuard>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Document Preview</span>
                  {getStatusBadge(document.processingStatus)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {document.processingStatus === "COMPLETED" ? (
                  <div className="border rounded-md aspect-[16/10] bg-muted flex items-center justify-center">
                    <iframe 
                      src={`/api/documents/${id}/preview`} 
                      className="w-full h-full"
                      title={document.title || document.originalFilename}
                    />
                  </div>
                ) : (
                  <div className="border rounded-md aspect-[16/10] bg-muted flex flex-col items-center justify-center p-4">
                    <FileTextIcon className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Document processing</h3>
                    <p className="text-center text-muted-foreground">
                      {document.processingStatus === "PROCESSING" && "Your document is currently being processed. This might take a few minutes."}
                      {document.processingStatus === "PENDING" && "Your document is waiting to be processed. This might take a few minutes."}
                      {document.processingStatus === "QUEUED" && "Your document is queued for processing. This might take a few minutes."}
                      {(document.processingStatus === "FAILED" || document.processingStatus === "ERROR") && 
                        "There was an error processing this document. Our team has been notified."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {document.aiProcessed ? (
                  <Tabs defaultValue="summary">
                    <TabsList className="mb-4">
                      <TabsTrigger value="summary">Summary</TabsTrigger>
                      <TabsTrigger value="entities">Entities</TabsTrigger>
                      <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="summary">
                      <div className="prose max-w-none">
                        {document.aiMetadata?.summary || (
                          <p className="text-muted-foreground">No summary available.</p>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="entities">
                      <div className="prose max-w-none">
                        {document.aiMetadata?.entities ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Could map through entities here */}
                            <p className="text-muted-foreground">Entity extraction preview would appear here.</p>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No entities detected.</p>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="timeline">
                      <div className="prose max-w-none">
                        {document.aiMetadata?.timeline ? (
                          <div>
                            {/* Could render timeline here */}
                            <p className="text-muted-foreground">Timeline visualization would appear here.</p>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No timeline data available.</p>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <InfoIcon className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">AI Analysis not available</h3>
                    <p className="text-muted-foreground max-w-md">
                      This document has not been processed by our AI analysis engine yet.
                      The document will be analyzed once processing is complete.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">File name</dt>
                    <dd className="mt-1">{document.originalFilename}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">File type</dt>
                    <dd className="mt-1">{document.mimeType}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">File size</dt>
                    <dd className="mt-1">{(parseInt(document.fileSize) / 1024 / 1024).toFixed(2)} MB</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Uploaded by</dt>
                    <dd className="mt-1">
                      {document.uploadedByUser ? document.uploadedByUser.name : "Unknown user"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Date uploaded</dt>
                    <dd className="mt-1">{format(new Date(document.createdAt), "MMMM d, yyyy 'at' h:mm a")}</dd>
                  </div>
                  {document.tags && document.tags.length > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Tags</dt>
                      <dd className="mt-1 flex flex-wrap gap-1">
                        {document.tags.map((tag: string, i: number) => (
                          <Badge variant="secondary" key={i}>{tag}</Badge>
                        ))}
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                {document.description ? (
                  <p className="text-sm">{document.description}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No description provided</p>
                )}
              </CardContent>
            </Card>
            
            <PermissionGuard area="documents" permission="delete">
              <Card className="border-destructive/20">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive" className="w-full">
                    Delete Document
                  </Button>
                </CardContent>
              </Card>
            </PermissionGuard>
          </div>
        </div>
      </div>
    </>
  );
}