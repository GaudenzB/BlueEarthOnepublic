import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, FileText, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

// Form schema
const formSchema = z.object({
  // Required fields
  contractType: z.string().min(1, { message: 'Contract type is required' }),
  counterpartyName: z.string().min(1, { message: 'Counterparty name is required' }),
  
  // Optional fields with validation
  contractNumber: z.string().optional(),
  counterpartyAddress: z.string().optional(),
  counterpartyContactEmail: z.string()
    .email({ message: 'Must be a valid email address' })
    .optional()
    .or(z.literal('')),
  vendorId: z.string().optional(),
  description: z.string().optional(),
  
  // Date fields with validation
  effectiveDate: z.date({
    required_error: "Effective date is required",
    invalid_type_error: "Effective date must be a valid date",
  }).optional(),
  expiryDate: z.date()
    .optional()
    .superRefine((date, ctx) => {
      if (!date) return;
      
      // Get the parent data - cast to any to access parent data regardless of type
      const parentData = (ctx as any).data;
      if (parentData?.effectiveDate && date <= parentData.effectiveDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Expiry date must be after effective date'
        });
      }
    }),
  executionDate: z.date()
    .optional()
    .superRefine((date, ctx) => {
      if (!date) return;
      
      // Auto-suggest this as the effective date if it's valid and effective date is not set
      const parentData = (ctx as any).data;
      if (!parentData?.effectiveDate && date) {
        // This is just a suggestion that will be handled in the form setup
        // We don't modify the schema validation itself
      }
    }),
  renewalDate: z.date()
    .optional()
    .superRefine((date, ctx) => {
      if (!date) return;
      
      // Get the parent data - cast to any to access parent data regardless of type
      const parentData = (ctx as any).data;
      if (parentData?.expiryDate && date < parentData.expiryDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Renewal date should be on or after the expiry date'
        });
      }
    }),
    
  // Other metadata
  totalValue: z.string()
    .optional()
    .refine(val => !val || /^[\d,.]+$/.test(val), { 
      message: 'Total value must be a number' 
    }),
  currency: z.string().optional(),
});

// Document attachment types
type DocumentAttachment = {
  documentId: string;
  documentTitle: string;
  docType: string;
  isPrimary: boolean;
  notes?: string;
  effectiveDate?: string;
};

interface ContractDetailsFormProps {
  contractData: any;
  documentData?: any; // Optional document data for pre-population
  showConfidence?: boolean;
  onSubmit: (data: any) => void;
  attachedDocuments?: DocumentAttachment[];
}

