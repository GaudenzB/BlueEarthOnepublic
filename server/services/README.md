# Document Storage Service

## Overview

The document storage service provides a unified interface for storing and retrieving documents in both development and production environments. The system supports two storage backends:

1. **AWS S3 Storage**: Used in production by default and optionally in development
2. **Local File Storage**: Fallback for development when S3 credentials are not available

The service strictly enforces EU data residency requirements by always using the `eu-central-1` AWS region.

## Key Features

- **Unified Storage Interface**: Same API for both S3 and local storage
- **Environment-Aware Configuration**: Automatically uses the appropriate storage backend
- **EU Data Residency Compliance**: Enforces storage in EU-central-1 region
- **Development-Production Parity**: Optional S3 usage in development for testing
- **Server-Side Encryption**: All files stored in S3 use AES-256 encryption
- **Robust Error Handling**: Detailed error reporting and logging
- **Pre-signed URL Generation**: Temporary access URLs for downloads

## Configuration

The storage service is configured through environment variables:

```
# Required AWS credentials
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=eu-central-1  # Always set to EU region for compliance

# S3 bucket configuration
S3_BUCKET_NAME=blueearthcapital

# Optional development settings
USE_AWS_IN_DEV=true  # Set to 'true' to use S3 in development (default: false)
```

## Usage

The service exposes several key functions:

```typescript
// Generate a storage path with tenant isolation and date-based structure
const storageKey = generateStorageKey('tenant-id', 'DOCUMENT_TYPE', 'filename.pdf');

// Upload a file to storage (automatically selects S3 or local based on environment)
const uploadResult = await uploadFile(fileBuffer, storageKey, 'application/pdf');

// Download a file from storage
const fileBuffer = await downloadFile(storageKey);

// Generate a temporary download URL (valid for 1 hour by default)
const downloadUrl = await getDownloadUrl(storageKey);

// Delete a file from storage
const deleted = await deleteFile(storageKey);

// Get information about the current storage configuration
const storageInfo = getStorageInfo();
```

## Development vs. Production

In production, documents are always stored in AWS S3. In development, the behavior depends on:

1. The availability of AWS credentials in environment variables
2. The value of the `USE_AWS_IN_DEV` environment variable

To ensure your development environment mirrors production as closely as possible, set `USE_AWS_IN_DEV=true` in your `.env` file and provide valid AWS credentials.

## Testing S3 Storage

You can verify S3 storage is working correctly by running:

```bash
# Test upload to S3
npx tsx test-s3.ts

# Test download from S3
npx tsx test-s3-download.ts
```

These tests will confirm that your environment is properly configured for document storage.