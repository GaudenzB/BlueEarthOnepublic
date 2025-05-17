import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Form schema
const formSchema = z.object({
  contractType: z.string().min(1, { message: 'Contract type is required' }),
  contractNumber: z.string().optional(),
  counterpartyName: z.string().min(1, { message: 'Counterparty name is required' }),
  counterpartyAddress: z.string().optional(),
  counterpartyContactEmail: z.string().email({ message: 'Must be a valid email' }).optional().or(z.literal('')),
  effectiveDate: z.date().optional(),
  expiryDate: z.date().optional(),
  executionDate: z.date().optional(),
  renewalDate: z.date().optional(),
  totalValue: z.string().optional(),
  currency: z.string().optional(),
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
  // Set up form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contractType: contractData.contractType || 'OTHER',
      contractNumber: contractData.contractNumber || '',
      counterpartyName: contractData.counterpartyName || '',
      counterpartyAddress: contractData.counterpartyAddress || '',
      counterpartyContactEmail: contractData.counterpartyContactEmail || '',
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

  // Handle form submission
  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    // Format dates for API
    const formattedData = {
      ...values,
      effectiveDate: values.effectiveDate ? format(values.effectiveDate, 'yyyy-MM-dd') : null,
      expiryDate: values.expiryDate ? format(values.expiryDate, 'yyyy-MM-dd') : null,
      executionDate: values.executionDate ? format(values.executionDate, 'yyyy-MM-dd') : null,
      renewalDate: values.renewalDate ? format(values.renewalDate, 'yyyy-MM-dd') : null,
      // Keep the document ID and any other existing data
      documentId: contractData.documentId,
      id: contractData.id,
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

              {/* Currency */}
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Currency {showConfidence && renderConfidence(0.90)}
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            <div className="flex justify-end space-x-2">
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