export default function ContractDetailsForm({
  contractData,
  documentData = null, // Default to null for manual creation flow
  showConfidence = false,
  onSubmit,
  attachedDocuments = []
}: ContractDetailsFormProps) {
  // State for document selection UI
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  
  // Document attachments state
  const [documents, setDocuments] = useState<DocumentAttachment[]>(attachedDocuments || []);
  
  // Document form state
  const [documentForm, setDocumentForm] = useState<{
    documentId: string;
    docType: string;
    isPrimary: boolean;
    notes: string;
    effectiveDate?: Date;
  }>({
    documentId: '',
    docType: 'MAIN',
    isPrimary: false,
    notes: ''
  });
  
  // Data queries
  const documentsQuery = useQuery({
    queryKey: ['/api/documents'],
    queryFn: async () => apiRequest('/api/documents'),
    enabled: showDocumentSelector
  });
  
  const vendorsQuery = useQuery({
    queryKey: ['/api/vendors'],
    queryFn: async () => apiRequest('/api/vendors')
  });
  
  const contractTypesQuery = useQuery({
    queryKey: ['/api/lookup/contract-types'],
    queryFn: async () => apiRequest('/api/lookup/contract-types')
  });
  
  // Set up form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contractType: contractData.contractType || 'OTHER',
      contractNumber: contractData.contractNumber || '',
      counterpartyName: contractData.counterpartyName || '',
      counterpartyAddress: contractData.counterpartyAddress || '',
      counterpartyContactEmail: contractData.counterpartyContactEmail || '',
      vendorId: contractData.vendorId || '',
      description: contractData.description || '',
      effectiveDate: contractData.effectiveDate ? new Date(contractData.effectiveDate) : undefined,
      expiryDate: contractData.expiryDate ? new Date(contractData.expiryDate) : undefined,
      executionDate: contractData.executionDate ? new Date(contractData.executionDate) : undefined,
      renewalDate: contractData.renewalDate ? new Date(contractData.renewalDate) : undefined,
      totalValue: contractData.totalValue || '',
      currency: contractData.currency || '',
    }
  });
  
  // Document attachment handlers
  const handleAddDocument = () => {
    if (!documentForm.documentId) return;
    
    // Find document details
    const selectedDoc = documentsQuery.data?.data?.find(
      (doc: any) => doc.id === documentForm.documentId
    );
    
    if (!selectedDoc) return;
    
    // Create new attachment
    const newDoc: DocumentAttachment = {
      documentId: documentForm.documentId,
      documentTitle: selectedDoc.title || selectedDoc.originalFilename,
      docType: documentForm.docType,
      isPrimary: documentForm.isPrimary,
      notes: documentForm.notes || undefined,
      effectiveDate: documentForm.effectiveDate 
        ? format(documentForm.effectiveDate, 'yyyy-MM-dd') 
        : undefined
    };
    
    setDocuments([...documents, newDoc]);
    
    // Reset form
    setDocumentForm({
      documentId: '',
      docType: 'MAIN',
      isPrimary: false,
      notes: ''
    });
    
    setShowDocumentSelector(false);
  };
  
  const handleRemoveDocument = (index: number) => {
    const updatedDocs = [...documents];
    updatedDocs.splice(index, 1);
    setDocuments(updatedDocs);
  };
  
  // Confidence indicator helper
  const renderConfidence = (confidence: number) => {
    const color = confidence > 0.8 ? 'bg-green-100 text-green-800' : 
                 confidence > 0.5 ? 'bg-yellow-100 text-yellow-800' : 
                 'bg-red-100 text-red-800';
    
    return (
      <Badge variant="outline" className={`ml-2 ${color}`}>
        {Math.round(confidence * 100)}%
      </Badge>
    );
  };

  // Handle form submission
  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    // Validate required fields manually that might not be caught by zod
    if (!values.title) {
      form.setError('title', { 
        type: 'required', 
        message: 'Contract title is required' 
      });
      return;
    }
    
    if (!values.contractType) {
      form.setError('contractType', { 
        type: 'required', 
        message: 'Contract type is required' 
      });
      return;
    }
    
    if (!values.effectiveDate) {
      form.setError('effectiveDate', { 
        type: 'required', 
        message: 'Effective date is required' 
      });
      return;
    }

    // Format dates for API
    const formattedData = {
      ...values,
      effectiveDate: values.effectiveDate ? format(values.effectiveDate, 'yyyy-MM-dd') : null,
      expiryDate: values.expiryDate ? format(values.expiryDate, 'yyyy-MM-dd') : null,
      executionDate: values.executionDate ? format(values.executionDate, 'yyyy-MM-dd') : null,
      renewalDate: values.renewalDate ? format(values.renewalDate, 'yyyy-MM-dd') : null,
      // Keep the ID if it exists
      id: contractData.id,
      // Include document attachments
      documents: documents
    };
    
    onSubmit(formattedData);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Contract Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="contract-wizard-form">
            {/* Contract Details Section */}
            <div className="grid grid-cols-2 gap-4">
              {/* Contract Type */}
              <FormField
                control={form.control}
                name="contractType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Contract Type <span className="text-red-500 ml-1">*</span> {showConfidence && renderConfidence(0.95)}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select contract type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contractTypesQuery.data?.data?.map((type: any) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        )) || (
                          <>
                            <SelectItem value="INVESTMENT">Investment Agreement</SelectItem>
                            <SelectItem value="LPA">Limited Partnership Agreement</SelectItem>
                            <SelectItem value="SERVICE">Service Agreement</SelectItem>
                            <SelectItem value="NDA">Non-Disclosure Agreement</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Contract Number */}
              <FormField
                control={form.control}
                name="contractNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Contract Number {showConfidence && renderConfidence(0.85)}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="ABC-12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Counterparty Name */}
              <FormField
                control={form.control}
                name="counterpartyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Counterparty Name <span className="text-red-500 ml-1">*</span> {showConfidence && renderConfidence(0.92)}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Corp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Counterparty Email */}
              <FormField
                control={form.control}
                name="counterpartyContactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Counterparty Email {showConfidence && renderConfidence(0.75)}
                    </FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Counterparty Address */}
              <FormField
                control={form.control}
                name="counterpartyAddress"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>
                      Counterparty Address {showConfidence && renderConfidence(0.80)}
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="123 Main St, City, Country" 
                        {...field}
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Vendor Selection */}
              <FormField
                control={form.control}
                name="vendorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor (Optional)</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a vendor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {vendorsQuery.data?.data?.map((vendor: any) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Contract Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter a description for this contract" 
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Currency */}
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Currency {showConfidence && renderConfidence(0.90)}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                        <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                        <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                        <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Contract Value */}
              <FormField
                control={form.control}
                name="totalValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Total Value {showConfidence && renderConfidence(0.88)}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="10000.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Effective Date */}
              <FormField
                control={form.control}
                name="effectiveDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>
                      Effective Date <span className="text-red-500 ml-1">*</span> {showConfidence && renderConfidence(0.90)}
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>YYYY-MM-DD (Required)</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          footer={
                            <div className="px-4 pb-2 pt-0 text-xs text-muted-foreground">
                              Select when this contract becomes active
                            </div>
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Expiry Date */}
              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>
                      Expiry Date {showConfidence && renderConfidence(0.85)}
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>YYYY-MM-DD</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          footer={
                            <div className="px-4 pb-2 pt-0 text-xs text-muted-foreground">
                              Select when this contract expires
                            </div>
                          }
                          fromDate={form.getValues().effectiveDate ? new Date(form.getValues().effectiveDate.getTime() + 86400000) : undefined}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Execution Date */}
              <FormField
                control={form.control}
                name="executionDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>
                      Execution Date {showConfidence && renderConfidence(0.82)}
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>YYYY-MM-DD (Date contract was signed)</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            // Auto-suggest this as effective date if not already set
                            const effectiveDate = form.getValues().effectiveDate;
                            if (!effectiveDate && date) {
                              // Default to today if execution date is set and effective date isn't
                              form.setValue('effectiveDate', date);
                            }
                          }}
                          initialFocus
                          footer={
                            <div className="px-4 pb-2 pt-0 text-xs text-muted-foreground">
                              Date the contract was signed/executed
                            </div>
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Renewal Date */}
              <FormField
                control={form.control}
                name="renewalDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>
                      Renewal Date {showConfidence && renderConfidence(0.75)}
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>YYYY-MM-DD (Optional)</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          footer={
                            <div className="px-4 pb-2 pt-0 text-xs text-muted-foreground">
                              Select when this contract will renew
                            </div>
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Document Attachments Section */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-medium mb-4">Attached Documents</h3>
              
              {/* Current document attachments */}
              {documents.length > 0 ? (
                <div className="mb-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Primary</TableHead>
                        <TableHead>Effective Date</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <FileText size={16} />
                              {doc.documentTitle}
                            </div>
                          </TableCell>
                          <TableCell>{doc.docType}</TableCell>
                          <TableCell>{doc.isPrimary ? "Yes" : "No"}</TableCell>
                          <TableCell>{doc.effectiveDate || "—"}</TableCell>
                          <TableCell>{doc.notes || "—"}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleRemoveDocument(index)}
                              type="button"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-6 bg-gray-50 rounded-lg mb-6">
                  <p className="text-muted-foreground">No documents attached yet. Contracts can exist without documents or can have multiple attachments.</p>
                </div>
              )}
              
              {/* Add document button */}
              {!showDocumentSelector ? (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowDocumentSelector(true)}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" /> Attach Document
                </Button>
              ) : (
                <div className="space-y-4 border p-4 rounded-lg">
                  <h4 className="font-medium">Attach Document</h4>
                  
                  {/* Document selector */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Document</label>
                      <Select
                        value={documentForm.documentId}
                        onValueChange={(value) => setDocumentForm({...documentForm, documentId: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a document" />
                        </SelectTrigger>
                        <SelectContent>
                          {documentsQuery.data?.data?.map((doc: any) => (
                            <SelectItem key={doc.id} value={doc.id}>
                              {doc.title || doc.originalFilename}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Document Type</label>
                      <Select
                        value={documentForm.docType}
                        onValueChange={(value) => setDocumentForm({...documentForm, docType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MAIN">Main Agreement</SelectItem>
                          <SelectItem value="AMENDMENT">Amendment</SelectItem>
                          <SelectItem value="ADDENDUM">Addendum</SelectItem>
                          <SelectItem value="SIDE_LETTER">Side Letter</SelectItem>
                          <SelectItem value="EXHIBIT">Exhibit</SelectItem>
                          <SelectItem value="SCHEDULE">Schedule</SelectItem>
                          <SelectItem value="STATEMENT_OF_WORK">Statement of Work</SelectItem>
                          <SelectItem value="CERTIFICATE">Certificate</SelectItem>
                          <SelectItem value="TERMINATION">Termination</SelectItem>
                          <SelectItem value="RENEWAL">Renewal</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Effective Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            {documentForm.effectiveDate ? (
                              format(documentForm.effectiveDate, "PPP")
                            ) : (
                              <span className="text-muted-foreground">Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={documentForm.effectiveDate}
                            onSelect={(date) => setDocumentForm({...documentForm, effectiveDate: date as Date})}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2 flex items-end">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isPrimary"
                          checked={documentForm.isPrimary}
                          onChange={(e) => setDocumentForm({...documentForm, isPrimary: e.target.checked})}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor="isPrimary" className="text-sm font-medium">
                          Primary Document
                        </label>
                      </div>
                    </div>
                    
                    <div className="col-span-2 space-y-2">
                      <label className="text-sm font-medium">Notes</label>
                      <Textarea
                        value={documentForm.notes}
                        onChange={(e) => setDocumentForm({...documentForm, notes: e.target.value})}
                        placeholder="Add notes about this document"
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowDocumentSelector(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleAddDocument}
                      disabled={!documentForm.documentId}
                    >
                      Add Document
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
              <Button type="submit" className="px-4 py-2">
                Save and Continue
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}