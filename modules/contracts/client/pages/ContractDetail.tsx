import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  AlertTriangle, 
  Calendar, 
  ChevronLeft, 
  Clock, 
  Edit, 
  File, 
  FileText,
  Building
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import ContractDocumentSection from '../components/ContractDocumentSection';

// Feature flag check
const isContractsEnabled = () => {
  // Feature is always enabled in development (for testing purposes)
  if (import.meta.env.MODE === 'development') {
    return true;
  }
  
  // Use the environment variable for production
  return import.meta.env['ENABLE_CONTRACTS'] === 'true';
};

export default function ContractDetail() {
  // Get contract ID from route params
  const params = useParams();
  const contractId = params?.id;

  // Fetch only the specific contract by ID
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/contracts', contractId],
    queryFn: () => apiRequest(`/api/contracts/${contractId}`),
    enabled: !!contractId
  });
  
  // Extract contract data from response
  const contract = data;

  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'MMMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Check if a date is approaching (within 30 days)
  const isDateApproaching = (dateString: string | null | undefined) => {
    if (!dateString) return false;
    try {
      const date = parseISO(dateString);
      const today = new Date();
      const daysRemaining = differenceInDays(date, today);
      return daysRemaining <= 30 && daysRemaining > 0;
    } catch (error) {
      return false;
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': // Fall through
       return 'bg-green-100 text-green-800';
      case 'PENDING': // Fall through
       // Fall through
      case 'DRAFT': // Fall through
       return 'bg-yellow-100 text-yellow-800';
      case 'EXPIRED': // Fall through
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
        <p>Loading contract details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-red-600">Error</h2>
        <p className="mt-4">Failed to load contract details. The contract may not exist.</p>
        <Link href="/contracts">
          <Button variant="outline" className="mt-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Contracts
          </Button>
        </Link>
      </div>
    );
  }
  
  // Since we've simplified the API, we aren't loading obligations and clauses
  // in this initial implementation
  const obligations: any[] = [];
  const clauses: any[] = [];

  // Filter upcoming obligations (due in the next 30 days)
  const upcomingObligations = obligations.filter((obligation: any) => 
    isDateApproaching(obligation.dueDate)
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <Link href="/contracts">
          <Button variant="ghost" className="mr-2">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{contract.contractType || 'Contract'}</h1>
        <Badge className={`ml-4 ${getStatusColor(contract.contractStatus)}`}>
          {contract.contractStatus}
        </Badge>
      </div>
      
      {/* Contract Summary Card */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Contract Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Vendor Information */}
            {contract.vendorId && (
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Vendor</h3>
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  <Link href={`/vendors/${contract.vendorId}`}>
                    <span className="text-blue-600 hover:underline">{contract.vendorName || 'View Vendor Details'}</span>
                  </Link>
                </div>
              </div>
            )}
            
            {/* Contract Number */}
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Contract Number</h3>
              <p>{contract.contractNumber || 'N/A'}</p>
            </div>
            
            {/* Contract Type */}
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Type</h3>
              <p>{contract.contractType || 'N/A'}</p>
            </div>
            
            {/* Effective Date */}
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Effective Date</h3>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                {formatDate(contract.effectiveDate)}
              </div>
            </div>
            
            {/* Expiry Date */}
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Expiry Date</h3>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                {formatDate(contract.expiryDate)}
                {isDateApproaching(contract.expiryDate) && (
                  <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
                    <Clock className="h-3 w-3 mr-1" />
                    Approaching
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Total Value */}
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Total Value</h3>
              <p>{contract.totalValue ? `${contract.currency || '$'}${contract.totalValue.toLocaleString()}` : 'N/A'}</p>
            </div>
          </div>
          
          {/* Description if available */}
          {contract.description && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
              <p className="text-sm">{contract.description}</p>
            </div>
          )}
          
          {/* Counterparty Information */}
          <div className="mt-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Counterparty</h3>
            <p className="text-sm">{contract.counterpartyName || 'N/A'}</p>
            {contract.counterpartyContactEmail && (
              <p className="text-sm text-blue-600 hover:underline">
                <a href={`mailto:${contract.counterpartyContactEmail}`}>
                  {contract.counterpartyContactEmail}
                </a>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main contract details */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row justify-between items-start">
              <div>
                <CardTitle className="text-xl">
                  {contract.contractNumber ? `#${contract.contractNumber}` : 'Contract Details'}
                </CardTitle>
                <CardDescription>
                  Contract with {contract.counterpartyName || 'Unnamed Party'}
                </CardDescription>
              </div>
              <Link href={`/contracts/${contractId}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="details">
                <TabsList className="mb-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="clauses">Clauses</TabsTrigger>
                  <TabsTrigger value="obligations">Obligations</TabsTrigger>
                </TabsList>
                
                {/* Details Tab */}
                <TabsContent value="details">
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Contract Type</dt>
                      <dd className="mt-1">{contract.contractType || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Contract Number</dt>
                      <dd className="mt-1">{contract.contractNumber || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Counterparty</dt>
                      <dd className="mt-1">{contract.counterpartyName || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Counterparty Contact</dt>
                      <dd className="mt-1">{contract.counterpartyContactEmail || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Effective Date</dt>
                      <dd className="mt-1 flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        {formatDate(contract.effectiveDate)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Expiry Date</dt>
                      <dd className="mt-1 flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        {formatDate(contract.expiryDate)}
                        {isDateApproaching(contract.expiryDate) && (
                          <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
                            <Clock className="h-3 w-3 mr-1" />
                            Approaching
                          </Badge>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Execution Date</dt>
                      <dd className="mt-1 flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        {formatDate(contract.executionDate)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Renewal Date</dt>
                      <dd className="mt-1 flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        {formatDate(contract.renewalDate)}
                        {isDateApproaching(contract.renewalDate) && (
                          <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
                            <Clock className="h-3 w-3 mr-1" />
                            Approaching
                          </Badge>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Total Value</dt>
                      <dd className="mt-1">
                        {contract.totalValue ? `${contract.currency || '$'}${contract.totalValue.toLocaleString()}` : 'N/A'}
                      </dd>
                    </div>
                  </dl>
                  
                  {contract.notes && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
                        <p className="text-sm">{contract.notes}</p>
                      </div>
                    </>
                  )}

                  {/* Vendor information if available */}
                  {contract.vendorId && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Vendor</h3>
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                        <Link href={`/vendors/${contract.vendorId}`}>
                          <span className="text-blue-600 hover:underline">{contract.vendorName || 'View Vendor Details'}</span>
                        </Link>
                      </div>
                    </div>
                  )}
                  
                  {/* Description field if provided */}
                  {contract.description && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                      <p className="text-sm">{contract.description}</p>
                    </div>
                  )}
                </TabsContent>
                
                {/* Clauses Tab */}
                <TabsContent value="clauses">
                  {clauses.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Clause Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Section</TableHead>
                          <TableHead>Confidence</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clauses.map((clause: any) => (
                          <TableRow key={clause.id}>
                            <TableCell className="font-medium">{clause.title}</TableCell>
                            <TableCell>{clause.type}</TableCell>
                            <TableCell>{clause.section || 'N/A'}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div 
                                  className={`w-2 h-2 rounded-full mr-2 ${
                                    clause.confidenceScore >= 0.8 ? 'bg-green-500' : 
                                    clause.confidenceScore >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                />
                                {Math.round(clause.confidenceScore * 100)}%
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center p-4">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-muted-foreground">No clauses found</p>
                    </div>
                  )}
                </TabsContent>
                
                {/* Obligations Tab */}
                <TabsContent value="obligations">
                  {obligations.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {obligations.map((obligation: any) => (
                          <TableRow key={obligation.id}>
                            <TableCell className="font-medium">{obligation.description}</TableCell>
                            <TableCell>{obligation.obligationType}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                {formatDate(obligation.dueDate)}
                                {isDateApproaching(obligation.dueDate) && (
                                  <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Upcoming
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(obligation.status || 'PENDING')}>
                                {obligation.status || 'Pending'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center p-4">
                      <File className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-muted-foreground">No obligations found</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div>
          {/* Contract Documents Section */}
          <div className="mb-6">
            <ContractDocumentSection contractId={contractId} />
          </div>
          
          {/* Upcoming Obligations Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Obligations</CardTitle>
              <CardDescription>Due in the next 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingObligations.length > 0 ? (
                <ul className="space-y-3">
                  {upcomingObligations.map((obligation: any) => (
                    <li key={obligation.id} className="flex items-start p-3 border rounded-md">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">{obligation.description}</p>
                        <div className="flex items-center mt-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(obligation.dueDate)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center p-4">
                  <p className="text-muted-foreground">No upcoming obligations</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/contracts/${contractId}/obligations`}>
                  <p>Manage Obligations</p>
                </Link>
              </Button>
            </CardFooter>
          </Card>
          
          {/* Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contract Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                  <dd className="mt-1 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    {formatDate(contract.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
                  <dd className="mt-1 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    {formatDate(contract.updatedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Created By</dt>
                  <dd className="mt-1">{contract.createdBy || 'System'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Contract ID</dt>
                  <dd className="mt-1 text-xs font-mono bg-gray-100 p-1 rounded">{contract.id}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}