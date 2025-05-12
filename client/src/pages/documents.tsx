import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DocumentList from "@/components/documents/DocumentList";
import DocumentUpload from "@/components/documents/DocumentUpload";
import { documentTypeEnum } from "@shared/schema/documents/documents";
import { PlusIcon, FolderIcon, ClockIcon, FileTextIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { PermissionGuard } from "@/components/permissions/PermissionGuard";

export default function Documents() {
  const [activeTab, setActiveTab] = useState("all");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: documentsResponse, isLoading, refetch, error } = useQuery({
    queryKey: ['/api/documents'],
    retry: false,
    // Enable some console logging for debugging
    onSuccess: (data) => {
      console.log('Documents query succeeded:', {
        dataExists: !!data,
        response: data,
        isWrappedFormat: !!(data && 'success' in data && 'data' in data),
        documentCount: data && 'data' in data && Array.isArray(data.data) ? data.data.length : 0
      });
    },
    onError: (err) => {
      console.error('Documents query failed:', err);
    }
  });
  
  // Extract the documents array from the response
  // The API returns { success: true, data: [...documents], pagination: {...} }
  const documents = React.useMemo(() => {
    if (!documentsResponse) return [];
    
    // Check if response has the expected structure
    if (documentsResponse && 'success' in documentsResponse && 'data' in documentsResponse) {
      // This is the standard API response format
      return documentsResponse.data || [];
    }
    
    // If it's already an array, return it directly (fall back for direct array responses)
    if (Array.isArray(documentsResponse)) {
      return documentsResponse;
    }
    
    // Default case: we couldn't find documents
    console.warn('Unexpected document response format:', documentsResponse);
    return [];
  }, [documentsResponse]);

  const handleUploadSuccess = () => {
    toast({
      title: "Document uploaded successfully",
      description: "Your document has been uploaded and is being processed.",
    });
    refetch();
    setIsUploadModalOpen(false);
  };

  const handleFilterChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <>
      <Helmet>
        <title>Documents | BlueEarth Capital</title>
        <meta name="description" content="Document management for BlueEarth Capital. View, upload, and manage company documents securely." />
      </Helmet>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">View and manage company documents</p>
        </div>
        <PermissionGuard area="documents" permission="edit">
          <Button 
            onClick={() => setIsUploadModalOpen(true)} 
            className="flex items-center gap-2"
          >
            <PlusIcon size={16} />
            Upload Document
          </Button>
        </PermissionGuard>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Document Overview</CardTitle>
          <CardDescription>
            Access all company documents from a central location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={handleFilterChange}>
            <TabsList className="mb-4">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <FolderIcon size={16} />
                All Documents
              </TabsTrigger>
              <TabsTrigger value="recent" className="flex items-center gap-2">
                <ClockIcon size={16} />
                Recent
              </TabsTrigger>
              <TabsTrigger value="contracts" className="flex items-center gap-2">
                <FileTextIcon size={16} />
                Contracts
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <DocumentList 
                documents={documents} 
                isLoading={isLoading} 
                filter="all"
              />
              {documentsResponse && (
                <div className="p-4 bg-muted/20 rounded-md mt-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Debug Info: Found {documents.length} documents.
                    Response format: {Array.isArray(documentsResponse) ? 'Direct array' : 
                      ('success' in documentsResponse) ? 'API standard format' : 'Unknown'}
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="recent">
              <DocumentList 
                documents={documents} 
                isLoading={isLoading} 
                filter="recent"
              />
            </TabsContent>
            
            <TabsContent value="contracts">
              <DocumentList 
                documents={documents} 
                isLoading={isLoading} 
                filter="CONTRACT"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <DocumentUpload 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </>
  );
}