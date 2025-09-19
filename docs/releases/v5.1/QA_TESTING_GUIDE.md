# QA Testing Guide - v5.1 Release

**Release Date**: September 19, 2025
**Version**: v5.1.1
**Release Type**: UI/UX Enhancement + Technical Maintenance Release
**Focus**: Account Management & Registration UX Improvements + Merchant API Fixes

---

## 🎯 **Release Overview**

This release focuses on improving the user experience for account management and user registration with streamlined UI, consistent iconography, and enhanced functionality. Additionally, this release includes critical technical fixes for merchant data handling and API reliability.

### **Features Implemented in v5.1**
1. **Fixed Add Account Button**: Accounts page button now opens the account creation modal properly
2. **Simplified Dashboard**: Streamlined to show only Asset/Liability/Net Worth summary cards
3. **Streamlined Registration Form**: Removed "Full Name" field, updated to use "Financial Group" terminology
4. **Consistent Account Icons**: Replaced emoji icons with professional Lucide React icons across all components
5. **Simplified Account Form**: Hidden "Account is active" checkbox (defaults to active for new accounts)
6. **CSV Import Duplicate Override**: Added toggle buttons for user control over duplicate transaction imports
7. **Enhanced CSV Preview**: Increased preview from 5 to 15 lines with total line count display
8. **Import Performance Optimization**: Eliminated backend duplicate checking for faster bulk imports
9. **Bulk Edit Modal Fixes**: Fixed apostrophe display, implemented reactive category dropdown, and smart defaulting behavior
10. **Uncategorized Transaction Filter**: Added filter option to view transactions without assigned categories
11. **Amount Color Logic Fix**: Changed amount coloring to be based on value (positive=green, negative=red) instead of transaction type
12. **Improved Table Layout**: Optimized column spacing and widths for better visual balance in transactions table

### **Technical Fixes Implemented in v5.1.1**
13. **Merchant Field Integration**: Fixed Prisma client to properly recognize and access merchant field from database schema
14. **Enhanced Merchant API**: Improved merchant name extraction with intelligent fallback logic (database → parsed → "Unknown Merchant")
15. **Code Quality Improvements**: Removed dead code (async-cube-queue functionality) and fixed TypeScript compilation errors
16. **Date Handling Compliance**: Updated all date utilities to use UTC-aware functions for consistent timezone handling
17. **Test Suite Reliability**: Fixed all failing tests to ensure 100% test coverage (315/315 tests passing)
18. **API Data Integrity**: Enhanced trends API to properly handle merchant data with robust error handling

---

## 📋 **Features to Test**

### **1. Account Management Enhancements**

**QA Priority**: 🔴 **HIGH** - Core functionality fixes

**Test Areas**:
- Add Account button functionality on both Dashboard and Accounts pages
- Account creation modal behavior and form validation
- Account icon consistency across all components
- Account form field visibility and defaults

**Estimated Testing Time**: 2-3 hours

### **2. User Registration Improvements**

**QA Priority**: 🟡 **MEDIUM** - UX improvements

**Test Areas**:
- Registration form field changes
- Form validation and submission
- Terminology updates and clarity
- Visual styling consistency

**Estimated Testing Time**: 1-2 hours

**Prerequisites**:
- Clean browser session for registration testing
- Access to development environment
- Mobile device or browser dev tools for responsive testing

### **3. Technical Fixes & API Reliability**

**QA Priority**: 🔴 **HIGH** - Critical backend functionality

**Test Areas**:
- Merchant data display in trends and analytics
- API error handling and fallback logic
- Database schema alignment
- Test suite execution and reliability

**Estimated Testing Time**: 1-2 hours

**Prerequisites**:
- Access to trends/analytics pages
- Test data with various merchant scenarios
- Ability to run test suite (for developers)

---

## 🧪 **Test Cases**

### **TC-001: Accounts Page Add Account Button**
**Objective**: Verify Add Account button works on Accounts page
**Steps**:
1. Navigate to `/accounts`
2. Click "Add Account" button in page header
3. Verify AccountForm modal opens
4. Test modal close functionality (X, Cancel, outside click)

**Expected Result**: Modal opens and closes properly

