import React from 'react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { CalendarIcon, Check } from 'lucide-react';

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
  const handleSubmit = () => {
    // Pass along existing data without changes for final submission
    onSubmit({});
  };
  
  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return format(new Date(dateString), 'PPP');
  };
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Review Contract Information</h3>
      
      <div className="rounded-md border p-4 space-y-6">
        <div>
          <h4 className="text-base font-semibold mb-3">Contract Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="block font-medium text-gray-500">Contract Type</span>
              <span>{contractData.contractType || 'Not specified'}</span>
            </div>
            <div>
              <span className="block font-medium text-gray-500">Contract Number</span>
              <span>{contractData.contractNumber || 'Not specified'}</span>
            </div>
            <div>
              <span className="block font-medium text-gray-500">Counterparty</span>
              <span>{contractData.counterpartyName || 'Not specified'}</span>
            </div>
            <div>
              <span className="block font-medium text-gray-500">Counterparty Address</span>
              <span>{contractData.counterpartyAddress || 'Not specified'}</span>
            </div>
            <div>
              <span className="block font-medium text-gray-500">Counterparty Email</span>
              <span>{contractData.counterpartyContactEmail || 'Not specified'}</span>
            </div>
            <div>
              <span className="block font-medium text-gray-500">Effective Date</span>
              <span>{formatDate(contractData.effectiveDate)}</span>
            </div>
            <div>
              <span className="block font-medium text-gray-500">Expiry Date</span>
              <span>{formatDate(contractData.expiryDate)}</span>
            </div>
            <div>
              <span className="block font-medium text-gray-500">Execution Date</span>
              <span>{formatDate(contractData.executionDate)}</span>
            </div>
            <div>
              <span className="block font-medium text-gray-500">Renewal Date</span>
              <span>{formatDate(contractData.renewalDate)}</span>
            </div>
            <div>
              <span className="block font-medium text-gray-500">Total Value</span>
              <span>
                {contractData.totalValue 
                  ? `${contractData.totalValue} ${contractData.currency}` 
                  : 'Not specified'}
              </span>
            </div>
          </div>
        </div>
        
        {obligations.length > 0 && (
          <div>
            <h4 className="text-base font-semibold mb-3">Obligations ({obligations.length})</h4>
            <div className="divide-y border rounded-md">
              {obligations.map((obligation, index) => (
                <div key={index} className="p-3">
                  <div className="font-medium">{obligation.title}</div>
                  {obligation.description && (
                    <div className="text-sm text-gray-600 mt-1">{obligation.description}</div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {obligation.dueDate && (
                      <div className="inline-flex items-center text-xs text-gray-600">
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        Due: {format(new Date(obligation.dueDate), "PPP")}
                      </div>
                    )}
                    <div 
                      className={`px-2 py-0.5 rounded text-xs ${
                        obligation.priority === 'LOW' ? 'bg-gray-100 text-gray-800' :
                        obligation.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
                        obligation.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}
                    >
                      {obligation.priority}
                    </div>
                    <div 
                      className={`px-2 py-0.5 rounded text-xs ${
                        obligation.status === 'PENDING' ? 'bg-gray-100 text-gray-800' :
                        obligation.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        obligation.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        obligation.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {obligation.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
        <div className="flex">
          <div className="flex-shrink-0">
            <Check className="h-5 w-5 text-blue-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Ready to Submit</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                By clicking "Submit Contract", this contract will be saved and you'll be redirected to the contract details page.
                You can make additional edits to the contract from there.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button onClick={handleSubmit}>
          Submit Contract
        </Button>
      </div>
    </div>
  );
}