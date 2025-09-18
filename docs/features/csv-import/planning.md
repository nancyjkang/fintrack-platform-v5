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
  - **Historical Balance Adjustment**:
    - Automatic balance preservation when importing historical transactions
    - Detection of existing "Initial Balance" transactions
    - Creation of adjustment transactions to maintain current account balance
    - Proper handling of imports that affect past account states

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

#### **ImportWizard.tsx** (Main Container)
```typescript
interface ImportWizardProps {
  onComplete: (result: ImportResult) => void
  onCancel: () => void
}

interface ImportStep {
  id: 'upload' | 'mapping' | 'review' | 'importing'
  title: string
  component: React.ComponentType
  isValid: boolean
}
```

**Layout Structure (Based on v4.1):**
- **Page Header**: "Import Transactions" with back button
- **Progress Steps Bar**: Horizontal stepper with 4 steps (Upload → Mapping → Review → Import)
  - Circular numbered indicators with checkmarks when completed
  - Color-coded: Blue (active), Green (completed), Gray (pending)
  - Connected with progress lines between steps
- **Step Content Area**: White rounded card containing current step content
- **Navigation**: Step-specific action buttons (Continue, Back, Import)

#### **Step 1: Upload** (`renderUploadStep`)
**UI Elements:**
- **Account Selection Dropdown**: Required field with account list
- **File Upload Area**:
  - Native file input with `.csv` accept filter
  - File name and size display when selected
- **CSV Preview Box**: Shows first 5 lines of uploaded CSV in gray background
- **Continue Button**: Disabled until file and account selected

#### **Step 2: Mapping** (`renderMappingStep`)
**UI Elements:**
- **CSV Preview**: First 5 lines display at top
- **Smart Detection Alert**: Blue info box showing detected format
  - Format type (Credit Card, Bank, etc.)
  - Explanation of detected patterns
  - Confidence indicators
- **Column Mapping Interface**:
  - Dropdown selectors for each field (Date*, Description*, Amount*, etc.)
  - Required fields marked with red asterisk
  - "Not mapped" option for optional fields
- **Amount Interpretation Controls**:
  - Debit/Credit interpretation dropdowns
  - User override detection checkbox
- **Continue Button**: Enabled when required fields mapped

#### **Step 3: Review** (`renderReviewStep`)
**UI Elements:**
- **Summary Statistics**: 3-column grid showing:
  - Unique transactions (green)
  - Likely duplicates (yellow)
  - Exact duplicates (red)
- **Warning Alerts**: Expandable sections for:
  - CSV parsing errors with row details
  - Tier limit warnings
  - General import warnings
- **Account Info Box**: Shows selected account and current balance
- **Transactions Table**: Scrollable table with columns:
  - Import toggle (custom switch component)
  - Status badge (Unique/Likely/Exact duplicate)
  - Match reasons
  - Date, Description, Amount, Type, Category, Notes
- **Import Summary**: Shows selected count and total amount
- **Action Buttons**: Back and "Import X Transactions"

#### **Step 4: Importing** (`renderImportingStep`)
**UI Elements:**
- **Loading State**:
  - Spinning loader animation
  - Progress bar with percentage
  - Status text ("Importing X transactions...")
- **Success State**:
  - Green checkmark icon (✅)
  - Success message with import count
  - "View Transactions Now" button
  - Auto-redirect notice
- **Error State**:
  - Warning icon (⚠️)
  - Error messages in red alert box
  - "Back to Review" and "View Transactions" buttons

#### **Additional Components**

#### **CategoryMappingModal.tsx**
- Modal for mapping missing categories
- Available categories dropdown
- Batch category assignment
- No auto-suggestions (explicit requirement)

#### **Progress Steps Component**
```typescript
interface ProgressStep {
  id: string
  title: string
  isActive: boolean
  isCompleted: boolean
}

// Visual styling:
// - 8x8 rounded circles with numbers/checkmarks
// - Border-2 with step-specific colors
// - Connecting lines between steps (0.5px height)
// - Responsive text sizing
```

