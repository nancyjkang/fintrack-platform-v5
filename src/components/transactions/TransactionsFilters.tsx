'use client';

import React, { useState, useEffect } from 'react';
import { Search, Calendar, Building, FileText, Tag, RotateCcw } from 'lucide-react';
import { api } from '@/lib/client/api';
import { toUTCDateString, getCurrentUTCDate, createUTCDate, addDays, subtractDays } from '@/lib/utils/date-utils';


interface Filters {
  description: string;
  dateRange: string;
  fromDate: string;
  toDate: string;
  account: string;
  type: string;
  category: string;
  recurring: string;
}

interface Account {
  id: number;
  name: string;
  type: string;
  balance: number;
  color: string;
  is_active: boolean;
}

interface Category {
  id: number;
  name: string;
  type: string;
  color: string;
}

interface PaginatedAccountsResponse {
  items: Account[];
}

interface PaginatedCategoriesResponse {
  categories: Array<{
    id: number;
    name: string;
    type: string;
    color: string;
    tenant_id: string;
    created_at: string;
    updated_at: string;
  }>;
  count: number;
}

interface TransactionsFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
}

const DATE_RANGE_OPTIONS = [
  { value: '', label: 'All time' },
  { value: 'this-week', label: 'This week' },
  { value: 'last-week', label: 'Last week' },
  { value: 'this-month', label: 'This month' },
  { value: 'last-month', label: 'Last month' },
  { value: 'this-quarter', label: 'This quarter' },
  { value: 'last-quarter', label: 'Last quarter' },
  { value: 'this-half', label: 'This half' },
  { value: 'last-half', label: 'Last half' }
];

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'INCOME', label: 'Income' },
  { value: 'EXPENSE', label: 'Expense' },
  { value: 'TRANSFER', label: 'Transfer' }
];

const RECURRING_OPTIONS = [
  { value: '', label: 'Recurring vs not' },
  { value: 'true', label: 'Recurring only' },
  { value: 'false', label: 'One-time only' }
];

