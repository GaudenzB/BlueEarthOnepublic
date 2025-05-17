import React from 'react';
import {
  Box,
  Button,
  Heading,
  Text,
  Flex,
  Grid,
  GridItem,
  Divider,
  Stack,
  List,
  ListItem,
  Badge,
  Card,
  CardHeader,
  CardBody
} from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';

// Interface for review form props
interface ContractReviewFormProps {
  contractData: any;
  obligations: any[];
  onSubmit: (data: any) => void;
}

export default function ContractReviewForm({
  contractData,
  obligations,
  onSubmit
}: ContractReviewFormProps) {
  // Format date display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  // Handle finalizing the contract
  const handleFinalize = () => {
    onSubmit({
      contractStatus: 'ACTIVE',
      ...contractData
    });
  };

  return (
    <Box>
      <Heading size="md" mb={6}>Review Contract Information</Heading>

      {/* Contract Details Section */}
      <Card mb={6}>
        <CardHeader bg="blue.50" py={3}>
          <Heading size="sm">Contract Details</Heading>
        </CardHeader>
        <CardBody>
          <Grid templateColumns="repeat(12, 1fr)" gap={4}>
            <GridItem colSpan={{ base: 12, md: 6 }}>
              <Text fontWeight="bold">Contract Type</Text>
              <Text>{contractData.contractType.replace('_', ' ')}</Text>
            </GridItem>
            <GridItem colSpan={{ base: 12, md: 6 }}>
              <Text fontWeight="bold">Contract Number</Text>
              <Text>{contractData.contractNumber || 'Not specified'}</Text>
            </GridItem>
            <GridItem colSpan={{ base: 12 }}>
              <Text fontWeight="bold">Counterparty</Text>
              <Text>{contractData.counterpartyName}</Text>
              {contractData.counterpartyContactEmail && (
                <Text fontSize="sm" color="blue.600">
                  {contractData.counterpartyContactEmail}
                </Text>
              )}
              {contractData.counterpartyAddress && (
                <Text fontSize="sm" color="gray.600" whiteSpace="pre-line">
                  {contractData.counterpartyAddress}
                </Text>
              )}
            </GridItem>
          </Grid>
        </CardBody>
      </Card>

      {/* Key Dates Section */}
      <Card mb={6}>
        <CardHeader bg="blue.50" py={3}>
          <Heading size="sm">Key Dates</Heading>
        </CardHeader>
        <CardBody>
          <Grid templateColumns="repeat(12, 1fr)" gap={4}>
            <GridItem colSpan={{ base: 12, md: 6, lg: 3 }}>
              <Text fontWeight="bold">Effective Date</Text>
              <Text>{formatDate(contractData.effectiveDate)}</Text>
            </GridItem>
            <GridItem colSpan={{ base: 12, md: 6, lg: 3 }}>
              <Text fontWeight="bold">Execution Date</Text>
              <Text>{formatDate(contractData.executionDate)}</Text>
            </GridItem>
            <GridItem colSpan={{ base: 12, md: 6, lg: 3 }}>
              <Text fontWeight="bold">Expiry Date</Text>
              <Text>{formatDate(contractData.expiryDate)}</Text>
            </GridItem>
            <GridItem colSpan={{ base: 12, md: 6, lg: 3 }}>
              <Text fontWeight="bold">Renewal Date</Text>
              <Text>{formatDate(contractData.renewalDate)}</Text>
            </GridItem>
          </Grid>
        </CardBody>
      </Card>

      {/* Financial Terms Section */}
      <Card mb={6}>
        <CardHeader bg="blue.50" py={3}>
          <Heading size="sm">Financial Terms</Heading>
        </CardHeader>
        <CardBody>
          <Grid templateColumns="repeat(12, 1fr)" gap={4}>
            <GridItem colSpan={{ base: 12, md: 6 }}>
              <Text fontWeight="bold">Total Value</Text>
              <Text>
                {contractData.totalValue
                  ? `${contractData.totalValue} ${contractData.currency || ''}`
                  : 'Not specified'}
              </Text>
            </GridItem>
            <GridItem colSpan={{ base: 12, md: 6 }}>
              <Text fontWeight="bold">Currency</Text>
              <Text>{contractData.currency || 'Not specified'}</Text>
            </GridItem>
          </Grid>
        </CardBody>
      </Card>

      {/* Obligations Section */}
      <Card mb={6}>
        <CardHeader bg="blue.50" py={3}>
          <Heading size="sm">Obligations ({obligations.length})</Heading>
        </CardHeader>
        <CardBody>
          {obligations.length === 0 ? (
            <Text color="gray.500">No obligations added to this contract.</Text>
          ) : (
            <List spacing={3}>
              {obligations.map((obligation, index) => (
                <ListItem key={obligation.id || index}>
                  <Flex justify="space-between" align="start">
                    <Box>
                      <Flex align="center">
                        <Text fontWeight="bold">{obligation.title}</Text>
                        <Badge ml={2} colorScheme={getObligationColorScheme(obligation.obligationType)}>
                          {obligation.obligationType}
                        </Badge>
                      </Flex>
                      <Text fontSize="sm" color="gray.600" mt={1}>
                        {obligation.description}
                      </Text>
                      {obligation.dueDate && (
                        <Text fontSize="sm" color="red.600" mt={1}>
                          Due: {formatDate(obligation.dueDate)}
                          {obligation.recurringPattern && ` (${obligation.recurringPattern})`}
                        </Text>
                      )}
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">
                        {obligation.responsibleParty || 'No responsible party'}
                      </Text>
                    </Box>
                  </Flex>
                  {index < obligations.length - 1 && <Divider mt={2} />}
                </ListItem>
              ))}
            </List>
          )}
        </CardBody>
      </Card>

      {/* Finalize Button */}
      <Flex justify="center" mt={8}>
        <Button
          colorScheme="green"
          size="lg"
          leftIcon={<CheckCircleIcon />}
          onClick={handleFinalize}
        >
          Finalize Contract
        </Button>
      </Flex>
    </Box>
  );
}

// Helper function to determine color scheme based on obligation type
function getObligationColorScheme(type: string): string {
  switch (type) {
    case 'REPORTING': return 'blue';
    case 'PAYMENT': return 'green';
    case 'DISCLOSURE': return 'purple';
    case 'COMPLIANCE': return 'orange';
    case 'OPERATIONAL': return 'cyan';
    default: return 'gray';
  }
}