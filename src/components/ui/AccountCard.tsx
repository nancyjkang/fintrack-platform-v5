import { Building, TrendingUp, TrendingDown, MoreHorizontal } from 'lucide-react'

interface AccountCardProps {
  account: {
    id: string
    name: string
    type: string
    subtype: string
    current_balance: number | string
    currency: string
    account_number_last4?: string
    institution_name?: string
    color: string
    icon: string
  }
  onEdit?: (accountId: string) => void
  onDelete?: (accountId: string) => void
}

export default function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
  const formatCurrency = (amount: number | string, currency: string = 'USD') => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(numAmount)
  }

  // Helper function to convert balance to number
  const toNumber = (balance: number | string): number => {
    if (typeof balance === 'number') return balance
    if (typeof balance === 'string') return parseFloat(balance) || 0
    return 0
  }

  const getAccountTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'checking':
      case 'savings':
      case 'investment':
      case 'credit':
        return Building
      default:
        return Building
    }
  }

  const isPositive = toNumber(account.current_balance) >= 0
  const IconComponent = getAccountTypeIcon(account.type)

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="card-body">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: account.color + '20' }}
            >
              <IconComponent
                className="h-5 w-5"
                style={{ color: account.color }}
              />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{account.name}</h3>
              <p className="text-sm text-gray-500 capitalize">
                {account.type}
                {account.subtype && account.subtype !== account.type && (
                  <span> • {account.subtype}</span>
                )}
              </p>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Balance */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Current Balance</p>
            <p className={`text-xl font-semibold ${
              isPositive ? 'text-gray-900' : 'text-red-600'
            }`}>
              {formatCurrency(account.current_balance, account.currency)}
            </p>
          </div>

          {/* Balance Indicator */}
          <div className="flex items-center">
            {isPositive ? (
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">Positive</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600">
                <TrendingDown className="h-4 w-4" />
                <span className="text-xs font-medium">Negative</span>
              </div>
            )}
          </div>
        </div>

        {/* Institution Info */}
        {(account.institution_name || account.account_number_last4) && (
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                {account.institution_name && (
                  <p className="text-xs text-gray-500 font-medium">
                    {account.institution_name}
                  </p>
                )}
                {account.account_number_last4 && (
                  <p className="text-xs text-gray-400">
                    ••••{account.account_number_last4}
                  </p>
                )}
              </div>

              {/* Account Type Badge */}
              <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                account.type === 'checking' ? 'bg-blue-100 text-blue-800' :
                account.type === 'savings' ? 'bg-green-100 text-green-800' :
                account.type === 'credit' ? 'bg-red-100 text-red-800' :
                account.type === 'investment' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {account.type}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
