import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Stack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Flex,
  Badge,
  Tooltip,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Textarea,
  Text
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Form schema for obligations
const obligationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  obligationType: z.enum([
    'REPORTING',
    'PAYMENT',
    'DISCLOSURE',
    'COMPLIANCE',
    'OPERATIONAL',
    'OTHER'
  ]),
  responsibleParty: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  recurringPattern: z.string().optional().nullable(),
  reminderDays: z.array(z.number()).optional(),
});

// Type for confidence levels
type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNVERIFIED' | null;

// Helper to determine color based on confidence
const getConfidenceColor = (confidence: ConfidenceLevel) => {
  switch (confidence) {
    case 'HIGH': return 'green';
    case 'MEDIUM': return 'yellow';
    case 'LOW': return 'orange';
    case 'UNVERIFIED': 
    default: return 'gray';
  }
};

// Interface for component props
interface ContractObligationsFormProps {
  contractId: string;
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
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingObligation, setEditingObligation] = useState<any>(null);
  const queryClient = useQueryClient();

  // Default values for the obligation form
  const defaultValues = {
    title: '',
    description: '',
    obligationType: 'OTHER' as const,
    responsibleParty: '',
    dueDate: '',
    recurringPattern: '',
    reminderDays: [30, 14, 7, 1], // Default reminder days
  };

  // Form setup with react-hook-form
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: editingObligation || defaultValues,
    resolver: zodResolver(obligationSchema)
  });

  // Mutation for creating/updating obligations
  const obligationMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingObligation?.id) {
        // Update existing obligation
        return apiRequest(`/api/contracts/${contractId}/obligations/${editingObligation.id}`, {
          method: 'PATCH',
          body: JSON.stringify(data)
        });
      } else {
        // Create new obligation
        return apiRequest(`/api/contracts/${contractId}/obligations`, {
          method: 'POST',
          body: JSON.stringify({ ...data, contractId })
        });
      }
    },
    onSuccess: (response) => {
      // Close the modal
      onClose();
      
      // Reset the form
      reset(defaultValues);
      setEditingObligation(null);
      
      // If this was an edit, update the obligation in the list
      if (editingObligation?.id && response?.data) {
        setObligations(
          obligations.map(o => o.id === editingObligation.id ? response.data : o)
        );
      } 
      // If this was a new obligation, add it to the list
      else if (response?.data) {
        setObligations([...obligations, response.data]);
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${contractId}/obligations`] });
    }
  });

  // Mutation for deleting obligations
  const deleteObligationMutation = useMutation({
    mutationFn: async (obligationId: string) => {
      return apiRequest(`/api/contracts/${contractId}/obligations/${obligationId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: (_, obligationId) => {
      // Remove the obligation from the list
      setObligations(obligations.filter(o => o.id !== obligationId));
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${contractId}/obligations`] });
    }
  });

  // Open the modal for adding a new obligation
  const handleAddObligation = () => {
    setEditingObligation(null);
    reset(defaultValues);
    onOpen();
  };

  // Open the modal for editing an existing obligation
  const handleEditObligation = (obligation: any) => {
    setEditingObligation(obligation);
    
    // Set form values
    reset({
      title: obligation.title || '',
      description: obligation.description || '',
      obligationType: obligation.obligationType || 'OTHER',
      responsibleParty: obligation.responsibleParty || '',
      dueDate: obligation.dueDate ? new Date(obligation.dueDate).toISOString().split('T')[0] : '',
      recurringPattern: obligation.recurringPattern || '',
      reminderDays: obligation.reminderDays || [30, 14, 7, 1],
    });
    
    onOpen();
  };

  // Handle deleting an obligation
  const handleDeleteObligation = (obligationId: string) => {
    if (window.confirm('Are you sure you want to delete this obligation?')) {
      deleteObligationMutation.mutate(obligationId);
    }
  };

  // Submit handler for the obligation form
  const onObligationSubmit = (data: any) => {
    obligationMutation.mutate(data);
  };

  // Continue to next step
  const handleContinue = () => {
    onSubmit({ obligations });
  };

  // Render confidence badge if enabled
  const renderConfidenceBadge = (confidence: ConfidenceLevel) => {
    if (!showConfidence || !confidence) return null;
    
    return (
      <Tooltip 
        label={`AI confidence: ${confidence}`} 
        placement="top"
      >
        <Badge 
          ml={2} 
          colorScheme={getConfidenceColor(confidence)}
          fontSize="xs"
        >
          {confidence}
        </Badge>
      </Tooltip>
    );
  };

  return (
    <Box>
      <Flex justify="space-between" mb={4}>
        <Text fontSize="lg" fontWeight="bold">Contract Obligations</Text>
        <Button 
          leftIcon={<AddIcon />} 
          colorScheme="blue" 
          size="sm" 
          onClick={handleAddObligation}
        >
          Add Obligation
        </Button>
      </Flex>

      {obligations.length === 0 ? (
        <Box textAlign="center" py={8} bg="gray.50" borderRadius="md">
          <Text color="gray.500">No obligations added yet.</Text>
          <Button 
            mt={4} 
            colorScheme="blue" 
            size="sm" 
            leftIcon={<AddIcon />} 
            onClick={handleAddObligation}
          >
            Add Obligation
          </Button>
        </Box>
      ) : (
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Title</Th>
              <Th>Type</Th>
              <Th>Due Date</Th>
              <Th>Responsible Party</Th>
              <Th width="100px">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {obligations.map((obligation) => (
              <Tr key={obligation.id}>
                <Td>
                  {obligation.title}
                  {renderConfidenceBadge(obligation.confidenceLevel)}
                </Td>
                <Td>{obligation.obligationType}</Td>
                <Td>
                  {obligation.dueDate ? new Date(obligation.dueDate).toLocaleDateString() : 'N/A'}
                </Td>
                <Td>{obligation.responsibleParty || 'N/A'}</Td>
                <Td>
                  <Flex>
                    <IconButton
                      aria-label="Edit obligation"
                      icon={<EditIcon />}
                      size="sm"
                      mr={2}
                      onClick={() => handleEditObligation(obligation)}
                      variant="ghost"
                    />
                    <IconButton
                      aria-label="Delete obligation"
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleDeleteObligation(obligation.id)}
                      variant="ghost"
                    />
                  </Flex>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {/* Modal for adding/editing obligations */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingObligation ? 'Edit Obligation' : 'Add Obligation'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box as="form" id="obligation-form" onSubmit={handleSubmit(onObligationSubmit)}>
              <Stack spacing={4}>
                {/* Title */}
                <FormControl isRequired isInvalid={!!errors.title}>
                  <FormLabel>Title</FormLabel>
                  <Controller
                    name="title"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder="Enter obligation title" />
                    )}
                  />
                </FormControl>

                {/* Description */}
                <FormControl isRequired isInvalid={!!errors.description}>
                  <FormLabel>Description</FormLabel>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <Textarea 
                        {...field} 
                        placeholder="Enter detailed description of the obligation"
                        rows={3}
                      />
                    )}
                  />
                </FormControl>

                {/* Obligation Type */}
                <FormControl isRequired isInvalid={!!errors.obligationType}>
                  <FormLabel>Obligation Type</FormLabel>
                  <Controller
                    name="obligationType"
                    control={control}
                    render={({ field }) => (
                      <Select {...field}>
                        <option value="REPORTING">Reporting</option>
                        <option value="PAYMENT">Payment</option>
                        <option value="DISCLOSURE">Disclosure</option>
                        <option value="COMPLIANCE">Compliance</option>
                        <option value="OPERATIONAL">Operational</option>
                        <option value="OTHER">Other</option>
                      </Select>
                    )}
                  />
                </FormControl>

                {/* Responsible Party */}
                <FormControl isInvalid={!!errors.responsibleParty}>
                  <FormLabel>Responsible Party</FormLabel>
                  <Controller
                    name="responsibleParty"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder="Who is responsible for this obligation?" />
                    )}
                  />
                </FormControl>

                {/* Due Date */}
                <FormControl isInvalid={!!errors.dueDate}>
                  <FormLabel>Due Date</FormLabel>
                  <Controller
                    name="dueDate"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} type="date" />
                    )}
                  />
                </FormControl>

                {/* Recurring Pattern */}
                <FormControl isInvalid={!!errors.recurringPattern}>
                  <FormLabel>Recurring Pattern</FormLabel>
                  <Controller
                    name="recurringPattern"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} placeholder="Select if recurring">
                        <option value="DAILY">Daily</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="MONTHLY">Monthly</option>
                        <option value="QUARTERLY">Quarterly</option>
                        <option value="YEARLY">Yearly</option>
                      </Select>
                    )}
                  />
                </FormControl>
              </Stack>
            </Box>
          </ModalBody>

          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              type="submit"
              form="obligation-form"
              isLoading={obligationMutation.isPending || isSubmitting}
            >
              {editingObligation ? 'Update' : 'Add'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Continue button */}
      <Flex justify="flex-end" mt={8}>
        <Button 
          colorScheme="blue" 
          onClick={handleContinue}
        >
          Continue to Review
        </Button>
      </Flex>
    </Box>
  );
}