# FinTrack Platform v4 - MVP Requirements & Architecture

## Table of Contents

- [Executive Summary](#executive-summary)
- [Architecture Overview](#architecture-overview)
- [Core Features](#core-features)
  - [Authentication System](#authentication-system)
  - [Transactions Management](#transactions-management)
  - [Account Balance Calculation](#account-balance-calculation)
  - [Date Handling System](#date-handling-system)
  - [Account Balance History Visualization](#account-balance-history-visualization)
  - [Consistent Amount Display System](#consistent-amount-display-system)
  - [Bulk Operations System](#bulk-operations-system)
  - [Category Merge System](#category-merge-system)
  - [Account Balance Anchor System with Adjustment Transactions](#account-balance-anchor-system-with-adjustment-transactions)
  - [CSV Import Logic with Data Preview](#csv-import-logic-with-data-preview)
  - [Demo Service for Testing and Onboarding](#demo-service-for-testing-and-onboarding)
  - [Import Preview Logic with Smart Transaction Type Inference](#import-preview-logic-with-smart-transaction-type-inference)
  - [Enhanced Balance History Page Layout and UX](#enhanced-balance-history-page-layout-and-ux)
  - [AI Transaction Categorization System](#ai-transaction-categorization-system)
  - [Audit Logging System](#audit-logging-system)
  - [Backup & Restore System](#backup--restore-system)
  - [Financial Freedom & Savings Incentive System](#financial-freedom--savings-incentive-system)
  - [Goal-Based Financial Planning System](#goal-based-financial-planning-system)
  - [Community Data Sharing Ecosystem](#community-data-sharing-ecosystem)
  - [Multi-Factor Authentication (MFA) System](#multi-factor-authentication-mfa-system)
  - [Mobile App Development](#mobile-app-development)
  - [Plaid Integration](#plaid-integration)
  - [Privacy vs Data Sharing Choice](#privacy-vs-data-sharing-choice)
  - [Troubleshooting Data Access System](#troubleshooting-data-access-system)
  - [Receipt Scanning & Transaction Matching](#receipt-scanning--transaction-matching)
  - [Stripe Payment Integration](#stripe-payment-integration)
  - [Data Consistency Validation System](#data-consistency-validation-system)
  - [UI Structure & Navigation](#ui-structure--navigation)
- [Implementation Details](#implementation-details)
- [Quality Assurance](#quality-assurance)
- [Migration & Future Plans](#migration--future-plans)

---

## Executive Summary

### **Project Goals**
FinTrack V4 is a **simplified, privacy-first personal finance tracking application** that prioritizes **working software** over feature completeness. Built as an MVP to validate core functionality without the complexity that plagued V3.

### **Core Philosophy: Simplicity First**
- **One Database**: SQLite (currently in-memory data service)
- **One User**: Single-user application
- **One Context**: No multi-tenancy complexity
- **One Mode**: No demo/production mode switching
- **Local Only**: No cloud sync or encryption complexity

### **Key Decisions**
- **Data Service**: In-memory storage with localStorage persistence (vs SQLite due to SSR compatibility)
- **Supabase Auth**: User authentication with fallback to mock auth
- **Next.js**: Full-stack React framework for rapid development
- **Tailwind CSS**: Utility-first styling for consistent UI

### **Success Metrics**
- 🚀 **Faster Development**: 4 weeks vs. months of debugging
- 🐛 **Fewer Bugs**: Simple architecture = fewer failure points
- 🔧 **Easier Maintenance**: Clear code, predictable behavior
- 👥 **Better User Experience**: No complex modes or authentication friction

---

## Architecture Overview

### **Technology Stack**
- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Authentication**: Supabase (with mock fallback)
- **Data Storage**: In-memory data service with localStorage persistence
- **Language**: TypeScript throughout
- **Icons**: Lucide React

### **Core Architecture Principles**
- **Privacy-First**: All data stored locally on user's device
- **Simplicity**: Minimal dependencies and complexity
- **Performance**: Fast, responsive user experience
- **Maintainability**: Clear code structure and documentation

### **Data Flow**
```
User Interface → Data Context → Data Service → localStorage
                ↓
            Supabase Auth → User Session Management
```

### **Component Architecture**
- **Layout Components**: AppLayout, Navigation, Footer
- **Feature Components**: Transactions, Accounts, Categories
- **Auth Components**: Login, Signup, ProtectedRoute
- **Shared Components**: Forms, Modals, Tables

---

## Core Features

### **Authentication System**

#### **Overview**
FinTrack V4 implements a comprehensive authentication system using Supabase for user management, providing secure login/logout functionality with session persistence.

#### **Key Components**
- **Supabase Integration**: User storage and authentication via Supabase
- **Login/Logout**: Secure authentication flow with session management
- **Protected Routes**: Route protection for authenticated users only
- **User Session**: Persistent user sessions with automatic token refresh

#### **Implementation Details**
- **User Storage**: All user data stored in Supabase database
- **Authentication Flow**: Email/password authentication with optional email confirmation
- **Session Management**: Automatic session refresh and logout handling
- **Route Protection**: `ProtectedRoute` component wrapping authenticated pages
- **Fallback System**: Mock authentication for development/testing

#### **Files Structure**
```
src/
├── contexts/AuthContext.tsx          # Authentication context
├── lib/supabase/
│   ├── supabase-client.ts           # Supabase client configuration
│   └── supabase-service.ts          # Authentication service methods
├── components/auth/
│   ├── LoginForm.tsx                # Login form component
│   ├── SignupForm.tsx               # Signup form component
│   └── ProtectedRoute.tsx           # Route protection wrapper
└── app/auth/page.tsx                # Authentication page
```

#### **Environment Configuration**
- **Supabase URL**: `NEXT_PUBLIC_SUPABASE_URL`
- **Supabase Anon Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Service Role Key**: `SUPABASE_SERVICE_ROLE_KEY` (server-side operations)

### **Transactions Management**

#### **Overview**
The transactions list provides comprehensive transaction management with filtering, sorting, and editing capabilities, matching V3's functionality in a simplified interface.

#### **Key Features**
- **Transaction Viewing**: Table display with all transaction details
- **Advanced Filtering**: Filter by description, date range, account, category, and recurring status
- **Date Range Presets**: Quick filters (this week, last week, this month, etc.)
- **Transaction Editing**: Modal-based editing with form validation
- **Recurring Transactions**: Mark transactions as recurring (bills, salary, subscriptions)
- **Summary Statistics**: Transaction count and total amount display
- **Responsive Design**: Mobile-friendly table and modal interactions

#### **Filter Options**
1. **Description**: Text search in transaction descriptions
2. **Date Range**:
   - Preset dropdowns (this week, last week, this month, last month, etc.)
   - Custom date range selection
3. **Account**: Filter by specific accounts
4. **Category**: Filter by transaction categories
5. **Recurring Status**: Filter by recurring vs. one-time transactions

#### **Implementation Details**
- **Data Source**: In-memory data service with localStorage persistence
- **Real-time Updates**: Automatic refresh when transactions are modified
- **Modal Interactions**: Edit transactions without page navigation
- **Form Validation**: Client-side validation with error handling
- **Responsive Table**: Horizontal scroll on mobile devices

#### **Files Structure**
```
src/
├── components/transactions/
│   ├── TransactionsPageContent.tsx   # Main transactions page
│   ├── TransactionsFilters.tsx       # Filter controls
│   ├── TransactionsTable.tsx         # Transaction table display
│   └── TransactionModal.tsx          # Edit transaction modal
└── app/transactions/page.tsx         # Transactions route
```

### **Recurring Transactions Feature**

#### **Overview**
The Recurring Transactions feature allows users to mark transactions as recurring (bills, salary, subscriptions, etc.) and provides filtering capabilities to view and manage these transactions separately from one-time transactions.

#### **Key Features**
- **Recurring Flag**: Mark any transaction as recurring during creation or editing
- **Visual Indicators**: Recurring transactions display with a distinctive icon in the table
- **Filtering**: Dedicated filter to view only recurring or only one-time transactions (labeled "Recurring vs not")
- **Data Persistence**: Recurring status is saved and maintained across sessions
- **Bulk Operations**: Support for marking multiple transactions as recurring
- **Form Integration**: Edit mode properly handles recurring field with dynamic form titles

#### **User Stories**
1. **As a user**, I want to mark my monthly rent payment as recurring so I can easily identify it
2. **As a user**, I want to filter to see only my recurring bills to review my monthly expenses
3. **As a user**, I want to see a visual indicator for recurring transactions in my transaction list
4. **As a user**, I want to edit a transaction and change its recurring status

#### **Implementation Details**
- **Database Schema**: `recurring` boolean field in transactions table (required field, defaults to false)
- **UI Components**: Checkbox in transaction form, filter dropdown, icon in table
- **Data Service**: Methods to handle recurring transaction operations
- **Filtering Logic**: Integration with existing transaction filter system
- **Data Migration**: Automatic migration of existing transactions to include recurring field
- **Storage**: Uses localStorage-based DataService (not SQLite) for data persistence

#### **Technical Implementation**
- **Transaction Interface**: Extended with `recurring: boolean` field
- **Form Component**: Recurring checkbox in TransactionForm
- **Table Display**: Recurring icon (🔄) in TransactionsTable
- **Filter Component**: Recurring status dropdown in TransactionsFilters
- **Data Service**: Methods for recurring transaction management

#### **Files Structure**
```
src/
├── lib/data-service.ts               # Recurring transaction methods
├── components/TransactionForm.tsx    # Recurring checkbox
├── components/transactions/
│   ├── TransactionsTable.tsx         # Recurring icon display
│   └── TransactionsFilters.tsx       # Recurring filter
├── app/dev-tools/sql-inspector/      # Data Inspector (shows localStorage data)
└── __tests__/unit/
    └── recurring-transactions.test.ts # Comprehensive tests
```

#### **Success Criteria**
- ✅ Users can mark transactions as recurring during creation
- ✅ Users can edit existing transactions to change recurring status
- ✅ Recurring transactions display with visual indicator
- ✅ Users can filter transactions by recurring status
- ✅ Recurring status persists across application sessions
- ✅ All functionality is thoroughly tested

#### **Enhanced View Transactions Page Features**

##### **Real-Time Summary Panel**
- **Filter Summary**: Displays active filter criteria (date range, account, category, type, recurring status)
- **Results Summary**: Shows total transaction count and net value of filtered results
- **Dynamic Updates**: Summary updates in real-time as filters change
- **Compact Design**: Two-line layout (filters on line 1, stats on line 2)
- **Visual Feedback**: Greyed-out text for inactive/no-op filters

##### **Bulk Operations Foundation**
- **Checkbox Selection**: Individual transaction selection with visual feedback
- **Select All/None**: Bulk selection controls for current page
- **Selection Summary**: Integrated table header showing selected count with clear option
- **Visual Indicators**: Selected rows highlighted with blue background
- **Pagination Integration**: Selection works within paginated view (100 transactions per page)

##### **Enhanced Table Design**
- **Prominent Headers**: Bold, larger font headers for better readability
- **Compact Rows**: Reduced row height (py-3) for better data density
- **Pagination Controls**: Previous/Next navigation with page info
- **Responsive Layout**: Maintains functionality across screen sizes

##### **User Experience Improvements**
- **Conditional Styling**: Filter dropdowns show greyed text when no filter is active
- **Integrated Selection**: Selection summary appears as table header row
- **Clear Visual Hierarchy**: Bold headers, compact rows, clear selection states
- **Efficient Navigation**: 100 transactions per page with easy pagination

### **Account Balance Calculation**

#### **Overview**
FinTrack V4 implements a sophisticated account balance calculation system using balance anchors and bidirectional calculation logic.

#### **Detailed Documentation**
For comprehensive details on the account balance calculation system, see: **[MVP Accounting System Documentation](./mvp-accounting-system.md)**

#### **Key Features Summary**
- **Balance Anchors**: Set reference points for accurate balance calculation
- **Bidirectional Calculation**: Calculate balances forward and backward from anchor dates
- **Account Reconciliation**: Update anchors to correct balance discrepancies
- **Initial Balance Setup**: Specify initial balance date when creating accounts
- **Transaction Impact**: Automatic calculation of transaction effects on account balances

#### **Implementation Files**
```
src/
├── lib/data-service.ts               # Balance calculation logic
├── components/AccountList.tsx        # Account management with balance date
└── contexts/DataContext.tsx          # Balance calculation methods
```

### **Account Management System**

#### **Overview**
FinTrack V4 implements a comprehensive account management system with soft delete functionality to preserve transaction history while allowing users to hide inactive accounts.

#### **Key Features**
- **Account Status Management**: Active/inactive account states with `isActive` boolean field
- **Soft Delete Functionality**: Inactivate accounts instead of permanent deletion
- **Hard Delete for Inactive Accounts**: Permanent deletion only for already inactive accounts
- **Transaction Visibility Control**: Hide transactions from inactive accounts in all reports
- **Data Integrity**: Preserve transaction history for accounting and audit purposes

#### **Account Deletion Behavior**
1. **Active Account → Delete Button**:
   - Performs **soft delete** (sets `isActive: false`)
   - Preserves all transactions and account data
   - Account becomes hidden from normal views
   - Transactions from this account are excluded from reports

2. **Inactive Account → Delete Button**:
   - Performs **hard delete** (removes account and all transactions permanently)
   - Shows confirmation dialog warning about permanent data loss
   - Cannot be undone

#### **Data Visibility Rules**
- **All Reports**: Hide transactions from inactive accounts
- **Transaction Lists**: Filter out transactions from inactive accounts
- **Account Lists**: Show inactive accounts with different styling/indication
- **Balance Calculations**: Exclude inactive accounts from balance summaries

#### **User Interface Requirements**
- **Delete Button Text**: Changes based on account status
  - Active accounts: "Delete" (performs soft delete)
  - Inactive accounts: "Delete Permanently" (performs hard delete)
- **Confirmation Dialogs**: Different messages for soft vs hard delete
- **Visual Indicators**: Inactive accounts shown with muted styling
- **Account Status**: Clear indication of active/inactive status

#### **Implementation Details**
- **Account Interface**: Extended with `isActive: boolean` field
- **Data Service Methods**:
  - `deleteAccount(id)` - Smart delete based on account status
  - `getActiveAccounts()` - Filter for active accounts only
  - `getAccounts(includeInactive?: boolean)` - Optional inactive account inclusion
- **Transaction Filtering**: All transaction queries exclude inactive account transactions
- **Data Migration**: Existing accounts default to `isActive: true`

#### **Files Structure**
```
src/
├── lib/data-service.ts               # Account management methods
├── components/AccountList.tsx        # Account display and actions
└── contexts/DataContext.tsx          # Account state management
```

#### **Success Criteria**
- ✅ Active accounts can be soft deleted (inactivated)
- ✅ Inactive accounts can be hard deleted permanently
- ✅ Transactions from inactive accounts are hidden from all reports
- ✅ Account status is clearly indicated in the UI
- ✅ Confirmation dialogs prevent accidental deletions
- ✅ Data integrity is maintained for accounting purposes

### **Account Reconciliation System**

#### **Business Requirement**
Users need the ability to correct account balances when they don't match actual bank statements or account records. This is essential for maintaining accurate financial records and ensuring the system reflects real-world account balances.

#### **Functional Requirements**
- **Balance Correction**: Allow users to set a new account balance based on external statements
- **Audit Trail**: Maintain a record of all reconciliation activities
- **Adjustment Tracking**: Automatically create adjustment transactions for balance differences
- **Date Flexibility**: Allow reconciliation for any historical date
- **Real-time Feedback**: Show users the impact of reconciliation before applying changes

#### **User Stories**
1. **As a user**, I want to reconcile my checking account when my bank statement shows a different balance
2. **As a user**, I want to see how much adjustment will be made before confirming the reconciliation
3. **As a user**, I want to reconcile accounts for any date, not just today
4. **As a user**, I want the system to automatically create adjustment transactions for discrepancies

#### **Success Criteria**
- Users can successfully reconcile account balances
- All reconciliation activities are properly recorded
- Adjustment transactions are created for balance differences
- Account balances are updated to match reconciled amounts
- The system maintains accounting integrity after reconciliation

#### **User Interface Requirements**
- **Access Point**: Reconcile option available on each account card
- **Input Fields**: New balance amount and reconciliation date
- **Visual Feedback**: Real-time calculation of adjustment amount
- **Confirmation**: Clear indication of what changes will be made
- **Error Handling**: Graceful handling of invalid inputs or system errors

### **Date Handling System**

#### **Overview**
FinTrack V4 implements a robust date handling system to ensure data consistency across timezones. The system uses string-based date handling (YYYY-MM-DD format) to prevent timezone-related issues that can cause transactions to appear on wrong dates.

#### **Key Principle**
**Data that goes in should display the same when retrieved.** When you add a transaction for 9/6/2025, you should see a transaction for 9/6/2025, not 9/5/2025.

#### **Detailed Documentation**
For comprehensive date handling guidelines and best practices, see: **[Date Handling Best Practices](./features/date-handling-best-practices.md)**

#### **Key Features Summary**
- **String-Based Storage**: All dates stored as YYYY-MM-DD strings to avoid timezone issues
- **Consistent Display**: Dates formatted consistently for user display
- **Input Validation**: Date string validation to prevent invalid entries
- **Timezone Independence**: No timezone conversion issues across different environments
- **Proven Utilities**: Date utilities ported from v3's battle-tested implementation

#### **Core Functions**
- `getCurrentDate()`: Get current date as YYYY-MM-DD string
- `formatDateForDisplay(dateString)`: Format dates for user display (e.g., "Jan 15, 2024")
- `isValidDateString(dateString)`: Validate date string format
- `toUTCDateString(date)`: Convert Date object to YYYY-MM-DD string

#### **Implementation Files**
```
src/
├── lib/utils/date-utils.ts           # Core date utilities (ported from v3)
├── components/transactions/TransactionModal.tsx    # Date input handling
├── components/transactions/TransactionsTable.tsx   # Date display formatting
├── components/TransactionList.tsx    # Date display in transaction lists
└── components/AccountList.tsx        # Account balance date handling
```

### **Account Balance History Visualization**

#### **Overview**
FinTrack V4 implements a comprehensive account balance history visualization system that provides users with detailed insights into their account performance over time. This feature is essential for testing and validating the account balance calculation system.

#### **Key Features**
- **Balance History Chart**: Interactive line chart showing account balance over time
- **Account Selection**: Dropdown to select which account to analyze
- **Date Range Selection**: Flexible date range filtering (last 30 days, 3 months, 1 year, custom)
- **Daily Balance Points**: Shows balance for each day from first transaction to current date
- **Transaction Overlay**: Visual indicators for transaction dates on the chart
- **Responsive Design**: Mobile-friendly chart with touch interactions

#### **Chart Features**
- **Line Chart**: Primary balance trend visualization
- **Bar Chart Overlay**: Daily net amount changes (positive/negative)
- **Interactive Tooltips**: Hover to see exact balance and date
- **Zoom and Pan**: Navigate through different time periods
- **Export Capability**: Save chart as image or export data

#### **Data Source**
- **Balance Calculation**: Uses existing account balance calculation system
- **Daily Timeline**: Generates daily balance points from first transaction
- **Real-time Updates**: Chart updates when transactions are added/modified
- **Performance Optimized**: Efficient calculation for large date ranges

#### **Implementation Details**
- **Chart Library**: Recharts for React-based charting
- **Data Service Integration**: Direct integration with existing data service
- **Date Handling**: Uses v4's YYYY-MM-DD string format for consistency
- **Responsive Design**: Adapts to different screen sizes
- **Loading States**: Proper loading indicators during data calculation

#### **Files Structure**
```
src/
├── app/accounts/balance-history/page.tsx    # Balance history page route
├── components/balance-history/
│   ├── AccountBalanceChart.tsx             # Main chart component
│   ├── BalanceHistoryPage.tsx              # Page layout and logic
│   ├── BalanceHistoryFilters.tsx           # Account and date filters
│   └── BalanceHistorySummary.tsx           # Summary statistics
└── lib/data-service.ts                     # Balance history calculation methods
```

#### **Page Route**
- **URL**: `/accounts/balance-history`
- **Navigation**: Accessible from main navigation menu
- **Authentication**: Protected route requiring user login
- **Responsive**: Mobile-optimized layout

### **Consistent Amount Display System**

#### **Overview**
FinTrack V4 implements a comprehensive amount display system that ensures consistent formatting of monetary values across all components, providing users with a uniform and professional experience when viewing financial data.

#### **Key Features**
- **Unified Formatting**: All amounts display with consistent currency symbols and decimal places
- **Transaction Type Awareness**: Proper positive/negative signs based on transaction type
- **Color Coding**: Visual indicators for income (green), expenses (red), and transfers (gray)
- **Responsive Design**: Amounts adapt to different screen sizes and contexts
- **Accessibility**: Clear visual hierarchy and proper contrast ratios

#### **Amount Display Rules**
- **Income Transactions**: Green color with positive sign (+$1,234.56)
- **Expense Transactions**: Red color with negative sign (-$1,234.56)
- **Transfer Transactions**: Gray color with appropriate sign based on direction
- **Account Balances**: Blue color with no sign ($1,234.56)
- **Summary Totals**: Bold formatting with appropriate color coding

#### **Implementation Details**
- **Currency Formatting**: Two decimal places with comma separators
- **Sign Logic**: Automatic sign assignment based on transaction type and context
- **Color System**: Consistent color palette across all components
- **Responsive Sizing**: Font sizes adapt to component context
- **Loading States**: Proper loading indicators during amount calculations

#### **Files Structure**
```
src/
├── components/common/
│   └── AmountDisplay.tsx                   # Reusable amount display component
├── components/transactions/
│   ├── TransactionsTable.tsx               # Amount formatting in table
│   └── TransactionsSummary.tsx             # Summary amount display
├── components/AccountList.tsx              # Account balance display
└── lib/utils/
    └── currency.ts                         # Currency formatting utilities
```

### **Bulk Operations System**

#### **Overview**
FinTrack V4 implements a comprehensive bulk operations system that allows users to efficiently manage multiple transactions through selection, filtering, and batch operations. This system provides powerful tools for managing large datasets while maintaining data integrity.

#### **Key Features**
- **Smart Selection**: Select all results from current filter criteria
- **Bulk Edit**: Update multiple transactions simultaneously
- **Bulk Delete**: Remove multiple transactions with confirmation
- **Filter Integration**: Bulk operations work with all active filters
- **Visual Feedback**: Clear indication of selected items and operation scope
- **Confirmation Dialogs**: Safety measures to prevent accidental operations

#### **Selection System**
- **Individual Selection**: Checkbox selection for individual transactions
- **Select All**: Select all transactions matching current filter criteria
- **Select None**: Clear all selections
- **Selection Counter**: Real-time count of selected transactions
- **Visual Indicators**: Highlighted rows for selected transactions

#### **Bulk Operations**
1. **Bulk Edit**:
   - Update category for multiple transactions
   - Change account assignments
   - Modify transaction types
   - Update recurring status
2. **Bulk Delete**:
   - Remove multiple transactions
   - Confirmation dialog with transaction count
   - Undo capability (if implemented)
3. **Bulk Category Assignment**:
   - Assign category to multiple transactions
   - Filter by description patterns
   - Preview changes before applying

#### **User Experience**
- **Filter-Aware**: Bulk operations respect current filter settings
- **Progress Indicators**: Visual feedback during bulk operations
- **Error Handling**: Graceful handling of partial failures
- **Undo Support**: Ability to reverse bulk operations
- **Keyboard Shortcuts**: Efficient keyboard navigation for power users

#### **Implementation Details**
- **State Management**: Centralized selection state management
- **Performance Optimization**: Efficient handling of large selection sets
- **Data Validation**: Validation of bulk operation parameters
- **Transaction Safety**: Atomic operations to maintain data integrity
- **Audit Trail**: Logging of bulk operations for accountability

#### **Files Structure**
```
src/
├── components/transactions/
│   ├── BulkActionScopeModal.tsx            # Bulk operation scope selection
│   ├── BulkUpdateModal.tsx                 # Bulk edit interface
│   ├── TransactionsTable.tsx               # Selection and bulk action triggers
│   └── TransactionsSummary.tsx             # Selection summary display
├── hooks/
│   └── useBulkOperations.ts                # Bulk operations logic
└── lib/
    └── bulk-operations-service.ts          # Bulk operations business logic
```

### **Spending Trend Report System**

#### **Overview**
FinTrack V4 implements a comprehensive spending trend analysis system that provides users with detailed insights into their spending patterns across different time periods and dimensions. This feature enables users to analyze their financial behavior through interactive charts and detailed breakdowns.

#### **Key Features**
- **Interactive Stacked Bar Charts**: Visual representation of spending by category, account, or recurring status
- **Hover Tooltips**: Detailed information showing specific category amounts and percentages
- **Visual Highlighting**: Chart segments highlight when hovered for better user experience
- **Drill-Down Functionality**: Click on tooltips to expand detailed table views below the chart
- **Multiple Breakdown Dimensions**: Analyze spending by category, account, or recurring status
- **Flexible Time Periods**: Support for weekly, bi-weekly, monthly, quarterly, bi-annually, and annually
- **Real-Time Updates**: Automatic data regeneration when user preferences change
- **Report Configuration**: Comprehensive filtering options for accounts, categories, and recurring status
- **Clear All Filters**: Easy way to reset multi-select filters

#### **Chart Features**
- **Stacked Bar Chart**: Primary visualization showing spending trends over time
- **Interactive Tooltips**: Hover to see detailed breakdown of spending for specific time periods
- **Visual Feedback**: Highlighted segments show which category is being analyzed
- **Clickable Tooltips**: "Drill down table" link to expand detailed transaction breakdowns
- **Legend Positioning**: Chart legends positioned on the right side for better space utilization
- **Responsive Design**: Charts adapt to different screen sizes

#### **Breakdown Period System**
- **Weekly Periods**: Sunday-to-Saturday weeks with "Week of [Date]" display format
- **Bi-weekly Periods**: 14-day periods with "Date Range" display format (e.g., "Jan 7 - Jan 20, 2024")
- **Monthly Periods**: Calendar months with "Month Year" display format
- **Quarterly Periods**: 3-month quarters with "Q# Year" display format
- **Bi-annually**: 6-month periods with "H# Year" display format
- **Annually**: Full year periods with "Year" display format

#### **User Interface**
- **Page Layout**: Clean, professional layout with title and configuration controls
- **Breakdown Dimension Dropdown**: Positioned next to page title for easy access
- **Breakdown Period Display**: Shows current period configuration from user preferences
- **Report Configuration Section**: Organized filters for accounts, categories, and recurring status
- **Clear All Buttons**: Easy reset functionality for multi-select filters
- **Drill-Down Tables**: Expandable sections showing detailed transaction breakdowns

#### **Data Integration**
- **User Preferences**: Seamless integration with user preference settings
- **Real-Time Updates**: Automatic data regeneration when breakdown period changes
- **Polling Mechanism**: Checks for preference changes every 2 seconds
- **Data Service Integration**: Direct integration with existing data service architecture
- **Performance Optimized**: Efficient calculation and rendering for large datasets

#### **Implementation Details**
- **Chart Library**: Recharts for React-based interactive charts
- **State Management**: React hooks for managing chart state and interactions
- **Event Handling**: Custom event handlers for hover, click, and tooltip interactions
- **Data Transformation**: Efficient aggregation and formatting of spending data
- **Type Safety**: Full TypeScript support with proper type definitions

#### **Files Structure**
```
src/
├── app/reports/spending-trend/
│   └── page.tsx                           # Main spending trend report page
├── components/charts/
│   └── SpendingTrendChart.tsx             # Interactive chart component
├── lib/
│   ├── period-utils.ts                    # Period calculation utilities
│   ├── breakdown-period-utils.ts          # Period format conversion utilities
│   └── data-service.ts                    # Data aggregation methods
└── types/
    ├── spending-trend.ts                  # Chart and report type definitions
    └── user-preferences.ts                # User preference types
```

#### **Success Criteria**
- ✅ Interactive stacked bar charts display spending trends
- ✅ Hover tooltips show detailed category information
- ✅ Visual highlighting works for all chart segments
- ✅ Clickable tooltips enable drill-down functionality
- ✅ Multiple breakdown dimensions (category, account, recurring) work correctly
- ✅ All breakdown periods (weekly through annually) function properly
- ✅ Real-time updates when user preferences change
- ✅ Report configuration filters work as expected
- ✅ Clear all functionality resets multi-select filters
- ✅ Responsive design works across different screen sizes

### **User Preferences System**

#### **Overview**
FinTrack V4 implements a comprehensive user preferences system that allows users to customize their experience and configure application settings. This system provides centralized preference management with real-time updates across all application components.

#### **Key Features**
- **Breakdown Period Configuration**: Set analysis breakdown periods (weekly, bi-weekly, monthly, quarterly, bi-annually, annually)
- **Real-Time Updates**: Changes to preferences immediately affect all relevant components
- **Persistent Storage**: User preferences are saved and maintained across sessions
- **Integration with Reports**: Preferences automatically update report configurations
- **Polling Mechanism**: Automatic detection of preference changes for seamless updates

#### **Preference Types**
- **Analysis Breakdown Period**: Controls how spending data is aggregated and displayed
  - Weekly: Sunday-to-Saturday weeks
  - Bi-weekly: 14-day periods
  - Monthly: Calendar months
  - Quarterly: 3-month quarters
  - Bi-annually: 6-month periods
  - Annually: Full year periods

#### **User Interface**
- **Preferences Page**: Dedicated page for managing all user preferences
- **Dropdown Selection**: Easy selection of breakdown period options
- **Save Confirmation**: Visual feedback when preferences are saved
- **Real-Time Display**: Current preferences shown in relevant components

#### **Data Integration**
- **Automatic Updates**: Reports and charts automatically update when preferences change
- **Polling System**: Background checking for preference changes every 2 seconds
- **Data Regeneration**: Automatic regeneration of analysis data when breakdown periods change
- **Seamless Experience**: No manual refresh required for preference changes to take effect

#### **Implementation Details**
- **Type Safety**: Full TypeScript support with proper type definitions
- **State Management**: React context for managing preference state
- **Local Storage**: Preferences persisted in browser localStorage
- **Service Integration**: Direct integration with data service for automatic updates

#### **Files Structure**
```
src/
├── app/preferences/
│   └── page.tsx                           # User preferences page
├── lib/
│   ├── user-preferences-service.ts        # Preference management service
│   └── breakdown-period-utils.ts          # Period conversion utilities
└── types/
    └── user-preferences.ts                # Preference type definitions
```

#### **Success Criteria**
- ✅ Users can set and save breakdown period preferences
- ✅ Preferences persist across application sessions
- ✅ Reports automatically update when preferences change
- ✅ Real-time polling detects preference changes
- ✅ Data regeneration works seamlessly with new preferences
- ✅ User interface provides clear feedback on preference changes

### **Category Merge System**

#### **Overview**
FinTrack V4 implements a comprehensive category merge system that allows users to consolidate multiple categories into a single category, maintaining data integrity while simplifying category management. This feature is essential for cleaning up duplicate or similar categories.

#### **Key Features**
- **Category Consolidation**: Merge multiple categories of the same type into one
- **Transaction Migration**: Automatically move all transactions from source category to target category
- **Data Integrity**: Preserve all transaction history and relationships
- **Validation**: Ensure only compatible categories can be merged (same type)
- **Cleanup**: Remove source category after successful merge

#### **Business Rules**
- **Type Compatibility**: Only categories of the same type (INCOME, EXPENSE, TRANSFER) can be merged
- **Transaction Preservation**: All transactions maintain their original data except category assignment
- **Category Cleanup**: Source category is automatically removed after merge
- **Validation**: System prevents merging categories with incompatible types

#### **User Stories**
1. **As a user**, I want to merge "Food" and "Dining" categories to simplify my expense tracking
2. **As a user**, I want to consolidate duplicate categories created during data import
3. **As a user**, I want to ensure all my transactions are preserved when merging categories
4. **As a user**, I want the system to prevent me from merging incompatible categories

#### **Implementation Details**
- **Data Service Method**: `mergeCategories(sourceCategoryId, targetCategoryId)`
- **Transaction Updates**: All transactions with source category are updated to target category
- **Category Removal**: Source category is deleted after successful merge
- **Validation**: Type compatibility check before merge operation
- **Error Handling**: Graceful handling of merge failures with rollback capability

#### **Files Structure**
```
src/
├── lib/data-service.ts               # Category merge methods
└── __tests__/unit/
    └── category-merge.test.ts        # Comprehensive merge tests
```

#### **Success Criteria**
- ✅ Users can merge categories of the same type
- ✅ All transactions are migrated to the target category
- ✅ Source category is properly removed after merge
- ✅ System prevents merging incompatible category types
- ✅ Data integrity is maintained throughout the merge process
- ✅ Comprehensive test coverage for all merge scenarios

### **Account Balance Anchor System with Adjustment Transactions**

#### **Overview**
FinTrack V4 implements a sophisticated account balance anchor system that maintains balance integrity when transactions are added, modified, or deleted. The system automatically creates adjustment transactions to preserve the accuracy of balance anchors, ensuring financial data consistency.

#### **Key Features**
- **Balance Anchors**: Set reference points for accurate balance calculation
- **Automatic Adjustments**: System creates adjustment transactions when needed
- **Anchor Integrity**: Maintains balance anchor accuracy across all operations
- **Transaction Impact**: Calculates and offsets transaction effects on anchors
- **System Transfer Category**: Uses dedicated category for adjustment transactions

#### **Business Rules**
- **Anchor Protection**: Balance anchors must remain accurate when transactions change
- **Adjustment Creation**: System automatically creates adjustment transactions when needed
- **Transaction Dating**: Adjustment transactions use the same date as the original transaction
- **System Category**: All adjustment transactions use the "System Transfer" category
- **Impact Calculation**: Adjustment amount equals the negative of the transaction impact

#### **User Stories**
1. **As a user**, I want my balance anchors to remain accurate when I add historical transactions
2. **As a user**, I want the system to automatically handle balance corrections
3. **As a user**, I want to see adjustment transactions in my transaction list for transparency
4. **As a user**, I want the system to prevent balance discrepancies from accumulating

#### **Implementation Details**
- **Anchor Creation**: `createAccountBalanceAnchor()` method with automatic adjustment
- **Adjustment Logic**: `createAdjustmentTransactionsIfNeeded()` for transaction operations
- **Impact Calculation**: Determines how transactions affect balance anchors
- **System Category**: Automatic creation and use of "System Transfer" category
- **Transaction Operations**: Integration with create, update, and delete operations

#### **Files Structure**
```
src/
├── lib/data-service.ts               # Anchor and adjustment logic
└── __tests__/unit/
    └── adjustment-transactions.test.ts # Comprehensive anchor tests
```

#### **Success Criteria**
- ✅ Balance anchors remain accurate when transactions are modified
- ✅ Adjustment transactions are automatically created when needed
- ✅ System Transfer category is properly managed
- ✅ Transaction impact calculations are accurate
- ✅ All transaction operations maintain anchor integrity
- ✅ Comprehensive test coverage for all anchor scenarios

### **CSV Import Logic with Data Preview**

#### **Overview**
FinTrack V4 implements a comprehensive CSV import system that allows users to import transaction data from CSV files with intelligent field detection, data preview, and validation. This feature enables users to migrate data from other financial applications.

#### **Key Features**
- **Field Detection**: Automatic detection of CSV column structure
- **Data Preview**: Preview imported data before final import
- **Validation**: Comprehensive data validation and error reporting
- **Duplicate Detection**: Identify and handle duplicate transactions
- **Rollback Capability**: Ability to undo import operations
- **Smart Mapping**: Intelligent mapping of CSV columns to transaction fields

#### **Business Rules**
- **Data Validation**: All imported data must pass validation rules
- **Duplicate Handling**: System identifies and reports duplicate transactions
- **Preview Required**: Users must preview data before final import
- **Rollback Support**: Import operations can be rolled back if needed
- **Field Mapping**: CSV columns are mapped to appropriate transaction fields

#### **User Stories**
1. **As a user**, I want to import my transaction history from my bank's CSV export
2. **As a user**, I want to preview the data before importing to ensure accuracy
3. **As a user**, I want the system to detect and handle duplicate transactions
4. **As a user**, I want to be able to undo an import if something goes wrong

#### **Implementation Details**
- **CSV Parsing**: Robust CSV parsing with field detection
- **Data Validation**: Comprehensive validation of imported data
- **Preview System**: Interactive preview with edit capabilities
- **Duplicate Detection**: Smart duplicate identification algorithms
- **Import Service**: Dedicated service for handling import operations

#### **Files Structure**
```
src/
├── lib/csv-import-service.ts         # CSV import logic
└── __tests__/unit/
    └── csv-import-logic.test.ts      # Import functionality tests
```

#### **Success Criteria**
- ✅ Users can import CSV files with automatic field detection
- ✅ Data preview shows accurate representation of imported data
- ✅ Validation catches and reports data errors
- ✅ Duplicate transactions are properly identified
- ✅ Import operations can be rolled back
- ✅ Comprehensive test coverage for all import scenarios

### **Demo Service for Testing and Onboarding**

#### **Overview**
FinTrack V4 implements a comprehensive demo service that provides users with realistic sample data for testing and onboarding purposes. This feature helps users understand the application's capabilities without requiring them to input their own financial data.

#### **Key Features**
- **Realistic Data**: 13 months of realistic transaction history
- **Multiple Accounts**: Sample checking, savings, and credit card accounts
- **Diverse Categories**: Comprehensive category structure with realistic transactions
- **Balance Anchors**: Properly configured balance anchors for accurate calculations
- **Easy Switching**: Simple toggle between demo and personal data
- **Data Isolation**: Demo data is completely separate from personal data

#### **Business Rules**
- **Data Separation**: Demo data never mixes with personal data
- **Realistic Scenarios**: Demo data represents common financial patterns
- **Complete Setup**: Demo includes accounts, categories, and transactions
- **Easy Reset**: Users can easily switch back to personal data
- **No Persistence**: Demo data is not saved to personal storage

#### **User Stories**
1. **As a new user**, I want to explore the app with sample data before entering my own
2. **As a user**, I want to test features without affecting my personal financial data
3. **As a user**, I want to see how the app works with realistic financial scenarios
4. **As a user**, I want to easily switch between demo and personal data

#### **Implementation Details**
- **Demo Service**: Dedicated service for managing demo data
- **Data Generation**: Realistic transaction and account data generation
- **State Management**: Proper isolation of demo vs personal data
- **UI Integration**: Demo mode indicators and controls
- **Data Loading**: Efficient loading and switching of demo data

#### **Files Structure**
```
src/
├── lib/demo-service.ts               # Demo data management
└── __tests__/unit/
    └── demo-service.test.ts          # Demo service tests
```

#### **Success Criteria**
- ✅ Users can easily switch to demo mode with realistic data
- ✅ Demo data includes comprehensive financial scenarios
- ✅ Demo data is completely isolated from personal data
- ✅ Users can easily switch back to personal data
- ✅ Demo mode provides good onboarding experience
- ✅ Comprehensive test coverage for demo functionality

### **Import Preview Logic with Smart Transaction Type Inference**

#### **Overview**
FinTrack V4 implements intelligent transaction type inference for CSV imports, automatically determining whether transactions are income, expenses, or transfers based on amount, description, and category information. This feature reduces manual data entry and improves import accuracy.

#### **Key Features**
- **Smart Inference**: Automatic transaction type detection based on multiple factors
- **Description Analysis**: Keyword-based analysis of transaction descriptions
- **Category Integration**: Uses category type information when available
- **Amount Analysis**: Considers transaction amounts in type determination
- **Confidence Scoring**: Provides confidence levels for inferred types
- **Manual Override**: Users can override inferred types when needed

#### **Business Rules**
- **Category Priority**: Category type takes precedence when available
- **Keyword Matching**: Description keywords influence type inference
- **Amount Consideration**: Positive amounts suggest income, negative suggest expenses
- **Transfer Detection**: Specific keywords identify transfer transactions
- **Fallback Logic**: Default to expense for ambiguous transactions

#### **User Stories**
1. **As a user**, I want the system to automatically determine transaction types during import
2. **As a user**, I want to see the confidence level for inferred transaction types
3. **As a user**, I want to override inferred types when the system is wrong
4. **As a user**, I want the system to learn from my corrections for future imports

#### **Implementation Details**
- **Inference Engine**: Multi-factor analysis for type determination
- **Keyword Database**: Comprehensive keyword lists for different transaction types
- **Category Integration**: Leverages existing category type information
- **Confidence Calculation**: Scoring system for inference reliability
- **Preview Integration**: Shows inferred types in import preview

#### **Files Structure**
```
src/
├── lib/import-preview-logic.ts       # Type inference logic
└── __tests__/unit/
    └── import-preview-logic.test.ts  # Inference algorithm tests
```

#### **Success Criteria**
- ✅ System accurately infers transaction types from CSV data
- ✅ Category information is properly utilized in type inference
- ✅ Keyword analysis correctly identifies transfer transactions
- ✅ Confidence scoring provides useful feedback to users
- ✅ Users can override inferred types when needed
- ✅ Comprehensive test coverage for all inference scenarios

### **Enhanced Balance History Page Layout and UX**

#### **Overview**
FinTrack V4 implements an enhanced balance history page with improved layout, better user experience, and more intuitive information architecture. The page provides users with a comprehensive view of their account balance trends with optimized visual hierarchy.

#### **Key Features**
- **Improved Layout**: Account filter moved to header for better organization
- **Current Balance Display**: Prominent current balance section below title
- **Summary Cards Integration**: Summary cards positioned within chart section
- **Visual Hierarchy**: Clear information architecture with logical flow
- **Responsive Design**: Optimized layout for all screen sizes
- **User-Friendly Labels**: Clear text labels instead of icons for better accessibility

#### **Layout Improvements**
- **Header Organization**: Account filter positioned next to page title
- **Current Balance Section**: Dedicated section for current balance display
- **Chart Integration**: Summary cards integrated within chart container
- **Visual Flow**: Logical progression from current balance to historical data
- **Accessibility**: Text labels instead of icons for better clarity

#### **User Stories**
1. **As a user**, I want to easily see my current account balance at the top of the page
2. **As a user**, I want the account filter to be easily accessible near the title
3. **As a user**, I want summary information to be clearly visible with the chart
4. **As a user**, I want the page layout to be intuitive and easy to navigate

#### **Implementation Details**
- **Layout Restructuring**: Reorganized page sections for better flow
- **Component Integration**: Summary cards integrated within chart section
- **Responsive Design**: Mobile-optimized layout with proper spacing
- **Accessibility**: Improved text labels and visual hierarchy
- **User Experience**: Streamlined navigation and information access

#### **Files Structure**
```
src/
├── app/reports/balance-history/
│   └── page.tsx                      # Enhanced balance history page
```

#### **Success Criteria**
- ✅ Current balance is prominently displayed below the title
- ✅ Account filter is easily accessible in the header
- ✅ Summary cards are integrated within the chart section
- ✅ Page layout provides clear visual hierarchy
- ✅ Responsive design works across all screen sizes
- ✅ Improved accessibility with clear text labels

### **AI Transaction Categorization System**

#### **Overview**
FinTrack V4 implements an AI-powered transaction categorization system that automatically suggests appropriate categories for user transactions based on existing category patterns, merchant names, amounts, and historical user behavior. The system maintains complete privacy by processing all data locally without external data transmission.

#### **Key Features**
- **Real-Time Suggestions**: Instant category suggestions during transaction entry
- **Bulk Categorization**: Process multiple uncategorized transactions at once
- **Learning System**: Improves accuracy based on user feedback and corrections
- **Confidence Scoring**: Provides reliability indicators for all suggestions
- **Alternative Options**: Shows multiple category options when uncertain
- **Privacy-First**: All AI processing happens locally in the browser

#### **Core Functionality**
- **Pattern Recognition**: Analyzes merchant names, amounts, dates, and user patterns
- **Confidence Levels**: High (>80%), Medium (60-80%), Low (<60%) confidence scoring
- **User Feedback Loop**: Learns from acceptances, rejections, and manual corrections
- **Bulk Processing**: Auto-applies high-confidence suggestions, reviews medium-confidence
- **Manual Override**: Complete user control over all categorization decisions

#### **User Stories**
1. **As a user**, I want to see category suggestions when adding transactions so I can categorize faster
2. **As a user**, I want to understand why categories were suggested so I can make informed decisions
3. **As a user**, I want to categorize multiple transactions at once so I can catch up quickly
4. **As a user**, I want the system to learn from my corrections so suggestions improve over time
5. **As a user**, I want to see confidence levels so I know which suggestions to trust
6. **As a user**, I want my learning data to stay private so my financial patterns aren't exposed

#### **Technical Implementation**
- **Local AI Processing**: All analysis happens in the browser using lightweight models
- **Pattern Matching**: Merchant name analysis, amount-based rules, and historical patterns
- **Learning Algorithm**: Updates internal patterns based on user feedback
- **Performance Optimization**: <200ms response time for suggestions
- **Data Storage**: Encrypted local storage for learning data and patterns

#### **Privacy and Security**
- **Local Processing**: No transaction data sent to external services
- **Encrypted Storage**: Learning data encrypted in local storage
- **User Control**: Option to disable AI features at any time
- **Transparency**: Clear communication about how the system works
- **Data Minimization**: Only necessary data stored for learning

#### **Success Metrics**
- **Time Reduction**: 90% reduction in categorization time
- **User Adoption**: 80% of users enable AI categorization within 30 days
- **Accuracy Rate**: 85% of suggestions accepted by users
- **Learning Improvement**: 10% accuracy improvement over 3 months
- **Performance**: <200ms average suggestion response time

#### **Benefits**
- **Time Savings**: Reduces manual categorization from 2-3 minutes to 10-15 seconds per transaction
- **Improved Accuracy**: Consistent categorization across similar transactions
- **Enhanced UX**: Faster transaction entry with less cognitive load
- **Privacy Protection**: Local processing maintains complete data privacy
- **User Retention**: Reduced friction increases app engagement and usage

#### **Implementation Status**
- 📋 **Planned for v0.8.0**: AI Transaction Categorization System
- 📋 **Detailed PRD**: Available in `docs/AI_TRANSACTION_CATEGORIZATION_PRD.md`

### **Audit Logging System**

#### **Overview**
FinTrack V4 implements a comprehensive audit logging system that provides users with complete visibility into all changes made to their financial data. The system ensures data integrity, supports compliance requirements, and enables better user support while maintaining complete privacy through local-only processing.

#### **Key Features**
- **Complete Change Tracking**: Logs all CRUD operations on transactions, accounts, and categories
- **User-Friendly Viewer**: Chronological timeline with search and filtering capabilities
- **Data Integrity Verification**: Hash-based integrity checking and anomaly detection
- **Privacy-First**: All audit logs stored locally in encrypted format
- **Export Capabilities**: Export audit logs for compliance and backup purposes
- **Performance Optimized**: Minimal impact on app performance with efficient storage

#### **Core Functionality**
- **Change Tracking**: Timestamp, user action, entity type, old/new values, context metadata
- **Search & Filter**: By date range, entity type, action type, specific accounts/categories
- **Integrity Checks**: Hash-based validation, anomaly detection, data consistency reports
- **Privacy Controls**: Local-only storage, user-controlled retention, secure encryption
- **Export Options**: JSON/CSV export for compliance, backup, and analysis

#### **User Stories**
- As a user, I want to see every change made to my data so I can verify data integrity
- As a user, I want to search through my audit logs so I can find specific changes
- As a user, I want to export my audit logs so I can keep records for compliance
- As a user, I want to verify my data integrity so I can trust my financial records
- As a user, I want my audit logs to stay private so my financial data isn't exposed

#### **Technical Implementation**
- **Local Storage**: Encrypted localStorage with efficient compression
- **Performance**: <50ms overhead for data operations, <200ms for log queries
- **Storage**: Configurable retention policies, automatic cleanup
- **Security**: Encrypted storage, access controls, input validation
- **Privacy**: No external data transmission, complete user control

#### **Implementation Status**
- 📋 **Planned for v0.7.1**: Audit Logging System
- 📋 **Detailed PRD**: Available in `docs/AUDIT_LOGGING_SYSTEM_PRD.md`

### **Backup & Restore System**

#### **Overview**
FinTrack V4 implements a comprehensive backup and restore system that provides users with secure, encrypted backup capabilities for their financial data. The system ensures data protection against device loss, damage, or failure while maintaining complete privacy through local-only processing and user-controlled encryption.

#### **Key Features**
- **Encrypted Backup Creation**: AES-256 encryption with user-defined passwords
- **Multiple Backup Options**: Local files, cloud storage integration, QR codes
- **Data Integrity Verification**: SHA-256 checksums and validation
- **Easy Restoration**: Conflict resolution and data preview
- **Backup Management**: Version control and cleanup tools
- **Cloud Integration**: Google Drive, iCloud, Dropbox support
- **Privacy-First**: No server-side data storage, user-controlled encryption

#### **Technical Implementation**
- **Encryption**: AES-256 with PBKDF2 password hashing
- **Data Format**: Versioned JSON with comprehensive metadata
- **Integrity**: SHA-256 checksums for corruption detection
- **Performance**: Incremental backups and compression
- **Compatibility**: Backward compatibility for older backup versions

#### **User Benefits**
- **Data Security**: Protection against device failure and data loss
- **Device Migration**: Easy transfer between devices and browsers
- **Peace of Mind**: Confidence in data protection and recovery
- **Compliance Support**: Reliable record-keeping for tax/legal purposes
- **User Control**: Complete control over backup location and encryption

#### **Success Metrics**
- **Backup Adoption**: 70% of users create at least one backup within 30 days
- **User Satisfaction**: 4.5+ star rating for backup feature
- **Data Loss Reduction**: 90% reduction in "lost data" support requests
- **Recovery Success**: 95% successful backup restorations

#### **Implementation Status**
- 📋 **Planned for v0.7.1**: Backup & Restore System
- 📋 **Detailed PRD**: Available in `docs/BACKUP_RESTORE_SYSTEM_PRD.md`

### **Financial Freedom & Savings Incentive System**

#### **Overview**
FinTrack V4 implements a comprehensive Financial Freedom & Savings Incentive System that helps users visualize their path to financial independence, track savings progress, set and achieve financial goals, and predict when they will become financially free. The system transforms FinTrack from an expense tracker into a comprehensive financial planning tool while maintaining complete privacy through local-only processing.

#### **Key Features**
- **Financial Freedom Calculator**: Predict when users achieve financial independence based on net worth, savings rate, and age
- **Savings Rate Tracking**: Monitor and improve savings percentage with visual progress and incentives
- **Goal-Based Savings**: Set and track multiple financial goals (emergency fund, house, retirement, custom)
- **Interactive Scenarios**: "What if" analysis for different financial decisions and lifestyle choices
- **Progress Visualization**: Charts, milestones, achievements, and gamification features
- **Behavioral Incentives**: Motivation system with streaks, badges, and celebrations
- **Lifestyle Optimization**: Balance current spending with future financial freedom

#### **Technical Implementation**
- **Financial Calculation Engine**: Compound interest, inflation adjustments, Monte Carlo simulations
- **Data Visualization**: Interactive charts, progress bars, trend analysis
- **Goal Management**: Priority-based allocation, conflict resolution, template system
- **Scenario Analysis**: Real-time modeling, side-by-side comparisons, impact visualization
- **Privacy-First**: All calculations performed locally, no external data transmission

#### **User Benefits**
- **Long-Term Perspective**: See impact of financial decisions on future freedom
- **Motivation Boost**: Visual progress and achievements encourage positive behavior
- **Goal Achievement**: Clear path to financial independence and other financial goals
- **Decision Support**: Understand trade-offs between spending and saving
- **Financial Education**: Learn about compound interest, savings strategies, and planning
- **Peace of Mind**: Confidence in financial future and retirement planning

#### **Success Metrics**
- **User Engagement**: 80% of users check freedom progress weekly
- **Savings Rate Improvement**: 25% increase in average user savings rate
- **Goal Achievement**: 60% of users reach their first savings milestone
- **User Satisfaction**: 4.7+ star rating for financial planning features

#### **Implementation Status**
- 📋 **Planned for v0.7.1**: Financial Freedom & Savings Incentive System
- 📋 **Detailed PRD**: Available in `docs/FINANCIAL_FREEDOM_SAVINGS_INCENTIVE_PRD.md`

### **Goal-Based Financial Planning System**

#### **Overview**
FinTrack V4 implements a comprehensive Goal-Based Financial Planning System that enables users to set, track, and achieve specific financial goals around savings and intentional spending. The system provides real-time progress visualization, trend analysis, and smart notifications to help users develop intentional financial behavior and achieve their financial objectives.

#### **Key Features**
- **Dual-Goal System**: Savings goals (building wealth) and spending goals (controlling expenses)
- **Flexible Goal Types**: Amount-based goals ("Save $X within Y months") and percentage-based goals ("Save X% of income")
- **Time-bound Planning**: Goals with specific timeframes and deadlines
- **Real-time Progress Tracking**: Live updates on goal achievement with progress bars and charts
- **Trend Analysis**: Historical progress visualization and trend analysis
- **Smart Notifications**: Alerts for goal milestones, spending warnings, and achievement celebrations
- **Goal Categories**: Organized goal management with customizable categories
- **Progress Visualization**: Interactive charts, progress bars, and milestone indicators

#### **Functional Requirements**
- **FR1**: Goal Creation and Management - Users can create, edit, and manage financial goals
- **FR2**: Savings Goals System - Comprehensive savings goal tracking with amount and percentage-based targets
- **FR3**: Spending Goals System - Intentional spending control with category-specific limits
- **FR4**: Progress Tracking and Visualization - Real-time progress monitoring with trend analysis
- **FR5**: Smart Notifications and Alerts - Intelligent notifications for goal-related events

#### **Technical Implementation**
- **Data Architecture**: Robust goal data model with progress tracking and category management
- **Progress Calculation Engine**: Real-time progress calculation with trend analysis and predictions
- **Visualization System**: Comprehensive progress visualization with interactive charts and dashboards
- **Privacy-First**: All goal data stored locally with no external sharing

#### **User Experience**
- **Goal Creation Flow**: Intuitive step-by-step goal creation with templates and smart suggestions
- **Progress Dashboard**: Comprehensive goal overview with visual progress indicators
- **Goal Management Interface**: Easy goal editing, progress tracking, and historical performance

#### **Success Metrics**
- **Goal Creation Rate**: 80% of users create at least one goal
- **Goal Completion Rate**: 60% of goals are completed successfully
- **User Engagement**: 25% increase in app usage time
- **Savings Improvement**: 15% increase in average savings rate

#### **Implementation Timeline**
- **Phase 1**: Core Goal System (4 weeks) - Goal data model and basic CRUD operations
- **Phase 2**: Progress Visualization (3 weeks) - Progress bars, charts, and trend analysis
- **Phase 3**: Smart Features (3 weeks) - Notifications, alerts, and AI-powered suggestions
- **Phase 4**: Advanced Features (2 weeks) - Goal templates, bulk operations, and analytics

#### **Business Value**
- **User Engagement**: Transforms FinTrack from passive tracking to active financial planning
- **Financial Behavior**: Encourages intentional financial decisions and goal-oriented behavior
- **User Retention**: Provides ongoing motivation through progress tracking and achievements
- **Competitive Advantage**: Comprehensive goal-based planning system differentiates from basic expense trackers

- 📋 **Planned for v0.7.1**: Goal-Based Financial Planning System
- 📋 **Detailed PRD**: Available in `docs/features/planned/GOAL_BASED_FINANCIAL_PLANNING_PRD.md`

### **Community Data Sharing Ecosystem**

#### **Overview**
FinTrack V4 implements an opt-in community data sharing ecosystem that allows users to anonymously share their financial data in exchange for access to community insights, living cost comparisons, and spending benchmarks. This feature creates a network effect that differentiates FinTrack from competitors while providing users with valuable financial intelligence and creating new revenue opportunities.

#### **Key Features**
- **Opt-in Data Sharing**: Users voluntarily share anonymized financial data
- **Community Insights**: Access to spending benchmarks and cost comparisons
- **Geographic Analysis**: Regional cost differences and lifestyle comparisons
- **Privacy Protection**: Advanced anonymization and data protection
- **Premium Features**: Enhanced community insights for paid users

#### **Business Value**
- **User Engagement**: Increase daily active users by 40% through community insights
- **Revenue Growth**: Generate $50K-100K annually from premium community features
- **Competitive Advantage**: Establish FinTrack as the leading community-driven financial platform
- **User Retention**: Improve 30-day retention by 25% through community features

#### **Technical Implementation**
- **Data Anonymization**: Advanced privacy-preserving techniques
- **Community Analytics**: Real-time insights and benchmarking
- **Geographic Mapping**: Location-based cost analysis
- **Premium Tiers**: Subscription-based enhanced features

- 📋 **Planned for v0.8.0**: Community Data Sharing Ecosystem
- 📋 **Detailed PRD**: Available in `docs/features/planned/community-data-sharing-prd.md`

### **Multi-Factor Authentication (MFA) System**

#### **Overview**
FinTrack V4 implements a comprehensive Multi-Factor Authentication (MFA) system that adds an additional layer of protection to user accounts. This system implements TOTP (Time-based One-Time Password) as the primary MFA method, providing enterprise-grade security while maintaining excellent user experience.

#### **Key Features**
- **TOTP Implementation**: Cryptographically secure 32-character base32 secrets
- **QR Code Generation**: Standard QR codes compatible with all authenticator apps
- **Time Window**: 30-second token validity with 2-window tolerance for clock skew
- **Token Validation**: 6-digit numeric token verification
- **Backup Codes**: Recovery codes for account access
- **Mandatory MFA**: Required for all users to ensure highest security

#### **Business Value**
- **Enhanced Security**: Reduce account compromise incidents by 99%+
- **Compliance**: Achieve SOC 2 Type II and PCI DSS compliance
- **User Trust**: Demonstrate commitment to financial data security
- **Competitive Advantage**: Position FinTrack as a security-first financial platform

#### **Technical Implementation**
- **TOTP Algorithm**: RFC 6238 compliant implementation
- **QR Code Generation**: Standard authenticator app compatibility
- **Secure Storage**: Encrypted secret storage with proper key management
- **Session Management**: Enhanced session security with MFA validation

- 📋 **Planned for v0.7.2**: Multi-Factor Authentication System
- 📋 **Detailed PRD**: Available in `docs/features/planned/mfa-security-prd.md`

### **Mobile App Development**

#### **Overview**
FinTrack V4 develops a native mobile application for iOS and Android that extends the platform's capabilities to mobile devices. The app focuses on **receipt scanning** and **push notifications** as core differentiators, while providing essential financial management features.

#### **Key Features**
- **Cross-platform Support**: Fully functional on both iOS and Android
- **Receipt Scanning**: 90%+ accuracy in text extraction and categorization
- **Push Notifications**: 95%+ delivery rate for critical alerts
- **Real-time Sync**: Seamless data synchronization with web platform
- **Offline Support**: Core functionality available without internet connection

#### **Business Value**
- **User Engagement**: Mobile apps typically have 3x higher engagement than web apps
- **Accessibility**: Users can manage finances on-the-go
- **Competitive Advantage**: Most financial apps offer mobile experiences
- **Revenue Growth**: Mobile users have higher conversion rates to paid plans

#### **Technical Implementation**
- **Framework**: React Native for cross-platform development
- **OCR**: ML Kit Text Recognition for receipt scanning
- **Push Notifications**: Firebase Cloud Messaging + Apple Push Notifications
- **Storage**: AsyncStorage + SQLite for local data persistence

- 📋 **Planned for v0.8.0**: Mobile App Development
- 📋 **Detailed PRD**: Available in `docs/features/planned/mobile-app-prd.md`

### **Plaid Integration**

#### **Overview**
FinTrack V4 integrates Plaid's financial data connectivity platform to enable users to automatically import transaction data from their bank accounts while maintaining our zero-knowledge, local-first approach to data privacy.

#### **Key Features**
- **Automatic Data Import**: Eliminate manual CSV uploads and data entry
- **Real-time Updates**: Keep financial data current with automatic sync
- **Bank Connectivity**: Support for 11,000+ financial institutions
- **Privacy Protection**: Maintain zero-knowledge architecture
- **Transaction Categorization**: AI-powered automatic categorization

#### **Business Value**
- **User Experience**: Reduce friction in getting started
- **Data Accuracy**: 95%+ transaction categorization accuracy
- **User Adoption**: 70% of users connect at least one bank account
- **Competitive Advantage**: Automatic data import vs manual CSV uploads

#### **Technical Implementation**
- **Plaid API Integration**: Secure bank data connectivity
- **Local Processing**: All sensitive data processed locally
- **Encryption**: End-to-end encryption for financial data
- **Error Handling**: Robust error handling and retry mechanisms

- 📋 **Planned for v0.7.3**: Plaid Integration
- 📋 **Detailed PRD**: Available in `docs/features/planned/prd-plaid-integration.md`

### **Privacy vs Data Sharing Choice**

#### **Overview**
FinTrack V4 implements a user choice system that allows users to select between private mode (keep all data encrypted and private) and shared mode (allow anonymized data sharing for ads to reduce subscription costs).

#### **Key Features**
- **User Preference System**: Granular control over data sharing
- **Data Classification**: Categorize data by sensitivity and sharing permissions
- **Privacy Service**: Manage data sharing based on user preferences
- **Transparent Policies**: Clear data usage policies and user consent
- **Cost Benefits**: Reduced subscription costs for data sharing users

#### **Business Value**
- **Monetization**: Enable sustainable monetization through targeted advertising
- **User Choice**: Provide users with cost-saving options
- **Trust Building**: Maintain privacy-first approach as default
- **Revenue Diversification**: Multiple revenue streams beyond subscriptions

#### **Technical Implementation**
- **Preference Management**: User-controlled data sharing settings
- **Data Anonymization**: Advanced privacy-preserving techniques
- **Consent Management**: Granular consent tracking and management
- **Audit Trail**: Complete audit trail of data sharing decisions

- 📋 **Planned for v0.7.2**: Privacy vs Data Sharing Choice
- 📋 **Detailed PRD**: Available in `docs/features/planned/PRD-privacy-data-sharing-choice.md`

### **Troubleshooting Data Access System**

#### **Overview**
FinTrack V4 implements a comprehensive secure data access and troubleshooting system that allows users to voluntarily share diagnostic data for support while maintaining strict privacy controls and time-limited access.

#### **Key Features**
- **Voluntary Data Sharing**: Users control what diagnostic data to share
- **Time-limited Access**: Automatic expiration of diagnostic access
- **Secure Access**: Encrypted data access with audit trails
- **Automated Detection**: Proactive issue detection and reporting
- **Support Integration**: Seamless integration with support workflows

#### **Business Value**
- **Support Efficiency**: 90% reduction in unresolved data-related support requests
- **User Satisfaction**: 95% user satisfaction with support experience
- **Issue Resolution**: 50% faster issue resolution time
- **Data Integrity**: Proactive detection of data corruption issues

#### **Technical Implementation**
- **Consent Management**: Granular consent for diagnostic data sharing
- **Secure Access**: Time-limited, encrypted access to user data
- **Audit Logging**: Complete audit trail of all data access
- **Automated Monitoring**: Proactive system health monitoring

- 📋 **Planned for v0.7.2**: Troubleshooting Data Access System
- 📋 **Detailed PRD**: Available in `docs/features/planned/PRD-troubleshooting-data-access.md`

### **Receipt Scanning & Transaction Matching**

#### **Overview**
FinTrack V4 implements intelligent receipt scanning capabilities that allow users to capture receipts via camera, automatically match them to existing transactions, and extract detailed line-item information for enhanced expense tracking.

#### **Key Features**
- **Receipt Capture**: High-quality image capture via mobile camera
- **OCR Processing**: Extract text and line items from receipt images
- **Transaction Matching**: Automatically match receipts to existing transactions
- **Line-item Extraction**: Detailed breakdown of receipt items
- **Tax Preparation**: Organized receipts for tax filing and deductions

#### **Business Value**
- **User Engagement**: 60% of paid users actively use receipt scanning
- **Data Quality**: 80%+ accurate line-item extraction
- **Competitive Advantage**: Differentiates from basic expense trackers
- **Revenue Generation**: Premium feature for paid tiers

#### **Technical Implementation**
- **Camera Integration**: Native camera access for high-quality images
- **OCR Technology**: ML Kit Text Recognition for text extraction
- **Image Processing**: Auto-crop, enhance, and optimize receipt images
- **Transaction Matching**: AI-powered matching algorithms

- 📋 **Planned for v0.7.3**: Receipt Scanning & Transaction Matching
- 📋 **Detailed PRD**: Available in `docs/features/planned/receipt-scanning-prd.md`

### **Stripe Payment Integration**

#### **Overview**
FinTrack V4 integrates Stripe payment processing to enable users to upgrade from FREE to paid plans (INDIVIDUAL, FAMILY) during onboarding and account management, providing seamless subscription management.

#### **Key Features**
- **Payment Processing**: Credit/debit cards, ACH transfers (US)
- **Subscription Management**: Monthly recurring billing
- **Plan Upgrades**: Seamless upgrade from free to paid tiers
- **Billing Management**: User-controlled subscription and billing management
- **Compliance**: PCI DSS compliance through Stripe

#### **Business Value**
- **Revenue Generation**: Convert free users to paid subscribers
- **User Experience**: Seamless payment flow during onboarding
- **Plan Management**: Allow users to upgrade/downgrade plans
- **Compliance**: Meet payment industry security standards

#### **Technical Implementation**
- **Stripe API Integration**: Secure payment processing
- **Webhook Handling**: Real-time payment status updates
- **Customer Management**: Stripe customer profiles for each user
- **Subscription Logic**: Automated subscription management

- 📋 **Planned for v0.7.1**: Stripe Payment Integration
- 📋 **Detailed PRD**: Available in `docs/features/planned/STRIPE_PAYMENT_INTEGRATION_PRD.md`

### **Data Consistency Validation System**

#### **Overview**
FinTrack V4 implements a comprehensive data consistency validation system that ensures data integrity and accuracy across all financial records. This system provides automated checks and validation tools to maintain reliable financial data.

#### **Key Features**
- **Account Balance Validation**: Verify account balances against transaction sums
- **Category Data Integrity**: Check for orphaned transactions and unused categories
- **Transaction Count Validation**: Ensure category transaction counts are accurate
- **Anchor-Based Validation**: Validate balance anchors against calculated balances
- **Real-Time Monitoring**: Continuous validation during data operations
- **Detailed Reporting**: Comprehensive reports of data inconsistencies

#### **Validation Types**
1. **Account Balance Checks**:
   - Anchor-based calculation validation
   - Simple transaction sum validation
   - Discrepancy detection and reporting
   - Balance anchor integrity checks
2. **Category Data Integrity**:
   - Orphaned transaction detection
   - Unused category identification
   - Transaction count validation
   - Category reference integrity
3. **Transaction Data Validation**:
   - Amount consistency checks
   - Date range validation
   - Account reference validation
   - Category reference validation

#### **Validation Methods**
- **Anchor-Based Calculation**: Uses balance anchors and post-anchor transactions
- **Transaction Sum Calculation**: Simple sum of all transactions for an account
- **Cross-Reference Validation**: Ensures all references are valid
- **Data Completeness**: Checks for missing or incomplete data
- **Business Rule Validation**: Enforces financial business rules

#### **User Interface**
- **Dev Tools Integration**: Accessible through developer tools menu
- **One-Click Validation**: Single button to run all validation checks
- **Detailed Reports**: Comprehensive analysis of data inconsistencies
- **Export Capability**: Export validation results for analysis
- **Real-Time Feedback**: Immediate feedback on data quality

#### **Implementation Details**
- **Modular Design**: Separate validators for different data types
- **Performance Optimized**: Efficient validation for large datasets
- **Configurable Thresholds**: Adjustable tolerance for discrepancies
- **Batch Processing**: Handle large datasets without UI blocking
- **Error Recovery**: Graceful handling of validation errors

#### **Files Structure**
```
src/
├── lib/data-checks/
│   ├── index.ts                            # Centralized exports
│   ├── account-balance-validator.ts        # Account balance validation
│   └── category-transaction-count-validator.ts # Category data validation
├── __tests__/unit/
│   ├── account-balance-validator.test.ts   # Balance validation tests
│   └── category-transaction-count-validator.test.ts # Category validation tests
└── app/dev-tools/
    └── data-consistency/                   # Data validation UI (future)
```

#### **Success Criteria**
- ✅ Account balances validated against transaction sums
- ✅ Category data integrity maintained
- ✅ Orphaned transactions detected and reported
- ✅ Unused categories identified
- ✅ Balance anchors validated against calculations
- ✅ Comprehensive validation reporting
- ✅ Performance optimized for large datasets

### **UI Structure & Navigation**

#### **Overview**
To match V3's professional navigation structure, v4 implements a comprehensive NavBar system with dropdown menus, user authentication integration, and mobile responsiveness.

#### **Navigation Structure**
- **Fixed Top Navigation**: Position fixed at top with z-index 50
- **Logo Section**: "FinTrack V4" branding on the left
- **Main Navigation**: Horizontal menu with dropdown submenus
- **User Section**: User info with dropdown menu on the right
- **Mobile Menu**: Hamburger menu for mobile devices

#### **Navigation Items (MVP)**
```typescript
const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  {
    name: 'Transactions',
    href: '/transactions',
    icon: List,
    submenu: [
      { name: 'View Transactions', href: '/transactions', icon: List },
      { name: 'Add Transaction', href: '/transactions/add', icon: Plus }
    ]
  },
  {
    name: 'Accounts',
    href: '/accounts',
    icon: Building,
    submenu: [
      { name: 'Account List', href: '/accounts', icon: Building },
      { name: 'Balance History', href: '/accounts/balance-history', icon: TrendingUp }
    ]
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: BarChart3,
    submenu: [
      { name: 'Spending Trend', href: '/reports/spending-trend', icon: TrendingUp }
    ]
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    submenu: [
      { name: 'Categories', href: '/settings/categories', icon: FileText },
      { name: 'User Preferences', href: '/preferences', icon: User }
    ]
  }
];
```

#### **Key Features**
- **Active Route Highlighting**: Visual indication of current page
- **Dropdown Menus**: Hover-activated submenus for main items
- **Mobile Responsive**: Collapsible hamburger menu
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Smooth Transitions**: CSS transitions for hover and active states

#### **Implementation Files**
```
src/components/layout/
├── Navigation.tsx          # Main navigation component
├── Navigation.module.css   # Navigation styles
├── AppLayout.tsx          # Layout wrapper component
└── AppLayout.module.css   # Layout styles
```

### **UI Design Specifications**

#### **Overview**
FinTrack V4 implements a comprehensive UI design system that ensures consistency, usability, and professional appearance across all components. This section documents the specific design requirements and patterns used throughout the application.

#### **Design Principles**
- **Consistency**: Uniform styling and behavior across all components
- **Accessibility**: Clear visual hierarchy and proper contrast ratios
- **Responsiveness**: Mobile-first design with progressive enhancement
- **Simplicity**: Clean, uncluttered interfaces that focus on functionality
- **Professional**: Business-appropriate styling suitable for financial applications

#### **Color System**

##### **Primary Colors**
- **Brand Color**: Blue (#3B82F6) - Primary actions and highlights
- **Success**: Green (#10B981) - Positive amounts, income transactions
- **Warning**: Yellow (#F59E0B) - Caution states, pending items
- **Error**: Red (#EF4444) - Negative amounts, expense transactions
- **Neutral**: Gray (#6B7280) - Secondary text, borders, backgrounds

##### **Transaction Type Colors**
- **Income**: Light Green (#D1FAE5) - Background for income type badges
- **Expense**: Light Red (#FEE2E2) - Background for expense type badges
- **Transfer**: Light Gray (#F3F4F6) - Background for transfer type badges

##### **Category Colors**
- **Custom Colors**: User-defined colors for categories (hex values)
- **Default**: Gray (#6B7280) - Fallback color for uncategorized items

#### **Typography**
- **Font Family**: Geist Sans (primary), Geist Mono (code/numbers)
- **Font Sizes**:
  - Headers: text-2xl (24px), text-xl (20px), text-lg (18px)
  - Body: text-base (16px), text-sm (14px)
  - Small: text-xs (12px)
- **Font Weights**: font-medium (500), font-semibold (600), font-bold (700)

#### **Component Design Specifications**

##### **Navigation Bar**
- **Branding**: "Lumifin Glow" logo text
- **Layout**: Fixed top navigation with z-index 50
- **Background**: White with subtle shadow
- **Height**: 64px (h-16)
- **User Display**: Show full name if available, otherwise email prefix
- **Hidden on**: Authentication pages (/auth)

##### **Transaction Form**
- **Field Order** (top to bottom):
  1. **Description** (full width)
  2. **Amount and Date** (side by side)
  3. **Account** (full width, with From/To for transfers)
  4. **Type and Category** (side by side)
- **Account Selection**: Default to "Select account" (no pre-selection)
- **Required Fields**: Marked with red asterisk (*)
- **Transfer Logic**: Show From Account and To Account fields
- **External Account**: "External Account (not tracked)" option available
- **Validation**: Client-side validation with visual feedback

##### **Transaction Table**
- **Column Structure**:
  - Description
  - Amount (formatted with proper signs)
  - Date
  - Category/Type (combined column)
  - Account
  - Actions
- **Category Display**:
  - **Categories**: Colored bubbles (rounded-full) with white text
  - **Types**: Colored rectangles (rounded) with dark text
- **Type Colors**:
  - Income: Light green background (#D1FAE5)
  - Expense: Light red background (#FEE2E2)
  - Transfer: Light gray background (#F3F4F6)
- **Amount Formatting**: Proper positive/negative signs for all transaction types

##### **Account Cards**
- **Layout**: Card-based design with account icon and details
- **Balance Display**: Balance and actual balance ($x.xx) on one row, right-aligned
- **Color Support**: Custom account colors with fallback to type-based colors
- **Actions**: Edit and reconcile options available

##### **Category Cards**
- **Transaction Count**: Asynchronously calculated to prevent UI lag
- **Loading State**: "Loading..." display during calculation
- **Color Display**: Category color as background for visual identification

##### **Modal Design**
- **Background**: Semi-transparent overlay
- **Content**: Centered modal with rounded corners
- **Form Layout**: Consistent spacing and field organization
- **Validation**: Real-time feedback with error states

#### **Layout Specifications**

##### **Page Layout**
- **Main Content**: 16px top padding (pt-16) to account for fixed navigation
- **Container**: Max-width containers with responsive padding
- **Background**: Light gray (#F9FAFB) for main content areas
- **Cards**: White background with subtle shadows and rounded corners

##### **Authentication Pages**
- **Full Screen**: No navigation bar or footer
- **Background**: Gradient from blue-50 to indigo-100
- **Centered Content**: Vertically and horizontally centered forms
- **Form Width**: Max-width 28rem (448px) for optimal readability

##### **Responsive Design**
- **Mobile First**: Base styles for mobile devices
- **Breakpoints**:
  - sm: 640px (small tablets)
  - md: 768px (tablets)
  - lg: 1024px (desktops)
  - xl: 1280px (large desktops)
- **Grid Layouts**: Responsive grid systems for form fields and content

#### **Interactive Elements**

##### **Buttons**
- **Primary**: Blue background with white text
- **Secondary**: White background with blue border and text
- **Danger**: Red background with white text
- **Size**: Consistent padding (px-4 py-2) and rounded corners

##### **Form Controls**
- **Input Fields**: White background, gray border, focus states
- **Select Dropdowns**: Consistent styling with custom options
- **Checkboxes/Radio**: Standard browser controls with custom styling
- **Validation**: Red borders and error messages for invalid inputs

##### **Hover States**
- **Navigation**: Subtle background color changes
- **Buttons**: Slightly darker background on hover
- **Cards**: Subtle shadow changes for interactive elements

#### **Accessibility Requirements**
- **Color Contrast**: Minimum 4.5:1 ratio for text
- **Focus States**: Visible focus indicators for keyboard navigation
- **ARIA Labels**: Proper labeling for screen readers
- **Semantic HTML**: Correct use of headings, lists, and form elements

#### **Animation and Transitions**
- **Duration**: 150ms for most transitions
- **Easing**: Ease-in-out for smooth animations
- **Hover Effects**: Subtle color and shadow transitions
- **Loading States**: Spinner animations for async operations

#### **Implementation Guidelines**
- **Tailwind CSS**: Use utility classes for consistent styling
- **Component Props**: Accept className props for customization
- **Responsive Classes**: Use responsive prefixes (sm:, md:, lg:)
- **State Management**: Proper loading, error, and success states
- **Performance**: Optimize for fast rendering and smooth interactions

---

## Technical Specifications

### **Database Schema & Data Models**

#### **Core Data Models**
```typescript
// Transaction Model
interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD format
  accountId: number;
  categoryId: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  recurring: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Account Model
interface Account {
  id: number;
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'CREDIT' | 'INVESTMENT' | 'CASH';
  balance: number;
  balanceDate: string; // YYYY-MM-DD format
  color: string; // Hex color code
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Category Model
interface Category {
  id: number;
  name: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  color: string; // Hex color code
  createdAt?: string;
  updatedAt?: string;
}

// Account Balance Anchor Model
interface AccountBalanceAnchor {
  id: number;
  accountId: number;
  balance: number;
  anchorDate: string; // YYYY-MM-DD format
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// User Preferences Model
interface UserPreferences {
  id: number;
  userId: string;
  breakdownPeriod: 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'BI_ANNUALLY' | 'ANNUALLY';
  createdAt?: string;
  updatedAt?: string;
}
```

#### **Data Relationships**
- **One-to-Many**: Account → Transactions
- **One-to-Many**: Category → Transactions
- **One-to-Many**: Account → AccountBalanceAnchors
- **One-to-One**: User → UserPreferences

### **API Specifications**

#### **Data Service Methods**
```typescript
class DataService {
  // Transaction Operations
  getTransactions(filters?: TransactionFilters): Transaction[]
  createTransaction(transaction: CreateTransactionInput): Transaction
  updateTransaction(id: number, updates: UpdateTransactionInput): Transaction
  deleteTransaction(id: number): boolean
  getTransactionsByAccount(accountId: number): Transaction[]
  getTransactionsByCategory(categoryId: number): Transaction[]

  // Account Operations
  getAccounts(includeInactive?: boolean): Account[]
  createAccount(account: CreateAccountInput): Account
  updateAccount(id: number, updates: UpdateAccountInput): Account
  deleteAccount(id: number): boolean // Smart delete (soft/hard)
  getAccountBalance(accountId: number, date?: string): number

  // Category Operations
  getCategories(): Category[]
  createCategory(category: CreateCategoryInput): Category
  updateCategory(id: number, updates: UpdateCategoryInput): Category
  deleteCategory(id: number): boolean
  mergeCategories(sourceId: number, targetId: number): boolean

  // Balance Anchor Operations
  createAccountBalanceAnchor(anchor: CreateAnchorInput): AccountBalanceAnchor
  updateAccountBalanceAnchor(id: number, updates: UpdateAnchorInput): AccountBalanceAnchor
  deleteAccountBalanceAnchor(id: number): boolean
  getAccountBalanceAnchors(accountId: number): AccountBalanceAnchor[]

  // User Preferences
  getUserPreferences(userId: string): UserPreferences
  updateUserPreferences(userId: string, preferences: UpdatePreferencesInput): UserPreferences

  // CSV Import Operations
  parseCSVData(csvData: string): ParsedTransaction[]
  previewImport(transactions: ParsedTransaction[]): ImportPreview
  executeImport(transactions: ParsedTransaction[], accountId: number): ImportResult

  // Demo Data Operations
  loadDemoData(): void
  clearDemoData(): void
  isDemoMode(): boolean

  // Data Validation
  validateDataIntegrity(): ValidationResult
  getDataConsistencyReport(): ConsistencyReport
}
```

#### **Authentication API**
```typescript
interface AuthService {
  signUp(email: string, password: string): Promise<AuthResult>
  signIn(email: string, password: string): Promise<AuthResult>
  signOut(): Promise<void>
  getCurrentUser(): User | null
  isAuthenticated(): boolean
  resetPassword(email: string): Promise<void>
}
```

### **Component Architecture**

#### **Component Hierarchy**
```
App
├── AuthProvider
├── DataProvider
├── AppLayout
│   ├── Navigation
│   ├── MainContent
│   │   ├── Dashboard
│   │   ├── TransactionsPage
│   │   │   ├── TransactionsFilters
│   │   │   ├── TransactionsTable
│   │   │   └── TransactionModal
│   │   ├── AccountsPage
│   │   │   ├── AccountList
│   │   │   └── AccountModal
│   │   ├── ReportsPage
│   │   │   ├── SpendingTrendChart
│   │   │   └── BalanceHistoryChart
│   │   └── SettingsPage
│   │       ├── CategoryList
│   │       └── UserPreferences
│   └── Footer
└── AuthPage
    ├── LoginForm
    └── SignupForm
```

#### **Component Props & Interfaces**
```typescript
// Transaction Components
interface TransactionsTableProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: number) => void;
  onBulkAction: (action: BulkAction, ids: number[]) => void;
}

interface TransactionModalProps {
  transaction?: Transaction;
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
}

// Account Components
interface AccountListProps {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onDelete: (id: number) => void;
  onReconcile: (account: Account) => void;
}

// Chart Components
interface SpendingTrendChartProps {
  data: SpendingTrendData[];
  breakdownPeriod: BreakdownPeriod;
  onDrillDown: (data: DrillDownData) => void;
}
```

### **State Management**

#### **Context Providers**
```typescript
// Data Context
interface DataContextType {
  // State
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  userPreferences: UserPreferences;
  loading: boolean;
  error: string | null;

  // Actions
  refreshData: () => Promise<void>;
  createTransaction: (transaction: CreateTransactionInput) => Promise<Transaction>;
  updateTransaction: (id: number, updates: UpdateTransactionInput) => Promise<Transaction>;
  deleteTransaction: (id: number) => Promise<boolean>;
  // ... other CRUD operations
}

// Auth Context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

### **Utility Functions & Services**

#### **Date Utilities**
```typescript
// Date handling utilities (YYYY-MM-DD format)
export const dateUtils = {
  getCurrentDate(): string;
  formatDateForDisplay(dateString: string): string;
  isValidDateString(dateString: string): boolean;
  toUTCDateString(date: Date): string;
  addDays(dateString: string, days: number): string;
  getDateRange(startDate: string, endDate: string): string[];
  getPeriodDates(period: BreakdownPeriod, date: string): { start: string; end: string };
};
```

#### **Currency Utilities**
```typescript
// Currency formatting utilities
export const currencyUtils = {
  formatAmount(amount: number, showSign?: boolean): string;
  parseAmount(amountString: string): number;
  getTransactionSign(transaction: Transaction): string;
  getAmountColor(transaction: Transaction): string;
};
```

#### **Validation Utilities**
```typescript
// Data validation utilities
export const validationUtils = {
  validateTransaction(transaction: Partial<Transaction>): ValidationResult;
  validateAccount(account: Partial<Account>): ValidationResult;
  validateCategory(category: Partial<Category>): ValidationResult;
  validateCSVData(csvData: string): ValidationResult;
};
```

### **Error Handling & Logging**

#### **Error Types**
```typescript
interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  userId?: string;
}

// Error codes
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATA_NOT_FOUND: 'DATA_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  CSV_PARSE_ERROR: 'CSV_PARSE_ERROR',
  IMPORT_ERROR: 'IMPORT_ERROR'
} as const;
```

#### **Logging Service**
```typescript
interface LoggingService {
  logError(error: AppError): void;
  logInfo(message: string, data?: any): void;
  logWarning(message: string, data?: any): void;
  logUserAction(action: string, data?: any): void;
}
```

### **Performance Specifications**

#### **Performance Requirements**
- **Page Load Time**: < 2 seconds for initial load
- **Transaction List**: < 500ms for 1000+ transactions
- **Chart Rendering**: < 1 second for complex charts
- **Form Submission**: < 200ms for CRUD operations
- **Search/Filter**: < 100ms for real-time filtering

#### **Optimization Strategies**
- **Virtual Scrolling**: For large transaction lists
- **Lazy Loading**: For chart data and reports
- **Memoization**: For expensive calculations
- **Debouncing**: For search and filter inputs
- **Caching**: For frequently accessed data

### **Security Specifications**

#### **Data Protection**
- **Local Storage**: All sensitive data encrypted in localStorage
- **Input Validation**: Client-side and server-side validation
- **XSS Protection**: Sanitized user inputs
- **CSRF Protection**: Token-based request validation

#### **Authentication Security**
- **Password Requirements**: Minimum 8 characters, mixed case, numbers
- **Session Management**: Secure session tokens with expiration
- **Rate Limiting**: Prevent brute force attacks
- **Input Sanitization**: Prevent injection attacks

### **Browser Compatibility**

#### **Supported Browsers**
- **Chrome**: Version 90+
- **Firefox**: Version 88+
- **Safari**: Version 14+
- **Edge**: Version 90+

#### **Feature Detection**
- **localStorage**: Required for data persistence
- **ES6 Modules**: Required for modern JavaScript
- **CSS Grid**: Required for layout
- **Fetch API**: Required for HTTP requests

### **Testing Specifications**

#### **Test Coverage Requirements**
- **Unit Tests**: 90%+ coverage for utility functions
- **Integration Tests**: 80%+ coverage for data service
- **Component Tests**: 70%+ coverage for UI components
- **E2E Tests**: Critical user flows

#### **Test Types**
```typescript
// Unit Test Example
describe('DataService', () => {
  test('should create transaction with valid data', () => {
    const transaction = { /* valid transaction data */ };
    const result = dataService.createTransaction(transaction);
    expect(result.id).toBeDefined();
    expect(result.description).toBe(transaction.description);
  });
});

// Integration Test Example
describe('Transaction Flow', () => {
  test('should create, update, and delete transaction', async () => {
    // Create transaction
    const created = await dataService.createTransaction(transactionData);

    // Update transaction
    const updated = await dataService.updateTransaction(created.id, updateData);

    // Delete transaction
    const deleted = await dataService.deleteTransaction(created.id);
    expect(deleted).toBe(true);
  });
});
```

## Implementation Details

### **Data Service Architecture**

#### **Current Implementation: In-Memory Data Service**
- **Purpose**: In-memory data storage with localStorage persistence
- **Location**: `src/lib/data-service.ts`
- **Benefits**: SSR compatible, fast development, easy debugging
- **Limitations**: localStorage limits, no multi-device sync, limited scalability

#### **Why Not SQLite (Currently)**
- **SSR Compatibility Issues**: `sql.js` requires Node.js `fs` module
- **Build Errors**: `Module not found: Can't resolve 'fs'` errors
- **Browser Limitations**: SQLite not natively supported in browsers

#### **Data Models**
```typescript
interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  accountId: number;
  categoryId: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  recurring: boolean;
}

interface Account {
  id: number;
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'CREDIT' | 'INVESTMENT' | 'CASH';
  balance: number;
  balanceDate: string;
  color: string;
}

interface AccountBalanceAnchor {
  id: number;
  accountId: number;
  balance: number;
  anchorDate: string;
  description?: string;
}
```

### **File Structure**
```
fintrack-platform-v4/
├── src/
│   ├── app/                    # Next.js App Router pages
│   ├── components/             # React components
│   │   ├── auth/              # Authentication components
│   │   ├── layout/            # Layout components
│   │   ├── transactions/      # Transaction components
│   │   └── common/            # Shared components
│   ├── contexts/              # React contexts
│   ├── lib/                   # Core services and utilities
│   └── types/                 # TypeScript type definitions
├── docs/                      # Documentation
└── public/                    # Static assets
```

### **Development Workflow**
- **Local Development**: `npm run dev`
- **Type Checking**: `npx tsc --noEmit`
- **Linting**: ESLint configuration
- **Git Workflow**: Feature branches with targeted commits
- **QA Testing**: Comprehensive test cases documented in [QA Test Cases](./qa-test-cases.md)

---

### **Deployment & Configuration**

#### **Environment Configuration**
```typescript
// Environment variables
interface EnvironmentConfig {
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;

  // Application Configuration
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_APP_NAME: string;
  NEXT_PUBLIC_APP_VERSION: string;

  // Feature Flags
  NEXT_PUBLIC_ENABLE_DEMO_MODE: boolean;
  NEXT_PUBLIC_ENABLE_DEV_TOOLS: boolean;
  NEXT_PUBLIC_ENABLE_ANALYTICS: boolean;

  // Development Configuration
  NODE_ENV: 'development' | 'production' | 'test';
  NEXT_PUBLIC_DEBUG_MODE: boolean;
}
```

#### **Build Configuration**
```json
// next.config.js
{
  "experimental": {
    "appDir": true
  },
  "typescript": {
    "ignoreBuildErrors": false
  },
  "eslint": {
    "ignoreDuringBuilds": false
  },
  "output": "standalone",
  "env": {
    "NEXT_PUBLIC_APP_VERSION": "4.0.0"
  }
}

// tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "scripts"]
}
```

#### **Package Dependencies**
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@supabase/supabase-js": "^2.38.0",
    "@supabase/auth-helpers-nextjs": "^0.8.0",
    "recharts": "^2.8.0",
    "lucide-react": "^0.292.0",
    "date-fns": "^2.30.0",
    "papaparse": "^5.4.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@types/papaparse": "^5.3.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "jest": "^29.0.0",
    "@testing-library/react": "^13.0.0",
    "@testing-library/jest-dom": "^6.0.0"
  }
}
```

#### **Vercel Deployment Configuration**
```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "outputDirectory": ".next",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

#### **Git Hooks Configuration**
```json
// .husky/pre-push
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run type checking
npm run typecheck

# Run build to ensure everything compiles
npm run build

# Check for localStorage usage in UI components
if grep -r "localStorage" src/app/ --include="*.tsx" --include="*.ts"; then
  echo "❌ Direct localStorage usage detected in UI components!"
  echo "Please use the DataService for all localStorage operations."
  exit 1
fi

echo "✅ Pre-push checks passed!"
```

### **Development Workflow**

#### **Git Branch Strategy**
```
main (production)
├── feature/v0.7.1 (current development)
│   ├── feature/ai-categorization
│   ├── feature/backup-restore
│   └── feature/audit-logging
├── hotfix/ (emergency fixes)
└── release/ (release preparation)
```

#### **Code Quality Standards**
```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}

// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

#### **Testing Configuration**
```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

## Quality Assurance

### **Testing Strategy**
FinTrack V4 implements a comprehensive testing approach to ensure reliability and user satisfaction.

#### **Test Documentation**
- **QA Test Cases**: [QA Test Cases](./qa-test-cases.md) - Comprehensive test suite with version-specific sections
- **Version-Specific Tests**: Each version includes dedicated test cases
- **Test Templates**: Reusable templates for future feature testing

#### **Test Categories**
1. **Functional Testing**: Core feature functionality
2. **UI/UX Testing**: User interface and experience
3. **Cross-Browser Testing**: Compatibility across browsers
4. **Performance Testing**: Load times and responsiveness
5. **Data Integrity Testing**: Data persistence and accuracy
6. **Error Handling Testing**: Graceful error management

#### **Testing Process**
- **Pre-Release Testing**: Full test suite execution before each release
- **Feature Testing**: Individual test cases for new features
- **Regression Testing**: Ensure existing features still work
- **User Acceptance Testing**: Real-world usage scenarios

#### **Test Case Management**
- **Version Tracking**: Test cases organized by version
- **Priority Levels**: High/Medium/Low priority classification
- **Pass/Fail Tracking**: Clear test result documentation
- **Issue Tracking**: Bug reports and resolution tracking

---

## Migration & Future Plans

### **SQLite Migration Strategy**

#### **When to Migrate**
- **SSR Compatibility Resolved**: Solution found for `sql.js` SSR issues
- **Performance Degradation**: Large datasets causing slow operations
- **User Requests**: Data export/import or multi-device sync needs
- **Data Loss Issues**: Users losing data due to localStorage limitations

#### **Migration Approach**
1. **Interface Compatibility**: Maintain same data service interface
2. **Gradual Migration**: Test SQLite alongside data service
3. **Data Export**: Add export functionality before migration
4. **Rollback Plan**: Keep data service as fallback

### **Feature Roadmap**

#### **Phase 1: Core MVP (Current)**
- ✅ Authentication system
- ✅ Transaction management
- ✅ Recurring transactions feature
- ✅ Enhanced view transactions page (summary panel, bulk selection, pagination)
- ✅ Account balance calculation
- ✅ Basic navigation

#### **Phase 2: Enhanced UI & Analytics**
- ✅ Professional NavBar implementation
- ✅ Account Balance History Chart
- ✅ Bulk operations (delete, update, insert) for transactions
- ✅ Consistent amount display across all components
- ✅ Data consistency validation system
- ✅ Spending Trend Report with interactive charts
- ✅ Interactive hover tooltips with drill-down functionality
- ✅ Visual highlighting of chart segments
- ✅ Clickable tooltips for table expansion
- ✅ Report configuration with filters and breakdown dimensions
- ✅ Dynamic breakdown period updates (weekly, bi-weekly, monthly, quarterly, bi-annually, annually)
- ✅ User preferences integration for breakdown periods
- ✅ Real-time data regeneration based on user preferences
- ✅ Category Merge System
- ✅ Account Balance Anchor System with Adjustment Transactions
- ✅ CSV Import Logic with Data Preview
- ✅ Demo Service for Testing and Onboarding
- ✅ Import Preview Logic with Smart Transaction Type Inference
- ✅ Enhanced Balance History Page Layout and UX
- 📋 AI Transaction Categorization System
- 📋 Audit Logging System
- 📋 Backup & Restore System
- 📋 Financial Freedom & Savings Incentive System
- 📋 Goal-Based Financial Planning System
- 📋 Community Data Sharing Ecosystem
- 📋 Multi-Factor Authentication (MFA) System
- 📋 Mobile App Development
- 📋 Plaid Integration
- 📋 Privacy vs Data Sharing Choice
- 📋 Troubleshooting Data Access System
- 📋 Receipt Scanning & Transaction Matching
- 📋 Stripe Payment Integration
- 🔄 Improved mobile responsiveness
- 🔄 Better form validation and error handling

#### **Phase 3: Advanced Features**
- ✅ CSV import logic with data preview and validation
- ✅ Smart transaction type inference for imports
- 📋 Data export functionality
- 📋 Advanced reporting and analytics
- 📋 CSV export functionality

#### **Phase 4: Scale & Polish**
- 📋 SQLite migration (when SSR issues resolved)
- 📋 Multi-device sync
- 📋 Advanced security features
- 📋 Performance optimizations

### **Scaling Considerations**
- **User Growth**: Plan for 100+ active users
- **Data Volume**: Handle years of transaction history
- **Performance**: Optimize for large datasets
- **Security**: Implement data encryption and access controls

### **Deployment Strategy**

#### **Vercel Deployment (Recommended)**
FinTrack V4 is optimized for deployment on Vercel, providing seamless Next.js integration and excellent developer experience.

#### **Why Vercel**
- **Perfect Next.js Integration**: Built by the Next.js team, zero-config deployment
- **Automatic Preview Deployments**: Test changes before going live
- **Environment Variables**: Easy Supabase configuration
- **Free Tier**: Generous limits for MVP and personal use
- **Automatic HTTPS**: Important for financial applications
- **Global CDN**: Fast loading times worldwide

#### **Deployment Process**
1. **Repository Connection**: Connect GitHub repository to Vercel
2. **Environment Variables**: Configure Supabase credentials
3. **Automatic Deployment**: Push to main branch triggers deployment
4. **Preview Deployments**: Pull requests get preview URLs
5. **Custom Domain**: Optional custom domain configuration

#### **Environment Variables Required**
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### **Cost Structure**
- **Free Tier**: $0/month for MVP
  - 100GB bandwidth/month
  - Unlimited personal projects
  - 6,000 build minutes/month
- **Pro Plan**: $20/month (when needed)
  - 1TB bandwidth
  - Team collaboration
  - Advanced analytics

#### **Deployment Files**
- **Vercel Configuration**: `vercel.json` (optional)
- **Build Configuration**: `next.config.ts`
- **Environment Setup**: `.env.example` template

#### **Migration Path**
- **Start**: Vercel free tier for MVP
- **Scale**: Upgrade to Pro when needed
- **Alternative**: Migrate to Hostinger for cost savings if required

### **API Documentation & Integration**

#### **REST API Endpoints**
```typescript
// Authentication Endpoints
POST /api/auth/signup
POST /api/auth/signin
POST /api/auth/signout
POST /api/auth/reset-password

// Data Endpoints (Future Cloud Integration)
GET /api/transactions
POST /api/transactions
PUT /api/transactions/:id
DELETE /api/transactions/:id

GET /api/accounts
POST /api/accounts
PUT /api/accounts/:id
DELETE /api/accounts/:id

GET /api/categories
POST /api/categories
PUT /api/categories/:id
DELETE /api/categories/:id

// Import/Export Endpoints
POST /api/import/csv
GET /api/export/csv
POST /api/backup/create
POST /api/backup/restore
```

#### **Data Import/Export Formats**
```typescript
// CSV Import Format
interface CSVTransaction {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  account: string;
  category: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
}

// Backup Format
interface BackupData {
  version: string;
  timestamp: string;
  user: {
    id: string;
    email: string;
  };
  data: {
    transactions: Transaction[];
    accounts: Account[];
    categories: Category[];
    preferences: UserPreferences;
  };
  checksum: string; // SHA-256
}
```

#### **Third-Party Integrations**
```typescript
// Supabase Integration
interface SupabaseConfig {
  url: string;
  anonKey: string;
  auth: {
    providers: ['email'];
    redirectTo: string;
  };
}

// Future Plaid Integration (Privacy-First)
interface PlaidConfig {
  clientId: string;
  environment: 'sandbox' | 'development' | 'production';
  products: ['transactions', 'accounts'];
  privacyMode: 'local-only' | 'encrypted-proxy';
}
```

### **Performance Monitoring**

#### **Key Performance Indicators (KPIs)**
```typescript
interface PerformanceMetrics {
  // Load Times
  initialPageLoad: number; // < 2s
  transactionListLoad: number; // < 500ms
  chartRenderTime: number; // < 1s

  // User Experience
  timeToInteractive: number; // < 3s
  firstContentfulPaint: number; // < 1.5s
  cumulativeLayoutShift: number; // < 0.1

  // Data Operations
  transactionCreateTime: number; // < 200ms
  searchResponseTime: number; // < 100ms
  filterResponseTime: number; // < 100ms
}
```

#### **Error Monitoring**
```typescript
interface ErrorMetrics {
  errorRate: number; // < 1%
  criticalErrors: number; // 0
  userReportedIssues: number;
  performanceIssues: number;
}
```

### **Accessibility Specifications**

#### **WCAG 2.1 AA Compliance**
- **Color Contrast**: Minimum 4.5:1 ratio for normal text
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and roles
- **Focus Management**: Visible focus indicators
- **Alternative Text**: Images and icons have alt text

#### **Accessibility Features**
```typescript
interface AccessibilityFeatures {
  keyboardNavigation: boolean;
  screenReaderSupport: boolean;
  highContrastMode: boolean;
  fontSizeAdjustment: boolean;
  reducedMotionSupport: boolean;
}
```

### **Internationalization (i18n) Ready**

#### **Localization Structure**
```typescript
interface LocalizationConfig {
  defaultLocale: 'en-US';
  supportedLocales: ['en-US', 'es-ES', 'fr-FR'];
  currencyFormats: {
    'en-US': 'USD';
    'es-ES': 'EUR';
    'fr-FR': 'EUR';
  };
  dateFormats: {
    'en-US': 'MM/DD/YYYY';
    'es-ES': 'DD/MM/YYYY';
    'fr-FR': 'DD/MM/YYYY';
  };
}
```

### **Security Audit Checklist**

#### **Data Security**
- [ ] All sensitive data encrypted in localStorage
- [ ] Input validation on all user inputs
- [ ] XSS protection implemented
- [ ] CSRF protection for API calls
- [ ] Secure session management
- [ ] Password requirements enforced
- [ ] Rate limiting on authentication endpoints

#### **Privacy Compliance**
- [ ] No data sent to third parties without consent
- [ ] Clear privacy policy
- [ ] Data export functionality
- [ ] Data deletion capability
- [ ] Audit logging for data changes
- [ ] User consent management

### **Documentation Completeness Checklist**

#### **Technical Documentation** ✅
- [x] Database schema and data models
- [x] API specifications and endpoints
- [x] Component architecture and hierarchy
- [x] State management patterns
- [x] Utility functions and services
- [x] Error handling and logging
- [x] Performance specifications
- [x] Security specifications
- [x] Browser compatibility
- [x] Testing specifications
- [x] Deployment configuration
- [x] Development workflow
- [x] Code quality standards

#### **User Documentation** ✅
- [x] Feature specifications
- [x] User interface design
- [x] User experience flows
- [x] Quality assurance test cases
- [x] Accessibility requirements
- [x] Performance requirements

#### **Business Documentation** ✅
- [x] MVP requirements
- [x] Future feature roadmap
- [x] Technical architecture decisions
- [x] Integration specifications
- [x] Security and privacy requirements

---

## Feature Documentation

### Core Features
- **[CSV Import PRD](features/csv-import-prd.md)**: Import CSV files with pre-determined field order, data preview, duplicate detection, and rollback capability
- **[Demo Account PRD](features/demo-account-prd.md)**: Demo account with seed data for users to explore the app with realistic 13-month transaction history

### Feature Implementation Tasks
- **[Recurring Transactions Tasks](features/recurring-transactions-tasks.md)**: Comprehensive task list for adding recurring field to transactions

## Conclusion

FinTrack V4 represents a **return to simplicity and focus on core functionality**. By eliminating the complexity of multi-tenancy, cloud sync, and encryption, we can create a reliable, fast, and maintainable personal finance application that actually works.
**Key Benefits:**
- 🚀 **Faster Development**: 4 weeks vs. months of debugging
- 🐛 **Fewer Bugs**: Simple architecture = fewer failure points
- 🔧 **Easier Maintenance**: Clear code, predictable behavior
- 👥 **Better User Experience**: No complex modes or authentication friction
- 💰 **Lower Costs**: No cloud services or complex infrastructure

This approach prioritizes **working software** over **feature completeness**, which is exactly what's needed to create a successful MVP.
