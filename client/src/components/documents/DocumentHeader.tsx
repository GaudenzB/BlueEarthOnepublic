import React from 'react';
import { Typography, Space, Button, Breadcrumb, Tooltip } from 'antd';
import { 
  DownloadOutlined, 
  ShareAltOutlined, 
  DeleteOutlined, 
  EditOutlined,
  PrinterOutlined,
  StarOutlined,
  LockOutlined
} from '@ant-design/icons';
import { Link } from 'wouter';
import { Document } from '@/types/document';

const { Title } = Typography;

interface DocumentHeaderProps {
  document: Document;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
  onDownload: () => void;
  onPrint: () => void;
  onFavorite: () => void;
  isConfidential?: boolean;
}

/**
 * Header component for document detail page with actions
 */
export function DocumentHeader({
  document,
  onEdit,
  onDelete,
  onShare,
  onDownload,
  onPrint,
  onFavorite,
  isConfidential = false
}: DocumentHeaderProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      {/* Breadcrumb navigation */}
      <Breadcrumb 
        items={[
          { title: <Link to="/documents">Documents</Link> },
          { title: document.title || 'Document Details' }
        ]}
        style={{ marginBottom: 16 }}
      />
      
      {/* Title and actions row */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Title level={3} style={{ margin: 0 }}>
            {document.title}
          </Title>
          {isConfidential && (
            <Tooltip title="Confidential Document">
              <LockOutlined style={{ color: '#ff4d4f', fontSize: '18px' }} />
            </Tooltip>
          )}
        </div>
        
        {/* Action buttons */}
        <Space wrap>
          <Tooltip title="Edit document">
            <Button 
              icon={<EditOutlined />} 
              onClick={onEdit}
            >
              Edit
            </Button>
          </Tooltip>
          
          <Tooltip title="Download document">
            <Button 
              icon={<DownloadOutlined />} 
              onClick={onDownload}
            >
              Download
            </Button>
          </Tooltip>
          
          <Tooltip title="Print document">
            <Button 
              icon={<PrinterOutlined />} 
              onClick={onPrint}
            >
              Print
            </Button>
          </Tooltip>
          
          <Tooltip title="Share document">
            <Button 
              icon={<ShareAltOutlined />} 
              onClick={onShare}
            >
              Share
            </Button>
          </Tooltip>
          
          <Tooltip title="Add to favorites">
            <Button 
              icon={<StarOutlined />} 
              onClick={onFavorite}
            >
              Favorite
            </Button>
          </Tooltip>
          
          <Tooltip title="Delete document">
            <Button 
              icon={<DeleteOutlined />} 
              danger
              onClick={onDelete}
            >
              Delete
            </Button>
          </Tooltip>
        </Space>
      </div>
    </div>
  );
}