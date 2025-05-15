import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FileOutlined, UploadOutlined, CloseOutlined, LoadingOutlined, CheckCircleOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { queryClient } from "@/lib/queryClient";
import { Progress } from "antd";

interface DocumentUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Document upload schema with validation
const documentUploadSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(255, "Title cannot exceed 255 characters"),
  documentType: z.string().optional(),
  description: z.string().optional(),
  tags: z.string().optional(),
  file: z.instanceof(File, { message: "Please select a file" }),
  isConfidential: z.boolean().default(false),
});

type DocumentUploadFormValues = z.infer<typeof documentUploadSchema>;

export default function DocumentUpload({ isOpen, onClose, onSuccess }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<'idle' | 'uploading' | 'processing' | 'complete' | 'error'>('idle');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  // Initialize form with react-hook-form and zod validation
  const form = useForm<DocumentUploadFormValues>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {
      title: "",
      documentType: "OTHER",
      description: "",
      tags: "",
      isConfidential: false,
    },
  });

  // Reset states when dialog closes
  useEffect(() => {
    if (!isOpen) {
      // Reset progress state when dialog is closed
      setUploadProgress(0);
      setUploadStage('idle');
      setErrorDetails(null);
      
      // Abort any in-progress uploads
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }
  }, [isOpen]);

  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const validateAndSetFile = (file: File | undefined) => {
    if (!file) return false;
    // File size validation (20MB max)
    const maxSizeInBytes = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSizeInBytes) {
      toast({
        title: "File too large",
        description: "Maximum file size is 20MB",
        variant: "destructive"
      });
      return false;
    }
    
    // Set the file in the form
    setSelectedFile(file);
    form.setValue("file", file);
    
    // If title is empty, use filename as default title
    if (!form.getValues("title")) {
      const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      form.setValue("title", fileName);
    }
    
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file) {
        validateAndSetFile(file);
      }
    }
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file) {
        validateAndSetFile(file);
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    form.setValue("file", undefined as any);
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const onSubmit = async (data: DocumentUploadFormValues) => {
    try {
      setIsUploading(true);
      setUploadStage('uploading');
      setUploadProgress(0);
      setErrorDetails(null);
      
      // Create FormData object to send file and metadata
      const formData = new FormData();
      formData.append("file", data.file);
      formData.append("title", data.title);
      
      if (data.documentType) {
        formData.append("documentType", data.documentType);
      }
      
      if (data.description) {
        formData.append("description", data.description);
      }
      
      if (data.tags) {
        // Split tags by comma and trim whitespace
        const tagsArray = data.tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0);
        formData.append("tags", JSON.stringify(tagsArray));
      }
      
      formData.append("isConfidential", String(data.isConfidential));
      
      // No need to get token from localStorage
      // Authentication is now handled by HTTP-only cookies that are automatically sent
      // We'll log authentication status for debugging
      
      // Add CSRF token if available (often stored in meta tag)
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      if (csrfToken) {
        formData.append("_csrf", csrfToken);
      }
      
      // Create new XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      // Create AbortController for cancellation support
      abortControllerRef.current = new AbortController();
      
      // Set up upload progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
          
          // When upload reaches 100%, move to processing stage
          if (percentComplete >= 100) {
            setUploadStage('processing');
          }
        }
      });
      
      // Wrap XHR in a promise for async/await support
      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.open('POST', '/api/documents', true);
        
        // No need to set auth headers manually - session cookies will be sent automatically
        // Log authentication attempt
        console.log('Authentication status:', {
          isAuthenticated: document.cookie.includes('accessToken'),
          cookies: document.cookie ? 'Present' : 'None'
        });
        
        // Add debug logging to console
        console.log('Starting document upload...', {
          fileName: data.file.name,
          fileSize: data.file.size,
          fileType: data.file.type
        });
        
        xhr.withCredentials = true; // Include cookies for session-based auth
        
        // Handle response 
        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch (e) {
              reject(new Error('Invalid response from server'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              
              // Handle field validation errors
              if (errorData.fieldErrors) {
                // Set field errors in the form
                const fieldErrors: Record<string, string> = {};
                
                // Extract the first error message for each field
                Object.entries(errorData.fieldErrors).forEach(([field, error]: [string, any]) => {
                  if (error && error._errors && error._errors.length > 0) {
                    fieldErrors[field] = error._errors[0];
                  }
                });
                
                // Set errors in the form
                Object.entries(fieldErrors).forEach(([field, message]) => {
                  form.setError(field as any, { 
                    type: 'server', 
                    message 
                  });
                });
                
                reject(new Error(errorData.message || "Please fix the validation errors"));
              } else {
                // General error
                reject(new Error(errorData.message || `Upload failed with status ${xhr.status}`));
              }
            } catch (e) {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };
        
        // Handle network errors
        xhr.onerror = function() {
          console.error("Network error during upload");
          reject(new Error('Network error occurred during upload'));
        };
        
        // Handle abort
        xhr.upload.onabort = function() {
          console.log("Upload was aborted");
          reject(new Error('Upload was cancelled'));
        };
        
        // Add additional handlers to help debug
        xhr.upload.onerror = function(e) {
          console.error("Error during upload process:", e);
        };
        
        xhr.timeout = 120000; // 2 minute timeout
        xhr.ontimeout = function() {
          console.error("Upload timed out");
          reject(new Error('Upload timed out after 2 minutes'));
        };
        
        // Connect abort controller to XHR
        if (abortControllerRef.current) {
          abortControllerRef.current.signal.addEventListener('abort', () => {
            xhr.abort();
          });
        }
        
        // Log right before sending
        console.log("About to send FormData", {
          formDataHasFile: formData.has('file'),
          usingCookieAuth: true
        });
        
        // Send the request with FormData
        xhr.send(formData);
      });
      
      // Define the success handler function
      const handleSuccess = (responseData: any) => {
        // Set success state
        setUploadStage('complete');
        setUploadProgress(100);
        
        // Show success message
        toast({
          title: "Upload successful",
          description: "Your document was uploaded successfully.",
          variant: "default",
        });
        
        // Invalidate documents query to refresh the list
        queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
        
        // Call success callback after a short delay to show the success state
        setTimeout(() => {
          onSuccess();
          
          // Reset form
          form.reset();
          setSelectedFile(null);
          if (fileRef.current) {
            fileRef.current.value = "";
          }
        }, 1000);
        
        return responseData;
      };

      try {
        // Debug any authentication issues
        console.log('Authentication status:', { 
          isAuthenticated: !!localStorage.getItem('authToken') || !!localStorage.getItem('token'),
          tokenExists: !!token,
          sessionCookies: document.cookie.includes('connect.sid')
        });
        
        // First try with XMLHttpRequest for better progress reporting
        try {
          // Await the upload to complete with a timeout
          const uploadPromiseWithTimeout = Promise.race([
            uploadPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Upload timed out after 2 minutes')), 120000)
            )
          ]);
          
          // Wait for the upload to complete
          const responseData = await uploadPromiseWithTimeout;
          console.log('XMLHttpRequest upload completed successfully');
          return handleSuccess(responseData);
        } catch (xhrError) {
          // If XHR upload fails, try with fetch API as fallback
          console.log('XMLHttpRequest upload failed, trying with fetch API instead:', xhrError);
          
          setUploadProgress(0);
          
          // Create a new FormData object for fetch
          const fetchFormData = new FormData();
          fetchFormData.append("file", data.file);
          fetchFormData.append("title", data.title);
          
          if (data.documentType) {
            fetchFormData.append("documentType", data.documentType);
          }
          
          if (data.description) {
            fetchFormData.append("description", data.description);
          }
          
          if (data.tags) {
            const tagsArray = data.tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0);
            fetchFormData.append("tags", JSON.stringify(tagsArray));
          }
          
          fetchFormData.append("isConfidential", String(data.isConfidential));
          
          // Try with fetch API
          console.log('Attempting fetch API upload...');
          const headers: HeadersInit = {};
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          const response = await fetch('/api/documents', {
            method: 'POST',
            body: fetchFormData,
            credentials: 'include',
            headers
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Upload failed with status ${response.status}`);
          }
          
          const responseData = await response.json();
          console.log('Fetch API upload completed successfully');
          return handleSuccess(responseData);
        }
      } catch (timeoutError) {
        console.error('Upload timeout or race condition error:', timeoutError);
        setUploadStage('error');
        setErrorDetails(timeoutError.message || "The upload process timed out");
        
        toast({
          title: "Upload failed",
          description: "The upload process timed out or was interrupted.",
          variant: "destructive",
        });
      }
      
    } catch (error: any) {
      // Set error state
      setUploadStage('error');
      setErrorDetails(error.message || "An unknown error occurred");
      
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading your document",
        variant: "destructive",
      });
    } finally {
      // Only clear uploading state, keep the progress/state visible for feedback
      setTimeout(() => {
        setIsUploading(false);
      }, 500);
      
      // Clear the AbortController reference
      abortControllerRef.current = null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a document to the system. All files are securely stored and encrypted.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter document title" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="documentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value || "OTHER"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CONTRACT">Contract</SelectItem>
                          <SelectItem value="AGREEMENT">Agreement</SelectItem>
                          <SelectItem value="POLICY">Policy</SelectItem>
                          <SelectItem value="REPORT">Report</SelectItem>
                          <SelectItem value="PRESENTATION">Presentation</SelectItem>
                          <SelectItem value="CORRESPONDENCE">Correspondence</SelectItem>
                          <SelectItem value="INVOICE">Invoice</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter tags separated by commas" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        e.g. finance, q2, budget
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isConfidential"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Confidential Document</FormLabel>
                        <FormDescription>
                          Restrict access to authorized personnel only
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Upload File</FormLabel>
                      <FormControl>
                        <div 
                          className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer h-[212px] transition-all ${
                            isDragging 
                              ? "border-primary bg-primary/10 scale-[1.01] shadow-md" 
                              : "border-input"
                          } ${selectedFile ? "border-success bg-success/5" : ""}`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => fileRef.current?.click()}
                        >
                          <input
                            type="file"
                            ref={fileRef}
                            className="hidden"
                            onChange={handleFileSelection}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg"
                            {...field}
                          />

                          {selectedFile ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="bg-muted p-2 rounded-full">
                                <FileOutlined style={{ fontSize: '24px' }} />
                              </div>
                              <div className="text-center">
                                <p className="font-medium truncate max-w-[180px]">{selectedFile.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFile();
                                }}
                              >
                                <CloseOutlined style={{ fontSize: '16px', marginRight: '4px' }} /> Remove
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="bg-muted p-2 rounded-full mb-3">
                                <UploadOutlined style={{ fontSize: '24px' }} />
                              </div>
                              <p className="text-sm font-medium mb-1">Drag & drop file here</p>
                              <p className="text-xs text-muted-foreground mb-3">
                                Or click to browse files
                              </p>
                              <p className="text-xs text-muted-foreground text-center">
                                Supported formats: PDF, Word, Excel, PowerPoint, 
                                <br />Text files, CSV, PNG, JPG
                              </p>
                            </>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter a brief description of this document" 
                          {...field}
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Progress Indicator */}
            {(isUploading || uploadStage === 'processing' || uploadStage === 'complete' || uploadStage === 'error') && (
              <div className="my-4 px-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {uploadStage === 'uploading' && 'Uploading document...'}
                    {uploadStage === 'processing' && 'Processing document...'}
                    {uploadStage === 'complete' && 'Upload complete!'}
                    {uploadStage === 'error' && 'Upload failed'}
                  </span>
                  <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                </div>
                
                <Progress 
                  percent={uploadProgress} 
                  status={
                    uploadStage === 'error' ? 'exception' :
                    uploadStage === 'complete' ? 'success' : 'active'
                  } 
                  strokeColor={
                    uploadStage === 'uploading' ? '#1677ff' :
                    uploadStage === 'processing' ? '#faad14' :
                    uploadStage === 'complete' ? '#52c41a' : '#ff4d4f'
                  }
                />
                
                {uploadStage === 'processing' && (
                  <div className="flex items-center mt-2 text-sm text-amber-600">
                    <InfoCircleOutlined style={{ marginRight: '8px' }} />
                    <span>AI processing may take a few moments...</span>
                  </div>
                )}
                
                {uploadStage === 'complete' && (
                  <div className="flex items-center mt-2 text-sm text-green-600">
                    <CheckCircleOutlined style={{ marginRight: '8px' }} />
                    <span>Document uploaded and processed successfully!</span>
                  </div>
                )}
                
                {uploadStage === 'error' && errorDetails && (
                  <div className="flex items-center mt-2 text-sm text-red-600">
                    <InfoCircleOutlined style={{ marginRight: '8px' }} />
                    <span>{errorDetails}</span>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isUploading}
              >
                {uploadStage === 'complete' ? 'Close' : 'Cancel'}
              </Button>
              <Button 
                type="submit" 
                disabled={isUploading || !selectedFile || uploadStage === 'complete'}
              >
                {isUploading ? (
                  <>
                    <LoadingOutlined style={{ marginRight: '8px' }} />
                    {uploadStage === 'uploading' ? 'Uploading...' : 'Processing...'}
                  </>
                ) : (
                  "Upload Document"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}