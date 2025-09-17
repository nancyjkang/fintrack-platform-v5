# CSV Import System - Planning Document

**Feature**: CSV Import & Export System
**Status**: 📋 **PLANNED**
**Priority**: ⚡ Priority 2 (Important - Next Up)
**Estimated Effort**: 5 days
**Planned Start**: September 18, 2025
**Dependencies**: Transaction CRUD ✅, Categories ✅, Bulk Operations

## Overview

The CSV Import System enables users to efficiently import financial data from bank statements, credit card exports, and other financial institutions. The system provides intelligent format detection, column mapping, duplicate prevention, and batch processing capabilities.

## 🎯 Business Objectives

### **Primary Goals**
- **Reduce Manual Entry**: Eliminate tedious manual transaction entry
- **Data Migration**: Enable easy migration from other financial apps
- **Bank Integration**: Support imports from major financial institutions
- **Data Accuracy**: Minimize errors through validation and duplicate detection

### **Success Metrics**
- **Import Speed**: Process 1000+ transactions in under 30 seconds
- **Accuracy Rate**: 95%+ successful transaction mapping
- **User Adoption**: 80%+ of users utilize import functionality
- **Error Reduction**: 90% reduction in duplicate transactions

## 📋 Feature Requirements

### **Core Requirements**

#### **1. Format Detection** 🔍
- **Automatic CSV Format Recognition**
  - Detect delimiter types (comma, semicolon, tab, pipe)
  - Identify header row presence and location
  - Handle various encoding formats (UTF-8, ASCII, Windows-1252)
  - Support quoted fields and escaped characters
  - Detect date formats automatically (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, etc.)

#### **2. Column Mapping** 🗺️
- **Intelligent Field Mapping with User Override**
  - Auto-detect common column patterns:
    - Date: "Date", "Transaction Date", "Posted Date", "Effective Date"
    - Amount: "Amount", "Debit", "Credit", "Transaction Amount"
    - Description: "Description", "Memo", "Reference", "Payee"
    - Category: "Category", "Type", "Classification"
  - **User Override Capabilities**:
    - Drag-and-drop column assignment
    - Manual field selection dropdowns
    - Custom field naming and mapping
    - Save mapping templates for future imports

#### **3. Preview System** 👁️
- **Import Preview with Validation and Corrections**
  - **Data Preview Table**:
    - Show first 10-20 rows of mapped data
    - Highlight potential issues (invalid dates, missing amounts)
    - Color-coded validation status (green=valid, yellow=warning, red=error)
  - **Validation Rules**:
    - Required fields presence (date, amount, description)
    - Date format validation and conversion
    - Numeric amount validation
    - Character encoding issues detection
  - **Correction Interface**:
    - Inline editing for problematic rows
    - Bulk correction options
    - Skip invalid rows option

#### **4. Duplicate Detection** 🔍
- **Smart Duplicate Transaction Identification**
  - **Matching Criteria**:
    - Exact amount and date match
    - Similar description (fuzzy matching with 85%+ similarity)
    - Same account within 3-day window
  - **Duplicate Resolution Options**:
    - Skip duplicates (default)
    - Import as new transactions
    - Update existing transactions
    - Manual review and selection
  - **Duplicate Preview**:
    - Side-by-side comparison of existing vs. new transactions
    - Confidence score for duplicate detection
    - Bulk resolution options

#### **5. Batch Processing** ⚡
- **Efficient Bulk Import with Progress Tracking**
  - **Progress Indicators**:
    - Real-time progress bar with percentage
    - Current operation status (parsing, validating, importing)
    - Estimated time remaining
    - Success/error counters
  - **Performance Optimization**:
    - Chunked processing (500 transactions per batch)
    - Background processing for large files
    - Memory-efficient streaming for large CSV files
  - **Error Handling**:
    - Continue processing on individual row errors
    - Detailed error reporting with row numbers
    - Partial import success with error summary

### **Advanced Requirements**

#### **6. Template Management** 📝
- **Import Template System**
  - Save successful mapping configurations
  - Name and organize templates by bank/institution
  - Share templates across accounts
  - Template validation and versioning

#### **7. Institution Presets** 🏦
- **Pre-configured Bank Formats**
  - Built-in templates for major banks:
    - Chase Bank, Bank of America, Wells Fargo
    - American Express, Capital One, Discover
    - PayPal, Venmo, Cash App
  - Community-contributed templates
  - Template marketplace and sharing

#### **8. Data Transformation** 🔄
- **Advanced Data Processing**
  - **Amount Handling**:
    - Separate debit/credit columns → single signed amount
    - Currency symbol removal and normalization
    - Negative amount handling for different institutions
  - **Description Cleanup**:
    - Remove bank-specific prefixes/suffixes
    - Standardize merchant names
    - Extract useful information from complex descriptions
  - **Category Auto-assignment**:
    - Machine learning-based category suggestion
    - Rule-based category assignment
    - User training and feedback loop

#### **9. Export Functionality** 📤
- **Data Export Capabilities**
  - Export transactions to CSV format
  - Custom column selection and ordering
  - Date range filtering for exports
  - Template-based export formats

## 🏗️ Technical Architecture

### **Frontend Components**

#### **ImportWizard.tsx**
```typescript
interface ImportWizardProps {
  onComplete: (result: ImportResult) => void
  onCancel: () => void
}

interface ImportStep {
  id: 'upload' | 'format' | 'mapping' | 'preview' | 'import'
  title: string
  component: React.ComponentType
  isValid: boolean
}
```

#### **FileUpload.tsx**
- Drag-and-drop file upload
- File type validation (.csv, .txt)
- File size limits (10MB max)
- Multiple file support

