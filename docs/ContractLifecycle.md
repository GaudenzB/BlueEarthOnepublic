# Contract Lifecycle

This document outlines the complete lifecycle of contracts in the system, from upload through analysis, review, approval, and management.

## Contract States

Contracts in the system can exist in the following states:

```
DRAFT → UNDER_REVIEW → ACTIVE → EXPIRED/TERMINATED/RENEWED
```

### State Descriptions

- **DRAFT**: Initial state when a contract is first created or analyzed
- **UNDER_REVIEW**: Contract is being reviewed by stakeholders
- **ACTIVE**: Contract has been approved and is currently in effect
- **EXPIRED**: Contract has reached its expiration date without renewal
- **TERMINATED**: Contract was ended before its natural expiration date
- **RENEWED**: Contract has been renewed with a new agreement

## Contract Analysis Process

```
Document Upload → Text Extraction → AI Analysis → Rule Validation → User Review → Contract Creation
```

1. **Document Upload**: User uploads a contract document (PDF, DOCX, etc.)
2. **Text Extraction**: System extracts text content from the document
3. **AI Analysis**: The AI analyzer extracts key information with confidence scoring
   - Falls back to rule-based analysis if AI is unavailable
4. **Rule Validation**: System validates extracted data against business rules
5. **User Review**: User reviews and confirms or corrects the extracted information
6. **Contract Creation**: System creates a contract record with the finalized information

## Contract Workflow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌───────────────┐
│ 1. Document │     │ 2. Automated │     │ 3. Contract │     │ 4. Obligation │
│    Upload   │────▶│    Analysis  │────▶│   Creation  │────▶│  Extraction   │
└─────────────┘     └──────────────┘     └─────────────┘     └───────────────┘
                                                                      │
                                                                      ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌───────────────┐
│ 8. Renewal/ │     │ 7. Compliance│     │ 6. Obligation│     │ 5. Stakeholder│
│ Termination │◀────│  Monitoring  │◀────│ Management  │◀────│    Approval   │
└─────────────┘     └──────────────┘     └─────────────┘     └───────────────┘
```

## Roles and Responsibilities

| Role           | Responsibilities |
|----------------|-----------------|
| Document Owner | Uploads contract documents and initiates the analysis process |
| Contract Reviewer | Reviews and corrects contract information |
| Contract Approver | Reviews and approves contracts before they become active |
| Contract Manager | Monitors contract obligations and compliance |
| System Administrator | Configures analysis rules and user permissions |

## Integration Points

- **Document Storage**: AWS S3 for document file storage
- **Analysis**: OpenAI or rule-based analyzer for information extraction
- **Notifications**: Email notifications for contract events
- **Reporting**: Data export for contract analytics

## Key Screens

1. **Contract Upload**: Where users can upload new contract documents
2. **Contract Wizard**: Multi-step process to review and create contracts
   - Step 1: Contract Details (basic information)
   - Step 2: Contract Obligations (key requirements and deadlines)
   - Step 3: Review & Submit (final confirmation)
3. **Contract List**: Overview of all contracts with filtering options
4. **Contract Detail**: Comprehensive view of a single contract
5. **Obligation Dashboard**: Overview of upcoming obligations and deadlines

## Technical Architecture

The contract module consists of:

1. **Frontend Components**:
   - React components for forms and displays
   - State management using React Query
   - Form validation with Zod

2. **Backend Services**:
   - Contract analyzer service with AI and rule-based options
   - Document storage and retrieval
   - Contract data management

3. **Database Schema**:
   - Contracts table for basic contract information
   - Contract clauses for extracted text sections
   - Contract obligations for deadlines and requirements
   - Contract documents linking to physical files

## Contract-Related API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/contracts` | GET | List all contracts |
| `/api/contracts/:id` | GET | Get a specific contract |
| `/api/contracts` | POST | Create a new contract |
| `/api/contracts/:id` | PATCH | Update a contract |
| `/api/contracts/upload/analyze/:documentId` | POST | Analyze a document |
| `/api/contracts/upload/analysis/:analysisId` | GET | Get analysis status |
| `/api/contracts/:id/documents` | GET | Get documents attached to a contract |
| `/api/contracts/:id/obligations` | GET | Get obligations for a contract |