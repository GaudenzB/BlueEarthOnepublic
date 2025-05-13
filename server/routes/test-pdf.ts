import { Router, Request, Response } from 'express';
import multer from 'multer';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';

/**
 * Router for debugging PDF processing
 */
const router = Router();

// Set up multer for file uploads
const upload = multer({
  dest: 'uploads/temp',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * Test PDF parsing
 * POST /api/test-pdf
 */
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  logger.info('PDF test endpoint called');
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }
  
  try {
    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);
    
    logger.info('File uploaded for PDF test', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      fileBufferLength: fileBuffer.length
    });
    
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        message: 'Uploaded file is not a PDF'
      });
    }
    
    // Try to parse the PDF directly
    try {
      logger.info('Attempting to require pdf-parse module');
      const pdfParse = require('pdf-parse');
      
      logger.info('Using pdf-parse to extract text', {
        bufferValid: Buffer.isBuffer(fileBuffer),
        bufferLength: fileBuffer.length,
        bufferStart: fileBuffer.slice(0, 20).toString('hex')
      });
      
      const pdfData = await pdfParse(fileBuffer);
      
      // Return PDF parsing results
      return res.status(200).json({
        success: true,
        message: 'PDF parsed successfully',
        data: {
          pageCount: pdfData.numpages,
          info: pdfData.info,
          metadata: pdfData.metadata,
          textLength: pdfData.text.length,
          textPreview: pdfData.text.substring(0, 500) + '...'
        }
      });
    } catch (pdfError) {
      logger.error('Error in pdf-parse', {
        error: pdfError?.message || 'Unknown pdf-parse error',
        stack: pdfError?.stack
      });
      
      return res.status(500).json({
        success: false,
        message: `PDF parsing failed: ${pdfError?.message || 'Unknown error'}`,
        error: {
          message: pdfError?.message,
          name: pdfError?.name,
          stack: pdfError?.stack
        }
      });
    }
  } catch (error) {
    logger.error('Error in test-pdf endpoint', {
      error: error?.message || 'Unknown error',
      stack: error?.stack
    });
    
    return res.status(500).json({
      success: false,
      message: `Error: ${error?.message || 'Unknown error'}`
    });
  } finally {
    // Clean up the temp file
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        logger.warn('Failed to delete temp file', { path: req.file.path });
      }
    }
  }
});

export default router;