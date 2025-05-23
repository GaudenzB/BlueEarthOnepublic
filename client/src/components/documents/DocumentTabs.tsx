import React, { memo } from 'react';
import { Tabs } from 'antd';
import { Document } from '@/types/document';
import { DocumentOverviewTab } from './tabs/DocumentOverviewTab';
import { DocumentVersionsTab } from './tabs/DocumentVersionsTab';
import { DocumentCommentsTab } from './tabs/DocumentCommentsTab';
import { DocumentTimelineTab } from './tabs/DocumentTimelineTab';

interface DocumentTabsProps {
  document: Document;
  activeTab: string;
  onTabChange: (key: string) => void;
  onRestoreVersion: ((versionId: string) => void) | undefined;
  isRestoring: boolean;
}

/**
 * Tabbed view component for document details
 * Provides a consistent tab interface for all document content
 * Memoized to prevent unnecessary re-renders
 */
export const DocumentTabs = memo(function DocumentTabs({ 
  document, 
  activeTab, 
  onTabChange,
  onRestoreVersion,
  isRestoring
}: DocumentTabsProps) {
  // Item configuration for Tabs component
  const tabItems = [
    {
      key: "1",
      label: "Overview",
      children: <DocumentOverviewTab document={document} />
    },
    {
      key: "2",
      label: "Version History",
      children: <DocumentVersionsTab 
        document={document} 
        onRestoreVersion={onRestoreVersion}
        isRestoring={isRestoring || false}
      />
    },
    {
      key: "3",
      label: "Comments",
      children: <DocumentCommentsTab document={document} />
    },
    {
      key: "4",
      label: "Timeline",
      children: <DocumentTimelineTab document={document} />
    }
  ];

  return (
    <Tabs 
      activeKey={activeTab} 
      onChange={onTabChange}
      items={tabItems}
      size="large"
      tabBarStyle={{ 
        marginBottom: 24 as number,
        borderBottom: '1px solid #e5e7eb',
        fontWeight: 500 as number
      }}
      tabBarGutter={32} // Increased spacing between tabs for professional look
      className="document-detail-tabs"
      // Custom styling is applied using CSS class for consistent financial industry appearance
      // The styling aligns with our design system guidelines for financial services applications
    />
  );
});