/**
 * Test script for document analysis using OpenAI integration
 * 
 * This script tests the document analysis functionality using OpenAI's API
 * to verify the robustness of our error handling implementation.
 */
import 'dotenv/config';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test text snippets
const contractText = `
EMPLOYMENT AGREEMENT

THIS EMPLOYMENT AGREEMENT (the "Agreement") is made and entered into as of May 1, 2025,
by and between BlueEarth Capital AG, a Swiss corporation (the "Company"), and Jane Smith, 
an individual (the "Employee").

1. EMPLOYMENT
   The Company hereby employs the Employee, and the Employee hereby accepts employment
   with the Company, upon the terms and conditions set forth in this Agreement.

2. POSITION AND DUTIES
   The Employee shall serve as Senior Investment Manager of the Company, with such
   duties and responsibilities as are commensurate with such position.

3. COMPENSATION
   Base Salary. As compensation for the services to be rendered by the Employee hereunder,
   the Company shall pay to the Employee an annual base salary of CHF 180,000,
   payable in accordance with the Company's normal payroll procedures.
`;

const reportText = `
Q1 2025 QUARTERLY INVESTMENT REPORT
CONFIDENTIAL - INTERNAL USE ONLY

EXECUTIVE SUMMARY
BlueEarth Capital's portfolio performance exceeded benchmarks by 2.3% in Q1 2025,
with significant outperformance in the renewable energy and sustainable agriculture sectors.
Total assets under management grew to CHF 3.2 billion, representing an 8% increase over the previous quarter.

KEY HIGHLIGHTS:
- New investments in three early-stage climate tech companies totaling CHF 45 million
- Successful exit from BuildGreen Solutions with 3.2x return on invested capital
- Launched new Sustainable Blue Economy Fund with CHF 200 million in initial commitments
- Improved ESG metrics across 85% of portfolio companies
`;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Test document analysis with proper JSON format
 */
async function testDocumentAnalysis() {
  console.log('Testing document analysis with OpenAI integration...');
  console.log('OpenAI API Key configured:', process.env.OPENAI_API_KEY ? 'Yes' : 'No');

  if (!process.env.OPENAI_API_KEY) {
    console.error('ERROR: OPENAI_API_KEY is not configured. Please set it in your .env file.');
    return;
  }
  
  try {
    console.log('\n1. Testing Contract Analysis:');
    const contractAnalysis = await analyzeDocument(contractText, 'Employment Contract', 'CONTRACT');
    console.log('Contract Analysis Response:', JSON.stringify(contractAnalysis, null, 2));
    
    console.log('\n2. Testing Report Analysis:');
    const reportAnalysis = await analyzeDocument(reportText, 'Quarterly Investment Report', 'REPORT');
    console.log('Report Analysis Response:', JSON.stringify(reportAnalysis, null, 2));
    
    console.log('\n3. Testing Error Handling with Invalid Document Type:');
    try {
      await analyzeDocument('Very short text', 'Test Document', 'INVALID_TYPE');
    } catch (error) {
      console.log('Successfully caught error for invalid document type:', error.message);
    }
    
    console.log('\n4. Testing Error Handling with Empty Text:');
    try {
      await analyzeDocument('', 'Empty Document', 'REPORT');
    } catch (error) {
      console.log('Successfully caught error for empty text:', error.message);
    }
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

/**
 * Analyze document text with OpenAI
 * @param {string} text - Document text content
 * @param {string} title - Document title
 * @param {string} documentType - Document type (CONTRACT, REPORT, etc.)
 * @returns {object} - Analysis results
 */
async function analyzeDocument(text, title, documentType) {
  if (!text || text.trim().length === 0) {
    throw new Error('Document text cannot be empty');
  }
  
  // Validate document type
  const validTypes = ['CONTRACT', 'REPORT', 'POLICY', 'PRESENTATION', 'AGREEMENT', 'CORRESPONDENCE', 'INVOICE', 'OTHER'];
  if (!validTypes.includes(documentType)) {
    throw new Error(`Invalid document type: ${documentType}. Must be one of: ${validTypes.join(', ')}`);
  }
  
  // Create a prompt based on document type
  let prompt = '';
  let maxWords = 100;
  
  switch (documentType) {
    case 'CONTRACT':
      prompt = `Analyze this contract titled "${title}". Extract key parties, important dates, financial terms, and obligations. Return the analysis as structured JSON with these fields: 
      - summary (concise 2-3 sentence overview)
      - parties (array of entities involved)
      - keyDates (array of important dates with context)
      - financialTerms (array of financial obligations)
      - keyObligations (array of main responsibilities for each party)
      - riskFactors (array of potential risks or contingencies)
      - recommendedActions (array of suggested next steps)
      - confidence (number between 0-1 indicating analysis confidence)`;
      break;
      
    case 'REPORT':
      prompt = `Analyze this report titled "${title}". Extract key findings, metrics, trends, and recommendations. Return the analysis as structured JSON with these fields:
      - summary (concise 2-3 sentence overview)
      - keyFindings (array of main insights)
      - metrics (array of important numerical data points)
      - trends (array of identified patterns)
      - recommendations (array of suggested actions)
      - confidence (number between 0-1 indicating analysis confidence)`;
      break;
      
    default:
      prompt = `Analyze this ${documentType.toLowerCase()} document titled "${title}". Extract key information and insights. Return the analysis as structured JSON with these fields:
      - summary (concise 2-3 sentence overview)
      - keyInsights (array of main points)
      - entities (array of organizations or people mentioned)
      - topics (array of main subjects covered)
      - confidence (number between 0-1 indicating analysis confidence)`;
  }
  
  // Add instruction about max summary length
  prompt += `\nKeep the summary under ${maxWords} words.`;
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a document analysis expert. Analyze documents and extract structured information."
        },
        {
          role: "user",
          content: `${prompt}\n\nDocument Text: ${text}`
        }
      ],
      response_format: { type: "json_object" }
    });
    
    // Parse the JSON response
    const result = JSON.parse(response.choices[0].message.content);
    
    // Add metadata about the analysis
    return {
      ...result,
      meta: {
        documentType,
        title,
        textLength: text.length,
        processingTimestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    throw new Error(`OpenAI analysis failed: ${error.message}`);
  }
}

// Run the test
testDocumentAnalysis().catch(console.error);