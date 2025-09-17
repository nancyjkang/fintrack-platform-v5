# Spending Goals & Category Limits PRD
## FinTrack v4 - Privacy-First Personal Finance App

**Version:** 1.0
**Date:** January 2025
**Author:** FinTrack Development Team
**Status:** Draft

---

## Executive Summary

This PRD outlines the development of a Spending Goals & Category Limits system for FinTrack v4. The feature enables users to set intentional spending limits for specific categories, with the spend trend chart serving as the primary entry point for goal creation. This system transforms FinTrack from a passive expense tracker into an active spending control tool that helps users develop better financial habits through intentional spending behavior.

## Problem Statement

### Current Pain Points
- **Unintentional spending** - Users spend without awareness of category limits
- **Lifestyle inflation** - Spending increases without conscious control
- **Poor financial habits** - No system to develop better spending patterns
- **Lack of spending discipline** - No framework for intentional spending behavior
- **Category overspending** - Users exceed reasonable limits in specific categories

### User Impact
- **Financial drift** - Users spend without purpose or direction
- **Budget blowouts** - Overspending in categories like dining, entertainment, shopping
- **Lack of awareness** - No visibility into spending patterns and trends
- **Missing financial discipline** - No system to control spending impulses
- **Poor financial habits** - No framework to develop better spending patterns

## Solution Overview

### Core Concept
The Spending Goals & Category Limits system provides users with a comprehensive framework to set, track, and maintain intentional spending limits for specific categories. The system integrates with the existing spend trend chart to provide a natural entry point for goal creation based on historical spending patterns.

### Key Features
- **Trend-Based Goal Setting**: Create goals directly from spend trend chart insights
- **Category-Specific Limits**: Set spending limits for individual categories
- **Real-Time Progress Tracking**: Live updates on spending against limits
- **Smart Alerts**: Notifications when approaching or exceeding limits
- **Progress Visualization**: Visual progress bars and trend analysis
- **Flexible Goal Types**: Amount-based and percentage-based limits
- **Time-Bound Goals**: Monthly, quarterly, or annual spending limits

### Target Users
- **Primary**: Users seeking to control spending in specific categories
- **Secondary**: Users wanting to develop better financial habits
- **Tertiary**: Users with budget-conscious financial goals

## Functional Requirements

### FR1: Multi-Dimensional Goal Creation from Spend Chart
**Description**: Seamless integration with spend trend chart for multi-dimensional goal creation

**Acceptance Criteria**:
- Users can toggle legend items to select specific categories for goal creation
- Users can apply filters (recurring, account, date range, etc.) to refine goal scope
- "Create Goal" button is disabled when no categories are selected
- Button becomes enabled when at least one category is selected
- Goal creation flow is initiated from the chart interface
- Chart remains purely for spending visualization (no goal indicators)
- Goals respect all active filters and selected dimensions

**User Stories**:
- As a user, I want to toggle legend items to select categories for my spending goal
- As a user, I want to apply filters to create goals for specific transaction types (e.g., recurring only)
- As a user, I want to create goals for specific accounts or date ranges
- As a user, I want to see a "Create Goal" button when I have categories selected
- As a user, I want to create goals that respect all my current filters and selections

### FR2: Goal Creation Modal
**Description**: Comprehensive goal creation interface with smart suggestions

**Acceptance Criteria**:
- **Selected Dimensions Display**: Shows which categories, accounts, and filters are included in the goal
- **Active Filters Summary**: Clear indication of all applied filters (recurring, account, date range, etc.)
- **Auto-populated Goal Name**: Generated from selected categories and filters but editable
- **Timeframe Dropdown**: Monthly, Quarterly, Bi-annual, Annual (default: Quarterly)
- **Historical Context**: Shows total spending and monthly average for selected timeframe with current filters
- **Amount Input**: Pre-populated with 80% of historical spending (filtered), editable
- **Percentage Calculator**: Recalculates percentage when user changes amount
- **Goal Creation**: Creates goal with all dimensions and filters, redirects to tracking page

