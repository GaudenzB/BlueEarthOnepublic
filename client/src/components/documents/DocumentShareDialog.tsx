import React from 'react';
import { Modal, List, Avatar, Button } from 'antd';
import { MailOutlined, LinkOutlined, RightOutlined, CopyOutlined } from '@ant-design/icons';
import { Document } from '@/types/document';

interface DocumentShareDialogProps {
  document: Document;
  open: boolean;
  onClose: () => void;
}

/**
 * Share dialog for documents
 */
export function DocumentShareDialog({ document, open, onClose }: DocumentShareDialogProps) {
  const shareOptions = [
    {
      title: 'Share via Email',
      description: 'Send a secure link to specific people',
      icon: <MailOutlined />,
      action: <Button type="text" size="small">Share <RightOutlined /></Button>
    },
    {
      title: 'Get Share Link',
      description: 'Copy a link you can share anywhere',
      icon: <LinkOutlined />,
      action: <Button type="text" size="small">Copy <CopyOutlined /></Button>
    }
  ];

  return (
    <Modal
      title="Share Document"
      open={open}
      onCancel={onClose}
      footer={null}
    >
      <div style={{ padding: '12px 0' }}>
        <List
          itemLayout="horizontal"
          dataSource={shareOptions}
          renderItem={(item) => (
            <List.Item
              actions={[item.action]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={item.icon} />}
                title={item.title}
                description={item.description}
              />
            </List.Item>
          )}
        />
      </div>
    </Modal>
  );
}