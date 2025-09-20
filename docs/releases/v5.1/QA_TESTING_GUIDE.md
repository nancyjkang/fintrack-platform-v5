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

### **Category Trend Analysis Features (v5.1.2)**
19. **Interactive Stacked Bar Chart**: Added visual category breakdown by time period with custom database colors using Recharts
20. **Custom Category Colors**: Chart and visualizations now use actual database category colors for consistency across the application
21. **Enhanced Trends Table**: Implemented per-cell gradient backgrounds based on relative amounts within each column
22. **Average Column**: Replaced "Recurring %" with meaningful "Average" showing average amount per period
23. **Visual Separators**: Added subtle borders between Category, Average, and period columns for better organization
24. **Improved Typography**: Increased font sizes for chart axes and legend to 14px for better readability
25. **Consistent Branding**: Updated page title and navigation from "Financial Trends" to "Category Trend"
26. **Streamlined Navigation**: Removed redundant menu items ("Add Transaction", "Category Analysis") for cleaner UX
27. **Default Categories Migration**: Eliminated NULL category handling by implementing "Uncategorized Income/Expense/Transfer" categories
28. **UTC Date Handling**: Fixed timezone issues in cube data aggregation for accurate monthly/period calculations
29. **CSV Data Export**: Added "Export Data" button with comprehensive CSV export including metadata headers and summary data

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

### **4. Category Trend Analysis**

**QA Priority**: 🔴 **HIGH** - Major new feature with visualization components

**Test Areas**:
- Interactive stacked bar chart functionality and visual accuracy
- Custom category color consistency across chart and table
- Gradient background calculations and visual effects
- Filter functionality and data accuracy
- Merchant tooltip integration and hover behavior
- Navigation and branding consistency
- Performance with large datasets

**Estimated Testing Time**: 3-4 hours

**Prerequisites**:
- Transactions with various categories and custom colors
- Data spanning multiple time periods (monthly/quarterly)
- Mix of income, expense, and transfer transactions
- Merchant data for tooltip testing

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

### **TC-014: Category Trend Page Navigation and Branding**
**Objective**: Verify consistent branding and navigation updates
**Steps**:
1. Navigate to main navigation menu
2. Verify "Reports" submenu shows "Category Trend" (not "Financial Trends")
3. Verify "Add Transaction" is not present in Transactions submenu
4. Verify "Category Analysis" is not present in Reports submenu
5. Click "Category Trend" and verify navigation to `/dashboard/trends`
6. Verify page title shows "Category Trend" (not "Financial Trends Analysis")
7. Verify page description mentions category trends appropriately

**Expected Result**: All branding updated consistently, navigation streamlined, no old terminology remains

### **TC-015: Category Trend Filters and Data Loading**
**Objective**: Verify filter functionality and data accuracy
**Steps**:
1. Navigate to `/dashboard/trends`
2. **Test Default State**:
   - Verify default filters are set (last 6 months, monthly periods, expense transactions)
   - Verify data loads automatically with default filters
   - Check that both chart and table display data
3. **Test Period Type Filters**:
   - Change period type to "Weekly", "Monthly", "Quarterly", "Annually"
   - Verify chart X-axis labels update correctly for each period type
   - Verify table columns update to show appropriate time periods
4. **Test Transaction Type Filters**:
   - Switch between "Income", "Expense", "Transfer"
   - Verify data updates correctly for each type
   - Check that expense amounts show as positive in chart (amount * -1)
5. **Test Date Range Filters**:
   - Modify start and end dates
   - Verify data updates to show only transactions within selected range
   - Test edge cases (single month, year boundaries)
6. **Test Account and Category Filters**:
   - Select specific accounts and verify filtering works
   - Select specific categories and verify filtering works
   - Test "All" options to ensure they show complete data

**Expected Result**: All filters work correctly, data updates accurately, no loading errors, proper date handling

### **TC-016: Interactive Stacked Bar Chart**
**Objective**: Verify stacked bar chart functionality and visual accuracy
**Steps**:
1. Navigate to `/dashboard/trends` with expense data
2. **Test Chart Rendering**:
   - Verify chart displays above the detailed table
   - Check that chart shows one bar per time period
   - Verify bars are stacked by category with different colors
3. **Test Custom Category Colors**:
   - Compare chart colors with category colors in detailed table
   - Verify colors match the database category colors exactly
   - Check that legend shows correct category names with matching colors
4. **Test Chart Interactivity**:
   - Hover over chart segments and verify tooltips appear
   - Check tooltip content shows category name and amount
   - Verify legend is clickable (if implemented) or displays correctly
5. **Test Data Accuracy**:
   - Compare chart data with detailed table data
   - Verify amounts match between chart and table
   - Check that expense amounts are displayed as positive in chart
