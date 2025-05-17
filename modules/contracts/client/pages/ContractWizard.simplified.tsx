import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Flex, 
  Heading, 
  Text,
  Stack,
  useToast,
} from '@chakra-ui/react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

// Import steps
import ContractDetailsForm from '../components/ContractDetailsForm';
import ContractObligationsForm from '../components/ContractObligationsForm';
import ContractReviewForm from '../components/ContractReviewForm';

// Feature flag check
const isContractsEnabled = () => {
  return import.meta.env.ENABLE_CONTRACTS === 'true';
};

// Steps for the wizard
const steps = [
  { title: 'Contract Details', description: 'Basic contract information' },
  { title: 'Obligations', description: 'Key obligations and deadlines' },
  { title: 'Review & Submit', description: 'Review and finalize' }
];

interface ContractWizardProps {
  documentId?: string;
  showConfidence?: boolean; // Will be implemented in M3
}

export default function ContractWizard({ documentId, showConfidence = false }: ContractWizardProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [location, setLocation] = useLocation();
  const toast = useToast();
  
  // State for contract being created
  const [contractData, setContractData] = useState<any>({
    documentId: documentId || '',
    contractType: 'OTHER',
    contractStatus: 'DRAFT',
    contractNumber: '',
    counterpartyName: '',
    counterpartyAddress: '',
    counterpartyContactEmail: '',
    effectiveDate: null,
    expiryDate: null,
    executionDate: null,
    renewalDate: null,
    totalValue: '',
    currency: '',
    customMetadata: {}
  });
  
  // Obligations state
  const [obligations, setObligations] = useState<any[]>([]);
  
  // Get document data if documentId is provided
  const documentQuery = useQuery({
    queryKey: ['/api/documents', documentId],
    queryFn: async () => {
      if (!documentId) return null;
      return apiRequest(`/api/documents/${documentId}`);
    },
    enabled: !!documentId
  });
  
  // Create contract mutation
  const createContractMutation = useMutation({
    mutationFn: async (data: any) => {
      if (contractData.id) {
        // Update existing contract
        return apiRequest(`/api/contracts/${contractData.id}`, {
          method: 'PATCH',
          body: JSON.stringify(data)
        });
      } else {
        // Create new contract
        return apiRequest('/api/contracts', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      }
    },
    onSuccess: (data) => {
      if (data?.success) {
        toast({
          title: contractData.id ? 'Contract updated' : 'Contract created',
          description: 'Contract has been saved successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Update contract ID if this was a new contract
        if (!contractData.id && data.data?.id) {
          setContractData(prev => ({
            ...prev,
            id: data.data.id
          }));
        }
        
        // Move to next step or complete
        if (activeStep < steps.length - 1) {
          setActiveStep(activeStep + 1);
        } else {
          // Navigate to contract details page
          setLocation(`/contracts/${data.data.id}`);
        }
        
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to save contract. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error('Contract save error:', error);
    }
  });
  
  // Handle advancing to next step
  const handleNext = (stepData: any) => {
    const updatedData = {
      ...contractData,
      ...stepData
    };
    setContractData(updatedData);
    
    // If this is the final step, submit the contract
    if (activeStep === steps.length - 1) {
      createContractMutation.mutate(updatedData);
    } else {
      // Save progress
      if (activeStep === 0) {
        // Save contract details
        createContractMutation.mutate(updatedData);
      } else {
        // For other steps just advance
        setActiveStep(activeStep + 1);
      }
    }
  };
  
  // Handle going back to previous step
  const handleBack = () => {
    setActiveStep(Math.max(0, activeStep - 1));
  };
  
  // Handle cancel - go back to contracts list
  const handleCancel = () => {
    setLocation('/contracts');
  };
  
  // Render active step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <ContractDetailsForm 
            contractData={contractData}
            documentData={documentQuery.data?.data}
            showConfidence={showConfidence}
            onSubmit={handleNext}
          />
        );
      case 1:
        return (
          <ContractObligationsForm
            contractId={contractData.id}
            obligations={obligations}
            setObligations={setObligations}
            showConfidence={showConfidence}
            onSubmit={handleNext}
          />
        );
      case 2:
        return (
          <ContractReviewForm
            contractData={contractData}
            obligations={obligations}
            onSubmit={handleNext}
          />
        );
      default:
        return <div>Unknown step</div>;
    }
  };
  
  // Feature flag check
  if (!isContractsEnabled()) {
    return (
      <Box p={8} textAlign="center">
        <Heading size="md">Contract Management</Heading>
        <Text mt={4}>Contract management is not enabled in this environment.</Text>
      </Box>
    );
  }
  
  // Loading state
  if (documentId && documentQuery.isLoading) {
    return (
      <Box p={8} textAlign="center">
        <Text>Loading contract information...</Text>
      </Box>
    );
  }
  
  return (
    <Flex direction="column" p={4}>
      <Box mb={6}>
        <Heading size="md" mb={2}>
          {contractData.id ? 'Edit Contract' : 'New Contract'}
        </Heading>
        
        {/* Simple Stepper */}
        <Flex mt={6} mb={6} justifyContent="space-between">
          {steps.map((step, index) => (
            <Box 
              key={index} 
              textAlign="center" 
              p={2} 
              borderWidth={index === activeStep ? 2 : 1}
              borderColor={index === activeStep ? "blue.500" : "gray.200"}
              borderRadius="md"
              bg={index < activeStep ? "blue.50" : "white"}
              flex="1"
              mx={1}
            >
              <Box 
                width="24px" 
                height="24px" 
                borderRadius="50%" 
                bg={index <= activeStep ? "blue.500" : "gray.200"}
                color="white"
                display="flex"
                alignItems="center"
                justifyContent="center"
                margin="0 auto"
                mb={2}
              >
                {index < activeStep ? "✓" : index + 1}
              </Box>
              <Text fontWeight="bold">{step.title}</Text>
              <Text fontSize="sm" color="gray.600">{step.description}</Text>
            </Box>
          ))}
        </Flex>
      </Box>
      
      <Box bg="white" p={6} borderRadius="md" borderWidth="1px" mb={4}>
        {renderStepContent()}
      </Box>
      
      <Flex width="100%" justify="space-between" mt={4}>
        <Button onClick={handleCancel} variant="outline">
          Cancel
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} variant="outline">
            Back
          </Button>
        )}
        {/* Next/Submit buttons are handled within each step component */}
      </Flex>
    </Flex>
  );
}