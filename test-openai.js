/**
 * Test script for OpenAI integration
 * 
 * This script tests the OpenAI integration for document analysis
 * It simulates a document text and uses the OpenAI utility to analyze it
 */

// Load environment variables
import 'dotenv/config';

// Import the OpenAI module 
import { analyzeDocumentText } from './server/utils/openai.js';

// Sample document text for testing
const sampleText = `
# Investment Strategy 2025

## Executive Summary
BlueEarth Capital is committed to sustainable investing with a focus on climate resilience and technological innovation. This document outlines our investment strategy for the upcoming fiscal year 2025-2026.

## Market Overview
The global market continues to show signs of volatility, with inflation rates stabilizing but geopolitical tensions creating uncertainty. ESG investments have shown remarkable resilience, with sustainable funds outperforming traditional benchmarks by an average of 4.2% in the past fiscal year.

## Key Investment Areas
1. Renewable Energy Infrastructure
   - Solar and wind power generation
   - Battery storage technologies
   - Smart grid solutions

2. Climate Tech Innovation
   - Carbon capture and sequestration
   - Sustainable materials
   - Circular economy solutions

3. AgTech and Sustainable Food Systems
   - Precision agriculture
   - Alternative proteins
   - Vertical farming

## Risk Assessment
While ESG investments have shown strong performance, we acknowledge several risk factors:
- Regulatory changes could impact carbon markets
- Technology adoption rates may vary in emerging markets
- Supply chain disruptions remain a concern for hardware-dependent solutions

## Financial Projections
We anticipate allocating 60% of our fund to direct investments and 40% to fund partnerships. Target returns are projected at 12-15% IRR over a 7-year investment horizon.

## Timeline
- Q2 2025: Initial capital deployment
- Q3 2025: First portfolio review
- Q1 2026: Impact assessment and reporting
- Q4 2026: Portfolio optimization

## Conclusion
This strategy positions BlueEarth Capital to capitalize on the transition to a more sustainable global economy while delivering strong financial returns to our investors.
`;

// Test the analyzeDocumentText function
async function testOpenAIAnalysis() {
  console.log('Testing OpenAI document analysis...');
  console.log('API Key configured:', process.env.OPENAI_API_KEY ? 'Yes' : 'No');
  
  try {
    console.log('\nAnalyzing sample document...');
    const result = await analyzeDocumentText(
      sampleText,
      'Investment Strategy 2025',
      'REPORT'
    );
    
    console.log('\n--- Analysis Results ---');
    console.log('Summary:', result.summary);
    console.log('\nEntities:', JSON.stringify(result.entities, null, 2));
    console.log('\nTimeline:', JSON.stringify(result.timeline, null, 2));
    console.log('\nKey Insights:', JSON.stringify(result.keyInsights, null, 2));
    console.log('\nCategories:', JSON.stringify(result.categories, null, 2));
    console.log('\nConfidence Score:', result.confidence);
    
    if (result.errorDetails) {
      console.error('\nError Details:', result.errorDetails);
    }
    
    console.log('\nOpenAI integration test completed successfully!');
  } catch (error) {
    console.error('Error testing OpenAI integration:', error);
  }
}

// Run the test
testOpenAIAnalysis();