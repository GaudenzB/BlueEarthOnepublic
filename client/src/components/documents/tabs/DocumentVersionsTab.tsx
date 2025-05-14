import React from 'react';
import { Card, Typography, Table, Space, Button } from 'antd';
import { EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import { Document } from '@/types/document';
import { EmptyState } from '@/components/common/EmptyState';

interface DocumentVersionsTabProps {
  document: Document;
}

const { Title } = Typography;

/**
 * Versions tab content for document details page
 */
export function DocumentVersionsTab({ document }: DocumentVersionsTabProps) {
  // Safe access to document versions
  const hasVersions = document.versions && document.versions.length > 0;
  
  return (
    <Card bordered={false}>
      <Title level={5}>Document Versions</Title>
      
      {hasVersions ? (
        <Table
          dataSource={document.versions}
          rowKey="id"
          columns={[
            {
              title: 'Version',
              dataIndex: 'versionNumber',
              key: 'versionNumber',
              render: (versionNumber) => `v${versionNumber}`,
            },
            {
              title: 'Date',
              dataIndex: 'createdAt',
              key: 'createdAt',
              render: (createdAt) => createdAt ? format(new Date(createdAt), 'PP') : 'Unknown',
            },
            {
              title: 'Created By',
              dataIndex: 'createdBy',
              key: 'createdBy',
            },
            {
              title: 'Size',
              dataIndex: 'sizeBytes',
              key: 'sizeBytes',
              render: (sizeBytes) => sizeBytes ? `${(sizeBytes / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
            },
            {
              title: 'Actions',
              key: 'actions',
              render: () => (
                <Space>
                  <Button type="text" size="small" icon={<EyeOutlined />}>View</Button>
                  <Button type="text" size="small" icon={<DownloadOutlined />}>Download</Button>
                </Space>
              ),
            },
          ]}
          pagination={false}
        />
      ) : (
        <div style={{ marginTop: 24 }}>
          <EmptyState
            title="No Version History"
            description="This document doesn't have any recorded versions. When document updates are made, version history will be tracked here."
            type="compact"
            size="default"
          />
        </div>
      )}
    </Card>
  );
}