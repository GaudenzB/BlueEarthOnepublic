/**
 * Chunked Upload Routes
 * 
 * These routes handle the multipart upload process for large files,
 * supporting chunked uploads to S3 with resume capability.
 */

import express, { Request, Response } from 'express';
import * as path from 'path';
import { authenticate } from '../auth';
import { tenantContext } from '../middleware/tenantContext';
import { logger } from '../utils/logger';
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { documentRepository } from '../repositories/documentRepository';
import { z } from 'zod';
import { documentTypeZod } from '../../shared/schema/documents/documents';
import { sanitizeFile } from '../middleware/upload';
import { generateStorageKey } from '../services/documentStorage';

const router = express.Router();

// Get environment variables
const BUCKET_NAME = process.env['S3_BUCKET_NAME'] || 'blueearthcapital';
const AWS_REGION = process.env['AWS_REGION'] || 'eu-central-1';

// Initialize S3 client
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env['AWS_ACCESS_KEY_ID']!,
    secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY']!,
  }
});

// Create multipart upload schema
const createMultipartUploadSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  documentType: documentTypeZod.optional().default('OTHER'),
});

// Complete multipart upload schema
const completeMultipartUploadSchema = z.object({
  uploadId: z.string().min(1),
  documentKey: z.string().min(1),
  parts: z.array(z.object({
    partNumber: z.number().int().positive(),
    etag: z.string().min(1)
  })),
  metadata: z.object({
    title: z.string().min(1).max(255),
    documentType: documentTypeZod.optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isConfidential: z.boolean().optional(),
    originalFilename: z.string().min(1),
    fileSize: z.number().int().positive(),
    mimeType: z.string().min(1)
  })
});

// Abort multipart upload schema
const abortMultipartUploadSchema = z.object({
  uploadId: z.string().min(1),
  documentKey: z.string().min(1)
});

/**
 * @route GET /api/chunked-uploads/initiate
 * @desc Initialize a chunked upload
 * @access Authenticated users
 */
router.get('/initiate', authenticate, tenantContext, async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const validationResult = createMultipartUploadSchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parameters',
        errors: validationResult.error.errors
      });
    }

    const { filename, contentType, documentType } = validationResult.data;
    const tenantId = (req as any).tenantId;
    
    // Sanitize filename and generate storage key
    const sanitizedFilename = sanitizeFile(filename);
    const storageKey = generateStorageKey(tenantId, documentType, sanitizedFilename);
    
    // Create multipart upload command
    const command = new CreateMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: storageKey,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
      // Optional KMS encryption
      ...(process.env['KMS_KEY_ID'] && { 
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: process.env['KMS_KEY_ID']
      }),
      Metadata: {
        'tenant-id': tenantId,
        'document-type': documentType,
        'original-filename': filename
      }
    });
    
    // Initialize multipart upload
    const response = await s3Client.send(command);
    
    if (!response.UploadId) {
      throw new Error('Failed to initialize multipart upload');
    }
    
    // Return success with upload ID and document key
    return res.status(200).json({
      success: true,
      data: {
        uploadId: response.UploadId,
        documentKey: storageKey,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours expiry
      }
    });
    
  } catch (error: any) {
    logger.error('Error initializing chunked upload', { error });
    return res.status(500).json({
      success: false,
      message: `Failed to initialize chunked upload: ${error.message}`
    });
  }
});

/**
 * @route GET /api/chunked-uploads/part-url
 * @desc Get pre-signed URL for uploading a chunk
 * @access Authenticated users
 */
router.get('/part-url', authenticate, tenantContext, async (req: Request, res: Response) => {
  try {
    const { uploadId, documentKey, partNumber, contentType } = req.query;
    
    // Validate parameters
    if (!uploadId || !documentKey || !partNumber) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: uploadId, documentKey, partNumber'
      });
    }
    
    // Generate pre-signed URL for part upload
    const command = new UploadPartCommand({
      Bucket: BUCKET_NAME,
      Key: documentKey as string,
      UploadId: uploadId as string,
      PartNumber: parseInt(partNumber as string, 10)
      // ContentType is not supported in UploadPartCommandInput
    });
    
    // Generate pre-signed URL with 1-hour expiry
    const signedUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 3600 
    });
    
    return res.status(200).json({
      success: true,
      data: {
        url: signedUrl,
        partNumber: parseInt(partNumber as string, 10),
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
      }
    });
    
  } catch (error: any) {
    logger.error('Error generating part upload URL', { error });
    return res.status(500).json({
      success: false,
      message: `Failed to generate part upload URL: ${error.message}`
    });
  }
});

/**
 * @route POST /api/chunked-uploads/complete
 * @desc Complete a multipart upload and create document record
 * @access Authenticated users
 */
router.post('/complete', authenticate, tenantContext, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = completeMultipartUploadSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request body',
        errors: validationResult.error.errors
      });
    }
    
    const { uploadId, documentKey, parts, metadata } = validationResult.data;
    const tenantId = (req as any).tenantId;
    const userId = (req as any).user.id;
    
    // Complete multipart upload in S3
    const command = new CompleteMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: documentKey,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.map(part => ({
          PartNumber: part.partNumber,
          ETag: part.etag
        }))
      }
    });
    
    // Send completion command to S3
    const response = await s3Client.send(command);
    
    if (!response.ETag) {
      throw new Error('Failed to complete multipart upload: Missing ETag in response');
    }
    
    // Create document record in database
    const document = await documentRepository.create({
      filename: path.basename(documentKey),
      originalFilename: metadata.originalFilename,
      mimeType: metadata.mimeType,
      fileSize: String(metadata.fileSize),
      storageKey: documentKey,
      checksum: response.ETag.replace(/"/g, ''), // Remove quotes from ETag
      title: metadata.title,
      description: metadata.description,
      documentType: metadata.documentType,
      tags: metadata.tags,
      isConfidential: metadata.isConfidential,
      uploadedBy: userId,
      tenantId,
      deleted: false,
      processingStatus: 'PENDING'
    });
    
    // Queue document for processing (dynamically import to avoid circular dependencies)
    const { queueDocumentProcessing } = await import('../queue/documentJobs');
    const jobId = await queueDocumentProcessing(document.id, tenantId);
    
    logger.info('Completed chunked upload', {
      documentId: document.id,
      storageKey: documentKey,
      jobId,
      size: metadata.fileSize
    });
    
    // Return success with document information
    return res.status(201).json({
      success: true,
      data: {
        documentId: document.id,
        storageKey: documentKey,
        processingJobId: jobId
      }
    });
    
  } catch (error: any) {
    logger.error('Error completing chunked upload', { error });
    return res.status(500).json({
      success: false,
      message: `Failed to complete chunked upload: ${error.message}`
    });
  }
});

/**
 * @route POST /api/chunked-uploads/abort
 * @desc Abort a multipart upload
 * @access Authenticated users
 */
router.post('/abort', authenticate, tenantContext, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = abortMultipartUploadSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request body',
        errors: validationResult.error.errors
      });
    }
    
    const { uploadId, documentKey } = validationResult.data;
    
    // Abort multipart upload in S3
    const command = new AbortMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: documentKey,
      UploadId: uploadId
    });
    
    // Send abort command to S3
    await s3Client.send(command);
    
    logger.info('Aborted chunked upload', {
      uploadId,
      documentKey
    });
    
    return res.status(200).json({
      success: true,
      message: 'Upload aborted successfully'
    });
    
  } catch (error: any) {
    logger.error('Error aborting chunked upload', { error });
    return res.status(500).json({
      success: false,
      message: `Failed to abort chunked upload: ${error.message}`
    });
  }
});

export default router;