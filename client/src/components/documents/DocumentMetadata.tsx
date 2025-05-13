import React from 'react';
import { Typography, Descriptions, Tag, Space } from 'antd';
import { Document } from '@/types/document';
import { formatDistanceToNow } from 'date-fns';

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
  
  return (
    <Descriptions 
      title="Document Metadata" 
      bordered 
      size="small"
      column={{ xs: 1, sm: 2, md: 3 }}
      style={{ marginBottom: 24 }}
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
        {document.sharedWith && document.sharedWith.length > 0 
          ? document.sharedWith[0].name 
          : 'System'}
      </Descriptions.Item>
      
      <Descriptions.Item label="Version">
        {document.versions && document.versions.length > 0 
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
  );
}