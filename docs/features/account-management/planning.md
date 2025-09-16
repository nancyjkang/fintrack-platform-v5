# Feature: Account Management

**Created**: 2025-09-15
**Estimated Start**: 2025-09-15
**Priority**: High

---

## 🎯 **Goal**
Implement a complete Account Management system for FinTrack v5 that allows users to manage their financial accounts (checking, savings, credit cards, investments, loans) with full CRUD operations, balance reconciliation, and proper visual organization. This feature provides the foundation for transaction management and financial tracking.

## 👥 **User Impact**
Users can organize their financial life by managing all their accounts in one place, track balances accurately, reconcile accounts with bank statements, and maintain a clear overview of their financial position across different account types.

**User Story**: As a FinTrack user, I want to manage my financial accounts (create, edit, delete, reconcile) so that I can track my money across different banks and account types with accurate balances.

---

## 📊 **Scope Definition**

### **✅ Must Have (Core Functionality)**
- [x] **Account CRUD Operations**: Create, read, update, delete accounts with proper validation
- [x] **Account Types Support**: Checking, Savings, Credit Card, Investment, Loan, Traditional Retirement, Roth Retirement with appropriate icons and colors
- [x] **Net Worth Classification**: `net_worth_category` field (ASSET | LIABILITY | EXCLUDED) for proper net worth tracking
- [ ] **Account Reconciliation**: Manual balance reconciliation with automatic adjustment transaction creation (uses existing MVP accounting system)
- [x] **Active/Inactive Status**: Soft delete functionality with proper transaction preservation - **IMPLEMENTED**: Active accounts are set to inactive on "delete", inactive accounts can be permanently deleted
- [x] **Visual Customization**: Custom color picker for each account with type-based defaults
- [x] **Balance Display**: Proper balance formatting with positive/negative styling (uses `calculateAccountBalance()` from MVP accounting system)
- [x] **Tab Navigation**: Filter between active and inactive accounts with counts
- [x] **Responsive Grid Layout**: Card-based layout that works on all screen sizes

### **⚡ Should Have (Important)**
- [ ] **Account Balance History**: Track balance changes over time
- [ ] **Bulk Operations**: Select and operate on multiple accounts
- [ ] **Account Search/Filter**: Search accounts by name or type
- [ ] **Account Statistics**: Show account usage and transaction counts

### **💡 Nice to Have (If Time Permits)**
- [ ] **Account Templates**: Quick setup for common account types
- [ ] **Account Import**: Import accounts from CSV or other formats
- [ ] **Account Grouping**: Organize accounts into custom groups
- [ ] **Account Performance**: Show growth/decline analytics

### **❌ Out of Scope (For This Version)**
- Account synchronization with banks (future integration feature)
- Advanced reporting and analytics (separate reporting feature)
- Account sharing between users (multi-user feature)

---

## 🔗 **Dependencies**

### **Prerequisites (Must be done first)**
- [x] **Database Schema**: Account model exists in v5 schema
- [x] **Authentication System**: User/tenant context for data isolation
- [x] **Base Service Layer**: AccountService exists but needs reconciliation updates
- [x] **Date Utilities**: Date handling utilities are available

### **Dependent Features (Blocked by this)**
- **Transaction CRUD**: Needs accounts for transaction creation and categorization
- **Dashboard Overview**: Needs account data for balance summaries
- **Reports**: Needs account structure for financial reporting

---

## 🛠️ **Technical Approach**

### **Database Changes**
- [x] **Account Model**: Already exists with required fields (id, name, type, balance, color, is_active, tenant_id)
- [ ] **Migration Required**: No new migrations needed, schema is compatible
- [ ] **Reconciliation Support**: Leverage existing transaction system for adjustment transactions

### **API Endpoints Needed**
- [x] `GET /api/accounts` - List accounts with optional active/inactive filter
- [x] `POST /api/accounts` - Create new account with initial balance
- [x] `GET /api/accounts/[id]` - Get single account details
- [x] `PUT /api/accounts/[id]` - Update account name, type, color, is_active
- [x] `DELETE /api/accounts/[id]` - Soft delete (deactivate) or hard delete account
- [ ] `POST /api/accounts/[id]/reconcile` - Reconcile account balance with adjustment transaction

### **UI Components**
- [x] **AccountsPageContent** - Main page container with header and tabs
- [x] **AccountsList** - Grid layout of account cards with filtering (integrated into AccountsPageContent)
- [x] **AccountCard** - Individual account display with actions (edit, delete, reconcile) (integrated into AccountsPageContent)
- [x] **AccountForm** - Modal form for creating/editing accounts
- [ ] **ReconcileModal** - Modal for account balance reconciliation
- [x] **ConfirmDialog** - Confirmation dialog for account deletion (using browser confirm)

