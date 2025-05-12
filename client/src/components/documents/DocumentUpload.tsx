import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { FileIcon, UploadIcon, XIcon } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { queryClient } from "@/lib/queryClient";

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

  const fileRef = React.useRef<HTMLInputElement>(null);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      form.setValue("file", file);
      
      // If title is empty, use filename as default title
      if (!form.getValues("title")) {
        const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        form.setValue("title", fileName);
      }
    }
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      form.setValue("file", file);
      
      // If title is empty, use filename as default title
      if (!form.getValues("title")) {
        const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        form.setValue("title", fileName);
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
        const tagsArray = data.tags.split(",").map(tag => tag.trim());
        formData.append("tags", JSON.stringify(tagsArray));
      }
      
      formData.append("isConfidential", String(data.isConfidential));
      
      // Make API request
      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
        // No Content-Type header - browser will set it with boundary for FormData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload document");
      }
      
      // Invalidate documents query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      
      // Call success callback
      onSuccess();
      
      // Reset form
      form.reset();
      setSelectedFile(null);
      
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading your document",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
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
                        defaultValue={field.value}
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
                          className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer h-[212px] transition-colors ${
                            isDragging ? "border-primary bg-primary/5" : "border-input"
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
                                <FileIcon className="h-6 w-6 text-foreground" />
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
                                <XIcon className="h-4 w-4 mr-1" /> Remove
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="bg-muted p-2 rounded-full mb-3">
                                <UploadIcon className="h-6 w-6 text-foreground" />
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

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isUploading || !selectedFile}
              >
                {isUploading ? "Uploading..." : "Upload Document"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}