**User Stories**:
- As a user, I want to see which categories and filters I selected for my goal
- As a user, I want an auto-generated goal name that reflects my selections
- As a user, I want to see my historical spending based on my current filters
- As a user, I want a suggested amount based on my filtered past spending

**Goal Naming Suggestions**:
- **Single Category**: "Dining Goal", "Entertainment Goal"
- **Multiple Categories**: "Dining & Entertainment Goal", "Shopping & Dining Goal"
- **With Filters**: "Recurring Dining Goal", "Credit Card Shopping Goal"
- **Multiple Categories + Filters**: "Recurring Dining & Entertainment Goal"
- **Fallback**: "Multi-Category Spending Goal" (when too many categories or complex filters)

**Example Goal Creation**:
```typescript
// Example: Create a dining goal for recurring expenses only
const diningGoal: Omit<SpendingGoal, 'id' | 'createdAt' | 'updatedAt'> = {
  userId: 'default_user',
  name: 'Recurring Dining Goal',
  criteria: {
    categoryIds: [1], // Dining category ID
    recurring: true, // Only recurring transactions
    transactionType: 'EXPENSE'
  },
  targetAmount: 400.00,
  timeframe: 'monthly',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-01-31'),
  status: 'active',
  alertWarningThreshold: 80.00,
  alertCriticalThreshold: 90.00
};

// Example: Create a multi-category goal for specific accounts
const shoppingGoal: Omit<SpendingGoal, 'id' | 'createdAt' | 'updatedAt'> = {
  userId: 'default_user',
  name: 'Credit Card Shopping Goal',
  criteria: {
    categoryIds: [2, 3], // Shopping and Entertainment categories
    accountIds: [1], // Credit card account
    transactionType: 'EXPENSE'
  },
  targetAmount: 600.00,
  timeframe: 'quarterly',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-03-31'),
  status: 'active',
  alertWarningThreshold: 80.00,
  alertCriticalThreshold: 90.00
};
```

### FR3: Spending Goals Tracking Page
**Description**: Dedicated page for tracking spending goal progress

**Acceptance Criteria**:
- **Route**: `/goals/spending` for spending goals management
- **Goal List**: Display all active spending goals
- **Progress Visualization**: Progress bars and trend lines for each goal
- **Current Spending**: Real-time updates on category spending
- **Remaining Budget**: Clear indication of remaining spending allowance
- **Progress Percentages**: Percentage of limit used
- **Trend Analysis**: Historical spending vs. goal progress
- **Goal Management**: Edit, pause, or delete goals

**User Stories**:
- As a user, I want to see all my spending goals in one place
- As a user, I want to see progress bars showing my spending against limits
- As a user, I want to know how much I have remaining in my budgets
- As a user, I want to see trends showing if I'm on track to meet my goals

### FR4: Smart Alerts and Notifications
**Description**: Intelligent notifications for spending limit events

**Acceptance Criteria**:
- **Approaching limit alerts**: Notifications at 80% and 90% of limit
- **Limit exceeded alerts**: Immediate notification when limit is exceeded
- **Weekly progress updates**: Regular updates on spending progress
- **Goal achievement alerts**: Notifications when staying within limits
- **Customizable thresholds**: User control over alert percentages
- **Alert frequency control**: User control over notification frequency

**User Stories**:
- As a user, I want to be warned when I'm close to my spending limit
- As a user, I want to be notified immediately when I exceed my limit
- As a user, I want to celebrate when I stay within my budget

### FR5: Historical Context Calculation
**Description**: Smart calculation of historical spending for goal suggestions with filter awareness

