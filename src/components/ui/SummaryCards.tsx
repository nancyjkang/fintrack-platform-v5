import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

interface Account {
  current_balance: number | string
  currency: string
}

interface SummaryCardsProps {
  accounts: Account[]
}

export default function SummaryCards({ accounts }: SummaryCardsProps) {
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  // Helper function to convert balance to number
  const toNumber = (balance: number | string): number => {
    if (typeof balance === 'number') return balance
    if (typeof balance === 'string') return parseFloat(balance) || 0
    return 0
  }

  // Calculate totals
  const totalAssets = accounts
    .filter(a => toNumber(a.current_balance) > 0)
    .reduce((sum, a) => sum + toNumber(a.current_balance), 0)

  const totalLiabilities = Math.abs(accounts
    .filter(a => toNumber(a.current_balance) < 0)
    .reduce((sum, a) => sum + toNumber(a.current_balance), 0))

  const netWorth = accounts.reduce((sum, a) => sum + toNumber(a.current_balance), 0)

  const summaryData = [
    {
      title: 'Total Assets',
      value: totalAssets,
      icon: TrendingUp,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      textColor: 'text-green-600'
    },
    {
      title: 'Total Liabilities',
      value: totalLiabilities,
      icon: TrendingDown,
      color: 'red',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      textColor: 'text-red-600'
    },
    {
      title: 'Net Worth',
      value: netWorth,
      icon: DollarSign,
      color: netWorth >= 0 ? 'blue' : 'red',
      bgColor: netWorth >= 0 ? 'bg-blue-50' : 'bg-red-50',
      iconColor: netWorth >= 0 ? 'text-blue-600' : 'text-red-600',
      textColor: netWorth >= 0 ? 'text-blue-600' : 'text-red-600'
    }
  ]

  if (accounts.length === 0) {
    return null
  }

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-8">
      {summaryData.map((item) => {
        const Icon = item.icon
        return (
          <div key={item.title} className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {item.title}
                  </p>
                  <p className={`text-2xl font-semibold ${item.textColor}`}>
                    {formatCurrency(item.value)}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${item.bgColor} flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${item.iconColor}`} />
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
