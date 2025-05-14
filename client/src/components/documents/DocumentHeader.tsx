import React, { useState, memo } from 'react';
import { Typography, Space, Button, Breadcrumb, Tooltip, Dropdown, Badge, Tag } from 'antd';
import { 
  DownloadOutlined, 
  ShareAltOutlined, 
  DeleteOutlined, 
  EditOutlined,
  PrinterOutlined,
  StarOutlined,
  StarFilled,
  LockOutlined,
  MoreOutlined,
  EyeOutlined,
  HistoryOutlined,
  FileProtectOutlined
} from '@ant-design/icons';
import { Link } from 'wouter';
import { Document } from '@/types/document';

const { Title } = Typography;

interface DocumentHeaderProps {
  document: Document;
  statusBadge?: React.ReactNode;
  onDeleteClick: () => void;
  onShareClick: () => void;
  onEdit?: () => void;
  onDownload?: () => void;
  onPrint?: () => void;
  onFavorite?: () => void;
  onViewHistory?: () => void;
  onViewPermissions?: () => void;
  onPreviewToggle?: () => void;
  isConfidential?: boolean;
  isFavorited?: boolean;
  isPreviewMode?: boolean;
  versionCount?: number;
  loading?: {
    favorite?: boolean;
    delete?: boolean;
    download?: boolean;
  };
}

/**
 * Document tags component
 * Displays categorization tags for the document
 */
const DocumentTags = memo(({ document }: { document: Document }) => {
  return (
    <Space size={[0, 8]} wrap>
      {document.category && (
        <Tag color="blue">{document.category}</Tag>
      )}
      {document.fileType && (
        <Tag color="default">{document.fileType}</Tag>
      )}
      {document.visibility && (
        <Tag color="cyan">{document.visibility}</Tag>
      )}
      {document.tags?.map((tag, index) => (
        <Tag key={index} color="green">{tag}</Tag>
      ))}
    </Space>
  );
});

/**
 * Document title component
 * Displays the document title with badges and status indicators
 */
const DocumentTitle = memo(({ 
  document, 
  statusBadge, 
  isConfidential, 
  versionCount, 
  onViewHistory 
}: { 
  document: Document; 
  statusBadge?: React.ReactNode;
  isConfidential: boolean;
  versionCount: number;
  onViewHistory?: () => void;
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <Title level={3} style={{ margin: 0 }}>
        {document.title}
      </Title>
      {statusBadge && (
        <div style={{ marginLeft: 12 }}>
          {statusBadge}
        </div>
      )}
      {isConfidential && (
        <Tooltip title="Confidential Document">
          <Badge count={<LockOutlined style={{ color: '#ff4d4f' }} />} />
        </Tooltip>
      )}
      {versionCount > 1 && (
        <Tooltip title={`${versionCount} versions available`}>
          <Tag color="purple" onClick={onViewHistory} style={{ cursor: onViewHistory ? 'pointer' : 'default' }}>
            v{document.versions?.[0]?.versionNumber || versionCount}
          </Tag>
        </Tooltip>
      )}
    </div>
  );
});

/**
 * Document actions component
 * Contains all the action buttons for document operations
 */
