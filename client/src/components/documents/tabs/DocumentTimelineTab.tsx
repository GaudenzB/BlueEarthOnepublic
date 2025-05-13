import React from 'react';
import { Card, Typography, Timeline, Empty } from 'antd';
import { 
  FileOutlined, 
  EditOutlined, 
  InfoCircleOutlined, 
  LinkOutlined, 
  DownloadOutlined,
  CalendarOutlined 
} from '@ant-design/icons';
import { format } from 'date-fns';
import { Document } from '@/types/document';

interface DocumentTimelineTabProps {
  document: Document;
}

const { Title, Text } = Typography;

/**
 * Helper function to get timeline icon
 */
function getTimelineIcon(type: string) {
  switch (type) {
    case 'create':
      return <FileOutlined style={{ fontSize: 16 }} />;
    case 'edit':
      return <EditOutlined style={{ fontSize: 16 }} />;
    case 'status':
      return <InfoCircleOutlined style={{ fontSize: 16 }} />;
    case 'share':
      return <LinkOutlined style={{ fontSize: 16 }} />;
    case 'download':
      return <DownloadOutlined style={{ fontSize: 16 }} />;
    default:
      return <CalendarOutlined style={{ fontSize: 16 }} />;
  }
}

/**
 * Timeline tab content for document details page
 */
export function DocumentTimelineTab({ document }: DocumentTimelineTabProps) {
  return (
    <Card bordered={false}>
      <Title level={5}>Activity Timeline</Title>
      
      {document.timeline && document.timeline.length > 0 ? (
        <Timeline>
          {document.timeline.map((event: any, index: number) => (
            <Timeline.Item key={index} dot={getTimelineIcon(event.type)}>
              <div>
                <Text strong>{event.action}</Text>
                <div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {format(new Date(event.timestamp), 'PPpp')}
                  </Text>
                </div>
                {event.details && <div>{event.details}</div>}
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      ) : (
        <Empty 
          description="No timeline events available" 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
        />
      )}
    </Card>
  );
}