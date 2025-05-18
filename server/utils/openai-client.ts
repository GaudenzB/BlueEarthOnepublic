/**
 * Shared OpenAI client for use throughout the application
 */
import OpenAI from "openai";
import { logger } from "./logger";

// Get API key from environment
const apiKey = process.env['OPENAI_API_KEY'];

// Log warning if API key is not set
if (!apiKey) {
  logger.warn('OPENAI_API_KEY environment variable is not set. AI features will use fallback methods');
}

// Create shared OpenAI client instance
const openaiClient = new OpenAI({ 
  apiKey,
  // Set additional configuration as needed
  timeout: 60000, // 60 second timeout
  maxRetries: 2   // Retry failed API calls twice
});

// Export the client as default
export default openaiClient;