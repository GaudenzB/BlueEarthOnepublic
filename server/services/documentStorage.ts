import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

// Check if required environment variables are set
if (!process.env.S3_BUCKET_NAME && process.env.NODE_ENV === 'production') {
  logger.error('S3_BUCKET_NAME environment variable must be set in production');
  process.exit(1); // Exit in production if S3 bucket is not configured
}

// Determine if we're using AWS S3 or local storage
const hasAwsCredentials = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
const isDevelopment = process.env.NODE_ENV === 'development';
const useLocalStorage = (!hasAwsCredentials || process.env.FORCE_LOCAL_STORAGE === 'true') && isDevelopment;

logger.info(`Document storage mode: ${useLocalStorage ? 'LOCAL STORAGE (Development)' : 'AWS S3'}`);
logger.info(`AWS Region: ${process.env.AWS_REGION || 'us-east-1'}`);

// Validate AWS region for data residency compliance
const awsRegion = process.env.AWS_REGION || 'us-east-1';
const isEuropeanRegion = awsRegion.startsWith('eu-') || awsRegion === 'eu-central-1';

if (!useLocalStorage && !isEuropeanRegion && process.env.NODE_ENV === 'production') {
  logger.warn(`Using non-European AWS region (${awsRegion}). For compliance, consider using an EU region.`);
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

// Get bucket name from environment
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'blueearthcapital';

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
        size: buffer.length
      };
    } else {
      // Upload to S3
      const upload = new Upload({
        client: s3Client!,
        params: {
          Bucket: BUCKET_NAME,
          Key: storageKey,
          Body: buffer,
          ContentType: contentType,
          ContentMD5: checksum,
          ServerSideEncryption: 'AES256', // Enable server-side encryption
          // Optionally use KMS for enhanced security
          ...(process.env.KMS_KEY_ID && { 
            ServerSideEncryption: 'aws:kms',
            SSEKMSKeyId: process.env.KMS_KEY_ID
          }),
          Metadata: {
            'original-checksum': checksum
          }
        }
      });

      await upload.done();
      
      return {
        storageKey,
        checksum,
        size: buffer.length
      };
    }
  } catch (error: any) {
    logger.error('Error uploading file', { error, storageKey, useLocalStorage });
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Download a file from storage
 * 
 * @param storageKey - Storage key
 * @returns Buffer containing the file data
 */
export async function downloadFile(storageKey: string): Promise<Buffer> {
  try {
    if (useLocalStorage) {
      // Read file from local storage
      const filePath = path.join(LOCAL_STORAGE_DIR, storageKey);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      return fs.readFileSync(filePath);
    } else {
      // Download from S3
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: storageKey
      });
      
      const response = await s3Client!.send(command);
      if (!response.Body) {
        throw new Error('Empty response body');
      }
      
      // Convert readable stream to buffer
      const stream = response.Body as Readable;
      const chunks: Buffer[] = [];
      
      return new Promise<Buffer>((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
      });
    }
  } catch (error: any) {
    logger.error('Error downloading file', { error, storageKey, useLocalStorage });
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
      } else {
        logger.warn(`File not found for deletion: ${filePath}`);
      }
      
      return true;
    } else {
      // Delete from S3
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: storageKey
      });
      
      await s3Client!.send(command);
      return true;
    }
  } catch (error: any) {
    logger.error('Error deleting file', { error, storageKey, useLocalStorage });
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