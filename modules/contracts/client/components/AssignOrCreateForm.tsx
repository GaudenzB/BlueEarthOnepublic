import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { CalendarIcon, InfoIcon, ArrowLeftIcon, CheckCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';

interface AnalysisResult {
  id: string;
  vendor: string | null;
  contractTitle: string | null;
  docType: string | null;
  effectiveDate: string | null;
  terminationDate: string | null;
  confidence: Record<string, number>;
  suggestedContractId?: string;
  documentId?: string;
}

interface AssignOrCreateFormProps {
  analysisResult: AnalysisResult;
  documentId: string;
  onReset: () => void;
}

export default function AssignOrCreateForm({ analysisResult, documentId, onReset }: AssignOrCreateFormProps) {
  const { toast } = useToast();
  // Using location for navigation
  const [, setLocation] = useLocation();
  const [contractData, setContractData] = useState({
    title: analysisResult.contractTitle || '',
    vendor: analysisResult.vendor || '',
    docType: analysisResult.docType || 'MAIN',
    effectiveDate: analysisResult.effectiveDate ? new Date(analysisResult.effectiveDate) : undefined,
    terminationDate: analysisResult.terminationDate ? new Date(analysisResult.terminationDate) : undefined
  });
  const [selectedExistingContractId, setSelectedExistingContractId] = useState<string>(analysisResult.suggestedContractId || '');
  const [isCreating, setIsCreating] = useState(false);

  // Fetch existing contracts
  const { data: existingContracts, isLoading: isLoadingContracts } = useQuery({
    queryKey: ['/api/contracts'],
    queryFn: async () => apiRequest('/api/contracts')
  });

  // Function to render confidence indicator
  const renderConfidence = (confidenceScore: number) => {
    const color = confidenceScore > 0.85 ? 'text-green-500' : 
                 confidenceScore > 0.6 ? 'text-amber-500' : 'text-red-500';
    
    return (
      <span className="ml-2 inline-flex items-center">
        <InfoIcon size={16} className={color} />
        <span className={`ml-1 text-xs ${color}`}>
          {confidenceScore > 0.85 ? 'High' : confidenceScore > 0.6 ? 'Medium' : 'Low'} confidence
        </span>
      </span>
    );
  };

  const handleCreateNewContract = async () => {
    setIsCreating(true);
    try {
      // Save the analysis result with a prefill ID
      const prefillResponse = await apiRequest('/api/contracts/prefill', {
        method: 'POST',
        body: JSON.stringify({
          ...contractData,
          effectiveDate: contractData.effectiveDate ? format(contractData.effectiveDate, 'yyyy-MM-dd') : null,
          terminationDate: contractData.terminationDate ? format(contractData.terminationDate, 'yyyy-MM-dd') : null,
          documentId
        })
      });
      
      if (prefillResponse.success) {
        toast({
          title: 'Analysis saved',
          description: 'Redirecting to contract creation form with pre-filled data.',
          variant: 'default'
        });
        
        // Redirect to the contract creation form with the prefill ID
        navigate(`/contracts/new?prefillId=${prefillResponse.data.id}`);
      }
    } catch (error) {
      console.error('Error creating contract:', error);
      toast({
        title: 'Failed to prepare contract creation',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      });
    }
    setIsCreating(false);
  };

  const handleAssignToExistingContract = async () => {
    if (!selectedExistingContractId) {
      toast({
        title: 'No contract selected',
        description: 'Please select an existing contract to link this document to.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsCreating(true);
    try {
      // Attach the document to the existing contract
      const attachResponse = await apiRequest(`/api/contracts/${selectedExistingContractId}/documents`, {
        method: 'POST',
        body: JSON.stringify({
          documentId,
          docType: contractData.docType,
          isPrimary: false, // Set as non-primary since it's being attached to an existing contract
          notes: `AI analyzed document. Confidence: ${
            Object.entries(analysisResult.confidence)
              .map(([key, value]) => `${key}: ${Math.round(value * 100)}%`)
              .join(', ')
          }`
        })
      });
      
      if (attachResponse.success) {
        toast({
          title: 'Document attached',
          description: 'The document has been attached to the selected contract.',
          variant: 'default'
        });
        
        // Redirect to the contract detail page
        navigate(`/contracts/${selectedExistingContractId}`);
      }
    } catch (error) {
      console.error('Error attaching document:', error);
      toast({
        title: 'Failed to attach document',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      });
    }
    setIsCreating(false);
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CheckCircle className="mr-2 text-green-500" />
          AI Analysis Complete
        </CardTitle>
        <CardDescription>
          Our AI has analyzed your document and extracted the following information. 
          You can review, edit, and decide whether to create a new contract or link to an existing one.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">
                Contract Title
                {analysisResult.confidence && analysisResult.confidence.contractTitle && 
                  renderConfidence(analysisResult.confidence.contractTitle)}
              </Label>
              <Input 
                id="title" 
                value={contractData.title} 
                onChange={(e) => setContractData({...contractData, title: e.target.value})}
                className={cn(
                  analysisResult.confidence?.contractTitle && analysisResult.confidence.contractTitle < 0.6 
                    ? 'border-red-300 bg-red-50' 
                    : ''
                )}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vendor">
                Vendor/Counterparty
                {analysisResult.confidence && analysisResult.confidence.vendor && 
                  renderConfidence(analysisResult.confidence.vendor)}
              </Label>
              <Input 
                id="vendor" 
                value={contractData.vendor} 
                onChange={(e) => setContractData({...contractData, vendor: e.target.value})}
                className={cn(
                  analysisResult.confidence?.vendor && analysisResult.confidence.vendor < 0.6 
                    ? 'border-red-300 bg-red-50' 
                    : ''
                )}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="docType">Document Type</Label>
              <Select
                value={contractData.docType}
                onValueChange={(value) => setContractData({...contractData, docType: value})}
              >
                <SelectTrigger id="docType">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAIN">Main Agreement</SelectItem>
                  <SelectItem value="AMENDMENT">Amendment</SelectItem>
                  <SelectItem value="ADDENDUM">Addendum</SelectItem>
                  <SelectItem value="SIDE_LETTER">Side Letter</SelectItem>
                  <SelectItem value="EXHIBIT">Exhibit</SelectItem>
                  <SelectItem value="SCHEDULE">Schedule</SelectItem>
                  <SelectItem value="STATEMENT_OF_WORK">Statement of Work</SelectItem>
                  <SelectItem value="CERTIFICATE">Certificate</SelectItem>
                  <SelectItem value="TERMINATION">Termination</SelectItem>
                  <SelectItem value="RENEWAL">Renewal</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="effectiveDate">
                Effective Date
                {analysisResult.confidence && analysisResult.confidence.effectiveDate && 
                  renderConfidence(analysisResult.confidence.effectiveDate)}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !contractData.effectiveDate && "text-muted-foreground",
                      analysisResult.confidence?.effectiveDate && analysisResult.confidence.effectiveDate < 0.6 
                        ? 'border-red-300 bg-red-50' 
                        : ''
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {contractData.effectiveDate ? format(contractData.effectiveDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={contractData.effectiveDate}
                    onSelect={(date) => setContractData({...contractData, effectiveDate: date || undefined})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="terminationDate">
                Termination Date
                {analysisResult.confidence && analysisResult.confidence.terminationDate && 
                  renderConfidence(analysisResult.confidence.terminationDate)}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !contractData.terminationDate && "text-muted-foreground",
                      analysisResult.confidence?.terminationDate && analysisResult.confidence.terminationDate < 0.6 
                        ? 'border-red-300 bg-red-50' 
                        : ''
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {contractData.terminationDate ? format(contractData.terminationDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={contractData.terminationDate}
                    onSelect={(date) => setContractData({...contractData, terminationDate: date || undefined})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <h3 className="text-lg font-medium mb-4">Choose an option:</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-md font-medium mb-2">Create a new contract with this data</h4>
                <p className="text-sm text-gray-500 mb-4">
                  This will create a new contract record with the information above and attach this document to it.
                </p>
                <Button 
                  onClick={handleCreateNewContract} 
                  disabled={isCreating}
                  className="w-full sm:w-auto"
                >
                  {isCreating ? 'Creating...' : 'Create New Contract'}
                </Button>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="text-md font-medium mb-2">Or link to an existing contract</h4>
                <p className="text-sm text-gray-500 mb-4">
                  This will attach the document to an existing contract in your system.
                </p>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="existingContract">Select Existing Contract</Label>
                    <Select
                      value={selectedExistingContractId}
                      onValueChange={setSelectedExistingContractId}
                      disabled={isLoadingContracts}
                    >
                      <SelectTrigger id="existingContract" className="w-full">
                        <SelectValue placeholder="Select a contract" />
                      </SelectTrigger>
                      <SelectContent>
                        {existingContracts?.data?.map((contract: any) => (
                          <SelectItem 
                            key={contract.id} 
                            value={contract.id}
                          >
                            {contract.contractNumber || contract.contractTitle || contract.counterpartyName || 'Unnamed contract'} 
                            {analysisResult.suggestedContractId === contract.id && ' (Suggested)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleAssignToExistingContract} 
                    disabled={!selectedExistingContractId || isCreating}
                    className="w-full sm:w-auto"
                  >
                    {isCreating ? 'Linking...' : 'Link to Selected Contract'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={onReset}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" /> Start Over
        </Button>
      </CardFooter>
    </Card>
  );
}