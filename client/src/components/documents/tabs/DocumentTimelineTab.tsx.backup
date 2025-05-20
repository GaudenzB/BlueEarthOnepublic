import React, { memo } from 'react';
import { Card, Typography, Timeline } from 'antd';
import { EmptyState } from '@/components/common/EmptyState';
import { 
  FileOutlined, 
  EditOutlined, 
  InfoCircleOutlined, 
  LinkOutlined, 
  DownloadOutlined,
  CalendarOutlined 
} from '@ant-design/icons';
import { format } from 'date-fns';
import { Document, DocumentEvent } from '@/types/document';

interface DocumentTimelineTabProps {
  document: Document;
}

interface TimelineEventProps {
  event: DocumentEvent;
}

const { Title, Text } = Typography;

/**
 * Helper function to get timeline icon
 */
function getTimelineIcon(type: string) {
  switch (type) {
    case 'create': // Fall through
       return <FileOutlined style={{ fontSize: 16 }} />;
    case 'update': // Fall through
       return <EditOutlined style={{ fontSize: 16 }} />;
    case 'view': // Fall through
       return <InfoCircleOutlined style={{ fontSize: 16 }} />;
    case 'share': // Fall through
       return <LinkOutlined style={{ fontSize: 16 }} />;
    case 'download': // Fall through
       return <DownloadOutlined style={{ fontSize: 16 }} />;
    case 'comment': // Fall through
       return <InfoCircleOutlined style={{ fontSize: 16 }} />;
    default:
      return <CalendarOutlined style={{ fontSize: 16 }} />;
  }
}

/**
 * Individual timeline event component
 * Memoized to prevent unnecessary re-renders
 */
const TimelineEvent = memo(function TimelineEvent({ event }: TimelineEventProps) {
  return (
    <Timeline.Item dot={getTimelineIcon(event.eventType.toLowerCase())}>
      <div>
        <Text strong>{event.eventType}</Text>
        <div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {format(new Date(event.timestamp), 'PPpp')} by {event.userName}
          </Text>
        </div>
        {event.details && <div>{event.details}</div>}
      </div>
    </Timeline.Item>
  );
});

/**
 * Timeline tab content for document details page
 * Memoized to prevent unnecessary re-renders
 */
export const DocumentTimelineTab = memo(function DocumentTimelineTab({ document }: DocumentTimelineTabProps) {
  const hasEvents = document.events && document.events.length > 0;
  
  return (
    <Card bordered={false}>
      <Title level={5}>Activity Timeline</Title>
      
      {hasEvents ? (
        <Timeline>
          {document.events?.map((event, index: number) => (
            <TimelineEvent key={event.id || index} event={event} />
          ))}
        </Timeline>
      ) : (
        <div style={{ marginTop: 24 as number }}>
          <EmptyState
            title="No Timeline Activity"
            description="This document doesn't have any recorded activity. When users interact with this document, their actions will be logged here."
            type="compact"
            size="default"
          />
        </div>
      )}
    </Card>
  );
});