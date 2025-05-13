import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import { logger } from '../utils/logger';
import { authenticate } from '../auth';

const router = Router();
const upload = multer({ dest: 'uploads/' });

/**
 * Dedicated route to test PDF text extraction in isolation
 * This allows for diagnosing PDF processing issues separate from the document workflow
 */
router.post('/', authenticate, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  const file = req.file;
  
  try {
    logger.info(`PDF test initiated for file: ${file.originalname}`, {
      fileSize: file.size,
      mimeType: file.mimetype
    });

    // Extract text from the PDF using a more direct approach
    const pdfBuffer = fs.readFileSync(file.path);
    
    // Try using pdf-parse with options to avoid looking for test files
    const pdfParse = (await import('pdf-parse')).default;
    // Force it to use our buffer directly without relying on test files
    const pdfData = await pdfParse(pdfBuffer, {
      // Provide minimal options to avoid defaults that may look for test files
      pagerender: undefined,
      max: 0 // 0 = unlimited pages
    });
    const extractedText = pdfData.text || '';
    logger.debug('PDF parse completed successfully', { textLength: extractedText.length });
    
    // Log successful extraction
    logger.info(`PDF text extraction successful`, {
      fileSize: file.size,
      textLength: extractedText.length,
      excerpt: extractedText.substring(0, 100) + '...'
    });

    // Clean up the uploaded file
    fs.unlink(file.path, (err) => {
      if (err) {
        logger.error(`Error deleting temporary file: ${file.path}`, { error: err });
      }
    });

    return res.json({
      success: true,
      data: {
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        extractedText,
        textLength: extractedText.length
      }
    });
  } catch (error) {
    logger.error(`Error in PDF test extraction`, {
      filename: file.originalname,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    // Clean up the uploaded file
    fs.unlink(file.path, (err) => {
      if (err) {
        logger.error(`Error deleting temporary file: ${file.path}`, { error: err });
      }
    });

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during PDF extraction'
    });
  }
});

export default router;