/**
 * Default Categories and Classifications Configuration
 *
 * This file centralizes all default category and classification definitions
 * used throughout the application for onboarding, seeding, and new tenant setup.
 */

export interface DefaultGroup {
  name: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  color: string;
  description: string;
}

export interface DefaultCategory {
  name: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  color: string;
  icon: string;
  defaultGroup: string; // Links to Group by name
  description?: string;
}

export interface DefaultAccount {
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT' | 'LOAN';
  subtype?: string;
  currency: string;
  description?: string;
  suggestedInitialBalance?: number;
}

/**
 * Default Groups - High-level transaction groupings
 * These provide the foundation for organizing transactions
 */
export const DEFAULT_GROUPS: DefaultGroup[] = [
  // Income Groups
  {
    name: 'Active Income',
    type: 'INCOME',
    color: '#D1FAE5',
    description: 'Salary, Bonus'
  },
  {
    name: 'Passive Income',
    type: 'INCOME',
    color: '#E9D5FF',
    description: 'Interest, Dividends'
  },

  // Expense Groups
  {
    name: 'Needs',
    type: 'EXPENSE',
    color: '#FEE2E2',
    description: ''
  },
  {
    name: 'Wants',
    type: 'EXPENSE',
    color: '#FEF3C7',
    description: ''
  },
  {
    name: 'For Others',
    type: 'EXPENSE',
    color: '#DBEAFE',
    description: ''
  },

  // Transfer Groups
  {
    name: 'Investments',
    type: 'TRANSFER',
    color: '#F3F4F6',
    description: 'Transfers to investment accounts'
  },
  {
    name: 'Internal Transfer',
    type: 'TRANSFER',
    color: '#E5E7EB',
    description: ''
  }
];

/**
 * Default Categories - Specific transaction categories
 * These are linked to classifications and provide granular transaction organization
 */
export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  // Income Categories
  {
    name: 'Salary',
    type: 'INCOME',
    color: '#D1FAE5',
    icon: '💼',
    defaultGroup: 'Active Income',
    description: 'Regular employment salary'
  },
  {
    name: 'Side Hustle',
    type: 'INCOME',
    color: '#E9D5FF',
    icon: '💡',
    defaultGroup: 'Active Income',
    description: 'Freelance and consulting work'
  },
  {
    name: 'Other Income',
    type: 'INCOME',
    color: '#CFFAFE',
    icon: '📋',
    defaultGroup: 'Active Income',
    description: 'Miscellaneous income sources'
  },

  // Expense Categories
  {
    name: 'Bills & Utilities',
    type: 'EXPENSE',
    color: '#FEE2E2',
    icon: '⚡',
    defaultGroup: 'Needs',
    description: 'Electricity, water, internet, and phone bills'
  },
  {
    name: 'Food & Dining',
    type: 'EXPENSE',
    color: '#FEF3C7',
    icon: '🍽️',
    defaultGroup: 'Needs',
    description: 'Restaurants, groceries, and food delivery'
  },
  {
    name: 'Housing',
    type: 'EXPENSE',
    color: '#DBEAFE',
    icon: '🏠',
    defaultGroup: 'Needs',
    description: 'Rent, mortgage, and home-related expenses'
  },
  {
    name: 'Services',
    type: 'EXPENSE',
    color: '#F3F4F6',
    icon: '🔧',
    defaultGroup: 'Needs',
    description: 'General services and maintenance'
  },
  {
    name: 'Health',
    type: 'EXPENSE',
    color: '#FCE7F3',
    icon: '🏥',
    defaultGroup: 'Needs',
    description: 'Medical expenses and health-related costs'
  },
  {
    name: 'Fun Money',
    type: 'EXPENSE',
    color: '#FED7AA',
    icon: '🎯',
    defaultGroup: 'Wants',
    description: 'Entertainment, shopping, and leisure activities'
  },
  {
    name: 'Other Expenses',
    type: 'EXPENSE',
    color: '#E5E7EB',
    icon: '📋',
    defaultGroup: 'Wants',
    description: 'Miscellaneous and other expense categories'
  },

  // Transfer Categories
  {
    name: 'System Transfer',
    type: 'TRANSFER',
    color: '#F3F4F6',
    icon: '🔄',
    defaultGroup: 'Internal Transfer',
    description: 'General account transfers'
  },
  {
    name: 'Credit Card Payment',
    type: 'TRANSFER',
    color: '#E5E7EB',
    icon: '💳',
    defaultGroup: 'Internal Transfer',
    description: 'Credit card payments'
  },
  {
    name: 'Roth IRA',
    type: 'TRANSFER',
    color: '#E5E7EB',
    icon: '🏦',
    defaultGroup: 'Investments',
    description: 'Loan and debt payments'
  }
];

/**
 * Default Accounts - Standard financial accounts for new users
 * These provide the foundation for financial tracking
 */
export const DEFAULT_ACCOUNTS: DefaultAccount[] = [
  {
    name: 'Main Checking Account',
    type: 'CHECKING',
    subtype: 'CHECKING',
    currency: 'USD',
    description: 'Primary checking account for daily transactions',
    suggestedInitialBalance: 0
  },
  {
    name: 'Savings Account',
    type: 'SAVINGS',
    subtype: 'SAVINGS',
    currency: 'USD',
    description: 'Savings account for emergency funds and goals',
    suggestedInitialBalance: 0
  },
  {
    name: 'Credit Card',
    type: 'CREDIT_CARD',
    subtype: 'CREDIT_CARD',
    currency: 'USD',
    description: 'Primary credit card for purchases',
    suggestedInitialBalance: 0
  }
];
