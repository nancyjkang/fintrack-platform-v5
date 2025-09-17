'use client';

import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { createUTCDate, formatDateForDisplay } from '@/lib/utils/date-utils';
import type { BalanceHistoryData } from '@/types/balance-history';

interface AccountBalanceChartProps {
  data: BalanceHistoryData[];
  accountName?: string;
  height?: number;
}

export function AccountBalanceChart({ 
  data, 
  accountName, 
  height = 400 
}: AccountBalanceChartProps) {
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatXAxisLabel = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = createUTCDate(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatYAxisLabel = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return formatCurrency(value);
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
    if (active && payload && payload.length && label) {
      const [year, month, day] = label.split('-').map(Number);
      const date = createUTCDate(year, month - 1, day);
      const formattedDate = formatDateForDisplay(date);

      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{formattedDate}</p>
          {payload.map((entry, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-medium" style={{ color: entry.color }}>
                {entry.name === 'Daily Change' && entry.value >= 0 ? '+' : ''}
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Sort data chronologically for proper chart display
  const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));

  if (sortedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No Data Available</div>
          <div className="text-sm">Select an account and date range to view the balance chart</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={sortedData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxisLabel}
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            tickFormatter={formatYAxisLabel}
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={{ stroke: '#e5e7eb' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />

          {/* Bar chart for daily net changes */}
          <Bar
            dataKey="netAmount"
            name="Daily Change"
            fill="#3b82f6"
            opacity={0.7}
            radius={[2, 2, 0, 0]}
          />

          {/* Line chart for balance trend */}
          <Line
            type="monotone"
            dataKey="balance"
            name="Account Balance"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#ffffff' }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Chart Footer with Account Info */}
      {accountName && (
        <div className="mt-4 text-center text-sm text-gray-600">
          Balance history for <span className="font-medium">{accountName}</span>
          {sortedData.length > 0 && (
            <span className="ml-2">
              • {sortedData.length} {sortedData.length === 1 ? 'day' : 'days'} shown
            </span>
          )}
        </div>
      )}
    </div>
  );
}