**Acceptance Criteria**:
- **Timeframe-based Lookback**: Calculate spending for last complete timeframe (e.g., last complete 3 months for quarterly)
- **Filter-aware Calculation**: Apply all active filters (recurring, account, date range, etc.) to historical data
- **Total Amount Display**: Show total spending across ALL selected categories combined with current filters
- **Monthly Average**: Calculate and display monthly average spending (filtered, across all categories)
- **Percentage Calculation**: Calculate percentage reduction when user changes amount
- **Real-time Updates**: Recalculate percentages as user modifies goal amount
- **Filter Context**: Display which filters are being applied to historical calculations
- **Insufficient Data Handling**: Allow goal creation even without historical data (no suggestions in that case)

**User Stories**:
- As a user, I want to see my total spending for the selected timeframe with my current filters
- As a user, I want to see my monthly average spending for context (filtered)
- As a user, I want to see the percentage reduction as I adjust my goal amount
- As a user, I want to understand which filters are affecting my historical spending calculation

## Technical Requirements

### TR1: Data Architecture
**Description**: Robust data structure for spending goal management with dedicated database tables

**Requirements**:
- **Goal storage**: New `spending_goals` table for persistent goal storage
- **Progress tracking**: New `spending_goal_progress` table for daily progress tracking
- **Category integration**: Seamless integration with existing category system
- **User preferences**: Customizable goal settings and alerts
- **Data integrity**: Consistent goal data across sessions
- **Daily progress**: Track progress on a daily basis for accurate monitoring
- **Alert thresholds**: Store and monitor alert thresholds for notifications

**Database Schema**:
```sql
-- Spending Goals Table
CREATE TABLE spending_goals (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL DEFAULT 'default_user', -- Single-user app with default user
  name VARCHAR(255) NOT NULL,
  criteria JSON NOT NULL, -- Criteria that define what transactions this goal applies to
  goal_type ENUM('maximum', 'minimum') NOT NULL DEFAULT 'maximum', -- 'maximum' for spending limits, 'minimum' for giving/charity goals
  target_amount DECIMAL(10,2) NOT NULL,
  timeframe ENUM('monthly', 'quarterly', 'bi-annual', 'annual') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('active', 'paused', 'cancelled') DEFAULT 'active',
  alert_warning_threshold DECIMAL(5,2) DEFAULT 80.00, -- 80%
  alert_critical_threshold DECIMAL(5,2) DEFAULT 90.00, -- 90%
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_status (user_id, status),
  INDEX idx_timeframe (timeframe),
  INDEX idx_goal_type (goal_type)
);

-- Daily Progress Tracking Table
CREATE TABLE spending_goal_progress (
  id VARCHAR(36) PRIMARY KEY,
  goal_id VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  spent_amount DECIMAL(10,2) DEFAULT 0.00,
  target_amount DECIMAL(10,2) NOT NULL,
  percentage DECIMAL(5,2) DEFAULT 0.00,
  remaining_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (goal_id) REFERENCES spending_goals(id) ON DELETE CASCADE,
  UNIQUE KEY unique_goal_date (goal_id, date),
  INDEX idx_goal_date (goal_id, date)
);
```

