import React, { useState } from 'react';
import { Link } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import AssignOrCreateForm from '../components/AssignOrCreateForm';

interface AnalysisResult {
  id: string;
  vendor: string | null;
  contractTitle: string | null;
  docType: string | null;
  effectiveDate: string | null;
  terminationDate: string | null;
  confidence: Record<string, number>;
  suggestedContractId?: string;
  documentId?: string;
}

export default function ContractUploadFlow() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedDocumentId, setUploadedDocumentId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
      } else {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF file.',
          variant: 'destructive'
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
      } else {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF file.',
          variant: 'destructive'
        });
      }
    }
  };

  const uploadFile = async () => {
    if (!file) return;

    setIsUploading(true);
    
    try {
      // First upload the document to get a document ID
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      formData.append('documentType', 'CONTRACT');
      
      // Use correct API endpoint at /api/documents
      const uploadResult = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type here, let the browser set it with the boundary for FormData
        headers: {
          // Ensure we accept JSON response
          'Accept': 'application/json'
        }
      });
      
      // Check if response is OK before trying to parse JSON
      if (!uploadResult.ok) {
        // Handle non-JSON responses safely
        let errorMessage = 'Failed to upload document';
        try {
          const contentType = uploadResult.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await uploadResult.json();
            errorMessage = errorData.message || errorMessage;
          } else {
            // For non-JSON responses, just get the status text
            errorMessage = `${uploadResult.status}: ${uploadResult.statusText}`;
          }
        } catch (parseError) {
          errorMessage = `Server error (${uploadResult.status})`;
        }
        throw new Error(errorMessage);
      }
      
      // Parse the JSON response
      const responseData = await uploadResult.json();
      const documentId = responseData.data.id;
      
      if (!documentId) {
        throw new Error('Document ID not returned from server');
      }
      
      setUploadedDocumentId(documentId);
      
      // Now analyze the document
      setIsUploading(false);
      setIsAnalyzing(true);
      
      try {
        console.log(`Sending analysis request for document ID: ${documentId}`);
        
        // Use fetch directly so we can handle raw response data if there's an error
        const response = await fetch(`/api/contracts/upload/analyze/${documentId}`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`Analysis response status: ${response.status} ${response.statusText}`);
        
        // If the response is not OK (status 200-299), handle the error
        if (!response.ok) {
          // Try to get the raw response text first for better diagnostics
          const errorText = await response.text();
          console.error("Server raw error response:", errorText);
          
          // Log the full response for debugging
          console.error("Response details:", {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries([...response.headers.entries()]),
            url: response.url,
            type: response.type,
            redirected: response.redirected
          });
          
          // Try to parse as JSON if possible
          let errorMessage = `Server error: ${response.status} ${response.statusText}`;
          let errorDetails = '';
          
          try {
            // Check if the response is valid JSON
            const isJson = errorText.trim().startsWith('{') && errorText.trim().endsWith('}');
            if (isJson) {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.message || errorData.error || errorMessage;
              errorDetails = errorData.details || '';
              console.error("Parsed error response:", errorData);
            }
          } catch (jsonError) {
            console.error("Failed to parse error response as JSON:", jsonError);
            // Keep the original error message from response.statusText
          }
          
          throw new Error(`Analysis failed: ${errorMessage} ${errorDetails}`);
        }
        
        // Parse the successful JSON response
        const analysisResponse = await response.json();
        
        if (!analysisResponse.success) {
          throw new Error(analysisResponse.message || 'Failed to analyze document');
        }
        
        setAnalysisResult(analysisResponse.data);
        setIsAnalyzing(false);
        
      } catch (analysisError) {
        console.error('Analysis error:', analysisError);
        setIsAnalyzing(false);
        
        // Show detailed error message to user
        toast({
          title: 'Analysis failed',
          description: analysisError instanceof Error 
            ? analysisError.message 
            : 'Unable to analyze document. Please try again.',
          variant: 'destructive'
        });
        
        // Reset to upload state so user can try again
        setUploadedDocumentId(null);
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      setIsAnalyzing(false);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFile(null);
    setUploadedDocumentId(null);
    setAnalysisResult(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 pt-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Upload & Analyze Contract</h1>
        <Link href="/contracts">
          <Button variant="outline">Back to Contracts</Button>
        </Link>
      </div>

      {!analysisResult ? (
        <Card>
          <CardHeader>
            <CardTitle>Upload Contract Document</CardTitle>
            <CardDescription>
              Upload a contract document to automatically extract key information and create or link to a contract.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className={`border-2 border-dashed rounded-lg p-12 text-center ${
                isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'
              } transition-colors`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="flex flex-col items-center">
                  <FileText size={48} className="text-primary mb-4" />
                  <p className="text-lg font-medium mb-1">{file.name}</p>
                  <p className="text-sm text-gray-500 mb-4">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setFile(null)}
                    disabled={isUploading || isAnalyzing}
                  >
                    Change File
                  </Button>
                </div>
              ) : (
                <>
                  <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-lg mb-2">Drag and drop your PDF here, or</p>
                  <div>
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <div className="bg-primary text-primary-foreground px-4 py-2 rounded-md inline-block">
                        Browse Files
                      </div>
                      <Input
                        id="file-upload"
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </Label>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">Supported format: PDF</p>
                </>
              )}
            </div>

            {isUploading && (
              <div className="mt-4 flex items-center justify-center space-x-2 text-primary">
                <Loader2 className="animate-spin" />
                <span>Uploading document...</span>
              </div>
            )}

            {isAnalyzing && (
              <div className="mt-4 flex items-center justify-center space-x-2 text-primary">
                <Loader2 className="animate-spin" />
                <span>Analyzing document with AI...</span>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              onClick={uploadFile} 
              disabled={!file || isUploading || isAnalyzing}
            >
              {isUploading ? 'Uploading...' : isAnalyzing ? 'Analyzing...' : 'Upload & Analyze'}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <AssignOrCreateForm 
          analysisResult={analysisResult} 
          documentId={uploadedDocumentId || ''} 
          onReset={resetForm}
        />
      )}
    </div>
  );
}