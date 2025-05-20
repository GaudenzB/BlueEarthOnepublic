import React from 'react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not specified';
    try {
      return format(parseISO(dateString), 'PPP');
    } catch (error) {
      return dateString;
    }
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

  // Handle submission
  const handleSubmit = () => {
    onSubmit({
      contractData,
      obligations
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review Contract Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="font-medium text-gray-700">Contract Type</h3>
              <p>{contractData.contractType || 'Not specified'}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Contract Number</h3>
              <p>{contractData.contractNumber || 'Not specified'}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Counterparty</h3>
              <p>{contractData.counterpartyName || 'Not specified'}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Counterparty Address</h3>
              <p>{contractData.counterpartyAddress || 'Not specified'}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Counterparty Email</h3>
              <p>{contractData.counterpartyContactEmail || 'Not specified'}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Effective Date</h3>
              <p>{formatDate(contractData.effectiveDate)}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Expiry Date</h3>
              <p>{formatDate(contractData.expiryDate)}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Execution Date</h3>
              <p>{formatDate(contractData.executionDate)}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Renewal Date</h3>
              <p>{formatDate(contractData.renewalDate)}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Total Value</h3>
              <p>
                {contractData.totalValue 
                  ? `${contractData.totalValue} ${contractData.currency || ''}` 
                  : 'Not specified'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Review Obligations</CardTitle>
        </CardHeader>
        <CardContent>
          {obligations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Responsible</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {obligations.map((obligation, index) => (
                  <TableRow key={obligation.id || index}>
                    <TableCell>{obligation.title}</TableCell>
                    <TableCell>{obligation.obligationType}</TableCell>
                    <TableCell>{obligation.responsibleParty}</TableCell>
                    <TableCell>{formatDate(obligation.dueDate)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(obligation.status)}>
                        {obligation.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-4 border border-dashed rounded-md text-center">
              <p className="text-muted-foreground">No obligations added</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit} 
          className="px-6"
        >
          Finalize Contract
        </Button>
      </div>
    </div>
  );
}