**TypeScript Interfaces**:
```typescript
// Core spending goal types
export type SpendingGoalTimeframe = 'monthly' | 'quarterly' | 'bi-annual' | 'annual';
export type SpendingGoalStatus = 'active' | 'paused' | 'cancelled';
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type SpendingGoalType = 'maximum' | 'minimum';

/**
 * Criteria that define what transactions the spending goal applies to
 * Supports multi-dimensional goaling (category, account, recurring, etc.)
 */
export interface SpendingGoalCriteria {
  categoryIds?: number[]; // Optional: Array of category IDs - most important criteria
  accountIds?: number[]; // Optional: Array of account IDs - most important criteria
  recurring?: boolean; // Only recurring transactions
  transactionType: TransactionType; // Required: Single transaction type (INCOME, EXPENSE, TRANSFER)
  // Add other criteria types as needed
}

/**
 * Core spending goal interface matching the database schema
 * Supports flexible goaling dimensions (category, account, recurring, etc.)
 */
export interface SpendingGoal {
  id: string;
  userId: string; // Default: 'default_user' for single-user app
  name: string;
  criteria: SpendingGoalCriteria; // Criteria that define what transactions this goal applies to
  goalType: SpendingGoalType; // 'maximum' for spending limits, 'minimum' for giving/charity goals
  targetAmount: number;
  timeframe: SpendingGoalTimeframe;
  startDate: Date;
  endDate: Date;
  status: SpendingGoalStatus;
  alertWarningThreshold: number; // Default: 80%
  alertCriticalThreshold: number; // Default: 90%
  createdAt: Date;
  updatedAt: Date;
}

export interface HistoricalContext {
  timeframe: string;
  totalSpending: number; // Total spending across all selected categories with filters
  monthlyAverage: number; // Monthly average spending (filtered)
  suggestedAmount: number; // 80% of total spending (filtered)
  percentageReduction: number; // Percentage reduction from historical spending
  appliedCriteria: {
    categories: string[]; // Category names for display
    accounts?: string[]; // Account names for display
    recurring?: boolean;
    dateRange?: string; // Human-readable date range
    transactionType?: string; // Transaction type name for display
    // Other active criteria
  };
}

export interface GoalCreationRequest {
  selectedCategories: number[]; // Category IDs selected from chart
  selectedAccounts?: number[]; // Account IDs if any selected
  appliedCriteria: SpendingGoalCriteria; // Current chart criteria
  chartContext: {
    breakdownPeriod: string; // Current chart breakdown period
    dateRange: {
      start: Date;
      end: Date;
    };
  };
}

export interface GoalCreationState {
  isOpen: boolean;
  selectedCategories: number[];
  selectedAccounts?: number[];
  appliedCriteria: SpendingGoalCriteria;
  goalName: string;
  timeframe: SpendingGoalTimeframe;
  targetAmount: number;
  historicalContext?: HistoricalContext;
  isLoading: boolean;
  error?: string;
}
```

### TR2: Progress Calculation Engine
**Description**: Real-time spending progress calculation and analysis with filter awareness

**Requirements**:
- **Filter-aware spending calculation**: Track spending against category limits with applied filters
- **Trend analysis**: Calculate spending trends over time within filtered scope
- **Alert triggers**: Determine when to send notifications based on filtered progress
- **Performance metrics**: Calculate goal success rates with filter context
- **Historical analysis**: Compare current spending to previous periods (filtered)
- **Filter application**: Apply goal filters to transaction queries and calculations

**Implementation**:
- Real-time spending updates with filter application
- Historical trend analysis within filtered scope
- Alert threshold monitoring for filtered transactions
- Performance metric calculation with filter context
- Filter-aware transaction querying and aggregation

### TR3: Chart Integration System
**Description**: Seamless integration with existing spend trend chart

**Requirements**:
- **Chart enhancement**: Add goal creation capabilities to existing chart
- **Visual indicators**: Show current spending vs. limits on chart
- **Interactive elements**: Clickable categories for goal creation
- **Data synchronization**: Keep chart data in sync with goals
- **Performance optimization**: Efficient chart rendering with goal data

**Implementation**:
- Enhance existing spend trend chart component
- Add goal creation modal integration
- Implement visual limit indicators
- Optimize chart performance with goal data

## User Experience Requirements

### UX1: Multi-Category Goal Creation Flow
**Description**: Intuitive goal creation from spend trend chart with legend toggling

**Requirements**:
- **Legend toggling**: Toggle legend items to select categories for goal creation
- **Create Goal button**: Always visible when at least one category is selected
- **Modal-based creation**: Goal creation happens in a modal overlay
- **Smart suggestions**: Pre-populate goal values based on historical data
- **Seamless integration**: Natural flow from chart to goal creation

