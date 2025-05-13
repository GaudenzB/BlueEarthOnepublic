import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { 
  AlertTriangleIcon,
  ArrowLeftIcon, 
  FileIcon, 
  FileTextIcon, 
  Download, 
  Share2Icon, 
  ClockIcon, 
  InfoIcon,
  FileCheckIcon,
  FileX2Icon,
  LockIcon,
  BrainCircuitIcon
} from "lucide-react";
import { PermissionGuard } from "@/components/permissions/PermissionGuard";

import { useToast } from "@/hooks/use-toast";

// Create a component to handle the preview iframe with document preview token
// This is necessary because iframes don't send authentication headers by default
const PreviewIframe: React.FC<{ document: any }> = ({ document }) => {
  // State for error display if needed during preview
  const [error, setError] = React.useState<string | null>(null);
  
  // Check if we have a document with a preview token
  if (!document) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-muted-foreground">Document not loaded...</p>
      </div>
    );
  }
  
  if (!document.previewToken) {
    // If document doesn't have a preview token, fetch it or show error
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-3 max-w-md">
          <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-red-100 mb-4">
            <AlertTriangleIcon className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-medium">Preview Not Available</h3>
          <p className="text-muted-foreground">No preview token available for this document. Try refreshing the page.</p>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-muted-foreground">Loading preview...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-3 max-w-md">
          <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-red-100 mb-4">
            <AlertTriangleIcon className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-medium">Preview Error</h3>
          <p className="text-muted-foreground">{error || "Unable to load document preview"}</p>
        </div>
      </div>
    );
  }
  
  // Include the dedicated preview token as a URL parameter for the iframe
  const previewUrl = `/api/documents/${document.id}/preview?token=${encodeURIComponent(document.previewToken)}`;
  console.log("Preview URL (truncated):", previewUrl.substring(0, 50) + "...");
  
  return (
    <iframe 
      src={previewUrl}
      className="w-full h-full"
      title={document.title || "Document Preview"}
    />
  );
};

