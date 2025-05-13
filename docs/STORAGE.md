# Document Storage Implementation Guide

This document explains the storage architecture used in the BlueEarth Capital application for handling document uploads, downloads, and management.

## Overview

The application uses a hybrid storage approach:

- **Development Environment**: Local file storage in the `/uploads` directory
- **Production Environment**: AWS S3 for secure, scalable cloud storage
- **Metadata**: PostgreSQL database for document metadata and references

## Storage Configuration

The storage system automatically selects the appropriate storage backend based on environment variables:

```typescript
// Use S3 if AWS credentials are available and not forced to use local storage
const hasAwsCredentials = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
const isDevelopment = process.env.NODE_ENV === 'development';
const useLocalStorage = (!hasAwsCredentials || process.env.FORCE_LOCAL_STORAGE === 'true') && isDevelopment;
```

### Required Environment Variables

For S3 storage:
- `AWS_ACCESS_KEY_ID`: AWS access key with S3 permissions
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `S3_BUCKET_NAME`: The S3 bucket name (default: 'blueearthcapital')
- `AWS_REGION`: AWS region (should be an EU region for compliance)

Optional:
- `FORCE_LOCAL_STORAGE=true`: Forces local storage even if AWS credentials are present
- `KMS_KEY_ID`: AWS KMS key ID for enhanced encryption (if available)

## Data Residency Compliance

The system enforces European data residency by validating the AWS region:

```typescript
const isEuropeanRegion = awsRegion.startsWith('eu-') || awsRegion === 'eu-central-1';

if (!useLocalStorage && !isEuropeanRegion && process.env.NODE_ENV === 'production') {
  logger.warn(`Using non-European AWS region (${awsRegion}). For compliance, consider using an EU region.`);
}
```

## Storage Key Structure

Files are stored using a consistent key structure:

```
tenants/{tenantId}/{documentType}/{yyyy-mm-dd}/{uuid}/{filename}
```

For example:
```
tenants/00000000-0000-0000-0000-000000000001/CONTRACT/2025-05-13/9fc389af-7f48-446b-b213-11c0ed5f117a/agreement.pdf
```

This structure provides:
- Multi-tenant isolation
- Organization by document type
- Date-based partitioning
- UUID to prevent filename collisions
- Original filename preservation

## Storage API

The main functions for interacting with storage:

### Upload File
```typescript
async function uploadFile(
  buffer: Buffer, 
  storageKey: string, 
  contentType: string
): Promise<{
  storageKey: string;
  checksum: string;
  size: number;
  url?: string;
  storageType: 'local' | 's3';
}>
```

### Download File
```typescript
async function downloadFile(storageKey: string): Promise<Buffer>
```

### Delete File
```typescript
async function deleteFile(storageKey: string): Promise<boolean>
```

### Get Download URL (for direct access)
```typescript
async function getDownloadUrl(
  storageKey: string, 
  expiresInSeconds = 3600
): Promise<string>
```

## Security Features

1. **File Checksum Validation**:
   - MD5 checksums calculated for all files
   - Stored in database for integrity validation

2. **S3 Security**:
   - Server-side encryption (AES-256 or KMS)
   - Secure access policies
   - Presigned URLs for temporary access

3. **Content Type Verification**:
   - MIME type validation during upload
   - Prevents malicious file uploads

## Best Practices

1. **Repository Management**:
   - Use `.gitignore` to prevent tracking uploaded files
   - Keep directory structure with `.gitkeep` files

2. **Local Development**:
   - Clean up the `/uploads` directory periodically
   - Use `clean-uploads.js` script to remove duplicates

3. **Production Deployment**:
   - Ensure AWS credentials are properly configured
   - Verify S3 bucket policies are correctly set
   - Enable bucket lifecycle policies for automatic cleanup

## Future Enhancements

1. **Vector Database Integration**:
   - Text extraction from documents
   - Embedding generation for AI search
   - Storage of embeddings in PostgreSQL with pgvector

2. **Content Delivery Network (CDN)**:
   - CloudFront integration for faster file delivery
   - Geographic distribution for global access

3. **Advanced Security**:
   - Document watermarking
   - Digital signatures
   - Access control based on document classification