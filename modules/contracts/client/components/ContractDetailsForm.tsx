import React, { useEffect } from 'react';
import { 
  Box, 
  Button, 
  FormControl, 
  FormLabel, 
  Input, 
  Select, 
  Stack, 
  Textarea,
  Flex,
  Badge,
  Tooltip,
  Grid,
  GridItem
} from '@chakra-ui/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Form schema based on the contract schema
const contractDetailsSchema = z.object({
  contractType: z.enum([
    'LPA',
    'SUBSCRIPTION_AGREEMENT',
    'SIDE_LETTER',
    'AMENDMENT',
    'NDA',
    'SERVICE_AGREEMENT',
    'OTHER'
  ]),
  contractNumber: z.string().optional(),
  counterpartyName: z.string().min(1, "Counterparty name is required"),
  counterpartyAddress: z.string().optional(),
  counterpartyContactEmail: z.string().email("Invalid email format").optional().nullable(),
  effectiveDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  executionDate: z.string().optional().nullable(),
  renewalDate: z.string().optional().nullable(),
  totalValue: z.string().optional(),
  currency: z.string().optional(),
});

// Type alias for confidence levels
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

// Interface for form props
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
  // Default form values from contract data
  const defaultValues = {
    contractType: contractData.contractType || 'OTHER',
    contractNumber: contractData.contractNumber || '',
    counterpartyName: contractData.counterpartyName || '',
    counterpartyAddress: contractData.counterpartyAddress || '',
    counterpartyContactEmail: contractData.counterpartyContactEmail || '',
    effectiveDate: contractData.effectiveDate ? new Date(contractData.effectiveDate).toISOString().split('T')[0] : '',
    expiryDate: contractData.expiryDate ? new Date(contractData.expiryDate).toISOString().split('T')[0] : '',
    executionDate: contractData.executionDate ? new Date(contractData.executionDate).toISOString().split('T')[0] : '',
    renewalDate: contractData.renewalDate ? new Date(contractData.renewalDate).toISOString().split('T')[0] : '',
    totalValue: contractData.totalValue || '',
    currency: contractData.currency || '',
  };
  
  // Confidence levels from AI extraction
  const confidenceLevels: Record<string, ConfidenceLevel> = {
    contractType: contractData.confidenceLevel || null,
    contractNumber: null,
    counterpartyName: null,
    counterpartyAddress: null,
    counterpartyContactEmail: null,
    effectiveDate: null,
    expiryDate: null,
    executionDate: null,
    renewalDate: null,
    totalValue: null,
    currency: null,
  };
  
  // Try to extract field-level confidence from raw extraction data
  if (contractData.rawExtraction?.metadata?.sourceReferences) {
    const refs = contractData.rawExtraction.metadata.sourceReferences;
    
    // Map field names to confidence levels if available
    Object.keys(refs).forEach(key => {
      const normalizedKey = key.toLowerCase();
      
      if (normalizedKey.includes('type')) confidenceLevels.contractType = contractData.confidenceLevel;
      if (normalizedKey.includes('number')) confidenceLevels.contractNumber = contractData.confidenceLevel;
      if (normalizedKey.includes('party') || normalizedKey.includes('counterparty')) 
        confidenceLevels.counterpartyName = contractData.confidenceLevel;
      if (normalizedKey.includes('address')) 
        confidenceLevels.counterpartyAddress = contractData.confidenceLevel;
      if (normalizedKey.includes('email') || normalizedKey.includes('contact')) 
        confidenceLevels.counterpartyContactEmail = contractData.confidenceLevel;
      if (normalizedKey.includes('effective')) 
        confidenceLevels.effectiveDate = contractData.confidenceLevel;
      if (normalizedKey.includes('expiry') || normalizedKey.includes('expiration')) 
        confidenceLevels.expiryDate = contractData.confidenceLevel;
      if (normalizedKey.includes('execution') || normalizedKey.includes('signed')) 
        confidenceLevels.executionDate = contractData.confidenceLevel;
      if (normalizedKey.includes('renewal')) 
        confidenceLevels.renewalDate = contractData.confidenceLevel;
      if (normalizedKey.includes('value') || normalizedKey.includes('amount')) 
        confidenceLevels.totalValue = contractData.confidenceLevel;
      if (normalizedKey.includes('currency')) 
        confidenceLevels.currency = contractData.confidenceLevel;
    });
  }
  
  // React Hook Form setup
  const { 
    control, 
    handleSubmit, 
    reset,
    formState: { errors, isSubmitting } 
  } = useForm({
    defaultValues,
    resolver: zodResolver(contractDetailsSchema)
  });
  
  // Reset form when contract data changes
  useEffect(() => {
    reset(defaultValues);
  }, [contractData]);
  
  // Submit handler
  const onFormSubmit = (data: any) => {
    // Format date fields for API
    const formattedData = {
      ...data,
      // Add any additional processing needed
    };
    
    onSubmit(formattedData);
  };
  
  // Render confidence badge if enabled
  const renderConfidenceBadge = (field: string) => {
    if (!showConfidence) return null;
    
    const confidence = confidenceLevels[field];
    if (!confidence) return null;
    
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
    <Box as="form" onSubmit={handleSubmit(onFormSubmit)}>
      <Grid templateColumns="repeat(12, 1fr)" gap={6}>
        {/* Contract Type */}
        <GridItem colSpan={{ base: 12, md: 6 }}>
          <FormControl isInvalid={!!errors.contractType}>
            <FormLabel>
              Contract Type {renderConfidenceBadge('contractType')}
            </FormLabel>
            <Controller
              name="contractType"
              control={control}
              render={({ field }) => (
                <Select {...field}>
                  <option value="LPA">Limited Partnership Agreement (LPA)</option>
                  <option value="SUBSCRIPTION_AGREEMENT">Subscription Agreement</option>
                  <option value="SIDE_LETTER">Side Letter</option>
                  <option value="AMENDMENT">Amendment</option>
                  <option value="NDA">Non-Disclosure Agreement</option>
                  <option value="SERVICE_AGREEMENT">Service Agreement</option>
                  <option value="OTHER">Other</option>
                </Select>
              )}
            />
          </FormControl>
        </GridItem>
        
        {/* Contract Number */}
        <GridItem colSpan={{ base: 12, md: 6 }}>
          <FormControl isInvalid={!!errors.contractNumber}>
            <FormLabel>
              Contract Number {renderConfidenceBadge('contractNumber')}
            </FormLabel>
            <Controller
              name="contractNumber"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter contract reference number" />
              )}
            />
          </FormControl>
        </GridItem>
        
        {/* Counterparty Name */}
        <GridItem colSpan={{ base: 12, md: 6 }}>
          <FormControl isRequired isInvalid={!!errors.counterpartyName}>
            <FormLabel>
              Counterparty Name {renderConfidenceBadge('counterpartyName')}
            </FormLabel>
            <Controller
              name="counterpartyName"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter counterparty name" />
              )}
            />
          </FormControl>
        </GridItem>
        
        {/* Counterparty Email */}
        <GridItem colSpan={{ base: 12, md: 6 }}>
          <FormControl isInvalid={!!errors.counterpartyContactEmail}>
            <FormLabel>
              Counterparty Email {renderConfidenceBadge('counterpartyContactEmail')}
            </FormLabel>
            <Controller
              name="counterpartyContactEmail"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter counterparty contact email" type="email" />
              )}
            />
          </FormControl>
        </GridItem>
        
        {/* Counterparty Address */}
        <GridItem colSpan={12}>
          <FormControl isInvalid={!!errors.counterpartyAddress}>
            <FormLabel>
              Counterparty Address {renderConfidenceBadge('counterpartyAddress')}
            </FormLabel>
            <Controller
              name="counterpartyAddress"
              control={control}
              render={({ field }) => (
                <Textarea {...field} placeholder="Enter counterparty address" rows={3} />
              )}
            />
          </FormControl>
        </GridItem>
        
        {/* Effective Date */}
        <GridItem colSpan={{ base: 12, md: 6 }}>
          <FormControl isInvalid={!!errors.effectiveDate}>
            <FormLabel>
              Effective Date {renderConfidenceBadge('effectiveDate')}
            </FormLabel>
            <Controller
              name="effectiveDate"
              control={control}
              render={({ field }) => (
                <Input {...field} type="date" />
              )}
            />
          </FormControl>
        </GridItem>
        
        {/* Expiry Date */}
        <GridItem colSpan={{ base: 12, md: 6 }}>
          <FormControl isInvalid={!!errors.expiryDate}>
            <FormLabel>
              Expiry Date {renderConfidenceBadge('expiryDate')}
            </FormLabel>
            <Controller
              name="expiryDate"
              control={control}
              render={({ field }) => (
                <Input {...field} type="date" />
              )}
            />
          </FormControl>
        </GridItem>
        
        {/* Execution Date */}
        <GridItem colSpan={{ base: 12, md: 6 }}>
          <FormControl isInvalid={!!errors.executionDate}>
            <FormLabel>
              Execution Date {renderConfidenceBadge('executionDate')}
            </FormLabel>
            <Controller
              name="executionDate"
              control={control}
              render={({ field }) => (
                <Input {...field} type="date" />
              )}
            />
          </FormControl>
        </GridItem>
        
        {/* Renewal Date */}
        <GridItem colSpan={{ base: 12, md: 6 }}>
          <FormControl isInvalid={!!errors.renewalDate}>
            <FormLabel>
              Renewal Date {renderConfidenceBadge('renewalDate')}
            </FormLabel>
            <Controller
              name="renewalDate"
              control={control}
              render={({ field }) => (
                <Input {...field} type="date" />
              )}
            />
          </FormControl>
        </GridItem>
        
        {/* Total Value */}
        <GridItem colSpan={{ base: 12, md: 6 }}>
          <FormControl isInvalid={!!errors.totalValue}>
            <FormLabel>
              Total Value {renderConfidenceBadge('totalValue')}
            </FormLabel>
            <Controller
              name="totalValue"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter total value" />
              )}
            />
          </FormControl>
        </GridItem>
        
        {/* Currency */}
        <GridItem colSpan={{ base: 12, md: 6 }}>
          <FormControl isInvalid={!!errors.currency}>
            <FormLabel>
              Currency {renderConfidenceBadge('currency')}
            </FormLabel>
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <Select {...field} placeholder="Select currency">
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CHF">CHF - Swiss Franc</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                  <option value="CNY">CNY - Chinese Yuan</option>
                </Select>
              )}
            />
          </FormControl>
        </GridItem>
      </Grid>
      
      <Flex justify="flex-end" mt={8}>
        <Button 
          type="submit" 
          colorScheme="blue" 
          isLoading={isSubmitting}
          loadingText="Saving"
        >
          Save & Continue
        </Button>
      </Flex>
    </Box>
  );
}