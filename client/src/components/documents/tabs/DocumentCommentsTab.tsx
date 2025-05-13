import React from 'react';
import { Card, Typography, List, Avatar, Space, Empty, Input, Button, Form } from 'antd';
import { UserOutlined, SendOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import { Document } from '@/types/document';

interface DocumentCommentsTabProps {
  document: Document;
}

const { Title, Text } = Typography;
const { TextArea } = Input;

/**
 * Comments tab content for document details page
 */
export function DocumentCommentsTab({ document }: DocumentCommentsTabProps) {
  const [form] = Form.useForm();

  // Would be implemented in a real application
  const handleSubmitComment = (values: { comment: string }) => {
    console.log('New comment:', values.comment);
    form.resetFields();
  };

  return (
    <Card bordered={false}>
      <Title level={5}>Comments</Title>
      
      {document.comments && document.comments.length > 0 ? (
        <List
          itemLayout="horizontal"
          dataSource={document.comments}
          renderItem={(comment: any) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={
                  <Space>
                    <Text strong>{comment.author}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {format(new Date(comment.date), 'PP')}
                    </Text>
                  </Space>
                }
                description={comment.text}
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty 
          description="No comments yet" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
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