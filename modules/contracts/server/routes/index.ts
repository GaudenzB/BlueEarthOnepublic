/**
 * Contract Routes
 * 
 * This file exports all contract-related routes for the application.
 */

import { Router } from 'express';
import analyzeRoutes from './analyzeRoutes';

const router = Router();

// Include all route groups
router.use('/', analyzeRoutes);

export default router;