### **TC-002: Account Creation Form Fields**
**Objective**: Verify all form fields function correctly
**Steps**:
1. Open Add Account modal
2. Test Account Name field (required validation)
3. Test Account Type dropdown (7 options available)
4. Verify Net Worth Impact auto-suggests based on type
5. Test Current Balance field (accepts positive/negative, decimals)
6. Test Balance Date field (date picker, defaults to today)
7. Test Account Color picker (color input + hex text input)
8. Verify "Account is active" checkbox is hidden
9. Submit form and verify account is created as active

**Expected Result**: All fields work correctly, form validates, account created successfully

### **TC-003: Registration Form Changes**
**Objective**: Verify registration form updates
**Steps**:
1. Navigate to `/auth/register`
2. Verify "Full Name" field is not present
3. Verify "Financial Group" label (not "Workspace Name")
4. Check placeholder text shows "e.g. Family Finances"
5. Verify help text reads "This will be the name of your financial group"
6. Check red asterisks (*) appear on required fields via CSS
7. Complete registration without name field
8. Verify successful registration and redirect

**Expected Result**: Form works without name field, terminology updated, styling correct

### **TC-004: Account Icon Consistency**
**Objective**: Verify account icons are consistent across components
**Steps**:
1. Create accounts of each type via Accounts page
2. Navigate to Dashboard and verify summary cards reflect account totals
3. Navigate to Accounts page and verify icons match expected Lucide components
4. Verify no emoji icons remain anywhere in the application
5. Check icon sizing and colors are consistent

**Expected Result**: All account icons use Lucide components consistently

### **TC-005: CSV Import Duplicate Detection Override**
**Objective**: Verify CSV import duplicate detection and toggle override functionality
**Steps**:
1. Navigate to `/transactions/import`
2. Upload a CSV file with duplicate transactions (same date, description, amount)
3. Complete column mapping and proceed to review step
4. Verify duplicate transactions are marked as "Duplicate" (yellow background)
5. Verify first occurrence of duplicates is marked as "Valid" (green background)
6. Verify all valid transactions (including duplicates) have toggle buttons in "ON" position (blue)
7. Click toggle buttons to turn OFF some duplicate transactions
8. Verify import button label updates to show selected count
9. Proceed with import and verify only selected transactions are imported

**Expected Result**: User can override duplicate detection and control exactly which transactions to import

### **TC-006: CSV Import Toggle Button Functionality**
**Objective**: Verify toggle button behavior and visual states
**Steps**:
1. Navigate to CSV import review step with processed transactions
2. Verify all valid transactions have toggle buttons in "ON" state (blue background, circle right)
3. Verify invalid transactions have disabled toggle buttons (grayed out)
4. Click individual toggle buttons and verify smooth animation between states
5. Click master toggle button in table header
6. Verify all valid transactions toggle on/off together
7. Verify import button is disabled when no transactions selected
8. Verify import button label shows "Import X Transactions" with correct count

**Expected Result**: Toggle buttons work smoothly with proper visual feedback and state management

### **TC-007: CSV Import Performance and Preview**
**Objective**: Verify import performance improvements and enhanced preview
**Steps**:
1. Upload a large CSV file (100+ transactions)
2. Verify preview shows first 15 lines (not 5)
3. Verify total line count is displayed in preview header
4. Complete column mapping and proceed to review
5. Select all transactions and start import
6. Verify import completes in reasonable time (should be much faster than before)
7. Verify progress indicator updates properly
8. Verify final import results are accurate

**Expected Result**: Large imports complete quickly with enhanced preview functionality

### **TC-008: Bulk Edit Modal Smart Defaults and Reactive Behavior**
**Objective**: Verify bulk edit modal smart defaulting and reactive category dropdown behavior
**Steps**:
1. Navigate to `/transactions` and ensure you have transactions of different types (Income, Expense, Transfer)
2. **Test Smart Defaulting - Same Type**:
   - Select multiple transactions that all have the same type (e.g., all EXPENSE)
   - Click "Bulk Update" button
   - Verify transaction type dropdown defaults to "Expense" (not "Don't change")
   - Verify category dropdown shows "Don't change" option (even though type is defaulted)
   - Verify category dropdown shows only expense categories (no optgroups)
