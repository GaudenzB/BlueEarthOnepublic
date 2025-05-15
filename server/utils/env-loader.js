/**
 * Environment Variables Loader
 * 
 * This module ensures environment variables are loaded before any other modules.
 * It is imported at the beginning of the application to prevent validation errors.
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve the path to the root directory
const rootDir = resolve(__dirname, '..', '..');

// Load environment variables from .env file
const envPath = resolve(rootDir, '.env');
if (existsSync(envPath)) {
  const result = config({ path: envPath });
  if (result.error) {
    console.error('Error loading .env file:', result.error);
    process.exit(1);
  }
} else {
  console.warn('No .env file found at:', envPath);
}

// Ensure critical environment variables have reasonable defaults
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('JWT_SECRET environment variable is required in production');
    process.exit(1);
  } else {
    process.env.JWT_SECRET = 'wEP83kd1mG5jpkTv7XnCqL2sZ9R6bY0DfA8hJuW7xS47tEu5K6aV0pZnBxDlQ9oI';
    console.warn('Using default JWT_SECRET for development. Do not use in production!');
  }
}

export default function ensureEnvLoaded() {
  // Function exists solely to ensure this file is executed when imported
  return true;
}