export default function TransactionsFilters({ filters, onFilterChange }: TransactionsFiltersProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch accounts and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accountsResponse, categoriesResponse] = await Promise.all([
          api.getAccounts(),
          api.getCategories()
        ]);

        if (accountsResponse.success && accountsResponse.data) {
          // Handle both array and paginated response formats
          const accountsData = Array.isArray(accountsResponse.data)
            ? accountsResponse.data
            : (accountsResponse.data as PaginatedAccountsResponse).items || accountsResponse.data;
          setAccounts(accountsData);
        }

        if (categoriesResponse.success && categoriesResponse.data) {
          // Handle both array and paginated response formats
          const categoriesData = Array.isArray(categoriesResponse.data)
            ? categoriesResponse.data
            : (categoriesResponse.data as PaginatedCategoriesResponse).categories || [];

          // Convert to our Category interface format
          const formattedCategories: Category[] = categoriesData.map((cat) => ({
            id: cat.id,
            name: cat.name,
            type: cat.type,
            color: cat.color
          }));

          setCategories(formattedCategories);
        }
      } catch (err) {
        console.error('Error fetching filter data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (field: keyof Filters, value: string) => {
    const updates: Partial<Filters> = { [field]: value };

    // Clear category when type changes (since categories are type-specific)
    if (field === 'type') {
      updates.category = '';
    }

    // Auto-populate start and end dates when date range is selected
    if (field === 'dateRange') {
      const today = getCurrentUTCDate();
      let fromDate = '';
      let toDate = '';

      if (value === '') {
        // All time - clear dates
        updates.fromDate = '';
        updates.toDate = '';
      } else {
        switch (value) {
          case 'this-week': {
            // Get start of week (Sunday)
            const startOfWeek = subtractDays(today, today.getDay());
            const endOfWeek = addDays(startOfWeek, 6);
            fromDate = toUTCDateString(startOfWeek);
            toDate = toUTCDateString(endOfWeek);
            break;
          }
          case 'last-week': {
            // Get start of last week (Sunday)
            const lastWeekStart = subtractDays(today, today.getDay() + 7);
            const lastWeekEnd = addDays(lastWeekStart, 6);
            fromDate = toUTCDateString(lastWeekStart);
            toDate = toUTCDateString(lastWeekEnd);
            break;
          }
          case 'this-month': {
            const startOfMonth = createUTCDate(today.getFullYear(), today.getMonth(), 1);
            const endOfMonth = createUTCDate(today.getFullYear(), today.getMonth() + 1, 0);
            fromDate = toUTCDateString(startOfMonth);
            toDate = toUTCDateString(endOfMonth);
            break;
          }
          case 'last-month': {
            const lastMonthStart = createUTCDate(today.getFullYear(), today.getMonth() - 1, 1);
            const lastMonthEnd = createUTCDate(today.getFullYear(), today.getMonth(), 0);
            fromDate = toUTCDateString(lastMonthStart);
            toDate = toUTCDateString(lastMonthEnd);
            break;
          }
          case 'this-quarter': {
            const quarterStart = createUTCDate(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
            const quarterEnd = createUTCDate(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 + 3, 0);
            fromDate = toUTCDateString(quarterStart);
            toDate = toUTCDateString(quarterEnd);
            break;
          }
          case 'last-quarter': {
            const currentQuarter = Math.floor(today.getMonth() / 3);
            let lastQuarterStart, lastQuarterEnd;

            if (currentQuarter === 0) {
              // Current quarter is Q1, so last quarter is Q4 of previous year
              lastQuarterStart = createUTCDate(today.getFullYear() - 1, 9, 1); // October 1st
              lastQuarterEnd = createUTCDate(today.getFullYear() - 1, 11, 31); // December 31st
            } else {
              // Last quarter is in the same year
              const lastQuarterStartMonth = (currentQuarter - 1) * 3;
              lastQuarterStart = createUTCDate(today.getFullYear(), lastQuarterStartMonth, 1);
              lastQuarterEnd = createUTCDate(today.getFullYear(), lastQuarterStartMonth + 3, 0);
            }

            fromDate = toUTCDateString(lastQuarterStart);
            toDate = toUTCDateString(lastQuarterEnd);
            break;
          }
          case 'this-half': {
            const halfStart = createUTCDate(today.getFullYear(), today.getMonth() < 6 ? 0 : 6, 1);
            const halfEnd = createUTCDate(today.getFullYear(), today.getMonth() < 6 ? 6 : 12, 0);
            fromDate = toUTCDateString(halfStart);
            toDate = toUTCDateString(halfEnd);
            break;
          }
          case 'last-half': {
            const currentHalf = today.getMonth() < 6 ? 1 : 2; // 1 = first half, 2 = second half
            let lastHalfStart, lastHalfEnd;

            if (currentHalf === 1) {
              // Current is first half, so last half is second half of previous year
              lastHalfStart = createUTCDate(today.getFullYear() - 1, 6, 1); // July 1st
              lastHalfEnd = createUTCDate(today.getFullYear() - 1, 12, 0); // December 31st
            } else {
              // Current is second half, so last half is first half of current year
              lastHalfStart = createUTCDate(today.getFullYear(), 0, 1); // January 1st
              lastHalfEnd = createUTCDate(today.getFullYear(), 6, 0); // June 30th
            }

            fromDate = toUTCDateString(lastHalfStart);
            toDate = toUTCDateString(lastHalfEnd);
            break;
          }
        }

        if (fromDate && toDate) {
          updates.fromDate = fromDate;
          updates.toDate = toDate;
        }
      }
    }

    onFilterChange(updates);
  };

  // Filter categories based on selected type
  const filteredCategories = categories.filter(category => {
    if (!filters.type) return true; // Show all categories if no type selected
    return category.type === filters.type;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      {/* Row 1: Search, Date Range, Start Date, End Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Description Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={filters.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Date Range */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <select
            value={filters.dateRange}
            onChange={(e) => handleInputChange('dateRange', e.target.value)}
            className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white ${!filters.dateRange ? 'text-gray-500' : 'text-gray-900'}`}
          >
            {DATE_RANGE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="date"
            placeholder="Start date"
            value={filters.fromDate}
            onChange={(e) => handleInputChange('fromDate', e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* End Date */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="date"
            placeholder="End date"
            value={filters.toDate}
            onChange={(e) => handleInputChange('toDate', e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Row 2: Account, Type, Category, Recurring */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Account Filter */}
        <div className="relative">
          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <select
            value={filters.account}
            onChange={(e) => handleInputChange('account', e.target.value)}
            className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white ${!filters.account ? 'text-gray-500' : 'text-gray-900'}`}
            disabled={loading}
          >
            <option value="">All accounts</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id.toString()}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <select
            value={filters.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white ${!filters.type ? 'text-gray-500' : 'text-gray-900'}`}
          >
            {TYPE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="relative">
          <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <select
            value={filters.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white ${!filters.category ? 'text-gray-500' : 'text-gray-900'}`}
            disabled={loading}
          >
            <option value="">
              {filters.type ? `All ${filters.type.toLowerCase()} categories` : 'All categories'}
            </option>
            <option value="uncategorized">Uncategorized</option>
            {filteredCategories.map(category => (
              <option key={category.id} value={category.id.toString()}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Recurring Filter */}
        <div className="relative">
          <RotateCcw className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <select
            value={filters.recurring}
            onChange={(e) => handleInputChange('recurring', e.target.value)}
            className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white ${!filters.recurring ? 'text-gray-500' : 'text-gray-900'}`}
          >
            {RECURRING_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
