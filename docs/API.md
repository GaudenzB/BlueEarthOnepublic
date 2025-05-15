# BlueEarthOne API Documentation

## Overview

This document provides a comprehensive reference for the BlueEarthOne API, including authentication, document management, and permissions systems. The API follows RESTful principles with JSON as the primary data exchange format.

## Authentication

### JWT Authentication Flow

The system uses JWT (JSON Web Tokens) for authentication with a dual-token approach:

1. **Access Token**: Short-lived token (default: 24 hours)
2. **Refresh Token**: Longer-lived token (default: 7 days)

#### Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Authenticate user and receive token pair |
| `/api/auth/refresh` | POST | Get new access token using refresh token |
| `/api/auth/logout` | POST | Invalidate current tokens |
| `/api/auth/me` | GET | Get current authenticated user details |

#### Login Request Example

```json
{
  "username": "admin@example.com",
  "password": "secure-password"
}
```

#### Login Response Example

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "admin@example.com",
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "admin",
      "tenantId": "00000000-0000-0000-0000-000000000001"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Document Management API

### Document Operations

| Endpoint | Method | Description | Required Role |
|----------|--------|-------------|--------------|
| `/api/documents` | GET | List documents with optional filtering | Any authenticated |
| `/api/documents/:id` | GET | Get a specific document by ID | Any authenticated |
| `/api/documents` | POST | Upload a new document | Admin, Manager |
| `/api/documents/:id` | PUT | Update document metadata | Admin, Manager |
| `/api/documents/:id` | DELETE | Mark document as deleted | Admin |
| `/api/documents/:id/restore` | POST | Restore a deleted document | Admin |
| `/api/documents/:id/versions` | GET | Get document version history | Any authenticated |

### Document Upload

Documents are uploaded using multipart/form-data. The system supports various file types including PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, and others.

#### Upload Request Example

```
POST /api/documents
Content-Type: multipart/form-data

file: [Binary file data]
title: "2025 Q1 Financial Report"
description: "Quarterly financial report for Q1 2025"
documentType: "REPORT"
isConfidential: false
tags: ["financial", "quarterly", "2025"]
```

#### Upload Response Example

```json
{
  "success": true,
  "data": {
    "id": "9e03137d-fb71-462e-b791-52f42e1470ee",
    "title": "2025 Q1 Financial Report",
    "description": "Quarterly financial report for Q1 2025",
    "documentType": "REPORT",
    "isConfidential": false,
    "filename": "2025_q1_financial_report.pdf",
    "originalFilename": "2025 Q1 Financial Report.pdf",
    "mimeType": "application/pdf",
    "fileSize": "458972",
    "processingStatus": "PENDING",
    "createdAt": "2025-05-15T08:36:14.214Z",
    "updatedAt": "2025-05-15T08:36:14.214Z"
  }
}
```

### Document List Parameters

The document listing endpoint supports the following query parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Maximum number of results (default: 100) |
| `offset` | integer | Pagination offset (default: 0) |
| `sortBy` | string | Field to sort by (default: 'createdAt') |
| `sortOrder` | string | 'asc' or 'desc' (default: 'desc') |
| `documentType` | string | Filter by document type |
| `search` | string | Full-text search query |
| `isConfidential` | boolean | Filter by confidential status |
| `tags` | string | Comma-separated list of tags to filter by |

## Semantic Search API

### Vector Embeddings Search

The system implements vector-based semantic search using OpenAI embeddings and pgvector.

| Endpoint | Method | Description | Required Role |
|----------|--------|-------------|--------------|
| `/api/documents/search/semantic` | POST | Perform semantic search across documents | Any authenticated |

#### Semantic Search Request Example

```json
{
  "query": "capital allocation strategies for renewable investments",
  "documentType": "REPORT",
  "limit": 5,
  "minSimilarity": 0.7
}
```

#### Semantic Search Response Example

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "documentId": "9e03137d-fb71-462e-b791-52f42e1470ee",
        "title": "2025 Q1 Financial Report",
        "documentType": "REPORT",
        "chunkText": "Our capital allocation strategy continues to prioritize renewable energy investments, with 42% of new capital directed to solar and wind projects in emerging markets...",
        "similarity": 0.89,
        "createdAt": "2025-05-15T08:36:14.214Z"
      },
      // Additional results...
    ],
    "totalResults": 3
  }
}
```

## Permissions System

### Role-Based Access Control

The system implements a hierarchical role-based access control model:

1. **Superadmin**: System-wide access across all tenants
2. **Admin**: Full access within assigned tenant
3. **Manager**: Can manage documents with some restrictions
4. **User**: Basic document access with limited permissions

### Document Access Rules

Documents are governed by the following access rules:

1. **Tenant Isolation**: Users can only access documents within their tenant
2. **Confidential Documents**: 
   - Admin and Superadmin can access all confidential documents
   - Managers and Users can only access confidential documents explicitly shared with them
3. **Document Type Restrictions**: Certain document types may have additional access restrictions

### Permissions Checking Process

The permission checking happens at multiple levels:

1. **API Gateway Level**: Basic authentication and role validation
2. **Service Level**: Business logic permissions (tenant, ownership)
3. **Repository Level**: Data access filtering
4. **Document Level**: Per-document permission attributes

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "You do not have permission to access this document",
    "details": {
      "resourceId": "9e03137d-fb71-462e-b791-52f42e1470ee",
      "requiredRole": "admin"
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Invalid request parameters |
| `SERVER_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

## Rate Limiting

The API implements rate limiting to prevent abuse:

- Default: 100 requests per 15-minute window per IP address
- Authentication endpoints: 10 requests per minute
- Document upload: 30 requests per hour per user

## Webhooks

The system supports webhooks for integration with external systems:

| Event | Description |
|-------|-------------|
| `document.created` | Triggered when a new document is uploaded |
| `document.processed` | Triggered when document processing completes |
| `document.updated` | Triggered when document metadata is updated |
| `document.deleted` | Triggered when a document is deleted |

## Implementation Notes

### Security Considerations

1. **JWT Security**: 
   - JWTs are signed with a strong secret
   - JWTs contain minimal information to limit exposure
   - JWT expiry is enforced on both client and server

2. **Document Storage Security**:
   - S3 storage uses server-side encryption
   - Temporary signed URLs for document access
   - CloudFront distribution for cached access with security headers

3. **API Security**:
   - HTTPS only
   - CORS restrictions
   - Content Security Policy headers
   - Input validation on all endpoints
   - Parameterized queries to prevent SQL injection