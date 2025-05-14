import express, { Request, Response } from 'express';
import { authenticate } from '../auth';
import { tenantContext } from '../middleware/tenantContext';
import { singleFileUpload } from '../middleware/upload';
import { documentController } from '../controllers/documentController';
import { authorize } from '../auth';
import { z } from 'zod';
import { documentTypeZod } from '../../shared/schema/documents/documents';

const router = express.Router();

// Schema for document search/filter
const getDocumentsSchema = z.object({
  limit: z.number().optional().default(20),
  offset: z.number().optional().default(0),
  documentType: documentTypeZod.optional(),
  search: z.string().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  tags: z.array(z.string()).optional(),
});

/**
 * @route POST /api/documents
 * @desc Upload a new document
 * @access Authenticated users
 */
router.post('/', authenticate, tenantContext, (req: Request, res: Response) => {
  singleFileUpload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Error uploading file'
      });
    }
    
    await documentController.uploadDocument(req, res);
  });
});

/**
 * @route GET /api/documents
 * @desc Get all documents
 * @access Authenticated users
 */
router.get('/', authenticate, tenantContext, documentController.getDocuments.bind(documentController));

/**
 * @route GET /api/documents/:id
 * @desc Get a document by ID
 * @access Authenticated users
 */
router.get('/:id', authenticate, tenantContext, documentController.getDocumentById.bind(documentController));

/**
 * @route DELETE /api/documents/:id
 * @desc Delete a document (soft delete)
 * @access Authenticated users with delete permission
 */
router.delete('/:id', authenticate, tenantContext, authorize(['admin', 'superadmin']), documentController.deleteDocument.bind(documentController));

export default router;