3. **Test Smart Defaulting - Mixed Types**:
   - Select transactions with different types (mix of Income/Expense/Transfer)
   - Click "Bulk Update" button
   - Verify transaction type dropdown defaults to "Don't change"
   - Verify category dropdown shows "Don't change" option
   - Verify category dropdown shows all categories organized by optgroups
4. **Test Reactive Category Dropdown**:
   - Open bulk edit modal with smart default (e.g., "Expense")
   - Manually change transaction type from "Expense" to "Income"
   - Verify "Don't change" option disappears from category dropdown
   - Verify only income categories are shown
   - Change transaction type back to "Don't change"
   - Verify "Don't change" option reappears in category dropdown
5. **Test Apostrophe Display**:
   - Verify all "Don't change" text displays with proper apostrophe (not &apos;)
   - Check both transaction type and category dropdowns
6. **Test State Reset**:
   - Make changes to both dropdowns
   - Click "Cancel" button
   - Reopen modal - verify defaults are recalculated correctly
   - Submit changes successfully - verify next modal opening recalculates defaults

**Expected Result**: Smart defaults work correctly, category dropdown reacts properly to transaction type changes, "Don't change" appears/disappears according to user intent, apostrophes display correctly

### **TC-009: Uncategorized Transaction Filter**
**Objective**: Verify the new "Uncategorized" filter option works correctly
**Steps**:
1. Navigate to `/transactions`
2. Locate the Category filter dropdown (4th dropdown in filters section)
3. Click on Category dropdown and verify "Uncategorized" option appears after "All categories"
4. Verify "Uncategorized" option has no icon (consistent with other category options)
5. Select "Uncategorized" and verify it filters to show only transactions without assigned categories
6. Test combination with other filters (transaction type, date range, account)
7. Verify filter clears correctly when selecting "All categories" again
8. Test with different transaction types to ensure uncategorized filtering works for all types

**Expected Result**: Uncategorized filter works correctly, shows only transactions with null category_id, integrates properly with other filters

### **TC-010: Amount Color Logic Based on Value**
**Objective**: Verify amount colors are determined by actual value, not transaction type
**Steps**:
1. Navigate to `/transactions` and review existing transactions
2. **Test Positive Amounts**:
   - Verify positive amounts show in **green** regardless of transaction type
   - Check positive expense amounts (like refunds) display in green
   - Check positive income amounts display in green
   - Check positive transfer amounts display in green
3. **Test Negative Amounts**:
   - Verify negative amounts show in **red** regardless of transaction type
   - Check negative expense amounts display in red
   - Check negative income amounts (like corrections) display in red
   - Check negative transfer amounts display in red
4. **Test Zero Amounts** (if any):
   - Verify zero amounts have consistent coloring
5. Create test transactions with various amount/type combinations to verify logic

**Expected Result**: All positive amounts display in green, all negative amounts display in red, regardless of transaction type (INCOME/EXPENSE/TRANSFER)

### **TC-011: Improved Transactions Table Layout**
**Objective**: Verify table column spacing and layout improvements
**Steps**:
1. Navigate to `/transactions`
2. **Check Column Spacing**:
   - Verify minimal space between checkbox and date columns (no excessive whitespace)
   - Verify date column width is appropriate for date display (100px)
   - Verify description column takes appropriate space without being too wide
   - Verify category/type column has adequate space for category names (150px)
   - Verify account column displays account names properly (120px)
   - Verify amount column has sufficient space for currency values (100px)
   - Verify actions column is compact but functional (80px)
3. **Test Responsive Behavior**:
   - Test table layout on different screen sizes
   - Verify horizontal scrolling works if needed
   - Check that column proportions remain balanced
4. **Test with Long Content**:
   - Verify long descriptions truncate properly with ellipsis
   - Verify long category names display appropriately
   - Verify long account names don't break layout
5. **Test Sorting Functionality**:
   - Verify column sorting still works properly after layout changes
   - Ensure no columns disappear when sorting by description

**Expected Result**: Table layout is visually balanced with appropriate column widths, no excessive whitespace, proper content handling, and maintained functionality

### **TC-012: Merchant Data Display and Fallback Logic**
**Objective**: Verify merchant data is properly displayed with intelligent fallback logic
**Steps**:
1. Navigate to `/dashboard/trends` or any analytics page showing merchant data
2. **Test Database Merchant Field**:
   - Verify transactions with merchant field populated show the database merchant name
   - Check that merchant names display correctly in tooltips and breakdowns
