import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format, parseISO } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ContractDocumentSectionProps {
  contractId: string;
}

// Types for documents
type DocumentAttachment = {
  id: string;
  contractId: string;
  documentId: string;
  docType: string;
  isPrimary: boolean;
  notes?: string;
  effectiveDate?: string;
  document?: {
    id: string;
    title: string;
    originalFilename: string;
    mimeType: string;
    fileSize: number;
    uploadedAt: string;
  };
};

export default function ContractDocumentSection({ contractId }: ContractDocumentSectionProps) {
  // Get documents attached to this contract
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/contracts/documents', contractId],
    queryFn: async () => {
      try {
        return await apiRequest(`/api/contracts/${contractId}/documents`);
      } catch (err) {
        console.error('Error fetching contract documents:', err);
        // Return empty data instead of letting the error propagate
        return { success: true, data: [] };
      }
    },
    enabled: Boolean(contractId),
    retry: 1 // Only retry once to avoid too many failed requests
  });

  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '—';
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Format file size
  const formatFileSize = (sizeInBytes: number) => {
    if (sizeInBytes < 1024) return `${sizeInBytes} B`;
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Group documents by type
  const groupedDocuments = React.useMemo(() => {
    if (!data?.data) return {};
    
    // Get all document attachments
    const documents: DocumentAttachment[] = data.data;
    
    // Group by document type
    return documents.reduce((groups: Record<string, DocumentAttachment[]>, doc) => {
      const group = doc.docType || 'OTHER';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(doc);
      return groups;
    }, {});
  }, [data?.data]);

  // Order for document types
  const typeOrder = [
    'MAIN', 
    'AMENDMENT', 
    'ADDENDUM',
    'SIDE_LETTER', 
    'EXHIBIT', 
    'SCHEDULE', 
    'STATEMENT_OF_WORK',
    'CERTIFICATE',
    'RENEWAL', 
    'TERMINATION', 
    'OTHER'
  ];
  
  // Get user-friendly label for document type
  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case 'MAIN': // Fall through
       return 'Main Agreements';
      case 'AMENDMENT': // Fall through
       return 'Amendments';
      case 'ADDENDUM': // Fall through
       return 'Addendums';
      case 'SIDE_LETTER': // Fall through
       return 'Side Letters';
      case 'EXHIBIT': // Fall through
       return 'Exhibits';
      case 'SCHEDULE': // Fall through
       return 'Schedules';
      case 'STATEMENT_OF_WORK': // Fall through
       return 'Statements of Work';
      case 'CERTIFICATE': // Fall through
       return 'Certificates';
      case 'RENEWAL': // Fall through
       return 'Renewals';
      case 'TERMINATION': // Fall through
       return 'Terminations';
      case 'OTHER': // Fall through
       return 'Other Documents';
      default: return type;
    }
  };

  // Downloading a document
  const handleDownload = async (documentId: string) => {
    try {
      window.open(`/api/documents/${documentId}/download`, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  // Viewing a document
  const handleView = async (documentId: string) => {
    try {
      window.open(`/api/documents/${documentId}/view`, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contract Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p>Loading documents...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (Object.keys(groupedDocuments).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contract Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-muted-foreground">No documents attached to this contract.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contract Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Render each document type section in the specified order */}
        {typeOrder.map(type => {
          const documents = groupedDocuments[type];
          if (!documents || documents.length === 0) return null;
          
          return (
            <div key={type} className="space-y-2">
              <h3 className="text-lg font-medium">{getDocTypeLabel(type)}</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Primary</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map(doc => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText size={16} />
                          {doc.document?.title || doc.document?.originalFilename || 'Unnamed Document'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {doc.isPrimary && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            Primary
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(doc.effectiveDate)}</TableCell>
                      <TableCell>{doc.notes || '—'}</TableCell>
                      <TableCell>{doc.document?.fileSize ? formatFileSize(doc.document.fileSize) : '—'}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleView(doc.documentId)}
                          >
                            <Eye size={16} className="mr-1" />
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownload(doc.documentId)}
                          >
                            <Download size={16} className="mr-1" />
                            Download
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}