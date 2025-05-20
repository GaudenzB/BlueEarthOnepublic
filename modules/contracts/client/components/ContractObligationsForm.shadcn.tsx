import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Individual obligation schema
const obligationSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, { message: 'Title is required' }),
  description: z.string().optional(),
  obligationType: z.string().min(1, { message: 'Type is required' }),
  responsibleParty: z.string().min(1, { message: 'Responsible party is required' }),
  dueDate: z.date().optional(),
  status: z.string().default('PENDING'),
  reminder: z.boolean().default(false),
  reminderDays: z.number().min(1).optional(),
});

// Form schema for adding a new obligation
const formSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  description: z.string().optional(),
  obligationType: z.string().min(1, { message: 'Type is required' }),
  responsibleParty: z.string().min(1, { message: 'Responsible party is required' }),
  dueDate: z.date().optional(),
  status: z.string().default('PENDING'),
  reminder: z.boolean().default(false),
  reminderDays: z.number().min(1).optional(),
});

// Props for the component
interface ContractObligationsFormProps {
  contractId?: string;
  obligations: any[];
  setObligations: (obligations: any[]) => void;
  showConfidence?: boolean;
  onSubmit: (data: any) => void;
}

export default function ContractObligationsForm({
  contractId,
  obligations,
  setObligations,
  showConfidence = false,
  onSubmit
}: ContractObligationsFormProps) {
  // Form for adding a new obligation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      obligationType: 'PAYMENT',
      responsibleParty: 'US',
      status: 'PENDING',
      reminder: false,
      reminderDays: 7,
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

  // Add a new obligation
  const handleAddObligation = (values: z.infer<typeof formSchema>) => {
    const newObligation = {
      ...values,
      id: `temp-${Date.now()}`, // Temporary ID until saved on the server
      dueDate: values.dueDate ? format(values.dueDate, 'yyyy-MM-dd') : null,
    };
    
    setObligations([...obligations, newObligation]);
    form.reset(); // Clear the form
  };

  // Remove an obligation
  const handleRemoveObligation = (index: number) => {
    const newObligations = [...obligations];
    newObligations.splice(index, 1);
    setObligations(newObligations);
  };

  // Continue to the next step
  const handleContinue = () => {
    onSubmit({ obligations });
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED': // Fall through
       return 'bg-green-100 text-green-800';
      case 'PENDING': // Fall through
       return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE': // Fall through
       return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contract Obligations</CardTitle>
        </CardHeader>
        <CardContent>
          {/* List of current obligations */}
          {obligations.length > 0 ? (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Current Obligations</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Responsible</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {obligations.map((obligation, index) => (
                    <TableRow key={obligation.id || index}>
                      <TableCell>{obligation.title}</TableCell>
                      <TableCell>{obligation.obligationType}</TableCell>
                      <TableCell>{obligation.responsibleParty}</TableCell>
                      <TableCell>{obligation.dueDate}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(obligation.status)}>
                          {obligation.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemoveObligation(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="mb-6 p-4 border border-dashed rounded-md text-center">
              <p className="text-muted-foreground">No obligations added yet</p>
            </div>
          )}

          {/* Form to add a new obligation */}
          <div>
            <h3 className="text-lg font-medium mb-3">Add New Obligation</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddObligation)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Obligation Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Title {showConfidence && renderConfidence(0.92)}
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Quarterly Payment" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Obligation Type */}
                  <FormField
                    control={form.control}
                    name="obligationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Type {showConfidence && renderConfidence(0.88)}
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PAYMENT">Payment</SelectItem>
                            <SelectItem value="DELIVERY">Delivery</SelectItem>
                            <SelectItem value="REPORTING">Reporting</SelectItem>
                            <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                            <SelectItem value="RENEWAL">Renewal</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Responsible Party */}
                  <FormField
                    control={form.control}
                    name="responsibleParty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Responsible Party {showConfidence && renderConfidence(0.85)}
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select responsible party" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="US">Our Company</SelectItem>
                            <SelectItem value="COUNTERPARTY">Counterparty</SelectItem>
                            <SelectItem value="BOTH">Both Parties</SelectItem>
                            <SelectItem value="THIRD_PARTY">Third Party</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Due Date */}
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>
                          Due Date {showConfidence && renderConfidence(0.80)}
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

                  {/* Status */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Status {showConfidence && renderConfidence(0.78)}
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="OVERDUE">Overdue</SelectItem>
                            <SelectItem value="WAIVED">Waived</SelectItem>
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
                      <FormItem className="col-span-1 md:col-span-2">
                        <FormLabel>
                          Description {showConfidence && renderConfidence(0.75)}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional details about this obligation"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Add Obligation
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button 
          onClick={handleContinue}
          disabled={obligations.length === 0}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}