import React, { memo } from 'react';
import { Card, Typography, List, Avatar, Space, Input, Button, Form } from 'antd';
import { UserOutlined, SendOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import { Document, DocumentComment } from '@/types/document';
import { EmptyState } from '@/components/common/EmptyState';

interface DocumentCommentsTabProps {
  document: Document;
}

interface CommentFormValues {
  comment: string;
}

interface CommentItemProps {
  comment: DocumentComment;
}

const { Title, Text } = Typography;
const { TextArea } = Input;

/**
 * Individual comment component
 * Memoized to prevent unnecessary re-renders
 */
const CommentItem = memo(function CommentItem({ comment }: CommentItemProps) {
  return (
    <List.Item>
      <List.Item.Meta
        avatar={
          <Avatar 
            src={comment.userAvatar} 
            icon={!comment.userAvatar ? <UserOutlined /> : undefined} 
          />
        }
        title={
          <Space>
            <Text strong>{comment.userName}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {format(new Date(comment.createdAt), 'PP')}
            </Text>
          </Space>
        }
        description={comment.text}
      />
    </List.Item>
  );
});

/**
 * Comment form component
 */
const CommentForm = memo(function CommentForm({ onSubmit }: { onSubmit: (values: CommentFormValues) => void }) {
  const [form] = Form.useForm<CommentFormValues>();
  
  const handleSubmit = (values: CommentFormValues) => {
    onSubmit(values);
    form.resetFields();
  };
  
  return (
    <Form form={form} onFinish={handleSubmit}>
      <Form.Item name="comment" rules={[{ required: true, message: 'Please enter a comment' }]}>
        <TextArea 
          rows={3} 
          placeholder="Add a comment..." 
        />
      </Form.Item>
      <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
        <Button 
          type="primary" 
          htmlType="submit" 
          icon={<SendOutlined />}
        >
          Post Comment
        </Button>
      </Form.Item>
    </Form>
  );
});

/**
 * Comments tab content for document details page
 * Memoized to prevent unnecessary re-renders
 */
export const DocumentCommentsTab = memo(function DocumentCommentsTab({ document }: DocumentCommentsTabProps) {
  const hasComments = document.comments && document.comments.length > 0;

  // Would be implemented in a real application
  const handleSubmitComment = (values: CommentFormValues) => {
    console.log('New comment:', values.comment);
  };

  return (
    <Card bordered={false}>
      <Title level={5}>Comments</Title>
      
      {hasComments ? (
        <List
          itemLayout="horizontal"
          dataSource={document.comments || []}
          renderItem={(comment: DocumentComment) => (
            <CommentItem key={comment.id} comment={comment} />
          )}
        />
      ) : (
        <div style={{ marginTop: 24, marginBottom: 24 }}>
          <EmptyState
            title="No Comments Yet"
            description="Be the first to add a comment to this document."
            type="compact"
            size="default"
          />
        </div>
      )}
      
      <div style={{ marginTop: 24 }}>
        <CommentForm onSubmit={handleSubmitComment} />
      </div>
    </Card>
  );
});