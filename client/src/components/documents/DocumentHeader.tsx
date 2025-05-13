import React from "react";
import { Button, Space, Tooltip, Dropdown, Typography } from "antd";
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  EditOutlined,
  MoreOutlined,
  DeleteOutlined,
  LinkOutlined
} from "@ant-design/icons";
import { PermissionGuard } from "@/components/permissions/PermissionGuard";
import { Document } from "@/types/document";

interface DocumentHeaderProps {
  document: Document;
  statusBadge: React.ReactNode;
  onDeleteClick: () => void;
  onShareClick: () => void;
}

/**
 * Document header component with title, action buttons and status badge
 */
export function DocumentHeader({ 
  document, 
  statusBadge, 
  onDeleteClick, 
  onShareClick 
}: DocumentHeaderProps) {
  const { Title } = Typography;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'row', 
      marginBottom: 24, 
      alignItems: 'center', 
      gap: 16,
      flexWrap: 'wrap'
    }}>
      <Button 
        icon={<ArrowLeftOutlined />} 
        href="/documents"
      >
        Back
      </Button>

      <Title level={3} style={{ margin: 0 }}>
        {document.title}
      </Title>
      
      <div style={{ flex: 1 }}></div>
      
      <Space size="middle">
        <Tooltip title="Download Document">
          <Button 
            icon={<DownloadOutlined />} 
            href={`/api/documents/${document.id}/download`}
            target="_blank"
          >
            Download
          </Button>
        </Tooltip>
        
        <PermissionGuard area="documents" permission="edit" showAlert={false}>
          <Button 
            type="primary"
            icon={<EditOutlined />}
            href={`/documents/${document.id}/edit`}
          >
            Edit
          </Button>
        </PermissionGuard>
        
        <Dropdown
          menu={{
            items: [
              {
                key: '1',
                label: 'Share Document',
                icon: <LinkOutlined />,
                onClick: onShareClick
              },
              {
                key: '2',
                label: 'Delete Document',
                icon: <DeleteOutlined />,
                onClick: onDeleteClick,
                danger: true
              }
            ]
          }}
          trigger={['click']}
        >
          <Button icon={<MoreOutlined />} />
        </Dropdown>
        
        {statusBadge}
      </Space>
    </div>
  );
}