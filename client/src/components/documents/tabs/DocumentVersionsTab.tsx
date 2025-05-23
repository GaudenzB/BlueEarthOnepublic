import React, { memo } from 'react';
import { Card, Typography, Table, Space, Button } from 'antd';
import { EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import { Document, DocumentVersion } from '@/types/document';
import { EmptyState } from '@/components/common/EmptyState';

interface DocumentVersionsTabProps {
  document: Document;
  onRestoreVersion: ((versionId: string) => void) | undefined;
  isRestoring: boolean;
}

interface VersionActionsProps {
  version: DocumentVersion;
  onRestore?: ((versionId: string) => void) | undefined;
  isRestoring: boolean;
  isCurrentVersion: boolean;
}

const { Title } = Typography;

/**
 * Version actions component
 * Memoized to prevent unnecessary re-renders
 */
const VersionActions = memo(function VersionActions({ 
  version, 
  onRestore, 
  isRestoring,
  isCurrentVersion 
}: VersionActionsProps) {
  // Handler for restore button click
  const handleRestore = () => {
    if (onRestore) {
      onRestore(version.id);
    }
  };

  return (
    <Space>
      <Button 
        type="text" 
        size="small" 
        icon={<EyeOutlined />} 
        onClick={() => console.log('View version', version.id)}
        style={{
          color: '#0e4a86' as string, // Corporate blue
          fontWeight: 500 as number
        }}
      >
        View
      </Button>
      <Button 
        type="text" 
        size="small" 
        icon={<DownloadOutlined />} 
        onClick={() => console.log('Download version', version.id)}
        style={{
          color: '#0e4a86' as string, // Corporate blue
          fontWeight: 500 as number
        }}
      >
        Download
      </Button>
      {onRestore && !isCurrentVersion && (
        <Button
          type="primary"
          size="small"
          onClick={handleRestore}
          loading={isRestoring || false}
          disabled={isRestoring || false}
          style={{
            backgroundColor: '#0e4a86', // Corporate blue
            borderColor: '#0e4a86',
            fontWeight: 500 as number,
            boxShadow: 'none'
          }}
        >
          Restore
        </Button>
      )}
      {isCurrentVersion && (
        <span
          style={{
            fontSize: '12px',
            fontWeight: 500 as number,
            color: '#12705c' as string, // Financial green
            backgroundColor: '#effcf6',
            padding: '2px 8px',
            borderRadius: '4px',
            border: '1px solid #d1fadf'
          }}
        >
          Current Version
        </span>
      )}
    </Space>
  );
});

/**
 * Versions tab content for document details page
 * Memoized to prevent unnecessary re-renders
 */
export const DocumentVersionsTab = memo(function DocumentVersionsTab({ 
  document, 
  onRestoreVersion,
  isRestoring 
}: DocumentVersionsTabProps) {
  // Safe access to document versions
  const hasVersions = document.versions && document.versions.length > 0;
  
  // Determine the current version (highest version number)
  const currentVersion = hasVersions && document.versions
    ? document.versions.reduce((latest, current) => 
        (latest.versionNumber > current.versionNumber) ? latest : current
      )
    : null;
  
  const columns = [
    {
      title: 'Version',
      dataIndex: 'versionNumber',
      key: 'versionNumber',
      render: (versionNumber: number) => `v${versionNumber}`,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: string) => createdAt ? format(new Date(createdAt), 'PP') : 'Unknown',
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
      render: (sizeBytes: number) => sizeBytes ? `${(sizeBytes / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: DocumentVersion) => (
        <VersionActions 
          version={record} 
          onRestore={onRestoreVersion}
          isRestoring={isRestoring || false}
          isCurrentVersion={!!(currentVersion && record.id === currentVersion.id)}
        />
      ),
    },
  ];
  
  return (
    <Card 
      bordered={false}
      className="financial-card"
      style={{
        boxShadow: '0 1px 3px rgba(16, 24, 40, 0.1)',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}
    >
      <Title 
        level={5} 
        style={{
          marginBottom: '16px',
          fontSize: '16px',
          fontWeight: 600 as number,
          color: '#1e293b' as string // Slate-800 - professional dark tone for financial services
        }}
      >
        Document Versions
      </Title>
      
      {hasVersions ? (
        <Table
          dataSource={document.versions}
          rowKey="id"
          columns={columns}
          pagination={false}
          className="financial-table"
          size="middle"
          rowClassName={() => 'financial-table-row'}
          // Professional table styling that matches financial industry aesthetic
          style={{
            fontSize: '14px',
            '--ant-primary-color': '#0e4a86' // More corporate blue
          } as React.CSSProperties}
        />
      ) : (
        <div style={{ marginTop: 24 as number }}>
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
});