### **Third-party Integrations**
- **Lucide Icons**: For account type icons (Building, PiggyBank, CreditCard, TrendingUp, DollarSign)
- **React Hook Form**: For form validation and management
- **Tailwind CSS**: For styling to match v4.1 specifications exactly

---

## 📋 **UI Specification (Based on v4.1)**

### **Main Account List Page (`/settings/accounts`)**

#### **Page Layout**
- **Header Section**:
  - Page title: "Account List" (text-3xl font-bold text-gray-900)
  - Subtitle: "Manage your financial accounts" (text-gray-600)
  - "Add Account" button (blue, top-right, with Plus icon)

#### **Tab Navigation**
- **Active Tab**: Shows active accounts with count "Active (X)"
- **Inactive Tab**: Shows inactive accounts with count "Inactive (X)"
- Tab styling: Blue underline for active tab, gray for inactive
- Border-bottom styling with hover effects

#### **Account Cards Grid**
- **Layout**: Grid layout (grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4)
- **Card Structure**:
  - White background with gray border (border-2 border-gray-200)
  - Rounded corners (rounded-lg)
  - Hover effects: blue border and shadow (hover:border-blue-500 hover:shadow-md)
  - Padding: p-4

#### **Individual Account Card**
- **Top Section** (flex justify-between items-start mb-4):
  - **Left Side** (flex items-center gap-3):
    - **Account Icon**:
      - Colored square (w-12 h-12 rounded-md) with account's custom color
      - White icon inside (w-6 h-6 text-white)
      - Icon based on account type (Building, PiggyBank, CreditCard, TrendingUp, DollarSign)
    - **Account Info**:
      - Account name (text-lg font-semibold text-gray-900 mb-1)
      - Account type label (text-sm text-gray-500 font-medium)
  - **Right Side** (flex gap-2):
    - **Reconcile Button**: Calculator icon (16px), gray with blue hover
    - **Edit Button**: Edit icon (16px), gray with gray hover
    - **Delete Button**: Trash2 icon (16px), gray with red hover
    - All buttons: p-2 rounded with transition-colors

- **Bottom Section** (flex justify-end items-center):
  - **Balance Display** (text-right):
    - "BALANCE" label (text-xs font-medium text-gray-500 uppercase tracking-wide)
    - Balance amount (text-lg font-semibold, red for negative, gray for positive)
    - Uses BalanceAmount component for formatting

#### **Empty State**
- **When no accounts**:
  - Bank emoji (🏦) at text-6xl text-gray-400
  - "No {filter} accounts found" heading (text-lg font-medium text-gray-900)
  - Descriptive text (text-gray-500)
  - Centered layout with py-12

### **Account Form Modal**

#### **Modal Structure**
- **Overlay**: Fixed full-screen with black 50% opacity background
- **Modal**: White rounded-lg shadow-xl, max-w-md, centered
- **Header**:
  - Title: "Add New Account" or "Edit Account" (text-xl font-semibold)
  - Close button (X icon, gray with hover)
  - Border-bottom separator

#### **Form Fields**
1. **Account Name** (Required):
   - Text input with red asterisk
   - Full width with blue focus ring
   - Border: border-gray-300, focus: ring-2 ring-blue-500

2. **Account Type** (Required):
   - Select dropdown with red asterisk
   - Options: Checking, Savings, Credit Card, Investment, Loan, Traditional Retirement, Roth Retirement
   - Same styling as name field

3. **Initial Balance** (New accounts only):
   - Number input with step="0.01"
   - Placeholder: "0.00"
   - Same styling as other fields

4. **Balance Date** (New accounts only):
   - Date input
   - Defaults to current date
   - Same styling as other fields

5. **Account Color**:
   - Color picker input (w-12 h-10) + text input for hex value
   - Flex layout with gap-3
   - Default: #3B82F6 (blue)

#### **Form Actions**
- **Cancel Button**: Gray border, gray text, hover:bg-gray-50
- **Save Button**: Blue background, white text, hover:bg-blue-700
- Both buttons: flex-1 px-4 py-2 rounded-md transition-colors
- Loading state: "Saving..." with disabled opacity

### **Account Reconciliation Modal**

#### **Modal Structure**
- Same overlay and modal structure as Account Form
- Title: "Reconcile Account"

#### **Information Display**
- **Account Name**: Read-only gray background field
- **Current Balance**: Read-only gray background field with BalanceAmount formatting

