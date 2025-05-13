import React, { ReactNode } from 'react';
import { Space, Button, Typography, Row, Col } from 'antd';
import { 
  DeleteOutlined, 
  ShareAltOutlined, 
  RollbackOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { useLocation } from 'wouter';
import { Document } from '@/types/document';

interface DocumentHeaderProps {
  document: Document;
  statusBadge: ReactNode;
  onDeleteClick: () => void;
  onShareClick: () => void;
}

const { Title } = Typography;

/**
 * Header component for document detail page
 */
export function DocumentHeader({ 
  document, 
  statusBadge, 
  onDeleteClick, 
  onShareClick 
}: DocumentHeaderProps) {
  const [, setLocation] = useLocation();
  
  const handleGoBack = () => {
    setLocation('/documents');
  };
  
  // Would be implemented in a real application
  const handleDownload = () => {
    console.log('Downloading document:', document.id);
    // Logic to download document would go here
  };
  
  return (
    <Row 
      gutter={[16, 16]} 
      align="middle" 
      style={{ 
        marginBottom: 24, 
        flexWrap: 'wrap' 
      }}
    >
      <Col>
        <Button 
          icon={<RollbackOutlined />} 
          onClick={handleGoBack}
        >
          Back
        </Button>
      </Col>
      
      <Col flex="auto">
        <Space align="center">
          <Title 
            level={4} 
            style={{ 
              margin: 0,
              wordBreak: 'break-word'
            }}
          >
            {document.title}
          </Title>
          {statusBadge}
        </Space>
      </Col>
      
      <Col>
        <Space wrap>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={handleDownload}
          >
            Download
          </Button>
          
          <Button 
            icon={<ShareAltOutlined />} 
            onClick={onShareClick}
          >
            Share
          </Button>
          
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={onDeleteClick}
          >
            Delete
          </Button>
        </Space>
      </Col>
    </Row>
  );
}