const DocumentActions = memo(({ 
  onShareClick, 
  onDeleteClick, 
  onEdit, 
  onDownload, 
  onFavorite,
  isFavorited,
  moreMenuItems,
  showAllActions,
  loading
}: {
  onShareClick?: () => void;
  onDeleteClick?: () => void;
  onEdit?: () => void;
  onDownload?: () => void;
  onFavorite?: () => void;
  isFavorited: boolean;
  moreMenuItems: any[];
  showAllActions: boolean;
  loading: {
    favorite?: boolean;
    delete?: boolean;
    download?: boolean;
  };
}) => {
  return (
    <Space wrap>
      {/* Primary actions */}
      {onFavorite && (
        <Tooltip title={isFavorited ? "Remove from favorites" : "Add to favorites"}>
          <Button 
            icon={isFavorited ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
            onClick={onFavorite}
            loading={loading?.favorite ? true : false}
            type={isFavorited ? 'text' : 'default'}
          >
            {showAllActions && (isFavorited ? 'Favorited' : 'Favorite')}
          </Button>
        </Tooltip>
      )}
      
      {onEdit && (
        <Tooltip title="Edit document">
          <Button 
            icon={<EditOutlined />} 
            onClick={onEdit}
            type="primary"
            ghost
          >
            {showAllActions && 'Edit'}
          </Button>
        </Tooltip>
      )}
      
      {onDownload && (
        <Tooltip title="Download document">
          <Button 
            icon={<DownloadOutlined />} 
            onClick={onDownload}
            loading={loading?.download ? true : false}
          >
            {showAllActions ? 'Download' : ''}
          </Button>
        </Tooltip>
      )}
      
      {onShareClick && (
        <Tooltip title="Share document">
          <Button 
            icon={<ShareAltOutlined />} 
            onClick={onShareClick}
            type="primary"
          >
            Share
          </Button>
        </Tooltip>
      )}
      
      {/* More actions dropdown if there are additional actions */}
      {moreMenuItems.length > 0 && (
        <Dropdown 
          menu={{ items: moreMenuItems }} 
          trigger={['click']}
          placement="bottomRight"
        >
          <Button icon={<MoreOutlined />}>
            More
          </Button>
        </Dropdown>
      )}
      
      {/* Delete action */}
      {onDeleteClick && (
        <Tooltip title="Delete document">
          <Button 
            icon={<DeleteOutlined />} 
            danger
            onClick={onDeleteClick}
            loading={loading?.delete ? true : false}
          >
            Delete
          </Button>
        </Tooltip>
      )}
    </Space>
  );
});

/**
 * Header component for document detail page with actions
 * Memoized to prevent unnecessary re-renders
 */
export const DocumentHeader = memo(function DocumentHeader({
  document,
  statusBadge,
  onDeleteClick,
  onShareClick,
  onEdit,
  onDownload,
  onPrint,
  onFavorite,
  onViewHistory,
  onViewPermissions,
  onPreviewToggle,
  isConfidential = false,
  isFavorited = false,
  isPreviewMode = false,
  versionCount = 1,
  loading = {}
}: DocumentHeaderProps) {
  // Control whether to show text labels alongside icons for action buttons
  const [showAllActions, _setShowAllActions] = useState(false);
  
  // Generate dropdown menu items
  const moreMenuItems = [
    ...(onPrint ? [{
      key: 'print',
      label: 'Print Document',
      icon: <PrinterOutlined />,
      onClick: onPrint
    }] : []),
    ...(onViewHistory ? [{
      key: 'history',
      label: `Version History${versionCount > 1 ? ` (${versionCount})` : ''}`,
      icon: <HistoryOutlined />,
      onClick: onViewHistory
    }] : []),
    ...(onViewPermissions ? [{
      key: 'permissions',
      label: 'View Permissions',
      icon: <FileProtectOutlined />,
      onClick: onViewPermissions
    }] : []),
    ...(onPreviewToggle ? [{
      key: 'preview',
      label: isPreviewMode ? 'Exit Preview Mode' : 'Enter Preview Mode',
      icon: <EyeOutlined />,
      onClick: onPreviewToggle
    }] : [])
  ];
  
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
      
      {/* Document metadata badges */}
      <div style={{ marginBottom: 12 }}>
        <DocumentTags document={document} />
      </div>
      
      {/* Title and actions row */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <DocumentTitle 
          document={document}
          statusBadge={statusBadge}
          isConfidential={isConfidential}
          versionCount={versionCount}
          onViewHistory={onViewHistory}
        />
        
        {/* Action buttons */}
        <DocumentActions 
          onShareClick={onShareClick}
          onDeleteClick={onDeleteClick}
          onEdit={onEdit}
          onDownload={onDownload}
          onFavorite={onFavorite}
          isFavorited={isFavorited}
          moreMenuItems={moreMenuItems}
          showAllActions={showAllActions}
          loading={loading}
        />
      </div>
    </div>
  );
});