#### **FormatDetection.tsx**
- Automatic format detection display
- Manual format override controls
- Encoding selection
- Delimiter customization

#### **ColumnMapping.tsx**
- Interactive column mapping interface
- Template selection and management
- Field validation and preview
- Mapping confidence indicators

#### **ImportPreview.tsx**
- Data preview table with pagination
- Validation status indicators
- Inline editing capabilities
- Duplicate detection results

#### **ImportProgress.tsx**
- Real-time progress tracking
- Error reporting and resolution
- Success summary and statistics
- Navigation to imported transactions

### **Backend Services**

#### **CSVImportService**
```typescript
class CSVImportService extends BaseService {
  async detectFormat(file: Buffer): Promise<CSVFormat>
  async parseCSV(file: Buffer, format: CSVFormat): Promise<ParsedRow[]>
  async mapColumns(rows: ParsedRow[], mapping: ColumnMapping): Promise<MappedTransaction[]>
  async validateTransactions(transactions: MappedTransaction[]): Promise<ValidationResult>
  async detectDuplicates(transactions: MappedTransaction[], accountId: number): Promise<DuplicateResult[]>
  async importTransactions(transactions: MappedTransaction[], options: ImportOptions): Promise<ImportResult>
}
```

#### **FormatDetectionService**
```typescript
interface CSVFormat {
  delimiter: ',' | ';' | '\t' | '|'
  hasHeader: boolean
  encoding: 'utf-8' | 'ascii' | 'windows-1252'
  quoteChar: '"' | "'"
  escapeChar: string
  dateFormat: string
}
```

#### **DuplicateDetectionService**
```typescript
interface DuplicateMatch {
  existingTransaction: Transaction
  newTransaction: MappedTransaction
  confidence: number
  matchingFields: string[]
  resolution: 'skip' | 'import' | 'update' | 'manual'
}
```

### **Database Schema**

#### **ImportTemplate**
```sql
CREATE TABLE import_templates (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  institution VARCHAR(255),
  format_config JSONB NOT NULL,
  column_mapping JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **ImportHistory**
```sql
CREATE TABLE import_history (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  filename VARCHAR(255) NOT NULL,
  total_rows INTEGER NOT NULL,
  successful_imports INTEGER NOT NULL,
  failed_imports INTEGER NOT NULL,
  duplicates_skipped INTEGER NOT NULL,
  template_used INTEGER REFERENCES import_templates(id),
  import_summary JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔄 User Experience Flow

### **Step 1: File Upload**
1. User navigates to "Import Transactions" page
2. Drag-and-drop CSV file or click to browse
3. File validation and size check
4. Upload progress indicator

### **Step 2: Format Detection**
1. Automatic format analysis and detection
2. Display detected format with confidence
3. Allow manual override if needed
4. Preview first few rows with detected format

### **Step 3: Column Mapping**
1. Display detected column mappings
2. Show mapping confidence scores
3. Allow drag-and-drop remapping
4. Template selection and saving options

### **Step 4: Data Preview**
1. Show mapped data in table format
2. Highlight validation issues
3. Display duplicate detection results
4. Allow inline corrections and bulk actions

### **Step 5: Import Execution**
1. Final confirmation with import summary
2. Real-time progress tracking
3. Error handling and reporting
4. Success summary with navigation options

## 🧪 Testing Strategy

### **Unit Tests**
- CSV parsing with various formats
- Column mapping logic
- Duplicate detection algorithms
- Data validation rules
- Template management

### **Integration Tests**
- End-to-end import workflow
- Database transaction integrity
- File upload and processing
- Error handling scenarios

### **Performance Tests**
- Large file processing (10,000+ rows)
- Memory usage optimization
- Concurrent import handling
- Database bulk insert performance

### **User Acceptance Tests**
- Real bank statement imports
- Various CSV format compatibility
- Error recovery scenarios
- Template creation and reuse

## 📊 Analytics & Monitoring

### **Import Metrics**
- Import success/failure rates
- Processing time by file size
- Most common error types
- Template usage statistics

### **User Behavior**
- Feature adoption rates
- Template creation patterns
- Error resolution success
- User satisfaction scores

## 🚀 Implementation Phases

### **Phase 1: Core Import (Days 1-2)**
- File upload and basic CSV parsing
- Simple column mapping
- Basic validation and import

### **Phase 2: Advanced Features (Days 3-4)**
- Duplicate detection
- Template management
- Institution presets
- Progress tracking

### **Phase 3: Polish & Optimization (Day 5)**
- Performance optimization
- Error handling improvements
- UI/UX refinements
- Testing and documentation

## 🔗 Integration Points

### **Dependencies**
- **Transaction CRUD**: For creating imported transactions
- **Categories**: For category assignment and validation
- **Bulk Operations**: For efficient batch processing
- **Account Management**: For account selection and validation

### **Future Integrations**
- **Recurring Transactions**: Auto-detect recurring patterns
- **Financial Trends Cube**: Real-time cube updates during import
- **Budgeting**: Category budget impact analysis
- **Notifications**: Import completion and error alerts

## 📝 Notes

### **Technical Considerations**
- Memory-efficient streaming for large files
- Proper error handling and recovery
- Transaction atomicity for batch imports
- Security considerations for file uploads

### **User Experience Priorities**
- Intuitive wizard-based workflow
- Clear progress indication and feedback
- Helpful error messages and resolution guidance
- Template reusability for repeat imports

### **Performance Targets**
- Parse 1000 rows in < 5 seconds
- Import 1000 transactions in < 30 seconds
- Support files up to 10MB (≈50,000 transactions)
- 99.9% uptime for import service
