import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { 
  Layout, 
  Typography, 
  Alert, 
  Button as AntButton, 
  Space, 
  Card, 
  Radio, 
  Row, 
  Col, 
  Switch
} from "antd";
import { InfoCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Button } from "@/components/ui/button";
import DocumentList from "@/components/documents/DocumentList";
import VirtualizedDocumentList from "@/components/documents/VirtualizedDocumentList";
import DocumentUpload from "@/components/documents/DocumentUpload";
import { useToast } from "@/hooks/use-toast";
import { PermissionGuard } from "@/components/permissions/PermissionGuard";

const { Title, Text } = Typography;

export default function Documents() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [useVirtualization, setUseVirtualization] = useState(false);
  const { toast } = useToast();
  
  const { data: documentsResponse, isLoading, refetch } = useQuery({
    queryKey: ['/api/documents']
  });
  
  // Extract the documents array from the response
  const documents = React.useMemo(() => {
    if (!documentsResponse) return [];
    
    // Check if response has the expected structure
    if (documentsResponse && 'success' in documentsResponse && 'data' in documentsResponse) {
      // This is the standard API response format
      return documentsResponse.data || [];
    }
    
    // If it's already an array, return it directly (fall back for direct array responses)
    if (Array.isArray(documentsResponse)) {
      return documentsResponse;
    }
    
    // Default case: we couldn't find documents
    console.warn('Unexpected document response format:', documentsResponse);
    return [];
  }, [documentsResponse]);

  const handleUploadSuccess = () => {
    toast({
      title: "Document uploaded successfully",
      description: "Your document has been uploaded and is being processed.",
    });
    refetch();
    setIsUploadModalOpen(false);
  };

  return (
    <>
      <Helmet>
        <title>Documents | BlueEarth Capital</title>
        <meta name="description" content="Document management for BlueEarth Capital. View, upload, and manage company documents securely." />
      </Helmet>
      
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        {/* Page Header */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={2} style={{ margin: 0, color: '#1E2A40' }}>Documents</Title>
          </Col>
          <Col>
            <PermissionGuard area="documents" permission="edit">
              <Button 
                onClick={() => setIsUploadModalOpen(true)} 
                className="flex items-center gap-2"
              >
                <PlusOutlined style={{ fontSize: '14px' }} />
                Upload Document
              </Button>
            </PermissionGuard>
          </Col>
        </Row>
        
        {/* Permission Alert */}
        <Alert
          message="You don't have permission to upload or edit documents."
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: 24 }}
        />
        
        {/* Filter Controls */}
        <Card 
          size="small" 
          style={{ marginBottom: 24 }}
        >
          <div style={{ marginBottom: 16 }}>
            <Text strong>Filter documents</Text>
          </div>
          
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Radio.Group 
              value={activeFilter} 
              onChange={(e) => setActiveFilter(e.target.value)}
              style={{ marginBottom: 8 }}
            >
              <Space>
                <Radio.Button value="all">All Documents</Radio.Button>
                <Radio.Button value="recent">Last 30 Days</Radio.Button>
                <Radio.Button value="CONTRACT">Contracts</Radio.Button>
              </Space>
            </Radio.Group>
            
            <Space>
              <Text>Use virtualization for performance:</Text>
              <Switch 
                checked={useVirtualization} 
                onChange={setUseVirtualization}
              />
            </Space>
          </Space>
        </Card>
        
        {/* Document List */}
        <Card bordered>
          {useVirtualization ? (
            <VirtualizedDocumentList 
              documents={documents} 
              isLoading={isLoading} 
              filter={activeFilter}
              height={500} // Set a reasonable default height
              itemSize={60} // Height of each document row
            />
          ) : (
            <DocumentList 
              documents={documents} 
              isLoading={isLoading} 
              filter={activeFilter}
            />
          )}
        </Card>
      </div>

      <DocumentUpload 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </>
  );
}