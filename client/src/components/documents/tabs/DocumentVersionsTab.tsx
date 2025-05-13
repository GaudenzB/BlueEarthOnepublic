import React from 'react';
import { Card, Typography, Table, Space, Button, Empty } from 'antd';
import { EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import { Document } from '@/types/document';

interface DocumentVersionsTabProps {
  document: Document;
}

const { Title } = Typography;

/**
 * Versions tab content for document details page
 */
export function DocumentVersionsTab({ document }: DocumentVersionsTabProps) {
  return (
    <Card bordered={false}>
      <Title level={5}>Document Versions</Title>
      
      {document.versions && document.versions.length > 0 ? (
        <Table
          dataSource={document.versions}
          rowKey="version"
          columns={[
            {
              title: 'Version',
              dataIndex: 'version',
              key: 'version',
            },
            {
              title: 'Date',
              dataIndex: 'date',
              key: 'date',
              render: (date) => format(new Date(date), 'PP'),
            },
            {
              title: 'Modified By',
              dataIndex: 'modifiedBy',
              key: 'modifiedBy',
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
        <Empty 
          description="No version history available" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </Card>
  );
}