import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '../../hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage, Form } from '@/components/ui/form';
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Upload, File, X, Check, Loader2, ArrowUp } from 'lucide-react';

// Define form schema for validation
const formSchema = z.object({
  documentType: z.string().min(1, "Document type is required"),
  description: z.string().optional(),
});

// Define type based on schema
type FormValues = z.infer<typeof formSchema>;

/**
 * Document uploader component
 * Allows users to upload documents via drag and drop or file selection
 */
const DocumentUploader: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const { toast } = useToast();
  
  // Form setup with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      documentType: 'general',
      description: '',
    },
  });
  
  // Configure dropzone for document uploads
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles: File[]) => {
      setFiles(acceptedFiles);
    },
  });
  
  // Handle document upload via API
  const upload = useMutation({
    mutationFn: async () => {
      // Here would be the actual upload logic
      // For testing, we're just returning a success response
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Documents successfully uploaded.",
        duration: 5000,
      });
      setFiles([]);
      form.reset();
    },
    onError: (_error: unknown) => {
      toast({
        title: "Error",
        description: "Failed to upload documents. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    },
  });
  
  const handleUpload = () => {
    upload.mutate();
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Upload Documents</h2>
      
      {/* Dropzone area */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
      >
        <input {...getInputProps()} />
        
        {isDragActive ? (
          <div>
            <Upload className="mx-auto h-12 w-12 text-blue-500 mb-4" />
            <p className="text-lg font-medium text-blue-600">Drop the files here ...</p>
          </div>
        ) : (
          <div>
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-2">Drag and drop your files here</p>
            <p className="text-sm text-gray-500 mb-4">or click to select files</p>
            <p className="text-xs text-gray-400">Supported formats: PDF, DOC, DOCX (Max 10MB)</p>
          </div>
        )}
      </div>
      
      {/* File list */}
      {files.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Selected Files</h3>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                <div className="flex items-center">
                  <File className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    ({Math.round(file.size / 1024)} KB)
                  </span>
                </div>
                <ContextMenu>
                  <ContextMenuTrigger>
                    <Button variant="ghost" size="sm" onClick={() => {
                      const newFiles = [...files];
                      newFiles.splice(index, 1);
                      setFiles(newFiles);
                    }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem>Remove</ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Upload controls */}
      {files.length > 0 && (
        <div className="mt-6">
          <Form {...form}>
            <form className="space-y-4">
              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="report">Report</SelectItem>
                        <SelectItem value="invoice">Invoice</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the type of document you&apos;re uploading
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end mt-6 space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFiles([]);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                
                <Button 
                  onClick={handleUpload}
                  disabled={upload.isPending}
                >
                  {upload.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : upload.isSuccess ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Successfully Uploaded
                    </>
                  ) : upload.isError ? (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Failed to Upload
                    </>
                  ) : (
                    <>
                      <ArrowUp className="mr-2 h-4 w-4" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;