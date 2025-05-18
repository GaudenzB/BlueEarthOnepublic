import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Import steps - using relative imports without explicit file extensions
import ContractDetailsForm from '../components/ContractDetailsForm.shadcn';
import ContractObligationsForm from '../components/ContractObligationsForm.shadcn';
import ContractReviewForm from '../components/ContractReviewForm.shadcn';

// Feature flag check
const isContractsEnabled = () => {
  // Feature is always enabled in development (for testing purposes)
  if (import.meta.env.MODE === 'development') {
    return true;
  }
  
  // Use the standard VITE_ENABLE_CONTRACTS flag for consistency
  return import.meta.env.VITE_ENABLE_CONTRACTS === 'true';
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
  const { toast } = useToast();
  
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
      console.log('Contract saved successfully:', data);
      
      // Always consider a successful API response as success
      toast({
        title: contractData.id ? 'Contract updated' : 'Contract created',
        description: 'Contract has been saved successfully',
        variant: 'default',
      });
      
      // Update contract ID if this was a new contract
      const contractId = data?.data?.id || (data?.data ? data.data : null);
      if (!contractData.id && contractId) {
        setContractData(prev => ({
          ...prev,
          id: contractId
        }));
        
        // In development mode, log the contract ID
        console.log('Set contract ID to:', contractId);
      }
      
      // Move to next step or complete
      if (activeStep < steps.length - 1) {
        console.log('Moving to next step:', activeStep + 1);
        setActiveStep(activeStep + 1);
      } else {
        // Navigate to contract list page instead of detail page
        // This ensures users can see all contracts after creation
        console.log('Navigating to contract list');
        setLocation('/contracts');
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
    },
    onError: (error: any) => {
      // Try to extract detailed error message from the response
      let errorMsg = 'Failed to save contract. Please try again.';
      
      if (error.response?.data) {
        // If server returned a structured error response
        const serverError = error.response.data;
        if (serverError.error) {
          errorMsg = `Error: ${serverError.error}`;
          
          // If there's a detailed error message in the response
          if (serverError.detail) {
            errorMsg += ` (${serverError.detail})`;
          } else if (serverError.code) {
            errorMsg += ` (Code: ${serverError.code})`;
          }
        } else if (serverError.message) {
          errorMsg = serverError.message;
        }
      }
      
      toast({
        title: 'Contract Save Error',
        description: errorMsg,
        variant: 'destructive',
      });
      
      // Log complete error details to console for debugging
      console.error('Contract save error:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
      }
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
        // Note: the advancement to the next step is now handled in the onSuccess callback
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
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold">Contract Management</h2>
        <p className="mt-4">Contract management is not enabled in this environment.</p>
      </div>
    );
  }
  
  // Loading state
  if (documentId && documentQuery.isLoading) {
    return (
      <div className="p-8 text-center">
        <p>Loading contract information...</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col p-4">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          {contractData.id ? 'Edit Contract' : 'New Contract'}
        </h2>
        
        {/* Simple Stepper */}
        <div className="flex justify-between mt-6 mb-6">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={`text-center p-2 border rounded-md flex-1 mx-1 ${
                index === activeStep 
                  ? 'border-2 border-blue-500' 
                  : 'border-gray-200'
              } ${
                index < activeStep ? 'bg-blue-50' : 'bg-white'
              }`}
            >
              <div 
                className={`w-6 h-6 rounded-full ${
                  index <= activeStep ? 'bg-blue-500' : 'bg-gray-200'
                } text-white flex items-center justify-center mx-auto mb-2`}
              >
                {index < activeStep ? "✓" : index + 1}
              </div>
              <div className="font-bold">{step.title}</div>
              <div className="text-sm text-gray-600">{step.description}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-md border mb-4">
        {renderStepContent()}
      </div>
      
      <div className="flex justify-between mt-4">
        <button 
          onClick={handleCancel}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        {activeStep > 0 && (
          <button 
            onClick={handleBack}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back
          </button>
        )}
        {/* Next/Submit buttons are handled within each step component */}
      </div>
    </div>
  );
}