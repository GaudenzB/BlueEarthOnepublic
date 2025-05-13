/**
 * Test script for document analysis error handling using OpenAI integration
 * 
 * This script verifies the robustness of error handling in the document analysis workflow
 */
import 'dotenv/config';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Test error handling in document analysis
 */
async function testErrorHandling() {
  console.log('Testing document analysis error handling...');
  console.log('OpenAI API Key configured:', process.env.OPENAI_API_KEY ? 'Yes' : 'No');

  if (!process.env.OPENAI_API_KEY) {
    console.error('ERROR: OPENAI_API_KEY is not configured. Please set it in your .env file.');
    return;
  }
  
  try {
    // Test with invalid model name to trigger API error
    console.log('\n1. Testing API Error Handling:');
    try {
      const response = await openai.chat.completions.create({
        model: "non-existent-model", // Invalid model to trigger error
        messages: [
          {
            role: "user",
            content: "This is a test message to trigger an API error."
          }
        ]
      });
    } catch (error) {
      console.log('✅ API Error successfully caught:', error.message);
      console.log('Error type:', error.constructor.name);
      console.log('API Error response status:', error.status);
    }
    
    // Test with empty prompt
    console.log('\n2. Testing Invalid Input Error:');
    try {
      await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [] // Empty messages array violates API requirements
      });
    } catch (error) {
      console.log('✅ Empty input error successfully caught:', error.message);
    }
    
    // Test with excessively long content (to check truncation logic)
    console.log('\n3. Testing Content Length Limits:');
    const longText = 'A'.repeat(100000); // Generate a very long text
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: longText
          }
        ],
        max_tokens: 100
      });
      console.log('✅ Long content handled successfully, model returned:', response.choices[0].message.content.substring(0, 50) + '...');
    } catch (error) {
      console.log('❌ Failed to handle long content:', error.message);
    }
    
    // Test with invalid JSON response format
    console.log('\n4. Testing JSON Parsing Error:');
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are now in a test mode. When the user says 'test', respond with malformed JSON that is missing a bracket."
          },
          {
            role: "user",
            content: "test"
          }
        ]
      });
      
      // Try to parse potentially malformed JSON
      try {
        const parsedResult = JSON.parse(response.choices[0].message.content);
        console.log('Content was valid JSON:', typeof parsedResult);
      } catch (jsonError) {
        console.log('✅ JSON parsing error successfully caught:', jsonError.message);
        console.log('Original content:', response.choices[0].message.content);
      }
    } catch (error) {
      console.log('Failed to test JSON parsing:', error.message);
    }
    
  } catch (error) {
    console.error('Test suite failed with error:', error);
  }
}

// Run the test
testErrorHandling().catch(console.error);