import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { FileText, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';

// Feature flag check
const isContractsEnabled = () => {
  return import.meta.env['ENABLE_CONTRACTS'] === 'true';
};

export default function ContractList() {
  // Get contract data
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/contracts'],
    queryFn: async () => {
      return apiRequest('/api/contracts');
    }
  });

  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <p>Loading contracts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-red-600">Error</h2>
        <p className="mt-4">Failed to load contracts. Please try again later.</p>
      </div>
    );
  }

  const contracts = data?.data || [];

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contract Management</h1>
        <Link href="/contracts/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Contract
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contracts</CardTitle>
        </CardHeader>
        <CardContent>
          {contracts.length > 0 ? (
            <Table>
              <TableCaption>List of all contracts</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract Type</TableHead>
                  <TableHead>Contract Number</TableHead>
                  <TableHead>Counterparty</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract: any) => (
                  <TableRow key={contract.id}>
                    <TableCell>{contract.contractType}</TableCell>
                    <TableCell>{contract.contractNumber || 'N/A'}</TableCell>
                    <TableCell>{contract.counterpartyName}</TableCell>
                    <TableCell>{formatDate(contract.effectiveDate)}</TableCell>
                    <TableCell>{formatDate(contract.expiryDate)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(contract.contractStatus)}>
                        {contract.contractStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/contracts/${contract.id}`}>
                        <Button variant="ghost" size="sm" className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center border border-dashed rounded-md">
              <FileText className="h-8 w-8 mx-auto mb-3 text-gray-400" />
              <p className="text-muted-foreground mb-4">No contracts found</p>
              <Link href="/contracts/new">
                <Button variant="outline">Create your first contract</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}