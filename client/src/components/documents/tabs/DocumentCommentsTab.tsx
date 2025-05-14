import React from 'react';
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

const { Title, Text } = Typography;
const { TextArea } = Input;

/**
 * Comments tab content for document details page
 */
export function DocumentCommentsTab({ document }: DocumentCommentsTabProps) {
  const [form] = Form.useForm<CommentFormValues>();
  const hasComments = document.comments && document.comments.length > 0;

  // Would be implemented in a real application
  const handleSubmitComment = (values: CommentFormValues) => {
    console.log('New comment:', values.comment);
    form.resetFields();
  };

  return (
    <Card bordered={false}>
      <Title level={5}>Comments</Title>
      
      {hasComments ? (
        <List
          itemLayout="horizontal"
          dataSource={document.comments || []}
          renderItem={(comment: DocumentComment) => (
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
        <Form form={form} onFinish={handleSubmitComment}>
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
      </div>
    </Card>
  );
}