#### **Transaction Review Table**
```typescript
interface TransactionWithStatus {
  id: string
  date: string
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  category?: string
  notes?: string
  duplicateStatus: 'unique' | 'likely' | 'exact'
  willImport: boolean
  matchReasons?: string[]
}

// Features:
// - Custom toggle switches for import selection
// - Color-coded status badges
// - Sticky header with sorting
// - Max height with scroll
// - Hover effects on rows
```

### **Backend Services**

#### **CSVImportService**
```typescript
class CSVImportService extends BaseService {
  // Core parsing functionality
  async detectFormat(file: Buffer): Promise<CSVFormat>
  async parseCSV(csvContent: string, format?: CSVFormat): Promise<ParseResult>
  async parseCSVWithMapping(csvContent: string, mapping: ColumnMapping): Promise<ParseResult>

  // Column mapping and validation
  async mapColumns(rows: ParsedRow[], mapping: ColumnMapping): Promise<MappedTransaction[]>
  async validateTransactions(transactions: MappedTransaction[]): Promise<ValidationResult>

  // Duplicate detection
  async detectDuplicates(
    transactionsToImport: TransactionToImport[],
    existingTransactions: ExistingTransaction[]
  ): Promise<DuplicateDetectionResult>

  // Import execution
  async importTransactions(
    transactions: MappedTransaction[],
    options: ImportOptions
  ): Promise<ImportResult>

  // Historical balance handling
  async handleHistoricalImportAdjustment(
    accountId: string,
    transactions: { date: Date; amount: number }[]
  ): Promise<void>

  // Financial cube integration
  async updateFinancialCube(
    transactions: Transaction[],
    tenantId: string
  ): Promise<void>
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
interface DuplicateDetectionResult {
  exactDuplicates: DuplicateMatch[]
  likelyDuplicates: DuplicateMatch[]
  uniqueTransactions: TransactionToImport[]
}

interface DuplicateMatch {
  importTransaction: TransactionToImport
  existingTransaction: ExistingTransaction
  matchScore: number
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  matchReasons: string[]
}

interface TransactionToImport {
  accountId: string
  amount: number
  description: string
  date: Date
  categoryId?: string
  tags: string[]
  notes: string | null
  pending: boolean
}

interface ExistingTransaction {
  id: string
  accountId: string
  amount: number
  description: string
  date: Date
  categoryId: string | null
  notes: string | null
  createdAt: Date
}

// Amount pattern detection for different CSV formats
interface AmountDetection {
  pattern: 'standard_debit_credit' | 'inverted_debits' | 'inverted_credits' | 'both_inverted'
  confidence: 'high' | 'medium' | 'low'
  recommendation: string
  debitCount: number
  creditCount: number
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

## 🔄 User Experience Flow (Based on v4.1 Implementation)

### **Step 1: Upload** 📁
**User Actions:**
1. User navigates to "Import Transactions" page
2. Selects target account from dropdown (required)
3. Uploads CSV file using file input (drag-and-drop not implemented in v4.1)
4. Views CSV preview (first 5 lines) automatically displayed
5. Clicks "Continue" button (disabled until both file and account selected)

**System Actions:**
- File validation (.csv only, size limits)
- Automatic CSV parsing and preview generation
- Account list loading and display

### **Step 2: Mapping** 🗺️
**User Actions:**
1. Reviews CSV preview at top of screen
2. Examines smart detection results (blue info box)
3. Adjusts column mapping dropdowns if needed
4. Configures debit/credit interpretation settings
5. Toggles user override detection if required
6. Clicks "Continue" (enabled when required fields mapped)

**System Actions:**
- Automatic format detection (standard, inverted debits/credits, etc.)
- Intelligent column mapping suggestions
- Real-time validation of required field mappings
- Amount pattern analysis and recommendations

### **Step 3: Review** 👁️
**User Actions:**
1. Reviews duplicate detection statistics (3-column summary)
2. Examines warning alerts (parsing errors, tier limits)
3. Scrolls through transaction table to review each item
4. Toggles import switches for individual transactions
5. Reviews total import count and amount
6. Clicks "Import X Transactions" or "Back" to modify

**System Actions:**
- Duplicate detection processing (exact vs. likely matches)
- Transaction validation and error reporting
- Real-time calculation of import totals
- Account balance display and context

### **Step 4: Importing** ⚡
**User Actions:**
1. Waits for import completion (progress bar display)
2. Reviews import results (success/error state)
3. Clicks "View Transactions Now" or waits for auto-redirect
4. Or clicks "Back to Review" if errors occurred

**System Actions:**
- Bulk transaction creation with progress tracking
- Historical balance adjustment processing
- Financial cube updates (new in v5)
- Error handling and rollback if needed
- Success confirmation and navigation setup

### **Key UX Patterns from v4.1**

#### **Progressive Disclosure**
- Each step builds on the previous with clear validation
- Users cannot proceed without completing required fields
- Complex options (debit/credit interpretation) shown only when relevant

#### **Smart Defaults**
- Automatic format detection with user override capability
- Intelligent column mapping based on header analysis
- Duplicate transactions marked for skipping by default

#### **Clear Feedback**
- Color-coded progress steps with completion indicators
- Detailed error messages with specific row numbers
- Real-time validation with immediate visual feedback

#### **Error Recovery**
- Partial import success with detailed error reporting
- Ability to go back and modify settings
- Clear explanation of what went wrong and how to fix it

#### **Context Preservation**
- Selected account displayed throughout the flow
- CSV preview available in multiple steps
- Import summary shows final impact before execution

## 🧪 Testing Strategy

### **Unit Tests**
- **CSV Parsing & Format Detection**:
  - Various delimiter types (comma, semicolon, tab, pipe)
  - Different amount formats (single column, debit/credit columns)
  - Amount pattern detection (standard, inverted_debits, inverted_credits, both_inverted)
  - Date format variations (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
  - Encoding handling (UTF-8, ASCII, Windows-1252)
  - Error handling for malformed data
- **Column Mapping Logic**:
  - Intelligent field detection accuracy
  - User override capabilities
  - Template saving and loading
  - Mapping validation rules
- **Duplicate Detection Algorithms**:
  - Exact duplicate detection (same date, amount, description, account)
  - Likely duplicate detection (fuzzy matching with 85%+ similarity)
  - Date tolerance matching (within 3-day window)
  - Case-insensitive description matching
  - Multiple transaction scenarios
  - Real-world duplicate scenarios (same file imported twice)
- **Data Validation Rules**:
  - Required field validation (date, amount, description)
  - Date format validation and conversion
  - Numeric amount validation
  - Character encoding issue detection
- **Template Management**:
  - Template creation and persistence
  - Template validation and versioning
  - Institution-specific template handling

### **Integration Tests**
- **End-to-End Import Workflow**:
  - Complete CSV import flow simulation
  - File upload → Format detection → Column mapping → Preview → Import
  - Integration with existing Transaction CRUD operations
  - Integration with Financial Trends Cube updates
- **Database Transaction Integrity**:
  - Bulk transaction creation with proper rollback on errors
  - Historical balance adjustment integration
  - Account balance recalculation after import
  - Duplicate prevention at database level
- **File Upload and Processing**:
  - Multi-format file support (.csv, .txt)
  - File size limit enforcement (10MB max)
  - Memory-efficient streaming for large files
  - Progress tracking and cancellation
- **Error Handling Scenarios**:
  - Partial import success with error reporting
  - Invalid CSV format recovery
  - Network interruption handling
  - Database constraint violations

### **Performance Tests**
- **Large File Processing**:
  - 10,000+ row CSV files (target: < 30 seconds)
  - Memory usage optimization (target: < 100MB for 10MB files)
  - Chunked processing validation (500 transactions per batch)
  - Background processing for large imports
- **Concurrent Import Handling**:
  - Multiple users importing simultaneously
  - Resource contention management
  - Queue management for large imports
- **Database Bulk Insert Performance**:
  - Bulk transaction creation optimization
  - Index performance during large imports
  - Connection pool management

### **User Acceptance Tests**
- **Real Bank Statement Imports**:
  - Major bank formats (Chase, Bank of America, Wells Fargo)
  - Credit card statements (American Express, Capital One, Discover)
  - Digital payment platforms (PayPal, Venmo, Cash App)
- **Various CSV Format Compatibility**:
  - Different delimiter and encoding combinations
  - Header row variations
  - Amount format variations (single vs. debit/credit columns)
  - Date format variations
- **Error Recovery Scenarios**:
  - User correction of mapping errors
  - Handling of partial file imports
  - Recovery from duplicate detection conflicts
  - Template correction and re-import
- **Template Creation and Reuse**:
  - Template creation workflow
  - Template sharing across accounts
  - Template modification and versioning

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
- **Day 1**: File upload, CSV parsing, and format detection
  - Implement `FileUpload` component with drag-and-drop
  - Build `CSVImportService` with `parseCSV` and `parseCSVWithMapping`
  - Add format detection including amount pattern detection
  - Create basic column mapping interface
- **Day 2**: Validation, duplicate detection, and basic import
  - Implement `DuplicateDetectionService` with exact and likely matching
  - Build validation logic for required fields and data types
  - Create basic import functionality with transaction creation
  - Add error handling for malformed data

### **Phase 2: Advanced Features (Days 3-4)**
- **Day 3**: Template management and historical balance adjustment
  - Implement template saving and loading system
  - Build `handleHistoricalImportAdjustment` functionality
  - Add institution presets for major banks
  - Create template management UI components
- **Day 4**: Progress tracking and financial cube integration
  - Implement real-time progress tracking with chunked processing
  - Add financial trends cube integration using bulk metadata approach
  - Build comprehensive error reporting and recovery
  - Add import history tracking and analytics

### **Phase 3: Polish & Optimization (Day 5)**
- Performance optimization for large files (10,000+ rows)
- Memory usage optimization and streaming improvements
- UI/UX refinements based on v4.1 learnings
- Comprehensive testing including end-to-end import flow tests
- Documentation completion and deployment preparation

## 🔗 Integration Points

### **Dependencies**
- **Transaction CRUD**: For creating imported transactions
- **Categories**: For category assignment and validation
- **Bulk Operations**: For efficient batch processing
- **Account Management**: For account selection and validation

### **Financial Trends Cube Integration** 🎯
- **Real-time Cube Updates**: Imported transactions automatically update the financial trends cube
- **Bulk Metadata Approach**: Use optimized bulk update system for large imports
- **Historical Data Impact**: Handle cube regeneration for historical transaction imports
- **Performance Optimization**: Batch cube updates to minimize database load

### **Future Integrations**
- **Recurring Transactions**: Auto-detect recurring patterns from imported data
- **Budgeting**: Category budget impact analysis and warnings
- **Notifications**: Import completion and error alerts
- **Machine Learning**: Improve duplicate detection and category assignment over time

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

### **Design System & Styling (v4.1 Patterns)**
- **Color Palette**:
  - Blue: Active states (`bg-blue-600`, `text-blue-600`, `border-blue-600`)
  - Green: Success/completed (`bg-green-600`, `text-green-600`)
  - Red: Errors/duplicates (`bg-red-100`, `text-red-800`)
  - Yellow: Warnings/likely duplicates (`bg-yellow-100`, `text-yellow-800`)
  - Gray: Inactive/disabled states (`bg-gray-300`, `text-gray-400`)

- **Component Patterns**:
  - Rounded corners: `rounded-lg` (8px) for cards, `rounded-full` for buttons
  - Shadows: `shadow` for cards, `shadow-sm` for buttons
  - Spacing: `p-4` for card padding, `mb-6` for section spacing
  - Typography: `text-lg font-medium` for headings, `text-sm` for body text

- **Interactive Elements**:
  - Custom toggle switches with smooth animations (`duration-300 ease-in-out`)
  - Hover effects on table rows (`hover:bg-gray-50`)
  - Disabled states with opacity reduction (`disabled:opacity-50`)
  - Focus rings for accessibility (`focus:ring-2 focus:ring-blue-500`)

- **Layout Structure**:
  - Full-width page with centered content
  - White cards on light gray background
  - Consistent 24px margins between sections
  - Responsive grid layouts for statistics

### **Performance Targets**
- Parse 1000 rows in < 5 seconds
- Import 1000 transactions in < 30 seconds
- Support files up to 10MB (≈50,000 transactions)
- 99.9% uptime for import service