#### **Reconciliation Form**
1. **New Balance**:
   - Number input with dollar sign prefix (absolute positioning)
   - Step="0.01", placeholder="0.00"
   - Required field

2. **Reconcile Date**:
   - Date input, required
   - Helper text showing suggested date (today)
   - Small gray text: "Suggested: YYYY-MM-DD (today)"

3. **Balance Adjustment Preview**:
   - Blue background info box (bg-blue-50 border-blue-200)
   - Shows calculated difference with NetAmount component
   - Color-coded: green for positive, red for negative
   - Explanatory text about adjustment transaction creation

#### **Form Actions**
- Same Cancel/Save button layout as Account Form
- Save button text: "Reconcile" with loading state "Reconciling..."

### **Account Type Configuration**

#### **Type Icons and Colors**
```typescript
const typeIcons = {
  checking: Building,           // Default: #3B82F6 (Blue)
  savings: PiggyBank,           // Default: #10B981 (Green)
  credit_card: CreditCard,      // Default: #F59E0B (Orange)
  investment: TrendingUp,       // Default: #8B5CF6 (Purple)
  loan: DollarSign,             // Default: #EF4444 (Red)
  traditional_retirement: Shield, // Default: #059669 (Dark Green)
  roth_retirement: ShieldCheck,   // Default: #0891B2 (Cyan)
};

const typeLabels = {
  checking: 'Checking',
  savings: 'Savings',
  credit_card: 'Credit Card',
  investment: 'Investment',
  loan: 'Loan',
  traditional_retirement: 'Traditional Retirement',
  roth_retirement: 'Roth Retirement',
};
```

---

## ⏱️ **Estimates**

### **Complexity Assessment**
- **Overall Complexity**: Medium
- **Database Work**: 2 hours - Update AccountService for reconciliation
- **API Development**: 4 hours - 6 endpoints with proper validation
- **UI Development**: 8 hours - 5 components with complex modals and forms
- **Testing & Polish**: 4 hours - Unit tests and integration testing

### **Time Estimate**
- **Total Estimate**: 2.5 days
- **Buffer (20%)**: 0.5 days
- **Final Estimate**: 3 days

### **Risk Assessment**
- **Risk Level**: Medium
- **Main Risks**:
  - **Complex UI Requirements**: Exact v4.1 matching may require iteration - Mitigation: Break into smaller components
  - **Reconciliation Logic**: Balance adjustment transactions need careful handling - Mitigation: Thorough testing and clear business rules

---

## ✅ **Success Criteria**

### **Functional Requirements**
- [x] User can create accounts with all required fields and proper validation
- [x] User can edit account details (name, type, color, is_active) without affecting balance
- [x] User can delete/deactivate accounts with proper confirmation and data preservation
- [ ] User can reconcile account balances with automatic adjustment transaction creation
- [x] User can filter between active and inactive accounts with accurate counts
- [x] Account cards display correctly with proper icons, colors, and balance formatting
- [x] All modals work correctly with proper form validation and error handling

### **Performance Requirements**
- [ ] Account list page loads in < 500ms
- [ ] Handles 100+ accounts without performance issues
- [ ] Works smoothly on mobile devices
- [ ] Modal animations are smooth and responsive

### **Quality Requirements**
- [ ] All unit tests pass with >90% coverage
- [ ] No TypeScript errors or warnings
- [ ] No accessibility issues (keyboard navigation, screen readers)
- [ ] Responsive design works on all screen sizes
- [ ] UI matches v4.1 specifications exactly

---

## 🧪 **Testing Strategy**

### **Unit Tests**
- [x] **AccountService** - CRUD operations, reconciliation logic, validation
- [x] **API Endpoints** - Request/response handling, error cases, authentication
- [ ] **UI Components** - Rendering, user interactions, form validation
- [ ] **Account Type Utils** - Icon mapping, color defaults, type validation

### **Integration Tests**
- [ ] **Account Creation Workflow** - End-to-end account creation with initial balance
- [ ] **Account Reconciliation** - Balance adjustment transaction creation
- [ ] **Account Deletion** - Soft delete vs hard delete behavior
- [ ] **Tab Navigation** - Active/inactive filtering with counts

### **Manual Testing**
- [ ] **Account CRUD Operations** - Create, edit, delete accounts of all types
- [ ] **Reconciliation Process** - Test with positive, negative, and zero adjustments
- [ ] **Responsive Design** - Test on mobile, tablet, desktop screen sizes
- [ ] **Color Customization** - Test color picker and hex input validation
- [ ] **Error Handling** - Test network errors, validation errors, edge cases

---

## 🗄️ **Database Schema Updates**