3. **Test Parsed Merchant Names**:
   - Verify transactions without merchant field fall back to parsed description
   - Check that merchant extraction from transaction descriptions works
4. **Test Unknown Merchant Fallback**:
   - Verify transactions with no merchant data show "Unknown Merchant"
   - Ensure no blank or null merchant names appear in UI
5. **Test API Error Handling**:
   - Verify merchant API endpoints return proper error responses
   - Check that UI gracefully handles merchant API failures

**Expected Result**: Merchant data displays correctly with proper fallback logic, no API errors, graceful handling of missing data

### **TC-013: Test Suite Reliability and Code Quality**
**Objective**: Verify all tests pass and code quality improvements are working
**Steps** (For Developers):
1. Run full test suite: `npm test`
2. Verify all 315 tests pass without failures
3. Check that no TypeScript compilation errors exist
4. Verify date utility functions work consistently across timezone scenarios
5. Confirm removed dead code doesn't cause import errors
6. Test merchant API endpoints directly for proper responses

**Expected Result**: 100% test pass rate (315/315), no TypeScript errors, clean code without dead imports, consistent date handling

---

## 📊 **Test Data Requirements**

### **Account Testing Data**
- **Multiple account types** for icon verification
- **Various account names** to test form validation
- **Different balance amounts** (positive, negative, zero)
- **Mixed colors** to verify color picker functionality

### **Registration Testing Data**
- **Valid email addresses** for registration testing
- **Various financial group names** to test terminology
- **Password combinations** for validation testing

### **Technical Testing Data**
- **Transactions with merchant field populated** in database
- **Transactions without merchant field** (for fallback testing)
- **Transactions with various description formats** (for parsing testing)
- **Mixed transaction data** to test API robustness

### **How to Prepare Test Environment**
1. **Clean Database State**
   - Start with no existing accounts for empty state testing
   - Clear browser localStorage for fresh registration

2. **Test Account Creation**
   - Create accounts of each type to verify icons
   - Test with various balance amounts and dates

3. **Test Data for Technical Fixes**
   - Ensure database has transactions with and without merchant field
   - Create test transactions with various description formats
   - Verify test suite can run successfully

---

## ✅ **QA Checklist**

### **Pre-Testing Setup**
- [ ] Test environment is running v5.1
- [ ] Clean browser session available
- [ ] Browser dev tools ready for console monitoring
- [ ] Mobile device/simulation available

### **Test Case Execution**
- [ ] **TC-001**: Accounts Page Add Account Button - PASS/FAIL
- [ ] **TC-002**: Account Creation Form Fields - PASS/FAIL
- [ ] **TC-003**: Registration Form Changes - PASS/FAIL
- [ ] **TC-004**: Account Icon Consistency - PASS/FAIL
- [ ] **TC-005**: CSV Import Duplicate Detection Override - PASS/FAIL
- [ ] **TC-006**: CSV Import Toggle Button Functionality - PASS/FAIL
- [ ] **TC-007**: CSV Import Performance and Preview - PASS/FAIL
- [ ] **TC-008**: Bulk Edit Modal Smart Defaults and Reactive Behavior - PASS/FAIL
- [ ] **TC-009**: Uncategorized Transaction Filter - PASS/FAIL
- [ ] **TC-010**: Amount Color Logic Based on Value - PASS/FAIL
- [ ] **TC-011**: Improved Transactions Table Layout - PASS/FAIL
- [ ] **TC-012**: Merchant Data Display and Fallback Logic - PASS/FAIL
- [ ] **TC-013**: Test Suite Reliability and Code Quality - PASS/FAIL

### **Quality Checks**
- [ ] No JavaScript errors in console
- [ ] Mobile responsiveness maintained
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari)
- [ ] No regression in existing functionality

---

## 🐛 **Bug Reporting Template**

When issues are found, use this template:

```markdown
## Bug Report #[ID]

**Feature**: Account Management / Registration Form
**Severity**: Critical/High/Medium/Low
**Browser**: Chrome/Firefox/Safari/Mobile
**Device**: Desktop/Mobile/Tablet

**Steps to Reproduce**:
1.
2.
3.

**Expected Result**:

**Actual Result**:

**Screenshots/Video**: [Attach if helpful]

**Console Errors**: [Copy any JavaScript errors]

**Additional Notes**:
```

