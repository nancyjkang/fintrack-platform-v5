# Feature: Category Management

**Created**: 2025-09-15
**Started**: 2025-09-15
**Completed**: 2025-09-15 17:45
**Priority**: High
**Status**: ✅ **COMPLETE**

---

## 🎯 **Goal**
Implement a complete Category Management system that allows users to create, organize, and manage transaction categories. This is a foundational feature that's blocking Transaction CRUD functionality - users need categories to properly categorize their transactions.

## 👥 **User Impact**
Users will be able to organize their financial transactions into meaningful categories, making it easier to track spending patterns, create budgets, and generate financial reports. Without categories, transactions are just unorganized data.

**User Story**: As a fintrack user, I want to create and manage custom categories so that I can organize my transactions and better understand my spending patterns.

---

## 📊 **Scope Definition**

### **✅ Must Have (Core Functionality)**
- [x] Create new categories with name, type (INCOME/EXPENSE), and color
- [x] List all categories with tab navigation by type (ALL/INCOME/EXPENSE/TRANSFER)
- [x] Edit existing categories (name, type, color)
- [x] Delete categories (with validation - no transactions using it)
- [x] Merge categories (combine transactions from source category into target category)
- [x] Category API endpoints for Transaction CRUD integration
- [x] Default categories seeded for new users

### **⚡ Should Have (Important)**
- [ ] Category icons/emojis for better visual organization
- [ ] Bulk category operations (delete multiple, bulk edit)
- [x] Category usage statistics (how many transactions use each)
- [ ] Category archiving (soft delete instead of hard delete)

### **💡 Nice to Have (If Time Permits)**
- [ ] Category groups/subcategories (hierarchical structure)
- [ ] Import/export categories
- [ ] Category templates for common use cases
- [ ] Category spending limits/budgets integration

### **❌ Out of Scope (For This Version)**
- Advanced budgeting features (separate feature)
- Category analytics and reporting (separate feature)
- Category sharing between users (future multi-user feature)

---

## 🔗 **Dependencies**

### **Prerequisites (Must be done first)**
- [x] Database Schema - Category model already exists in Prisma schema
- [x] Authentication System - JWT auth is working
- [x] Service Layer Architecture - Pattern established for other features
- [ ] Category Service - Need to implement category.service.ts

### **Dependent Features (Blocked by this)**
- **Transaction CRUD** - Cannot complete without category dropdown/selection
- **Transaction Filters** - Categories dropdown is currently empty
- **Financial Reports** - Need categories for meaningful expense categorization
- **Budgeting Features** - Future feature will depend on category structure

---

## 🛠️ **Technical Approach**

### **Database Changes**
- [x] Category table already exists in Prisma schema
- [x] Fields: id, name, type (INCOME/EXPENSE), color, tenant_id, created_at, updated_at
- [ ] Migration required: No - schema already supports categories
- [ ] Seed data: Add default categories for new users

### **API Endpoints Needed**
- [ ] `GET /api/categories` - List all categories for current user/tenant
- [ ] `POST /api/categories` - Create new category
- [ ] `PUT /api/categories/[id]` - Update existing category
- [ ] `DELETE /api/categories/[id]` - Delete category (with validation)
- [ ] `POST /api/categories/merge` - Merge categories (move transactions from source to target)
- [ ] `GET /api/categories/usage` - Get usage statistics for all categories

### **Business Rules & Validation**
- **Category Deletion**: Categories can only be deleted if they have 0 transactions
  - Delete button should be disabled/grayed out for categories with transactions
  - API should return error if attempting to delete category with transactions
  - User should see clear messaging about why deletion is not allowed
- **Category Merging**: Categories can only be merged within the same type
  - Merge button should be disabled/grayed out for categories with 0 transactions
  - Source and target categories must be the same type (INCOME/EXPENSE/TRANSFER)
  - All transactions from source category will be moved to target category
  - Source category will be deleted after successful merge
  - User should see clear preview of what will happen before confirming
- **Category Names**: Must be unique within the same type (INCOME/EXPENSE/TRANSFER) per tenant
- **Category Colors**: Should be valid hex color codes
- **Category Types**: Must be one of: INCOME, EXPENSE, TRANSFER

### **UI Components**
- [ ] `CategoriesPage` - Main page component (/categories route)
- [ ] `CategoriesList` - Display categories in table/grid format
- [ ] `CategoryForm` - Create/edit category form (modal or inline)
- [ ] `CategoryCard` - Individual category display component
- [ ] `DeleteCategoryDialog` - Confirmation dialog for deletion
- [ ] `CategoryMergeModal` - Modal for merging categories with preview and confirmation
- [ ] `CategoryColorPicker` - Color selection component