The Account model needs to be updated to include the new account types and net worth classification:

```prisma
model Account {
  id                  Int      @id @default(autoincrement())
  tenant_id           String
  name                String
  type                String   // CHECKING, SAVINGS, CREDIT_CARD, INVESTMENT, LOAN, TRADITIONAL_RETIREMENT, ROTH_RETIREMENT
  net_worth_category  String   // ASSET, LIABILITY, EXCLUDED
  balance             Decimal  @db.Decimal(12, 2)
  balance_date        DateTime
  color               String
  is_active           Boolean  @default(true)
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt

  // Relationships
  tenant          Tenant                 @relation(fields: [tenant_id], references: [id], onDelete: Cascade)
  transactions    Transaction[]
  balance_anchors AccountBalanceAnchor[]

  // Unique constraints
  @@unique([tenant_id, name])
  @@map("accounts")
}
```

**Default Net Worth Categories by Account Type**:
- **ASSET**: CHECKING, SAVINGS, INVESTMENT, TRADITIONAL_RETIREMENT, ROTH_RETIREMENT
- **LIABILITY**: CREDIT_CARD, LOAN
- **EXCLUDED**: User can manually set any account type to excluded

**Migration Required**: Add `net_worth_category` column with appropriate defaults based on account type.

---

## 📋 **Implementation Plan**

### **Phase 1: Foundation** (1 day) - ✅ COMPLETED
- [x] Update AccountService with reconciliation methods
- [x] Create API endpoints for account CRUD operations
- [ ] Add reconciliation endpoint with adjustment transaction logic
- [x] Set up proper validation schemas

### **Phase 2: Core UI Components** (1.5 days) - ✅ COMPLETED
- [x] Create AccountsPageContent with header and tab navigation
- [x] Create AccountsList with grid layout and filtering (integrated into AccountsPageContent)
- [x] Create AccountCard component with actions and proper styling (integrated into AccountsPageContent)
- [x] Create AccountForm modal with all form fields and validation
- [ ] Create ReconcileModal with balance adjustment preview

### **Phase 3: Polish & Testing** (0.5 days) - 🔄 IN PROGRESS
- [x] Add loading states and error handling
- [x] Implement responsive design and accessibility
- [x] Create comprehensive unit tests (service and API layers)
- [x] Test integration with existing systems
- [ ] Update navigation and feature documentation

---

## 📊 **Metrics & Monitoring**

### **Success Metrics**
- **Account Creation Rate**: Number of accounts created per user
- **Reconciliation Usage**: Percentage of users using reconciliation feature
- **Error Rate**: API error rate should be < 1%
- **Page Load Time**: Account list should load in < 500ms

### **Monitoring**
- [ ] Error tracking for API failures and UI errors
- [ ] Performance monitoring for page load times
- [ ] User behavior tracking for feature adoption

---

## 📝 **Notes & Decisions**

### **Technical Decisions**
- **UI Framework**: Use existing v5 component patterns with Tailwind CSS for exact v4.1 matching
- **Service Layer**: Use AccountService for all database operations following established patterns
- **Balance Calculation**: Leverage existing [MVP Accounting System](../../architecture/mvp-accounting-system.md) for accurate balance calculations with anchor support
- **State Management**: Use React state with proper lifting for modal management
- **Validation**: Use Zod schemas for both client and server-side validation
- **Reconciliation**: Create adjustment transactions through existing transaction system (Balance Anchor + Initial Transaction pattern)
- **Account Types**: Extended from v4.1's 5 types to 7 types, adding Traditional Retirement and Roth Retirement for better retirement account management
- **Net Worth Tracking**: Add `net_worth_category` field (ASSET | LIABILITY | EXCLUDED) to enable proper net worth calculations

### **Net Worth Tracking - Additional Account Attributes**

For comprehensive net worth tracking, consider adding these account attributes:

#### **Essential for Net Worth Calculation**
1. **`net_worth_category`** (ASSET | LIABILITY | EXCLUDED):
   - **ASSET**: Checking, Savings, Investment, Traditional/Roth Retirement (positive contribution)
   - **LIABILITY**: Credit Cards, Loans (negative contribution)
   - **EXCLUDED**: Accounts that shouldn't count toward net worth (e.g., business accounts)

#### **Future Enhancements (Not in v1)**
2. **`account_number_last4`** (String, optional):
   - Last 4 digits of account number for identification
   - Helps distinguish multiple accounts at same institution
   - Never store full account numbers for security

5. **`interest_rate`** (Decimal, optional):
   - Current interest rate for savings, loans, credit cards
   - Useful for projections and optimization recommendations
   - Can help identify high-interest debt to prioritize

