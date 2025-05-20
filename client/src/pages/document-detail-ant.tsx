import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { format } from "date-fns";
import {
  Typography,
  Badge,
  Button,
  Card,
  Row,
  Col,
  Tabs,
  Tooltip,
  Skeleton,
  Progress,
  Alert,
  Space,
  Tag,
  List,
  Table,
  Dropdown,
  Modal,
  Avatar,
  Descriptions,
  Timeline,
  Empty
} from "antd";
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  SyncOutlined,
  EditOutlined,
  EyeOutlined,
  LinkOutlined,
  RightOutlined,
  MoreOutlined,
  MailOutlined,
  CopyOutlined,
  CalendarOutlined,
  FileOutlined,
  UserOutlined
} from "@ant-design/icons";
import { PermissionGuard } from "@/components/permissions/PermissionGuard";
import { apiRequest } from "@/lib/queryClient";
import { Document } from "@/types/document";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// Document types and status options
const DOC_TYPES = {
  CONTRACT: "Contract",
  REPORT: "Report",
  PRESENTATION: "Presentation",
  FORM: "Form",
  POLICY: "Policy",
  OTHER: "Other",
};

const VISIBILITY_OPTIONS = {
  private: "Private",
  team: "Team",
  public: "Public",
};

// Helper function to format date safely
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'Unknown';
  try {
    return format(new Date(dateStr), 'PP');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

// Helper function to generate status badge based on processing status
function getStatusBadge(status: string | undefined) {
  if (!status) return <Badge status="default" text="Unknown" />;
  
  switch (status) {
    case "COMPLETED": // Fall through
       // Fall through
       return <Badge status="success" text="Completed" />;
    case "APPROVED": // Fall through
       // Fall through
       return <Badge status="success" text="Approved" />;
    case "PROCESSING": // Fall through
       // Fall through
       return <Badge status="processing" text="Processing" />;
    case "PENDING": // Fall through
       // Fall through
       return <Badge status="warning" text="Pending" />;
    case "QUEUED": // Fall through
       // Fall through
       return <Badge status="warning" text="Queued" />;
    case "REJECTED": // Fall through
       // Fall through
       return <Badge status="error" text="Rejected" />;
    case "ERROR": // Fall through
       // Fall through
       return <Badge status="error" text="Error" />;
    default:
      return <Badge status="default" text={status || "Unknown"} />;
  }
}

// Helper to get processing status text
function getProcessingStatusText(status: string | undefined): string {
  if (!status) return "Document status is being updated...";
  
  switch (status) {
    case "PROCESSING": // Fall through
       // Fall through
       return "Your document is currently being processed. This may take a few minutes.";
    case "PENDING": // Fall through
       // Fall through
       return "Your document is pending processing. It will be processed shortly.";
    case "QUEUED": // Fall through
       // Fall through
       return "Your document is in the processing queue. Processing will begin soon.";
    default:
      return "Document status is being updated...";
  }
}

// Helper to get processing progress percentage
function getProcessingProgress(status: string | undefined): number {
  if (!status) return 0;
  
  switch (status) {
    case "PROCESSING": // Fall through
       // Fall through
       return 75;
    case "PENDING": // Fall through
       // Fall through
       return 25;
    case "QUEUED": // Fall through
       // Fall through
       return 10;
    default:
      return 0;
  }
}

// Skeleton loading state for document detail
function DocumentDetailSkeleton() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        marginBottom: 24, 
        alignItems: 'center', 
        gap: 16,
        flexWrap: 'wrap'
      }}>
        <Skeleton.Button active style={{ width: 100 }} />
        <Skeleton.Input active style={{ width: 300 }} size="large" />
        <div style={{ flex: 1 }}></div>
        <Skeleton.Button active style={{ width: 100 }} />
        <Skeleton.Button active style={{ width: 100 }} />
      </div>
      
      <Skeleton active paragraph={{ rows: 6 }} />
      
      <div style={{ marginTop: 24 }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    </div>
  );
}