### **Third-party Integrations**
- None required - using existing UI components and patterns

---

## 🎨 **UI Specification (Based on v4.1)**

### **Page Layout & Structure**
- **URL**: `/settings/categories` (matches v4.1 structure)
- **Page Title**: "Categories List"
- **Subtitle**: "Manage your transaction categories"
- **Background**: Light gray background with generous padding
- **Container**: Centered content with maximum width, responsive padding on sides

### **Header Section**
- **Layout**: Title/subtitle on left, action button on right
- **Left Side**: Large bold title with smaller gray subtitle below
- **Right Side**: Blue "Add Category" button with plus icon
- **Button Appearance**:
  - Blue background with white text
  - Rounded corners
  - Darker blue when hovered
  - Plus icon on the left side of text

### **Tab Navigation**
- **Three Tabs**: Income, Expense, Transfer
- **Display Format**: Shows tab name with count in parentheses (e.g., "Income (5)")
- **Active Tab**:
  - Blue text color
  - Blue underline at bottom
  - Stands out from other tabs
- **Inactive Tabs**:
  - Gray text color
  - No underline
  - Slightly darker gray when hovered
- **Layout**: Horizontal row of tabs with thin gray line underneath

### **Category Cards Grid**
- **Layout**: Responsive grid that adapts to screen size
  - **Mobile**: Single column (stacked vertically)
  - **Tablet**: Two columns side by side
  - **Desktop**: Three columns side by side
- **Spacing**: Even gaps between all cards
- **Card Appearance**:
  - White background
  - Light gray border
  - Rounded corners
  - Subtle shadow
  - Blue border and stronger shadow when hovered

### **Individual Category Card**
- **Left Section**:
  - **Icon Box**: Square colored box (48x48 pixels) with white icon inside
    - Color matches the category type (green/red/purple)
    - Contains relevant icon (trending up/down/transfer arrows)
  - **Category Info**:
    - Category name in large, bold text
    - Transaction count in smaller gray text below ("5 transactions")
- **Right Section**: Three action buttons in a row
  - **Edit Button**: Pencil icon, gray color, darker when hovered
  - **Merge Button**: Merge icon, orange when hovered, grayed out if no transactions
  - **Delete Button**: Trash icon, red when hovered, grayed out if category has transactions
- **Overall Layout**: Icon and info take up most space, buttons are compact on the right

### **Category Form Modal (Add/Edit)**
- **Overlay**: Dark semi-transparent background covering entire screen
- **Modal Box**:
  - White background
  - Centered on screen
  - Medium width (not too wide)
  - Rounded corners with shadow
- **Header**:
  - Title ("Add New Category" or "Edit Category")
  - X close button on the right
  - Thin gray line below header
- **Form Fields**:
  1. **Category Name**:
     - Text input box
     - Required (marked with red asterisk)
     - Full width
  2. **Category Type**:
     - Dropdown menu
     - Options: Income, Expense, Transfer
     - Required (marked with red asterisk)
     - Changes default color when selected
  3. **Color Picker**:
     - Small square color input
     - Shows current color
     - Text explanation next to it
- **Footer**:
  - Two buttons side by side
  - Cancel button (gray with border)
  - Save button (blue background, white text)
  - Save button shows "Saving..." when processing

### **Category Merge Modal**
- **Size**: Wider than the form modal to accommodate more content
- **Warning Section**:
  - Light blue background box
  - Warning icon
  - Bullet points explaining what will happen
- **Category Selection**:
  - **Source Category**: Read-only field showing selected category
  - **Target Category**: Dropdown to choose destination
  - Side-by-side layout on larger screens
- **Preview Section**:
  - Shows "Category A → Category B" with arrow
  - Displays how many transactions will be moved
- **Result Section**:
  - Green success message with checkmark icon
  - Red error message with warning icon
  - Only appears after merge attempt
- **Footer**:
  - Cancel button (gray)
  - "Merge Categories" button (red background to indicate destructive action)

### **Empty State**
- **Visual**: Large folder emoji (📁) as the main graphic
- **Title**: "No [Income/Expense/Transfer] categories found"
- **Description**: Friendly message encouraging user to add their first category
- **Layout**: Everything centered vertically and horizontally
- **Spacing**: Generous padding around all elements