6. **Test Typography and Styling**:
   - Verify X-axis labels are readable (14px font)
   - Verify Y-axis labels are readable (14px font)
   - Verify legend text is dark and readable (#1f2937 color)
   - Check that chart is responsive on different screen sizes

**Expected Result**: Chart renders correctly with accurate data, custom colors match database, typography is readable, responsive design works

### **TC-017: Enhanced Trends Table with Gradients**
**Objective**: Verify table enhancements including gradients and average column
**Steps**:
1. Navigate to `/dashboard/trends` with varied transaction data
2. **Test Table Structure**:
   - Verify table shows: Category | Total Amount | Average | Period Columns
   - Check that "Recurring %" column is replaced with "Average"
   - Verify "Average" shows average amount per period for each category
3. **Test Gradient Backgrounds**:
   - Verify each cell has gradient background based on relative amount within that column
   - Check that higher amounts have more intense gradients
   - Verify gradients are calculated per-column (not per-row)
   - Test that Total Amount and Average columns have separate gradient calculations
4. **Test Visual Separators**:
   - Verify subtle border between Category and Total Amount columns
   - Verify subtle border between Average and first period column
   - Check that borders enhance readability without being distracting
5. **Test Data Accuracy**:
   - Verify Total Amount sums all periods correctly for each category
   - Verify Average calculates correctly (total ÷ number of periods with data)
   - Check that period columns show correct amounts for each time period
6. **Test Sorting and Interaction**:
   - Verify table can be sorted by different columns
   - Check that gradients recalculate after sorting
   - Test that merchant tooltips still work (covered in TC-018)

**Expected Result**: Table displays enhanced layout with accurate gradients, average calculations correct, visual separators improve readability

### **TC-018: Merchant Tooltip Integration**
**Objective**: Verify merchant tooltips work correctly in enhanced table
**Steps**:
1. Navigate to `/dashboard/trends` with merchant data
2. **Test Tooltip Activation**:
   - Hover over amount cells in period columns
   - Verify tooltips appear after brief delay
   - Check that tooltips show merchant breakdown for that category/period
3. **Test Tooltip Content**:
   - Verify tooltip shows format: "Merchant Name: $Amount (X transactions)"
   - Check that multiple merchants are listed when applicable
   - Verify amounts sum to the cell amount being hovered
   - Test that "Unknown Merchant" appears for transactions without merchant data
4. **Test Tooltip Behavior**:
   - Verify tooltips disappear when mouse leaves cell
   - Check that tooltips don't interfere with gradient backgrounds
   - Test tooltip positioning (doesn't go off-screen)
5. **Test with Different Data**:
   - Test cells with single merchant vs multiple merchants
   - Test cells with no merchant data
   - Test cells with parsed merchant names vs database merchant names
6. **Test Performance**:
   - Verify tooltips load quickly without API delays
   - Check that hovering multiple cells rapidly doesn't cause issues

**Expected Result**: Tooltips display accurate merchant data, work smoothly with enhanced table, no performance issues

### **TC-019: Default Categories and Data Integrity**
**Objective**: Verify default categories migration and NULL elimination
**Steps**:
1. Navigate to `/dashboard/trends`
2. **Test Default Categories Display**:
   - Verify "Uncategorized Income", "Uncategorized Expense", "Uncategorized Transfer" appear as regular categories
   - Check that these categories have appropriate colors assigned
   - Verify they appear in category filter dropdowns
3. **Test Data Consistency**:
   - Verify no NULL category handling in UI (all transactions have categories)
   - Check that uncategorized transactions show under appropriate default category
   - Test filtering by uncategorized categories works like any other category
4. **Test Chart Integration**:
   - Verify default categories appear in stacked bar chart with colors
   - Check that chart legend includes default categories
   - Test that default categories can be filtered like regular categories
5. **Test Cross-Component Consistency**:
   - Navigate to `/transactions` and verify default categories appear there too
   - Check that category colors are consistent across all components
   - Verify bulk edit and other category operations work with default categories

**Expected Result**: Default categories work seamlessly as regular categories, no NULL handling visible to users, consistent across all components

### **TC-020: Performance and Data Handling**
**Objective**: Verify performance with large datasets and edge cases
**Steps**:
1. **Test with Large Datasets**:
   - Load trends page with 1000+ transactions across multiple categories
   - Verify chart renders within reasonable time (< 3 seconds)
   - Check that table loads and gradients calculate efficiently
   - Test that filter changes respond quickly
2. **Test Edge Cases**:
   - Test with single category (chart should still render)
   - Test with single time period (table should handle gracefully)
   - Test with no data (appropriate empty state should display)
   - Test with very large amounts (formatting should handle properly)
3. **Test Date Boundary Cases**:
   - Test month boundaries (ensure transactions on 1st/31st are included correctly)
   - Test year boundaries and leap years
   - Verify timezone handling doesn't cause date shifts
4. **Test Memory and Browser Performance**:
   - Monitor browser memory usage during extended use
   - Check for memory leaks when changing filters repeatedly
   - Verify no console errors during normal operation
5. **Test API Response Handling**:
   - Verify graceful handling of API timeouts
   - Check error states display appropriately
   - Test retry mechanisms if implemented

**Expected Result**: Good performance with large datasets, graceful handling of edge cases, no memory leaks or console errors

### **TC-021: CSV Data Export Functionality**
**Objective**: Verify CSV export button works correctly with proper metadata and data formatting
**Steps**:
1. Navigate to `/dashboard/trends` with varied transaction data
2. **Test Export Button Visibility**:
   - Verify "Export Data" button appears to the right of "Detailed Trends Data" title
   - Check button has download icon and proper styling
   - Verify button is enabled when data is present
3. **Test Basic Export Functionality**:
   - Click "Export Data" button
   - Verify file download starts immediately
   - Check filename format: `category-trends-YYYYMMDD-to-YYYYMMDD.csv`
   - Verify file downloads successfully to browser's download folder
4. **Test CSV Content Structure**:
   - Open downloaded CSV file in text editor or Excel
   - Verify metadata header includes:
     - Export date and time
     - Transaction type (Income/Expense/Transfer)
     - Breakdown period (Weekly/Monthly/etc.)
     - Date range (start to end dates)
     - Account name (or "All Accounts" if no filter)
   - Check that metadata lines start with `#` for proper CSV commenting
5. **Test Data Accuracy**:
   - Verify CSV headers match table: Category, Total Amount, Average, [Period Columns]
   - Compare CSV data with displayed table data for accuracy
   - Check currency formatting includes $ symbol and proper decimal places
   - Verify period column headers match table display exactly
6. **Test with Different Filters**:
   - Change transaction type to "Income" and export
   - Change period type to "Quarterly" and export
   - Apply account filter and verify account name appears in metadata
   - Apply category filter and verify data reflects filtering
7. **Test Edge Cases**:
   - Test export with single category
   - Test export with no data (should handle gracefully)
   - Test export with very large amounts (formatting should work)
   - Test export with special characters in category names
8. **Test Account Name Resolution**:
   - Apply account filter and verify correct account name in export
   - Test with account that might not exist (should fallback gracefully)
   - Verify "All Accounts" appears when no account filter applied

**Expected Result**: CSV export works reliably, includes comprehensive metadata, data matches table exactly, proper formatting for Excel compatibility, graceful error handling

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

### **Category Trend Testing Data**
- **Categories with custom colors** assigned in database
- **Transactions spanning multiple months/quarters** for time series testing
- **Mix of Income, Expense, Transfer transactions** across different categories
- **Various transaction amounts** (small, medium, large) for gradient testing
- **Multiple merchants per category/period** for tooltip testing
- **Default categories** ("Uncategorized Income/Expense/Transfer") with transactions
- **Large dataset** (1000+ transactions) for performance testing
- **Edge cases**: single category, single period, no data scenarios

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
- [ ] **TC-014**: Category Trend Page Navigation and Branding - PASS/FAIL
- [ ] **TC-015**: Category Trend Filters and Data Loading - PASS/FAIL
- [ ] **TC-016**: Interactive Stacked Bar Chart - PASS/FAIL
- [ ] **TC-017**: Enhanced Trends Table with Gradients - PASS/FAIL
- [ ] **TC-018**: Merchant Tooltip Integration - PASS/FAIL
- [ ] **TC-019**: Default Categories and Data Integrity - PASS/FAIL
- [ ] **TC-020**: Performance and Data Handling - PASS/FAIL
- [ ] **TC-021**: CSV Data Export Functionality - PASS/FAIL

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
- ✅ Category Trend page displays with updated branding and navigation
- ✅ Interactive stacked bar chart renders with custom database category colors
- ✅ Enhanced trends table shows gradient backgrounds and average column
- ✅ Merchant tooltips integrate seamlessly with enhanced table design
- ✅ Default categories work as regular categories without NULL handling
- ✅ Filter functionality works accurately with proper date handling
- ✅ Chart and table data consistency maintained across all views
- ✅ Performance remains good with large datasets (1000+ transactions)
- ✅ Typography improvements enhance readability (14px fonts, dark legend)
- ✅ Visual separators improve table organization and readability
- ✅ CSV export functionality works with comprehensive metadata headers
- ✅ Export data matches table data exactly with proper currency formatting
- ✅ Account name resolution works correctly in export metadata
- ✅ Export filename includes date range for easy identification

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
- [ ] All 21 test cases pass
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
- [ ] **Category Trend navigation and branding updated consistently**
- [ ] **Interactive stacked bar chart renders with custom category colors**
- [ ] **Enhanced trends table displays gradients and average column correctly**
- [ ] **Merchant tooltips work seamlessly with enhanced table**
- [ ] **Default categories function as regular categories**
- [ ] **Filter functionality accurate with proper date handling**
- [ ] **Performance good with large datasets (< 3 second load times)**
- [ ] **CSV export functionality works with comprehensive metadata and accurate data**
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