**User Experience**:
- Toggle legend items to select desired categories
- "Create Goal" button becomes enabled when categories are selected
- Click "Create Goal" button to open modal
- Modal opens with pre-populated suggestions (if historical data available)
- Review and customize goal details
- Confirm goal creation and navigate to `/goals/spending` page

### UX2: Goal Creation Modal
**Description**: Comprehensive goal creation interface with smart suggestions and filter awareness

**Requirements**:
- **Selected Dimensions Display**: Clear indication of which categories, accounts, and filters are included
- **Active Filters Summary**: Visual summary of all applied filters (recurring, account, date range, etc.)
- **Auto-populated Goal Name**: Generated from categories and filters but editable
- **Timeframe Selection**: Dropdown with Monthly, Quarterly, Bi-annual, Annual options
- **Historical Context**: Display total spending and monthly average for timeframe with current filters
- **Amount Input**: Pre-populated with 80% suggestion (filtered), editable with real-time percentage calculation
- **Filter Context Display**: Show which filters are affecting historical calculations
- **Modal Design**: Clean, focused interface for goal creation

**User Experience**:
- Modal opens with selected categories and active filters clearly displayed
- Goal name auto-generated from selections but editable
- Historical context provides filtered spending insights
- Amount field pre-populated with smart suggestion based on filtered data
- Real-time percentage calculation as user adjusts amount
- Clear indication of which filters are being applied to calculations

### UX3: Spending Goals Tracking Page
**Description**: Dedicated page for spending goal management and tracking

**Requirements**:
- **Route**: `/goals/spending` for dedicated spending goals page
- **Goal List**: Display all active spending goals with progress
- **Progress Visualization**: Progress bars and trend lines for each goal
- **Goal Management**: Edit, pause, delete goals from tracking page
- **Trend Analysis**: Historical spending vs. goal progress visualization
- **Mobile-responsive**: Works well on all device sizes

**User Experience**:
- Dedicated page for all spending goals
- Clear progress visualization for each goal
- Easy goal management actions
- Historical trend analysis
- Mobile-friendly interface

## Success Metrics

### Primary Metrics
- **Goal Creation Rate**: Number of spending goals created per user
- **Goal Adherence Rate**: Percentage of time users stay within limits
- **User Engagement**: Time spent on spending goal features
- **Spending Reduction**: Decrease in overspending incidents

### Secondary Metrics
- **Category Control**: Reduction in spending in targeted categories
- **User Retention**: Increased app usage due to goal features
- **Goal Modification Rate**: Frequency of goal adjustments
- **Alert Effectiveness**: User response to spending alerts

### Success Targets
- **Goal Creation**: 70% of users create at least one spending goal
- **Goal Adherence**: 80% of users stay within limits 70% of the time
- **Engagement**: 20% increase in app usage time
- **Spending Control**: 25% reduction in overspending incidents

## Practical Examples

### Maximum Spending Goals (Spending Limits)
**Example 1: Monthly Grocery Budget**
- **Goal Type**: `maximum`
- **Target**: $800/month
- **Categories**: Groceries, Dining Out
- **Purpose**: Limit food spending to stay within budget
- **Alerts**: Warning at $640 (80%), Critical at $720 (90%)

**Example 2: Quarterly Entertainment Budget**
- **Goal Type**: `maximum`
- **Target**: $1,200/quarter
- **Categories**: Entertainment, Movies, Concerts
- **Purpose**: Control discretionary entertainment spending
- **Alerts**: Warning at $960 (80%), Critical at $1,080 (90%)

### Minimum Spending Goals (Giving/Charity)
**Example 3: Monthly Charitable Giving**
- **Goal Type**: `minimum`
- **Target**: $200/month
- **Categories**: Charitable Giving, Donations
- **Purpose**: Ensure consistent charitable giving
- **Alerts**: Warning at $160 (80%), Critical at $180 (90%)

**Example 4: Annual Tithing Goal**
- **Goal Type**: `minimum`
- **Target**: $6,000/year (10% of income)
- **Categories**: Church, Religious Giving
- **Purpose**: Maintain religious tithing commitment
- **Alerts**: Warning at $4,800 (80%), Critical at $5,400 (90%)