### **Color Scheme & Visual Elements**
- **Income Categories**:
  - Green color (#10B981 - a vibrant green)
  - Upward trending arrow icon
- **Expense Categories**:
  - Red color (#EF4444 - a clear red)
  - Downward trending arrow icon
- **Transfer Categories**:
  - Purple color (#8B5CF6 - a medium purple)
  - Left-right arrow icon
- **Interactive Elements**:
  - Primary buttons: Blue background
  - Destructive actions: Red background
  - Secondary buttons: Gray border with white background

### **Responsive Design**
- **Mobile Phones**:
  - Single column layout
  - Larger touch targets for buttons
  - Full-width modals with mobile-friendly spacing
- **Tablets**:
  - Two-column grid for categories
  - Modals remain centered with appropriate margins
- **Desktop**:
  - Three-column grid for optimal space usage
  - Hover effects work properly with mouse interaction

### **Interactive States**
- **Loading**:
  - Spinning circle animation
  - "Loading..." text below
  - Centered on page
- **Error States**:
  - Red text for error messages
  - Clear, helpful error descriptions
- **Button States**:
  - Normal, hovered, pressed, and disabled appearances
  - Loading buttons show "Saving..." or "Merging..." text
  - Disabled buttons are grayed out and non-clickable

---

## ⏱️ **Estimates**

### **Complexity Assessment**
- **Overall Complexity**: Low/Medium/High
- **Database Work**: [X hours] - [Reason]
- **API Development**: [X hours] - [Reason]
- **UI Development**: [X hours] - [Reason]
- **Testing & Polish**: [X hours] - [Reason]

### **Time Estimate**
- **Total Estimate**: [X days]
- **Buffer (20%)**: [X days]
- **Final Estimate**: [X days]

### **Risk Assessment**
- **Risk Level**: Low/Medium/High
- **Main Risks**:
  - [Risk 1]: [Impact and mitigation plan]
  - [Risk 2]: [Impact and mitigation plan]

---

## ✅ **Success Criteria**

### **Functional Requirements**
- [ ] User can [specific action 1]
- [ ] User can [specific action 2]
- [ ] [Specific behavior] works correctly
- [ ] Error handling works for [scenario]

### **Performance Requirements**
- [ ] Page loads in < [X] seconds
- [ ] Handles [X] records without performance issues
- [ ] Works on mobile devices

### **Quality Requirements**
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No accessibility issues
- [ ] Responsive design works

---

## 🧪 **Testing Strategy**

### **Unit Tests**
- [ ] [Component/Function] - [What to test]
- [ ] [API endpoint] - [What to test]

### **Integration Tests**
- [ ] [Workflow] - [End-to-end scenario]
- [ ] [API integration] - [Data flow test]

### **Manual Testing**
- [ ] [User workflow 1] - [Steps to test]
- [ ] [User workflow 2] - [Steps to test]
- [ ] [Edge case] - [How to test]

---

## 📋 **Implementation Plan**

### **Phase 1: Foundation** ([X] days)
- [ ] Database schema updates
- [ ] Basic API endpoints
- [ ] Core data models

### **Phase 2: Core Features** ([X] days)
- [ ] Main UI components
- [ ] API integration
- [ ] Basic functionality working

### **Phase 3: Polish & Testing** ([X] days)
- [ ] Error handling
- [ ] Loading states
- [ ] Testing and bug fixes
- [ ] Performance optimization

---

## 📊 **Metrics & Monitoring**

### **Success Metrics**
- [Metric 1]: [How to measure]
- [Metric 2]: [How to measure]

### **Monitoring**
- [ ] Error tracking set up
- [ ] Performance monitoring
- [ ] User behavior tracking (if applicable)

---

## 📝 **Notes & Decisions**

### **Technical Decisions**
- [Decision 1]: [Rationale]
- [Decision 2]: [Rationale]

### **Open Questions**
- [Question 1]: [Context and options]
- [Question 2]: [Context and options]

### **Assumptions**
- [Assumption 1]: [Impact if wrong]
- [Assumption 2]: [Impact if wrong]

---

## 🔄 **Review & Approval**

### **Planning Review Checklist**
- [ ] Goal is clear and valuable
- [ ] Scope is well-defined
- [ ] Dependencies are identified
- [ ] Estimates seem reasonable
- [ ] Success criteria are testable
- [ ] Risks are identified with mitigation plans

### **Approval**
- [ ] **Planning Approved**: [Date] - Ready to start development
- [ ] **Priority Confirmed**: [High/Medium/Low] - [Rationale]

---

*Copy this template for each new feature and fill it out completely before starting development.*
