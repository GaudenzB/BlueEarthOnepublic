import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Flex, 
  Heading, 
  Text, 
  HStack,
  useToast
} from '@chakra-ui/react';
import { Card, CardBody, CardHeader, CardFooter } from '@chakra-ui/react';
import {
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useSteps,
} from '@chakra-ui/stepper';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

// Import Document Viewer (will need to update path if this doesn't exist)
import { DocumentViewer } from '../../documents/client/components/DocumentViewer';

// Import steps
import ContractDetailsForm from '../components/ContractDetailsForm';
import ContractObligationsForm from '../components/ContractObligationsForm';
import ContractReviewForm from '../components/ContractReviewForm';

// Feature flag check
const isContractsEnabled = () => {
  return process.env.ENABLE_CONTRACTS === 'true';
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
  const navigate = useNavigate();
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
  
  // Get contract data if it exists for this document
  const contractQuery = useQuery({
    queryKey: ['/api/contracts/document', documentId],
    queryFn: async () => {
      if (!documentId) return null;
      return apiRequest(`/api/contracts/document/${documentId}`);
    },
    enabled: !!documentId,
    onSuccess: (data) => {
      if (data?.success && data?.data) {
        // Pre-fill with existing data
        setContractData(prev => ({
          ...prev,
          ...data.data,
        }));
        
        // Fetch obligations if contract exists
        if (data.data.id) {
          obligationsQuery.refetch();
        }
      }
    }
  });
  
  // Get obligations if contract exists
  const obligationsQuery = useQuery({
    queryKey: ['/api/contracts', contractData.id, 'obligations'],
    queryFn: async () => {
      if (!contractData.id) return null;
      return apiRequest(`/api/contracts/${contractData.id}/obligations`);
    },
    enabled: !!contractData.id,
    onSuccess: (data) => {
      if (data?.success && data?.data) {
        setObligations(data.data);
      }
    }
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
          navigate(`/contracts/${data.data.id}`);
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
    navigate('/contracts');
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
  if (documentId && (documentQuery.isLoading || contractQuery.isLoading)) {
    return (
      <Box p={8} textAlign="center">
        <Text>Loading contract information...</Text>
      </Box>
    );
  }
  
  return (
    <Flex direction={{ base: 'column', lg: 'row' }} gap={4} p={4}>
      {/* Document viewer panel */}
      {documentId && (
        <Box width={{ base: '100%', lg: '50%' }} mb={{ base: 4, lg: 0 }}>
          <Card height="calc(100vh - 150px)" overflow="hidden">
            <CardHeader>
              <Heading size="md">Document Viewer</Heading>
            </CardHeader>
            <CardBody p={0} overflow="auto">
              <DocumentViewer 
                documentId={documentId} 
                readOnly={true} 
              />
            </CardBody>
          </Card>
        </Box>
      )}
      
      {/* Wizard panel */}
      <Box width={{ base: '100%', lg: documentId ? '50%' : '100%' }}>
        <Card>
          <CardHeader>
            <Heading size="md">
              {contractData.id ? 'Edit Contract' : 'New Contract'}
            </Heading>
            
            {/* Stepper */}
            <Stepper
              mt={6}
              colorScheme="blue"
              size="sm"
              index={activeStep}
            >
              {steps.map((step, index) => (
                <Step key={index}>
                  <StepIndicator>
                    <StepStatus
                      complete={index < activeStep ? "✓" : undefined}
                      incomplete={index > activeStep ? "○" : undefined}
                      active={index === activeStep ? "●" : undefined}
                    />
                  </StepIndicator>
                  <Box flexShrink={0}>
                    <StepTitle>{step.title}</StepTitle>
                    <StepDescription>{step.description}</StepDescription>
                  </Box>
                  <StepSeparator />
                </Step>
              ))}
            </Stepper>
          </CardHeader>
          
          <CardBody>
            {renderStepContent()}
          </CardBody>
          
          <CardFooter>
            <Flex width="100%" justify="space-between">
              <Button onClick={handleCancel} variant="outline">
                Cancel
              </Button>
              <Stack direction="row" spacing={4}>
                {activeStep > 0 && (
                  <Button onClick={handleBack} variant="outline">
                    Back
                  </Button>
                )}
                {/* Next/Submit buttons are handled within each step component */}
              </Stack>
            </Flex>
          </CardFooter>
        </Card>
      </Box>
    </Flex>
  );
}