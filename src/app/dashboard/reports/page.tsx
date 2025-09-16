'use client'

import { FileText, BarChart3 } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'

export default function ReportsPage() {
  const handleGenerateReport = () => {
    console.log('Generate report clicked')
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
          <p className="text-gray-600">Analyze your financial data and trends</p>
        </div>
      </div>

      {/* Empty State */}
      <EmptyState
        icon={BarChart3}
        title="No reports available"
        description="Generate detailed financial reports and insights once you have accounts and transactions."
        action={{
          label: "Generate Your First Report",
          onClick: handleGenerateReport
        }}
      />
    </div>
  )
}
