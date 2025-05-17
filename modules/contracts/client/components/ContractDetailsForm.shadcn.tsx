import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

// Form schema
const formSchema = z.object({
  contractType: z.string().min(1, { message: 'Contract type is required' }),
  contractNumber: z.string().optional(),
  counterpartyName: z.string().min(1, { message: 'Counterparty name is required' }),
  counterpartyAddress: z.string().optional(),
  counterpartyContactEmail: z.string().email({ message: 'Please enter a valid email' }).optional().or(z.literal('')),
  effectiveDate: z.date().optional().nullable(),
  expiryDate: z.date().optional().nullable(),
  executionDate: z.date().optional().nullable(),
  renewalDate: z.date().optional().nullable(),
  totalValue: z.string().optional(),
  currency: z.string().optional()
});

interface ContractDetailsFormProps {
  contractData: any;
  documentData?: any;
  showConfidence?: boolean;
  onSubmit: (data: any) => void;
}

export default function ContractDetailsForm({
  contractData,
  documentData,
  showConfidence = false,
  onSubmit
}: ContractDetailsFormProps) {
  // Initialize form with contract data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contractType: contractData.contractType || 'OTHER',
      contractNumber: contractData.contractNumber || '',
      counterpartyName: contractData.counterpartyName || '',
      counterpartyAddress: contractData.counterpartyAddress || '',
      counterpartyContactEmail: contractData.counterpartyContactEmail || '',
      effectiveDate: contractData.effectiveDate ? new Date(contractData.effectiveDate) : null,
      expiryDate: contractData.expiryDate ? new Date(contractData.expiryDate) : null,
      executionDate: contractData.executionDate ? new Date(contractData.executionDate) : null,
      renewalDate: contractData.renewalDate ? new Date(contractData.renewalDate) : null,
      totalValue: contractData.totalValue?.toString() || '',
      currency: contractData.currency || 'USD'
    }
  });

  // Auto-fill form with extracted data if available
  useEffect(() => {
    if (documentData?.metadata?.contract) {
      const contractMetadata = documentData.metadata.contract;
      
      // Only update fields that are empty
      const formValues = form.getValues();
      const updates: Partial<z.infer<typeof formSchema>> = {};
      
      if (contractMetadata.contractType && !formValues.contractType) {
        updates.contractType = contractMetadata.contractType;
      }
      
      if (contractMetadata.contractNumber && !formValues.contractNumber) {
        updates.contractNumber = contractMetadata.contractNumber;
      }
      
      if (contractMetadata.counterpartyName && !formValues.counterpartyName) {
        updates.counterpartyName = contractMetadata.counterpartyName;
      }
      
      if (contractMetadata.counterpartyAddress && !formValues.counterpartyAddress) {
        updates.counterpartyAddress = contractMetadata.counterpartyAddress;
      }
      
      if (contractMetadata.counterpartyContactEmail && !formValues.counterpartyContactEmail) {
        updates.counterpartyContactEmail = contractMetadata.counterpartyContactEmail;
      }
      
      if (contractMetadata.effectiveDate && !formValues.effectiveDate) {
        updates.effectiveDate = new Date(contractMetadata.effectiveDate);
      }
      
      if (contractMetadata.expiryDate && !formValues.expiryDate) {
        updates.expiryDate = new Date(contractMetadata.expiryDate);
      }
      
      if (contractMetadata.executionDate && !formValues.executionDate) {
        updates.executionDate = new Date(contractMetadata.executionDate);
      }
      
      if (contractMetadata.totalValue && !formValues.totalValue) {
        updates.totalValue = contractMetadata.totalValue.toString();
      }
      
      if (contractMetadata.currency && !formValues.currency) {
        updates.currency = contractMetadata.currency;
      }
      
      if (Object.keys(updates).length > 0) {
        form.reset({ ...formValues, ...updates });
      }
    }
  }, [documentData, form]);

  // Handle form submission
  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    // Convert dates to ISO strings for API
    const formattedData = {
      ...values,
      effectiveDate: values.effectiveDate ? values.effectiveDate.toISOString().split('T')[0] : null,
      expiryDate: values.expiryDate ? values.expiryDate.toISOString().split('T')[0] : null,
      executionDate: values.executionDate ? values.executionDate.toISOString().split('T')[0] : null,
      renewalDate: values.renewalDate ? values.renewalDate.toISOString().split('T')[0] : null,
    };
    
    onSubmit(formattedData);
  };

  // Render confidence indicator if needed
  const renderConfidence = (field: string) => {
    if (!showConfidence || !documentData?.metadata?.contract?.confidence) return null;
    
    const confidence = documentData.metadata.contract.confidence[field];
    if (!confidence) return null;
    
    // Render confidence as a colored indicator
    const confidenceClass = confidence >= 0.8 
      ? 'bg-green-500' 
      : confidence >= 0.5 
        ? 'bg-yellow-500' 
        : 'bg-red-500';
    
    return (
      <div className="flex items-center ml-2">
        <div 
          className={`w-3 h-3 rounded-full ${confidenceClass}`} 
          title={`AI confidence: ${Math.round(confidence * 100)}%`}
        />
      </div>
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contract Type */}
          <FormField
            control={form.control}
            name="contractType"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center">
                  <FormLabel>Contract Type</FormLabel>
                  {renderConfidence('contractType')}
                </div>
                <FormControl>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    {...field}
                  >
                    <option value="MSA">Master Services Agreement</option>
                    <option value="SOW">Statement of Work</option>
                    <option value="NDA">Non-Disclosure Agreement</option>
                    <option value="LICENSE">License Agreement</option>
                    <option value="EMPLOYMENT">Employment Contract</option>
                    <option value="LEASE">Lease Agreement</option>
                    <option value="PURCHASE">Purchase Agreement</option>
                    <option value="SLA">Service Level Agreement</option>
                    <option value="OTHER">Other</option>
                  </select>
                </FormControl>
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
                <div className="flex items-center">
                  <FormLabel>Contract Number</FormLabel>
                  {renderConfidence('contractNumber')}
                </div>
                <FormControl>
                  <Input placeholder="Contract identifier" {...field} />
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
                <div className="flex items-center">
                  <FormLabel>Counterparty Name</FormLabel>
                  {renderConfidence('counterpartyName')}
                </div>
                <FormControl>
                  <Input placeholder="Other party to the contract" {...field} />
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
                <div className="flex items-center">
                  <FormLabel>Counterparty Address</FormLabel>
                  {renderConfidence('counterpartyAddress')}
                </div>
                <FormControl>
                  <Input placeholder="Address" {...field} />
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
                <div className="flex items-center">
                  <FormLabel>Counterparty Email</FormLabel>
                  {renderConfidence('counterpartyContactEmail')}
                </div>
                <FormControl>
                  <Input placeholder="email@example.com" type="email" {...field} />
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
                <div className="flex items-center">
                  <FormLabel>Effective Date</FormLabel>
                  {renderConfidence('effectiveDate')}
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
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
                      selected={field.value || undefined}
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
                <div className="flex items-center">
                  <FormLabel>Expiry Date</FormLabel>
                  {renderConfidence('expiryDate')}
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
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
                      selected={field.value || undefined}
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
                <div className="flex items-center">
                  <FormLabel>Execution Date</FormLabel>
                  {renderConfidence('executionDate')}
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
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
                      selected={field.value || undefined}
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
                <div className="flex items-center">
                  <FormLabel>Total Value</FormLabel>
                  {renderConfidence('totalValue')}
                </div>
                <FormControl>
                  <Input placeholder="Value amount" type="number" {...field} />
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
                <div className="flex items-center">
                  <FormLabel>Currency</FormLabel>
                  {renderConfidence('currency')}
                </div>
                <FormControl>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    {...field}
                  >
                    <option value="USD">USD - United States Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="CNY">CNY - Chinese Yuan</option>
                    <option value="INR">INR - Indian Rupee</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit">
            Save and Continue
          </Button>
        </div>
      </form>
    </Form>
  );
}