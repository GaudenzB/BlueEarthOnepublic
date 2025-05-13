import React from 'react';
import { Modal, Button, Typography } from 'antd';
import { Document } from '@/types/document';

interface DocumentDeleteDialogProps {
  document: Document;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

const { Paragraph } = Typography;

/**
 * Delete confirmation dialog for documents
 */
export function DocumentDeleteDialog({ 
  document, 
  open, 
  onCancel, 
  onConfirm, 
  isDeleting 
}: DocumentDeleteDialogProps) {
  return (
    <Modal
      title="Confirm Document Deletion"
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={isDeleting}>
          Cancel
        </Button>,
        <Button 
          key="delete" 
          danger 
          type="primary" 
          onClick={onConfirm}
          loading={isDeleting}
        >
          Delete
        </Button>
      ]}
    >
      <div style={{ padding: '12px 0' }}>
        <Paragraph>
          Are you sure you want to delete this document: <strong>"{document.title}"</strong>?
          This action cannot be undone.
        </Paragraph>
      </div>
    </Modal>
  );
}