### Goal Type Behavior Differences
- **Maximum Goals**: Alerts when approaching/exceeding limits (spending too much)
- **Minimum Goals**: Alerts when falling behind target (not giving enough)
- **Progress Tracking**: Maximum goals show "remaining budget", minimum goals show "amount to reach target"
- **Success Metrics**: Maximum goals succeed when under target, minimum goals succeed when over target

## Implementation Plan

### Phase 1: Core Spending Goals System (3 weeks)
- **Week 1**: Spending goal data model and basic CRUD operations
- **Week 2**: Progress tracking and calculation engine
- **Week 3**: Basic goal management interface

### Phase 2: Chart Integration (2 weeks)
- **Week 4**: Enhance spend trend chart with goal creation
- **Week 5**: Visual indicators for spending vs. limits

### Phase 3: Alerts and Notifications (2 weeks)
- **Week 6**: Smart alert system implementation
- **Week 7**: Notification preferences and customization

### Phase 4: Advanced Features (1 week)
- **Week 8**: Progress visualization and dashboard enhancements

## Risk Assessment

### Technical Risks
- **Chart performance**: Adding goal data to existing chart may impact performance
- **Data synchronization**: Keeping goals in sync with spending data
- **Alert timing**: Ensuring alerts are sent at appropriate times

### Mitigation Strategies
- **Optimized rendering**: Efficient chart updates with goal data
- **Real-time sync**: Immediate goal data synchronization
- **Smart alert timing**: Intelligent alert scheduling

### User Experience Risks
- **Goal complexity**: Users may find goal creation overwhelming
- **Alert fatigue**: Too many alerts may annoy users
- **Chart clutter**: Adding goal indicators may make chart confusing

### Mitigation Strategies
- **Simplified UI**: Intuitive goal creation process
- **Customizable alerts**: User control over alert frequency
- **Clean visualization**: Clear, uncluttered chart design

## Privacy & Security

### Data Privacy
- **Local storage**: All goal data stored locally in browser
- **No external sharing**: Goals never sent to external servers
- **User control**: Complete control over goal data
- **Data encryption**: Encrypted goal data storage

### Security Measures
- **Input validation**: Comprehensive goal data validation
- **Data integrity**: Consistent goal data across sessions
- **Access control**: User-only access to goal data
- **Audit logging**: Goal creation and modification tracking

## Future Enhancements

### Advanced Goal Features
- **Goal templates**: Pre-defined goal types for common categories
- **Goal sharing**: Share goals with family members
- **Goal competitions**: Friendly goal competitions with friends
- **Goal dependencies**: Goals that depend on other goals

### AI-Powered Features
- **Smart goal suggestions**: AI-powered goal recommendations based on spending patterns
- **Predictive alerts**: AI-powered spending predictions
- **Goal optimization**: AI-powered goal adjustment suggestions
- **Personalized insights**: AI-powered spending behavior insights

### Integration Features
- **Calendar integration**: Goal deadlines in calendar apps
- **Bank integration**: Automatic progress tracking from bank data
- **Budget integration**: Integration with overall budget planning
- **Expense tracking**: Enhanced expense tracking with goal context

## Conclusion

The Spending Goals & Category Limits system represents a significant evolution of FinTrack v4, transforming it from a passive expense tracker into an active spending control tool. By providing users with the ability to set, track, and maintain intentional spending limits for specific categories, this system addresses the core need for intentional spending behavior and financial discipline.

The integration with the spend trend chart provides a natural entry point for goal creation, making it easy for users to identify spending patterns and set appropriate limits. The real-time progress tracking and smart alerts ensure users stay motivated and on track with their spending goals.

This system positions FinTrack v4 as a comprehensive spending control platform that helps users develop better financial habits through intentional, goal-oriented spending behavior.