6. **`credit_limit`** (Decimal, optional, for credit accounts):
   - Credit limit for credit cards and lines of credit
   - Enables credit utilization tracking
   - Important for credit score monitoring

#### **Advanced Features**
7. **`maturity_date`** (Date, optional):
   - For CDs, bonds, loans with fixed terms
   - Enables timeline planning and maturity tracking

8. **`minimum_balance`** (Decimal, optional):
   - Required minimum balance to avoid fees
   - Helps with cash flow planning

9. **`monthly_fee`** (Decimal, optional):
   - Monthly maintenance fees
   - Useful for account cost analysis

10. **`notes`** (Text, optional):
    - Free-form notes about the account
    - Account-specific goals, restrictions, or reminders

#### **Net Worth Calculation Logic**
```typescript
const calculateNetWorth = async (accounts: Account[]) => {
  let totalNetWorth = 0;

  for (const account of accounts) {
    if (account.net_worth_category === 'EXCLUDED' || !account.is_active) {
      continue; // Skip excluded or inactive accounts
    }

    // Use existing accounting system for accurate balance calculation
    const currentBalance = await calculateAccountBalance(account.id);

    if (account.net_worth_category === 'ASSET') {
      totalNetWorth += currentBalance; // Add assets
    } else if (account.net_worth_category === 'LIABILITY') {
      totalNetWorth -= Math.abs(currentBalance); // Subtract liabilities
    }
  }

  return totalNetWorth;
};
```

**Note**: This leverages the existing `calculateAccountBalance()` function from our [MVP Accounting System](../../architecture/mvp-accounting-system.md), which handles:
- Balance anchor + transaction calculations
- Bidirectional balance calculation (forward/backward from anchors)
- Graceful fallback to direct transaction sum
- Real-time balance accuracy

### **Implementation Details & Decisions Made**

#### **Account Deletion Logic** ✅ IMPLEMENTED
- **Active Accounts**: Always set to `is_active: false` when "deleted" - preserves data and transactions
- **Inactive Accounts**: Can be permanently deleted if no transactions exist
- **User Experience**: Different confirmation messages based on account status
- **API Behavior**: DELETE endpoint returns specific error for accounts with transactions

#### **Form Validation & User Experience** ✅ IMPLEMENTED
- **Account Form**: Supports both create and edit modes with proper field handling
- **Balance Fields**: Only editable during account creation, read-only during edit
- **Color Customization**: Custom color picker with hex input, no preset colors
- **Active Status**: Re-added checkbox to allow users to reactivate inactive accounts
- **Error Handling**: Comprehensive error messages and loading states

#### **UI Architecture Decisions** ✅ IMPLEMENTED
- **Component Structure**: Integrated AccountsList and AccountCard into AccountsPageContent for simplicity
- **Tab Navigation**: Active/Inactive filtering with accurate counts
- **v4.1 Compatibility**: Exact layout matching with proper spacing, colors, and typography
- **Responsive Design**: Grid layout that adapts to different screen sizes

#### **API & Service Layer** ✅ IMPLEMENTED
- **Filter Handling**: Proper null value handling in query parameters
- **Validation**: Zod schemas for request/response validation
- **Error Responses**: Consistent error format across all endpoints
- **Testing**: Comprehensive unit tests for both service and API layers

### **Open Questions**
- **Balance History**: Should we track balance changes over time? - Decision: Out of scope for v1, use transaction history
- **Net Worth Attributes**: Which additional attributes should be included in v1 vs future phases?

### **Assumptions**
- **Existing Transaction System**: Can handle adjustment transactions - Impact: Core reconciliation feature depends on this
- **User Behavior**: Users will primarily use 3-5 accounts - Impact: UI optimized for small to medium account counts

---

## 🔄 **Review & Approval**

### **Planning Review Checklist**
- [x] Goal is clear and valuable - Account management is foundational for financial tracking
- [x] Scope is well-defined - Clear must-have vs nice-to-have features
- [x] Dependencies are identified - Existing schema and services are compatible
- [x] Estimates seem reasonable - 3 days for medium complexity feature
- [x] Success criteria are testable - Clear functional and performance requirements
- [x] Risks are identified with mitigation plans - UI complexity and reconciliation logic addressed

### **Approval**
- [x] **Planning Approved**: September 2025 - Ready to start development
- [x] **Priority Confirmed**: High - Foundational feature for transaction management
- [x] **Implementation Completed**: January 2025 - Core functionality delivered successfully

---

*This planning document provides comprehensive specifications for Account Management based on v4.1 UI requirements and v5 architecture.*
