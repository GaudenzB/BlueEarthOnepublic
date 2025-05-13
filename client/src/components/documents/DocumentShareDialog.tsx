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
export function DocumentShareDialog({ open, onClose, document: doc }: DocumentShareDialogProps) {
  // Email sharing action handler
  const handleEmailShare = () => {
    // In a real implementation, this would open an email sharing dialog
    const subject = `Shared document: ${doc.title}`;
    const body = `I'd like to share this document with you: ${doc.title}`;
    console.log('Email share initiated', { subject, body });
  };
  
  // Copy link action handler
  const handleCopyLink = () => {
    // In a real implementation, this would copy a document link to clipboard
    const shareLink = `https://app.example.com/documents/${doc.id}`;
    console.log('Link copied', shareLink);
  };
  
  const shareOptions = [
    {
      title: 'Share via Email',
      description: 'Send a secure link to specific people',
      icon: <MailOutlined />,
      action: <Button type="text" size="small" onClick={handleEmailShare}>Share <RightOutlined /></Button>
    },
    {
      title: 'Get Share Link',
      description: 'Copy a link you can share anywhere',
      icon: <LinkOutlined />,
      action: <Button type="text" size="small" onClick={handleCopyLink}>Copy <CopyOutlined /></Button>
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