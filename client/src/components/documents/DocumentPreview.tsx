import React, { useState } from 'react';
import { Card, Typography, Space, Button, Empty, Spin, Modal } from 'antd';
import { 
  FileOutlined, 
  FileImageOutlined, 
  FilePdfOutlined, 
  FileExcelOutlined,
  FileWordOutlined,
  EyeOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { Document } from '@/types/document';

const { Title, Text } = Typography;

interface DocumentPreviewProps {
  document: Document;
  onDownload: () => void;
}

/**
 * Document preview component with intelligent file type detection
 */
export function DocumentPreview({ document, onDownload }: DocumentPreviewProps) {
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  
  // Get file type and icon
  const getFileTypeInfo = () => {
    const type = document.type || document.documentType || '';
    const mimeType = document.mimeType || '';
    
    if (mimeType.includes('pdf') || type.includes('pdf')) {
      return { 
        type: 'PDF', 
        icon: <FilePdfOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />,
        previewSupported: true
      };
    } else if (
      mimeType.includes('image') || 
      ['jpg', 'jpeg', 'png', 'gif', 'webp'].some(ext => type.includes(ext))
    ) {
      return { 
        type: 'Image', 
        icon: <FileImageOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
        previewSupported: true
      };
    } else if (
      mimeType.includes('excel') || 
      mimeType.includes('spreadsheet') ||
      ['xls', 'xlsx', 'csv'].some(ext => type.includes(ext))
    ) {
      return { 
        type: 'Spreadsheet', 
        icon: <FileExcelOutlined style={{ fontSize: 48, color: '#52c41a' }} />,
        previewSupported: false
      };
    } else if (
      mimeType.includes('word') ||
      mimeType.includes('document') || 
      ['doc', 'docx', 'odt'].some(ext => type.includes(ext))
    ) {
      return { 
        type: 'Document', 
        icon: <FileWordOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
        previewSupported: false
      };
    }
    
    return { 
      type: 'File', 
      icon: <FileOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />,
      previewSupported: false
    };
  };
  
  const fileInfo = getFileTypeInfo();
  
  // Handle preview open
  const handlePreview = () => {
    setLoading(true);
    setTimeout(() => {
      setPreviewVisible(true);
      setLoading(false);
    }, 500);
  };
  
  // Render preview based on file type
  const renderPreview = () => {
    // PDF preview
    if (fileInfo.type === 'PDF' && document.previewUrl) {
      return (
        <iframe 
          src={`${document.previewUrl}#toolbar=0`} 
          width="100%" 
          height="600px" 
          style={{ border: 'none' }}
          title={document.title}
        />
      );
    }
    
    // Image preview
    if (fileInfo.type === 'Image' && document.thumbnailUrl) {
      return (
        <img 
          src={document.thumbnailUrl} 
          alt={document.title} 
          style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain' }}
        />
      );
    }
    
    // Default preview not available
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        flexDirection: 'column',
        padding: '40px 0'
      }}>
        {fileInfo.icon}
        <Text style={{ marginTop: 16 }}>
          {fileInfo.type} preview not available
        </Text>
      </div>
    );
  };
  
  return (
    <Card bordered={false}>
      <Title level={5}>Document Preview</Title>
      
      {document.thumbnailUrl ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            position: 'relative', 
            marginBottom: 16, 
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f9f9f9',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <img 
              src={document.thumbnailUrl} 
              alt={document.title} 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '200px',
                objectFit: 'contain'
              }} 
            />
            
            {/* Preview overlay */}
            {fileInfo.previewSupported && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.3s',
                cursor: 'pointer',
                ':hover': { opacity: 1 }
              }} 
              onClick={handlePreview}
              >
                <Button 
                  type="primary" 
                  icon={<EyeOutlined />}
                  loading={loading}
                >
                  Preview
                </Button>
              </div>
            )}
          </div>
          
          <Space>
            <Button 
              icon={<EyeOutlined />} 
              onClick={handlePreview}
              disabled={!fileInfo.previewSupported}
              loading={loading}
            >
              Preview
            </Button>
            
            <Button 
              icon={<DownloadOutlined />} 
              onClick={onDownload}
            >
              Download
            </Button>
          </Space>
        </div>
      ) : (
        <div style={{ 
          height: '200px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f9f9f9',
          borderRadius: '4px',
          flexDirection: 'column',
        }}>
          <Space direction="vertical" align="center">
            {fileInfo.icon}
            <Text type="secondary">No preview available</Text>
            <Button icon={<DownloadOutlined />} onClick={onDownload}>
              Download
            </Button>
          </Space>
        </div>
      )}
      
      {/* Preview modal */}
      <Modal
        title={document.title}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="download" onClick={onDownload} icon={<DownloadOutlined />}>
            Download
          </Button>,
          <Button key="close" type="primary" onClick={() => setPreviewVisible(false)}>
            Close
          </Button>
        ]}
        width={1000}
        style={{ top: 20 }}
      >
        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '500px' 
          }}>
            <Spin size="large" tip="Loading preview..." />
          </div>
        ) : renderPreview()}
      </Modal>
    </Card>
  );
}