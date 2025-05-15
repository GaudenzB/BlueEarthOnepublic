# BlueEarthOne API Documentation

## Overview

This document details the BlueEarthOne REST API endpoints, request/response formats, and authentication requirements.

## Authentication

All API endpoints (except where noted) require authentication using JWT tokens.

### Authentication Header

```
Authorization: Bearer <jwt_token>
```

### Roles and Permissions

The system supports the following user roles with different permission levels:

- **superadmin**: Full access to all resources across all tenants
- **admin**: Full access to all resources within their tenant
- **manager**: Access to non-confidential documents and specific confidential documents they have explicit permission for
- **user**: Limited access to non-confidential documents and specific confidential documents they have explicit permission for

## Base URL

All endpoints are relative to the base URL:

```
https://api.blueearthone.com/api
```

For development environments:

```
http://localhost:3000/api
```

## Endpoints

### Authentication

#### Login

```
POST /auth/login
```

Authenticates a user and returns access and refresh tokens.

**Request Body:**
```json
{
  "username": "username",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "username",
      "email": "user@example.com",
      "role": "admin"
    }
  }
}
```

#### Refresh Token

```
POST /auth/refresh
```

Generates a new access token using a valid refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Documents

#### Get All Documents

```
GET /documents
```

Retrieves a list of documents with optional filtering and pagination.

**Query Parameters:**
- `limit` (optional): Maximum number of documents to return (default: 20)
- `offset` (optional): Number of documents to skip (default: 0)
- `documentType` (optional): Filter by document type
- `search` (optional): Search term for filtering documents
- `sortBy` (optional): Field to sort by (default: 'createdAt')
- `sortOrder` (optional): Sort direction 'asc' or 'desc' (default: 'desc')
- `tags` (optional): Array of tags to filter by

