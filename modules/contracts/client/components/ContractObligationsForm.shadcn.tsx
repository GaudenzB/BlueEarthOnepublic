import React, { useState } from 'react';
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

// Form schema for obligation
const obligationFormSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  description: z.string().optional(),
  dueDate: z.date().optional().nullable(),
  status: z.string().optional(),
  priority: z.string().optional(),
  customFields: z.record(z.string()).optional(),
});

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
  const [open, setOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Initialize obligation form
  const form = useForm<z.infer<typeof obligationFormSchema>>({
    resolver: zodResolver(obligationFormSchema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: null,
      status: 'PENDING',
      priority: 'MEDIUM',
    }
  });
  
  // Handle adding a new obligation
  const openNewObligationDialog = () => {
    form.reset({
      title: '',
      description: '',
      dueDate: null,
      status: 'PENDING',
      priority: 'MEDIUM',
    });
    setEditIndex(null);
    setOpen(true);
  };
  
  // Handle editing an existing obligation
  const editObligation = (index: number) => {
    const obligation = obligations[index];
    form.reset({
      title: obligation.title,
      description: obligation.description || '',
      dueDate: obligation.dueDate ? new Date(obligation.dueDate) : null,
      status: obligation.status || 'PENDING',
      priority: obligation.priority || 'MEDIUM',
      customFields: obligation.customFields,
    });
    setEditIndex(index);
    setOpen(true);
  };
  
  // Handle deleting an obligation
  const deleteObligation = (index: number) => {
    const newObligations = [...obligations];
    newObligations.splice(index, 1);
    setObligations(newObligations);
    
    toast({
      title: "Obligation removed",
      description: "The obligation has been removed",
      variant: "default",
    });
  };
  
  // Handle saving an obligation
  const handleObligationSave = (data: z.infer<typeof obligationFormSchema>) => {
    const newObligation = {
      ...data,
      dueDate: data.dueDate ? data.dueDate.toISOString().split('T')[0] : null,
    };
    
    let newObligations;
    if (editIndex !== null) {
      // Update existing obligation
      newObligations = [...obligations];
      newObligations[editIndex] = {
        ...newObligations[editIndex],
        ...newObligation
      };
    } else {
      // Add new obligation
      newObligations = [...obligations, newObligation];
    }
    
    setObligations(newObligations);
    setOpen(false);
    
    toast({
      title: editIndex !== null ? "Obligation updated" : "Obligation added",
      description: editIndex !== null 
        ? "The obligation has been updated" 
        : "A new obligation has been added",
      variant: "default",
    });
  };
  
  // Handle form submission
  const handleSubmit = () => {
    onSubmit({ obligations });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Contract Obligations</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={openNewObligationDialog}
              className="flex items-center"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Obligation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editIndex !== null ? 'Edit Obligation' : 'Add New Obligation'}
              </DialogTitle>
              <DialogDescription>
                Add contract obligation details below
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleObligationSave)} className="space-y-4">
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Obligation title" {...field} />
                      </FormControl>
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
                          placeholder="Describe the obligation" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
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
                      <FormLabel>Due Date</FormLabel>
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
                
                {/* Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                          {...field}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="OVERDUE">Overdue</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Priority */}
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                          {...field}
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="CRITICAL">Critical</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editIndex !== null ? 'Update' : 'Add'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* List of obligations */}
      <div className="rounded-md border">
        {obligations.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No obligations added yet. Click "Add Obligation" to add one.
          </div>
        ) : (
          <div className="divide-y">
            {obligations.map((obligation, index) => (
              <div key={index} className="p-4 flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{obligation.title}</h4>
                  {obligation.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {obligation.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center space-x-3 text-sm">
                    {obligation.dueDate && (
                      <span className="inline-flex items-center">
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        {format(new Date(obligation.dueDate), "PPP")}
                      </span>
                    )}
                    <span 
                      className={`px-2 py-0.5 rounded text-xs ${
                        obligation.priority === 'LOW' ? 'bg-gray-100 text-gray-800' :
                        obligation.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
                        obligation.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}
                    >
                      {obligation.priority}
                    </span>
                    <span 
                      className={`px-2 py-0.5 rounded text-xs ${
                        obligation.status === 'PENDING' ? 'bg-gray-100 text-gray-800' :
                        obligation.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        obligation.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        obligation.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {obligation.status}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => editObligation(index)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => deleteObligation(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex justify-end">
        <Button onClick={handleSubmit}>
          Save and Continue
        </Button>
      </div>
    </div>
  );
}