export default function DocumentDetail() {
  // Get document id from URL params
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Track previous processing status to detect changes
  const [prevStatus, setPrevStatus] = React.useState<string | null>(null);
  
  // Fetch document data with automatic polling for processing status
  const { data: documentResponse, isLoading, error } = useQuery({
    queryKey: [`/api/documents/${id}`],
    retry: false,
    enabled: !!id,
    // Add polling refresh interval if document is in a processing state
    refetchInterval: (data: any) => {
      // First extract the document from the response
      let doc = null;
      if (data) {
        if ('success' in data && data.success && data.data) {
          doc = data.data;
        } else if ('id' in data) {
          doc = data;
        }
      }
      
      // If document is in a transitional state (PENDING, PROCESSING, QUEUED), poll every 3 seconds
      if (doc && ['PENDING', 'PROCESSING', 'QUEUED'].includes(doc.processingStatus)) {
        return 3000; // Poll every 3 seconds
      }
      
      // Otherwise, don't poll
      return false;
    }
  });
  
  // Watch for changes in document status
  React.useEffect(() => {
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
        console.log("Document extracted from success response:", doc);
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
    
    // Check if status changed from a processing state to COMPLETED
    if (prevStatus && 
        ['PENDING', 'PROCESSING', 'QUEUED'].includes(prevStatus) && 
        doc.processingStatus === 'COMPLETED') {
      toast({
        title: "Document processing complete",
        description: "The document has been successfully processed with AI.",
        variant: "default" 
      });
    }
    
    // Update previous status
    setPrevStatus(doc.processingStatus);
  }, [documentResponse, prevStatus, toast]);
  
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
      toast({
        title: "Processing started",
        description: "Document processing has started. This may take a few minutes.",
      });
      
      // Invalidate document query to refresh status
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${id}`] });
    },
    onError: (error) => {
      toast({
        title: "Processing failed",
        description: "Failed to start document processing. Please try again.",
        variant: "destructive",
      });
      console.error("Error processing document:", error);
    }
  });

  // Enhanced debug logging
  console.log("Document detail request info:", {
    id: id,
    isLoading,
    hasError: !!error,
    errorMessage: error instanceof Error ? error.message : 'Unknown error',
    responseType: documentResponse ? typeof documentResponse : 'undefined',
    hasResponse: !!documentResponse,
    hasResponseSuccess: documentResponse && typeof documentResponse === 'object' && 'success' in documentResponse,
    hasResponseData: documentResponse && typeof documentResponse === 'object' && 'success' in documentResponse && 'data' in documentResponse,
    isDirectDocumentObject: documentResponse && typeof documentResponse === 'object' && 'id' in documentResponse,
    fullResponse: documentResponse
  });

  // Special handling to check the response structure and extract the document correctly
  let document = null;
  if (documentResponse) {
    // Case 1: Wrapped API response with success and data properties
    if (typeof documentResponse === 'object' && 'success' in documentResponse) {
      if (documentResponse.success && documentResponse.data) {
        document = documentResponse.data;
        console.log("Document extracted from success/data wrapper:", {
          id: document.id,
          title: document.title || document.originalFilename,
          processingStatus: document.processingStatus,
          documentType: document.documentType,
          uploadedBy: document.uploadedBy,
          uploadedByUser: document.uploadedByUser
        });
      } else {
        console.warn("Response has success/data format but couldn't extract document:", {
          success: documentResponse.success,
          hasData: 'data' in documentResponse,
          dataType: 'data' in documentResponse ? typeof documentResponse.data : 'missing',
          message: documentResponse.message || 'No message provided'
        });
      }
    }
    // Case 2: Direct document object (the API returned the document directly)
    else if (typeof documentResponse === 'object' && 'id' in documentResponse) {
      document = documentResponse;
      console.log("Document from direct object:", {
        id: document.id,
        title: document.title || document.originalFilename,
        processingStatus: document.processingStatus,
        documentType: document.documentType
      });
    } else {
      console.warn("Unknown response format:", documentResponse);
    }
  } else if (error) {
    console.error("Error fetching document:", error);
  }

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
                    <PreviewIframe document={document} />
                  </div>
                ) : (
                  <div className="border rounded-md aspect-[16/10] bg-muted flex flex-col items-center justify-center p-4">
                    <FileTextIcon className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Document processing</h3>
                    
                    {document.processingStatus === "PROCESSING" && (
                      <div className="text-center space-y-3 max-w-md">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-4">
                          <div className="bg-blue-600 h-2.5 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                        </div>
                        <p className="text-muted-foreground">
                          Your document is currently being processed with AI. This might take a few minutes.
                        </p>
                      </div>
                    )}
                    
                    {document.processingStatus === "PENDING" && (
                      <div className="text-center space-y-3 max-w-md">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-4">
                          <div className="bg-blue-600 h-2.5 rounded-full w-1/4 animate-pulse"></div>
                        </div>
                        <p className="text-muted-foreground">
                          Your document is now in the queue for AI processing. This process will begin shortly and may take a few minutes to complete.
                        </p>
                        <div className="flex justify-center mt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2" 
                            onClick={() => processDocumentMutation.mutate()}
                            disabled={processDocumentMutation.isPending}
                          >
                            <BrainCircuitIcon className="h-4 w-4" />
                            {processDocumentMutation.isPending ? 'Starting...' : 'Retry Processing Now'}
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {document.processingStatus === "QUEUED" && (
                      <div className="text-center space-y-3 max-w-md">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-4">
                          <div className="bg-blue-600 h-2.5 rounded-full w-1/3 animate-pulse"></div>
                        </div>
                        <p className="text-muted-foreground">
                          Your document is queued for processing. It will be processed shortly.
                        </p>
                      </div>
                    )}
                    
                    {(document.processingStatus === "FAILED" || document.processingStatus === "ERROR") && (
                      <div className="text-center space-y-3 max-w-md">
                        <p className="text-red-500 mb-2">
                          There was an error processing this document.
                        </p>
                        <div className="flex justify-center">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2" 
                            onClick={() => processDocumentMutation.mutate()}
                            disabled={processDocumentMutation.isPending}
                          >
                            <BrainCircuitIcon className="h-4 w-4" />
                            Try Again
                          </Button>
                        </div>
                      </div>
                    )}
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
                        {document.aiMetadata?.summary ? (
                          <div className="whitespace-pre-wrap">{document.aiMetadata.summary}</div>
                        ) : (
                          <p className="text-muted-foreground">No summary available.</p>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="entities">
                      <div className="prose max-w-none">
                        {document.aiMetadata?.entities ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Array.isArray(document.aiMetadata.entities) ? (
                              document.aiMetadata.entities.map((entity: any, idx: number) => (
                                <div key={idx} className="border rounded-md p-3 bg-muted/30">
                                  <p className="font-medium">{entity.name || entity.type || 'Entity'}</p>
                                  {entity.description && <p className="text-sm">{entity.description}</p>}
                                </div>
                              ))
                            ) : typeof document.aiMetadata.entities === 'object' ? (
                              Object.entries(document.aiMetadata.entities).map(([key, value]: [string, any], idx: number) => (
                                <div key={idx} className="border rounded-md p-3 bg-muted/30">
                                  <p className="font-medium">{key}</p>
                                  <p className="text-sm">{JSON.stringify(value)}</p>
                                </div>
                              ))
                            ) : (
                              <p className="text-muted-foreground">Entity data format not recognized.</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No entities detected.</p>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="timeline">
                      <div className="prose max-w-none">
                        {document.aiMetadata?.timeline ? (
                          <div className="space-y-4">
                            {Array.isArray(document.aiMetadata.timeline) ? (
                              document.aiMetadata.timeline.map((item: any, idx: number) => (
                                <div key={idx} className="border-l-2 border-primary pl-4 py-1">
                                  <p className="font-medium">{item.date || item.title || `Event ${idx+1}`}</p>
                                  {item.description && <p className="text-sm">{item.description}</p>}
                                </div>
                              ))
                            ) : typeof document.aiMetadata.timeline === 'object' ? (
                              <div className="whitespace-pre-wrap">
                                {JSON.stringify(document.aiMetadata.timeline, null, 2)}
                              </div>
                            ) : (
                              <p className="text-muted-foreground">Timeline format not recognized.</p>
                            )}
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
                      {document.uploadedByUser ? 
                        (document.uploadedByUser.name || document.uploadedByUser.username) : 
                        "Unknown user"}
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