import { Plus } from 'lucide-react'

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {description}
      </p>
      <button
        onClick={onAction}
        className="btn btn-primary flex items-center gap-2 mx-auto"
      >
        <Plus className="h-4 w-4" />
        {actionLabel}
      </button>
    </div>
  )
}
