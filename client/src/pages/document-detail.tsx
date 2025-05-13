import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
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
import { ArrowLeftIcon, FileCheckIcon, ClockIcon, MoreHorizontalIcon, TrashIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileTextIcon } from "lucide-react";
import { Download } from "lucide-react";
import { Share2Icon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { InfoIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { LockIcon } from "lucide-react";
import { BrainCircuitIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { PermissionGuard } from "@/components/permission-guard";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

// Helper function for typescript
const createToast = (toast: any, props: any) => {
  if (typeof toast === 'function') {
    return toast(props);
  } else if (toast && typeof toast.toast === 'function') {
    return toast.toast(props);
  }
  console.error('Toast function not available');
  return null;
};

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const [selectedTab, setSelectedTab] = React.useState("details");
  const toast = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  // States
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [prevStatus, setPrevStatus] = React.useState<string | null>(null); // Track previous processing status
  
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
  
  if (isLoading) {
    return <DocumentDetailSkeleton />;
  }
  
  if (error) {
    console.error("Error loading document:", error);
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Error Loading Document</h1>
        <p>There was a problem loading the document. Please try again later.</p>
        <pre className="mt-4 p-4 bg-gray-100 rounded-md overflow-auto">
          {error instanceof Error ? error.message : "Unknown error"}
        </pre>
      </div>
    );
  }
  
  // Extract document data regardless of response format
  const document = documentResponse?.data || documentResponse;
  
  if (!document) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Document Not Found</h1>
        <p>The requested document could not be found.</p>
        <Button asChild className="mt-4">
          <Link href="/documents">Back to Documents</Link>
        </Button>
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
        return <Badge variant="success" className="gap-1 px-2"><FileCheckIcon className="h-3 w-3" /> Processed</Badge>;
      case "PROCESSING":
        return <Badge variant="warning" className="gap-1 px-2"><ClockIcon className="h-3 w-3" /> Processing</Badge>;
      case "PENDING":
      case "QUEUED":
        return <Badge variant="outline" className="gap-1 px-2"><ClockIcon className="h-3 w-3" /> Pending</Badge>;
      case "FAILED":
        return <Badge variant="destructive" className="gap-1 px-2">Failed</Badge>;
      default:
        return <Badge variant="outline" className="gap-1 px-2">Unknown</Badge>;
    }
  };
  
  // Check if document has AI processing completed
  const isProcessed = document.processingStatus === "COMPLETED";
  const hasInsights = isProcessed && document.aiMetadata && Object.keys(document.aiMetadata).length > 0;
  
  return (
    <>
      <Helmet>
        <title>{document.title || "Document"} | BlueEarth Portal</title>
        <meta name="description" content={`View details and insights for ${document.title || "document"}`} />
      </Helmet>
      
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link href="/documents">
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{document.title}</h1>
            <p className="text-sm text-muted-foreground">
              {document.documentType} • Last updated {format(new Date(document.updatedAt), "MMMM d, yyyy")}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Document actions */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" asChild className="h-9 w-9">
                    <a href={`/api/documents/${document.id}/download`} download>
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download</span>
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download document</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <MoreHorizontalIcon className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleProcessDocument} disabled={processDocumentMutation.isPending}>
                  <BrainCircuitIcon className="mr-2 h-4 w-4" />
                  <span>Process with AI</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ShareIcon className="mr-2 h-4 w-4" />
                  <span>Share document</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileCheckIcon className="mr-2 h-4 w-4" />
                  <span>View version history</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <Tabs defaultValue="details" value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="insights" disabled={!hasInsights}>AI Insights</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Document Overview
                    {getStatusBadge(document.processingStatus)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Debug document processing status */}
                  {console.log("Document Processing Status Check:", {
                    status: document.processingStatus,
                    isCompleted: document.processingStatus === "COMPLETED",
                    aiProcessed: document.aiProcessed,
                    hasAiMetadata: !!document.aiMetadata
                  })}

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                      <p>{document.description || "No description provided."}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Document Type</h3>
                      <p>{document.documentType}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">File Information</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Filename</p>
                          <p className="text-sm">{document.filename}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Size</p>
                          <p className="text-sm">{formatFileSize(document.fileSize)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Uploaded By</p>
                          <p className="text-sm">{document.uploadedByUser?.name || "Unknown"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Upload Date</p>
                          <p className="text-sm">{format(new Date(document.createdAt), "MMM d, yyyy")}</p>
                        </div>
                      </div>
                    </div>
                    
                    {!isProcessed && (
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-sm text-muted-foreground">
                          {document.processingStatus === "PROCESSING" || document.processingStatus === "PENDING" || document.processingStatus === "QUEUED" ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <span>{getProcessingStatusText(document.processingStatus)}</span>
                                <Progress value={getProcessingProgress(document.processingStatus)} className="w-24 h-2" />
                              </div>
                              <span className="text-xs italic">This may take up to a minute for large documents</span>
                            </div>
                          ) : (
                            "Document not yet processed with AI"
                          )}
                        </span>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => refetch()}
                            variant="outline"
                            size="sm"
                          >
                            <ArrowLeftIcon className="mr-2 h-4 w-4 rotate-90" />
                            Refresh Status
                          </Button>
                          <Button 
                            onClick={handleProcessDocument}
                            disabled={document.processingStatus === "PROCESSING" || processDocumentMutation.isPending}
                            size="sm"
                          >
                            <BrainCircuitIcon className="mr-2 h-4 w-4" />
                            Process Document
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Document Properties</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Document ID</span>
                          <span className="text-sm font-mono">{document.id.slice(0, 8)}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Format</span>
                          <span className="text-sm">{getFileExtension(document.filename)?.toUpperCase()}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Storage Location</span>
                          <span className="text-sm">{document.storageLocation || "S3"}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Encryption</span>
                          <span className="text-sm">AES-256</span>
                        </div>
                      </div>
                    </div>
                    
                    {document.tags && document.tags.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Tags</h3>
                        <div className="flex flex-wrap gap-1">
                          {document.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {isProcessed && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">AI Processing</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Processed</span>
                            <span className="text-sm">{format(new Date(document.processingCompletedAt || document.updatedAt), "MMM d, yyyy")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Model</span>
                            <span className="text-sm">{document.aiMetadata?.model || "GPT-4o"}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {isProcessed && hasInsights && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Key Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {document.aiMetadata?.summary && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Summary</h3>
                        <p className="text-sm">{document.aiMetadata.summary}</p>
                      </div>
                    )}
                    
                    {document.aiMetadata?.keywords && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Keywords</h3>
                        <div className="flex flex-wrap gap-1">
                          {document.aiMetadata.keywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="preview">
            <Card>
              <CardContent className="p-4 h-[700px]">
                <div className="flex flex-col items-center justify-center h-full">
                  <FileTextIcon className="h-20 w-20 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Document Preview</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-4">
                    The document preview is currently unavailable.
                  </p>
                  <Button asChild variant="outline">
                    <a href={`/api/documents/${document.id}/download`} download>
                      <Download className="mr-2 h-4 w-4" />
                      Download Document
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="insights">
            {hasInsights ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Document Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium">Summary</h3>
                        <p className="mt-2">{document.aiMetadata?.summary || "No summary available."}</p>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-lg font-medium">Key Points</h3>
                        <ul className="mt-2 space-y-2 list-disc list-inside">
                          {document.aiMetadata?.keyPoints?.map((point, index) => (
                            <li key={index}>{point}</li>
                          )) || <li>No key points identified.</li>}
                        </ul>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-lg font-medium">Entities</h3>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {document.aiMetadata?.entities?.map((entity, index) => (
                            <div key={index} className="border rounded-md p-3">
                              <div className="font-medium">{entity.name}</div>
                              <div className="text-sm text-muted-foreground">{entity.type}</div>
                              {entity.context && <div className="text-sm mt-1">{entity.context}</div>}
                            </div>
                          )) || <div>No entities detected.</div>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {document.aiMetadata?.topics && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Topics & Themes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {document.aiMetadata.topics.map((topic, index) => (
                          <div key={index} className="border rounded-md p-3">
                            <div className="font-medium">{topic.name}</div>
                            <div className="text-sm mt-1">{topic.description}</div>
                            {topic.relevance && (
                              <div className="mt-2">
                                <div className="text-xs text-muted-foreground mb-1">Relevance</div>
                                <Progress value={topic.relevance * 100} className="h-1.5" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {document.aiMetadata?.sentiment && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Sentiment Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium">Overall Sentiment</h3>
                          <div className="mt-2 flex items-center">
                            <div className="mr-2 font-medium">
                              {document.aiMetadata.sentiment.overall === "positive" && "Positive 😊"}
                              {document.aiMetadata.sentiment.overall === "negative" && "Negative 😔"}
                              {document.aiMetadata.sentiment.overall === "neutral" && "Neutral 😐"}
                              {document.aiMetadata.sentiment.overall === "mixed" && "Mixed 🤔"}
                            </div>
                            {document.aiMetadata.sentiment.score && (
                              <Progress 
                                value={mapSentimentToProgress(document.aiMetadata.sentiment.score)} 
                                className="w-32 h-2"
                              />
                            )}
                          </div>
                          <p className="text-sm mt-1">{document.aiMetadata.sentiment.analysis || ""}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BrainCircuitIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No AI insights available</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-4">
                    This document hasn't been processed with AI yet, or processing did not generate any insights.
                  </p>
                  <Button onClick={handleProcessDocument} disabled={processDocumentMutation.isPending}>
                    <BrainCircuitIcon className="mr-2 h-4 w-4" />
                    Process Document
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Document History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pl-6 border-l">
                  <TimelineItem
                    title="Document created"
                    description={`Uploaded by ${document.uploadedByUser?.name || 'Unknown'}`}
                    date={format(new Date(document.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                    icon={<FileTextIcon className="h-4 w-4" />}
                  />
                  
                  {document.processingStatus === "COMPLETED" && (
                    <TimelineItem
                      title="Document processed"
                      description="Document analyzed with AI"
                      date={format(new Date(document.processingCompletedAt || document.updatedAt), "MMMM d, yyyy 'at' h:mm a")}
                      icon={<BrainCircuitIcon className="h-4 w-4" />}
                    />
                  )}
                  
                  {/* You would add more timeline items here based on document history */}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

// Helper function to format file size in KB/MB/GB
function formatFileSize(sizeInBytes: number | undefined): string {
  if (!sizeInBytes) return "Unknown";
  
  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;
  
  if (sizeInBytes < KB) {
    return `${sizeInBytes} B`;
  } else if (sizeInBytes < MB) {
    return `${(sizeInBytes / KB).toFixed(2)} KB`;
  } else if (sizeInBytes < GB) {
    return `${(sizeInBytes / MB).toFixed(2)} MB`;
  } else {
    return `${(sizeInBytes / GB).toFixed(2)} GB`;
  }
}

// Helper function to extract file extension
function getFileExtension(filename: string | undefined): string | undefined {
  if (!filename) return undefined;
  return filename.split('.').pop()?.toLowerCase();
}

// Helper function to map sentiment score to progress component
function mapSentimentToProgress(score: number): number {
  // Scale from -1 to 1 into 0-100 range
  return (score + 1) * 50;
}

// Timeline item component
function TimelineItem({ title, description, date, icon }: { 
  title: string; 
  description: string; 
  date: string; 
  icon: React.ReactNode;
}) {
  return (
    <div className="mb-8 relative">
      <div className="absolute -left-10 p-2 bg-background border rounded-full flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground mt-1">{date}</p>
      </div>
    </div>
  );
}

// Helper component for sharing icon
function ShareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

// Loading skeleton
function DocumentDetailSkeleton() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-8 w-8 rounded-md" />
        <div className="flex-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40 mt-2" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>
      
      <div className="mb-4">
        <Skeleton className="h-10 w-64" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-64 md:col-span-2" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}