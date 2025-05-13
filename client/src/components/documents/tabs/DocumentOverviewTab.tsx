import React from "react";
import { Row, Col, Card, Typography, Descriptions, Space, Tag, Avatar, Badge } from "antd";
import { FileOutlined, UserOutlined } from "@ant-design/icons";
import { format } from "date-fns";
import { Document, DOC_TYPES, VISIBILITY_OPTIONS } from "@/types/document";
import { DocumentStatusBadge } from "../DocumentStatusBadge";

interface DocumentOverviewTabProps {
  document: Document;
}

const { Title, Text, Paragraph } = Typography;

/**
 * Overview tab content for document details page
 */
export function DocumentOverviewTab({ document }: DocumentOverviewTabProps) {
  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={16}>
        <Card bordered={false}>
          <Title level={5}>Document Information</Title>
          <Descriptions bordered size="small" column={{ xs: 1, md: 2 }}>
            <Descriptions.Item label="Document ID">
              <Text copyable>{document.id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {document.createdAt ? format(new Date(document.createdAt), 'PP') : 'Unknown'}
            </Descriptions.Item>
            <Descriptions.Item label="Type">
              {document.type ? (DOC_TYPES.find(t => t.value === document.type)?.label || document.type) : document.documentType || 'Unknown'}
            </Descriptions.Item>
            <Descriptions.Item label="Size">
              {document.fileSize ? `${(document.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <DocumentStatusBadge status={document.processingStatus} />
            </Descriptions.Item>
            <Descriptions.Item label="Last Updated">
              {document.updatedAt ? format(new Date(document.updatedAt), 'PP') : 'Unknown'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>
      
      <Col xs={24} lg={8}>
        <Card bordered={false}>
          <Title level={5}>Document Preview</Title>
          {document.thumbnailUrl ? (
            <div style={{ textAlign: 'center' }}>
              <img 
                src={document.thumbnailUrl} 
                alt={document.title} 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '300px',
                  objectFit: 'contain',
                  border: '1px solid #f0f0f0',
                  borderRadius: '4px'
                }} 
              />
            </div>
          ) : (
            <div style={{ 
              height: '200px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: '#f9f9f9',
              borderRadius: '4px'
            }}>
              <Space direction="vertical" align="center">
                <FileOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />
                <Text type="secondary">No preview available</Text>
              </Space>
            </div>
          )}
        </Card>
      </Col>
      
      <Col xs={24}>
        <Card bordered={false}>
          <Title level={5}>Document Details</Title>
          <div style={{ marginTop: 16 }}>
            <Title level={5} style={{ marginBottom: 8 }}>
              Tags
            </Title>
            <div style={{ marginBottom: 16 }}>
              {document.tags && document.tags.length > 0 ? (
                <Space wrap>
                  {document.tags.map((tag: string, index: number) => (
                    <Tag key={index} color="blue">{tag}</Tag>
                  ))}
                </Space>
              ) : (
                <Text type="secondary">No tags</Text>
              )}
            </div>
            
            <Title level={5} style={{ marginBottom: 8 }}>
              Description
            </Title>
            {document.description ? (
              <Paragraph>
                {document.description}
              </Paragraph>
            ) : (
              <Text type="secondary">No description provided</Text>
            )}
            
            <Title level={5} style={{ marginBottom: 8 }}>
              Access Control
            </Title>
            <Badge 
              status={document.visibility === 'public' ? 'success' : 'warning'} 
              text={document.visibility 
                ? (VISIBILITY_OPTIONS.find(v => v.value === document.visibility)?.label || document.visibility) 
                : 'Unknown'
              } 
            />
            
            {document.sharedWith && document.sharedWith.length > 0 && (
              <>
                <Title level={5} style={{ marginTop: 16, marginBottom: 8 }}>
                  Shared With
                </Title>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {document.sharedWith.map((user, index) => (
                    <Card key={index} size="small" style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar icon={<UserOutlined />} style={{ marginRight: 12 }} />
                        <div>
                          <Text strong>{user.name}</Text><br />
                          <Text type="secondary">{user.id}</Text>
                        </div>
                        <div style={{ marginLeft: 'auto' }}>
                          <Tag>{user.role || 'View'}</Tag>
                        </div>
                      </div>
                    </Card>
                  ))}
                </Space>
              </>
            )}
          </div>
        </Card>
      </Col>
    </Row>
  );
}