export default function DocumentDetail() {
  const { id } = useParams<{id: string}>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("1");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  
  // Fetch document details
  const { 
    data: document = {} as Document, 
    isLoading, 
    isError, 
    error 
  } = useQuery<Document>({
    queryKey: ['/api/documents', id],
    enabled: !!id,
  });
  
  // Mutation for deleting a document
  const deleteDocumentMutation = useMutation({
    mutationFn: () => {
      return apiRequest(`/api/documents/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setLocation('/documents');
    },
  });
  
  // Mutation for refreshing document status
  const refreshStatusMutation = useMutation({
    mutationFn: () => {
      return apiRequest(`/api/documents/${id}/refresh-status`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents', id] });
    },
  });
  
  const confirmDeleteDocument = () => {
    deleteDocumentMutation.mutate();
  };
  
  const handleRefreshStatus = () => {
    refreshStatusMutation.mutate();
  };
  
  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };
  
  // Handle loading and error states
  if (isLoading) {
    return <DocumentDetailSkeleton />;
  }
  
  if (isError) {
    return (
      <div style={{ maxWidth: '800px', margin: '48px auto', padding: '0 16px', textAlign: 'center' }}>
        <Title level={4} style={{ color: '#cf1322' }}>Error Loading Document</Title>
        <Text type="secondary">We encountered a problem while retrieving the document.</Text>
        <div style={{ margin: '32px 0' }}>
          <Text type="danger">{(error as Error)?.message || 'An unexpected error occurred'}</Text>
        </div>
        <Button 
          href="/documents" 
          icon={<ArrowLeftOutlined />}
          type="primary"
        >
          Return to Documents
        </Button>
      </div>
    );
  }
  
  // Handle not found
  if (!document.id) {
    return (
      <div style={{ maxWidth: '800px', margin: '48px auto', padding: '0 16px', textAlign: 'center' }}>
        <Title level={4}>Document Not Found</Title>
        <Text type="secondary">The document you're looking for doesn't exist or you don't have permission to view it.</Text>
        <div style={{ margin: '32px 0' }}>
          <Button 
            href="/documents" 
            icon={<ArrowLeftOutlined />}
            type="primary"
          >
            Return to Documents
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>{document.title || "Document"} | BlueEarth Portal</title>
        <meta name="description" content={`View details and insights for ${document.title || "document"}`} />
      </Helmet>
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Document Header */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          marginBottom: 24, 
          alignItems: 'center', 
          gap: 16,
          flexWrap: 'wrap'
        }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            href="/documents"
          >
            Back
          </Button>

          <Title level={3} style={{ margin: 0 }}>
            {document.title}
          </Title>
          
          <div style={{ flex: 1 }}></div>
          
          <Space size="middle">
            <Tooltip title="Download Document">
              <Button 
                icon={<DownloadOutlined />} 
                href={document.id ? `/api/documents/${document.id}/download` : '#'}
                target="_blank"
              >
                Download
              </Button>
            </Tooltip>
            
            <PermissionGuard area="documents" permission="edit">
              <Button 
                type="primary"
                icon={<EditOutlined />}
                href={document.id ? `/documents/${document.id}/edit` : '#'}
              >
                Edit
              </Button>
            </PermissionGuard>
            
            <Dropdown
              menu={{
                items: [
                  {
                    key: '1',
                    label: 'Share Document',
                    icon: <LinkOutlined />,
                    onClick: () => setShowShareDialog(true)
                  },
                  {
                    key: '2',
                    label: 'Delete Document',
                    icon: <DeleteOutlined />,
                    onClick: () => setShowDeleteDialog(true),
                    danger: true
                  }
                ]
              }}
              trigger={['click']}
            >
              <Button icon={<MoreOutlined />} />
            </Dropdown>
            
            {getStatusBadge(document.processingStatus)}
          </Space>
        </div>
        
        {/* Processing Alert if needed */}
        {document.processingStatus && ['PROCESSING', 'PENDING', 'QUEUED'].includes(document.processingStatus as string) && (
          <Alert
            type="info"
            showIcon
            message="Document Processing"
            description={
              <div>
                <div>{getProcessingStatusText(document.processingStatus)}</div>
                <Progress 
                  style={{ marginTop: 8 }}
                  percent={getProcessingProgress(document.processingStatus)} 
                  status="active"
                />
              </div>
            }
            action={
              <Button 
                size="small" 
                type="text"
                icon={<SyncOutlined />}
                onClick={handleRefreshStatus}
                loading={refreshStatusMutation.isPending}
              >
                Refresh
              </Button>
            }
            style={{ marginBottom: 24 }}
          />
        )}
        
        {/* Tabs */}
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <TabPane tab="Overview" key="1">
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={16}>
                <Card bordered={false}>
                  <Title level={5}>Document Information</Title>
                  <Descriptions bordered size="small" column={{ xs: 1, md: 2 }}>
                    <Descriptions.Item label="Document ID">
                      <Text copyable>{document.id}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Created">
                      {formatDate(document.createdAt)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Type">
                      {DOC_TYPES[document.type as keyof typeof DOC_TYPES] || 'Unknown'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Size">
                      {document.fileSize ? `${(document.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      {getStatusBadge(document.processingStatus)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Last Updated">
                      {formatDate(document.updatedAt)}
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
                      text={VISIBILITY_OPTIONS[document.visibility as keyof typeof VISIBILITY_OPTIONS] || 'Unknown'} 
                    />
                    
                    {document.sharedWith && document.sharedWith.length > 0 && (
                      <>
                        <Title level={5} style={{ marginTop: 16, marginBottom: 8 }}>
                          Shared With
                        </Title>
                        <List
                          size="small"
                          dataSource={document.sharedWith}
                          renderItem={(user: any) => (
                            <List.Item>
                              <List.Item.Meta
                                avatar={<Avatar icon={<UserOutlined />} />}
                                title={user.name}
                                description={user.email}
                              />
                              <Text type="secondary">{user.accessLevel || 'View'}</Text>
                            </List.Item>
                          )}
                        />
                      </>
                    )}
                  </div>
                </Card>
              </Col>
            </Row>
          </TabPane>
          
          <TabPane tab="Version History" key="2">
            <Card bordered={false}>
              <Title level={5}>Document Versions</Title>
              <Table
                dataSource={document.versions || []}
                columns={[
                  {
                    title: 'Version',
                    dataIndex: 'version',
                    key: 'version',
                  },
                  {
                    title: 'Date',
                    dataIndex: 'date',
                    key: 'date',
                    render: (date) => format(new Date(date), 'PP'),
                  },
                  {
                    title: 'Modified By',
                    dataIndex: 'modifiedBy',
                    key: 'modifiedBy',
                  },
                  {
                    title: 'Actions',
                    key: 'actions',
                    render: () => (
                      <Space>
                        <Button type="text" size="small" icon={<EyeOutlined />}>View</Button>
                        <Button type="text" size="small" icon={<DownloadOutlined />}>Download</Button>
                      </Space>
                    ),
                  },
                ]}
                pagination={false}
                locale={{ emptyText: 'No version history available' }}
              />
            </Card>
          </TabPane>
          
          <TabPane tab="Comments" key="3">
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
                <Empty description="No comments yet" />
              )}
            </Card>
          </TabPane>
          
          <TabPane tab="Timeline" key="4">
            <Card bordered={false}>
              <Title level={5}>Activity Timeline</Title>
              {document.events && document.events.length > 0 ? (
                <Timeline>
                  {document.events.map((event: any, index: number) => (
                    <Timeline.Item key={index} dot={getTimelineIcon(event.type)}>
                      <div>
                        <Text strong>{event.action}</Text>
                        <div>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {event.timestamp ? format(new Date(event.timestamp), 'PPpp') : 'Unknown'}
                          </Text>
                        </div>
                        {event.details && <div>{event.details}</div>}
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              ) : (
                <Empty description="No timeline events available" />
              )}
            </Card>
          </TabPane>
        </Tabs>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Modal
        title="Confirm Document Deletion"
        open={showDeleteDialog}
        onCancel={() => setShowDeleteDialog(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowDeleteDialog(false)}>
            Cancel
          </Button>,
          <Button 
            key="delete" 
            danger 
            type="primary" 
            onClick={confirmDeleteDocument}
            loading={deleteDocumentMutation.isPending}
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
      
      {/* Share Dialog */}
      <Modal
        title="Share Document"
        open={showShareDialog}
        onCancel={() => setShowShareDialog(false)}
        footer={null}
      >
        <div style={{ padding: '12px 0' }}>
          <List
            itemLayout="horizontal"
            dataSource={[
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
            ]}
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
    </>
  );
}

// Helper function to get timeline icon
function getTimelineIcon(type: string) {
  switch (type) {
    case 'create': // Fall through
       return <FileOutlined style={{ fontSize: 16 }} />;
    case 'edit': // Fall through
       return <EditOutlined style={{ fontSize: 16 }} />;
    case 'status': // Fall through
       return <InfoCircleOutlined style={{ fontSize: 16 }} />;
    case 'share': // Fall through
       return <LinkOutlined style={{ fontSize: 16 }} />;
    default:
      return undefined; // Default fallback case
  }
}

// Function to render the document timeline
function renderTimeline(events: any[]) {
  return (
    <Timeline>
      {events.map((event, index) => (
        <Timeline.Item 
          key={index}
          dot={getTimelineIcon(event.type)}
        >
          <div>
            <b>{event.title}</b>
            <p>{event.description}</p>
            <small>{event.date}</small>
          </div>
        </Timeline.Item>
      ))}
    </Timeline>
  );
}
