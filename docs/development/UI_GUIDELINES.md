# FinTrack v4.1 UI Guidelines & Design System

This document outlines the design system, components, and styling guidelines for FinTrack v4.1 to ensure consistency across all interfaces.

## 🎯 Core Design Principles

- **Consistency**: All components follow the same visual patterns and behaviors
- **Accessibility**: WCAG 2.1 AA compliance with proper contrast and focus states
- **Performance**: Lightweight, efficient styling without unnecessary frameworks
- **Maintainability**: Clear, semantic class names and organized CSS structure

## 🎨 Design Tokens

### Colors

#### Transaction Types
```css
/* Income - Green palette */
--income-bg: #ecfdf5;     /* Light green background */
--income-text: #059669;   /* Green text */
--income-border: #10b981; /* Green border */

/* Expense - Red palette */
--expense-bg: #fef2f2;    /* Light red background */
--expense-text: #dc2626;  /* Red text */
--expense-border: #ef4444; /* Red border */

/* Transfer - Blue palette */
--transfer-bg: #eff6ff;   /* Light blue background */
--transfer-text: #2563eb; /* Blue text */
--transfer-border: #3b82f6; /* Blue border */
```

#### Status Colors
```css
/* Success states */
--success-50: #ecfdf5;
--success-500: #10b981;
--success-600: #059669;

/* Warning states */
--warning-50: #fffbeb;
--warning-500: #f59e0b;
--warning-600: #d97706;

/* Error states */
--error-50: #fef2f2;
--error-500: #ef4444;
--error-600: #dc2626;
```

#### Neutral Colors
```css
/* Gray scale */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-400: #9ca3af;
--gray-500: #6b7280;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #111827;
```

## 🔧 Icon System

### Icon Library
**Primary**: [Lucide React](https://lucide.dev/) - Consistent, lightweight SVG icons

### Transaction Type Icons
```tsx
import { TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';

const typeIcons = {
  INCOME: TrendingUp,     // ↗️ Trending up arrow
  EXPENSE: TrendingDown,  // ↘️ Trending down arrow
  TRANSFER: ArrowLeftRight, // ↔️ Bidirectional arrow
};
```

### Common UI Icons
```tsx
import {
  Edit,           // ✏️ Edit/modify actions
  Trash2,         // 🗑️ Delete actions
  Plus,           // ➕ Add/create actions
  Search,         // 🔍 Search functionality
  Calendar,       // 📅 Date-related
  Building,       // 🏢 Account-related
  Tag,            // 🏷️ Category-related
  FileText,       // 📄 Document/report actions
  RotateCcw,      // 🔄 Reset/refresh actions
  MoreHorizontal  // ⋯ More options menu
} from 'lucide-react';
```

### Icon Usage Guidelines

#### ✅ DO: Use Consistent Icons
```tsx
// Transaction type display
<div className="flex items-center gap-1">
  <TrendingUp className="h-4 w-4 text-green-600" />
  <span>INCOME</span>
</div>
```

#### ❌ DON'T: Mix Icon Styles
```tsx
// Don't mix emojis with Lucide icons
<div className="flex items-center gap-1">
  💰 {/* Emoji - inconsistent */}
  <span>INCOME</span>
</div>
```

#### Icon Sizing Standards
```css
/* Standard icon sizes */
.icon-sm { width: 16px; height: 16px; }  /* h-4 w-4 */
.icon-md { width: 20px; height: 20px; }  /* h-5 w-5 */
.icon-lg { width: 24px; height: 24px; }  /* h-6 w-6 */
```

## 🧩 Component Patterns

### Transaction Type Indicators

#### Badge Style
```tsx
<span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
  transaction.type === 'INCOME' ? 'bg-green-100 text-green-800' :
  transaction.type === 'EXPENSE' ? 'bg-red-100 text-red-800' :
  'bg-blue-100 text-blue-800'
}`}>
  {transaction.type}
</span>
```

#### Icon + Text Style
```tsx
<div className="flex items-center gap-1">
  {transaction.type === 'INCOME' && <TrendingUp className="h-4 w-4 text-green-600" />}
  {transaction.type === 'EXPENSE' && <TrendingDown className="h-4 w-4 text-red-600" />}
  {transaction.type === 'TRANSFER' && <ArrowLeftRight className="h-4 w-4 text-blue-600" />}
  <span className={`font-medium ${
    transaction.type === 'INCOME' ? 'text-green-600' :
    transaction.type === 'EXPENSE' ? 'text-red-600' :
    'text-blue-600'
  }`}>
    {transaction.type}
  </span>