**Response:**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Example Document",
        "description": "This is an example document",
        "documentType": "CONTRACT",
        "createdAt": "2025-05-15T08:30:00.000Z",
        "updatedAt": "2025-05-15T08:30:00.000Z",
        "filename": "example.pdf",
        "originalFilename": "example.pdf",
        "mimeType": "application/pdf",
        "fileSize": "150000",
        "isConfidential": false,
        "processingStatus": "COMPLETED"
      }
      // More documents...
    ],
    "total": 45
  }
}
```

#### Get Document by ID

```
GET /documents/:id
```

Retrieves a document by its ID.

**URL Parameters:**
- `id`: Document ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Example Document",
    "description": "This is an example document",
    "documentType": "CONTRACT",
    "createdAt": "2025-05-15T08:30:00.000Z",
    "updatedAt": "2025-05-15T08:30:00.000Z",
    "filename": "example.pdf",
    "originalFilename": "example.pdf",
    "mimeType": "application/pdf",
    "fileSize": "150000",
    "isConfidential": false,
    "processingStatus": "COMPLETED",
    "uploadedByUser": {
      "id": 1,
      "username": "johndoe",
      "name": "John Doe"
    },
    "previewToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Upload Document

```
POST /documents
```

Uploads a new document. Uses multipart/form-data encoding for file upload.

**Form Fields:**
- `file`: The document file to upload (required)
- `title`: Document title (required)
- `description`: Document description (optional)
- `documentType`: Document type (optional, one of: "CONTRACT", "AGREEMENT", "POLICY", "REPORT", "PRESENTATION", "CORRESPONDENCE", "INVOICE", "OTHER")
- `tags`: JSON array of tags (optional)
- `isConfidential`: Boolean indicating if the document is confidential (optional, default: false)
- `customMetadata`: JSON object with custom metadata (optional)

**Response:**
```json
{
  "success": true,
  "message": "Document uploaded successfully and processing has started",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "New Document",
    "description": "Description of the new document",
    "documentType": "CONTRACT",
    "createdAt": "2025-05-15T08:30:00.000Z",
    "updatedAt": "2025-05-15T08:30:00.000Z",
    "filename": "document.pdf",
    "originalFilename": "document.pdf",
    "mimeType": "application/pdf",
    "fileSize": "150000",
    "isConfidential": false,
    "processingStatus": "PENDING",
    "previewToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Update Document

```
PATCH /documents/:id
```

Updates document metadata.

**URL Parameters:**
- `id`: Document ID

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "description": "Updated document description",
  "documentType": "REPORT",
  "tags": ["tag1", "tag2"],
  "isConfidential": true,
  "customMetadata": {
    "department": "Legal",
    "contractNumber": "CN-12345"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Document updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Updated Title",
    "description": "Updated document description",
    "documentType": "REPORT",
    "tags": ["tag1", "tag2"],
    "isConfidential": true,
    "customMetadata": {
      "department": "Legal",
      "contractNumber": "CN-12345"
    },
    "updatedAt": "2025-05-15T09:15:00.000Z"
  }
}
```

#### Delete Document

```
DELETE /documents/:id
```

Soft deletes a document (marks as deleted but does not remove from storage).

**URL Parameters:**
- `id`: Document ID

**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

#### Download Document

```
GET /documents/:id/download
```

Downloads the document file.

**URL Parameters:**
- `id`: Document ID

**Response:**
The document file with appropriate content type header.

#### Preview Document

```
GET /documents/:id/preview
```

Retrieves a document for preview purposes. This endpoint can be accessed either with standard JWT authentication or with a short-lived preview token.

**URL Parameters:**
- `id`: Document ID

**Query Parameters:**
- `token` (optional): A preview token generated when the document was uploaded or retrieved

**Response:**
The document file with appropriate content type header, or HTML preview content depending on the document type.

#### Get Document Analysis

```
GET /documents/:id/analysis
```

Retrieves AI-generated analysis of a document.

**URL Parameters:**
- `id`: Document ID

**Response:**
```json
{
  "success": true,
  "data": {
    "documentId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Example Document",
    "analysis": {
      "summary": "This document is a contract between...",
      "keyPoints": ["Point 1", "Point 2"],
      "entities": {
        "people": ["John Smith", "Jane Doe"],
        "organizations": ["Acme Corp", "XYZ Inc"],
        "dates": ["January 15, 2025", "December 31, 2025"]
      },
      "sentiment": {
        "score": 0.75,
        "label": "positive"
      }
    },
    "aiProcessed": true,
    "processingStatus": "COMPLETED"
  }
}
```

#### Get Document Versions

```
GET /documents/:id/versions
```

Retrieves all versions of a document.

**URL Parameters:**
- `id`: Document ID

**Response:**
```json
{
  "success": true,
  "data": {
    "documentId": "550e8400-e29b-41d4-a716-446655440000",
    "versions": [
      {
        "id": "version-id-1",
        "createdAt": "2025-05-15T08:30:00.000Z",
        "createdBy": "John Doe",
        "versionNumber": 2,
        "changeNotes": "Updated contract terms"
      },
      {
        "id": "version-id-2",
        "createdAt": "2025-05-10T14:20:00.000Z",
        "createdBy": "Jane Smith",
        "versionNumber": 1,
        "changeNotes": "Initial document"
      }
    ]
  }
}
```

### Semantic Search

#### Search Documents

```
POST /search
```

Performs semantic search across documents.

**Request Body:**
```json
{
  "query": "contract termination clause",
  "limit": 10,
  "documentTypes": ["CONTRACT", "AGREEMENT"],
  "fromDate": "2025-01-01T00:00:00.000Z",
  "toDate": "2025-05-15T00:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Service Agreement",
        "documentType": "AGREEMENT",
        "relevanceScore": 0.89,
        "excerpt": "...this contract may be terminated with 30 days notice...",
        "matchedSections": [
          {
            "text": "Either party may terminate this contract with 30 days written notice to the other party.",
            "score": 0.92,
            "page": 3
          }
        ]
      },
      // More results...
    ],
    "totalMatches": 15
  }
}
```

## Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error message describing what went wrong",
  "errors": [
    {
      "field": "username",
      "message": "Username is required"
    }
  ],
  "code": "VALIDATION_ERROR"
}
```

### Common Error Codes

- `AUTHENTICATION_ERROR`: Authentication failure
- `AUTHORIZATION_ERROR`: Permission denied
- `VALIDATION_ERROR`: Invalid input data
- `NOT_FOUND`: Resource not found
- `SERVER_ERROR`: Internal server error

## Rate Limiting

The API implements rate limiting to prevent abuse. When rate limits are exceeded, the API will respond with a 429 Too Many Requests status code.

Headers included in the response:
- `X-RateLimit-Limit`: The maximum number of requests allowed in the time window
- `X-RateLimit-Remaining`: The number of requests remaining in the current time window
- `X-RateLimit-Reset`: The time (in seconds) until the rate limit resets

## Multi-tenancy

The API supports multi-tenancy through:

1. **JWT Token Payload**: The tenant ID is included in the JWT token
2. **Request Headers**: `X-Tenant-ID` header can be set to specify the tenant context
3. **Query Parameters**: `tenantId` query parameter can be used (lowest priority)

For security, document endpoints will only return documents belonging to the tenant associated with the authenticated user, even for superadmin users by default.