import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

// Get bucket name from environment
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'blueearthcapital';

// Check if required environment variables are set
if (!process.env.S3_BUCKET_NAME && process.env.NODE_ENV === 'production') {
  logger.error('S3_BUCKET_NAME environment variable must be set in production');
  process.exit(1); // Exit in production if S3 bucket is not configured
}

// Determine if we're using AWS S3 or local storage
const hasAwsCredentials = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Environment setting to explicitly use AWS S3 in development/test
const useAwsInDev = process.env.USE_AWS_IN_DEV === 'true';

// By default, use S3 in all environments if credentials are available or if explicitly requested
// Force local storage only if specifically requested in dev or test environments
const useLocalStorage = (!hasAwsCredentials || (process.env.FORCE_LOCAL_STORAGE === 'true' && !useAwsInDev)) && (isDevelopment || isTest);

if (useLocalStorage) {
  logger.info(`Document storage mode: LOCAL STORAGE (${process.env.NODE_ENV || 'development'} environment)`);
} else {
  logger.info(`Document storage mode: AWS S3 (${process.env.NODE_ENV || 'development'} environment)`);
  logger.info(`AWS S3 Bucket: ${BUCKET_NAME}`);
  logger.info(`AWS Region: ${process.env.AWS_REGION || 'eu-central-1'} (EU region used for compliance)`);
}

// Validate AWS region for data residency compliance
const awsRegion = process.env.AWS_REGION || 'eu-central-1'; // Default to EU region for compliance
const isEuropeanRegion = awsRegion.startsWith('eu-') || awsRegion === 'eu-central-1';

// Strictly enforce EU regions in production
if (!useLocalStorage && !isEuropeanRegion && process.env.NODE_ENV === 'production') {
  logger.error(`Data residency compliance violation: Using non-European AWS region (${awsRegion})`);
  logger.error(`Only EU regions are allowed in production for data compliance requirements`);
  throw new Error('Data residency compliance violation: Production environment requires an EU region');
}

// Create local storage directory if needed for development
const LOCAL_STORAGE_DIR = path.join(process.cwd(), 'uploads');
if (useLocalStorage) {
  if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
    fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
    logger.info(`Created local storage directory: ${LOCAL_STORAGE_DIR}`);
  }
}

// S3 Client configuration
const s3Client = !useLocalStorage ? new S3Client({
  region: awsRegion,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
}) : null;

/**
 * Generate a secure storage path for a document
 * 
 * @param tenantId - ID of the tenant
 * @param documentType - Type of document
 * @param filename - Filename
 * @returns Storage key path
 */
export function generateStorageKey(tenantId: string, documentType: string, filename: string): string {
  const uuid = uuidv4();
  // Format: tenants/{tenantId}/{documentType}/{yyyy-mm-dd}/{uuid}/{filename}
  const date = new Date().toISOString().split('T')[0];
  return `tenants/${tenantId}/${documentType}/${date}/${uuid}/${filename}`;
}

/**
 * Calculate MD5 checksum of a file buffer
 * 
 * @param buffer - File buffer
 * @returns MD5 checksum
 */
export function calculateChecksum(buffer: Buffer): string {
  return createHash('md5').update(buffer).digest('hex');
}

/**
 * Calculate base64-encoded MD5 checksum for S3 ContentMD5 header
 * 
 * @param buffer - File buffer
 * @returns Base64 encoded MD5 checksum
 */
function calculateBase64MD5(buffer: Buffer): string {
  return createHash('md5').update(buffer).digest('base64');
}

/**
 * Upload a file to storage with the provided storage key
 * 
 * @param buffer - File buffer
 * @param storageKey - Storage key
 * @param contentType - MIME type of the file
 * @returns Object with storage information
 */
