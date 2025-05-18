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
import { Checkbox } from '@/components/ui/checkbox';
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
  contractType: z.string().min(1, { message: 'Contract type is required' }),
  contractNumber: z.string().optional(),
  counterpartyName: z.string().min(1, { message: 'Counterparty name is required' }),
  counterpartyAddress: z.string().optional(),
  counterpartyContactEmail: z.string().email({ message: 'Must be a valid email' }).optional().or(z.literal('')),
  vendorId: z.string().optional(),
  description: z.string().optional(),
  effectiveDate: z.date().optional(),
  expiryDate: z.date().optional(),
  executionDate: z.date().optional(),
  renewalDate: z.date().optional(),
  totalValue: z.string().optional(),
  currency: z.string().optional(),
});

// Document attachment form schema
const documentAttachmentSchema = z.object({
  documentId: z.string().min(1, { message: 'Document ID is required' }),
  docType: z.string().min(1, { message: 'Document type is required' }),
  isPrimary: z.boolean().default(false),
  notes: z.string().optional(),
});

interface ContractDetailsFormProps {
  contractData: any;
  documentData?: any;
  showConfidence?: boolean;
  onSubmit: (data: any) => void;
  attachedDocuments?: any[];
}

export default function ContractDetailsForm({
  contractData,
  documentData,
  showConfidence = false,
  onSubmit,
  attachedDocuments = []
}: ContractDetailsFormProps) {
  const [documents, setDocuments] = useState(attachedDocuments || []);
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  
  // Get available documents for selection
  const documentsQuery = useQuery({
    queryKey: ['/api/documents'],
    queryFn: async () => {
      return apiRequest('/api/documents');
    },
    enabled: showDocumentSelector
  });
  // Query vendors for dropdown
  const vendorsQuery = useQuery({
    queryKey: ['/api/vendors'],
    queryFn: async () => {
      return apiRequest('/api/vendors');
    }
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

  // Helper function to get confidence badge
  const renderConfidence = (value: number) => {
    if (!showConfidence) return null;
    
    let color = 'bg-red-100 text-red-800';
    if (value >= 0.9) {
      color = 'bg-green-100 text-green-800';
    } else if (value >= 0.7) {
      color = 'bg-yellow-100 text-yellow-800';
    }
    
    return (
      <Badge variant="outline" className={`ml-2 ${color}`}>
        {Math.round(value * 100)}%
      </Badge>
    );
  };

  // Document attachment form
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

  // Add document to attachments list
  const handleAddDocument = () => {
    if (!documentForm.documentId) return;
    
    // Find document details from query results
    const selectedDoc = documentsQuery.data?.data?.find((doc: any) => doc.id === documentForm.documentId);
    
    if (!selectedDoc) return;
    
    // Create new document attachment
    const newAttachment = {
      ...documentForm,
      documentTitle: selectedDoc.title || selectedDoc.originalFilename,
      effectiveDate: documentForm.effectiveDate ? format(documentForm.effectiveDate, 'yyyy-MM-dd') : undefined
    };
    
    // Add to documents list
    setDocuments([...documents, newAttachment]);
    
    // Reset form
    setDocumentForm({
      documentId: '',
      docType: 'MAIN',
      isPrimary: false,
      notes: ''
    });
    
    // Hide document selector
    setShowDocumentSelector(false);
  };
  
  // Remove document from attachments list
  const handleRemoveDocument = (index: number) => {
    const updatedDocs = [...documents];
    updatedDocs.splice(index, 1);
    setDocuments(updatedDocs);
  };

  // Handle form submission
  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    // Format dates for API
    const formattedData = {
      ...values,
      effectiveDate: values.effectiveDate ? format(values.effectiveDate, 'yyyy-MM-dd') : null,
      expiryDate: values.expiryDate ? format(values.expiryDate, 'yyyy-MM-dd') : null,
      executionDate: values.executionDate ? format(values.executionDate, 'yyyy-MM-dd') : null,
      renewalDate: values.renewalDate ? format(values.renewalDate, 'yyyy-MM-dd') : null,
      // Keep the ID and any other existing data
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
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contract Type */}
              <FormField
                control={form.control}
                name="contractType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Contract Type {showConfidence && renderConfidence(0.95)}
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select contract type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NDA">Non-Disclosure Agreement</SelectItem>
                        <SelectItem value="MSA">Master Service Agreement</SelectItem>
                        <SelectItem value="SOW">Statement of Work</SelectItem>
                        <SelectItem value="EMPLOYMENT">Employment Contract</SelectItem>
                        <SelectItem value="LEASE">Lease Agreement</SelectItem>
                        <SelectItem value="LICENSING">Licensing Agreement</SelectItem>
                        <SelectItem value="VENDOR">Vendor Agreement</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
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
                      <Input placeholder="Contract reference number" {...field} />
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
                      Counterparty Name {showConfidence && renderConfidence(0.92)}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Company or individual name" {...field} />
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
                  <FormItem>
                    <FormLabel>
                      Counterparty Address {showConfidence && renderConfidence(0.78)}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Business address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Counterparty Contact Email */}
              <FormField
                control={form.control}
                name="counterpartyContactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Counterparty Email {showConfidence && renderConfidence(0.80)}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="contact@company.com" {...field} />
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
                      Effective Date {showConfidence && renderConfidence(0.88)}
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
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
                      Expiry Date {showConfidence && renderConfidence(0.86)}
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
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
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
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
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
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
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Total Value */}
              <FormField
                control={form.control}
                name="totalValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Total Value {showConfidence && renderConfidence(0.79)}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Contract value" 
                        {...field} 
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
                        <SelectItem value="">None</SelectItem>
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
                          <SelectItem value="SIDE_LETTER">Side Letter</SelectItem>
                          <SelectItem value="EXHIBIT">Exhibit</SelectItem>
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