</div>
```

### Form Controls

#### Dropdown/Select Styling
```css
.select-field {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--gray-300);
  border-radius: 0.375rem;
  font-size: 1rem;
  color: var(--gray-900);
  background-color: white;
  transition: all 0.2s ease;
}

.select-field:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

#### Button Variants
```css
/* Primary button */
.btn-primary {
  background-color: #3b82f6;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: #2563eb;
}

/* Secondary button */
.btn-secondary {
  background-color: white;
  color: var(--gray-700);
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  border: 1px solid var(--gray-300);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: var(--gray-50);
  border-color: var(--gray-400);
}
```

### Modal/Dialog Patterns

#### Standard Modal Structure
```tsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
    <div className="p-6">
      <h3 className="text-lg font-medium mb-4">Modal Title</h3>
      {/* Modal content */}
      <div className="flex justify-end space-x-3 mt-6">
        <button className="btn-secondary">Cancel</button>
        <button className="btn-primary">Confirm</button>
      </div>
    </div>
  </div>
</div>
```

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile first approach */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

### Grid Layouts
```css
/* Responsive grid */
.grid-responsive {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .grid-responsive {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid-responsive {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

## 🎯 Usage Guidelines

### 1. Icon Consistency
- **Always use Lucide React icons** for UI elements
- **Never mix emoji with Lucide icons** in the same interface
- **Use consistent sizing** (h-4 w-4 for small, h-5 w-5 for medium, h-6 w-6 for large)
- **Apply semantic colors** (green for income, red for expense, blue for transfer)

### 2. Transaction Type Display
```tsx
// ✅ DO: Consistent icon usage
const TypeIcon = typeIcons[transaction.type];
<TypeIcon className="h-4 w-4 text-green-600" />

// ❌ DON'T: Mixed icon styles
<span>💰 INCOME</span> {/* Emoji */}
<TrendingDown className="h-4 w-4" /> {/* Lucide */}
```

### 3. Color Application
```tsx
// ✅ DO: Semantic color usage
<span className={`text-${transaction.type === 'INCOME' ? 'green' : 'red'}-600`}>
  {formatAmount(transaction.amount)}
</span>

// ❌ DON'T: Arbitrary colors
<span className="text-purple-600">
  {formatAmount(transaction.amount)}
</span>
```

### 4. Form Control Styling
```tsx
// ✅ DO: Consistent form styling
<select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
  <option value="">Select option</option>
</select>

// ❌ DON'T: Inconsistent styling
<select style={{padding: '10px', border: '1px solid #ccc'}}>
  <option value="">Select option</option>
</select>
```

## 📋 Component Checklist

Before implementing any UI component, ensure:

- [ ] Uses Lucide React icons consistently
- [ ] Follows established color patterns for transaction types
- [ ] Implements proper hover and focus states
- [ ] Uses semantic HTML elements
- [ ] Includes proper TypeScript interfaces
- [ ] Follows responsive design principles
- [ ] Maintains accessibility standards (WCAG 2.1 AA)
- [ ] Uses consistent spacing and typography
- [ ] Implements proper loading and error states

## 🚀 Quick Reference

### Transaction Type Colors & Icons
| Type | Icon | Background | Text | Border |
|------|------|------------|------|--------|
| INCOME | `TrendingUp` | `bg-green-100` | `text-green-800` | `border-green-400` |
| EXPENSE | `TrendingDown` | `bg-red-100` | `text-red-800` | `border-red-400` |
| TRANSFER | `ArrowLeftRight` | `bg-blue-100` | `text-blue-800` | `border-blue-400` |

### Common Icon Mappings
| Action | Icon | Usage |
|--------|------|-------|
| Edit | `Edit` | Modify/update actions |
| Delete | `Trash2` | Remove/delete actions |
| Add | `Plus` | Create/add actions |
| Search | `Search` | Search functionality |
| Reset | `RotateCcw` | Reset/refresh actions |
| More | `MoreHorizontal` | Additional options |

---

*This document should be referenced for all UI development in FinTrack v4.1. Consistency in these patterns ensures a professional, cohesive user experience.*