export async function uploadFile(buffer: Buffer, storageKey: string, contentType: string): Promise<{
  storageKey: string;
  checksum: string;
  size: number;
  url?: string; // Optional URL for direct access
  storageType: 'local' | 's3'; // Indicates where the file is stored
}> {
  try {
    // Calculate checksum
    const checksum = calculateChecksum(buffer);
    
    if (useLocalStorage) {
      // Create directory structure if it doesn't exist
      const filePath = path.join(LOCAL_STORAGE_DIR, storageKey);
      const dirPath = path.dirname(filePath);
      
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      // Write file to local storage
      fs.writeFileSync(filePath, buffer);
      
      logger.info(`File uploaded to local storage: ${filePath}`);
      
      return {
        storageKey,
        checksum,
        size: buffer.length,
        storageType: 'local'
      };
    } else {
      // Upload to S3
      logger.debug(`Uploading file to S3: ${storageKey}`);
      logger.debug(`Bucket: ${BUCKET_NAME}, Region: ${awsRegion}`);
      
      try {
        const upload = new Upload({
          client: s3Client!,
          params: {
            Bucket: BUCKET_NAME,
            Key: storageKey,
            Body: buffer,
            ContentType: contentType,
            ContentMD5: calculateBase64MD5(buffer), // AWS expects Base64 encoded MD5
            ServerSideEncryption: 'AES256', // Enable server-side encryption
            // Optionally use KMS for enhanced security
            ...(process.env.KMS_KEY_ID && { 
              ServerSideEncryption: 'aws:kms',
              SSEKMSKeyId: process.env.KMS_KEY_ID
            }),
            Metadata: {
              'original-checksum': checksum,
              'upload-date': new Date().toISOString()
            }
          }
        });

        const result = await upload.done();
        logger.info(`Successfully uploaded file to S3: ${storageKey}`);
        
        // Get an S3 URL
        const url = result.Location || `https://${BUCKET_NAME}.s3.${awsRegion}.amazonaws.com/${encodeURIComponent(storageKey)}`;
        
        return {
          storageKey,
          checksum,
          size: buffer.length,
          url,
          storageType: 's3'
        };
      } catch (s3Error: any) {
        logger.error('S3 upload error', {
          error: s3Error.message,
          code: s3Error.code,
          statusCode: s3Error.$metadata?.httpStatusCode,
          bucket: BUCKET_NAME,
          region: awsRegion,
          key: storageKey
        });
        
        throw new Error(`S3 upload failed: ${s3Error.message}`);
      }
    }
  } catch (error: any) {
    logger.error('Error uploading file', { 
      errorType: error.name,
      errorMessage: error.message,
      storageKey,
      useLocalStorage,
      bucket: useLocalStorage ? null : BUCKET_NAME
    });
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Download a file from storage
 * 
 * @param storageKey - Storage key
 * @returns Buffer containing the file data
 */
/**
 * Get information about the current storage mode
 * 
 * @returns Object containing storage mode information
 */
export function getStorageInfo(): {
  mode: 'local' | 's3';
  bucketName?: string;
  region?: string;
  isDevEnvironment: boolean;
} {
  return {
    mode: useLocalStorage ? 'local' : 's3',
    bucketName: useLocalStorage ? undefined : BUCKET_NAME,
    region: useLocalStorage ? undefined : awsRegion,
    isDevEnvironment: process.env.NODE_ENV !== 'production'
  };
}

export async function downloadFile(storageKey: string): Promise<Buffer> {
  try {
    if (useLocalStorage) {
      // Read file from local storage
      const filePath = path.join(LOCAL_STORAGE_DIR, storageKey);
      
      if (!fs.existsSync(filePath)) {
        logger.error(`File not found in local storage: ${filePath}`);
        throw new Error(`File not found: ${filePath}`);
      }
      
      logger.debug(`Reading file from local storage: ${filePath}`);
      return fs.readFileSync(filePath);
    } else {
      // Download from S3
      logger.debug(`Attempting to download file from S3: ${storageKey}`);
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: storageKey
      });
      
      try {
        const response = await s3Client!.send(command);
        if (!response.Body) {
          throw new Error('Empty response body from S3');
        }
        
        // Convert readable stream to buffer
        logger.debug(`Successfully retrieved file from S3: ${storageKey}`);
        const stream = response.Body as Readable;
        const chunks: Buffer[] = [];
        
        return new Promise<Buffer>((resolve, reject) => {
          stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
          stream.on('error', (err) => reject(err));
          stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
      } catch (s3Error: any) {
        // Check specific S3 errors
        if (s3Error.name === 'NoSuchKey') {
          logger.error(`File not found in S3 bucket: ${BUCKET_NAME}/${storageKey}`);
          throw new Error(`File not found in S3: ${storageKey}`);
        } else {
          logger.error('S3 download error', { 
            error: s3Error.message, 
            code: s3Error.code,
            statusCode: s3Error.$metadata?.httpStatusCode,
            bucket: BUCKET_NAME,
            key: storageKey 
          });
          throw new Error(`S3 download error: ${s3Error.message}`);
        }
      }
    }
  } catch (error: any) {
    logger.error('Error downloading file', { 
      errorType: error.name,
      errorMessage: error.message,
      storageKey, 
      useLocalStorage,
      bucket: useLocalStorage ? null : BUCKET_NAME
    });
    throw new Error(`Failed to download file: ${error.message}`);
  }
}

/**
 * Delete a file from storage
 * 
 * @param storageKey - Storage key
 * @returns true if the file was deleted successfully
 */
export async function deleteFile(storageKey: string): Promise<boolean> {
  try {
    if (useLocalStorage) {
      // Delete from local storage
      const filePath = path.join(LOCAL_STORAGE_DIR, storageKey);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`File deleted from local storage: ${filePath}`);
        
        // Attempt to clean up empty directories
        try {
          const dirPath = path.dirname(filePath);
          const remainingFiles = fs.readdirSync(dirPath);
          if (remainingFiles.length === 0) {
            fs.rmdirSync(dirPath);
            logger.debug(`Removed empty directory: ${dirPath}`);
          }
        } catch (cleanupError) {
          // Non-critical error, just log it
          logger.debug('Failed to clean up empty directory', { error: cleanupError });
        }
      } else {
        logger.warn(`File not found for deletion: ${filePath}`);
      }
      
      return true;
    } else {
      // Delete from S3
      logger.debug(`Attempting to delete file from S3: ${storageKey}`);
      
      try {
        const command = new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: storageKey
        });
        
        await s3Client!.send(command);
        logger.info(`Successfully deleted file from S3: ${storageKey}`);
        return true;
      } catch (s3Error: any) {
        // Check for specific S3 errors
        if (s3Error.name === 'NoSuchKey') {
          logger.warn(`File not found in S3 for deletion: ${BUCKET_NAME}/${storageKey}`);
          // We'll consider this a success since the file is already gone
          return true;
        } else {
          logger.error('S3 deletion error', {
            error: s3Error.message,
            code: s3Error.code,
            statusCode: s3Error.$metadata?.httpStatusCode,
            bucket: BUCKET_NAME,
            key: storageKey
          });
          throw s3Error;
        }
      }
    }
  } catch (error: any) {
    logger.error('Error deleting file', { 
      errorType: error.name,
      errorMessage: error.message,
      storageKey, 
      useLocalStorage,
      bucket: useLocalStorage ? null : BUCKET_NAME
    });
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Generate a pre-signed URL for direct download
 * This is useful for temporary access to files
 * 
 * @param storageKey - S3 storage key
 * @param expiresInSeconds - URL expiration time in seconds
 * @returns Pre-signed URL
 */
export async function getDownloadUrl(storageKey: string, expiresInSeconds = 3600): Promise<string> {
  try {
    // This functionality requires the @aws-sdk/s3-request-presigner package
    // We'll skip implementation for now and return a placeholder
    return `/api/documents/download?key=${encodeURIComponent(storageKey)}`;
  } catch (error) {
    logger.error('Error generating pre-signed URL', { error, storageKey });
    throw new Error(`Failed to generate download URL: ${error.message}`);
  }
}