---

## 📈 **Success Criteria**

### **Functional Requirements**
- ✅ Both Add Account buttons work properly (Dashboard & Accounts pages)
- ✅ Account creation modal opens, functions, and closes correctly
- ✅ All 7 account types supported with correct icons
- ✅ Registration form works without Full Name field
- ✅ "Financial Group" terminology implemented throughout
- ✅ Account icons use Lucide components consistently
- ✅ CSV import duplicate detection works with user override capability
- ✅ Toggle buttons provide intuitive transaction selection control
- ✅ Import performance is significantly improved for large files
- ✅ Enhanced CSV preview shows 15 lines with total count display
- ✅ Bulk edit modal displays proper apostrophes (not HTML entities)
- ✅ Smart defaulting works for both same-type and mixed-type transaction selections
- ✅ Category dropdown reacts correctly to transaction type changes
- ✅ "Don't change" option appears/disappears based on user intent, not just smart defaults
- ✅ Uncategorized filter option works correctly and integrates with other filters
- ✅ Amount colors are based on actual value (positive=green, negative=red) not transaction type
- ✅ Table layout has balanced column spacing with no excessive whitespace
- ✅ Column widths are optimized for content while maintaining functionality
- ✅ Merchant data displays correctly with intelligent fallback logic
- ✅ API endpoints handle merchant data robustly with proper error handling
- ✅ All tests pass consistently (315/315 test suite reliability)
- ✅ TypeScript compilation errors resolved
- ✅ Date handling uses UTC-aware functions consistently
- ✅ Dead code removed without breaking functionality

### **UX Standards**
- ✅ Intuitive user experience with cleaner forms
- ✅ Consistent visual design with professional icons
- ✅ Mobile responsiveness maintained
- ✅ Required field indicators (red asterisks) work properly
- ✅ Empty states show appropriate content and buttons

### **Quality Standards**
- ✅ Zero JavaScript errors
- ✅ Form validation works correctly
- ✅ No regression in existing functionality
- ✅ Cross-component consistency maintained

---

## 🔄 **QA Sign-off Process**

### **Testing Phases**
1. **Account Management Testing** - Complete all Add Account and form functionality tests
2. **Registration Form Testing** - Verify all form changes and terminology updates
3. **Integration Testing** - Verify no regressions in related features
4. **Cross-browser Testing** - Test on Chrome, Firefox, Safari
5. **Mobile Testing** - Verify responsive behavior

### **Sign-off Requirements**
- [ ] All 13 test cases pass
- [ ] Both Add Account buttons work properly
- [ ] Account icons are consistent (no emojis)
- [ ] Registration form changes implemented correctly
- [ ] CSV import duplicate override functionality works
- [ ] Toggle buttons provide smooth user experience
- [ ] Bulk edit modal smart defaults work correctly
- [ ] Category dropdown reacts properly to transaction type changes
- [ ] Uncategorized filter works and integrates with other filters
- [ ] Amount coloring based on value (not transaction type) works correctly
- [ ] Table layout improvements provide better visual balance
- [ ] Import performance improvements verified
- [ ] Merchant data displays correctly with proper fallback logic
- [ ] All tests pass (315/315) with no TypeScript errors
- [ ] API endpoints handle merchant data robustly
- [ ] No critical or high-severity bugs
- [ ] Mobile responsiveness verified
- [ ] Cross-browser compatibility confirmed

**QA Lead**: ________________
**Test Completion Date**: ________________
**Release Approval**: ✅ APPROVED / ❌ BLOCKED

---

## 📚 **Related Documentation**

- [Account Management Planning](../../features/account-management/planning.md) - Original account feature documentation
- [Account Management Implementation](../../features/account-management/implementation.md) - Technical implementation details
- [Authentication System Planning](../../features/authentication-system/planning.md) - Registration system documentation
- [Feature Backlog](../../FEATURE_BACKLOG.md) - Overall project status
- [UI Guidelines](../../development/UI_GUIDELINES.md) - Design system and component standards

---

*This QA guide focuses specifically on the v5.1 UI/UX enhancements for account management and registration. For testing other features, refer to their respective QA documentation.*
