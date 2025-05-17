import React, { useState } from 'react';
import {
  Box,
  Button,
  Heading,
  Text,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  Input,
  Select,
  IconButton,
  useToast,
  Card,
  CardHeader,
  CardBody,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Link
} from '@chakra-ui/react';
import { AddIcon, SearchIcon, ChevronDownIcon, ViewIcon, EditIcon } from '@chakra-ui/icons';
import { Link as WouterLink, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Feature flag check
const isContractsEnabled = () => {
  return process.env.ENABLE_CONTRACTS === 'true';
};

// Helper to determine badge color based on contract status
const getStatusColor = (status: string) => {
  switch (status) {
    case 'DRAFT': return 'gray';
    case 'UNDER_REVIEW': return 'yellow';
    case 'ACTIVE': return 'green';
    case 'EXPIRED': return 'red';
    case 'TERMINATED': return 'purple';
    case 'RENEWED': return 'blue';
    default: return 'gray';
  }
};

export default function ContractList() {
  const [location, setLocation] = useLocation();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Fetch contracts
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['/api/contracts'],
    queryFn: async () => {
      return apiRequest('/api/contracts');
    }
  });
  
  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Apply filters to the contracts list
  const filteredContracts = React.useMemo(() => {
    if (!data?.data) return [];
    
    let filtered = data.data;
    
    // Apply text search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((contract: any) =>
        (contract.contractNumber && contract.contractNumber.toLowerCase().includes(query)) ||
        (contract.counterpartyName && contract.counterpartyName.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((contract: any) => 
        contract.contractStatus === statusFilter
      );
    }
    
    // Apply type filter
    if (typeFilter) {
      filtered = filtered.filter((contract: any) => 
        contract.contractType === typeFilter
      );
    }
    
    return filtered;
  }, [data?.data, searchQuery, statusFilter, typeFilter]);
  
  // Navigate to add contract page
  const handleAddContract = () => {
    setLocation('/contracts/new');
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
  
  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Contracts</Heading>
        <Button 
          leftIcon={<AddIcon />} 
          colorScheme="blue"
          onClick={handleAddContract}
        >
          New Contract
        </Button>
      </Flex>
      
      {/* Filters */}
      <Card mb={6}>
        <CardBody>
          <Flex 
            direction={{ base: 'column', md: 'row' }} 
            gap={4} 
            justify="space-between"
            align={{ base: 'stretch', md: 'center' }}
          >
            <Box flex="2">
              <Input
                placeholder="Search by contract number or counterparty..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftElement={<SearchIcon color="gray.300" />}
              />
            </Box>
            
            <HStack spacing={4} flex="1">
              <Select 
                placeholder="All Statuses" 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                size="md"
              >
                <option value="DRAFT">Draft</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="TERMINATED">Terminated</option>
                <option value="RENEWED">Renewed</option>
              </Select>
              
              <Select 
                placeholder="All Types" 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                size="md"
              >
                <option value="LPA">LPA</option>
                <option value="SUBSCRIPTION_AGREEMENT">Subscription</option>
                <option value="SIDE_LETTER">Side Letter</option>
                <option value="AMENDMENT">Amendment</option>
                <option value="NDA">NDA</option>
                <option value="SERVICE_AGREEMENT">Service</option>
                <option value="OTHER">Other</option>
              </Select>
            </HStack>
          </Flex>
        </CardBody>
      </Card>
      
      {/* Contract List */}
      <Card>
        <CardHeader pb={0}>
          <Text fontWeight="medium">
            {filteredContracts.length} {filteredContracts.length === 1 ? 'Contract' : 'Contracts'}
          </Text>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <Flex justify="center" py={8}>
              <Spinner />
            </Flex>
          ) : isError ? (
            <Box textAlign="center" py={8}>
              <Text color="red.500">Error loading contracts.</Text>
              <Text mt={2}>{(error as Error)?.message || 'Unknown error'}</Text>
            </Box>
          ) : filteredContracts.length === 0 ? (
            <Box textAlign="center" py={8}>
              {data?.data && data.data.length === 0 ? (
                <>
                  <Text color="gray.500">No contracts found.</Text>
                  <Button 
                    mt={4} 
                    leftIcon={<AddIcon />} 
                    colorScheme="blue" 
                    size="sm"
                    onClick={handleAddContract}
                  >
                    Add Your First Contract
                  </Button>
                </>
              ) : (
                <Text color="gray.500">No contracts match your filters.</Text>
              )}
            </Box>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Contract Number</Th>
                    <Th>Counterparty</Th>
                    <Th>Type</Th>
                    <Th>Status</Th>
                    <Th>Effective Date</Th>
                    <Th>Expiry Date</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredContracts.map((contract: any) => (
                    <Tr key={contract.id}>
                      <Td>
                        <WouterLink href={`/contracts/${contract.id}`}>
                          <Link color="blue.600" fontWeight="medium">
                            {contract.contractNumber || '(No Number)'}
                          </Link>
                        </WouterLink>
                      </Td>
                      <Td>{contract.counterpartyName || '—'}</Td>
                      <Td>
                        {contract.contractType === 'OTHER' ? 'Other' : 
                         contract.contractType?.replace('_', ' ') || '—'}
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(contract.contractStatus)}>
                          {contract.contractStatus.replace('_', ' ')}
                        </Badge>
                      </Td>
                      <Td>{formatDate(contract.effectiveDate)}</Td>
                      <Td>{formatDate(contract.expiryDate)}</Td>
                      <Td>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<ChevronDownIcon />}
                            variant="ghost"
                            size="sm"
                            aria-label="Actions"
                          />
                          <MenuList>
                            <MenuItem 
                              icon={<ViewIcon />}
                              as={WouterLink}
                              href={`/contracts/${contract.id}`}
                            >
                              View Details
                            </MenuItem>
                            <MenuItem 
                              icon={<EditIcon />}
                              as={WouterLink}
                              href={`/contracts/${contract.id}/edit`}
                            >
                              Edit Contract
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </CardBody>
      </Card>
    </Box>
  );
}