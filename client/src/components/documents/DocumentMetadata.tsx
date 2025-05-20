import React from 'react';
import { Typography, Descriptions, Tag, Space, Tooltip, Badge, Divider } from 'antd';
import { Document } from '@/types/document';
import { formatDistanceToNow } from 'date-fns';
import { InfoCircleOutlined, TagsOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface DocumentMetadataProps {
  document: Document;
}

/**
 * Component displaying document metadata in a structured format
 * Used in overview tab and other places where document metadata is needed
 */
export function DocumentMetadata({ document }: DocumentMetadataProps) {
  // Format dates for better readability
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString() + ` (${formatDistanceToNow(date, { addSuffix: true })})`;
    } catch (e) {
      return dateString || 'N/A';
    }
  };
  
  // Helper function to determine if document has custom metadata
  const hasCustomMetadata = (): boolean => {
    return document.aiMetadata !== undefined && Object.keys(document.aiMetadata || {}).length > 0;
  };
  
  // Helper function to render custom metadata fields
  const renderCustomMetadataValue = (_key: string, value: any): React.ReactNode => {
    // Handle different types of metadata values
    if (value === null || value === undefined) {
      return <Text type="secondary">Not specified</Text>;
    }
    
    if (typeof value === 'boolean') {
      return value ? 
        <Badge status="success" text="Yes" /> : 
        <Badge status="error" text="No" />;
    }
    
    if (typeof value === 'number') {
      return <Text>{value.toString()}</Text>;
    }
    
    if (typeof value === 'object') {
      // If it's an array, display as comma-separated values
      if (Array.isArray(value)) {
        return value.length > 0 ? (
          <Space wrap>
            {value.map((item, i) => (
              <Tag key={i} color="cyan">{item.toString()}</Tag>
            ))}
          </Space>
        ) : <Text type="secondary">None</Text>;
      }
      
      // If it's a date, format it
      if (value instanceof Date) {
        return formatDate(value.toISOString());
      }
      
      // For complex objects, show a simplified representation
      return (
        <Tooltip title={JSON.stringify(value, null, 2)}>
          <Text style={{ cursor: 'pointer' }}>
            <InfoCircleOutlined /> Complex value (hover to see)
          </Text>
        </Tooltip>
      );
    }
    
    // Default case: string or other primitive
    return <Text>{value.toString()}</Text>;
  };
  
  // Get metadata keys for rendering
  const metadataKeys = document.aiMetadata ? Object.keys(document.aiMetadata) : [];
  
  return (
    <>
      <Descriptions 
        title="Document Metadata" 
        bordered 
        size="small"
        column={{ xs: 1, sm: 2, md: 3 }}
        style={{ marginBottom: 24 as number }}
      >
        <Descriptions.Item label="File Type">
          {document.fileType || 'Unknown'}
        </Descriptions.Item>
        
        <Descriptions.Item label="Size">
          {document.fileSize 
            ? `${(document.fileSize / 1024 / 1024).toFixed(2)} MB` 
            : 'Unknown'}
        </Descriptions.Item>
        
        <Descriptions.Item label="Created">
          {formatDate(document.createdAt)}
        </Descriptions.Item>
        
        <Descriptions.Item label="Last Modified">
          {formatDate(document.updatedAt)}
        </Descriptions.Item>
        
        <Descriptions.Item label="File Name">
          {document.filename || document.originalFilename || 'Unknown'}
        </Descriptions.Item>
        
        <Descriptions.Item label="Owner">
          {document.sharedWith && document.sharedWith.length > 0 && document.sharedWith[0]?.name 
            ? document.sharedWith[0].name 
            : 'System'}
        </Descriptions.Item>
        
        <Descriptions.Item label="Version">
          {document.versions && document.versions.length > 0 && document.versions[0]?.versionNumber 
            ? document.versions[0].versionNumber 
            : '1.0'}
        </Descriptions.Item>
        
        <Descriptions.Item label="Category">
          {document.category || 'Uncategorized'}
        </Descriptions.Item>
        
        <Descriptions.Item label="Visibility">
          {document.visibility || 'Private'}
        </Descriptions.Item>
        
        <Descriptions.Item label="Tags" span={3}>
          {document.tags && document.tags.length > 0 ? (
            <Space wrap>
              {document.tags.map((tag, index) => (
                <Tag key={index} color="blue">{tag}</Tag>
              ))}
            </Space>
          ) : (
            <Text type="secondary">No tags</Text>
          )}
        </Descriptions.Item>
        
        {document.description && (
          <Descriptions.Item label="Description" span={3}>
            {document.description}
          </Descriptions.Item>
        )}
      </Descriptions>
      
      {/* Custom metadata section */}
      {hasCustomMetadata() && (
        <>
          <Divider>
            <Space>
              <TagsOutlined />
              <span>Custom Metadata</span>
            </Space>
          </Divider>
          
          <Descriptions
            bordered
            size="small"
            column={{ xs: 1, sm: 2, md: 2 }}
            style={{ marginBottom: 24 as number }}
          >
            {metadataKeys.map(key => (
              <Descriptions.Item 
                key={key} 
                label={
                  <Tooltip title={`Custom metadata field: ${key}`}>
                    <Text style={{ textTransform: 'capitalize' }}>
                      {key.replace(/_/g, ' ')}
                    </Text>
                  </Tooltip>
                }
              >
                {renderCustomMetadataValue(key, document.aiMetadata?.[key as keyof typeof document.aiMetadata])}
              </Descriptions.Item>
            ))}
          </Descriptions>
        </>
      )}
    </>
  );
}