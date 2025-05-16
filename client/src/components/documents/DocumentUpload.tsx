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
import { useAuth } from "@/hooks/use-auth";

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
  
  // Get authentication information to use for uploads
  const { user } = useAuth();
  
  // Derive authentication status from user
  const isAuthenticated = !!user;

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
      
      // Add error event listeners to the XHR object
      xhr.addEventListener('error', (event) => {
        console.error('XHR error event triggered:', event);
        setErrorDetails('Network error occurred during file upload');
        setUploadStage('error');
      });
      
      xhr.addEventListener('abort', () => {
        console.log('XHR upload aborted');
        setErrorDetails('Upload was aborted');
        setUploadStage('error');
      });
      
      // Set up upload progress tracking with improved logging
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          console.log(`Upload progress: ${percentComplete}% (${event.loaded}/${event.total} bytes)`);
          setUploadProgress(percentComplete);
          
          // When upload reaches 100%, move to processing stage
          if (percentComplete >= 100) {
            setUploadStage('processing');
          }
        } else {
          console.warn('Length not computable in progress event');
        }
      });
      
      // Use development endpoint in dev mode for better testing
      const uploadEndpoint = import.meta.env.DEV ? 
        '/api/documents/dev-upload' : 
        '/api/documents';
      
      // Wrap XHR in a promise for async/await support
      const uploadPromise = new Promise<any>((resolve, reject) => {
        // Use the withCredentials flag to ensure cookies are sent with the request
        xhr.withCredentials = true;
        xhr.open('POST', uploadEndpoint, true);
        
        // Log authentication status from our auth hook
        console.log('Authentication status before XHR upload:', {
          isAuthenticated,
          userId: user?.id,
          username: user?.username,
          role: user?.role,
          cookies: document.cookie ? 'Present' : 'None'
        });
        
        // Always attempt to send token in dev environment, plus use cookies
        if (import.meta.env.DEV) {
          // Try to get a token from the dev login endpoint
          fetch('/api/auth/dev-login', { 
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          })
          .then(resp => resp.json())
          .then(data => {
            if (data.data?.token) {
              // Add the token to the current request
              xhr.setRequestHeader('Authorization', `Bearer ${data.data.token}`);
              console.log('Added dev token to Authorization header');
            }
          })
          .catch(err => {
            console.error('Failed to get dev token:', err);
          });
        }
        
        // No need to set auth headers, we're using credentials: 'include' which sends cookies
        
        // For debug purposes, log authentication methods
        const authCookie = document.cookie.includes('accessToken');
        const sessionCookie = document.cookie.includes('connect.sid');
        console.log('Authentication cookies status:', {
          authCookie,
          sessionCookie,
          withCredentials: xhr.withCredentials
        });
        
        // Add debug logging to console
        console.log('Starting document upload via XHR...', {
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
              console.log('XHR upload successful, response:', data);
              resolve(data);
            } catch (e) {
              console.error('Error parsing XHR response:', e, 'Response text:', xhr.responseText);
              reject(new Error('Invalid response from server'));
            }
          } else {
            try {
              console.error('XHR upload failed with status:', xhr.status, 'Response:', xhr.responseText);
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
              console.error('Error handling XHR error response:', e);
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };
        
        // Handle network errors
        xhr.onerror = function(error) {
          console.error("Network error during XHR upload:", error);
          reject(new Error('Network error occurred during upload'));
        };
        
        // Handle abort
        xhr.upload.onabort = function() {
          console.log("XHR upload was aborted");
          reject(new Error('Upload was cancelled'));
        };
        
        // Only add timeout for files larger than 5MB
        if (data.file.size > 5 * 1024 * 1024) {
          xhr.timeout = 300000; // 5 minute timeout (300,000 ms)
          xhr.ontimeout = function() {
            console.error("XHR upload timed out after 5 minutes");
            reject(new Error('Upload timed out after 5 minutes'));
          };
        }
        
        // Connect abort controller to XHR
        if (abortControllerRef.current) {
          abortControllerRef.current.signal.addEventListener('abort', () => {
            xhr.abort();
          });
        }
        
        // Log right before sending
        console.log("About to send FormData via XHR", {
          formDataHasFile: formData.has('file'),
          usingCookieAuth: true,
          contentLength: data.file.size
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
        const authStatus = { 
          authCookie: document.cookie.includes('accessToken'),
          sessionCookie: document.cookie.includes('connect.sid'),
          usingCookieAuth: true
        };
        console.log('Authentication status before upload:', authStatus);
        
        // Development-only: Check if we need to auto-authenticate
        if (import.meta.env.DEV && 
            !authStatus.authCookie && 
            !authStatus.sessionCookie) {
          
          console.log('No authentication detected, attempting dev auto-login...');
          
          try {
            // Call the development login endpoint to get a valid token
            const devLoginResponse = await fetch('/api/auth/dev-login', {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            if (devLoginResponse.ok) {
              const authData = await devLoginResponse.json();
              console.log('Development auto-login successful', authData);
              
              // Wait a moment for cookies to be set
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Verify cookies were set
              const postLoginAuthStatus = {
                authCookie: document.cookie.includes('accessToken'),
                sessionCookie: document.cookie.includes('connect.sid')
              };
              console.log('Post-login auth status:', postLoginAuthStatus);
              
              if (!postLoginAuthStatus.authCookie && !postLoginAuthStatus.sessionCookie) {
                console.warn('Auto-login succeeded but no authentication method is available');
              }
            } else {
              console.error('Development auto-login failed', await devLoginResponse.text());
              toast({
                title: "Authentication Error",
                description: "Failed to auto-authenticate in development mode. Document upload may fail.",
                variant: "destructive",
              });
            }
          } catch (devLoginError) {
            console.error('Error in development auto-login:', devLoginError);
            toast({
              title: "Authentication Error",
              description: "Failed to connect to authentication service.",
              variant: "destructive",
            });
          }
        }
        
        // First try with XMLHttpRequest for better progress reporting
        try {
          // Wait for the upload to complete - we're managing timeout in the XHR object itself
          console.log('Waiting for XHR upload to complete...');
          const responseData = await uploadPromise;
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
          
          // Attempt fetch API fallback
          try {
            // Only add timeout for files larger than 5MB
            const fetchController = new AbortController();
            let fetchTimeout: number | undefined = undefined;
            
            if (data.file.size > 5 * 1024 * 1024) {
              fetchTimeout = window.setTimeout(() => {
                fetchController.abort();
              }, 300000); // 5 minute timeout
            }
            
            // Log auth status before fetch attempt
            console.log('About to send FormData via fetch', {
              formDataHasFile: !!fetchFormData.get('file'),
              usingCookieAuth: true
            });
            
            // Log comprehensive auth status
            const authCookie = document.cookie.includes('accessToken');
            const sessionCookie = document.cookie.includes('connect.sid');
            console.log('Authentication status before fetch upload:', {
              authCookie,
              sessionCookie,
              usingCookieAuth: true
            });
            
            // Prepare headers
            const headers: HeadersInit = {};

            // Always attempt to send token in dev environment, plus use cookies
            if (import.meta.env.DEV) {
              try {
                // Try to get a token from the dev login endpoint
                const devLoginResponse = await fetch('/api/auth/dev-login', { 
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' }
                });
                
                const data = await devLoginResponse.json();
                if (data.data?.token) {
                  headers['Authorization'] = `Bearer ${data.data.token}`;
                  console.log('Added dev token to Authorization header for fetch upload');
                }
              } catch (err) {
                console.error('Failed to get dev token for fetch upload:', err);
              }
            }

            // We use cookie-based authentication, so no need to add Authorization header
            // The credentials: 'include' option will ensure cookies are sent with the request
            
            // Use development endpoint in dev mode for better testing
            const fetchUploadEndpoint = import.meta.env.DEV ? 
              '/api/documents/dev-upload' : 
              '/api/documents';
              
            console.log('Starting fetch upload attempt...', {
              endpoint: fetchUploadEndpoint,
              isDev: import.meta.env.DEV
            });
            
            const response = await fetch(fetchUploadEndpoint, {
              method: 'POST',
              headers,
              body: fetchFormData,
              credentials: 'include', // Always include credentials to send cookies
              signal: fetchController.signal
            });
            
            // Clear timeout if it was set
            if (fetchTimeout !== undefined) {
              window.clearTimeout(fetchTimeout);
            }
            
            if (!response.ok) {
              const responseText = await response.text();
              console.error('Fetch upload failed with status:', response.status, 'Response:', responseText);
              
              let errorData;
              try {
                errorData = JSON.parse(responseText);
              } catch (e) {
                errorData = { message: responseText || `Upload failed with status ${response.status}` };
              }
              
              // Special handling for authentication errors
              if (response.status === 401) {
                console.error('Authentication error during document upload');
                throw new Error('Authentication required. Please try logging in again.');
              }
              
              // Special handling for server errors
              if (response.status >= 500) {
                console.error('Server error during document upload:', response.status);
                throw new Error('Server error occurred. Please try again later.');
              }
              
              throw new Error(errorData.message || `Upload failed with status ${response.status}`);
            }
            
            const responseData = await response.json();
            console.log('Fetch API upload completed successfully:', responseData);
            return handleSuccess(responseData);
          } catch (fetchError) {
            console.error('Fetch fallback also failed:', fetchError);
            throw fetchError; // Rethrow for main error handler
          }
        }
      } catch (error) {
        console.error('Upload timeout or error:', error);
        setUploadStage('error');
        const errorMessage = error instanceof Error ? error.message : "The upload process failed";
        setErrorDetails(errorMessage);
        
        toast({
          title: "Upload failed",
          description: errorMessage,
          variant: "destructive",
        });
        
        throw error;
      } finally {
        if (uploadStage !== 'complete') {
          setIsUploading(false);
        }
      }
    } catch (error) {
      console.error('Unexpected error during upload process:', error);
      
      // Set error state if not already set
      if (uploadStage !== 'error') {
        setUploadStage('error');
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
        setErrorDetails(errorMessage);
        
        toast({
          title: "Upload failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
      
      // Always ensure isUploading is reset
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    if (isUploading && abortControllerRef.current) {
      // Abort any in-progress upload
      abortControllerRef.current.abort();
      
      setIsUploading(false);
      setUploadStage('idle');
      setErrorDetails(null);
      
      toast({
        title: "Upload cancelled",
        description: "Document upload has been cancelled.",
        variant: "default",
      });
    }
    
    // Close the dialog
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[600px] h-auto max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload documents to securely store and share with your team.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* File upload area */}
              <div
                className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/10"
                    : selectedFile
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 hover:border-primary"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center space-x-2">
                    <FileOutlined className="text-xl text-green-500" />
                    <span className="font-medium text-green-600">{selectedFile.name}</span>
                    <button
                      type="button"
                      className="ml-2 text-red-500 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile();
                      }}
                    >
                      <CloseOutlined />
                    </button>
                  </div>
                ) : (
                  <div>
                    <UploadOutlined className="text-2xl mb-2" />
                    <p>Drag and drop a file here, or click to select</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Maximum file size: 20MB
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileRef}
                  className="hidden"
                  onChange={handleFileSelection}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.xml,.jpg,.jpeg,.png"
                />
              </div>
              {form.formState.errors.file && (
                <p className="text-red-500 text-sm">
                  {form.formState.errors.file.message?.toString()}
                </p>
              )}

              {/* Document title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter document title" {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive title for your document.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Document type */}
              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CONTRACT">Contract</SelectItem>
                        <SelectItem value="OFFER_LETTER">Offer Letter</SelectItem>
                        <SelectItem value="REPORT">Report</SelectItem>
                        <SelectItem value="INVOICE">Invoice</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Category of the document for organization.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter document description"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Briefly describe what this document contains.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tags */}
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
                      Tags help with searching and categorizing (e.g. finance, report).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confidential checkbox */}
              <FormField
                control={form.control}
                name="isConfidential"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Confidential Document</FormLabel>
                      <FormDescription>
                        Mark this document as confidential to restrict access.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {/* Upload progress indicators */}
              {isUploading && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {uploadStage === 'uploading'
                        ? "Uploading..."
                        : uploadStage === 'processing'
                        ? "Processing document..."
                        : ""}
                    </span>
                    <span className="text-sm font-medium">{uploadProgress}%</span>
                  </div>
                  <Progress percent={uploadProgress} size="small" />
                </div>
              )}

              {/* Success message */}
              {uploadStage === 'complete' && (
                <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-md flex items-center">
                  <CheckCircleOutlined className="text-green-500 mr-2" />
                  <span>Document uploaded successfully!</span>
                </div>
              )}

              {/* Error message */}
              {uploadStage === 'error' && errorDetails && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md flex items-center">
                  <InfoCircleOutlined className="text-red-500 mr-2" />
                  <span className="text-red-700">{errorDetails}</span>
                </div>
              )}

              <DialogFooter className="border-t pt-4 mt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isUploading && uploadStage !== 'error'}
                >
                  {isUploading ? "Cancel Upload" : "Cancel"}
                </Button>
                <Button 
                  type="submit" 
                  disabled={!selectedFile || isUploading}
                >
                  {isUploading ? (
                    <div className="flex items-center">
                      <LoadingOutlined className="mr-2" />
                      Uploading...
                    </div>
                  ) : (
                    "Upload Document"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}